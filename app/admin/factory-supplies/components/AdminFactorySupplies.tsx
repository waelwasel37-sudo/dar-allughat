'use client';

import { useState, useEffect } from 'react';

// البنية البرمجية لبيانات طلب التوريد لشركات مبيعات الجملة
interface SupplyRequest {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    requiredItems: string;
    status: 'new' | 'in-progress' | 'completed';
    createdAt: string;
}

export default function AdminFactorySupplies() {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // 🎯 1. استدعاء البيانات من مسار الـ API الموحد بالجمع لحل مشكلة عدم الظهور
                const response = await fetch('/api/factory-supplies');
                if (!response.ok) {
                    throw new Error('Failed to fetch data.');
                }
                const data = await response.json();
                setRequests(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    if (loading) {
        return <div className="text-center font-bold p-10">جاري تحميل طلبات التوريد...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 font-bold p-10">خطأ في التحميل: {error}</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="text-center bg-gray-50 p-8 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-700">لا توجد طلبات توريد من مصانع أو شركات حالياً.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto" dir="rtl">
            <table className="min-w-full divide-y divide-gray-200 text-right">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">الشركة/المؤسسة</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">مسؤول التواصل</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                        {/* 🎯 2. إضافة عنوان العمود المفقود لعرض تفاصيل الطلب */}
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">المستلزمات المطلوبة</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">التاريخ</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">الحالة</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{req.companyName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.contactPerson}</td>
                            {/* رابط اتصال مباشر برقم هاتف مسؤول المصنع */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <a href={`tel:${req.phone}`} className="text-blue-600 underline font-semibold">
                                    {req.phone}
                                </a> {/* 🎯 تم إصلاح وتقفيل الوسم هنا بنجاح */}
                            </td>
                            {/* 🎯 3. إضافة خلية فرش وعرض المستلزمات المكتبية والورقية المطلوبة بدقة */}
                            <td className="px-6 py-4 max-w-xs whitespace-pre-wrap text-sm text-gray-600 font-medium">
                                {req.requiredItems || 'لا توجد تفاصيل'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString('ar-EG')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${req.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {req.status === 'new' ? 'جديد' : 'قيد المتابعة'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}