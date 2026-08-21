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

  // 2. بناء البيانات المنظمة (Schema) المحدثة لمطابقة زواحف جوجل ميرشنت فوراً
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
      // ✅ المسارات الكاملة والمصححة لضمان القبول الفوري في جوجل ميرشنت
      "itemCondition": "https://schema.org/NewCondition", 
      "availability": isOutOfStock 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock"    
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
              width={240} // 🚀 تنحيف: تقليص الحجم الافتراضي لتسريع الـ LCP ومنع هدر الكيلوبايتات [4.1]
              height={240}
              sizes="(max-width: 768px) 50vw, 240px" // ضبط الأبعاد المتجاوبة بدقة لشاشات الموبايل [4.1]
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
            
            {/* 🎯 إضافة تفاصيل/وصف المنتج المصغر بشكل ذكي وأنيق يقتطع سطرين فقط */}
            {product.description && (
              <p className={styles.shortDescription} style={{
                fontSize: '13px',
                color: '#666',
                margin: '4px 0 8px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2, // عرض سطرين كحد أقصى وثم ثلاث نقاط تلقائياً (...)
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.4'
              }}>
                {product.description}
              </p>
            )}

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
