// app/lib/data-server.ts - النسخة الكاملة والنهائية المعتمدة للـ Build
import admin, { getDb } from './firebase-admin';
import { Product } from './types';

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

// 5. جلب المقالات (لحل خطأ صفحة المدونة وخريطة الموقع)
export async function getPosts(): Promise<any[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
            };
        });
    } catch (error) {
        console.error("Error in getPosts:", error);
        return [];
    }
}
