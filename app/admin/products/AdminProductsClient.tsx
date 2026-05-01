
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/app/lib/types';
import styles from './Products.module.css';
import { useRouter } from 'next/navigation';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Main component for the admin products view
const AdminProductsClient = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingSlugs, setIsUpdatingSlugs] = useState(false); // State for the update process
  const router = useRouter();

  // Fetch products from the API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products', {
        cache: 'no-store', 
      });

      if (!response.ok) {
        throw new Error(`فشل في جلب المنتجات: ${response.statusText}`);
      }
      
      let data: Product[] = await response.json();

      // IMPORTANT: We now rely on the API and database to have correct slugs.
      // The fallback `slug: p.slug || p.id` is removed from the client-side
      // to ensure we are correctly seeing the state of the database.
      data = data.filter(p => p.slug); // Only show products that have a slug.

      // Sort products by creation date, newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }
    try {
      const response = await fetch(`/api/products/${slug}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حذف المنتج.');
      }
      await fetchProducts(); 
      alert('تم حذف المنتج بنجاح!');
    } catch (err: any) {
      setError(err.message);
      alert(`خطأ: ${err.message}`);
    }
  };

  // *** NEW FUNCTION TO HANDLE THE SLUG UPDATE PROCESS ***
  const handleUpdateAllSlugs = async () => {
    if (!confirm('سيقوم هذا الإجراء بتحديث كل المنتجات القديمة التي ليس لها رابط URL (slug). هل تريد المتابعة؟')) {
        return;
    }

    setIsUpdatingSlugs(true);
    setError(null);

    try {
        const response = await fetch('/api/update-slugs', {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'حدث خطأ غير متوقع.');
        }

        alert(result.message);
        await fetchProducts(); // Refresh the product list to show new slugs

    } catch (err: any) {
        setError(err.message);
        alert(`فشل التحديث: ${err.message}`);
    } finally {
        setIsUpdatingSlugs(false);
    }
  };
  
  if (loading) {
    return <div className={styles.loading}>جاري تحميل المنتجات...</div>;
  }

  if (error) {
    return <div className={styles.error}>خطأ: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة المنتجات</h1>
        <div className={styles.headerActions}>
            {/* The new button for updating slugs */}
            <button 
                onClick={handleUpdateAllSlugs} 
                className={styles.updateSlugsButton}
                disabled={isUpdatingSlugs}
            >
                {isUpdatingSlugs ? 'جاري التحديث...' : 'تحديث كل الروابط القديمة'}
            </button>
            <Link href="/admin/add" className={styles.addButton}>
                إضافة منتج جديد
            </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className={styles.noProducts}>لا توجد منتجات لعرضها. قم بإضافة منتج جديد.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الاسم</th>
                <th>الرابط (Slug)</th>
                <th>السعر</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    {product.imageUrl &&
                      <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                    }
                  </td>
                  <td>{product.name}</td>
                  {/* Display the slug to confirm it exists */}
                  <td><code>{product.slug}</code></td>
                  <td>{formatCurrency(product.price)}</td>
                  <td className={styles.actions}>
                    <Link href={`/admin/edit/${product.slug}`} className={styles.editButton}>تعديل</Link>
                    <button onClick={() => handleDelete(product.slug)} className={styles.deleteButton}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/admin" className={styles.backButton}>
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
};

export default AdminProductsClient;
