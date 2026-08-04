'use client';

// 🎯 التصحيح الجذري النهائي: إجبار الصفحة على العمل بنظام ديناميكية كامل لتجاوز قفل الـ SECRET_COOKIE_PASSWORD ومنع فشل البناء والـ Build
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './OrdersPage.module.css';
import { FaWhatsapp, FaTrash } from 'react-icons/fa';

type OrderStatus = 'new' | 'processing' | 'delivered' | 'cancelled';

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    slug?: string;
}

interface Order {
    id: string;
    userId: string;
    shippingAddress: {
        recipientName: string;
        streetAddress: string;
        city: string;
        governorate: string;
        postalCode: string | null;
        phone: string;
    };
    items: OrderItem[];
    totalAmount: number;
    shippingFee: number;
    status: OrderStatus;
    createdAt: string;
    payment: {
        method: string;
        status: string;
        amount: number;
    };
}

const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
        case 'new':
            return { text: 'طلب جديد', className: styles.statusNew || styles.statusProcessing };
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
                const response = await fetch('/api/orders', { credentials: 'include' });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch orders');
                }

                setOrders(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        const originalOrders = [...orders];
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                setOrders(originalOrders);
                const errorData = await response.json();
                alert(`فشل تحديث حالة الطلب: ${errorData.error}`);
            }
        } catch (error) {
            setOrders(originalOrders);
            alert('حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
        }
    };

    // 🎯 الدالة الجديدة لحذف الطلب نهائياً من قاعدة البيانات والواجهة
    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من سجلات المتجر وقاعدة البيانات؟')) {
            return;
        }

        try {
            // نرسل طلب الحذف برقم الـ orderId المختار إلى السيرفر API
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشلت عملية حذف الطلب من السيرفر.');
            }

            // تحديث الواجهة فوراً ومسح البطاقة الخاصة بالطلب
            setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
            alert('تم حذف الطلب نهائياً بنجاح.');

        } catch (err: any) {
            alert(err.message);
        }
    };

    const exportToExcel = () => {
        const dataToExport = orders.map(order => {
            const address = order.shippingAddress || {};
            const fullAddress = `${address.governorate || ''}، ${address.city || ''}، ${address.streetAddress || ''}`;
            
            return {
                'رقم الطلب': order.id,
                'تاريخ الطلب': order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : 'غير محدد',
                'اسم العميل': address.recipientName || 'غير مسجل',
                'رقم الجوال': address.phone || 'غير مسجل',
                'العنوان التفصيلي': fullAddress,
                'المنتجات المطلوبة': order.items ? order.items.map(item => `${item.name} (x${item.quantity})`).join(' - ') : '',
                'إجمالي المنتجات': order.totalAmount || 0,
                'مصاريف الشحن': order.shippingFee || 0,
                'الإجمالي الكلي': (order.totalAmount || 0) + (order.shippingFee || 0),
                'طريقة الدفع': order.payment?.method === 'cash_on_delivery' ? 'كاش عند الاستلام' : order.payment?.method || 'كاش',
                'حالة الطلب': getStatusDetails(order.status).text,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
        XLSX.writeFile(workbook, 'طلبات_دار_اللغات.xlsx');
    };

    const getWhatsAppLink = (order: Order) => {
        const phone = order.shippingAddress?.phone || '';
        const name = order.shippingAddress?.recipientName || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        const message = `أهلاً بك ${name} في مكتبات دار اللغات، بخصوص طلبك رقم ${order.id}. طلب حضرتك مع المندوب الآن وسيتم التسليم اليوم من الساعه السادسة مساء الى 11 مساء`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    if (loading) {
        return <div className={styles.loading}>جاري تحميل الطلبات...</div>;
    }

    if (error) {
        return <div className={styles.error}>خطأ في تحميل الطلبات: {error}</div>;
    }

    return (
        <div className={styles.ordersContainer} dir="rtl">
            <div className={styles.headerContainer}>
                <h1 className={styles.title}>سجل الطلبات الواردة</h1>
                <button onClick={exportToExcel} className={styles.exportButton} disabled={orders.length === 0}>
                    📊 تصدير كشف إلى Excel
                </button>
            </div>
            
            {orders.length === 0 ? (
                <p className={styles.noOrders}>لا توجد طلبات مسجلة حتى الآن.</p>
            ) : (
                <div className={styles.ordersList}>
                    {orders.map((order) => {
                        const address = order.shippingAddress || {};
                        return (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h2>طلب من: {address.recipientName || 'عميل مجهول'}</h2>
                                        <p className={styles.date}>بتاريخ: {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : 'غير محدد'}</p>
                                    </div>
                                     <span className={`${styles.statusBadge} ${getStatusDetails(order.status).className}`}>
                                        {getStatusDetails(order.status).text}
                                    </span>
                                </div>
                                <div className={styles.cardBody}>
                                    <p><strong>الهاتف:</strong> {address.phone || 'لا يوجد'}</p>
                                    <p><strong>العنوان:</strong> {`${address.governorate || ''}، ${address.city || ''}، ${address.streetAddress || ''}`}</p>
                                    <p><strong>إجمالي الحساب:</strong> <span className="font-bold text-green-600">{(order.totalAmount || 0) + (order.shippingFee || 0)} EGP</span></p>
                                    
                                    <h3 className={styles.itemsTitle}>المنتجات:</h3>
                                    <ul className={styles.itemsList}>
                                        {order.items && order.items.map((item, index) => (
                                            <li key={index} className={styles.item}>
                                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className={styles.itemImage} style={{width: '40px', height: '40px', objectFit: 'cover'}} />}
                                                <div className={styles.itemDetails}>
                                                    <span>{item.name} (x${item.quantity}) - ${item.price} EGP</span>
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
                                        <option value="new">طلب جديد</option>
                                        <option value="processing">جاري التجهيز</option>
                                        <option value="delivered">تم التسليم</option>
                                        <option value="cancelled">ملغي</option>
                                    </select>
                                    <a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
                                        <FaWhatsapp /> إرسال تحديث
                                    </a>
                                    {/* 🎯 زر الحذف التفاعلي الجديد المضاف بنجاح لإنهاء المشكلة */}
                                    <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors font-medium border border-red-200"
                                    >
                                        <FaTrash size={14} />
                                        <span>حذف الطلب</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
