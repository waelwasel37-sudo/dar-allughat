'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; 
import { Product, OrderItem } from '../../lib/types'; 
import { FaBarcode, FaPrint, FaTrash, FaSearch, FaSpinner, FaPlus, FaMinus, FaCashRegister, FaFileExcel, FaPercentage } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

export default function POSPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading, user } = useAuth();

    // 🎯 كائن التحكم المركزي المطور: منسق بالعنوان التفصيلي الجغرافي والرابط الفعلي الصحيح
    const businessInfo = {
        name: 'مكتبة دار اللغات',
        address: 'مول روضة العبور - أمام سنترال العبور 2 - تقاطع أبو عباس المرسي مع رابعة العدوية، محل 47، الدور الأول داخل المول، الحي السادس، مدينة العبور، محافظة القليوبية', 
        commercialRecord: '100160',
        taxNumber: '769499732',
        whatsapp: '01220396597',
        storeUrl: 'https://hosted.app'
    };

    // المخزن المحلي وإدارة المنتجات داخل الكاش
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
    // سجل فواتير اليوم الخاص بالكاشير لتصديره للإكسيل في نهاية الوردية
    const [posOrdersLog, setPosOrdersLog] = useState<any[]>([]);

    // حالات إدارة النظام والتحميل والرسائل
    const [isFetchingProducts, setIsFetchingProducts] = useState(true);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // الـ State الخاص بحفظ رابط الـ QR Code المولد للفاتورة الورقية
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    // الـ References الخاصة بتجميع قراءات جهاز الباركود السريع
    const barcodeBufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    // 1. حماية الصفحة وقصرها على الأدمن أو الكاشير فقط
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

    // 🌟 توليد الـ QR Code تلقائياً برابط المنصة الفعلي المحقون بالكائن
    useEffect(() => {
        const generateStoreQR = async () => {
            try {
                const url = await QRCode.toDataURL(businessInfo.storeUrl, {
                    width: 90, 
                    margin: 1,
                    color: { dark: '#000000', light: '#ffffff' }
                });
                setQrCodeDataUrl(url);
            } catch (err) {
                console.error('فشل توليد الـ QR Code:', err);
            }
        };
        generateStoreQR();
    }, []);

    // 🌟 ميزة الـ Debounce المضافة لتأخير الفلترة الفائقة للأداء
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);
    // 2. جلب المخزن كاملاً مرة واحدة عند الفتح (توفيراً لعمليات قراءة Firebase Blaze)
    useEffect(() => {
        async function loadProducts() {
            try {
                setIsFetchingProducts(true);
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error('فشل جلب المنتجات من السيرفر');
                const data = await response.json();
                
                setAllProducts(Array.isArray(data) ? data : data.data || []);
            } catch (err: any) {
                setErrorMessage('حدث خطأ أثناء تحميل مخزن المنتجات: ' + err.message);
            } finally {
                setIsFetchingProducts(false);
            }
        }
        if (isAdmin) {
            loadProducts();
        }
    }, [isAdmin]);

    // 3. مستمع الأحداث الذكي لالتقاط جهاز الباركود تلقائياً في أي مكان بالصفحة
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            if (currentTime - lastKeyTimeRef.current > 50) {
                barcodeBufferRef.current = ''; 
            }
            lastKeyTimeRef.current = currentTime;

            if (e.key === 'Enter') {
                if (barcodeBufferRef.current.length > 2) {
                    handleBarcodeScanned(barcodeBufferRef.current.trim());
                    barcodeBufferRef.current = '';
                    e.preventDefault();
                }
                return;
            }

            if (e.key.length === 1) {
                barcodeBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [allProducts, cart]);

    const handleBarcodeScanned = (scannedCode: string) => {
        const foundProduct = allProducts.find(p => p.isbn === scannedCode);
        if (foundProduct) {
            const currentStock = foundProduct.stock ?? 0;
            if (currentStock <= 0) {
                setErrorMessage(`❌ عذراً، المنتج "${foundProduct.name}" نفذ من المخزون تماماً في المتجر ولا يمكن بيعه!`);
                setTimeout(() => setErrorMessage(null), 4000);
                return;
            }
            addToCart(foundProduct);
            try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==').play(); } catch{}
        } else {
            setErrorMessage(`الباركود الممسوح (${scannedCode}) غير مسجل لأي منتج!`);
            setTimeout(() => setErrorMessage(null), 4000);
        }
    };
    // 4. دالات التحكم في سلة المشتريات والكميات مع فحص حظر المخزون النافذ دائمًا
    const addToCart = (product: Product) => {
        const currentStock = product.stock ?? 0;
        if (currentStock <= 0) {
            setErrorMessage(`❌ عذراً، الكتاب/المنتج "${product.name}" نفذ من المخزون ولا يمكن إضافته للفاتورة!`);
            setTimeout(() => setErrorMessage(null), 4000);
            return;
        }

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.id === product.id);
            if (existingIndex > -1) {
                const currentQtyInCart = prevCart[existingIndex].quantity;
                if (currentQtyInCart >= currentStock) {
                    setErrorMessage(`⚠️ لا يمكن إضافة المزيد! الكمية المتاحة في المخزن هي ${currentStock} قطع فقط.`);
                    setTimeout(() => setErrorMessage(null), 3000);
                    return prevCart;
                }
                const newCart = [...prevCart];
                newCart[existingIndex].quantity += 1;
                return newCart;
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prevCart => 
            prevCart.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + delta;
                    const maxStock = item.stock ?? 0;
                    if (delta > 0 && newQty > maxStock) {
                        setErrorMessage(`⚠️ الحد الأقصى المتاح في المخزن لهذا المنتج هو ${maxStock} قطع.`);
                        setTimeout(() => setErrorMessage(null), 3000);
                        return item;
                    }
                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            }).filter(item => item.quantity > 0)
        );
    };

    const removeFromCart = (id: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    const getProductFinalPrice = (product: Product) => {
        const discount = product.discount || 0;
        if (discount > 0) {
            return product.price - (product.price * (discount / 100));
        }
        return product.price;
    };

    const getCartTotal = () => {
        return cart.reduce((sum, item) => sum + (getProductFinalPrice(item) * item.quantity), 0);
    };

    const getCartTotalSavings = () => {
        return cart.reduce((sum, item) => {
            const originalTotal = item.price * item.quantity;
            const finalTotal = getProductFinalPrice(item) * item.quantity;
            return sum + (originalTotal - finalTotal);
        }, 0);
    };

    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
        product.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    const handleCheckoutAndPrint = async () => {
        if (cart.length === 0) {
            setErrorMessage('السلة فارغة! امسح منتجاً أولاً لإنهاء الفاتورة.');
            return;
        }
        setIsSubmittingOrder(true);
        setErrorMessage(null);

        try {
            const token = user ? await user.getIdToken() : null;
            const orderItems: OrderItem[] = cart.map(item => ({
                productId: item.id,
                name: item.name,
                slug: item.slug,
                price: getProductFinalPrice(item), 
                quantity: item.quantity,
                imageUrl: item.imageUrl
            }));

            const checkoutData = {
                source: 'POS',
                items: orderItems,
                totalAmount: getCartTotal(),
                shippingFee: 0,
                payment: { method: 'cash', status: 'paid' }
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(checkoutData)
            });

            if (!response.ok) {
                const errResult = await response.json();
                throw new Error(errResult.error || 'فشل تسجيل الفاتورة بالسيرفر');
            }

            const resData = await response.json();
            const generatedOrderId = resData.orderId || `POS-${Date.now()}`;
            const timeString = new Date().toLocaleTimeString('ar-EG');
            const itemsSummary = cart.map(item => `${item.name} (${item.quantity} قطع)`).join(' - ');

            setPosOrdersLog(prev => [
                ...prev,
                {
                    'رقم الفاتورة': generatedOrderId,
                    'توقيت البيع': timeString,
                    'الأصناف المباعة': itemsSummary,
                    'إجمالي المبلغ (جنيه)': getCartTotal(),
                    'طريقة الدفع': 'نقداً'
                }
            ]);

            try {
                await fetch('/api/revalidate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify({ tags: ['products-list'] }), 
                });
            } catch (revalidateError) {
                console.error('فشل إرسال إشارة التحديث الدوري لكاش الأونلاين:', revalidateError);
            }

            setSuccessMessage('تم تسجيل المبيعات بنجاح وتحديث مخزن المتجر الإلكتروني حياً!');
            setTimeout(() => {
                window.print(); 
                setCart([]);
                setSuccessMessage(null);
            }, 500);

        } catch (err: any) {
            setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء البيع.');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const exportToExcel = () => {
        if (posOrdersLog.length === 0) {
            alert('لا توجد مبيعات مسجلة في شاشة الكاشير اليوم لتصديرها!');
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(posOrdersLog);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير مبيعات POS');
        const dateString = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `جرد_كاشير_POS_${dateString}.xlsx`);
    };

    if (authLoading || isFetchingProducts) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">جاري تحميل واجهة الكاشير وتهيئة المخزن اللحظي...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans text-right" dir="rtl">
            
            {/* 🛡️ حزام الحظر الخرساني: تصفير الهوامش قسرياً ينسف روابط المتصفح وأرقام الصفحات 1 و 2 و 3 نهائياً */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { 
                        background: white !important; 
                        color: black !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        width: 80mm !important; 
                    }
                    @page { 
                        size: 80mm auto; 
                        margin: 0mm !important; 
                    }
                    .print-card-wrapper {
                        page-break-inside: avoid !important;
                    }
                }
                @media screen {
                    .print-only { display: none !important; }
                }
            `}} />

            {/* شاشة العرض الرقمية للكاشير (تختفي تماماً أثناء الطباعة بفضل الـ no-print) */}
            <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-2rem)] sticky top-4">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <FaCashRegister className="text-2xl text-blue-600" />
                            <h1 className="text-xl font-bold text-gray-800">شاشة البيع المباشر (POS)</h1>
                        </div>
                        <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm">
                            <FaFileExcel /> <span>تصدير Excel ({posOrdersLog.length})</span>
                        </button>
                    </div>

                    {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-medium border border-red-200">{errorMessage}</div>}
                    {successMessage && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 font-medium border border-green-200">{successMessage}</div>}

                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl flex items-center gap-3 text-xs mb-4 border border-blue-100">
                        <FaBarcode className="text-lg animate-pulse" />
                        <span>النظام مستعد ومؤمن ضد المنتجات النافذة. امسح الباركود الآن لتنزيل المنتج بالسلة.</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pl-1">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col justify-center items-center text-gray-400 py-12">
                                <FaBarcode className="text-5xl mb-3 text-gray-300" />
                                <p className="text-sm">لا توجد منتجات في الفاتورة حالياً</p>
                            </div>
                        ) : (
                            cart.map(item => {
                                const hasDiscount = (item.discount || 0) > 0;
                                const finalPrice = getProductFinalPrice(item);
                                return (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-blue-600 font-mono">{finalPrice} EGP</span>
                                                {hasDiscount && (
                                                    <>
                                                        <span className="text-[10px] text-gray-400 line-through font-mono">{item.price} EGP</span>
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><FaPercentage className="text-[8px]" />{item.discount}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-sm">
                                            <button onClick={() => updateQuantity(item.id, 1)} className="text-blue-600 p-1 rounded"><FaPlus className="text-xs" /></button>
                                            <span className="font-bold text-sm px-1 min-w-[20px] text-center font-mono">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, -1)} className="text-red-600 p-1 rounded"><FaMinus className="text-xs" /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-600 p-2 mr-2">
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="border-t pt-4 mt-4 space-y-2">
                        {getCartTotalSavings() > 0 && (
                            <div className="flex justify-between items-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                <span>إجمالي توفير الخصومات للعميل:</span>
                                <span className="font-mono">-{getCartTotalSavings()} EGP</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">
                            <span>إجمالي الفاتورة الصافي:</span>
                            <span className="font-mono text-2xl text-blue-600">{getCartTotal()} EGP</span>
                        </div>
                        <button onClick={handleCheckoutAndPrint} disabled={isSubmittingOrder || cart.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md">
                            {isSubmittingOrder ? <FaSpinner className="animate-spin text-lg" /> : <FaPrint className="text-lg" />}
                            {isSubmittingOrder ? 'جاري حفظ الفاتورة وتحديث المخزن...' : 'إنهاء الفاتورة وطباعة 🖨️'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-2rem)]">
                    <div className="relative mb-6">
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                            <FaSearch />
                        </span>
                        <input type="text" placeholder="البحث اليدوي السريع باسم الكتاب، المنتج، أو الفئة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pl-1">
                        {filteredProducts.length === 0 ? (
                            <p className="col-span-full text-center text-gray-400 py-12 text-sm">لم يتم العثور على منتجات مطابقة للبحث اليدوي</p>
                        ) : (
                            filteredProducts.map(product => {
                                const hasDiscount = (product.discount || 0) > 0;
                                const finalPrice = getProductFinalPrice(product);
                                return (
                                    <button key={product.id} onClick={() => addToCart(product)} className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl flex flex-col justify-between text-right relative overflow-hidden shadow-sm active:scale-95 group">
                                        {hasDiscount && <span className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg">خصم {product.discount}%</span>}
                                        <div className="w-full mb-2 mt-2">
                                            <h3 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 group-hover:text-blue-700 min-h-[2rem]">{product.name}</h3>
                                            <span className="inline-block bg-white text-gray-500 px-2 py-0.5 rounded border text-[10px] mt-1 font-medium">{product.category}</span>
                                        </div>
                                        <div className="w-full flex justify-between items-center mt-2 border-t pt-2 border-gray-200">
                                            <span className="text-xs text-gray-400 font-mono block">المخزن: {product.stock ?? 0}</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-xs sm:text-sm text-blue-600 font-mono">{finalPrice} EGP</span>
                                                {hasDiscount && <span className="text-[10px] text-gray-400 line-through font-mono">{product.price} EGP</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 🖨️ هيكل الفاتورة المخصصة والمحكومة للطباعة الحرارية في ورقة واحدة صلبة */}
            {/* ========================================================================= */}
            <div className="print-only print-card-wrapper text-black font-mono w-full text-[11px] leading-tight max-w-[80mm] mx-auto" dir="rtl" style={{ padding: '12px 4px' }}>
                {/* 🎯 فرز فواصل الرأس: مسافات وعزل يمنع التصاق العناوين بجدول المنتجات */}
                <div className="text-center space-y-1 pb-3 mb-4" style={{ borderBottom: '1px dashed #000000', paddingBottom: '14px' }}>
                    {qrCodeDataUrl && (
                        <div className="flex justify-center mb-2">
                            <img src={qrCodeDataUrl} alt="Store QR Code" className="w-20 h-20 object-contain" />
                        </div>
                    )}
                    <h2 className="text-sm font-bold tracking-wide" style={{ margin: '4px 0 2px 0' }}>{businessInfo.name}</h2>
                    <p className="text-[10px] font-bold" style={{ margin: '0' }}>{businessInfo.address}</p>
                    <p className="text-[9px]" style={{ margin: '2px 0' }}>فاتورة مبيعات نقدية مبسطة (POS)</p>
                    <p className="text-[9px] font-mono" style={{ margin: '0' }}>التاريخ: {new Date().toLocaleString('ar-EG')}</p>
                </div>

                {/* جدول الأصناف والكميات المحاذاة والمحكومة ومغلق بالكامل */}
                <table className="w-full text-[10px] text-right mb-4" style={{ borderBottom: '1px dashed #000000', paddingBottom: '12px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold' }}>
                            <th className="pb-1 text-right" style={{ width: '55%', paddingBottom: '6px' }}>الصنف</th>
                            <th className="pb-1 text-center" style={{ width: '15%', paddingBottom: '6px' }}>الكمية</th>
                            <th className="pb-1 text-left" style={{ width: '30%', paddingBottom: '6px' }}>السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => {
                            const finalItemPrice = getProductFinalPrice(item);
                            return (
                                <tr key={item.id}>
                                    <td className="py-1 font-medium text-[10px] leading-tight break-words" style={{ paddingTop: '5px', paddingBottom: '6px' }}>{item.name}</td>
                                    <td className="py-1 text-center font-mono" style={{ paddingTop: '5px', paddingBottom: '6px' }}>{item.quantity}</td>
                                    <td className="py-1 text-left font-mono" style={{ paddingTop: '5px', paddingBottom: '6px' }}>{finalItemPrice * item.quantity} EGP</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* 🎯 فرز فواصل الحسابات المالية: عزل كامل يمنع التداخل مع المنتجات أو التوثيق */}
                <div className="space-y-1 text-[10px] mb-4 pb-2" style={{ borderBottom: '1px dashed #000000', paddingTop: '4px', paddingBottom: '12px' }}>
                    {getCartTotalSavings() > 0 && (
                        <div className="flex justify-between font-bold text-gray-700" style={{ margin: '2px 0' }}>
                            <span>إجمالي الخصم الممنوح:</span>
                            <span className="font-mono">-{getCartTotalSavings()} EGP</span>
                        </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm pt-1" style={{ borderTop: '1px dotted #000000', marginTop: '4px', paddingTop: '6px' }}>
                        <span>الصافي الإجمالي:</span>
                        <span className="font-mono text-base">{getCartTotal()} EGP</span>
                    </div>
                    <div className="flex justify-between text-[9px] pt-1" style={{ margin: '2px 0' }}>
                        <span>طريقة السداد:</span>
                        <span>نقداً (Cash) - مدفوعة ✅</span>
                    </div>
                </div>

                {/* 🎯 فرز فواصل الذيل القانوني: استدعاء ديناميكي مأمن من كائن التحكم الموحد المستوفي لجميع شروط المراجعة */}
                <div className="text-center text-[9px] space-y-1 pt-3 text-gray-700" style={{ marginTop: '14px' }}>
                    <p className="font-semibold" style={{ margin: '1px 0' }}>السجل التجاري: {businessInfo.commercialRecord}</p>
                    <p className="font-semibold" style={{ margin: '1px 0' }}>الرقم الضريبي: {businessInfo.taxNumber}</p>
                    <p className="text-[10px] font-bold text-black" style={{ marginTop: '10px', marginBottom: '2px' }}>شكراً لزيارتكم وثقتكم بـ {businessInfo.name} بالعبور!</p>
                    <p style={{ margin: '0' }}>للمتابعة عبر واتساب: {businessInfo.whatsapp}</p>
                    <p className="text-[8px] text-gray-400 font-mono" style={{ marginTop: '6px' }}>Powered by Next.js & Firebase (Cost: 0 EGP)</p>
                </div>
            </div>

        </div>
    );
}
