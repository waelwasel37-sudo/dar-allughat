
import { getDb } from './firebase-admin';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Product, Category, Post } from './types';
import { unstable_cache } from 'next/cache'; // دالة الكاش الخاصة بـ Next.js

function serializeDocument<T>(doc: DocumentSnapshot): T {
    const data = doc.data();

    if (!data) {
        console.warn(`[serializeDocument] Document with id ${doc.id} has no data.`);
        return { id: doc.id } as T;
    }

    const deepSerialize = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (obj && typeof obj.toDate === 'function') {
            return obj.toDate().toISOString();
        }
        if (Array.isArray(obj)) {
            return obj.map(item => deepSerialize(item));
        }
        if (typeof obj === 'object') {
            const copy: { [key: string]: any } = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    copy[key] = deepSerialize(obj[key]);
                }
            }
            return copy;
        }
        return obj;
    };

    return {
        id: doc.id,
        ...deepSerialize(data)
    } as T;
}

// 1. جلب كل المنتجات (مغلفة بالكاش ومرتبطة بوسم 'products-list')
export async function getProducts(): Promise<Product[]> {
    return unstable_cache(
        async () => {
            console.log('[data-server] Fetching products from Firebase Database...');
            const db = getDb();
            try {
                const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => serializeDocument<Product>(doc));
            } catch (error: any) {
                console.error("❌ Critical Error in getProducts:", error);
                throw new Error(`Failed to fetch products: ${error.message}`);
            }
        },
        ['all-products'], // مفتاح الكاش الداخلي الثابت
        { tags: ['products-list'] } // الوسم المستخدم في لوحة التحكم لمسح الكاش فوراً
    )();
}

// 2. جلب الأقسام (مغلفة بالكاش ومرتبطة بوسم 'categories-list')
export async function getCategories(): Promise<Category[]> {
    return unstable_cache(
        async () => {
            console.log('[data-server] Fetching categories from Firebase Database...');
            const db = getDb();
            try {
                const snapshot = await db.collection("categories").get();
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => serializeDocument<Category>(doc));
            } catch (error: any) {
                console.error("❌ Critical Error in getCategories:", error);
                throw new Error(`Failed to fetch categories: ${error.message}`);
            }
        },
        ['all-categories'],
        { tags: ['categories-list'] } // يمسح الكاش عند تعديل الأقسام
    )();
}

// 3. جلب منتج معين بالـ Slug (مرتبط بوسم خاص بالمنتج نفسه ووسم عام)
export async function getProductBySlug(slug: string): Promise<Product | null> {
    const decodedSlug = decodeURIComponent(slug);
    
    return unstable_cache(
        async () => {
            console.log(`[data-server] Fetching product from Firebase for slug: "${decodedSlug}"`);
            const db = getDb();
            try {
                const snapshot = await db.collection("products").where("slug", "==", decodedSlug).limit(1).get();
                if (snapshot.empty) return null;
                // Simplified based on our discussion
                return serializeDocument<Product>(snapshot.docs[0]);
            } catch (error: any) {
                console.error(`❌ Critical Error in getProductBySlug for slug "${decodedSlug}":`, error);
                throw new Error(`Failed to fetch product by slug: ${error.message}`);
            }
        },
        ['product-by-slug', decodedSlug], 
        { tags: [`product-${decodedSlug}`, 'products-list'] } 
    )();
}

// 🎯 دالة جديدة بالكامل لجلب المنتج بالـ ID لخدمة فكرة الروابط المختصرة (p/[id])
export async function getProductById(id: string): Promise<Product | null> {
    return unstable_cache(
        async () => {
            console.log(`[data-server] Fetching product from Firebase for ID: "${id}"`);
            const db = getDb();
            try {
                const doc = await db.collection('products').doc(id).get();
                if (!doc.exists) return null;
                return serializeDocument<Product>(doc);
            } catch (error: any) {
                console.error(`❌ Critical Error in getProductById for ID "${id}":`, error);
                throw new Error(`Failed to fetch product by ID: ${error.message}`);
            }
        },
        ['product-by-id', id],
        { tags: [`product-id-${id}`, 'products-list'] }
    )();
}

// 4. جلب المنتجات ذات الصلة
export async function getRelatedProducts(category: string, currentSlug: string): Promise<Product[]> {
    const decodedCurrentSlug = decodeURIComponent(currentSlug);
    
    return unstable_cache(
        async () => {
            console.log(`[data-server] Fetching related products for category: ${category}`);
            const db = getDb();
            try {
                const snapshot = await db.collection("products").where("category", "==", category).limit(5).get();
                if (snapshot.empty) return [];
                return snapshot.docs
                    .map(doc => serializeDocument<Product>(doc))
                    .filter((p) => p.slug !== decodedCurrentSlug)
                    .slice(0, 4);
            } catch (error: any) {
                console.error("❌ Critical Error in getRelatedProducts:", error);
                throw new Error(`Failed to fetch related products: ${error.message}`);
            }
        },
        ['related-products-by-category', category, decodedCurrentSlug], 
        { tags: ['products-list'] } 
    )();
}

// 5. جلب المقالات (مرتبطة بـ 'posts-list')
export async function getPosts(): Promise<Post[]> {
    return unstable_cache(
        async () => {
            const db = getDb();
            try {
                const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
                if (snapshot.empty) return [];
                return snapshot.docs.map(doc => serializeDocument<Post>(doc));
            } catch (error: any) {
                console.error("❌ Critical Error in getPosts:", error);
                throw new Error(`Failed to fetch posts: ${error.message}`);
            }
        },
        ['all-posts'],
        { tags: ['posts-list'] } 
    )();
}
