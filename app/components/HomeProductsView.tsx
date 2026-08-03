'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { Product, Category } from '@/app/lib/types';
import ProductsView from './ProductsView';
import styles from './HomeProductsView.module.css';

// 🎯 The magic number: How many products to load each time. Keeps the page fast.
const PRODUCTS_PER_PAGE = 20;

interface HomeProductsViewProps {
  initialProducts: Product[];
  categories: Category[];
}

// The actual component that does the heavy lifting, now optimized!
const HomeProductsViewContent = ({ initialProducts, categories }: HomeProductsViewProps) => {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const selectedCategorySlug = searchParams.get('category') || 'all';

    // 1. Memoize the filtering logic. This is a huge performance win.
    // It runs only when the inputs change, not on every re-render.
    const filteredProducts = useMemo(() => {
        let products = initialProducts;
        if (searchQuery) {
            products = products.filter(product => 
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedCategorySlug && selectedCategorySlug !== 'all') {
            const categoryName = categories.find(c => c.slug === selectedCategorySlug)?.name;
            if (categoryName) {
                products = products.filter(p => p.category === categoryName);
            }
        }
        return products;
    }, [initialProducts, categories, searchQuery, selectedCategorySlug]);

    // 2. State for pagination: how many products are currently visible.
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

    // Reset visible count to the initial value whenever the filters change.
    useEffect(() => {
        setVisibleCount(PRODUCTS_PER_PAGE);
    }, [searchQuery, selectedCategorySlug]);

    // 3. Get the products to display for the current page/visible count.
    const visibleProducts = filteredProducts.slice(0, visibleCount);

    // 4. Group only the VISIBLE products by category. Much more efficient.
    const productsByCategory = useMemo(() => {
        if (selectedCategorySlug !== 'all') {
            const category = categories.find(c => c.slug === selectedCategorySlug);
            if (!category) return {};
            return {
                [category.name]: {
                    emoji: category.emoji,
                    products: visibleProducts
                }
            };
        }
        return visibleProducts.reduce((acc, product) => {
            const categoryName = product.category;
            if (!categoryName) return acc;
            if (!acc[categoryName]) {
                const category = categories.find(c => c.name === categoryName);
                acc[categoryName] = {
                    emoji: category?.emoji || '📦',
                    products: []
                };
            }
            acc[categoryName].products.push(product);
            return acc;
        }, {} as Record<string, { emoji: string; products: Product[] }>);
    }, [visibleProducts, categories, selectedCategorySlug]);

    const categoryOrder = useMemo(() => {
        if (selectedCategorySlug !== 'all') {
            const cat = categories.find(c => c.slug === selectedCategorySlug);
            return cat ? [cat.name] : [];
        }
        const uniqueCategoryNames = [...new Set(visibleProducts.map(p => p.category).filter(Boolean))];
        return uniqueCategoryNames;
    }, [visibleProducts, selectedCategorySlug, categories]);

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + PRODUCTS_PER_PAGE);
    };

    return (
        <div>
            {categoryOrder.length > 0 ? categoryOrder.map(categoryName => {
                const categoryData = productsByCategory[categoryName];
                if (!categoryData || categoryData.products.length === 0) return null;

                return (
                    <div key={categoryName} className={styles.categorySection}>
                        <h2 className={styles.categoryTitle}>
                            {categoryData.emoji} {categoryName}
                        </h2>
                        <ProductsView products={categoryData.products} searchQuery={searchQuery} />
                    </div>
                );
            }) : (
                 <p className={styles.emptyCategoryMessage}>
                    لا توجد منتجات تطابق بحثك حالياً...
                </p>
            )}

            {/* 5. Show "Load More" button only if there are more products to display */}
            {visibleCount < filteredProducts.length && (
                <div className={styles.loadMoreContainer}>
                    <button onClick={handleLoadMore} className={styles.loadMoreButton}>
                        تحميل المزيد ({filteredProducts.length - visibleCount} متبقي)
                    </button>
                </div>
            )}
        </div>
    );
};

// The main component, wrapped in Suspense to prevent errors.
export default function HomeProductsView({ initialProducts, categories }: HomeProductsViewProps) {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', padding: '30px'}}>جاري تصفية المنتجات والأقسام...</div>}>
      <HomeProductsViewContent initialProducts={initialProducts} categories={categories} />
    </Suspense>
  );
}
