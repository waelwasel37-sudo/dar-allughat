'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'; // 🎯 حقن السسبنس لحماية المتصفح من الانهيار
import { Product, Category } from '@/app/lib/types';
import ProductsView from './ProductsView';
import styles from './HomeProductsView.module.css';

interface HomeProductsViewProps {
  initialProducts: Product[];
  categories: Category[];
}

// 🎯 المكون الداخلي الصافي الذي يقوم بالعمليات الرياضية والتصفية بأمان
const HomeProductsViewContent = ({ initialProducts, categories }: HomeProductsViewProps) => {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const selectedCategorySlug = searchParams.get('category') || 'all';

    // 1. Filter products based on search query first.
    const searchedProducts = initialProducts.filter(product => 
        searchQuery ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    // 2. Determine which categories to display.
    const categoriesToShow = selectedCategorySlug === 'all' 
        ? categories.filter(c => c.slug !== 'all') 
        : categories.filter(c => c.slug === selectedCategorySlug); 

    return (
        <div>
            {categoriesToShow.map(category => {
                // 3. Find products for this specific category from the searched products.
                const productsForCategory = searchedProducts.filter(
                    p => p.category === category.name
                );

                return (
                    <div key={category.slug} className={styles.categorySection}>
                        <h2 className={styles.categoryTitle}>
                            {category.emoji} {category.name}
                        </h2>
                        
                        {/* 4. Render products or the empty message */}
                        {productsForCategory.length > 0 ? (
                            <ProductsView products={productsForCategory} searchQuery={searchQuery} />
                        ) : (
                            <p className={styles.emptyCategoryMessage}>
                                سيتم إضافة منتجات في هذا القسم قريباً... ✨
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// 🎯 المكون الرئيسي المصدر والمغلف بالـ Suspense بشكل قانوني وصارم يمنع خطأ 306 نهائياً
export default function HomeProductsView({ initialProducts, categories }: HomeProductsViewProps) {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', padding: '30px'}}>جاري تصفية المنتجات والأقسام...</div>}>
      <HomeProductsViewContent initialProducts={initialProducts} categories={categories} />
    </Suspense>
  );
}
