'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase-client';
import { FaTrash } from 'react-icons/fa';

// 1. واجهة البيانات لطلبات المصانع والشركات
interface FactorySupply {
    id: string;
    companyName?: string;
    contactPerson?: string;
    phone: string;
    requiredItems?: string;
    status: 'new' | 'approved' | 'rejected';
    createdAt: any;
}

// 2. ترجمة الحالات
const statusTranslations = {
    new: { text: 'جديد', color: 'bg-amber-100 text-amber-800' },
    approved: { text: 'تم التواصل', color: 'bg-green-100 text-green-800' },
    rejected: { text: 'مرفوض', color: 'bg-red-100 text-red-800' }
};

export default function AdminFactorySupplies() {
    const [supplies, setSupplies] = useState<FactorySupply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const suppliesCollection = collection(db, 'factory-supplies');
        const q = query(suppliesCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FactorySupply[];
                setSupplies(data);
                setIsLoading(false);
            },
            (err) => {
                console.error("Firestore error:", err);
                setError("فشل تحميل طلبات التوريد.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: FactorySupply['status']) => {
        await updateDoc(doc(db, 'factory-supplies', id), { status: newStatus });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
        await deleteDoc(doc(db, 'factory-supplies', id));
    };

    if (isLoading) return <div className="text-center p-10 font-bold">جاري تحميل الطلبات...</div>;
    if (error) return <div className="text-center p-10 text-red-600 font-bold">{error}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto" dir="rtl">
            {supplies.length === 0 ? (
                <p className="text-gray-500 text-center py-12">لا توجد طلبات توريد من مصانع أو شركات حالياً.</p>
            ) : (
                <table className="min-w-full table-auto">
                    {/* 🎯 3. أعمدة الجدول المطورة حسب طلبك */}
                    <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6 text-right">اسم الشركة / المؤسسة</th>
                            <th className="py-3 px-6 text-right">المسؤول للتواصل</th>
                            <th className="py-3 px-6 text-right">رقم الهاتف</th>
                            <th className="py-3 px-6 text-right">الطلبات والمستلزمات</th>
                            <th className="py-3 px-6 text-right">تاريخ الطلب</th>
                            <th className="py-3 px-6 text-center">الحالة</th>
                            <th className="py-3 px-6 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    {/* 🎯 4. جسم الجدول المطور لعرض بيانات المصانع والشركات */}
                    <tbody className="text-gray-800 text-sm font-light">
                        {supplies.map((supply) => (
                            <tr key={supply.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6 text-right whitespace-nowrap font-bold text-gray-900">
                                    {supply.companyName || 'بدون اسم مؤسسة'}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    {supply.contactPerson || 'غير مسجل'}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <a href={`tel:${supply.phone}`} className="text-green-600 font-bold underline">
                                        {supply.phone || 'بدون هاتف'}
                                    </a>
                                </td>
                                <td className="py-3 px-6 text-right max-w-sm whitespace-pre-wrap">
                                    {supply.requiredItems || 'لا توجد تفاصيل'}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    {supply.createdAt?.toDate ? new Date(supply.createdAt.toDate()).toLocaleDateString('ar-EG') : 'غير مسجل'}
                                </td>
                                <td className="py-3 px-6 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusTranslations[supply.status]?.color || 'bg-gray-200'}`}>
                                        {statusTranslations[supply.status]?.text || supply.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center flex items-center justify-center gap-2">
                                    <select 
                                        value={supply.status}
                                        onChange={(e) => handleStatusChange(supply.id, e.target.value as FactorySupply['status'])}
                                        className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="new">جديد</option>
                                        <option value="approved">تم التواصل</option>
                                        <option value="rejected">رفض</option>
                                    </select>
                                    <button onClick={() => handleDelete(supply.id)} className="text-red-500 hover:text-red-700 p-1" title="حذف">
                                        <FaTrash />
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