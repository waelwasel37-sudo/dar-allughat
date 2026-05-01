
// app/components/CategoryFilter.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './CategoryFilter.module.css';
import { Category } from '../lib/types'; // Import the full Category type

// The component now expects the full Category objects.
interface CategoryFilterProps {
  categories: Category[];
}

const CategoryFilter = ({ categories }: CategoryFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryName = searchParams.get('category') || 'الكل';

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryName = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (categoryName === 'الكل') {
      params.delete('category');
    } else {
      params.set('category', categoryName);
    }
    params.delete('page'); // Reset pagination
    router.push(`/?${params.toString()}`);
  };

  // Create the "All" category for the dropdown
  const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨' };
  const displayCategories = [allCategory, ...(categories || [])];

  return (
    <div className={styles.filterContainer}>
      <label htmlFor="category-select" className={styles.label}>اختر قسم:</label>
      <div className={styles.selectWrapper}>
        <select 
          id="category-select"
          value={selectedCategoryName}
          onChange={handleCategoryChange}
          className={styles.select}
        >
          {/* Map over the full Category objects to display name and emoji */}
          {displayCategories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.emoji} {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CategoryFilter;
