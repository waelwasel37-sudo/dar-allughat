// ENGINEERING UPGRADE: V8 (Direct Server-Side Rendering via Admin SDK)

import { Suspense } from 'react';
import ProductsView from '../components/ProductsView';
import { Product } from '../lib/types';
// التعديل المستهدف (البند 3): التغيير إلى النسخة المخصصة للسيرفر (Admin SDK)
import { getProducts } from '../lib/data-server'; 

// --- DYNAMIC RENDERING ---
// يضمن جلب بيانات فريش دائماً عند كل زيارة للصفحة
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  let products: Product[] = [];

  try {
    // جلب البيانات مباشرة من السيرفر بدون استدعاء fetch داخلي بطيء
    products = await getProducts();
    console.log('Fetched Products directly via data-server for /products page.');
  } catch (error) {
    console.error("Error loading products for /products page:", error);
    // إرجاع مصفوفة فارغة لحماية الصفحة من الانهيار في حال حدوث خطأ
    products = [];
  }

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>جاري تحميل المنتجات...</div>}>
      <ProductsView products={products} />
    </Suspense>
  );
}
