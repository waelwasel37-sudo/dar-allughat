// app/components/ProductCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react'; 
import { Product } from '../lib/types';
import styles from './ProductCard.module.css';
import AddToCartButton from './AddToCartButton';
// import ShareButton from './ShareButton'; // Temporarily remove ShareButton
import { FaStar } from 'react-icons/fa';

interface ProductCardProps {
  product?: Product;
  priority?: boolean; 
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const [productUrl, setProductUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProductUrl(`${window.location.origin}/products/${product?.slug || ''}`);
    }
  }, [product?.slug]);

  if (!product || !product.id) {
    return <div className={styles.cardContainer} aria-hidden="true"></div>;
  }

  const originalPrice = product.price || 0;
  const discountPercentage = product.discount || 0;
  const hasDiscount = discountPercentage > 0 && originalPrice > 0;
  
  const discountedPrice = hasDiscount
    ? originalPrice - (originalPrice * (discountPercentage / 100))
    : originalPrice;

  const shareTitle = `${product.name} - مكتبات دار اللغات`;

  return (
    <div className={styles.cardContainer}>
      {/* <div className={styles.shareIconContainer}>
        {productUrl && (
          <ShareButton
            title={shareTitle}
            text={`شاهد هذا المنتج الرائع: ${product.name}`}
            url={productUrl}
          />
        )}
      </div> */}
      <Link href={`/products/${product.slug}`} className={styles.cardLink}>
        <div className={styles.card}>
          <div className={styles.imageContainer}>
            <Image
              src={product.imageUrl || '/placeholder.jpg'}
              alt={product.name || 'Product image'}
              width={300}
              height={300}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={styles.image}
              priority={priority} 
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
            
            <AddToCartButton product={product} />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
