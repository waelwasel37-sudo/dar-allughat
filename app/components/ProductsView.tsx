'use client';

import { Product } from '../lib/types';
import ProductCard from './ProductCard';
import styles from './ProductsView.module.css';

interface ProductsViewProps {
  products: Product[];
  searchQuery?: string;
}

export default function ProductsView({ products, searchQuery }: ProductsViewProps) {

  if (searchQuery && products.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>لم يتم العثور على منتجات تطابق بحثك \"{searchQuery}\".</p>
        <p>حاول البحث بكلمات أخرى أو تصفح الأقسام.</p>
      </div>
    );
  }

  if (products.length === 0) {
      return (
      <div className={styles.noResults}>
        <p>لا توجد منتجات متاحة في هذا القسم حالياً.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
        />
      ))}
    </div>
  );
}
