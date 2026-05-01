'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './OrdersPage.module.css';
import { FaWhatsapp } from 'react-icons/fa';

// Define types for order status
type OrderStatus = 'processing' | 'delivered' | 'cancelled';

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

interface Order {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    createdAt: string;
}

// Helper to get a readable status in Arabic and a corresponding CSS class
const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
        case 'processing':
            return { text: 'جاري التجهيز', className: styles.statusProcessing };
        case 'delivered':
            return { text: 'تم التسليم', className: styles.statusDelivered };
        case 'cancelled':
            return { text: 'ملغي', className: styles.statusCancelled };
        default:
            return { text: 'غير معروف', className: '' };
    }
};


const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/orders');

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch orders');
                }

                const data = await response.json();
                setOrders(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        // Optimistically update the UI
        const originalOrders = [...orders];
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert the UI on failure
                setOrders(originalOrders);
                const errorData = await response.json();
                alert(`فشل تحديث حالة الطلب: ${errorData.error}`);
            }
        } catch (error) {
            setOrders(originalOrders);
            alert('حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
        }
    };

    const exportToExcel = () => {
        const dataToExport = orders.map(order => ({
            'رقم الطلب': order.id,
            'تاريخ الطلب': new Date(order.createdAt).toLocaleString('ar-EG'),
            'اسم العميل': order.customerName,
            'رقم الجوال': order.customerPhone,
            'العنوان التفصيلي': order.customerAddress,
            'المنتجات المطلوبة': order.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
            'إجمالي المبلغ': order.total,
            'حالة الدفع': 'كاش عند الاستلام',
            'حالة الطلب': getStatusDetails(order.status).text,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
        XLSX.writeFile(workbook, 'طلبات_دار_اللغات.xlsx');
    };

    const getWhatsAppLink = (order: Order) => {
        const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
        const message = `أهلاً بك ${order.customerName} في مكتبات دار اللغات، بخصوص طلبك رقم ${order.id}. طلب حضرتك مع المندوب الآن وسيتم التسليم اليوم من الساعه السادسة مساء الى 11 مساء`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    if (loading) {
        return <div className={styles.loading}>جاري تحميل الطلبات...</div>;
    }

    if (error) {
        return <div className={styles.error}>خطأ في تحميل الطلبات: {error}</div>;
    }

    return (
        <div className={styles.ordersContainer}>
            <div className={styles.headerContainer}>
                <h1 className={styles.title}>سجل الطلبات الواردة</h1>
                <button onClick={exportToExcel} className={styles.exportButton} disabled={orders.length === 0}>
                    تصدير كشف إلى Excel
                </button>
            </div>
            
            {orders.length === 0 ? (
                <p className={styles.noOrders}>لا توجد طلبات مسجلة حتى الآن.</p>
            ) : (
                <div className={styles.ordersList}>
                    {orders.map((order) => (
                        <div key={order.id} className={styles.orderCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h2>طلب من: {order.customerName}</h2>
                                    <p className={styles.date}>بتاريخ: {new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                                </div>
                                 <span className={`${styles.statusBadge} ${getStatusDetails(order.status).className}`}>
                                    {getStatusDetails(order.status).text}
                                </span>
                            </div>
                            <div className={styles.cardBody}>
                                <p><strong>الهاتف:</strong> {order.customerPhone}</p>
                                <p><strong>العنوان:</strong> {order.customerAddress}</p>
                                
                                <h3 className={styles.itemsTitle}>المنتجات:</h3>
                                <ul className={styles.itemsList}>
                                    {order.items.map((item, index) => (
                                        <li key={index} className={styles.item}>
                                            <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
                                            <div className={styles.itemDetails}>
                                                <span>{item.name} (x{item.quantity})</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div className={styles.cardActions}>
                                <select 
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                    className={styles.statusSelect}
                                >
                                    <option value="processing">جاري التجهيز</option>
                                    <option value="delivered">تم التسليم</option>
                                    <option value="cancelled">ملغي</option>
                                </select>
                                <a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
                                    <FaWhatsapp /> إرسال تحديث
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
