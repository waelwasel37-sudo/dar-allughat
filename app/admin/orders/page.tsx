'use client';

// 🎯 إجبار الصفحة على العمل بنظام ديناميكية كامل لتجاوز قفل الـ SECRET_COOKIE_PASSWORD ومنع فشل البناء
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './OrdersPage.module.css';
import { FaWhatsapp, FaTrash, FaPrint, FaStore, FaShoppingBag, FaCommentDots } from 'react-icons/fa';

type OrderStatus = 'new' | 'processing' | 'delivered' | 'cancelled';
type WhatsAppMessageType = 'processing' | 'shipping' | 'with_delivery'; // 🎯 الأنواع الثلاثة المحدثة للرسائل

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

// 🎯 تثبيت الاسم الرسمي القانوني بالمفرد "مكتبة دار اللغات" للامتثال الصارم
const businessInfo = {
    name: 'مكتبة دار اللغات',
    address: 'مول روضة العبور - محل 47، الدور الأول، الحي السادس، مدينة العبور',
    commercialRecord: '100160',
    taxNumber: '769499732',
};

const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
        case 'new': return { text: 'طلب جديد', className: styles.statusNew };
        case 'processing': return { text: 'جاري التجهيز', className: styles.statusProcessing };
        case 'delivered': return { text: 'تم التسليم', className: styles.statusDelivered };
        case 'cancelled': return { text: 'ملغي', className: styles.statusCancelled };
        default: return { text: 'غير معروف', className: '' };
    }
};
const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activePrintRequest, setActivePrintRequest] = useState<Order | null>(null);
    
    // 🎯 متغير جديد لتتبع نوع الرسالة المختارة لكل طلب بشكل مستقل
    const [selectedMsgTypes, setSelectedMessageType] = useState<Record<string, WhatsAppMessageType>>({});

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
            const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
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
                'مصدر الطلب': order.source === 'POS' ? 'الفرع' : 'أونلاين',
                'حالة الطلب': getStatusDetails(order.status).text,
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
        XLSX.writeFile(workbook, 'طلبات_دار_اللغات.xlsx');
    };

    // =========================================================================================
    // 🎯 محرك رسائل الواتساب الجديد والمطور بالكامل بناءً على طلبك الصارم والاستراتيجي
    // =========================================================================================
    const getWhatsAppLink = (order: Order, type: WhatsAppMessageType) => {
        const phone = order.shippingAddress?.phone || '';
        const name = order.shippingAddress?.recipientName || '';
        
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '2' + cleanPhone;
        } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('2')) {
            cleanPhone = '2' + cleanPhone;
        }

        // 🌟 1. تفكيك وجمع المنتجات الفعلية وتجهيزها كنص مقروء داخل الرسالة بدلاً من رقم الـ ID الجاف
        const itemsText = order.items && order.items.length > 0 
            ? order.items.map(item => `[${item.name} (x${item.quantity})]`).join(' و ')
            : 'مستلزمات تعليمية';

        let message = '';

        // 🌟 2. صياغة الخيارات الثلاثة المحدثة مع تثبيت مسمى "مكتبة دار اللغات" بالمفرد الصريح
        switch (type) {
            case 'processing':
                message = `أهلاً بك ${name} في مكتبة دار اللغات، بخصوص طلبك المشتمل على المنتجات: ${itemsText}. جاري تجهيز طلب حضرتك الآن بالمنتجات المطلوبة وسيتم إبلاغك فور تحرك الشحنة.`;
                break;
            case 'shipping':
                message = `أهلاً بك ${name} في مكتبة دار اللغات، بخصوص طلبك المشتمل على المنتجات: ${itemsText}. تم تسليم الطلبات بالمنتجات المطلوبة إلى شركة الشحن وجاري التوجه إليك.`;
                break;
            case 'with_delivery':
                message = `أهلاً بك ${name} في مكتبة دار اللغات، بخصوص طلبك المشتمل على المنتجات: ${itemsText}. طلب حضرتك مع المندوب الآن وسيتم التسليم اليوم من الساعه السادسة مساء الى 11 مساء.`;
                break;
            default:
                message = `أهلاً بك ${name} في مكتبة دار اللغات، بخصوص طلبك المشتمل على المنتجات: ${itemsText}.`;
        }

        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    if (loading) {
        return <div className={styles.loading}>جاري تحميل الطلبات الواردة وتدقيق الحسابات...</div>;
    }

    if (error) {
        return <div className={styles.error}>خطأ في جلب البيانات من السيرفر: {error}</div>;
    }
    return (
        <div className={styles.ordersContainer} dir="rtl">
            
            {/* 🎯 لوحة التحكم والشاشة الافتراضية تلتزم بالاختفاء بالكامل أثناء خروج الرول بفضل صمام الـ globals */}
            <div className={styles.noPrint}>
                <div className={styles.headerContainer}>
                    <h1 className={styles.title}>سجل الطلبات الواردة - مكتبة دار اللغات</h1>
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
                            
                            // قنص النوع الحالي المختار لهذا الطلب، وافتراضياً نضعه على "مع المندوب"
                            const currentMsgType = selectedMsgTypes[order.id] || 'with_delivery';

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
                                        
                                        <h3 className={styles.itemsTitle}>المنتجات المطلوبة فعلياً:</h3>
                                        <ul className={styles.itemsList}>
                                            {order.items && order.items.map((item, index) => (
                                                <li key={index} className={styles.item}>
                                                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className={styles.itemImage} style={{width: '40px', height: '40px', objectFit: 'cover'}} />}
                                                    <div className={styles.itemDetails}>
                                                        {/* 🎯 تم سحق وتطهير علامات الدولار المكسورة القديمة ليعرض الحساب نقياً بالمليم */}
                                                        <span className="text-xs sm:text-sm font-semibold">{item.name} (x{item.quantity}) - {item.price} EGP</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        {/* ========================================================================================= */}
                                        {/* 🎯 لوحة خيارات التحديث الفوري للواتساب: تظهر فقط للطلبات أونلاين لماميز العبور */}
                                        {/* ========================================================================================= */}
                                        {!isPOS && (
                                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>
                                                    <FaCommentDots className="inline ml-1" /> اختر نص رسالة التحديث المراد إرسالها للأم:
                                                </p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#334155' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                        <input 
                                                            type="radio" 
                                                            name={`msgType-${order.id}`} 
                                                            checked={currentMsgType === 'processing'}
                                                            onChange={() => setSelectedMessageType(prev => ({ ...prev, [order.id]: 'processing' }))}
                                                        />
                                                        <span>1️⃣ جاري التجهيز (بالمنتجات)</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                        <input 
                                                            type="radio" 
                                                            name={`msgType-${order.id}`} 
                                                            checked={currentMsgType === 'shipping'}
                                                            onChange={() => setSelectedMessageType(prev => ({ ...prev, [order.id]: 'shipping' }))}
                                                        />
                                                        <span>2️⃣ تم التسليم لشركة الشحن (بالمنتجات)</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                        <input 
                                                            type="radio" 
                                                            name={`msgType-${order.id}`} 
                                                            checked={currentMsgType === 'with_delivery'}
                                                            onChange={() => setSelectedMessageType(prev => ({ ...prev, [order.id]: 'with_delivery' }))}
                                                        />
                                                        <span>3️⃣ مع المندوب والتسليم اليوم (بالمنتجات)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
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

                                        {/* زر توليد بوليصة الشحن الحرارية المصغرة المجهّز لعين المندوب على مقاس الرول 80mm */}
                                        <button
                                            onClick={() => handlePrintLabel(order)}
                                            title="طباعة ملصق شحن حراري مصغر لهذا الطرد"
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
                                        >
                                            <FaPrint size={12} />
                                            <span>بوليصة</span>
                                        </button>

                                        {!isPOS && (
                                            <a 
                                                href={getWhatsAppLink(order, currentMsgType)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className={styles.whatsappButton}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <FaWhatsapp /> إرسال التحديث المختار
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
            {/* 🖨️ بوليصة الشحن الاحترافية لـ مكتبة دار اللغات: خط ضخم جداً (20px) وبراويز تمنع التقطيع */}
            {/* ========================================================================================= */}
            {activePrintRequest && (
                <div className="printOnly" dir="rtl" style={{ padding: '10px', color: '#000', background: '#fff' }}>
                    
                    {/* --- قسم الراسل (بيانات مكتبة دار اللغات الموحدة والمفردة صراحة) --- */}
                    <div style={{ border: '2px solid #000', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>من (الراسل):</p>
                        <h3 style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>{businessInfo.name}</h3>
                        <p style={{ margin: 0, fontSize: '11px' }}>{businessInfo.address}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>الرقم الضريبي: {businessInfo.taxNumber}</p>
                    </div>

                    {/* --- قسم المستلم ببرواز سميك وخط ضخم جداً (20px) منعاً لخطأ التسليم وجلب الكاش للعبور --- */}
                    <div style={{ border: '2px solid #000', padding: '15px', borderRadius: '8px', marginTop: '10px', textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>إلى (المستلم):</p>
                        <h3 style={{ margin: '8px 0', fontSize: '20px', fontWeight: 'bold' }}>{activePrintRequest.shippingAddress?.recipientName || 'عميل مجهول'}</h3>
                        <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: '500' }}>
                            {activePrintRequest.source === 'POS' ? 'شراء مباشر من الفرع' : `${activePrintRequest.shippingAddress?.governorate || ''}، ${activePrintRequest.shippingAddress?.city || ''}، ${activePrintRequest.shippingAddress?.streetAddress || ''}`}
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
                            الهاتف: {activePrintRequest.shippingAddress?.phone || 'لا يوجد'}
                        </p>
                    </div>

                    {/* --- قسم محتويات الطرد والمنتجات المصفاة بالمليم --- */}
                    <div style={{ border: '2px solid #000', padding: '10px', borderRadius: '8px', marginTop: '10px', textAlign: 'right' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>📦 محتويات الطرد:</p>
                        <ul style={{ margin: 0, paddingRight: '15px', fontSize: '12px', listStyleType: 'disc' }}>
                            {activePrintRequest.items?.map((item, idx) => (
                                <li key={idx} style={{ padding: '2px 0' }}>{item.name} (x{item.quantity})</li>
                            ))}
                        </ul>
                    </div>

                    {/* --- قسم التحصيل والباركود الختامي للمندوب لقطع الرول التلقائي وبمصاريف صفر --- */}
                    <div style={{ border: '2px solid #000', padding: '12px', borderRadius: '8px', marginTop: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                            <span>💰 إجمالي المطلوب تحصيله:</span>
                            <span>{(activePrintRequest.totalAmount || 0) + (activePrintRequest.source === 'POS' ? 0 : (activePrintRequest.shippingFee || 0))} EGP</span>
                        </div>
                        
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '3px', fontWeight: 'bold', margin: '5px 0' }}>
                                *{activePrintRequest.id.substring(0, 8).toUpperCase()}*
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: '500' }}>شحن سريع ومضمون - {businessInfo.name}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '9px', color: '#666' }}>رقم السجل: {businessInfo.commercialRecord}</p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default OrdersPage;
