// app/components/RelatedProducts.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/app/lib/types';
import styles from './RelatedProducts.module.css';

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (!products || products.length === 0) {
    return null; // Don't render anything if there are no related products
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>منتجات قد تعجبك أيضاً</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className={styles.productCard}>
            <div className={styles.imageWrapper}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                className={styles.productImage}
              />
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productPrice}>{`${product.price.toFixed(2)} جنيه`}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
