
import { Suspense } from 'react';
import AdminFactorySupplies from './components/AdminFactorySupplies';

// Revalidate this page every 60 seconds to fetch fresh data
export const revalidate = 60;

export default function AdminFactorySuppliesPage() {
  return (
    <div className="w-full p-4 md:p-8" dir="rtl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">طلبات توريد المصانع والشركات</h1>
        <p className="text-gray-600 mt-2">مراجعة وإدارة طلبات التوريد للمستلزمات المكتبية من الشركات والمصانع.</p>
      </header>
      
      <Suspense fallback={<div className="text-center font-bold p-10">جاري تحميل طلبات التوريد...</div>}>
        <AdminFactorySupplies />
      </Suspense>
    </div>
  );
}
