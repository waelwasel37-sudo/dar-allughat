
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import Hero from './components/Hero';
import SearchAndFilter from './components/SearchAndFilter';
import { getProducts, getCategories } from './lib/data-server'; 
import { Product, Category } from './lib/types';

// Dynamically import the HomeProductsView component
const HomeProductsView = dynamic(() => import('./components/HomeProductsView'));

export const revalidate = 0;

async function loadData(): Promise<{ products: Product[], categories: Category[] }> {
  try {
    const [products, rawCategories] = await Promise.all([
      getProducts(),
      getCategories()
    ]);

    const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
    // Ensure slug is present for all categories, providing a fallback if necessary
    const categories = [allCategory, ...(rawCategories?.map(c => ({...c, slug: c.slug || c.id})) || [])];

    return { 
      products: products || [], 
      categories
    };

  } catch (error) {
    console.error("Failed to load server data for homepage:", error);
    const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
    return { products: [], categories: [allCategory] };
  }
}

export default async function Home() {
  const { products: initialProducts, categories } = await loadData();

  return (
    <main className={styles.main}>
      
      <Hero />
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل الفلاتر...</div>}>
        <SearchAndFilter categories={categories} />
      </Suspense>
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل المنتجات...</div>}>
        {/* We now pass categories to the view and rely on it to show all of them, even if empty */}
        <HomeProductsView initialProducts={initialProducts} categories={categories} />
      </Suspense>

    </main>
  );
}
