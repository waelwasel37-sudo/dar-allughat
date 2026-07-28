// app/components/ProductCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react'; 
import { Product } from '../lib/types';
import styles from './ProductCard.module.css';
import AddToCartButton from './AddToCartButton';
import { FaStar } from 'react-icons/fa';

interface ProductCardProps {
  product?: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [productUrl, setProductUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProductUrl(`${window.location.origin}/products/${product?.slug || ''}`);
    }
  }, [product?.slug]);

  if (!product || !product.id) {
    return <div className={styles.cardContainer} aria-hidden="true"></div>;
  }

  // 1. التحقق من حالة المخزون
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK';

  const originalPrice = product.price || 0;
  const discountPercentage = product.discount || 0;
  const hasDiscount = discountPercentage > 0 && originalPrice > 0;
  
  const discountedPrice = hasDiscount
    ? originalPrice - (originalPrice * (discountPercentage / 100))
    : originalPrice;

  // 2. بناء البيانات المنظمة (Schema) لجوجل ميرشنت ومحركات البحث
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name || 'اسم المنتج غير متوفر',
    "image": product.imageUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/placeholder.jpg`,
    "description": product.description || `اشتري ${product.name} بأفضل سعر من مكتبات دار اللغات.`,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "EGP", // العملة الرسمية لمصر لجوجل ميرشنت
      "price": discountedPrice.toFixed(2),
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isOutOfStock 
        ? "https://schema.org/OutOfStock" // كود نفاد المخزون المعتمد لجوجل
        : "https://schema.org/InStock"    // كود توفر المخزون المعتمد لجوجل
    },
    ...(product.averageRating && product.averageRating > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating.toFixed(1),
        "reviewCount": product.ratingCount || 1
      }
    } : {})
  };

  return (
    <div className={styles.cardContainer}>
      {/* 3. حقن كود السكيما خفياً في الصفحة لتقرأه زواحف جوجل ميرشنت */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <Link href={`/products/${product.slug}`} className={styles.cardLink}>
        <div className={styles.card}>
          <div className={styles.imageContainer}>
            {/* 4. طبقة معتمة ورسالة "نفذ المخزون" على الصورة */}
            {isOutOfStock && (
              <div className={styles.outOfStockOverlay}>
                <span>نفذ المخزون</span>
              </div>
            )}
            <Image
              src={product.imageUrl || '/placeholder.jpg'}
              alt={product.name || 'Product image'}
              width={300}
              height={300}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={`${styles.image} ${isOutOfStock ? styles.outOfStockImage : ''}`}
            />
            {hasDiscount && (
              <div className={styles.discountBadge}>
                خصم {Math.round(discountPercentage)}%
              </div>
            )}
          </div>
          <div className={styles.details}>
            <h3 className={styles.name}>{product.name || 'اسم المنتج غير متوفر'}</h3>
            
            {product.averageRating && product.averageRating > 0 && (
                <div className={styles.ratingContainer}>
                    <span className={styles.ratingValue}>{product.averageRating.toFixed(1)}</span>
                    <FaStar color="#ffc107" />
                    <span className={styles.ratingCount}>({product.ratingCount || 0})</span>
                </div>
            )}
            
            <div className={styles.priceContainer}>
              {hasDiscount ? (
                <>
                  <span className={styles.newPrice}>
                    {`${discountedPrice.toFixed(2)} جنيه`}
                  </span>
                  <span className={styles.oldPrice}>
                    {`${originalPrice.toFixed(2)} جنيه`}
                  </span>
                </>
              ) : (
                <span className={styles.currentPrice}>
                  {`${originalPrice.toFixed(2)} جنيه`}
                </span>
              )}
            </div>
            
            {/* 5. عرض رسالة "نفذ المخزون" بدلاً من زر الإضافة للسلة */}
            {isOutOfStock ? (
              <div className={styles.outOfStockLabel}>نفذ المخزون</div>
            ) : (
              <AddToCartButton product={product} />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
