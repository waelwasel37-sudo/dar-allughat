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
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
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
        
        // Return the full new object including the generated ID and timestamps
        const newDoc = await docRef.get();
        const finalData = {
            id: newDoc.id,
            ...newDoc.data()
        };

        return NextResponse.json(finalData, { status: 201 });
    } catch (error) {
        console.error('[POST /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to create post: ${errorMessage}` }, { status: 500 });
    }
}
