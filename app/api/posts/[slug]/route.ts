import { NextRequest, NextResponse } from 'next/server';
// 🎯 تصحيح: استيراد getDb بشكل صحيح واستيراد firestore للأنواع
import { getDb } from '@/app/lib/firebase-admin'; 
import { firestore } from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // 🎯 تصحيح: استدعاء getDb للحصول على كائن قاعدة البيانات
  const db = getDb();

  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
    }

    const postsRef = db.collection('posts');
    const snapshot = await postsRef.where('slug', '==', slug).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const postData = doc.data();

    const post = {
      id: doc.id,
      ...postData,
      // 🎯 تصحيح: التأكد من وجود firestore.Timestamp
      createdAt: postData.createdAt instanceof firestore.Timestamp 
        ? postData.createdAt.toDate().toISOString() 
        : new Date(postData.createdAt || Date.now()).toISOString(),
      updatedAt: postData.updatedAt instanceof firestore.Timestamp 
        ? postData.updatedAt.toDate().toISOString() 
        : new Date(postData.updatedAt || Date.now()).toISOString(),
    };

    return NextResponse.json(post);

  } catch (error: any) {
    console.error(`Error in GET /api/posts/[slug]:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}