// ENGINEERING UPGRADE: V9 (Server-Side Search Filtering - Next.js Compliant)

import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProductsView from '../components/ProductsView';
import { Product } from '../lib/types';
import { getProducts } from '../lib/data-server'; 

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const resolvedParams = await searchParams;
    const searchQuery = resolvedParams?.q || '';
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dar-allughat.com';
    const pageUrl = searchQuery 
        ? `${baseUrl}/products?q=${encodeURIComponent(searchQuery)}`
        : `${baseUrl}/products`;
    
    const title = searchQuery
        ? `نتائج البحث عن "${searchQuery}" | مكتبة دار اللغات`
        : 'كل المنتجات | مكتبة دار اللغات بالعبور';
    
    const description = searchQuery
        ? `اكتشف نتائج البحث عن "${searchQuery}" في مكتبة دار اللغات. كتب خارجية، مستلزمات مدرسية، ألعاب تعليمية بأسعار تنافسية.`
        : 'تصفح تشكيلة كاملة من كتب خارجية، كتب مدرسية، كتب أزهرى، كتب تأسيس، قصص أطفال، ألعاب منتسوري، ومستلزمات مدرسية بأسعار تنافسية من مكتبة دار اللغات بالعبور.';

    return {
        title,
        description,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title,
            description,
            url: pageUrl,
            siteName: 'مكتبة دار اللغات',
            type: 'website',
            locale: 'ar_EG',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        robots: searchQuery ? { index: false, follow: true } : undefined,
    };
}

// تحديد نوع الـ Props ليتوافق مع الـ Promise في النسخ الحديثة
interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  let products: Product[] = [];
  
  // 💡 [تحديث أمان]: فك الـ Promise الخاص بالـ searchParams لقراءة قيمة الـ q بأمان
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.q || ''; 

  try {
    const allProducts = await getProducts();
    console.log(`Fetched ${allProducts.length} products directly via data-server.`);

    // 💡 [V9] تنفيذ الفلترة على السيرفر قبل إرسال المكون للواجهة
    if (searchQuery) {
      console.log(`Filtering products by search query: "${searchQuery}"`);
      products = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log(`Found ${products.length} matching products.`);
    } else {
      products = allProducts;
    }

  } catch (error) {
    console.error("Error loading products for /products page:", error);
    products = [];
  }

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>جاري تحميل المنتجات...</div>}>
      <ProductsView products={products} />
    </Suspense>
  );
}
