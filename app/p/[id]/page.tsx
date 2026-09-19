import { redirect } from 'next/navigation';
import { getDb } from '../../lib/firebase-admin';
import type { Product } from '../../lib/types';

// العودة إلى النوع القياسي والموثوق والمتوافق مع بيئة السيرفر الحالية
interface PageProps {
    params: { id: string };
}

export default async function ShortLinkRedirectPage({ params }: PageProps) {
    // استخراج الـ ID مباشرة من الـ params بدون await لمنع الفشل الصامت
    const { id: shortId } = params;

    if (!shortId || shortId.length < 6) {
        redirect('/');
    }

    try {
        const db = getDb();
        const productsRef = db.collection('products');

        // استعلام ذكي يبحث في Firestore بالـ ID المقصوص لـ 6 أحرف
        const snapshot = await productsRef
            .where('__name__', '>=', shortId)
            .where('__name__', '<', shortId + '\uf8ff')
            .limit(1)
            .get();

        if (snapshot.empty) {
            redirect('/');
        }

        // ✅ تصحيح: استخراج أول مستند مصفوفة الـ docs بشكل صحيح [0]
        const productDoc = snapshot.docs[0];
        const product = { id: productDoc.id, ...productDoc.data() } as Product;

        if (!product || !product.slug) {
            redirect('/');
        }

        // تحويل العميل فوراً وبسرعة بالسلوج العربي
        redirect(`/products/${encodeURIComponent(product.slug)}`);

    } catch (error) {
        console.error("Short URL redirect error:", error);
        redirect('/');
    }
}
