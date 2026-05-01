
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase-client';
import Link from 'next/link';
import { FaExternalLinkAlt, FaTrash } from 'react-icons/fa';

interface SchoolListRequest {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    imageUrl: string;
    status: 'new' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: any; // Keep as any to handle Firebase Timestamp
}

// --- Translation mapping for statuses ---
const statusTranslations: { [key in SchoolListRequest['status']]: string } = {
    new: 'جديد',
    'in-progress': 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغى',
};

const statusStyles: { [key in SchoolListRequest['status']]: string } = {
    new: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusOptions: SchoolListRequest['status'][] = ['new', 'in-progress', 'completed', 'cancelled'];

export default function AdminSchoolLists() {
    const [requests, setRequests] = useState<SchoolListRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const requestsCollection = collection(db, 'schoolListRequests');
        const q = query(requestsCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, 
            (querySnapshot) => {
                const requestsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as SchoolListRequest));
                setRequests(requestsData);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching school lists:", err);
                setError("فشل في تحميل الطلبات. يرجى تحديث الصفحة.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: SchoolListRequest['status']) => {
        try {
            const requestDocRef = doc(db, 'schoolListRequests', id);
            await updateDoc(requestDocRef, {
                status: newStatus,
                updatedAt: new Date(),
            });
        } catch (err) {
            console.error("Error updating status:", err);
            alert("فشل في تحديث الحالة. الرجاء المحاولة مرة أخرى.");
        }
    };

    // --- New handler for deleting a request ---
    const handleDeleteRequest = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.")) {
            return;
        }
        try {
            const requestDocRef = doc(db, 'schoolListRequests', id);
            await deleteDoc(requestDocRef);
            // The UI will update automatically thanks to the onSnapshot listener
        } catch (err) {
            console.error("Error deleting request:", err);
            alert("فشل في حذف الطلب. الرجاء المحاولة مرة أخرى.");
        }
    };

    if (isLoading) {
        return <div>جاري تحميل الطلبات...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    if (requests.length === 0) {
        return <div className="text-center text-gray-500 py-8">لا توجد طلبات قوائم مدرسية حتى الآن.</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">صورة القائمة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">حذف</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('ar-EG') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.address}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Link href={req.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                    <FaExternalLinkAlt className="inline-block h-5 w-5" />
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                               <select
                                  value={req.status}
                                  onChange={(e) => handleStatusChange(req.id, e.target.value as SchoolListRequest['status'])}
                                  className={`p-1.5 rounded-md text-xs border-0 outline-none ${statusStyles[req.status]}`}
                               >
                                   {statusOptions.map(option => (
                                       <option key={option} value={option}>
                                           {statusTranslations[option]}
                                       </option>
                                   ))}
                               </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                    onClick={() => handleDeleteRequest(req.id)}
                                    className="text-red-600 hover:text-red-800 p-2 rounded-full transition-colors"
                                    title="حذف الطلب"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
