import { NextRequest, NextResponse } from 'next/server';
// 🎯 تصحيح: استيراد admin و getDb بشكل صحيح
import { getDb, admin } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// 🎯 تحديث: تغيير نوع الطلب إلى NextRequest للاستفادة من الميزات الحديثة
export async function POST(request: NextRequest) {
  // 🎯 تصحيح: استدعاء getDb للحصول على كائن قاعدة البيانات
  const db = await getDb();

  try {
    const { slug, phone } = await request.json();

    // Validate input
    if (!slug || !phone) {
      return NextResponse.json(
        { message: 'Product slug and phone number are required' },
        { status: 400 }
      );
    }

    if (!/^01[0-2,5]{1}[0-9]{8}$/.test(phone)) {
        return NextResponse.json(
          { message: 'Invalid Egyptian phone number format' },
          { status: 400 }
        );
    }

    const preordersCollection = db.collection('preorders');

    // Check for duplicate pre-order
    const snapshot = await preordersCollection
      .where('productSlug', '==', slug)
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { message: 'لقد قمت بالفعل بطلب هذا المنتج مسبقًا بهذا الرقم.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Create new pre-order document
    const preOrderRef = preordersCollection.doc();
    await preOrderRef.set({
      productSlug: slug,
      phone: phone,
      // 🎯 تصحيح: التأكد من أن الطابع الزمني للسيرفر يعمل بشكل صحيح
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
    });

    return NextResponse.json(
      {
        message: 'Pre-order submitted successfully',
        preOrderId: preOrderRef.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating pre-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}