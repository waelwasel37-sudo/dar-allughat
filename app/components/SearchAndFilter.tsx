"use client";

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';
import { Category } from '../lib/types';
import SchoolListForm from './SchoolListForm';
import FactorySupplyForm from './FactorySupplyForm'; // 🎯 استيراد المكون الجديد
import { FaSearch } from 'react-icons/fa';

interface SearchAndFilterProps {
    categories: Category[];
}

const SearchAndFilter = ({ categories = [] }: SearchAndFilterProps) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isSchoolFormOpen, setSchoolFormOpen] = useState(false);
    const [isFactoryFormOpen, setFactoryFormOpen] = useState(false); // 🎯 متغير حالة جديد
    const [searchInputValue, setSearchInputValue] = useState(searchParams.get('q') || '');
    
    const selectedCategorySlug = searchParams.get('category') || 'all';

    const executeSearch = (e: React.FormEvent) => {
        e.preventDefault(); 
        const params = new URLSearchParams(searchParams);
        if (searchInputValue.trim()) {
            params.set('q', searchInputValue.trim());
        } else {
            params.delete('q');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    const handleCategoryChange = (categorySlug: string) => {
        const params = new URLSearchParams(searchParams);
        if (categorySlug && categorySlug !== 'all') {
            params.set('category', categorySlug);
        } else {
            params.delete('category');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <>
            <div className={styles.filters}>
                <form 
                    onSubmit={executeSearch} 
                    className={styles.searchForm}
                    data-mcp-tool="product-search"
                >
                    <input
                        type="text"
                        placeholder="ابحث عن كتاب أو أداة..."
                        className={styles.searchInput}
                        value={searchInputValue}
                        onChange={(e) => setSearchInputValue(e.target.value)}
                        data-mcp-input="search-term"
                    />
                    <button 
                        type="submit" 
                        className={styles.searchSubmitButton} 
                        aria-label="بدء البحث عن الكتب والمنتجات"
                    >
                        <FaSearch />
                    </button>
                </form>

                <div className={styles.categories}>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`${styles.categoryButton} ${selectedCategorySlug === category.slug ? styles.active : ''}`}
                            onClick={() => handleCategoryChange(category.slug || '')}
                            aria-label={`عرض قسم ${category.name}`}
                        >
                            <span className={styles.icon}>{category.emoji}</span>
                            {category.name}
                        </button> 
                    ))}

                    <button 
                        className={`${styles.categoryButton} ${styles.schoolListButton}`}
                        onClick={() => setSchoolFormOpen(true)}
                        aria-label="افتح نموذج رفع قائمة الكتب المدرسية الخاصة بطفلك"
                        data-mcp-action="upload-school-list"
                    >
                        <span className={styles.icon}>🎒</span>
                        ارفع قائمة مدرستك
                    </button>

                    {/* 🎯 تحويل الرابط إلى زر يفتح النموذج المنبثق */}
                    <button 
                        className={`${styles.categoryButton} ${styles.factorySupplyButton}`}
                        onClick={() => setFactoryFormOpen(true)} 
                        aria-label="افتح نموذج طلب توريدات للمصانع والمؤسسات"
                        data-mcp-action="factory-supply"
                    >
                        <span className={styles.icon}>🏢</span>
                        توريدات مصانع ومؤسسات
                    </button>
                </div>
            </div>

            {/* 🎯 عرض النموذجين بناءً على متغيرات الحالة الخاصة بهما */}
            <SchoolListForm isOpen={isSchoolFormOpen} onClose={() => setSchoolFormOpen(false)} />
            <FactorySupplyForm isOpen={isFactoryFormOpen} onClose={() => setFactoryFormOpen(false)} />
        </>
    );
};

export default SearchAndFilter;