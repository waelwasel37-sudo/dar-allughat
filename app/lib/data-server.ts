// app/lib/data-server.ts - نسخة محسنة مع معالجة آمنة للبيانات
import admin, { getDb } from './firebase-admin';
import { Product, Category, Post } from './types'; // افترض وجود نوع Post

// دالة مساعدة لتحويل المستندات بأمان
function serializeDocument<T>(doc: admin.firestore.DocumentSnapshot): T {
    const data = doc.data() as any;
    const serializedData: { [key: string]: any } = { id: doc.id };

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value instanceof admin.firestore.Timestamp) {
                serializedData[key] = value.toDate().toISOString();
            } else if (key === 'title' || key === 'content' || key === 'summary') {
                // معالجة النصوص التي قد تحتوي على مشاكل
                serializedData[key] = safeCleanString(value);
            }
             else {
                serializedData[key] = value;
            }
        }
    }
    return serializedData as T;
}

// دالة لتنظيف النصوص
const safeCleanString = (rawStr: any): string => {
    if (!rawStr || typeof rawStr !== 'string') return '';
    try {
        // محاولة لإصلاح JSON غير صالح ضمنيًا
        const serialized = JSON.stringify(rawStr);
        return JSON.parse(serialized.replace(/\\([^"\\\/bfnrtu])/g, '$1'));
    } catch {
        // العودة إلى حل بسيط إذا فشل تحليل JSON
        return rawStr.replace(/[\x00-\x1F\x7F]/g, ''); // إزالة المحارف غير القابلة للطباعة
    }
};

// 1. جلب جميع المنتجات
export async function getProducts(): Promise<Product[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => serializeDocument<Product>(doc));
    } catch (error: any) {
        console.error("Error in getProducts:", error);
        throw new Error(`Failed to fetch products: ${error.message}`);
    }
}

// 2. جلب جميع التصنيفات
export async function getCategories(): Promise<Category[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("categories").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => serializeDocument<Category>(doc));
    } catch (error) {
        console.error("Error in getCategories:", error);
        return [];
    }
}

// 3. جلب منتج واحد بالـ Slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
    const db = getDb();
    try {
        const snapshot = await db.collection("products").where("slug", "==", slug).limit(1).get();
        if (snapshot.empty) return null;
        return serializeDocument<Product>(snapshot.docs[0]);
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
        if (snapshot.empty) return [];
        return snapshot.docs
            .map(doc => serializeDocument<Product>(doc))
            .filter((p) => p.slug !== currentSlug);
    } catch (error) {
        console.error("Error in getRelatedProducts:", error);
        return [];
    }
}

// 5. جلب المقالات مع معالجة آمنة
export async function getPosts(): Promise<Post[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        
        // استخدام الدالة المساعدة لضمان الأمان
        return snapshot.docs.reduce<Post[]>((acc, doc) => {
            try {
                // سيتم معالجة كل شيء بما في ذلك التواريخ والنصوص داخل هذه الدالة
                const post = serializeDocument<Post>(doc);
                acc.push(post);
            } catch (error) {
                console.error(`--- Skipped Corrupted Document ---`);
                console.error(`Document ID: ${doc.id}`);
                console.error(`Error during serialization:`, error);
                console.error(`Raw Data:`, JSON.stringify(doc.data(), null, 2));
                console.error(`---------------------------------`);
            }
            return acc;
        }, []);

    } catch (error) {
        console.error("Error in getPosts (initial fetch):", error);
        return [];
    }
}
