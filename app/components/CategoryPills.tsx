
// app/components/CategoryPills.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './CategoryPills.module.css';
import { Category } from '../lib/types';

interface CategoryPillsProps {
  categories: Category[];
}

const CategoryPills = ({ categories }: CategoryPillsProps) => {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all'; // We get the slug from the URL
  const currentQuery = searchParams.get('q');

  return (
    <nav className={styles.container}>
      <ul className={styles.pillList}>
        {categories.map((category) => {
          // 🎯 المقارنة والنشاط بناءً على الـ slug الموحد وليس الاسم
          const isActive = selectedCategory === category.slug;
          
          const query: { q?: string; category?: string } = {};
          if (currentQuery) {
            query.q = currentQuery;
          }
          if (category.slug !== 'all') {
            // 🎯 نرسل الـ slug في الرابط ليكون الرابط نظيفاً وقصيراً وثابتاً!
            query.category = category.slug; 
          }

          return (
            <li key={category.id}>
              <Link href={{ pathname: '/', query }} className={`${styles.pill} ${isActive ? styles.active : ''}`} scroll={false}>
                <span className={styles.emoji}>{category.emoji}</span>
                <span className={styles.name}>{category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryPills;
