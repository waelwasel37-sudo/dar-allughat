// app/admin/layout.tsx
import Link from 'next/link';
import styles from './AdminLayout.module.css';
import { Providers } from '../providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className={styles.adminLayout}>
        <aside className={styles.sidebar}>
          <nav>
            <h2 className={styles.sidebarTitle}>لوحة التحكم</h2>
            <ul className={styles.sidebarNav}>
              <li>
                <Link href="/admin">الرئيسية</Link>
              </li>
              <li>
                <Link href="/admin/orders">سجل الطلبات</Link>
              </li>
              <li>
                <Link href="/admin/products">المنتجات</Link>
              </li>
              <li>
                <Link href="/admin/add">إضافة منتج</Link>
              </li>
              <li>
                <Link href="/admin/reports">التقارير</Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </Providers>
  );
}
