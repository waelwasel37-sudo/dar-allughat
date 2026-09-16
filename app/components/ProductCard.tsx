'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react'; 
import { Product } from '../lib/types';
import styles from './ProductCard.module.css';
import AddToCartButton from './AddToCartButton';
import { FaStar } from 'react-icons/fa';
import ShareButton from './ShareButton';

interface ProductCardProps {
  product?: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [productUrl, setProductUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && product?.slug) {
      setProductUrl(`${window.location.origin}/products/${product.slug}`);
    }
  }, [product?.slug]);

  if (!product || !product.id) {
    return <div className={styles.cardContainer} aria-hidden="true"></div>;
  }

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const originalPrice = product.price || 0;
  const discountPercentage = product.discount || 0;
  const hasDiscount = discountPercentage > 0 && originalPrice > 0;
  
  const discountedPrice = hasDiscount
    ? originalPrice - (originalPrice * (discountPercentage / 100))
    : originalPrice;

  // 🎯 حل ثغرة أرشفة السيرفر: بناء رابط ديناميكي احتياطي يقرأه السيرفر وغوغل فوراً بدون انتظار المتصفح
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : 'https://darallughat.com';
  const fallbackProductUrl = `${baseDomain}/products/${product.slug}`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name || 'منتج مكتبة دار اللغات',
    "image": product.imageUrl || `${baseDomain}/placeholder.jpg`,
    "description": product.description || `اشتري ${product.name || 'هذا المنتج'} بأفضل سعر وتوصيل سريع من مكتبة دار اللغات بالعبور.`,
    "offers": {
      "@type": "Offer",
      "url": productUrl || fallbackProductUrl, // استخدام الرابط الاحتياطي لغوغل
      "priceCurrency": "EGP", 
      "price": discountedPrice.toFixed(2),
      "priceValidUntil": "2027-12-31",
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

  // 🎯 صياغة نص بديل غني بالكلمات المفتاحية ومناسب لكل منتج بشكل ديناميكي
  const imageAltText = product.name 
    ? `كتاب أو لعبة ${product.name} - متجر مكتبة دار اللغات بالعبور`
    : 'أدوات مكتبية ومستلزمات مدرسية - مكتبة دار اللغات';

  return (
    <div className={styles.cardContainer}>
      {/* حقن السكيما مباشرة لغوغل في السيرفر */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <Link href={`/products/${product.slug}`} className={styles.cardLink}>
        <div className={styles.card}>
          <div className={styles.imageContainer}>
            {isOutOfStock && (
              <div className={styles.outOfStockOverlay}>
                <span>نفذ المخزون</span>
              </div>
            )}
            {/* 🎯 تعديل الـ alt ليكون ديناميكياً وعربياً بالكامل لأرشفة الصور */}
            <Image
              src={product.imageUrl || '/placeholder.jpg'}
              alt={imageAltText}
              width={240} 
              height={240}
              sizes="(max-width: 768px) 50vw, 240px" 
              className={`${styles.image} ${isOutOfStock ? styles.outOfStockImage : ''}`}
            />
            {hasDiscount && (
              <div className={styles.discountBadge}>
                خصم {Math.round(discountPercentage)}%
              </div>
            )}
          </div>
          <div className={styles.details}>
            {/* عنوان المنتج في وسم h3 ثابت وواضح لعناكب الزحف */}
            <h3 className={styles.name}>{product.name || 'اسم المنتج غير متوفر'}</h3>
            
            {product.description && (
              <p className={styles.shortDescription}>
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
            
            {isOutOfStock ? (
              <button 
                disabled 
                className={styles.disabledButton}
              >
                نفد المخزون
              </button>
            ) : (
              <AddToCartButton product={product} />
            )}
          </div>
        </div>
      </Link>
      
      {!isOutOfStock && (
         <div className={styles.shareEarnButtonWrapper}>
            <ShareButton 
                title={product.name} 
                text={`شاهد هذا المنتج المميز: ${product.name}`} 
                url={productUrl || fallbackProductUrl} 
            />
        </div>
      )}
    </div>
  );
};