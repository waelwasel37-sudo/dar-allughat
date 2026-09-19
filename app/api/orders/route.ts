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

// --- POST: إنشاء طلبية شراء جديدة لجميع المنتجات متوافقة مع الـ Installment API واﻟـ POS ---
export async function POST(req: NextRequest) {
    const db = getDb();

    try {
        const body = await req.json();

        // 🎯 تفكيك البيانات بناءً على الـ Order Schema الدقيق مع إرسال مصدر الطلب (source)
        const {
            userId,
            items,
            totalAmount,
            shippingAddress,
            shippingFee,
            payment,        // تفاصيل الـ PaymentDetails (البنك أو الكاش)
            installment,    // تفاصيل الـ InstallmentDetails (شركة التقسيط)
            notes,
            source          // 🌟 المتغير الجديد لاستقبال مصدر الطلب: "Web" أو "POS"
        }: { 
            userId: string,
            items: OrderItem[], 
            totalAmount: number, 
            shippingAddress?: ShippingAddress, // 🌟 جعلناه اختيارياً لتجنب مشاكل نظام الكاشير
            shippingFee: number,
            payment: Omit<PaymentDetails, 'amount' | 'currency'> & { method: string, status: string, transactionId?: string },
            installment?: InstallmentDetails,
            notes?: string,
            source?: string // 🌟 تحديد نوع المنشأ برمجياً
        } = body;

        // تحديد المصدر الافتراضي بـ "Web" إن لم يُرسل صراحة من واجهة الكاشير
        const orderSource = source || 'Web';

        // 🌟 بناء بيانات شحن وهمية في حال كان الطلب قادم من الكاشير بالمحل (POS) لتجنب أخطاء حظر البيانات
        let finalShippingAddress = shippingAddress;
        
        if (orderSource === 'POS') {
            finalShippingAddress = {
                recipientName: shippingAddress?.recipientName || 'عميل المحل (الكاشير)',
                streetAddress: shippingAddress?.streetAddress || 'شراء مباشر من الفرع',
                city: shippingAddress?.city || 'المحل',
                governorate: shippingAddress?.governorate || 'الفرع الرئيسي',
                postalCode: shippingAddress?.postalCode || null,
                phone: shippingAddress?.phone || '00000000000'
            };
        }

        // التحقق الصارم المعدل (يتفقد الآن العنوان النهائي المعالج برمجياً لعدم ضرب الكود)
        if (!items || items.length === 0 || totalAmount === undefined || !finalShippingAddress || !finalShippingAddress.phone || !finalShippingAddress.recipientName) {
            return NextResponse.json({ error: 'Missing required order fields: items, totalAmount, or shipping details.' }, { status: 400 });
        }

        const serverTimestamp = firestore.FieldValue.serverTimestamp();

        // 💳 بناء كائن الطلب المطابق تماماً للـ Schema المحترف والجاهز لبوابات التقسيط والـ POS
        const orderData = {
            userId: userId || 'guest',
            source: orderSource, // 🌟 حفظ حقل المصدر في الفايربيس لتسهيل الفلترة في صفحة التقارير
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
                recipientName: finalShippingAddress.recipientName,
                streetAddress: finalShippingAddress.streetAddress,
                city: finalShippingAddress.city,
                governorate: finalShippingAddress.governorate,
                postalCode: finalShippingAddress.postalCode || null,
                phone: finalShippingAddress.phone
            },
            shippingFee: orderSource === 'POS' ? 0 : (shippingFee || 0), // مبيعات الفرع ليس لها رسوم شحن
            status: orderSource === 'POS' ? 'completed' : 'new', // 🌟 مبيعات الكاشير تكتمل فوراً ولا تنتظر الشحن والتجهيز
            
            // بيانات الدفع البنكي الرقمي أو الكاش الجاهزة
            payment: {
                method: payment?.method || (orderSource === 'POS' ? 'cash' : 'cash_on_delivery'),
                transactionId: payment?.transactionId || null,
                status: orderSource === 'POS' ? 'paid' : (payment?.status || 'pending'), // 🌟 مبيعات الفرع مدفوعة تلقائياً
                amount: totalAmount + (orderSource === 'POS' ? 0 : (shippingFee || 0)),
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

        // 🚀 إرسال حدث الشراء الفوري إلى فيسبوك (فقط للأونلاين لمنع تخريب بيانات الحملات الإعلانية بمبيعات الفرع)
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
            message: orderSource === 'POS' ? 'POS Order completed successfully' : 'Order created successfully', 
            orderId: newOrderRef.id 
        }, { status: 201 });

    } catch (error: any) {
        console.error('[POST /api/orders] Error:', error);
        return NextResponse.json({ error: `Failed to create order: ${error.message}` }, { status: 500 });
    }
}
