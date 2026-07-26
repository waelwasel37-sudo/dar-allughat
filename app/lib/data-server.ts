import { getDb } from './firebase-admin';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Product, Category, Post } from './types';

function serializeDocument<T>(doc: DocumentSnapshot): T {
    const data = doc.data();

    if (!data) {
        console.warn(`[serializeDocument] Document with id ${doc.id} has no data.`);
        return { id: doc.id } as T;
    }

    // Helper function for deep serialization to avoid JSON conversion errors.
    const deepSerialize = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;

        // If the object is a Firestore Timestamp, convert it to an ISO string.
        if (obj && typeof obj.toDate === 'function') {
            return obj.toDate().toISOString();
        }

        // If it's an array, serialize each item recursively.
        if (Array.isArray(obj)) {
            return obj.map(item => deepSerialize(item));
        }

        // If it's a plain object, serialize each value recursively.
        if (typeof obj === 'object') {
            const copy: { [key: string]: any } = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    copy[key] = deepSerialize(obj[key]);
                }
            }
            return copy;
        }

        // Return primitives as is.
        return obj;
    };

    // Apply deep serialization to the document data and prepend the ID.
    return {
        id: doc.id,
        ...deepSerialize(data)
    } as T;
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
    // Decode the slug to handle non-ASCII characters (like Arabic) correctly.
    const decodedSlug = decodeURIComponent(slug);
    console.log(`[data-server] Attempting to fetch product with decoded slug: "${decodedSlug}"`);
    
    const db = getDb();
    try {
        const snapshot = await db.collection("products").where("slug", "==", decodedSlug).limit(1).get();
        if (snapshot.empty) {
            console.warn(`[data-server] Product not found for slug: "${decodedSlug}".`);
            return null;
        }
        // Serialize the document to prevent server/build crashes.
        const product = serializeDocument<Product>(snapshot.docs[0]);
        console.log(`[data-server] Successfully fetched product: ${product.id}`);
        return product;
    } catch (error: any) {
        console.error(`❌ Critical Error in getProductBySlug for slug "${decodedSlug}":`, error);
        throw new Error(`Failed to fetch product by slug: ${error.message}`);
    }
}

export async function getRelatedProducts(category: string, currentSlug: string): Promise<Product[]> {
    const decodedCurrentSlug = decodeURIComponent(currentSlug);
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
