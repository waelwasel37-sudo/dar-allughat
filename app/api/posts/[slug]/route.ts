import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin'; // استيراد قاعدة البيانات

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // 1. التحقق من تهيئة قاعدة البيانات لحماية الـ Build
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    // 2. انتظار الـ params (تحديث Next.js 15)
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
    }

    // 3. جلب المقال الحقيقي من Firestore باستخدام الـ slug
    const postsRef = db.collection('posts');
    const snapshot = await postsRef.where('slug', '==', slug).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const postData = doc.data();

    // 4. تجهيز البيانات للإرسال (تحويل التواريخ لنصوص)
    const post = {
      id: doc.id,
      ...postData,
      createdAt: postData.createdAt?.toDate ? postData.createdAt.toDate().toISOString() : postData.createdAt,
      updatedAt: postData.updatedAt?.toDate ? postData.updatedAt.toDate().toISOString() : postData.updatedAt,
    };

    return NextResponse.json(post);

  } catch (error: any) {
    console.error(`Error in GET /api/posts/[slug]:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
