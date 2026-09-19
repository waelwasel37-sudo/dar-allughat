'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SchoolListRequest } from '@/app/lib/types';
import { trackFbqEvent } from '@/app/lib/fpixel'; // Import the tracking helper
import { FaExternalLinkAlt, FaSync } from 'react-icons/fa';

const AdminDashboard = () => {
  const [requests, setRequests] = useState<SchoolListRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // --- META PIXEL EVENT ---
        // Track the admin's action.
        trackFbqEvent('ChangeRequestStatus', { 
            request_id: id,
            new_status: newStatus 
        });
        // ------------------------

        // Update local state to reflect the change immediately
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));

    } catch (err: any) {
        setError(err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">طلبات القوائم المدرسية</h1>
                <button 
                    onClick={fetchRequests} 
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    <FaSync className={isLoading ? 'animate-spin' : ''} />
                    <span>تحديث</span>
                </button>
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
                    <table className="min-w-full bg-white leading-normal">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">العميل</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">التاريخ</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">صورة القائمة</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">الحالة</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">تغيير الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <p className="text-gray-900 font-semibold">{req.fullName}</p>
                                        <p className="text-gray-600 text-sm">{req.phone}</p>
                                        <p className="text-gray-500 text-xs mt-1">{req.address}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-600">{new Date(req.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    <td className="px-5 py-4">
                                        <a href={req.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                                            عرض الصورة <FaExternalLinkAlt size={12}/>
                                        </a>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${{
                                            'new': 'bg-blue-200 text-blue-800',
                                            'in-progress': 'bg-yellow-200 text-yellow-800',
                                            'completed': 'bg-green-200 text-green-800'
                                        }[req.status] || 'bg-gray-200 text-gray-800'}`}>
                                            {{
                                                'new': 'جديد',
                                                'in-progress': 'قيد التنفيذ',
                                                'completed': 'مكتمل'
                                            }[req.status] || req.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <select 
                                            value={req.status} 
                                            onChange={(e) => handleStatusChange(req.id, e.target.value as any)}
                                            className="border border-gray-300 rounded-md p-1"
                                        >
                                            <option value="new">جديد</option>
                                            <option value="in-progress">قيد التنفيذ</option>
                                            <option value="completed">مكتمل</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminDashboard;
