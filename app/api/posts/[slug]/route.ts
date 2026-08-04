// app/api/posts/[slug]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getDb, getAdminAuth } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { Post } from '@/app/lib/types';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// دالة توحيد الحروف العربية وتجاوز أخطاء الهمزات ومنع الـ 404
const normalizeArabic = (text: string) => {
    if (!text) return '';
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .trim();
};

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// 🎯 GET: جلب مقال واحد ودعم فتح الروابط بالهمزة أو بدونها بشكل ذكي
export async function GET(request: NextRequest, context: RouteContext) {
  const db = getDb();
  try {
    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug);
    const normalizedTarget = normalizeArabic(cleanSlug);

    const snapshot = await db.collection('posts').get();
    if (snapshot.empty) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // البحث المرن المتسامح مع الحروف العربية والهمزات
    const foundDoc = snapshot.docs.find(doc => {
        const docSlug = doc.data().slug || '';
        return normalizeArabic(docSlug) === normalizedTarget || docSlug === cleanSlug;
    });

    if (!foundDoc) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const data = foundDoc.data();
    const post = {
      id: foundDoc.id,
      ...data,
      createdAt: data.createdAt instanceof firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
      updatedAt: data.updatedAt instanceof firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
    };
    return NextResponse.json(post);
  } catch (error) {
    console.error(`[GET /api/posts/[slug]] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to fetch post: ${errorMessage}` }, { status: 500 });
  }
}

// 🎯 PUT: تحديث المقال عبر الـ Slug بشكل متوافق وآمن تماماً
export async function PUT(request: NextRequest, context: RouteContext) {
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

    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug);

    const updateData: Partial<Post> = await request.json();

    const snapshot = await db.collection('posts').where('slug', '==', cleanSlug).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // 🎯 تصحيح الاستدعاء المباشر للمستند من المصفوفة لمنع أخطاء الـ Terminal
    const postRef = snapshot.docs[0].ref;

    const finalUpdateData = {
      ...updateData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // تنظيف البيانات لمنع أخطاء الـ 400 (Post ID is missing / Changing slug)
    if ('id' in finalUpdateData) delete (finalUpdateData as any).id;
    if ('slug' in finalUpdateData) delete finalUpdateData.slug;

    await postRef.update(finalUpdateData);

    const updatedDoc = await postRef.get();
    const responseData = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[PUT /api/posts/[slug]] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to update post: ${errorMessage}` }, { status: 500 });
  }
}

// 🎯 DELETE: حذف مقال معين نهائياً عبر السلوج
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug);

    const snapshot = await db.collection('posts').where('slug', '==', cleanSlug).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    await snapshot.docs[0].ref.delete();

    return NextResponse.json({ message: `Post with slug '${cleanSlug}' deleted successfully` });
  } catch (error) {
    console.error('[DELETE /api/posts/[slug]] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to delete post: ${errorMessage}` }, { status: 500 });
  }
}