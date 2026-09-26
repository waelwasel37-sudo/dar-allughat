'use client';

import React, { useEffect, useState } from 'react';
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
    const { isAdmin, loading: authLoading, user } = useAuth();
    const router = useRouter();

    // 🛡️ المالك فقط — التقارير المحاسبية سرية
    const OWNER_EMAIL = 'waelwasel37@gmail.com';
    const isOwner = user?.email === OWNER_EMAIL;

    const [allOrders, setAllOrders] = useState<Order[]>([]); 
    const [reportData, setReportData] = useState<ProductReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterSource, setFilterSource] = useState<string>('all');
    
    // 🆕 State للتاب النشط
    const [activeTab, setActiveTab] = useState<'products' | 'employees'>('products');
    
    // 🆕 State لبيانات المبيعات (للتقرير الموظفين)
    const [salesData, setSalesData] = useState<any[]>([]);
    const [salesLoading, setSalesLoading] = useState(false);
    
    // 🆕 State للموظف المفتوح (عرض تفاصيل فواتيره)
    const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

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

    // 🆕 جلب بيانات المبيعات (للتقرير الموظفين)
    useEffect(() => {
        if (activeTab !== 'employees') return;
        
        const fetchSales = async () => {
            try {
                setSalesLoading(true);
                const res = await fetch('/api/sales', { credentials: 'include' });
                const data = await res.json();
                if (data.success) {
                    setSalesData(data.data || []);
                }
            } catch (err) {
                console.error('فشل تحميل المبيعات:', err);
            } finally {
                setSalesLoading(false);
            }
        };
        
        fetchSales();
    }, [activeTab]);

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

    // 🆕 تصدير تقرير الموظفين إلى Excel
    const handleExportEmployees = () => {
        if (salesData.length === 0) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }

        // تجميع المبيعات حسب الموظف (نفس المنطق اللي في العرض)
        const byEmployee: Record<string, {
            name: string;
            email: string;
            count: number;
            totalSales: number;
            totalDiscount: number;
            totalTax: number;
            lastSale: number;
        }> = {};

        salesData.forEach((sale: any) => {
            const key = sale.employeeEmail || 'unknown';
            if (!byEmployee[key]) {
                byEmployee[key] = {
                    name: sale.employeeName || 'غير معروف',
                    email: sale.employeeEmail || '',
                    count: 0,
                    totalSales: 0,
                    totalDiscount: 0,
                    totalTax: 0,
                    lastSale: 0,
                };
            }
            byEmployee[key].count += 1;
            byEmployee[key].totalSales += (sale.grandTotal || 0);
            byEmployee[key].totalDiscount += (sale.discountTotal || 0);
            byEmployee[key].totalTax += (sale.taxAmount || 0);
            const saleTimestamp = sale.timestamp || (sale.date ? new Date(sale.date).getTime() : 0);
            if (saleTimestamp > byEmployee[key].lastSale) {
                byEmployee[key].lastSale = saleTimestamp;
            }
        });

        const dataToExport = Object.entries(byEmployee).map(([email, emp], index) => ({
            '#': index + 1,
            'الموظف': emp.name,
            'الإيميل': emp.email,
            'آخر نشاط': emp.lastSale ? new Date(emp.lastSale).toLocaleString('ar-EG') : '—',
            'عدد الفواتير': emp.count,
            'إجمالي المبيعات (EGP)': Number(emp.totalSales.toFixed(2)),
            'إجمالي الخصم (EGP)': Number(emp.totalDiscount.toFixed(2)),
            'إجمالي الضريبة (EGP)': Number(emp.totalTax.toFixed(2)),
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الموظفين');

        worksheet['!cols'] = [
            { wch: 5 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
            { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 18 },
        ];

        // 🆕 الشيت الأول: الإجماليات
        const summarySheet = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'إجماليات الموظفين');
        
        summarySheet['!cols'] = [
            { wch: 5 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
            { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 18 },
        ];

        // 🆕 الشيت الثاني: تفاصيل كل الفواتير
        const detailsData: any[] = [];
        salesData
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach((sale) => {
                const itemsText = sale.items?.map((item: any) => 
                    `${item.name} × ${item.quantity}`
                ).join(' | ') || '—';
                
                detailsData.push({
                    'رقم البون': sale.invoiceNumber,
                    'التاريخ': sale.timestamp 
                        ? new Date(sale.timestamp).toLocaleString('ar-EG')
                        : (sale.date ? new Date(sale.date).toLocaleString('ar-EG') : '—'),
                    'الموظف': sale.employeeName || '—',
                    'الإيميل': sale.employeeEmail || '—',
                    'المنتجات': itemsText,
                    'عدد المنتجات': sale.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
                    'الإجمالي (EGP)': Number((sale.grandTotal || 0).toFixed(2)),
                    'الخصم (EGP)': Number((sale.discountTotal || 0).toFixed(2)),
                    'الضريبة (EGP)': Number((sale.taxAmount || 0).toFixed(2)),
                    'المدفوع (EGP)': Number((sale.amountPaid || 0).toFixed(2)),
                    'الباقي (EGP)': Number((sale.change || 0).toFixed(2)),
                    'طريقة الدفع': sale.paymentMethod || 'CASH',
                });
            });

        const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'تفاصيل الفواتير');

        detailsSheet['!cols'] = [
            { wch: 22 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
            { wch: 50 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        ];

        const fileName = `تقرير_الموظفين_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // 🛑 منع عرض أي سطر في الصفحة طالما أن فحص الأمان جارٍ أو لو كان المستخدم غير مصرح له
    if (authLoading || !isAdmin) {
        return <div className={styles.loading}>يتم التحقق من صلاحيات الدخول وأمان الخزينة...</div>;
    }

    // 🛡️ المالك فقط — منع الموظفين من رؤية التقارير
    if (!isOwner) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '40px' }}>
                <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>�� الوصول مرفوض</h1>
                <p style={{ color: '#6b7280' }}>هذه التقارير متاحة للمالك فقط</p>
                <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>
                    {user?.email || 'غير معروف'}
                </p>
            </div>
        );
    }

    if (loading) {
        return <div className={styles.loading}>جاري إعداد تقرير الأكثر مبيعاً وفلترة المبيعات...</div>;
    }

    if (error) {
        return <div className={styles.error}>خطأ في التقرير: {error}</div>;
    }

    return (
        <div className={styles.reportsContainer} dir="rtl">
            
            {/* 🆕 التابين */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        padding: '8px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: 'none',
                        borderBottom: activeTab === 'products' ? '3px solid #3b82f6' : '3px solid transparent',
                        background: 'transparent',
                        color: activeTab === 'products' ? '#3b82f6' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    📦 تقرير المنتجات
                </button>
                <button
                    onClick={() => setActiveTab('employees')}
                    style={{
                        padding: '8px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: 'none',
                        borderBottom: activeTab === 'employees' ? '3px solid #3b82f6' : '3px solid transparent',
                        background: 'transparent',
                        color: activeTab === 'employees' ? '#3b82f6' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    👤 تقرير الموظفين
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* 📦 تقرير المنتجات (الموجود) */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'products' && (
                <>
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
                </>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* 👤 تقرير الموظفين (جديد) */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'employees' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <h1 className={styles.title} style={{ margin: 0 }}>👤 تقرير مبيعات الموظفين</h1>
                        {salesData.length > 0 && (
                            <button onClick={handleExportEmployees} className={styles.exportButton}>
                                <FaFileExcel />
                                <span>تصدير إلى Excel</span>
                            </button>
                        )}
                    </div>
                    
                    {salesLoading ? (
                        <div className={styles.loading}>جاري تحميل بيانات المبيعات...</div>
                    ) : salesData.length === 0 ? (
                        <p className={styles.noData}>لا توجد مبيعات مسجلة حتى الآن.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                                <thead>
                                    <tr style={{ background: '#f3f4f6' }}>
                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>#</th>
                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>الموظف</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>آخر نشاط</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>عدد الفواتير</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>إجمالي المبيعات</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>إجمالي الخصم</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>إجمالي الضريبة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // تجميع المبيعات حسب الموظف
                                        const byEmployee: Record<string, {
                                            name: string;
                                            email: string;
                                            count: number;
                                            totalSales: number;
                                            totalDiscount: number;
                                            totalTax: number;
                                            lastSale: number;
                                        }> = {};
                                        
                                        salesData.forEach((sale: any) => {
                                            const key = sale.employeeEmail || 'unknown';
                                            if (!byEmployee[key]) {
                                                byEmployee[key] = {
                                                    name: sale.employeeName || 'غير معروف',
                                                    email: sale.employeeEmail || '',
                                                    count: 0,
                                                    totalSales: 0,
                                                    totalDiscount: 0,
                                                    totalTax: 0,
                                                    lastSale: 0,
                                                };
                                            }
                                            byEmployee[key].count += 1;
                                            byEmployee[key].totalSales += (sale.grandTotal || 0);
                                            byEmployee[key].totalDiscount += (sale.discountTotal || 0);
                                            byEmployee[key].totalTax += (sale.taxAmount || 0);
                                            const saleTimestamp = sale.timestamp || (sale.date ? new Date(sale.date).getTime() : 0);
                                            if (saleTimestamp > byEmployee[key].lastSale) {
                                                byEmployee[key].lastSale = saleTimestamp;
                                            }
                                        });
                                        
                                        return Object.entries(byEmployee).map(([email, emp], index) => (
                                            <React.Fragment key={email}>
                                                <tr 
                                                    style={{ 
                                                        borderBottom: '1px solid #e5e7eb',
                                                        cursor: 'pointer',
                                                        background: expandedEmployee === email ? '#eff6ff' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onClick={() => setExpandedEmployee(expandedEmployee === email ? null : email)}
                                                >
                                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                                        <span style={{ 
                                                            display: 'inline-block',
                                                            transform: expandedEmployee === email ? 'rotate(90deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s',
                                                            marginLeft: '6px',
                                                            color: '#3b82f6',
                                                            fontSize: '10px'
                                                        }}>▶</span>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{emp.email}</div>
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
                                                        {emp.lastSale ? new Date(emp.lastSale).toLocaleString('ar-EG') : '—'}
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>{emp.count}</td>
                                                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>{emp.totalSales.toFixed(2)} EGP</td>
                                                    <td style={{ padding: '10px', textAlign: 'center', color: '#dc2626' }}>-{emp.totalDiscount.toFixed(2)} EGP</td>
                                                    <td style={{ padding: '10px', textAlign: 'center', color: '#7c3aed' }}>{emp.totalTax.toFixed(2)} EGP</td>
                                                </tr>
                                                {expandedEmployee === email && (
                                                    <tr>
                                                        <td colSpan={7} style={{ padding: 0, background: '#f9fafb', borderBottom: '2px solid #3b82f6' }}>
                                                            <div style={{ padding: '16px' }}>
                                                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                                                                    📋 تفاصيل فواتير {emp.name}
                                                                </h4>
                                                                <div style={{ overflowX: 'auto' }}>
                                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                                                        <thead>
                                                                            <tr style={{ background: '#f3f4f6' }}>
                                                                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>رقم البون</th>
                                                                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>التاريخ</th>
                                                                                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>المنتجات</th>
                                                                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>الإجمالي</th>
                                                                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>المدفوع</th>
                                                                                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>الباقي</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {salesData
                                                                                .filter((sale) => sale.employeeEmail === email)
                                                                                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                                                                                .map((sale, idx) => (
                                                                                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                                                        <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>
                                                                                            {sale.invoiceNumber}
                                                                                        </td>
                                                                                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
                                                                                            {sale.timestamp ? new Date(sale.timestamp).toLocaleString('ar-EG') : (sale.date ? new Date(sale.date).toLocaleString('ar-EG') : '—')}
                                                                                        </td>
                                                                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                                                                            {sale.items && sale.items.length > 0 ? (
                                                                                                <ul style={{ margin: 0, paddingRight: '16px', listStyleType: 'disc' }}>
                                                                                                    {sale.items.map((item, i) => (
                                                                                                        <li key={i} style={{ fontSize: '11px', padding: '1px 0' }}>
                                                                                                            {item.name} <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>× {item.quantity}</span>
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            ) : (
                                                                                                <span style={{ color: '#9ca3af' }}>—</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>
                                                                                            {sale.grandTotal?.toFixed(2) || '0.00'} EGP
                                                                                        </td>
                                                                                        <td style={{ padding: '8px', textAlign: 'center', color: '#3b82f6' }}>
                                                                                            {sale.amountPaid?.toFixed(2) || '0.00'} EGP
                                                                                        </td>
                                                                                        <td style={{ padding: '8px', textAlign: 'center', color: '#dc2626' }}>
                                                                                            {sale.change?.toFixed(2) || '0.00'} EGP
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
