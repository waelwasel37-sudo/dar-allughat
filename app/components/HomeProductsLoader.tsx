'use client';

import nextDynamic from 'next/dynamic';
import { Product, Category } from '@/app/lib/types';

// 🎯 الحل الصحيح: استخدام ssr: false داخل مكون عميل (Client Component)
const HomeProductsView = nextDynamic(
  () => import('./HomeProductsView'),
  { 
    ssr: false,
    loading: () => <div style={{textAlign: 'center', padding: '50px'}}>جاري تحميل المنتجات...</div> 
  }
);

interface HomeProductsLoaderProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function HomeProductsLoader({ initialProducts, categories }: HomeProductsLoaderProps) {
  // 🎯 يتم استدعاء المكون الديناميكي هنا، في بيئة المتصفح فقط
  return <HomeProductsView initialProducts={initialProducts} categories={categories} />;
}
