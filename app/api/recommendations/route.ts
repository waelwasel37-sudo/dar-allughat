import { NextResponse } from 'next/server';
import admin, { db } from '@/app/lib/firebase-admin';
import { Product } from '@/app/lib/types';

// السطر السحري لضمان نجاح الـ Build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // التحقق من وجود قاعدة البيانات لمنع أخطاء TypeScript
    if (!db) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

  try {
    const { categories, excludeSlugs } = await request.json();

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const productsRef = db.collection('products');

    // جلب المنتجات (بحد أقصى 10 تصنيفات كما تدعم Firestore)
    const querySnapshot = await productsRef
      .where('category', 'in', categories.slice(0, 10))
      .limit(20)
      .get();

    const recommendedProducts: Product[] = [];

    querySnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      // تأكد من أن الـ slug موجود وليس ضمن المستبعدين
      const product = { id: doc.id, ...data } as Product;
      
      if (product.slug && !excludeSlugs.includes(product.slug) && recommendedProducts.length < 4) {
        recommendedProducts.push(product);
      }
    });

    return NextResponse.json({ products: recommendedProducts });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ message: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}