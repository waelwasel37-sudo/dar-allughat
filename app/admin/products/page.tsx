// app/admin/products/page.tsx

// 🎯 التصحيح الجذري النهائي: إجبار صفحة إدارة المنتجات على العمل بنظام ديناميكي كامل لتجاوز قفل الـ SECRET_COOKIE_PASSWORD ومنع فشل الـ Build
export const dynamic = 'force-dynamic';

import AdminProductsClient from './AdminProductsClient';
import { Suspense } from 'react';
import styles from './Products.module.css';

// This is the server-side wrapper page.
// It remains a Server Component for optimal loading.
const AdminProductsPage = () => {
  return (
    // The Suspense boundary allows the rest of the page to render
    // while the client component fetches its data.
    <Suspense fallback={<div className={styles.loading}>جاري تحميل لوحة الإدارة...</div>}>
      <AdminProductsClient />
    </Suspense>
  );
};

export default AdminProductsPage;