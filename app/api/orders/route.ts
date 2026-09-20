import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers'; 
import { getDb, getAdminAuth } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { Order, OrderItem, ShippingAddress, PaymentDetails, InstallmentDetails } from '@/app/lib/types';
import { sendPurchaseEvent } from '@/app/lib/meta-capi';

export const dynamic = 'force-dynamic';

// --- GET: جلب جميع الطلبات بتفاصيلها البنكية والتقسيط (للأدمن فقط) ---
export async function GET(req: NextRequest) {
    const firebaseAuth = getAdminAuth();
    const db = getDb();

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        const orders = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof firestore.Timestamp 
                    ? data.createdAt.toDate().toISOString() 
                    : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof firestore.Timestamp 
                    ? data.updatedAt.toDate().toISOString() 
                    : new Date(data.updatedAt || Date.now()).toISOString(),
            };
        });

        return NextResponse.json(orders);

    } catch (error: any) {
        console.error('[GET /api/orders] Error:', error);
        return NextResponse.json({ error: `Failed to fetch orders: ${error.message}` }, { status: 500 });
    }
}

// --- POST: إنشاء طلبية شراء جديدة لجميع المنتجات متوافقة مع الـ Installment API واﻟـ POS ---
export async function POST(req: NextRequest) {
    const db = getDb();

    try {
        const body = await req.json();
        const {
            userId, items, totalAmount, shippingAddress, shippingFee, payment, installment, notes, source
        }: {
            userId: string, items: OrderItem[], totalAmount: number, shippingAddress?: ShippingAddress, shippingFee: number,
            payment: Omit<PaymentDetails, 'amount' | 'currency'> & { method: string, status: string, transactionId?: string },
            installment?: InstallmentDetails, notes?: string, source?: string
        } = body;
        
        const orderSource = source || 'Web';

        let finalShippingAddress = shippingAddress;
        if (orderSource === 'POS') {
            finalShippingAddress = {
                recipientName: shippingAddress?.recipientName || 'عميل المحل (الكاشير)',
                streetAddress: shippingAddress?.streetAddress || 'شراء مباشر من الفرع',
                city: shippingAddress?.city || 'المحل',
                governorate: shippingAddress?.governorate || 'الفرع الرئيسي',
                postalCode: shippingAddress?.postalCode || undefined,
                phone: shippingAddress?.phone || '00000000000'
            };
        }

        if (!items || items.length === 0 || totalAmount === undefined || !finalShippingAddress || !finalShippingAddress.phone || !finalShippingAddress.recipientName) {
            return NextResponse.json({ error: 'Missing required order fields: items, totalAmount, or shipping details.' }, { status: 400 });
        }
        
        const newOrderRef = await db.runTransaction(async (transaction) => {
            const productRefs = items.map(item => db.collection('products').doc(item.productId));
            const productDocs = await transaction.getAll(...productRefs);

            for (let i = 0; i < items.length; i++) {
                const productDoc = productDocs[i];
                const requestedItem = items[i];

                if (!productDoc.exists) {
                    throw new Error(`المنتج "${requestedItem.name}" لم يعد موجودًا.`);
                }

                const productData = productDoc.data();
                const currentStock = productData?.stock;

                if (currentStock === undefined || currentStock < requestedItem.quantity) {
                    throw new Error(`الكمية المطلوبة للمنتج "${requestedItem.name}" غير متوفرة. الكمية المتاحة: ${currentStock || 0}`);
                }
            }

            const orderRef = db.collection('orders').doc();
            const serverTimestamp = firestore.FieldValue.serverTimestamp();
            
            const orderData = {
                userId: userId || 'guest',
                source: orderSource,
                items: items.map(item => ({
                    productId: item.productId, 
                    name: item.name, 
                    slug: item.slug,
                    price: item.price, 
                    quantity: item.quantity, 
                    imageUrl: item.imageUrl || undefined,
                })),
                totalAmount, 
                shippingAddress: {
                    recipientName: finalShippingAddress.recipientName,
                    streetAddress: finalShippingAddress.streetAddress,
                    city: finalShippingAddress.city,
                    governorate: finalShippingAddress.governorate,
                    postalCode: finalShippingAddress.postalCode || undefined,
                    phone: finalShippingAddress.phone
                },
                shippingFee: orderSource === 'POS' ? 0 : (shippingFee || 0),
                status: orderSource === 'POS' ? 'completed' : 'new',
                payment: {
                    method: payment?.method || (orderSource === 'POS' ? 'cash' : 'cash_on_delivery'),
                    transactionId: payment?.transactionId || undefined,
                    status: orderSource === 'POS' ? 'paid' : (payment?.status || 'pending'),
                    amount: totalAmount + (orderSource === 'POS' ? 0 : (shippingFee || 0)),
                    currency: 'EGP'
                },
                ...(payment?.method === 'installment' && installment ? {
                    installment: { 
                        provider: installment.provider, 
                        plan: installment.plan, 
                        monthlyPayment: installment.monthlyPayment, 
                        totalAmount: installment.totalAmount, 
                        numberOfMonths: installment.numberOfMonths 
                    }
                } : {}),
                notes: notes || undefined,
                createdAt: serverTimestamp,
                updatedAt: serverTimestamp,
            };
            transaction.set(orderRef, orderData);

            for (let i = 0; i < items.length; i++) {
                const productRef = productRefs[i];
                const requestedQuantity = items[i].quantity;
                transaction.update(productRef, { 
                    stock: firestore.FieldValue.increment(-requestedQuantity) 
                });
            }

            return orderRef;
        });

        if (orderSource === 'Web') {
            try {
                const headersList = await headers();
                const ipAddress = headersList.get('x-forwarded-for') || '127.0.0.1';
                const userAgent = headersList.get('user-agent') || '';

                sendPurchaseEvent({
                    value: totalAmount,
                    content_ids: items.map(item => item.slug).filter((slug): slug is string => !!slug),
                    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                });
            } catch (capiError) {
                console.error("Error triggering Meta CAPI purchase event:", capiError);
            }
        }

        return NextResponse.json({ 
            message: orderSource === 'POS' ? 'POS Order completed and stock updated' : 'Order created and stock updated', 
            orderId: newOrderRef.id 
        }, { status: 201 });

    } catch (error: any) {
        console.error('[POST /api/orders] Transaction Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order due to a stock or database issue.' }, { status: 500 });
    }
}