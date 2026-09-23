'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSearch, FaBuilding } from 'react-icons/fa';
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
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          <form 
            onSubmit={handleSearch} 
            style={{ 
              display: 'flex', 
              width: '100%', 
              backgroundColor: 'var(--color-background)', 
              borderRadius: 'var(--border-radius-md)', 
              border: '1px solid var(--color-border)', 
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
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
                backgroundColor: 'transparent',
                color: 'var(--color-text-base)'
              }}
            />
            <button 
              type="submit" 
              style={{ 
                padding: '0.75rem 1.25rem', 
                backgroundColor: 'var(--color-accent)', 
                border: 'none', 
                color: 'var(--color-text-muted)', 
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <FaSearch />
            </button>
          </form>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '0.75rem', 
              width: '100%',
              marginTop: '0.25rem'
            }}
            className="sm:grid-cols-2"
          >
            <button 
              onClick={() => setSchoolListOpen(true)} 
              className="btn-school-list"
            >
              <span style={{ fontSize: '1.2rem' }}>🎒</span>
              <span>ارفع قائمة مدرستك كتب وسبلايز - Books & Supplies</span>
            </button>

            <button 
              onClick={() => setFactorySupplyOpen(true)} 
              className="btn-factory-supplies"
            >
              <span style={{ fontSize: '1.2rem' }}>🏢</span>
              <span>توريدات مصانع ومؤسسات - Corporate Supplies</span>
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
