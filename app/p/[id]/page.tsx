import { redirect } from 'next/navigation';
import { getDb } from '../../lib/firebase-admin';
import type { Product } from '../../lib/types';

interface PageProps {
    params: Promise<{ id: string }>; // 🎯 تحديث النوع ليتوافق مع Next.js الحديث كـ Promise
}

// 🎯 محرك إعادة التوجيه بالصيغة الصحيحة لـ Admin SDK
export default async function ShortLinkRedirectPage({ params }: PageProps) {
    // ⚠️ خطوة جوهرية: يجب عمل await للـ params في النسخ الحديثة لمنع الـ Crash
    const resolvedParams = await params;
    const shortId = resolvedParams.id;

    // حماية إضافية: التأكد من وجود المعرف وطوله
    if (!shortId || shortId.length < 6) {
        redirect('/');
    }

    try {
        const db = getDb();
        const productsRef = db.collection('products');

        // 🔥 استعلام فائق الذكاء يبحث بالـ Document ID (مستند إلى الـ 6 أحرف الأولى)
        const snapshot = await productsRef
            .where('__name__', '>=', shortId)
            .where('__name__', '<', shortId + '\uf8ff')
            .limit(1)
            .get();

        if (snapshot.empty) {
            redirect('/');
        }

        const productDoc = snapshot.docs[0];
        const product = { id: productDoc.id, ...productDoc.data() } as Product;

        if (!product || !product.slug) {
            redirect('/');
        }

        // 🚀 توجيه العميل فوراً وبأمان إلى السلوج العربي النظيف
        redirect(`/products/${encodeURIComponent(product.slug)}`);

    } catch (error) {
        console.error("Short URL redirect error:", error);
        redirect('/');
    }
}
