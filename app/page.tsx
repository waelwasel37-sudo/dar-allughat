import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
// 🎯 تصحيح المسار: استخدام المعرف الصارم @/app/lib لضمان قراءة الملفات بنجاح ومنع الـ Exception
import { initializeAdminApp } from '@/app/lib/firebase-admin'; 
import styles from './page.module.css';
import Hero from './components/Hero';
import { getProducts, getCategories } from '@/app/lib/data-server'; 
import { Product, Category } from '@/app/lib/types';

// 🎯 تصحيح قاتل: إجبار Next.js 15 على تحميل المكون في المتصفح فقط عبر ssr: false لمنع الـ Client exception
const HomeProductsView = nextDynamic(
  () => import('./components/HomeProductsView'),
  { ssr: false }
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadData(): Promise<{ products: Product[], categories: Category[] }> {
  const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
  try {
    // 🔑 التأكد من تهيئة Firebase قبل أي عمليات قراءة من قاعدة البيانات
    await initializeAdminApp();

    const [products, rawCategories] = await Promise.all([
      getProducts(), 
      getCategories() 
    ]);

    const categories = [allCategory, ...(rawCategories?.map((c: Category) => ({...c, slug: c.slug || c.id})) || [])];

    return { 
      products: Array.isArray(products) ? products : [], 
      categories: Array.isArray(categories) ? categories : [allCategory]
    };

  } catch (error) {
    console.error("🔴 Failed to load server data for homepage:", error);
    return { products: [], categories: [allCategory] };
  }
}

export default async function Home() {
  const { products: initialProducts, categories } = await loadData();

  return (
    <main className={styles.main}>
      <Hero />
      
      {/* 🎯 تركنا المكونات معلقة كما طلب المبرمج لعزل الخطأ بالكامل والتأكد من فتح الهيكل أولاً */}
      {/* <Suspense fallback={<div className={styles.loading}>جاري تحميل الفلاتر...</div>}> 
        <SearchAndFilter categories={categories || []} />
      </Suspense> */}
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل المنتجات...</div>}> 
        <HomeProductsView initialProducts={initialProducts || []} categories={categories || []} />
      </Suspense>
    </main>
  );
}