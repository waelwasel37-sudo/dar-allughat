
import { NextRequest, NextResponse } from 'next/server';
import admin, { db, auth } from '@/app/lib/firebase-admin';
import { Post } from '@/app/lib/types';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET all posts or a single post by slug
export async function GET(req: NextRequest) {
    if (!db) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const slug = req.nextUrl.searchParams.get('slug');
        const postsRef = db.collection('posts');

        if (slug) {
            const snapshot = await postsRef.where('slug', '==', slug).limit(1).get();
            if (snapshot.empty) {
                return NextResponse.json({ message: 'Post not found' }, { status: 404 });
            }
            const doc = snapshot.docs[0];
            const postData = doc.data();
            const post = {
                id: doc.id, 
                ...postData,
                createdAt: postData.createdAt.toDate().toISOString(),
                updatedAt: postData.updatedAt.toDate().toISOString(),
            };
            return NextResponse.json(post);
        } else {
            const snapshot = await postsRef.orderBy('createdAt', 'desc').get();
            const posts = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt.toDate().toISOString(),
                    updatedAt: data.updatedAt.toDate().toISOString(),
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
    if (!auth || !db || !admin) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = await req.json();
        
        const newPost = {
            ...postData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    if (!auth || !db || !admin) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    if (!auth || !db) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

     try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const slug = req.nextUrl.searchParams.get('slug');
        if (!slug) {
            return NextResponse.json({ message: 'Post slug is required' }, { status: 400 });
        }
        
        const snapshot = await db.collection('posts').where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        await snapshot.docs[0].ref.delete();

        return NextResponse.json({ message: `Post with slug '${slug}' deleted successfully` });
    } catch (error) {
        console.error('[DELETE /api/posts] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: `Failed to delete post: ${errorMessage}` }, { status: 500 });
    }
}
