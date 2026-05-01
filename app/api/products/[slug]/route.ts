import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin, { db, auth, bucket } from '@/app/lib/firebase-admin';
import { Product } from '@/app/lib/types';
import { generateSlug } from '@/app/lib/utils';

export const dynamic = 'force-dynamic';

// النوع الصحيح لـ Next.js 15
interface RouteParams {
    params: Promise<{ slug: string }>;
}

function getPathFromUrl(url: string): string {
    try {
        const decodedUrl = decodeURIComponent(url);
        const pathStartIndex = decodedUrl.indexOf('/o/') + 3;
        if (pathStartIndex === 2) throw new Error("Invalid URL format: /o/ not found.");
        const pathEndIndex = decodedUrl.indexOf('?');
        if (pathEndIndex === -1) throw new Error("Invalid URL format: query string not found.");
        return decodedUrl.substring(pathStartIndex, pathEndIndex);
    } catch (e: any) {
        console.error(`Failed to extract path from URL: ${url}`, e.message);
        return '';
    }
}

// --- GET: جلب منتج واحد ---
export async function GET(req: NextRequest, { params }: RouteParams) {
    if (!db) {
        console.error('Firebase Admin SDK not initialized for db');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { slug } = await params;
    if (!slug) {
        return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
    }
    try {
        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        const doc = snapshot.docs[0];
        const productData = doc.data();
        const product: Product = {
            id: doc.id,
            ...productData,
            createdAt: (productData.createdAt.toDate ? productData.createdAt.toDate() : new Date(productData.createdAt)).toISOString(),
            updatedAt: (productData.updatedAt.toDate ? productData.updatedAt.toDate() : new Date(productData.updatedAt)).toISOString(),
        } as Product;
        return NextResponse.json(product);
    } catch (error) {
        console.error(`[GET /api/products/${slug}] Error:`, error);
        return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
    }
}

// --- PUT: تحديث منتج ---
export async function PUT(req: NextRequest, { params }: RouteParams) {
    if (!auth || !db || !admin) {
        console.error('Firebase Admin SDK not initialized for auth, db, or admin');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { slug: originalSlug } = await params;
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const productsRef = db.collection('products');
        const querySnapshot = await productsRef.where('slug', '==', originalSlug).limit(1).get();
        if (querySnapshot.empty) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const productDocRef = querySnapshot.docs[0].ref;
        const productUpdateData: Partial<Product> = await req.json();
        
        const currentData = (await productDocRef.get()).data() as Product;
        if (productUpdateData.name && productUpdateData.name !== currentData.name) {
            const baseSlug = generateSlug(productUpdateData.name);
            let newSlug = baseSlug;
            let counter = 1;
            while (true) {
                const slugSnapshot = await productsRef.where('slug', '==', newSlug).get();
                if (slugSnapshot.empty || slugSnapshot.docs[0].id === productDocRef.id) break;
                newSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            productUpdateData.slug = newSlug;
        }

        const finalUpdateData = {
            ...productUpdateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        await productDocRef.update(finalUpdateData);
        return NextResponse.json({ message: 'Updated', slug: finalUpdateData.slug || originalSlug });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- DELETE: حذف المنتج ---
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    if (!auth || !db || !bucket) {
        console.error('Firebase Admin SDK not initialized for auth, db, or bucket');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { slug } = await params;
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        const doc = snapshot.docs[0];
        const data = doc.data() as Product;

        const fileUrls = [data.imageUrl, data.secondaryImageUrl].filter(Boolean);
        for (const url of fileUrls) {
            if (url) {
                const filePath = getPathFromUrl(url);
                if (filePath) await bucket.file(filePath).delete().catch((e: any) => console.warn(e.message));
            }
        }

        await doc.ref.delete();
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: التقييم ---
export async function POST(req: NextRequest, { params }: RouteParams) {
    if (!db || !admin) {
        console.error('Firebase Admin SDK not initialized for db or admin');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { slug: productSlug } = await params;
    try {
        const { rating, userId } = await req.json();
        if (!userId || !rating) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('slug', '==', productSlug).limit(1).get();
        if (snapshot.empty) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const productDocRef = snapshot.docs[0].ref;

        await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
            const ratingRef = productDocRef.collection('ratings').doc(userId);
            transaction.set(ratingRef, { 
                rating, 
                userId, 
                updatedAt: admin.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
        });

        return NextResponse.json({ message: 'Rating added' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
