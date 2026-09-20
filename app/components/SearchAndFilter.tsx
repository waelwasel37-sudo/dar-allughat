'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
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
      {/* 🎯 الغلاف الرئيسي المحصن بالتنسيق الداخلي المرن لضمان التناسق الكامل على الموبايل والكمبيوتر */}
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          {/* شريط البحث المطور والمستجيب */}
          <form 
            onSubmit={handleSearch} 
            style={{ 
              display: 'flex', 
              width: '100%', 
              backgroundColor: '#ffffff', 
              borderRadius: '0.75rem', 
              border: '1px solid #d1d5db', 
              overflow: 'hidden',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن كتاب، سبلايز، أو لعبة منتسوري..."
              style={{ 
                flex: 1, 
                padding: '0.75rem 1rem', 
                border: 'none', 
                outline: 'none', 
                fontSize: '0.95rem',
                color: '#1f2937'
              }}
            />
            <button 
              type="submit" 
              style={{ 
                padding: '0.75rem 1.25rem', 
                backgroundColor: '#f3f4f6', 
                border: 'none', 
                color: '#4b5563', 
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <FaSearch />
            </button>
          </form>

          {/* 🎯 زر رفع القوائم الملوكي باللغتين ومحصن داخلياً بالكامل */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
            <button 
              onClick={() => setSchoolListOpen(true)} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#1d4ed8', // الأزرق الملوكي الجاذب للأمهات
                color: '#ffffff',
                padding: '0.85rem 1.5rem',
                borderRadius: '0.75rem',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🎒</span>
              <span>ارفع قائمة مدرستك كتب وسبلايز - Books & Supplies</span>
            </button>
          </div>

        </div>

        {pathname === '/' && categories.length > 0 && (
            <div style={{ marginTop: '1.5rem', width: '100%' }}>
                <CategoryPills categories={categories} />
            </div>
        )}

      </div>

      <SchoolListForm isOpen={isSchoolListOpen} onClose={() => setSchoolListOpen(false)} />
      <FactorySupplyForm isOpen={isFactorySupplyOpen} onClose={() => setFactorySupplyOpen(false)} />
    </>
  );
}