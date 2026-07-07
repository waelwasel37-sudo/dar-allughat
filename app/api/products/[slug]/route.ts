import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// 🎯 تصحيح: استيراد دوال Firebase بشكل Named Exports سليم ومتوافق
import { getDb, getAdminAuth, getBucket } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { Product } from '@/app/lib/types';
import { generateSlug } from '@/app/lib/utils';

export const dynamic = 'force-dynamic';

// 🎯 تحديث: تعريف واجهة البارامترز لتتوافق مع معايير Next.js 15 الصارمة
interface RouteParams {
    params: Promise<{ slug: string }>;
}

function getPathFromUrl(url: string): string {
    try {
        const decodedUrl = decodeURIComponent(url);
        // 🎯 تحسين: استخدام new URL() لتحليل الرابط بشكل آمن
        const urlObject = new URL(decodedUrl);
        const pathStartIndex = urlObject.pathname.indexOf('/o/') + 3;
        if (pathStartIndex === 2) return ''; 
        return urlObject.pathname.substring(pathStartIndex);
    } catch (e: any) {
        console.error(`Failed to extract path from URL: ${url}`, e.message);
        const pathStartIndex = url.indexOf('/o/') + 3;
        if (pathStartIndex > 2) {
            const pathEndIndex = url.indexOf('?');
            return pathEndIndex === -1 ? url.substring(pathStartIndex) : url.substring(pathStartIndex, pathEndIndex);
        }
        return '';
    }
}

// --- GET: جلب منتج واحد ---
export async function GET(req: NextRequest, { params }: RouteParams) {
    const db = getDb(); 
    try {
        const { slug } = await params; // 🎯 تصحيح:params في Next.js 15 أصبحت Promise وتحتاج لـ await
        if (!slug) {
            return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
        }
        
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
            createdAt: productData.createdAt instanceof firestore.Timestamp 
                ? productData.createdAt.toDate().toISOString() 
                : new Date(productData.createdAt || Date.now()).toISOString(),
            updatedAt: productData.updatedAt instanceof firestore.Timestamp 
                ? productData.updatedAt.toDate().toISOString() 
                : new Date(productData.updatedAt || Date.now()).toISOString(),
        } as Product;
        
        return NextResponse.json(product);
    } catch (error) {
        console.error(`[GET /api/products] Error:`, error);
        return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
    }
}

// --- PUT: تحديث منتج ---
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const db = getDb();     
    const firebaseAuth = getAdminAuth(); // 🎯 تصحيح أمان: اسم متغير آمن فريد لمنع التعارض

    try {
        const { slug: originalSlug } = await params; // 🎯 تصحيح: إضافة await للـ params
        const cookieStore = await cookies(); // 🎯 تصحيح قاتل: الكوكيز في Next.js 15 تحتاج إجبارياً لـ await
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
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
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        await productDocRef.update(finalUpdateData);
        return NextResponse.json({ message: 'Updated', slug: finalUpdateData.slug || originalSlug });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- DELETE: حذف المنتج من القاعدة وحذف صوره من السحاب ---
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const db = getDb();         
    const firebaseAuth = getAdminAuth(); // 🎯 تصحيح أمان: اسم متغير آمن فريد لمنع التعارض
    const bucket = getBucket(); 

    try {
        const { slug } = await params; // 🎯 تصحيح: إضافة await للـ params
        const cookieStore = await cookies(); // 🎯 تصحيح قاتل: إضافة await للكوكيز
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        const doc = snapshot.docs[0];
        const data = doc.data() as Product;

        const fileUrls = [data.imageUrl, data.secondaryImageUrl].filter(Boolean) as string[];
        for (const url of fileUrls) {
            const filePath = getPathFromUrl(url);
            if (filePath) {
                await bucket.file(filePath).delete().catch((e: any) => console.warn(`Failed to delete file: ${filePath}`, e.message));
            }
        }

        await doc.ref.delete();
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: تقييم المنتج وتخزينه عبر Transaction مؤمنة ---
export async function POST(req: NextRequest, { params }: RouteParams) {
    const db = getDb(); 
    try {
        const { slug: productSlug } = await params; // 🎯 تصحيح: إضافة await للـ params
        const { rating, userId } = await req.json();
        if (!userId || !rating) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const productsRef = db.collection('products');
        const snapshot = await productsRef.where('slug', '==', productSlug).limit(1).get();
        if (snapshot.empty) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const productDocRef = snapshot.docs[0].ref;

        await db.runTransaction(async (transaction: firestore.Transaction) => {
            const ratingRef = productDocRef.collection('ratings').doc(userId);
            transaction.set(ratingRef, { 
                rating, 
                userId, 
                updatedAt: firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
        });

        return NextResponse.json({ message: 'Rating added' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}