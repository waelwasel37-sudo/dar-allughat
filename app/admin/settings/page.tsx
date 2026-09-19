'use client';

// 🎯 التصحيح الجذري والنهائي: إجبار صفحة الإعدادات على العمل ديناميكياً لتجاوز قفل الـ SECRET_COOKIE_PASSWORD ونجاح بناء المتجر
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

const AdminSettingsPage = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateSlugs = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/update-slugs');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'An unknown error occurred.');
      }

      setMessage(result.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return <p className="p-6 text-center text-red-500 font-bold">You do not have permission to view this page.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">إعدادات إدارية</h1>
      <p className="text-gray-600 mb-6">استخدم الأدوات التالية بحذر لإجراء عمليات الصيانة على مستوى الموقع.</p>
      
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-700">تحديث روابط المنتجات (Slugs)</h2>
        <p className="text-sm text-gray-500 mt-2 mb-4">
          انقر على هذا الزر للمرور على جميع المنتجات في قاعدة البيانات وتحديث المنتجات التي لا تحتوي على رابط ودود (slug).
          هذه العملية آمنة ويمكن تشغيلها أكثر من مرة.
        </p>
        
        <button
          onClick={handleUpdateSlugs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'جاري التحديث...' : 'بدء تحديث الروابط'}
        </button>

        {message && <p className="mt-4 text-green-600 bg-green-100 p-3 rounded-md">{message}</p>}
        {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </div>
    </div>
  );
};

export default AdminSettingsPage;