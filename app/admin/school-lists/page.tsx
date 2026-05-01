
import { Suspense } from 'react';
import AdminSchoolLists from './components/AdminSchoolLists';
import styles from '../../page.module.css'; // Re-using some styles

// Revalidate the page every 60 seconds to get fresh data
export const revalidate = 60;

export default function AdminSchoolListsPage() {

  return (
    <div className="w-full p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">طلبات القوائم المدرسية</h1>
        <p className="text-gray-600 mt-2">مراجعة وإدارة طلبات القوائم المدرسية المرسلة من العملاء.</p>
      </header>
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل الطلبات...</div>}>
        <AdminSchoolLists />
      </Suspense>
    </div>
  );
}
