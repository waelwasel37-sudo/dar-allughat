// app/api/orders/[orderId]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// استيراد أدوات الفايربيس الآمنة للاتصال بالقاعدة الصحيحة
import { getSecondaryDb, getAdminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

// 1. 🎯 تم إصلاح دالة PATCH لتعمل بشكل حقيقي وتحدث حالة الطلب في قاعدة البيانات
export async function PATCH(
  request: NextRequest,
  context: RouteContext 
) {
  try {
    const firebaseAuth = getAdminAuth();
    const db = getSecondaryDb();

    // فحص الصلاحيات
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'غير مصرح لك بالدخول.' }, { status: 401 });
    }
    const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
    if (!decodedToken || decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية.' }, { status: 403 });
    }

    const { orderId } = await context.params;
    const { status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'رقم الطلب والحالة الجديدة مطلوبة.' }, { status: 400 });
    }

    // تحديث المستند في Firestore
    await db.collection('orders').doc(orderId).update({ status: status });

    return NextResponse.json({ message: `تم تحديث حالة الطلب ${orderId} إلى ${status}` });

  } catch (error: any) {
    console.error('[PATCH /api/orders/[orderId]]', error);
    return NextResponse.json({ error: `فشل تحديث حالة الطلب: ${error.message}` }, { status: 500 });
  }
}

// 2. 🎯 دالة DELETE التي كتبتها، وهي ممتازة وتعمل كما يجب
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const firebaseAuth = getAdminAuth();
    const db = getSecondaryDb();     

    // فحص الصلاحيات للتأكد من أن المستخدم الحالي هو مسؤول الموقع (Admin)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value; 
    if (!sessionCookie) {
        return NextResponse.json({ error: 'غير مصرح لك بالدخول.' }, { status: 401 });
    }
    
    const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
    if (!decodedToken || decodedToken.role !== 'admin') {
        return NextResponse.json({ error: 'صلاحيات غير كافية لحذف الطلب.' }, { status: 403 });
    }

    // قراءة الـ orderId باستخدام الـ await لتتوافق مع Next.js 15
    const { orderId } = await context.params;

    if (!orderId) {
        return NextResponse.json({ error: 'رقم الطلب مطلوب لإتمام العملية.' }, { status: 400 });
    }

    // حذف مستند الطلب مباشرة من فرع الطلبات (orders) في Firestore
    await db.collection('orders').doc(orderId).delete();

    console.log(`Firebase-Success: Order ${orderId} has been deleted by Admin.`);

    return NextResponse.json({ 
        message: `تم حذف الطلب رقم ${orderId} بنجاح من قاعدة البيانات.` 
    });

  } catch (error: any) {
    console.error('[DELETE /api/orders/[orderId]]', error);
    return NextResponse.json({ 
        error: `فشل حذف الطلب من السيرفر: ${error.message}` 
    }, { status: 500 });
  }
}
