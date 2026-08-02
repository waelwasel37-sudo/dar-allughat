'use client';

import { useEffect, useState } from 'react';
import styles from './ReportsPage.module.css';

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
    items: OrderItem[];
}

const ReportsPage = () => {
    const [reportData, setReportData] = useState<ProductReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/orders', { credentials: 'include' });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'فشل في تحميل بيانات الطلبات للتقرير');
                }

                // 🎯 منع الانهيار: التأكد التام من أن السيرفر أعاد مصفوفة وليس كائن خطأ
                const orders: Order[] = Array.isArray(data) ? data : [];

                if (orders.length === 0) {
                    setReportData([]);
                    return;
                }

                const productSales: { [key: string]: ProductReport } = {};

                orders.forEach(order => {
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

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, []);

    if (loading) {
        return <div className={styles.loading}>جاري إعداد تقرير الأكثر مبيعاً...</div>;
    }

    if (error) {
        return <div className={styles.error}>خطأ في التقرير: {error}</div>;
    }

    return (
        <div className={styles.reportsContainer} dir="rtl">
            <h1 className={styles.title}>تقرير المنتجات الأكثر طلباً</h1>
            <p className={styles.subtitle}>تحليل للمنتجات الأكثر مبيعاً بناءً على سجل الطلبات الواردة</p>

            {reportData.length === 0 ? (
                <p className={styles.noData}>لا توجد بيانات كافية لإنشاء التقرير حالياً.</p>
            ) : (
                <div className={styles.reportList}>
                    <div className={styles.listHeader}>
                        <span>المنتج</span>
                        <span>إجمالي عدد الطلبات</span>
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