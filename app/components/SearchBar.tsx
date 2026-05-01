// app/components/SearchBar.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { useDebouncedCallback } from 'use-debounce';
import styles from './SearchBar.module.css';

const SearchBar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Debounced search to avoid excessive requests while typing
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300); // 300ms delay

  return (
    <div className={styles.searchContainer}>
      <FaSearch className={styles.searchIcon} />
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
        placeholder="ابحث عن منتج..."
        className={styles.searchInput}
        aria-label="Search products"
      />
    </div>
  );
};

export default SearchBar;
