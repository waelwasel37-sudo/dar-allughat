import { NextRequest, NextResponse } from 'next/server';
// التعديل (البند 5): استيراد admin والدالة الديناميكية getDb بدلاً من المتغير الاستاتيكي db
import admin, { getDb } from '@/app/lib/firebase-admin'; 

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // التعديل (البند 5): جلب نسخة قاعدة البيانات بشكل ديناميكي آمن
  const db = getDb();

  // 1. التحقق من تهيئة قاعدة البيانات لحماية الـ Build والسيرفر
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    // 2. انتظار الـ params (تحديث Next.js 15 الصحيح)
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
    }

    // 3. جلب المقال من Firestore باستخدام الـ slug
    const postsRef = db.collection('posts');
    const snapshot = await postsRef.where('slug', '==', slug).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const postData = doc.data();

    // 4. التعديل (البند 4): حماية خادم المقالات من الانهيار عند قراءة التواريخ بالفحص الذكي
    const post = {
      id: doc.id,
      ...postData,
      createdAt: postData.createdAt instanceof admin.firestore.Timestamp 
        ? postData.createdAt.toDate().toISOString() 
        : new Date(postData.createdAt || Date.now()).toISOString(),
      updatedAt: postData.updatedAt instanceof admin.firestore.Timestamp 
        ? postData.updatedAt.toDate().toISOString() 
        : new Date(postData.updatedAt || Date.now()).toISOString(),
    };

    return NextResponse.json(post);

  } catch (error: any) {
    console.error(`Error in GET /api/posts/[slug]:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
