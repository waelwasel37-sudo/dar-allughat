// app/components/ProductModal.tsx
"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/app/lib/types';
import AddToCartButton from './AddToCartButton'; 
import styles from './ProductModal.module.css';
import { FaTimes } from 'react-icons/fa';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!product) return null;

  // Correctly calculate the final price after discount
  const priceAfter = product.price * (1 - (product.discount || 0) / 100);
  const discountPercentage = product.discount || 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        <div className={styles.content}>
          <div className={styles.imageContainer}>
            <Image 
              src={product.imageUrl || '/images/default-book.png'} 
              alt={product.name} 
              layout="fill"
              objectFit="contain"
            />
             {discountPercentage > 0 && (
                <div className={styles.discountBadge}>
                    خصم {Math.round(discountPercentage)}%
                </div>
            )}
          </div>
          <div className={styles.details}>
            <h2 className={styles.productName}>{product.name}</h2>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.priceSection}>
                <div className={styles.priceContainer}>
                    {/* Display the calculated final price */}
                    <span className={styles.currentPrice}>{priceAfter.toFixed(2)} جنيه</span>
                    {/* Display the original price only if there is a discount */}
                    {discountPercentage > 0 && (
                        <span className={styles.oldPrice}>{product.price.toFixed(2)} جنيه</span>
                    )}
                </div>
                {product.stock && product.stock > 0 
                  ? <span className={styles.inStock}>متوفر ({product.stock} قطعة)</span>
                  : <span className={styles.outOfStock}>نفدت الكمية</span>
                }
            </div>

            <div className="mt-6">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
