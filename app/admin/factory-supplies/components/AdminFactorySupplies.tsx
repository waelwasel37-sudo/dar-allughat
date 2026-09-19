'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
// 🌟 استيراد الأيقونات اللازمة لزر بوليصة الشحن والـ Barcode بصرياً
import { FaPrint, FaSpinner, FaFileExcel, FaTrash } from 'react-icons/fa';

interface SupplyRequest {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    requiredItems: string;
    status: 'new' | 'in-progress' | 'delivered' | 'cancelled';
    createdAt: string;
    price?: number;
    address?: string; // 🌟 إضافة حقل العنوان لطباعته على البوليصة
    taxNumber?: string; // 🌟 إضافة السجل الضريبي الاختياري للشركات
}

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
    const [deletingId, setDeletingId] = useState<string | null>(null); 

    // 🌟 حالة جديدة لحفظ طلب التوريد النشط المراد طباعة بوليصته الحرارية فوراً
    const [activePrintRequest, setActivePrintRequest] = useState<SupplyRequest | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch('/api/factory-supplies');
                if (!response.ok) {
                    throw new Error('Failed to fetch data.');
                }
                const data = await response.json();
                const formattedData = data.map((req: any) => ({
                    ...req,
                    price: req.price ? Number(req.price) : undefined,
                    address: req.address || 'عنوان الشركة الرئيسي', // قيم افتراضية للبوليصة
                    taxNumber: req.taxNumber || null
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
    
    const handleRequestChange = (id: string, field: keyof SupplyRequest, value: any) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === id ? { ...req, [field]: field === 'price' ? (value ? Number(value) : undefined) : value } : req
            )
        );
    };

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
            alert(`فشل تحديث الطلب: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('هل أنت متأكد تماماً من حذف طلب التوريد هذا؟ لا يمكن التراجع عن الإجراء.')) return;
        
        setDeletingId(id);
        try {
            const response = await fetch(`/api/factory-supplies/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete request.');
            }

            setRequests(prev => prev.filter(req => req.id !== id));
            alert('تم حذف طلب التوريد بنجاح!');
        } catch (err: any) {
            alert(`فشل الحذف: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    // 🌟 دالة معالجة واستدعاء طباعة بوليصة الشحن الحرارية المصغرة فورياً للشركة
    const handlePrintLabel = (req: SupplyRequest) => {
        setActivePrintRequest(req);
        setTimeout(() => {
            window.print();
            setActivePrintRequest(null); // إعادة التصفير بعد انتهاء عملية أمر الطباعة
        }, 300);
    };

    // 📊 دالة تصدير شيت الـ Excel المصححة والمقفلة بإحكام داخل دالتها
    const handleExport = () => {
        if (requests.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }
        
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
        XLSX.utils.book_append_sheet(workbook, worksheet, 'طلبات توريد المصانع');
        
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
        ];
        
        XLSX.writeFile(workbook, 'طلبات_التوريد.xlsx');
    }; 

    if (loading) {
        return <div className="text-center font-bold p-10 flex justify-center items-center gap-2"><FaSpinner className="animate-spin text-blue-600" /> جاري تحميل طلبات التوريد...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 font-bold p-10">خطأ في التحميل: {error}</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto" dir="rtl">
            {/* واجهة جدول التحكم للشاشات - تختفي تلقائياً عند أمر الطباعة عبر فئة no-print المضافة حديثاً */}
            <div className="no-print">
                <div className="p-4 flex justify-between items-center border-b">
                    <h2 className="text-xl font-bold">إدارة طلبات توريد المصانع</h2>
                    <button
                        onClick={handleExport}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <FaFileExcel />
                        <span>تصدير إلى Excel</span>
                    </button>
                </div>
                
                {requests.length === 0 ? (
                    <div className="text-center bg-gray-50 p-8 rounded-lg border border-gray-200 m-4">
                        <p className="font-semibold text-gray-700">لا توجد طلبات توريد من مصانع أو شركات حالياً.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-right">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">الشركة/المؤسسة</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">مسؤول التواصل</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">رقم الهاتف</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">المستلزمات المطلوبة</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">التاريخ</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">السعر</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">الحالة</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
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
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <input
                                            type="number"
                                            placeholder="حدد السعر"
                                            value={req.price || ''}
                                            onChange={(e) => handleRequestChange(req.id, 'price', e.target.value)}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                        />
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleRequestChange(req.id, 'status', e.target.value)}
                                            className={`px-2 py-1 font-bold text-xs rounded-md border focus:outline-none cursor-pointer ${ 
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
                                    
                                    {/* أزرار الإجراءات المتكاملة المحقون فيها زر طباعة البوليصة الحرارية الصغير */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                        <div className="flex justify-center items-center gap-1.5">
                                            
                                            {/* 🖨️ زر طباعة بوليصة شحن طرد المصنع الجديد */}
                                            <button
                                                onClick={() => handlePrintLabel(req)}
                                                title="طباعة ملصق شحن حراري مصغر لهذا الطرد"
                                                className="bg-purple-600 text-white font-bold py-1.5 px-2.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-xs gap-1"
                                            >
                                                <FaPrint />
                                                <span>بوليصة</span>
                                            </button>

                                            <button
                                                onClick={() => handleUpdate(req.id)}
                                                disabled={updatingId === req.id}
                                                className="bg-blue-600 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-xs transition-colors"
                                            >
                                                {updatingId === req.id ? 'جاري الحفظ...' : 'حفظ'}
                                            </button>
                                            
                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                disabled={deletingId === req.id}
                                                className="bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-xs transition-colors"
                                            >
                                                {deletingId === req.id ? 'جاري الحذف...' : 'حذف'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* ========================================================================= */}
            {/* 🖨️ هيكل بوليصة الشحن الحرارية المصغرة (تظهر فقط عند الضغط على زر بوليصة) */}
            {/* ========================================================================= */}
            {activePrintRequest && (
                <div className="print-only text-black p-1 font-mono text-[11px] leading-tight w-full" dir="rtl">
                    <div className="text-center space-y-0.5 border-b border-black pb-2 mb-2">
                        <h2 className="text-sm font-bold tracking-wide">مكتبة دار اللغات</h2>
                        <p className="text-[9px]">طرد شحن: توريد شركات ومصانع 🏭</p>
                        <p className="text-[9px] font-mono">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>

                    <div className="space-y-1 text-[10px] mb-2 border-b border-black pb-2">
                        <p><strong>🏢 الشركة/المؤسسة:</strong> {activePrintRequest.companyName}</p>
                        <p><strong>👤 مسؤول التواصل:</strong> {activePrintRequest.contactPerson}</p>
                        <p><strong>📞 هاتف المستلم:</strong> {activePrintRequest.phone}</p>
                        <p><strong>📍 عنوان المخزن:</strong> {activePrintRequest.address}</p>
                        {activePrintRequest.taxNumber && (
                            <p><strong>📄 السجل الضريبي:</strong> {activePrintRequest.taxNumber}</p>
                        )}
                        <p className="border-t border-dotted border-gray-400 pt-1 leading-tight">
                            <strong>📦 المحتويات:</strong> {activePrintRequest.requiredItems || 'مستلزمات مكتبية'}
                        </p>
                    </div>

                    {/* 🌟 باركود أمر التوريد المخصص للكسح الليزري الفوري من مخازن الشركات */}
                    <div className="mt-4 flex flex-col items-center justify-center pt-2">
                        <div className="text-center font-mono text-xs tracking-widest border border-black px-2 py-1 bg-gray-50 rounded">
                            *{activePrintRequest.id.substring(0, 8).toUpperCase()}*
                        </div>
                        <p className="text-[8px] text-gray-700 mt-1">توصيل سريع - دار اللغات</p>
                    </div>
                </div>
            )}

            {/* ستايل الميديا كويري الصارم لضغط بوليصة الشركات لطابعات الإيصالات الحرارية (80mm) */}
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
    );
}
