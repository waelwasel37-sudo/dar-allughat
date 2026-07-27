'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase-client';
import { FaTrash } from 'react-icons/fa';

// 🎯 1. تحديث واجهة البيانات لتعكس حقول طلبات أولياء الأمور الفعلية
interface SchoolListRequest {
    id: string;
    fullName?: string; // اسم ولي الأمر
    name?: string; // حقل احتياطي للاسم
    phone: string; // رقم هاتف ولي الأمر
    address?: string; // عنوان ولي الأمر
    imageUrl?: string; // رابط صورة القائمة المرفوعة
    image?: string; // حقل احتياطي لرابط الصورة
    status: 'new' | 'approved' | 'rejected';
    createdAt: any; 
}

// 2. تحديث ترجمة الحالات
const statusTranslations = {
    new: { text: 'جديد', color: 'bg-amber-100 text-amber-800' },
    approved: { text: 'مقبول', color: 'bg-green-100 text-green-800' },
    rejected: { text: 'مرفوض', color: 'bg-red-100 text-red-800' }
};

export default function AdminSchoolLists() {
    const [requests, setRequests] = useState<SchoolListRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const requestsCollection = collection(db, 'school-lists');
        const q = query(requestsCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as SchoolListRequest[];
                setRequests(data);
                setIsLoading(false);
            }, 
            (err) => {
                console.error("Firestore error:", err);
                setError("فشل تحميل الطلبات.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: SchoolListRequest['status']) => {
        const docRef = doc(db, 'school-lists', id);
        await updateDoc(docRef, { status: newStatus });
    };

    const handleDeleteRequest = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
        const docRef = doc(db, 'school-lists', id);
        await deleteDoc(docRef);
    };

    if (isLoading) return <div className="text-center p-10 font-bold">جاري تحميل الطلبات...</div>;
    if (error) return <div className="text-center p-10 text-red-600 font-bold">{error}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto" dir="rtl">
            {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-12">لا توجد طلبات قوائم مدرسية حالياً.</p>
            ) : (
                <table className="min-w-full table-auto">
                    {/* 🎯 3. تحديث أعمدة الجدول لتناسب بيانات أولياء الأمور */}
                    <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6 text-right">اسم ولي الأمر</th>
                            <th className="py-3 px-6 text-right">رقم الهاتف</th>
                            <th className="py-3 px-6 text-right">العنوان</th>
                            <th className="py-3 px-6 text-right">صورة القائمة</th>
                            <th className="py-3 px-6 text-right">تاريخ الطلب</th>
                            <th className="py-3 px-6 text-center">الحالة</th>
                            <th className="py-3 px-6 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    {/* 🎯 4. تحديث جسم الجدول لعرض البيانات الجديدة بشكل عملي */}
                    <tbody className="text-gray-800 text-sm font-light">
                        {requests.map((list) => (
                            <tr key={list.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6 text-right whitespace-nowrap font-medium">
                                    {list.fullName || list.name || 'بدون اسم'}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <a href={`tel:${list.phone}`} className="text-blue-600 underline font-semibold">
                                        {list.phone || 'بدون هاتف'}
                                    </a>
                                </td>
                                <td className="py-3 px-6 text-right max-w-xs whitespace-pre-wrap">
                                    {list.address || 'بدون عنوان'}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    {list.imageUrl || list.image ? (
                                        <a href={list.imageUrl || list.image} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-3 py-1 text-xs font-bold text-blue-700 transition-all">
                                            📂 فتح الصورة
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-xs">لا توجد</span>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    {list.createdAt?.toDate ? new Date(list.createdAt.toDate()).toLocaleDateString('ar-EG') : 'غير مسجل'}
                                </td>
                                <td className="py-3 px-6 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusTranslations[list.status]?.color || 'bg-gray-200'}`}>
                                        {statusTranslations[list.status]?.text || list.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center flex items-center justify-center gap-2">
                                    <select 
                                        value={list.status}
                                        onChange={(e) => handleStatusChange(list.id, e.target.value as SchoolListRequest['status'])}
                                        className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="new">جديد</option>
                                        <option value="approved">قبول</option>
                                        <option value="rejected">رفض</option>
                                    </select>
                                    <button onClick={() => handleDeleteRequest(list.id)} className="text-red-500 hover:text-red-700 p-1" title="حذف">
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