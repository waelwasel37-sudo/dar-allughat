import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers'; 

import admin, { getDb, getAuth } from '@/app/lib/firebase-admin';
import { Product } from '@/app/lib/types';
import { sendPurchaseEvent } from '@/app/lib/meta-capi';

export const dynamic = 'force-dynamic';

interface CartItem extends Product {
  quantity: number;
}

// GET all orders (for admin panel)
export async function GET(req: NextRequest) {
    const auth = getAuth();
    const db = getDb();

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value; // ممتاز ومطابق للبند 1
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        // تحسين النوع ليتوافق تماماً مع مستندات Firestore وعمليات الـ Map
        const orders = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // التعديل المستهدف (البند 4): الفحص الذكي والآمن للتواريخ لمنع الانهيار أثناء الـ Pending Timestamps
                createdAt: data.createdAt instanceof admin.firestore.Timestamp 
                    ? data.createdAt.toDate().toISOString() 
                    : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof admin.firestore.Timestamp 
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

// POST a new order (from customer cart)
export async function POST(req: NextRequest) {
    const db = getDb();

    try {
        const body = await req.json();

        const {
            items,
            total,
            customerName,
            customerPhone,
            customerAddress,
            paymentMethod
        }: { 
            items: CartItem[], 
            total: number, 
            customerName: string,
            customerPhone: string,
            customerAddress: string,
            paymentMethod?: string
        } = body;

        if (!items || items.length === 0 || total === undefined || !customerName || !customerPhone || !customerAddress) {
            return NextResponse.json({ error: 'All fields, including cart data and customer details, are required.' }, { status: 400 });
        }

        const orderData = {
            items: items.map(item => ({
                productId: item.id,
                slug: item.slug,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
            })),
            total, 
            customerName,
            customerPhone,
            customerAddress,
            paymentMethod: paymentMethod || 'cash',
            status: 'processing', 
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // حفظ الطلب في Firestore بنجاح
        const newOrderRef = await db.collection('orders').add(orderData);

        // --- Meta CAPI Integration ---
        try {
            const headersList = await headers();
            const ipAddress = headersList.get('x-forwarded-for') || '127.0.0.1';
            const userAgent = headersList.get('user-agent') || '';

            sendPurchaseEvent({
                value: total,
                content_ids: items.map(item => item.slug).filter((slug): slug is string => !!slug),
                num_items: items.reduce((sum, item) => sum + item.quantity, 0),
                ipAddress: ipAddress,
                userAgent: userAgent,
            });
        } catch (capiError) {
            console.error("Error triggering CAPI event:", capiError);
        }
        // --- End of CAPI Integration ---

        return NextResponse.json({ 
            message: 'Order created successfully', 
            orderId: newOrderRef.id 
        });

    } catch (error: any) {
        console.error('[POST /api/orders] Error:', error);
        return NextResponse.json({ error: `Failed to create order: ${error.message}` }, { status: 500 });
    }
}
