'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { Product, Category } from '@/app/lib/types';
import ProductsView from './ProductsView';
import styles from './HomeProductsView.module.css';

interface HomeProductsViewProps {
  initialProducts: Product[];
  categories: Category[];
}

const HomeProductsViewContent = ({ initialProducts, categories }: HomeProductsViewProps) => {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const selectedCategorySlug = searchParams.get('category') || 'all';

    // 1. معالجة وتصفية المنتجات بالكامل بناء على البحث والتصنيف المختار
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

    // 2. تجميع كافة المنتجات المصفاة وتصنيفها لعرضها بالكامل دون حجب أي منتج عن غوغل
    const productsByCategory = useMemo(() => {
        if (selectedCategorySlug !== 'all') {
            const category = categories.find(c => c.slug === selectedCategorySlug);
            if (!category) return {};
            return {
                [category.name]: {
                    emoji: category.emoji,
                    products: filteredProducts
                }
            };
        }
        return filteredProducts.reduce((acc, product) => {
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
    }, [filteredProducts, categories, selectedCategorySlug]);

    // 3. ترتيب ظهور الأقسام بشكل مرن وسريع
    const categoryOrder = useMemo(() => {
        if (selectedCategorySlug !== 'all') {
            const cat = categories.find(c => c.slug === selectedCategorySlug);
            return cat ? [cat.name] : [];
        }
        return [...new Set(filteredProducts.map(p => p.category).filter(Boolean))];
    }, [filteredProducts, selectedCategorySlug, categories]);

    return (
        <div className={styles.productsSection}>
            {categoryOrder.length > 0 ? categoryOrder.map(categoryName => {
                const categoryData = productsByCategory[categoryName];
                if (!categoryData || categoryData.products.length === 0) return null;

                return (
                    <div key={categoryName} className={styles.categorySection}>
                        {/* عناوين الأقسام الرئيسية تظهر فوراً في الـ HTML في أوسمة h2 */}
                        <h2 className={styles.categoryTitle}>
                            {categoryData.emoji} {categoryName}
                        </h2>
                        {/* عرض كافة المنتجات التابعة للقسم لتمكين عناكب غوغل من قراءتها فوراً */}
                        <ProductsView products={categoryData.products} searchQuery={searchQuery} />
                    </div>
                );
            }) : (
                 <p className={styles.emptyCategoryMessage}>
                    لا توجد منتجات تطابق بحثك حالياً...
                </p>
            )}
        </div>
    );
};

export default function HomeProductsView({ initialProducts, categories }: HomeProductsViewProps) {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', padding: '30px', color: 'var(--color-primary)'}}>جاري تصفية المنتجات والأقسام...</div>}>
      <HomeProductsViewContent initialProducts={initialProducts} categories={categories} />
    </Suspense>
  );
}