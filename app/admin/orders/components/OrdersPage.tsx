'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './OrdersPage.module.css';
import { FaWhatsapp, FaTrash, FaPrint, FaShoppingBag, FaStore } from 'react-icons/fa';

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
    source?: string;
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
            return { text: 'طلب جديد', className: styles.statusNew }; 
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
    const [activePrintRequest, setActivePrintRequest] = useState<Order | null>(null);

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

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من سجلات المتجر وقاعدة البيانات؟')) {
            return;
        }
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشلت عملية حذف الطلب من السيرفر.');
            }

            setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
            alert('تم حذف الطلب نهائياً بنجاح.');

        } catch (err: any) {
            alert(err.message);
        }
    };

    const handlePrintLabel = (order: Order) => {
        setActivePrintRequest(order);
        setTimeout(() => {
            window.print();
            setActivePrintRequest(null);
        }, 300);
    };

    const exportToExcel = () => {
        const dataToExport = orders.map(order => ({
            'رقم الطلب': order.id,
            'تاريخ الطلب': new Date(order.createdAt).toLocaleString('ar-EG'),
            'اسم العميل': order.shippingAddress.recipientName,
            'رقم الهاتف': order.shippingAddress.phone,
            'عنوان الشحن': `${order.shippingAddress.governorate}, ${order.shippingAddress.city}, ${order.shippingAddress.streetAddress}`,
            'المنتجات': order.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
            'المبلغ الإجمالي': order.totalAmount,
            'رسوم الشحن': order.shippingFee,
            'الحالة': getStatusDetails(order.status).text,
            'مصدر الطلب': order.source === 'POS' ? 'الفرع' : 'أونلاين'
        }));

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
            <div className="no-print">
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
                            const isPOS = order.source === 'POS';
                            return (
                                <div key={order.id} className={styles.orderCard}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h2 className="text-gray-900 font-bold text-sm sm:text-base">طلب من: {address.recipientName || 'عميل مجهول'}</h2>
                                                <span className={`${styles.sourceBadge} ${isPOS ? styles.sourcePOS : styles.sourceWeb}`}>
                                                    {isPOS ? <><FaStore className="inline mr-1 text-[10px]" /> الفرع</> : <><FaShoppingBag className="inline mr-1 text-[10px]" /> أونلاين</>}
                                                </span>
                                            </div>
                                            <p className={styles.date}>بتاريخ: {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : 'غير محدد'}</p>
                                        </div>
                                         <span className={`${styles.statusBadge} ${getStatusDetails(order.status).className}`}>
                                            {getStatusDetails(order.status).text}
                                        </span>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <p><strong>الهاتف:</strong> {address.phone || 'لا يوجد'}</p>
                                        <p><strong>العنوان:</strong> {isPOS ? 'شراء مباشر من الفرع' : `${address.governorate || ''}، ${address.city || ''}، ${address.streetAddress || ''}`}</p>
                                        <p><strong>إجمالي الحساب:</strong> <span className="font-bold text-green-600">{(order.totalAmount || 0) + (isPOS ? 0 : (order.shippingFee || 0))} EGP</span></p>
                                        
                                        <h3 className={styles.itemsTitle}>المنتجات:</h3>
                                        <ul className={styles.itemsList}>
                                            {order.items && order.items.map((item, index) => (
                                                <li key={index} className={styles.item}>
                                                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className={styles.itemImage} style={{width: '40px', height: '40px', objectFit: 'cover'}} />}
                                                    <div className={styles.itemDetails}>
                                                        <span className="text-xs sm:text-sm font-semibold">{item.name} (x{item.quantity}) - {item.price} EGP</span>
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

                                        <button
                                            onClick={() => handlePrintLabel(order)}
                                            title="طباعة ملصق شحن حراري مصغر لهذا الطرد"
                                            className={`${styles.printButton} bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-all`}
                                        >
                                            <FaPrint size={12} />
                                            <span>بوليصة</span>
                                        </button>

                                        {!isPOS && (
                                            <a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
                                                <FaWhatsapp /> إرسال تحديث
                                            </a>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium border border-red-200 text-xs"
                                        >
                                            <FaTrash size={12} />
                                            <span>حذف الطلب</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {activePrintRequest && (
                <div className="print-only text-black p-1 font-mono text-[11px] leading-tight w-full" dir="rtl">
                    <div className="text-center space-y-0.5 border-b border-black pb-2 mb-2">
                        <h2 className="text-sm font-bold tracking-wide">مكتبة دار اللغات</h2>
                        <p className="text-[9px]">
                            {activePrintRequest.source === 'POS' ? "إيصال: شراء من الفرع نقداً 🏪" : "بوليصة طرد شحن أونلاين 🌐"}
                        </p>
                        <p className="text-[9px] font-mono">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>

                    <div className="space-y-1 text-[10px] mb-2 border-b border-black pb-2">
                        <p><strong>👤 اسم العميل:</strong> {activePrintRequest.shippingAddress?.recipientName || 'عميل مجهول'}</p>
                        <p><strong>📞 هاتف المستلم:</strong> {activePrintRequest.shippingAddress?.phone || 'غير مسجل'}</p>
                        <p><strong>📍 عنوان التوصيل:</strong> {activePrintRequest.source === 'POS' ? 'استلام مباشر من الفرع' : `${activePrintRequest.shippingAddress?.governorate || ''}، ${activePrintRequest.shippingAddress?.city || ''}، ${activePrintRequest.shippingAddress?.streetAddress || ''}`}</p>
                        <p className="border-t border-dotted border-gray-400 pt-1 leading-tight text-[10px] font-bold text-gray-800">
                            📦 محتويات الطرد:
                        </p>
                        <ul className="text-[9px] list-disc list-inside space-y-0.5 pl-1">
                            {activePrintRequest.items?.map((item, idx) => (
                                <li key={idx}>{item.name} (x{item.quantity})</li>
                            ))}
                        </ul>
                        <div className="border-t border-dotted border-gray-400 pt-1 flex justify-between font-extrabold text-[11px]">
                            <span>إجمالي المطلوب تحصيله:</span>
                            <span>{(activePrintRequest.totalAmount || 0) + (activePrintRequest.source === 'POS' ? 0 : (activePrintRequest.shippingFee || 0))} EGP</span>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-center pt-2">
                        <div className="text-center font-mono text-xs tracking-widest border border-black px-2 py-1 bg-gray-50 rounded">
                            *{activePrintRequest.id.substring(0, 8).toUpperCase()}*
                        </div>
                        <p className="text-[8px] text-gray-700 mt-1">شحن سريع ومضمون - دار اللغات</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
