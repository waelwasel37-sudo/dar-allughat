'use client';

import { useEffect, useState } from 'react';
import styles from './ReportsPage.module.css';

// A combined type for simplified data handling
interface ProductReport {
    productId: string;
    name: string;
    imageUrl: string;
    salesCount: number;
}

// Keep the Order types for fetching
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
                const response = await fetch('/api/orders');

                if (!response.ok) {
                    throw new Error('فشل في تحميل بيانات الطلبات للتقرير');
                }

                const orders: Order[] = await response.json();

                // Aggregate product sales
                const productSales: { [key: string]: ProductReport } = {};

                orders.forEach(order => {
                    order.items.forEach(item => {
                        // Only process items that have a valid productId
                        if (item.productId) { 
                            if (productSales[item.productId]) {
                                productSales[item.productId].salesCount += item.quantity;
                            } else {
                                productSales[item.productId] = {
                                    productId: item.productId,
                                    name: item.name,
                                    imageUrl: item.imageUrl,
                                    salesCount: item.quantity,
                                };
                            }
                        }
                    });
                });

                // Convert to array and sort by salesCount descending
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
        return <div className={styles.error}>خطأ: {error}</div>;
    }

    return (
        <div className={styles.reportsContainer}>
            <h1 className={styles.title}>تقرير المنتجات الأكثر طلباً</h1>
            <p className={styles.subtitle}>تحليل للمنتجات الأكثر مبيعاً بناءً على سجل الطلبات</p>

            {reportData.length === 0 ? (
                <p className={styles.noData}>لا توجد بيانات كافية لإنشاء التقرير.</p>
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
                                <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
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
