'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// 🌟 استيراد سياق الحماية لحظر زوار الموقع غير المصرح لهم
import { useAuth } from '../../context/AuthContext';
import styles from './ReportsPage.module.css';
import { FaFileExcel, FaFilter } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface ProductReport {
    productId: string;
    name: string;
    imageUrl: string;
    salesCount: number;
}

interface OrderItem {
    productId: string;
    name: string;
    imageUrl: string;
    quantity: number;
}

interface Order {
    source?: string;
    items: OrderItem[];
}

const ReportsPage = () => {
    // 🛡️ تفعيل نظام جدار الأمان الذي اقترحته لحماية بيانات الخزينة
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [allOrders, setAllOrders] = useState<Order[]>([]); 
    const [reportData, setReportData] = useState<ProductReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterSource, setFilterSource] = useState<string>('all');

    // 🔒 جدار الحماية: طرد أي عميل أونلاين يحاول التسلل لصفحة أرباح المحل
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

    // جلب البيانات من السيرفر (يعمل فقط إذا نجح فحص الأمان وكان المستخدم أدمن)
    useEffect(() => {
        const fetchOrdersForReport = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/orders', { credentials: 'include' });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'فشل في تحميل بيانات الطلبات للتقرير');
                }

                const orders: Order[] = Array.isArray(data) ? data : [];
                setAllOrders(orders);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (isAdmin) {
            fetchOrdersForReport();
        }
    }, [isAdmin]);

    // معالجة وتصفية البيانات برمجياً داخل المتصفح لفرز الأرباح
    useEffect(() => {
        if (allOrders.length === 0) {
            setReportData([]);
            return;
        }

        const productSales: { [key: string]: ProductReport } = {};

        const filteredOrders = allOrders.filter(order => {
            if (filterSource === 'all') return true;
            const source = order.source || 'Web';
            return source === filterSource;
        });

        filteredOrders.forEach(order => {
            if (order && order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item && item.productId) { 
                        if (productSales[item.productId]) {
                            productSales[item.productId].salesCount += Number(item.quantity || 0);
                        } else {
                            productSales[item.productId] = {
                                productId: item.productId,
                                name: item.name || 'منتج غير معروف',
                                imageUrl: item.imageUrl || '/placeholder.png',
                                salesCount: Number(item.quantity || 0),
                            };
                        }
                    }
                });
            }
        });

        const sortedReport = Object.values(productSales).sort((a, b) => b.salesCount - a.salesCount);
        setReportData(sortedReport);

    }, [allOrders, filterSource]);

    const handleExport = () => {
        if (reportData.length === 0) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }

        const dataToExport = reportData.map(item => ({
            'معرف المنتج': item.productId,
            'اسم المنتج': item.name,
            'عدد المبيعات': item.salesCount,
            'رابط الصورة': item.imageUrl,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        
        let sheetName = 'تقرير الأكثر مبيعاً - الكل';
        if (filterSource === 'Web') sheetName = 'مبيعات الموقع الأونلاين';
        if (filterSource === 'POS') sheetName = 'مبيعات الكاشير بالفرع';

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        worksheet['!cols'] = [
            { wch: 30 }, 
            { wch: 50 }, 
            { wch: 15 }, 
            { wch: 60 }, 
        ];

        const fileName = filterSource === 'all' ? 'تقرير_المبيعات_الشامل.xlsx' : `تقرير_مبيعات_${filterSource}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // 🛑 منع عرض أي سطر في الصفحة طالما أن فحص الأمان جارٍ أو لو كان المستخدم غير مصرح له
    if (authLoading || !isAdmin) {
        return <div className={styles.loading}>يتم التحقق من صلاحيات الدخول وأمان الخزينة...</div>;
    }

    if (loading) {
        return <div className={styles.loading}>جاري إعداد تقرير الأكثر مبيعاً وفلترة المبيعات...</div>;
    }

    if (error) {
        return <div className={styles.error}>خطأ في التقرير: {error}</div>;
    }

    return (
        <div className={styles.reportsContainer} dir="rtl">
            <div className={styles.headerContainer}>
                <div className={styles.headerTitle}>
                    <h1 className={styles.title}>تقرير المنتجات الأكثر طلباً</h1>
                    <p className={styles.subtitle}>تحليل للمنتجات الأكثر مبيعاً بناءً على سجل الطلبات الواردة</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                        <select 
                            value={filterSource} 
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="bg-transparent text-sm font-semibold outline-none text-gray-700 cursor-pointer"
                        >
                            <option value="all">📊 عرض تقرير المبيعات الشامل</option>
                            <option value="Web">🌐 مبيعات الموقع الإلكتروني فقط</option>
                            <option value="POS">🏪 مبيعات نظام الكاشير (المحل) فقط</option>
                        </select>
                    </div>

                    <button onClick={handleExport} className={styles.exportButton}>
                        <FaFileExcel />
                        <span>تصدير إلى Excel</span>
                    </button>
                </div>
            </div>

            {reportData.length === 0 ? (
                <p className={styles.noData}>لا توجد مبيعات مسجلة في هذا القسم لإنشاء التقرير حالياً.</p>
            ) : (
                <div className={styles.reportList}>
                    <div className={styles.listHeader}>
                        <span>المنتج</span>
                        <span>إجمالي عدد الطلبات ({filterSource === 'all' ? 'الشامل' : filterSource === 'Web' ? 'الموقع' : 'الكاشير'})</span>
                    </div>
                    {reportData.map((product, index) => (
                        <div key={`${product.productId}-${index}`} className={styles.reportItem}>
                            <div className={styles.productInfo}>
                                <span className={styles.rank}>{index + 1}</span>
                                <img src={product.imageUrl} alt={product.name} className={styles.productImage} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px'}} />
                                <span>{product.name}</span>
                            </div>
                            <div className={styles.salesCount}>
                                {product.salesCount} مرة
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
