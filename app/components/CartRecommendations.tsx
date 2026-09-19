'use client';

import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/app/lib/types';
import { useCart } from '@/app/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CartRecommendations.module.css';

interface CartRecommendationsProps {
  cartItems: Product[];
}

export default function CartRecommendations({ cartItems }: CartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  // حالة لتتبع المنتجات المقترحة التي لم يرفضها العميل
  const [visibleSlugs, setVisibleSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const stableCategories = useMemo(() => {
    return [...new Set(cartItems.map(item => item.category))];
  }, [cartItems]);

  const stableExcludeSlugs = useMemo(() => {
    return cartItems.map(item => item.slug);
  }, [cartItems]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (stableCategories.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: stableCategories, excludeSlugs: stableExcludeSlugs }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data.products);
        // عند تحميل المنتجات، يتم تسجيل كل الـ slugs كمرئية في البداية
        setVisibleSlugs(data.products.map((p: Product) => p.slug));

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [stableCategories, stableExcludeSlugs]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  // دالة لرفض المنتج المقترح وإزالته فوراً من قائمة المرئيات
  const handleDismiss = (slugToDismiss: string) => {
    setVisibleSlugs(prevSlugs => prevSlugs.filter(slug => slug !== slugToDismiss));
  };

  // فلترة المنتجات لإظهار تلك التي لم يتم رفضها فقط لضمان تحديث الواجهة فوراً
  const productsToShow = recommendations.filter(p => visibleSlugs.includes(p.slug));

  if (loading) {
    return <div className={styles.loading}>جاري تحميل منتجات مقترحة...</div>;
  }

  if (productsToShow.length === 0) {
    return null; // إخفاء المكون بالكامل إذا رفض العميل كافة المنتجات أو لم توجد مقترحات
  }

  return (
    <div className={styles.recommendationsContainer}>
      <h2 className={styles.title}>قد يعجبك أيضًا</h2>
      <div className={styles.carousel}>
        {productsToShow.map(product => (
          <div key={product.slug} className={styles.productCard}>
            {/* زر الإغلاق (X) طائر ومميز لرفض المقترح */}
            <button 
              onClick={() => handleDismiss(product.slug)} 
              className={styles.dismissButton}
              aria-label={`إزالة ${product.name} من المقترحات`}
            >
              &times;
            </button>
            
            <Link href={`/products/${product.slug}`} className={styles.productLink}>
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                width={150}
                height={150}
                className={styles.productImage} 
              />
              <h3 className={styles.productName}>{product.name}</h3>
            </Link>
            
            <div className={styles.price}>{(product.price).toFixed(2)} جنيه</div>
            
            <button onClick={() => handleAddToCart(product)} className={styles.addButton}>
              أضف إلى السلة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}