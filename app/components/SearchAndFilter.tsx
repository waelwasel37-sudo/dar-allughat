
"use client";

import { useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import styles from '@/app/page.module.css';
import { Category } from '../lib/types';
import SchoolListForm from './SchoolListForm'; // Import the modal form
import { FaListAlt } from 'react-icons/fa'; // Import an icon

interface SearchAndFilterProps {
    categories: Category[];
}

const SearchAndFilter = ({ categories = [] }: SearchAndFilterProps) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isFormOpen, setFormOpen] = useState(false); // State to control the modal
    
    const selectedCategory = searchParams.get('category') || 'الكل';

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    const handleCategoryChange = (categoryName: string) => {
        const params = new URLSearchParams(searchParams);
        if (categoryName && categoryName !== 'الكل') {
            params.set('category', categoryName);
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
                            className={`${styles.categoryButton} ${selectedCategory === category.name ? styles.active : ''}`}
                            onClick={() => handleCategoryChange(category.name)}
                        >
                            <span className={styles.icon}>{category.emoji}</span>
                            {category.name}
                        </button> 
                    ))}

                    {/* Add the new button to open the modal */}
                    <button 
                        className={`${styles.categoryButton} ${styles.schoolListButton}`}
                        onClick={() => setFormOpen(true)}
                    >
                        <span className={styles.icon}>🎒</span>
                        ارفع قائمة مدرستك
                    </button>
                </div>
            </div>

            {/* Render the modal form, controlled by isFormOpen state */}
            <SchoolListForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} />
        </>
    );
};

export default SearchAndFilter;
