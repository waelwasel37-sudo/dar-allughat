'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SchoolListRequest } from '../../../lib/types';
import { trackFbqEvent } from '../../../lib/fpixel'; 
import { FaExternalLinkAlt, FaSync, FaFileExcel, FaTrash, FaPrint } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const statusTranslations: { [key in SchoolListRequest['status']]: string } = {
    new: 'جديد',
    'in-progress': 'قيد التنفيذ',
    completed: 'مكتمل',
};

const AdminSchoolLists = () => {
  const [requests, setRequests] = useState<SchoolListRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // حالة برمجية جديدة لالتقاط طلب المدارس النشط وطباعة بوليصته الحرارية فوراً
  const [activePrintRequest, setActivePrintRequest] = useState<SchoolListRequest | null>(null);

  // دالة جلب الطلبات من السيرفر الأوروبي الموحد
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/school-list');
      if (!response.ok) {
        throw new Error('Failed to fetch data. You may not be logged in as an admin.');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (id: string, newStatus: 'new' | 'in-progress' | 'completed') => {
    try {
        const response = await fetch('/api/school-list', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
        });

        if (!response.ok) {
            throw new Error('Failed to update status.');
        }

        trackFbqEvent('ChangeRequestStatus', { 
            request_id: id,
            new_status: newStatus 
        });

        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));

    } catch (err: any) {
        setError(err.message);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟')) {
        return;
    }
    try {
        const response = await fetch(`/api/school-list?id=${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('فشلت عملية الحذف من السيرفر.');
        }

        setRequests(prev => prev.filter(req => req.id !== id));
        alert('تم حذف الطلب بنجاح.');
    } catch (err: any) {
        alert(err.message);
    }
  };

  // دالة استدعاء طباعة بوليصة الشحن الحرارية المصغرة لطلب ولي الأمر
  const handlePrintLabel = (req: SchoolListRequest) => {
    setActivePrintRequest(req);
    setTimeout(() => {
        window.print();
        setActivePrintRequest(null); 
    }, 300);
  };
  
  const handleExport = () => {
      if (requests.length === 0) {
          alert('لا توجد بيانات للتصدير.');
          return;
      }
      const dataToExport = requests.map(req => ({
          'الاسم الكامل': req.fullName,
          'رقم الهاتف': req.phone,
          'العنوان': req.address,
          'تاريخ الطلب': new Date(req.createdAt).toLocaleDateString('ar-EG'),
          'الحالة': statusTranslations[req.status],
          'رابط الصورة': req.imageUrl,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'طلبات القوائم المدرسية');
      
      worksheet['!cols'] = [
          { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 50 }
      ];
      
      XLSX.writeFile(workbook, 'طلبات_القوائم_المدرسية.xlsx');
  };
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
            {/* واجهة التحكم للشاشات - تختفي تلقائياً عند أمر الطباعة عبر فئة no-print */}
            <div className="no-print">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">طلبات القوائم المدرسية</h1>
                    <div className="flex gap-2">
                        <button 
                            onClick={fetchRequests} 
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            <FaSync className={isLoading ? 'animate-spin' : ''} />
                            <span>تحديث</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            <FaFileExcel />
                            <span>تصدير إلى Excel</span>
                        </button>
                    </div>
                </div>

                {isLoading && <div className="text-center py-8">جاري تحميل الطلبات...</div>}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md"><strong>خطأ:</strong> {error}</div>}

                {!isLoading && !error && requests.length === 0 && (
                    <div className="text-center py-8 bg-white shadow rounded-lg">
                        <p className="text-gray-500">لا توجد أي طلبات حالياً.</p>
                    </div>
                )}

                {!isLoading && !error && requests.length > 0 && (
                    <div className="shadow-md overflow-x-auto rounded-lg">
                        <table className="min-w-full bg-white leading-normal text-right">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">العميل</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">التاريخ</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">صورة القائمة</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">الحالة</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">تغيير الحالة</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p className="text-gray-900 font-semibold">{req.fullName}</p>
                                            {req.phone && <p className="text-gray-600 text-sm font-mono">{req.phone}</p>}
                                            {req.address && <p className="text-gray-500 text-xs mt-1">{req.address}</p>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <a href={req.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium">
                                                عرض الصورة <FaExternalLinkAlt size={12}/>
                                            </a>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                {'new': 'bg-blue-200 text-blue-800',
                                                'in-progress': 'bg-yellow-200 text-yellow-800',
                                                'completed': 'bg-green-200 text-green-800'
                                            }[req.status] || 'bg-gray-200 text-gray-800'}`}>
                                                {statusTranslations[req.status] || req.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm whitespace-nowrap">
                                            <select 
                                                value={req.status} 
                                                onChange={(e) => handleStatusChange(req.id, e.target.value as any)}
                                                className="border border-gray-300 rounded-md p-1 text-sm bg-white cursor-pointer focus:outline-none"
                                            >
                                                <option value="new">جديد</option>
                                                <option value="in-progress">قيد التنفيذ</option>
                                                <option value="completed">مكتمل</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-sm whitespace-nowrap">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => handlePrintLabel(req)}
                                                    title="طباعة ملصق شحن حراري مصغر لهذا الطرد"
                                                    className="bg-purple-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center text-xs gap-1 shadow-sm"
                                                >
                                                    <FaPrint size={12} />
                                                    <span>بوليصة</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(req.id)}
                                                    className="text-red-600 hover:text-red-900 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors font-medium text-xs border border-red-200"
                                                >
                                                    <FaTrash size={12} />
                                                    <span>حذف</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 🖨️ هيكل بوليصة الشحن الحرارية المصغرة (تظهر فقط عند الضغط على زر بوليصة) */}
            {/* ========================================================================= */}
            {activePrintRequest && (
                <div className="print-only text-black p-1 font-mono text-[11px] leading-tight w-full" dir="rtl">
                    <div className="text-center space-y-0.5 border-b border-black pb-2 mb-2">
                        <h2 className="text-sm font-bold tracking-wide">مكتبة دار اللغات</h2>
                        <p className="text-[9px]">طرد شحن: طلبات القوائم المدرسية 🏫</p>
                        <p className="text-[9px] font-mono">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>

                    <div className="space-y-1 text-[10px] mb-2 border-b border-black pb-2">
                        <p><strong>👤 اسم العميل (ولي الأمر):</strong> {activePrintRequest.fullName}</p>
                        <p><strong>📞 هاتف المستلم:</strong> {activePrintRequest.phone || 'غير محدد'}</p>
                        <p><strong>📍 عنوان التوصيل:</strong> {activePrintRequest.address || 'شراء مباشر من الفرع'}</p>
                        <p className="border-t border-dotted border-gray-400 pt-1 leading-tight text-[9px] text-gray-700">
                            * هذا الطرد يحتوي على كتب ومستلزمات القائمة المدرسية الخاصة بالعميل.
                        </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-center pt-2">
                        <div className="text-center font-mono text-xs tracking-widest border border-black px-2 py-1 bg-gray-50 rounded">
                            *{activePrintRequest.id.substring(0, 8).toUpperCase()}*
                        </div>
                        <p className="text-[8px] text-gray-700 mt-1">توصيل سريع - دار اللغات</p>
                    </div>
                </div>
            )}

            {/* ستايل الميديا كويري الصارم لضغط البوليصة لطابعات الإيصالات الحرارية (80mm) */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { 
                        background: white !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        width: 80mm !important; 
                    }
                    @page {
                        margin: 2mm !important; 
                    }
                }
                @media screen {
                    .print-only { display: none !important; }
                }
            `}</style>
        </div>
    </div>
    );
};

export default AdminSchoolLists;
