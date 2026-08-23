'use client';

// 🎯 التصحيح الجذري والنهائي: إجبار جذر لوحة التحكم على العمل ديناميكياً لتخطي قفل الـ Build للـ Secret Manager وفتح بوابة التحديث
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import styles from './Admin.module.css';

const AdminPage = () => {
  const { isAdmin, user, loading, logout } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return (
      <div className={styles.loadingContainer}>
        <p>يتم التحقق من صلاحية الدخول...</p>
      </div>
    );
  }

  return (
    <div className={styles.container} dir="rtl">
        <div className={styles.header}>
            <h1 className={styles.title}>لوحة التحكم</h1>
            <div className={styles.authControls}>
                <span className={styles.welcomeMessage}>مرحباً, {user?.email || 'Admin'}</span>
                <button onClick={logout} className={styles.logoutButton}>تسجيل الخروج</button>
            </div>
        </div>

        <p className={styles.description}>أهلاً بك في لوحة التحكم الخاصة بمتجر "مكتبة دار اللغات".</p>

        <div className={styles.cardContainer}>
            <Link href="/admin/blog" className={`${styles.card} ${styles.blogCard}`}>
                <h2>إدارة المدونة</h2>
                <p>كتابة وتعديل المقالات والتحكم بها.</p>
            </Link>

            <Link href="/admin/orders" className={`${styles.card} ${styles.ordersCard}`}>
                <h2>سجل الطلبات</h2>
                <p>عرض جميع الطلبات الواردة عبر واتساب.</p>
            </Link>

            <Link href="/admin/add" className={styles.card}>
                <h2>إضافة منتج جديد</h2>
                <p>إضافة كتاب جديد إلى قائمة المنتجات.</p>
            </Link>

            <Link href="/admin/products" className={styles.card}>
                <h2>إدارة المنتجات</h2>
                <p>تعديل أو حذف المنتجات الحالية.</p>
            </Link>
        </div>
    </div>
  );
};

export default AdminPage;