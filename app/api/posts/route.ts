import { NextRequest, NextResponse } from 'next/server';
// 🎯 تصحيح: استيراد admin و getDb و getAdminAuth بشكل صحيح
import { getDb, getAdminAuth } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { Post } from '@/app/lib/types';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET all posts or a single post by slug
export async function GET(req: NextRequest) {
    // 🎯 تصحيح: استدعاء getDb للحصول على كائن قاعدة البيانات
    const db = getDb();

    try {
        const rawSlug = req.nextUrl.searchParams.get('slug');

        if (rawSlug) {
            // 🎯 الأمان الكامل: فك تشفير السلوج هنا أيضاً لضمان مطابقة الـ Firestore حتى لو أرسله المتصفح مشفراً
            const cleanSlug = decodeURIComponent(rawSlug);

            const snapshot = await db.collection('posts').where('slug', '==', cleanSlug).limit(1).get();
            if (snapshot.empty) {
                return NextResponse.json({ message: 'Post not found' }, { status: 404 });
            }
            const doc = snapshot.docs[0];
            const data = doc.data();
            const post = {
                id: doc.id, 
                ...data,
                // 🎯 تصحيح: التأكد من وجود firestore.Timestamp
                createdAt: data.createdAt instanceof firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
            };
            return NextResponse.json(post);
        } else {
            const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
            const posts = snapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // 🎯 تصحيح: التأكد من وجود firestore.Timestamp
                    createdAt: data.createdAt instanceof firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
                    updatedAt: data.updatedAt instanceof firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
                };
            });
            return NextResponse.json(posts);
        }
    } catch (error) {
        console.error('[GET /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to fetch posts: ${errorMessage}` }, { status: 500 });
    }
}

// POST a new post
export async function POST(req: NextRequest) {
    // 🎯 تعديل أمان عبقري منك: استخدام اسم متغير محلي فريد فريد لمنع تكرار المعرف البرمجي
    const firebaseAuth = getAdminAuth();
    // 🎯 تصحيح: استدعاء getDb للحصول على كائن قاعدة البيانات
    const db = getDb();

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = await req.json();
        
        const newPost = {
            ...postData,
            // 🎯 تصحيح: استخدام الطريقة الصحيحة للحصول على الطابع الزمني للسيرفر
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        const docRef = await db.collection('posts').add(newPost);
        return NextResponse.json({ id: docRef.id, ...newPost }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to create post: ${errorMessage}` }, { status: 500 });
    }
}

// PUT to update a post by SLUG
export async function PUT(req: NextRequest) {
    // 🎯 تعديل أمان عبقري منك: استخدام اسم متغير محلي فريد فريد لمنع تكرار المعرف البرمجي
    const firebaseAuth = getAdminAuth();
    // 🎯 تصحيح: استدعاء getDb للحصول على كائن قاعدة البيانات
    const db = getDb();

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const slug = req.nextUrl.searchParams.get('slug');
        if (!slug) {
            return NextResponse.json({ message: 'Post slug is required' }, { status: 400 });
        }

        const updateData: Partial<Post> = await req.json();

        if (updateData.slug) {
            return NextResponse.json({ message: 'Changing the slug is not allowed.' }, { status: 400 });
        }
        
        const snapshot = await db.collection('posts').where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }
        const postRef = snapshot.docs[0].ref;

        const finalUpdateData = {
            ...updateData,
            // 🎯 تصحيح: استخدام الطريقة الصحيحة للحصول على الطابع الزمني للسيرفر
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await postRef.update(finalUpdateData);

        const updatedDoc = await postRef.get();
        const responseData = {
            id: updatedDoc.id,
            ...updatedDoc.data()
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[PUT /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to update post: ${errorMessage}` }, { status: 500 });
    }
}


// DELETE a post by SLUG
export async function DELETE(req: NextRequest) {
    const firebaseAuth = getAdminAuth();
    const db = getDb();

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 🎯 قراءة الـ slug من الرابط
        const slug = req.nextUrl.searchParams.get('slug');
        if (!slug) {
            return NextResponse.json({ message: 'Post slug is required' }, { status: 400 });
        }
        
        // فك التشفير لضمان مطابقة الحروف العربية بالشكل الصحيح
        const cleanSlug = decodeURIComponent(slug);

        const snapshot = await db.collection('posts').where('slug', '==', cleanSlug).limit(1).get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // 🎯 حذف الوثيقة الأولى المستهدفة
        await snapshot.docs[0].ref.delete();

        return NextResponse.json({ message: `Post with slug '${cleanSlug}' deleted successfully` });
    } catch (error) {
        console.error('[DELETE /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to delete post: ${errorMessage}` }, { status: 500 });
    }
}