'use client';

import Link from 'next/link';
import styles from './AdminLayout.module.css';
import { Providers } from '../providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className={styles.adminLayout} dir="rtl">
        {/* القائمة الجانبية المحدثة للوحة التحكم بمدينة العبور */}
        <aside className={styles.sidebar}>
          <nav>
            <h2 className={styles.sidebarTitle}>🎛️ لوحة التحكم</h2>
            <ul className={styles.sidebarNav}>
              <li>
                <Link href="/admin">📊 الرئيسية</Link>
              </li>
              <li>
                <Link href="/admin/orders">📦 سجل الطلبات</Link>
              </li>
              <li>
                <Link href="/admin/products">📚 المنتجات</Link>
              </li>
              <li>
                <Link href="/admin/add">➕ إضافة منتج</Link>
              </li>
              <li>
                <Link href="/admin/reports">📈 التقارير</Link>
              </li>
              
              {/* 🎯 الروابط المطورة والمؤمنة للوصول الفوري لطلبات عملاء دار اللغات */}
              <li>
                <Link href="/admin/school-lists">🎒 القوائم المدرسية</Link>
              </li>
              <li>
                <Link href="/admin/factory-supplies">🏢 توريدات المصانع</Link>
              </li>
              <li>
                <Link href="/admin/blog">📝 المدونة</Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* منطقة عرض محتوى الصفحات الديناميكية الجارية */}
        <main className={styles.content}>{children}</main>
      </div>
    </Providers>
  );
}
