// 🎯 تحديث: إزالة الاستيراد غير الضروري، التهيئة تتم الآن عند أول استدعاء
// import './firebase-admin'; 

// app/lib/data-server.ts - نسخة محسنة مع معالجة آمنة للبيانات
// 🎯 تصحيح: استيراد admin و getDb بشكل سليم
import { getDb, admin } from './firebase-admin';
import { Product, Category, Post } from './types';

// دالة مساعدة لتحويل المستندات بأمان
function serializeDocument<T>(doc: admin.firestore.DocumentSnapshot): T {
    const data = doc.data() as any;
    if (!data) {
        // 🎯 تحسين: معالجة حالة عدم وجود بيانات في المستند
        return { id: doc.id } as T;
    }
    const serializedData: { [key: string]: any } = { id: doc.id };

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value instanceof admin.firestore.Timestamp) {
                serializedData[key] = value.toDate().toISOString();
            } else {
                // 🎯 تبسيط: لا حاجة للمعالجة الخاصة للنصوص هنا، فالمشكلة كانت في مكان آخر
                serializedData[key] = value;
            }
        }
    }
    return serializedData as T;
}


// 1. جلب جميع المنتجات
export async function getProducts(): Promise<Product[]> {
    // 🎯 تصحيح: استخدام await مع getDb()
    const db = await getDb();
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
    const db = await getDb();
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
    const db = await getDb();
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
    const db = await getDb();
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
    const db = await getDb();
    try {
        const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        
        return snapshot.docs.map(doc => serializeDocument<Post>(doc));
    } catch (error) {
        console.error("Error in getPosts:", error);
        return [];
    }
}