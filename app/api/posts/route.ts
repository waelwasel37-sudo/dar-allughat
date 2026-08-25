import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAdminAuth } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { Post } from '@/app/lib/types';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET all posts
export async function GET(req: NextRequest) {
    const db = getDb();
    try {
        const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
        const posts = snapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            
            // 🎯 توحيد التاريخ: نرسل الكائن يحتوي على seconds و nanoseconds ليطابق الملف الأول وملف الـ [slug]
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof firestore.Timestamp 
                    ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
                    : data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt instanceof firestore.Timestamp 
                    ? { seconds: data.updatedAt.seconds, nanoseconds: data.updatedAt.nanoseconds }
                    : data.updatedAt || new Date().toISOString(),
            };
        });
        return NextResponse.json(posts);
    } catch (error) {
        console.error('[GET /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to fetch posts: ${errorMessage}` }, { status: 500 });
    }
}

// POST a new post
export async function POST(req: NextRequest) {
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

        const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = await req.json();
        
        const newPost = {
            ...postData,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        const docRef = await db.collection('posts').add(newPost);
        
        // 🎯 الحماية من خطأ قراءة السيرفر الفورية للـ serverTimestamp
        const newDoc = await docRef.get();
        const rawData = newDoc.data() || {};
        
        const finalData = {
            id: newDoc.id,
            ...rawData,
            createdAt: rawData.createdAt instanceof firestore.Timestamp 
                ? { seconds: rawData.createdAt.seconds, nanoseconds: rawData.createdAt.nanoseconds }
                : new Date().toISOString(),
            updatedAt: rawData.updatedAt instanceof firestore.Timestamp 
                ? { seconds: rawData.updatedAt.seconds, nanoseconds: rawData.updatedAt.nanoseconds }
                : new Date().toISOString(),
        };

        return NextResponse.json(finalData, { status: 201 });
    } catch (error) {
        console.error('[POST /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to create post: ${errorMessage}` }, { status: 500 });
    }
}