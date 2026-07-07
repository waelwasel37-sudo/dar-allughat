// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers'; 
// 🎯 استيراد الأدوات المحدثة وقاعدة البيانات السليمة
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
        const cookieStore = await cookies(); // 🎯 التوافق مع Next.js 15 الإجباري
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

// --- POST: إنشاء طلبية شراء جديدة لجميع المنتجات متوافقة مع الـ Installment API ---
export async function POST(req: NextRequest) {
    const db = getDb();

    try {
        const body = await req.json();

        // 🎯 تفكيك البيانات بناءً على الـ Order Schema الدقيق الذي أرسلته
        const {
            userId,
            items,
            totalAmount,
            shippingAddress,
            shippingFee,
            payment,        // تفاصيل الـ PaymentDetails (البنك أو الكاش)
            installment,    // تفاصيل الـ InstallmentDetails (شركة التقسيط)
            notes
        }: { 
            userId: string,
            items: OrderItem[], 
            totalAmount: number, 
            shippingAddress: ShippingAddress,
            shippingFee: number,
            payment: Omit<PaymentDetails, 'amount' | 'currency'> & { method: string, status: string, transactionId?: string },
            installment?: InstallmentDetails,
            notes?: string
        } = body;

        // التحقق الصارم من الحقول الأساسية المطلوبة هندسياً
        if (!items || items.length === 0 || totalAmount === undefined || !shippingAddress || !shippingAddress.phone || !shippingAddress.recipientName) {
            return NextResponse.json({ error: 'Missing required order fields: items, totalAmount, or shipping details.' }, { status: 400 });
        }

        const serverTimestamp = firestore.FieldValue.serverTimestamp();

        // 💳 بناء كائن الطلب المطابق تماماً للـ Schema المحترف والجاهز لبوابات التقسيط
        const orderData = {
            userId: userId || 'guest',
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                slug: item.slug,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl || null,
            })),
            totalAmount, 
            shippingAddress: {
                recipientName: shippingAddress.recipientName,
                streetAddress: shippingAddress.streetAddress,
                city: shippingAddress.city,
                governorate: shippingAddress.governorate,
                postalCode: shippingAddress.postalCode || null,
                phone: shippingAddress.phone
            },
            shippingFee: shippingFee || 0,
            status: 'new', // حالة الطلب الافتراضية
            
            // بيانات الدفع البنكي الرقمي أو الكاش الجاهزة
            payment: {
                method: payment?.method || 'cash_on_delivery',
                transactionId: payment?.transactionId || null,
                status: payment?.status || 'pending',
                amount: totalAmount + (shippingFee || 0),
                currency: 'EGP'
            },
            
            // حقن بيانات التقسيط الذكية إذا قوطعت المعاملة بنجاح مع الـ API للبنك
            ...(payment?.method === 'installment' && installment ? {
                installment: {
                    provider: installment.provider, // مثل valu أو souhoola
                    plan: installment.plan,
                    monthlyPayment: installment.monthlyPayment,
                    totalAmount: installment.totalAmount,
                    numberOfMonths: installment.numberOfMonths
                }
            } : {}),

            notes: notes || null,
            createdAt: serverTimestamp,
            updatedAt: serverTimestamp,
        };

        // حفظ الطلبية في قاعدة البيانات
        const newOrderRef = await db.collection('orders').add(orderData);

        // 🚀 إرسال حدث الشراء الفوري إلى فيسبوك لتتبع الحملات التسويقية (Meta CAPI)
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

        return NextResponse.json({ 
            message: 'Order created successfully', 
            orderId: newOrderRef.id 
        }, { status: 201 });

    } catch (error: any) {
        console.error('[POST /api/orders] Error:', error);
        return NextResponse.json({ error: `Failed to create order: ${error.message}` }, { status: 500 });
    }
}
