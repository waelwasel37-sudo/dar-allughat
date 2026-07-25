// app/lib/data-server.ts - نسخة معززة ومصححة بالكامل
import { getDb } from './firebase-admin';
import type { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import type { Product, Category, Post } from './types';

function serializeDocument<T>(doc: DocumentSnapshot): T {
    const data = doc.data();

    if (!data) {
        console.warn(`[serializeDocument] Document with id ${doc.id} has no data.`);
        return { id: doc.id } as T;
    }

    const serializedData: { [key: string]: any } = { id: doc.id };

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];

            if (value && typeof (value as Timestamp).toDate === 'function') {
                serializedData[key] = (value as Timestamp).toDate().toISOString();
            } else {
                serializedData[key] = value;
            }
        }
    }
    return serializedData as T;
}

export async function getProducts(): Promise<Product[]> {
    console.log('[data-server] Attempting to fetch products...');
    const db = getDb();
    try {
        const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
        if (snapshot.empty) {
            console.log('[data-server] "products" collection is empty.');
            return [];
        }
        const products = snapshot.docs.map(doc => serializeDocument<Product>(doc));
        console.log(`[data-server] Successfully fetched ${products.length} products.`);
        return products;
    } catch (error: any) {
        console.error("❌ Critical Error in getProducts:", error);
        throw new Error(`Failed to fetch products: ${error.message}`);
    }
}

export async function getCategories(): Promise<Category[]> {
    console.log('[data-server] Attempting to fetch categories...');
    const db = getDb();
    try {
        const snapshot = await db.collection("categories").get();
        if (snapshot.empty) {
            console.log('[data-server] "categories" collection is empty.');
            return [];
        }
        const categories = snapshot.docs.map(doc => serializeDocument<Category>(doc));
        console.log(`[data-server] Successfully fetched ${categories.length} categories.`);
        return categories;
    } catch (error: any) {
        console.error("❌ Critical Error in getCategories:", error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
    }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    console.log(`[data-server] Attempting to fetch product with slug: "${slug}"`);
    const db = getDb();
    try {
        const snapshot = await db.collection("products").where("slug", "==", slug).limit(1).get();
        if (snapshot.empty) {
            console.warn(`[data-server] Product not found for slug: "${slug}".`);
            return null;
        }
        const product = serializeDocument<Product>(snapshot.docs[0]);
        console.log(`[data-server] Successfully fetched product: ${product.id}`);
        return product;
    } catch (error: any) {
        console.error(`❌ Critical Error in getProductBySlug for slug "${slug}":`, error);
        throw new Error(`Failed to fetch product by slug: ${error.message}`);
    }
}

// 4. جلب المنتجات ذات الصلة (تم تعديل الـ limit إلى 5 لضمان عرض 4 منتجات كاملة)
export async function getRelatedProducts(category: string, currentSlug: string): Promise<Product[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("products").where("category", "==", category).limit(5).get();
        if (snapshot.empty) return [];
        return snapshot.docs
            .map(doc => serializeDocument<Product>(doc))
            .filter((p) => p.slug !== currentSlug)
            .slice(0, 4); // قطع المصفوفة لتظهر 4 قطع فقط للمستخدم النهائي
    } catch (error: any) {
        console.error("❌ Critical Error in getRelatedProducts:", error);
        throw new Error(`Failed to fetch related products: ${error.message}`);
    }
}

export async function getPosts(): Promise<Post[]> {
    const db = getDb();
    try {
        const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => serializeDocument<Post>(doc));
    } catch (error: any) {
        console.error("❌ Critical Error in getPosts:", error);
        throw new Error(`Failed to fetch posts: ${error.message}`);
    }
}
