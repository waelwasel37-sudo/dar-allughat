'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// 1. تحديث بنية البيانات لتشمل السعر وتوسيع الحالات
interface SupplyRequest {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    requiredItems: string;
    status: 'new' | 'in-progress' | 'delivered' | 'cancelled';
    createdAt: string;
    price?: number; // حقل السعر الجديد
}

// قاموس لترجمة الحالات إلى العربية
const statusTranslations: { [key in SupplyRequest['status']]: string } = {
    new: 'جديد',
    'in-progress': 'جاري التجهيز',
    delivered: 'تم التسليم',
    cancelled: 'ملغى',
};

export default function AdminFactorySupplies() {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch('/api/factory-supplies');
                if (!response.ok) {
                    throw new Error('Failed to fetch data.');
                }
                const data = await response.json();
                // التأكد من أن السعر هو رقم صالح
                const formattedData = data.map((req: any) => ({
                    ...req,
                    price: req.price ? Number(req.price) : undefined,
                }));
                setRequests(formattedData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);
    
    // 2. دالة للتعامل مع تحديث البيانات محلياً قبل الحفظ
    const handleRequestChange = (id: string, field: keyof SupplyRequest, value: string | number) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === id ? { ...req, [field]: value } : req
            )
        );
    };

    // 3. دالة لحفظ التغييرات (السعر والحالة) إلى الخادم
    const handleUpdate = async (id: string) => {
        setUpdatingId(id);
        const requestToUpdate = requests.find(req => req.id === id);
        if (!requestToUpdate) return;

        try {
            const response = await fetch(`/api/factory-supplies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: requestToUpdate.status,
                    price: requestToUpdate.price ? Number(requestToUpdate.price) : null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update request.');
            }
            
            alert('تم تحديث الطلب بنجاح!');

        } catch (err: any) {
            setError(err.message);
            alert(`فشل تحديث الطلب: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };
    
    // 4. دالة لتصدير البيانات إلى ملف Excel
    const handleExport = () => {
        const dataToExport = requests.map(req => ({
            'الشركة/المؤسسة': req.companyName,
            'مسؤول التواصل': req.contactPerson,
            'رقم الهاتف': req.phone,
            'المستلزمات المطلوبة': req.requiredItems,
            'التاريخ': new Date(req.createdAt).toLocaleDateString('ar-EG'),
            'الحالة': statusTranslations[req.status],
            'السعر': req.price || 'غير محدد',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'طلبات التوريد');
        
        // تعديل عرض الأعمدة
        worksheet['!cols'] = [
            { wch: 20 }, // الشركة
            { wch: 20 }, // مسؤول التواصل
            { wch: 15 }, // رقم الهاتف
            { wch: 40 }, // المستلزمات
            { wch: 15 }, // التاريخ
            { wch: 15 }, // الحالة
            { wch: 10 }, // السعر
        ];
        
        XLSX.writeFile(workbook, 'طلبات_التوريد.xlsx');
    };


    if (loading) {
        return <div className="text-center font-bold p-10">جاري تحميل طلبات التوريد...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 font-bold p-10">خطأ في التحميل: {error}</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto" dir="rtl">
            <div className="p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">إدارة طلبات توريد المصانع</h2>
                {/* 5. زر تصدير البيانات */}
                <button
                    onClick={handleExport}
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                    تصدير إلى Excel
                </button>
            </div>
            
            {requests.length === 0 ? (
                <div className="text-center bg-gray-50 p-8 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-700">لا توجد طلبات توريد من مصانع أو شركات حالياً.</p>
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200 text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الشركة/المؤسسة</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">مسؤول التواصل</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">المستلزمات المطلوبة</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">التاريخ</th>
                            {/* 6. عناوين الأعمدة الجديدة */}
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">السعر</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{req.companyName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.contactPerson}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <a href={`tel:${req.phone}`} className="text-blue-600 underline font-semibold">{req.phone}</a>
                                </td>
                                <td className="px-6 py-4 max-w-xs whitespace-pre-wrap text-sm text-gray-600 font-medium">
                                    {req.requiredItems || 'لا توجد تفاصيل'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString('ar-EG')}</td>
                                
                                {/* 7. حقل إدخال السعر المصلح برمجياً */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <input
                                        type="number"
                                        placeholder="حدد السعر"
                                        value={req.price || ''}
                                        onChange={(e) => handleRequestChange(req.id, 'price', e.target.value)}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </td>

                                {/* 8. القائمة المنسدلة للحالة */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <select
                                        value={req.status}
                                        onChange={(e) => handleRequestChange(req.id, 'status', e.target.value as SupplyRequest['status'])}
                                        className={`px-2 py-1 font-bold text-xs rounded-md border focus:outline-none ${ 
                                            req.status === 'new' ? 'bg-green-100 text-green-800 border-green-300' :
                                            req.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                            req.status === 'delivered' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                                            'bg-red-100 text-red-800 border-red-300'
                                        }`}
                                    >
                                        <option value="new">جديد</option>
                                        <option value="in-progress">جاري التجهيز</option>
                                        <option value="delivered">تم التسليم</option>
                                        <option value="cancelled">ملغى</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <button
                                        onClick={() => handleUpdate(req.id)}
                                        disabled={updatingId === req.id}
                                        className="bg-blue-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        {updatingId === req.id ? 'جاري الحفظ...' : 'حفظ'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
