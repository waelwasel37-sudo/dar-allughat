// app/components/SearchBar.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect } from 'react';
import styles from './SearchBar.module.css';

const SearchBar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  // 1. إدارة قيمة الإدخال محلياً لجعل الكتابة فورية وسلسة جداً بدون أي تأخير
  const [inputValue, setInputValue] = useState(searchParams.get('q')?.toString() || '');

  // 2. تحديث الـ URLSearchParams بعد 300 ملي ثانية من توقف الكتابة لطلب البيانات
  const debouncedReplace = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  // 3. لتحديث حقل البحث إذا تغير الـ URL من مكان آخر (مثل مسح الفلتر)
  useEffect(() => {
    setInputValue(searchParams.get('q')?.toString() || '');
  }, [searchParams]);

  const handleChange = (term: string) => {
    setInputValue(term); // يظهر الحرف فوراً في الشاشة للعميل
    debouncedReplace(term); // يرسل للـ API بعد الـ debounce
  };

  return (
    <div className={styles.searchContainer}>
      <FaSearch className={styles.searchIcon} />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="ابحث عن منتج..."
        className={styles.searchInput}
        aria-label="Search products"
      />
    </div>
  );
};

export default SearchBar;
