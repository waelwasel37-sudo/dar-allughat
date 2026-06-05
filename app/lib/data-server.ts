// app/lib/data-server.ts - نسخة تشخيصية لتحديد المقالات التالفة
import admin, { getDb } from './firebase-admin';
import { Product } from './types';

// ... (getProducts, getCategories, getProductBySlug, getRelatedProducts functions remain the same) ...
// 1. جلب جميع المنتجات
export async function getProducts(): Promise<Product[]> {
    const db = getDb();
    try {
        const productsCollection = db.collection("products");
        const productsSnapshot = await productsCollection.orderBy("createdAt", "desc").get();
        if (productsSnapshot.empty) return [];
        
        return productsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
            } as Product;
        });
    } catch (error: any) {
        console.error("Error in getProducts:", error);
        throw new Error(`Failed to fetch products: ${error.message}`);
    }
}

// 2. جلب جميع التصنيفات (لحل خطأ صفحة الإضافة والصفحة الرئيسية)
export async function getCategories(): Promise<any[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("categories").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error in getCategories:", error);
        return [];
    }
}

// 3. جلب منتج واحد بالـ Slug (لحل خطأ صفحة التعديل وصفحة المنتج المفرد)
export async function getProductBySlug(slug: string): Promise<Product | null> {
    const db = getDb();
    try {
        const snapshot = await db.collection("products").where("slug", "==", slug).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
            updatedAt: data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
        } as Product;
    } catch (error) {
        console.error("Error in getProductBySlug:", error);
        return null;
    }
}

// 4. جلب المنتجات ذات الصلة
export async function getRelatedProducts(category: string, currentSlug: string): Promise<Product[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("products").where("category", "==", category).limit(4).get();
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter((p) => p.slug !== currentSlug);
    } catch (error) {
        console.error("Error in getRelatedProducts:", error);
        return [];
    }
}

// 5. جلب المقالات - وضع التشخيص لتحديد البيانات التالفة
export async function getPosts(): Promise<any[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];

        // استخدام reduce لمعالجة المستندات بأمان وتخطي التالف منها
        return snapshot.docs.reduce<any[]>((acc, doc) => {
            try {
                const data = doc.data();

                const safeCleanString = (rawStr: any) => {
                    if (!rawStr || typeof rawStr !== 'string') return '';
                    try {
                        const serialized = JSON.stringify(rawStr);
                        return JSON.parse(serialized
                            .replace(/\\\\\?/g, '?')
                            .replace(/\\([^"\\\/bfnrtu])/g, '$1')
                        );
                    } catch {
                        return rawStr.replace(/\\/g, '/');
                    }
                };

                const post = {
                    id: doc.id,
                    ...data,
                    title: data.title ? safeCleanString(data.title) : '',
                    content: data.content ? safeCleanString(data.content) : '',
                    summary: data.summary ? safeCleanString(data.summary) : '',
                    createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
                    updatedAt: data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
                };
                
                acc.push(post); // إضافة المقال المعالج إلى القائمة

            } catch (error) {
                // في حالة حدوث أي خطأ أثناء معالجة مستند واحد، قم بتسجيله والمتابعة
                console.error(`--- تم العثور على مستند تالف وتجاهله ---`);
                console.error(`Document ID: ${doc.id}`);
                console.error(`Error:`, error);
                console.error(`Raw Data:`, JSON.stringify(doc.data(), null, 2));
                console.error(`--------------------------------------`);
            }
            return acc;
        }, []); // ابدأ بمصفوفة فارغة

    } catch (error) {
        // هذا الخطأ سيلتقط فقط الأخطاء من الجلب الأولي لقاعدة البيانات
        console.error("Error in getPosts (initial fetch):", error);
        return [];
    }
}
