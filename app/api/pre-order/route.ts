import { NextResponse } from 'next/server';
import admin, { getDb } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const db = getDb();

  try {
    const { slug, phone } = await request.json(); // استلم slug بدلاً من id

    // Validate input
    if (!slug || !phone) {
      return new NextResponse(JSON.stringify({ message: 'Product slug and phone number are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!/^01[0-2,5]{1}[0-9]{8}$/.test(phone)) {
        return new NextResponse(JSON.stringify({ message: 'Invalid Egyptian phone number format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const preordersCollection = db.collection('preorders');

    // Check for duplicate pre-order
    const snapshot = await preordersCollection
      .where('productSlug', '==', slug) // البحث بالـ slug
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return new NextResponse(JSON.stringify({ message: 'لقد قمت بالفعل بطلب هذا المنتج مسبقًا بهذا الرقم.' }), {
        status: 409, // 409 Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new pre-order document
    const preOrderRef = preordersCollection.doc();
    await preOrderRef.set({
      productSlug: slug, // حفظ الـ slug
      phone: phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new', // to track the pre-order status
    });

    return new NextResponse(JSON.stringify({ 
        message: 'Pre-order submitted successfully', 
        preOrderId: preOrderRef.id 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating pre-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
