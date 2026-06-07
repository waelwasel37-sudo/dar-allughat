'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase-client';
import Link from 'next/link';
import { FaExternalLinkAlt, FaTrash } from 'react-icons/fa';

// 1. تعريف واجهة البيانات لطلبات المدارس
interface SchoolListRequest {
    id: string;
    schoolName: string;
    email: string;
    phone?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // يدعم كائن طابع الوقت أو النص
}

// 2. ترجمة الحالات لغة عربية
const statusTranslations = {
    pending: { text: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
    approved: { text: 'مقبول', color: 'bg-green-100 text-green-800' },
    rejected: { text: 'مرفوض', color: 'bg-red-100 text-red-800' }
};

export default function AdminSchoolLists() {
    const [requests, setRequests] = useState<SchoolListRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 3. جلب البيانات اللحظية من Firestore بنظام التحديث التلقائي
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
                console.error("Firestore loading error:", err);
                setError("فشل في تحميل قوائم المدارس من قاعدة البيانات.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // 4. دالة تحديث حالة الطلب (مقبول / مرفوض)
    const handleStatusChange = async (id: string, newStatus: SchoolListRequest['status']) => {
        try {
            const docRef = doc(db, 'school-lists', id);
            await updateDoc(docRef, { status: newStatus });
        } catch (err) {
            alert("حدث خطأ أثناء تحديث حالة الطلب.");
        }
    };

    // 5. دالة حذف الطلب نهائياً
    const handleDeleteRequest = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
        try {
            const docRef = doc(db, 'school-lists', id);
            await deleteDoc(docRef);
        } catch (err) {
            alert("حدث خطأ أثناء حذف الطلب.");
        }
    };

    // 6. واجهات التحميل والأخطاء
    if (isLoading) return <div className="text-center p-10 font-bold">جاري تحميل البيانات...</div>;
    if (error) return <div className="text-center p-10 text-red-600 font-bold">{error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">إدارة قوائم المدارس</h1>
            
            {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-10">لا توجد طلبات مسجلة حالياً.</p>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-200 text-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-right">اسم المدرسة</th>
                                <th className="px-4 py-3 text-right">البريد الإلكتروني</th>
                                <th className="px-4 py-3 text-right">تاريخ الطلب</th>
                                <th className="px-4 py-3 text-right">الحالة</th>
                                <th className="px-4 py-3 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{req.schoolName}</td>
                                    <td className="px-4 py-3 text-gray-600">{req.email}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {/* 🚀 معالجة عرض طابع الوقت الآمن لمنع تدمير الـ Render */}
                                        {req.createdAt?.toDate 
                                            ? new Date(req.createdAt.toDate()).toLocaleDateString('ar-EG') 
                                            : req.createdAt 
                                                ? new Date(req.createdAt).toLocaleDateString('ar-EG') 
                                                : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${statusTranslations[req.status]?.color}`}>
                                            {statusTranslations[req.status]?.text}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center flex items-center justify-center gap-3">
                                        <select 
                                            value={req.status}
                                            onChange={(e) => handleStatusChange(req.id, e.target.value as SchoolListRequest['status'])}
                                            className="border rounded px-2 py-1 text-sm bg-white"
                                        >
                                            <option value="pending">تعليق</option>
                                            <option value="approved">قبول</option>
                                            <option value="rejected">رفض</option>
                                        </select>
                                        
                                        <button 
                                            onClick={() => handleDeleteRequest(req.id)}
                                            className="text-red-600 hover:text-red-900 p-1"
                                            title="حذف"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}