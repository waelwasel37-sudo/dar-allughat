'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import styles from './SearchAndFilter.module.css';
import { Category } from '@/app/lib/types';
import SchoolListForm from './SchoolListForm';
import FactorySupplyForm from './FactorySupplyForm';
import CategoryPills from './CategoryPills'; 

interface SearchAndFilterProps {
  categories: Category[];
}

export default function SearchAndFilter({ categories }: SearchAndFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isSchoolListOpen, setSchoolListOpen] = useState(false);
  const [isFactorySupplyOpen, setFactorySupplyOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
      router.push(`/products?${params.toString()}`);
    } else if (pathname === '/products') {
        params.delete('q');
        router.push(`/products?${params.toString()}`);
    }
  };
  
  return (
    <>
      <div className={styles.container}>
        <div className={styles.searchAndActions}>
          
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن كتاب، سبلايز، أو لعبة منتسوري..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <FaSearch />
            </button>
          </form>

          <div className={styles.actionButtons}>
            <button onClick={() => setSchoolListOpen(true)} className={styles.schoolListButton}>
                <span className={styles.schoolListIcon}>🎒</span>
                <span className={styles.schoolListText}>ارفع قائمة مدرستك كتب وسبلايز - Books & Supplies</span>
            </button>
          </div>

        </div>

        {pathname === '/' && categories.length > 0 && (
            <div className={styles.categoriesSection}>
                <CategoryPills categories={categories} />
            </div>
        )}

      </div>

      <SchoolListForm isOpen={isSchoolListOpen} onClose={() => setSchoolListOpen(false)} />
      <FactorySupplyForm isOpen={isFactorySupplyOpen} onClose={() => setFactorySupplyOpen(false)} />
    </>
  );
}
