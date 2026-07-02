
"use client";

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';
import { Category } from '../lib/types';
import SchoolListForm from './SchoolListForm';
import { FaListAlt } from 'react-icons/fa';

interface SearchAndFilterProps {
    categories: Category[];
}

const SearchAndFilter = ({ categories = [] }: SearchAndFilterProps) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isFormOpen, setFormOpen] = useState(false);
    
    const selectedCategorySlug = searchParams.get('category') || 'all';

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
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
                <input
                    type="text"
                    placeholder="ابحث عن كتاب أو أداة..."
                    className={styles.searchInput}
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('q') || ''}
                />
                <div className={styles.categories}>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`${styles.categoryButton} ${selectedCategorySlug === category.slug ? styles.active : ''}`}
                            onClick={() => handleCategoryChange(category.slug || '')}
                        >
                            <span className={styles.icon}>{category.emoji}</span>
                            {category.name}
                        </button> 
                    ))}

                    <button 
                        className={`${styles.categoryButton} ${styles.schoolListButton}`}
                        onClick={() => setFormOpen(true)}
                    >
                        <span className={styles.icon}>🎒</span>
                        ارفع قائمة مدرستك
                    </button>
                </div>
            </div>

            <SchoolListForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} />
        </>
    );
};

export default SearchAndFilter;
