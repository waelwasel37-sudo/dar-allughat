
// app/lib/data-server.ts

import admin, { db } from '@/app/lib/firebase-admin'; 
import { Product, Category, Post } from './types';
import { DocumentSnapshot } from 'firebase-admin/firestore';

// Helper to convert Firestore doc to a common format with ISO strings for dates
const toProduct = (doc: DocumentSnapshot): Product => {
    const data = doc.data()!;
    const createdAt = data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
    const updatedAt = data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString();
    return {
        id: doc.id,
        name: data.name || 'Unnamed Product',
        slug: data.slug, 
        description: data.description || '',
        price: data.price || 0,
        discount: data.discount || 0,
        stock: data.stock || 0,
        year: data.year,
        category: data.category || 'Uncategorized',
        categoryEmoji: data.categoryEmoji || '✨',
        imageUrl: data.imageUrl || '',
        imagePath: data.imagePath || '',
        createdAt,
        updatedAt,
    } as Product;
};

const toCategory = (doc: DocumentSnapshot): Category => {
    const data = doc.data()!;
    return {
        id: doc.id,
        name: data.name || 'Unnamed Category',
        emoji: data.emoji || '🏷️',
        slug: data.slug,
    };
};

// Helper to convert Firestore doc to Post
const toPost = (doc: DocumentSnapshot): Post => {
    const data = doc.data()!;
    const post: Partial<Post> = { id: doc.id };

    try {
        post.title = data.title || 'Untitled Post';
    } catch (e) {
        console.error(`Error processing title for post ${doc.id}:`, e);
        post.title = 'Error: Invalid Title';
    }

    try {
        post.slug = data.slug;
    } catch (e) {
        console.error(`Error processing slug for post ${doc.id}:`, e);
        post.slug = doc.id;
    }

    // The user's definitive fix for preventing JSON crashes from malformed content.
    try {
        let rawContent = data.content || '';
        if (typeof rawContent === 'string') {
            // Use four backslashes to be correctly interpreted by JS engine & Webpack.
            rawContent = rawContent.replace(/\\(?!["\\/bfnrtu])/g, '\\');
            
            try {
                if (rawContent.startsWith('{') || rawContent.startsWith('[')) {
                    rawContent = JSON.stringify(JSON.parse(rawContent));
                }
            } catch (jsonErr) {
                console.warn(`JSON parsing failed for content in post ${doc.id}. Applying fallback sanitization.`);
                // A safe, comprehensive replacement with four backslashes to protect the build server.
                rawContent = rawContent.replace(/\\/g, '\\');
            }
        }
        post.content = rawContent;
    } catch (e) {
        console.error(`FATAL: Error processing content for post ${doc.id}:`, e);
        post.content = 'Error: Could not load content due to a fatal error.';
    }
    
    try {
        post.description = data.description || '';
    } catch (e) {
        console.error(`Error processing description for post ${doc.id}:`, e);
        post.description = '';
    }

    try {
        post.imageUrl = data.imageUrl || '';
    } catch (e) {
        console.error(`Error processing imageUrl for post ${doc.id}:`, e);
        post.imageUrl = '';
    }

    try {
        post.createdAt = data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
    } catch (e) {
        console.error(`Error processing createdAt for post ${doc.id}:`, e);
        post.createdAt = new Date().toISOString();
    }

    try {
        post.updatedAt = data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString();
    } catch (e) {
        console.error(`Error processing updatedAt for post ${doc.id}:`, e);
        post.updatedAt = new Date().toISOString();
    }

    return post as Post;
};

// Fetches all posts
export const getPosts = async (): Promise<Post[]> => {
    if (!db) {
        console.error("Database not initialized for getPosts. Check Firebase Admin SDK setup.");
        return [];
    }
    try {
        const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(toPost).filter((p: Post) => p.slug);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

// Fetches products without caching
export const getProducts = async (): Promise<Product[]> => {
    if (!db) {
        console.error("Database not initialized for getProducts. Check Firebase Admin SDK setup.");
        return [];
    }
    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(toProduct).filter((p: Product) => p.slug);
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

// Fetches product by slug without caching
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
    if (!db) {
        console.error("Database not initialized for getProductBySlug. Check Firebase Admin SDK setup.");
        return null;
    }
    try {
        const decodedSlug = decodeURIComponent(slug);
        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('slug', '==', decodedSlug).limit(1).get();

        if (snapshot.empty) {
            return null;
        }

        return toProduct(snapshot.docs[0]);
    } catch (error) {
        console.error(`Error fetching product with decoded slug \"${slug}\"`, error);
        return null; 
    }
};

export const getCategories = async (): Promise<Category[]> => {
    if (!db) {
        console.error("Database not initialized for getCategories. Check Firebase Admin SDK setup.");
        return [];
    }
    try {
        const categoriesSnapshot = await db.collection('categories').orderBy('name', 'asc').get();
        if (categoriesSnapshot.empty) return [];
        return categoriesSnapshot.docs.map(toCategory);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

// Fetches related products without caching
export const getRelatedProducts = async (category: string, currentProductSlug: string): Promise<Product[]> => {
    if (!db) {
        console.error("Database not initialized for getRelatedProducts. Check Firebase Admin SDK setup.");
        return [];
    }
    try {
        const snapshot = await db.collection('products')
            .where('category', '==', category)
            .where('slug', '!=', currentProductSlug)
            .limit(4)
            .get();
            
        if (snapshot.empty) return [];
        return snapshot.docs.map(toProduct);
    } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
};
