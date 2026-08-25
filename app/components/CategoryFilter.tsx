
// app/components/CategoryFilter.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './CategoryFilter.module.css';
import { Category } from '../lib/types';

interface CategoryFilterProps {
  categories: Category[];
}

const CategoryFilter = ({ categories }: CategoryFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 🎯 نقرأ الـ slug المختار من الرابط مباشرة
  const selectedCategorySlug = searchParams.get('category') || 'all';

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categorySlug = e.target.value; // هنا الـ value ستصبح الـ slug
    const params = new URLSearchParams(searchParams.toString());

    if (categorySlug === 'all') {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }
    params.delete('page'); // Reset pagination
    router.push(`/?${params.toString()}`);
  };

  const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
  const displayCategories = [allCategory, ...(categories || [])];

  return (
    <div className={styles.filterContainer}>
      <label htmlFor="category-select" className={styles.label}>اختر قسم:</label>
      <div className={styles.selectWrapper}>
        <select 
          id="category-select"
          value={selectedCategorySlug} // 🎯 القيمة مرتبطة بالـ slug
          onChange={handleCategoryChange}
          className={styles.select}
        >
          {displayCategories.map(cat => (
            <option key={cat.id} value={cat.slug || 'all'}> {/* 🎯 القيمة هنا هي الـ slug */}
              {cat.emoji} {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CategoryFilter;
