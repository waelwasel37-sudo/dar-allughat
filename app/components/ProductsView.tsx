'use client';

import { Product } from '../lib/types';
// 🎯 التصحيح الجوهري: إضافة الأقواس المتعرجة {} لتتوافق مع الـ Named Export وتأمين البناء بنسبة 100%
import { ProductCard } from './ProductCard'; 
import styles from './ProductsView.module.css';

interface ProductsViewProps {
  products: Product[];
  searchQuery?: string;
}

export default function ProductsView({ products, searchQuery }: ProductsViewProps) {

  // 1. حالة عدم العثور على نتائج أثناء استخدام خانة البحث
  if (searchQuery && products.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>لم يتم العثور على منتجات تطابق بحثك "{searchQuery}".</p>
        <p>حاول البحث بكلمات أخرى أو تصفح الأقسام.</p>
      </div>
    );
  }

  // 2. حالة خلو القسم الحالي من أي منتجات معروضة
  if (products.length === 0) {
      return (
      <div className={styles.noResults}>
        <p>لا توجد منتجات متاحة في هذا القسم حالياً.</p>
      </div>
    );
  }

  // 3. شبكة المنتجات الرئيسية وعرض صفين كاملين بسرعة الصاروخ
  return (
    <div className={styles.grid}>
      {/* 🚀 تمرير الـ index لتحديد المنتجات الستة الأولى الحارسة لسرعة الـ LCP */}
      {products.map((product, index) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          isPriority={index < 6} // 🔥 تفعيل الأولوية المشروطة لأول 6 كتب في طابور العرض
        />
      ))}
    </div>
  );
}