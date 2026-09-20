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

// 🎯 كائن التحكم المركزي الموحد: تم تثبيت "مكتبة دار اللغات" بدقة وبالمفرد
const businessInfo = {
    name: 'مكتبة دار اللغات',
    address: 'مول روضة العبور - محل 47، الدور الأول، الحي السادس، مدينة العبور',
    commercialRecord: '100160',
    taxNumber: '769499732',
};

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
            } finally { // 🎯 تم التصحيح الجذري والنهائي هنا لسحق عطل التحميل
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
        
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '2' + cleanPhone;
        } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('2')) {
            cleanPhone = '2' + cleanPhone;
        }
        
        const message = `أهلاً بك ${name} في مكتبة دار اللغات، بخصوص طلبك رقم ${order.id}. طلب حضرتك مع المندوب الآن وسيتم التسليم اليوم من الساعه السادسة مساء الى 11 مساء`;
        // 🎯 تم التصحيح الهندسي الملوكي لحقن علامة الدولار والمائلة وضمان فتح الشات فوراً للأمهات
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
            
            {/* 🎯 لوحة التحكم: تختفي بالكامل أثناء الطباعة بفضل الـ noPrint لحماية بون الشحن وعملية القياس */}
            <div className={styles.noPrint}>
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

            {/* ========================================================================================= */}
            {/* 🖨️ بوليصة الشحن الاحترافية الخاصة بك: مصممة ببراويز وخط ضخم جداً لعين المندوب وحظر التقطيع */}
            {/* ========================================================================================= */}
            {activePrintRequest && (
                <div className={styles.printOnly} dir="rtl" style={{ padding: '10px', color: '#000', background: '#fff' }}>
                    
                    {/* --- قسم الراسل (بيانات مكتبة دار اللغات الموحدة) --- */}
                    <div style={{ border: '2px solid #000', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>من (الراسل):</p>
                        <h3 style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>{businessInfo.name}</h3>
                        <p style={{ margin: 0, fontSize: '11px' }}>{businessInfo.address}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>الرقم الضريبي: {businessInfo.taxNumber}</p>
                    </div>

                    {/* --- قسم المستلم ببرواز سميك وخط ضخم جداً (20px) منعاً لخطأ التسليم --- */}
                    <div style={{ border: '2px solid #000', padding: '15px', borderRadius: '8px', marginTop: '10px', textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>إلى (المستلم):</p>
                        <h3 style={{ margin: '8px 0', fontSize: '20px', fontWeight: 'bold' }}>{activePrintRequest.shippingAddress?.recipientName || 'عميل مجهول'}</h3>
                        <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: '500' }}>
                            {`${activePrintRequest.shippingAddress?.governorate || ''}، ${activePrintRequest.shippingAddress?.city || ''}، ${activePrintRequest.shippingAddress?.streetAddress || ''}`}
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
                            الهاتف: {activePrintRequest.shippingAddress?.phone || 'لا يوجد'}
                        </p>
                    </div>

                    {/* --- قسم محتويات الطرد والمنتجات --- */}
                    <div style={{ border: '2px solid #000', padding: '10px', borderRadius: '8px', marginTop: '10px', textAlign: 'right' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>📦 محتويات الطرد:</p>
                        <ul className={styles.printItemsList} style={{ margin: 0, paddingRight: '15px', fontSize: '12px', listStyleType: 'disc' }}>
                            {activePrintRequest.items?.map((item, idx) => (
                                <li key={idx} style={{ padding: '2px 0' }}>{item.name} (x{item.quantity})</li>
                            ))}
                        </ul>
                    </div>

                    {/* --- قسم التحصيل والباركود الختامي للمندوب --- */}
                    <div style={{ border: '2px solid #000', padding: '12px', borderRadius: '8px', marginTop: '10px', textAlign: 'center' }}>
                        <div className={styles.printTotalRow} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                            <span>💰 إجمالي المطلوب تحصيله:</span>
                            <span>{(activePrintRequest.totalAmount || 0) + (activePrintRequest.source === 'POS' ? 0 : (activePrintRequest.shippingFee || 0))} EGP</span>
                        </div>
                        
                        <div className={styles.printBarcodeSection} style={{ marginTop: '10px' }}>
                            <div className={styles.printBarcode} style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '3px', fontWeight: 'bold', margin: '5px 0' }}>
                                *{activePrintRequest.id.substring(0, 8).toUpperCase()}*
                            </div>
                            <p className={styles.printFooterText} style={{ margin: 0, fontSize: '11px', fontWeight: '500' }}>شحن سريع ومضمون - {businessInfo.name}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '9px', color: '#666' }}>رقم السجل: {businessInfo.commercialRecord}</p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default OrdersPage;
