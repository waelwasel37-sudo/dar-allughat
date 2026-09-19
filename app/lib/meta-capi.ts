// app/lib/meta-capi.ts

/**
 * واجهة لحمولة حدث الشراء التي سيتم إرسالها إلى Meta CAPI.
 * Interface for the purchase event payload to be sent to Meta CAPI.
 */
interface PurchaseEventPayload {
    value: number;           // قيمة الطلب الإجمالية
    content_ids: string[];   // مصفوفة من معرفات المنتجات (SKUs or slugs)
    num_items: number;       // إجمالي عدد المنتجات في الطلب
    ipAddress: string;       // عنوان IP الخاص بالعميل
    userAgent: string;       // وكيل المستخدم (المتصفح) الخاص بالعميل
}

/**
 * دالة لإرسال حدث "شراء" (Purchase) إلى Meta Conversions API (CAPI).
 * Function to send a 'Purchase' event to the Meta Conversions API (CAPI).
 * 
 * @param payload - البيانات المتعلقة بعملية الشراء.
 */
export async function sendPurchaseEvent(payload: PurchaseEventPayload) {
    const { value, content_ids, num_items, ipAddress, userAgent } = payload;

    // جلب الإعدادات من متغيرات البيئة
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    // التحقق من وجود الإعدادات الضرورية قبل المتابعة
    if (!pixelId || !accessToken) {
        console.warn("Meta CAPI environment variables (NEXT_PUBLIC_META_PIXEL_ID, META_ACCESS_TOKEN) are not set. Skipping event.");
        return; // إيقاف التنفيذ إذا كانت المتغيرات غير موجودة
    }

    // بناء كائن بيانات الحدث حسب مواصفات Meta CAPI
    const eventData = {
        data: [
            {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000), // الوقت الحالي بصيغة Unix timestamp
                event_source_url: process.env.NEXT_PUBLIC_SITE_URL, // رابط الصفحة التي تم منها الحدث
                user_data: {
                    client_ip_address: ipAddress,
                    client_user_agent: userAgent,
                },
                custom_data: {
                    currency: 'EGP', // عملة الطلب
                    value: value.toFixed(2), // قيمة الطلب مع تنسيق عشري
                    content_ids: content_ids,
                    num_items: num_items,
                },
            },
        ],
        // لإرسال أحداث اختبارية، أزل التعليق عن السطر التالي وضع كود الاختبار الخاص بك
        // test_event_code: 'YOUR_TEST_EVENT_CODE' 
    };

    try {
        // إرسال الطلب إلى Meta Graph API
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            }
        );

        const responseData = await response.json();

        // معالجة الأخطاء إذا لم تكن الاستجابة ناجحة
        if (!response.ok) {
            console.error('Meta CAPI Error Response:', responseData);
            throw new Error(`Failed to send purchase event to Meta CAPI. Status: ${response.status}`);
        }

        console.log('Successfully sent Purchase event to Meta CAPI:', responseData);

    } catch (error) {
        console.error('Error in sendPurchaseEvent:', error);
    }
}