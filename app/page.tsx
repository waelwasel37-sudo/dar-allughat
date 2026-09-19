import { Suspense } from 'react';
import styles from './page.module.css';
import Hero from './components/Hero';
import SearchAndFilter from './components/SearchAndFilter'; 
import { getProducts, getCategories } from '@/app/lib/data-server'; 
import { Product, Category } from '@/app/lib/types';
import HomeProductsView from './components/HomeProductsView';

async function loadData(): Promise<{ products: Product[], categories: Category[] }> {
  const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
  try {
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
      
      {/* عنوان الـ H1 الرئيسي للموقع مخفي برمجياً بطريقة صديقة وآمنة تماماً لـ غوغل */}
      <h1 className={styles.visuallyHidden}>مكتبة دار اللغات بالعبور - كتب خارجية وألعاب منتسوري ومستلزمات مدرسية وسبلايز</h1>

      {/* قسم البنر الترحيبي الرئيسي */}
      <Hero />
      
      {/* شريط الأقسام والتصنيفات الذكي */}
      <Suspense fallback={<div className={styles.loading}>جاري تحميل أقسام المكتبة...</div>}> 
        <SearchAndFilter categories={categories || []} />
      </Suspense>
      
      {/* عرض المنتجات - تم تمرير كافة المنتجات المستدعاة من السيرفر دفعة واحدة للأرشفة الفورية للـ 6 منتجات الأولى */}
      <HomeProductsView initialProducts={initialProducts || []} categories={categories || []} />

      {/* ✂️ تم قنص وبتر قسم الـ servicesSection المكرر من هنا كلياً لحسم عطل التداخل البصري وتخفيف حجم الصفحة الافتتاحية */}

    </main>
  );
}