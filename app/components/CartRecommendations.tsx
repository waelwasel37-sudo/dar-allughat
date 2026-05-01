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
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Memoize categories and slugs to prevent unnecessary re-fetches
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

  if (loading) {
    return <div className={styles.loading}>جاري تحميل منتجات مقترحة...</div>;
  }

  // Do not render the component if there are no recommendations to show
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={styles.recommendationsContainer}>
      <h2 className={styles.title}>قد يعجبك أيضًا</h2>
      <div className={styles.carousel}>
        {recommendations.map(product => (
          <div key={product.slug} className={styles.productCard}> {/* Use slug for key */}
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
