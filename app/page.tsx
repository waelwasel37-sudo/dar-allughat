import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import styles from './page.module.css';
import Hero from './components/Hero';
import SearchAndFilter from './components/SearchAndFilter';
import { getProducts, getCategories } from './lib/data-server'; 
import { Product, Category } from './lib/types';

const HomeProductsView = nextDynamic(() => import('./components/HomeProductsView'));

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadData(): Promise<{ products: Product[], categories: Category[] }> {
  const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
  try {
    const [products, rawCategories] = await Promise.all([
      getProducts().catch(() => []), 
      getCategories().catch(() => []) 
    ]);

    const categories = [allCategory, ...(rawCategories?.map((c: Category) => ({...c, slug: c.slug || c.id})) || [])];

    return { 
      products: Array.isArray(products) ? products : [], 
      categories: Array.isArray(categories) ? categories : [allCategory]
    };

  } catch (error) {
    console.error("Failed to load server data for homepage:", error);
    return { products: [], categories: [allCategory] };
  }
}

export default async function Home() {
  const { products: initialProducts, categories } = await loadData();

  return (
    <main className={styles.main}>
      <Hero />
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل الفلاتر...</div>}>
        <SearchAndFilter categories={categories || []} />
      </Suspense>
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل المنتجات...</div>}>
        <HomeProductsView initialProducts={initialProducts || []} categories={categories || []} />
      </Suspense>
    </main>
  );
}