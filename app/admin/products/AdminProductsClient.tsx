
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

const AdminProductsClient = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingSlugs, setIsUpdatingSlugs] = useState(false);
  const router = useRouter();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error(`فشل في جلب المنتجات: ${response.statusText}`);
      let data: Product[] = await response.json();
      data = data.filter(p => p.slug);
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
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟')) return;
    try {
      const response = await fetch(`/api/products/${slug}`, { method: 'DELETE' });
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

  const handleUpdateAllSlugs = async () => {
    if (!confirm('سيقوم هذا الإجراء بتحديث كل المنتجات القديمة التي ليس لها رابط. هل تريد المتابعة؟')) return;
    setIsUpdatingSlugs(true);
    setError(null);
    try {
      const response = await fetch('/api/update-slugs', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'حدث خطأ غير متوقع.');
      alert(result.message);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      alert(`فشل التحديث: ${err.message}`);
    } finally {
      setIsUpdatingSlugs(false);
    }
  };

  // 🌟 الكود الجديد: دالة الحفظ السريع للمخزون
  const handleQuickStockSave = async (slug: string, newStock: number) => {
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }), // إرسال حقل المخزون فقط
      });

      if (!response.ok) throw new Error('فشل تحديث المخزون');

      // تحديث الحالة محلياً ليعكس التغيير فوراً دون الحاجة لإعادة جلب كل شيء
      setProducts(prevProducts => 
        prevProducts.map(p => p.slug === slug ? { ...p, stock: newStock } : p)
      );

      alert('تم تحديث المخزون وتطهير كاش السيرفر فوراً!');
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
      // في حالة الفشل، أعد جلب البيانات لضمان التناسق
      fetchProducts();
    }
  };

  if (loading) return <div className={styles.loading}>جاري تحميل المنتجات...</div>;
  if (error) return <div className={styles.error}>خطأ: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة المنتجات</h1>
        <div className={styles.headerActions}>
          <button onClick={handleUpdateAllSlugs} className={styles.updateSlugsButton} disabled={isUpdatingSlugs}>
            {isUpdatingSlugs ? 'جاري التحديث...' : 'تحديث كل الروابط القديمة'}
          </button>
          <Link href="/admin/add" className={styles.addButton}>إضافة منتج جديد</Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className={styles.noProducts}>لا توجد منتجات لعرضها.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الاسم</th>
                <th>السعر</th>
                <th>المخزون الحالي</th> {/* 🌟 عمود المخزون الجديد */}
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    {product.imageUrl && <img src={product.imageUrl} alt={product.name} className={styles.productImage} />}
                  </td>
                  <td>{product.name}</td>
                  <td>{formatCurrency(product.price)}</td>
                  {/* 🌟 خانة التحكم بالمخزون الجديدة */}
                  <td>
                    <div className={styles.stockControl}>
                      <input 
                        type="number" 
                        defaultValue={product.stock || 0} 
                        min="0"
                        id={`stock-${product.id}`}
                        className={styles.stockInput}
                      />
                      <button 
                        onClick={() => {
                          const inputEl = document.getElementById(`stock-${product.id}`) as HTMLInputElement;
                          if (inputEl) handleQuickStockSave(product.slug, parseInt(inputEl.value) || 0);
                        }}
                        className={styles.stockSaveButton}
                      >
                        حفظ
                      </button>
                    </div>
                  </td>
                  <td className={styles.actions}>
                    <Link href={`/admin/edit/${product.slug}`} className={styles.editButton}>تعديل</Link>
                    <button onClick={() => handleDelete(product.slug)} className={styles.deleteButton}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href="/admin" className={styles.backButton}>العودة إلى لوحة التحكم</Link>
    </div>
  );
};

export default AdminProductsClient;
