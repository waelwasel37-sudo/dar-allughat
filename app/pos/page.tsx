'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; // تأكد من صحة مسار الـ Context في مشروعك
import { Product, OrderItem } from '../lib/types';
import { FaBarcode, FaPrint, FaTrash, FaSearch, FaSpinner, FaPlus, FaMinus, FaCashRegister, FaFileExcel, FaPercentage } from 'react-icons/fa';
// 📊 استيراد مكتبة SheetJS لتوليد ملفات الإكسيل تلقائياً
import * as XLSX from 'xlsx';
// 📱 مكتبة توليد الـ QR Code لتحويل رابط المتجر إلى رمز استجابة سريع في الفاتورة
import QRCode from 'qrcode';

export default function POSPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading, user } = useAuth();

    // المخزن المحلي وإدارة المنتجات داخل الكاش
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // 🚀 [تحسين] حالة للبحث المؤجل
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

    // 🚀 [تحسين] تأثير الـ Debounce لتأجيل البحث وتحسين الأداء
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // توليد الـ QR Code الخاص برابط المتجر الرئيسي مرة واحدة عند فتح الشاشة
    useEffect(() => {
        const generateStoreQR = async () => {
            try {
                // استخدام متغير البيئة لسهولة التعديل مستقبلاً
                const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://dar-allughat.com';
                const url = await QRCode.toDataURL(storeUrl, {
                    width: 120,
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
            addToCart(foundProduct);
            try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==').play(); } catch{}
        } else {
            setErrorMessage(`الباركود الممسوح (${scannedCode}) غير مسجل لأي منتج!`);
            setTimeout(() => setErrorMessage(null), 4000);
        }
    };

    // 4. دالات التحكم في سلة المشتريات والكميات مع رصد وحساب الخصومات
    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.id === product.id);
            if (existingIndex > -1) {
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
                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            }).filter(item => item.quantity > 0)
        );
    };

    const removeFromCart = (id: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };
    // دالة احترافية لحساب السعر النهائي للمنتج (سواء كان سعراً عادياً أو مخصوماً)
    const getProductFinalPrice = (product: Product) => {
        const discount = product.discount || 0;
        if (discount > 0) {
            return product.price - (product.price * (discount / 100));
        }
        return product.price;
    };

    // حساب إجمالي الفاتورة الحالية بناءً على السعر النهائي بعد الخصم لجميع القطع
    const getCartTotal = () => {
        return cart.reduce((sum, item) => sum + (getProductFinalPrice(item) * item.quantity), 0);
    };

    // حساب إجمالي الوفر المالي الفعلي للعميل من الخصومات لإظهاره في الخزينة والفاتورة
    const getCartTotalSavings = () => {
        return cart.reduce((sum, item) => {
            const originalTotal = item.price * item.quantity;
            const finalTotal = getProductFinalPrice(item) * item.quantity;
            return sum + (originalTotal - finalTotal);
        }, 0);
    };

    // 🚀 [تحسين] استخدام البحث المؤجل لفلترة المنتجات
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
        product.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    // 5. دالة إنهاء البيع وحفظ الفاتورة بالسيرفر وتحديث مخزن الأونلاين فوراً
    const handleCheckoutAndPrint = async () => {
        if (cart.length === 0) {
            setErrorMessage('السلة فارغة! امسح منتجاً أولاً لإنهاء الفاتورة.');
            return;
        }

        setIsSubmittingOrder(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const token = user ? await user.getIdToken() : null;
            
            // تجهيز كائن المنتجات المباعة بالسعر النهائي بعد الخصم لحفظها في الداتابيز
            const orderItems: OrderItem[] = cart.map(item => ({
                productId: item.id,
                name: item.name,
                slug: item.slug,
                price: getProductFinalPrice(item), // حفظ السعر الفعلي المخصوم بالسيرفر
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

            // حفظ الفاتورة في السجل المحلي لليوم شاملة الأسعار المخصومة تمهيداً لتصدير الإكسيل
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

            // 🔥 [تحسين أمني] مزامنة المخزن باستخدام مصادقة الأدمن بدلاً من مفتاح مكشوف
            let revalidationSuccessful = true;
            try {
                console.log('⚡ Attempting to revalidate online store cache...');
                const revalidateResponse = await fetch('/api/revalidate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify({ tags: ['products-list'] }),
                });
                if (!revalidateResponse.ok) {
                    revalidationSuccessful = false;
                    const err = await revalidateResponse.json();
                    console.error('Revalidation API error:', err.error || 'Unknown revalidation error');
                }
            } catch (revalidateError) {
                revalidationSuccessful = false;
                console.error('Failed to send revalidation request:', revalidateError);
            }

            // عرض رسالة النجاح المناسبة بناءً على نتيجة المزامنة
            if (revalidationSuccessful) {
                setSuccessMessage('تم البيع بنجاح وتحديث مخزن المتجر الإلكتروني فوراً!');
            } else {
                setSuccessMessage('⚠️ تم البيع، لكن فشلت مزامنة مخزن الأونلاين. يرجى المراجعة.');
            }
            
            setTimeout(() => {
                window.print();
                setCart([]);
                setSuccessMessage(null);
            }, 1500); // زيادة طفيفة للوقت للسماح بقراءة الرسالة

        } catch (err: any) {
            setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء البيع.');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    // دالة توليد وتصدير شيت الـ Excel
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
            {/* واجهة الكاشير المخصصة للشاشات (تختفي تلقائياً عند أمر الطباعة عبر CSS السفلي) */}
            <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                
                {/* الجزء الأيمن: إدارة الفاتورة الحالية وسلة المبيعات والتقارير */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-2rem)] sticky top-4">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <FaCashRegister className="text-2xl text-blue-600" />
                            <h1 className="text-xl font-bold text-gray-800">شاشة البيع المباشر (POS)</h1>
                        </div>
                        
                        <button
                            onClick={exportToExcel}
                            title="تصدير مبيعات الوردية الحالية إلى ملف Excel"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all active:scale-95"
                        >
                            <FaFileExcel className="text-sm" />
                            <span>تصدير Excel ({posOrdersLog.length})</span>
                        </button>
                    </div>

                    {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-medium border border-red-200">{errorMessage}</div>}
                    {successMessage && <div className={`${successMessage.includes('⚠️') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-600 border-green-200'} p-3 rounded-lg text-sm mb-4 font-medium border`}>{successMessage}</div>}

                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl flex items-center gap-3 text-xs mb-4 border border-blue-100">
                        <FaBarcode className="text-lg animate-pulse" />
                        <span>النظام مستعد لالتقاط جهاز الباركود تلقائياً. امسح أي منتج الآن لتنزيله بالسلة.</span>
                    </div>

                    {/* قائمة المشتريات داخل الفاتورة */}
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
                                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 transition-all">
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
                                            <button onClick={() => updateQuantity(item.id, 1)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><FaPlus className="text-xs" /></button>
                                            <span className="font-bold text-sm px-1 min-w-[20px] text-center font-mono">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, -1)} className="text-red-600 hover:bg-red-50 p-1 rounded"><FaMinus className="text-xs" /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-600 p-2 mr-2 transition-colors">
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* الجزء السفلي وحساب الإجمالي وزر الحفظ والطباعة */}
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
                        <button
                            onClick={handleCheckoutAndPrint}
                            disabled={isSubmittingOrder || cart.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                            {isSubmittingOrder ? <FaSpinner className="animate-spin text-lg" /> : <FaPrint className="text-lg" />}
                            {isSubmittingOrder ? 'جاري تسجيل الطلب وتزامن المخزن...' : 'إنهاء الفاتورة وطباعة 🖨️'}
                        </button>
                    </div>
                </div>
                {/* الجزء الأيسر: ميزة البحث اليدوي السريع واختيار المنتجات يدوياً */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-2rem)]">
                    <div className="relative mb-6">
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                            <FaSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="البحث اليدوي السريع باسم الكتاب، المنتج، أو الفئة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                        />
                    </div>

                    {/* شبكة عرض المنتجات المفلوترة للاختيار السريع بنقرة زر */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pl-1">
                        {filteredProducts.length === 0 && debouncedSearchQuery ? (
                            <p className="col-span-full text-center text-gray-400 py-12 text-sm">لم يتم العثور على منتجات مطابقة للبحث اليدوي</p>
                        ) : (
                            filteredProducts.map(product => {
                                const hasDiscount = (product.discount || 0) > 0;
                                const finalPrice = getProductFinalPrice(product);
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl flex flex-col justify-between text-right transition-all group shadow-sm active:scale-95 relative overflow-hidden"
                                    >
                                        {hasDiscount && (
                                            <span className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg flex items-center gap-0.5">
                                                خصم {product.discount}%
                                            </span>
                                        )}
                                        <div className="w-full mb-2 mt-2">
                                            <h3 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 group-hover:text-blue-700 min-h-[2rem]">{product.name}</h3>
                                            <span className="inline-block bg-white text-gray-500 px-2 py-0.5 rounded border text-[10px] mt-1 font-medium">{product.category}</span>
                                        </div>
                                        <div className="w-full flex justify-between items-center mt-2 border-t pt-2 border-gray-200 group-hover:border-blue-200">
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
            {/* 🖨️ هيكل الفاتورة المخصصة للطباعة الورقية الفورية (مضغوطة لورقة واحدة فقط) */}
            {/* ========================================================================= */}
            <div className="print-only text-black p-1 font-mono w-full text-[11px] leading-tight" dir="rtl">
                
                {/* رأس الفاتورة: الشعار والاسم والـ QR code بالأعلى */}
                <div className="text-center space-y-0.5 border-b border-black pb-2 mb-2">
                    {/* الشعار والـ QR Code الذكي المستبدل بالرابط الطويل */}
                    {qrCodeDataUrl && (
                        <div className="flex justify-center mb-1">
                            <img src={qrCodeDataUrl} alt="Store QR Code" className="w-16 h-16 object-contain" />
                        </div>
                    )}
                    <h2 className="text-sm font-bold tracking-wide">مكتبة دار اللغات</h2>
                    <p className="text-[9px]">فاتورة مبيعات نقدية مبسطة (POS)</p>
                    <p className="text-[9px] font-mono">التاريخ: {new Date().toLocaleString('ar-EG')}</p>
                </div>

                {/* جدول الأصناف والكميات بالأسعار المخصصة والنهائية */}
                <table className="w-full text-[10px] text-right mb-2 border-b border-black pb-1">
                    <thead>
                        <tr className="border-b border-black font-bold">
                            <th className="pb-0.5 text-right w-3/5">الصنف</th>
                            <th className="pb-0.5 text-center w-1/5">الكمية</th>
                            <th className="pb-0.5 text-left w-2/5">السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => {
                            const finalItemPrice = getProductFinalPrice(item);
                            return (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-0.5 font-medium text-[10px] leading-tight break-words">{item.name}</td>
                                    <td className="py-0.5 text-center font-mono">{item.quantity}</td>
                                    <td className="py-0.5 text-left font-mono">{finalItemPrice * item.quantity} EGP</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* الحسابات المالية الإجمالية والوفر من الخصومات داخل المحل */}
                <div className="space-y-0.5 text-[10px] mb-2 border-b border-black pb-1">
                    {getCartTotalSavings() > 0 && (
                        <div className="flex justify-between font-bold text-gray-700">
                            <span>إجمالي الخصم الممنوح:</span>
                            <span className="font-mono">-{getCartTotalSavings()} EGP</span>
                        </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm border-t border-dotted border-gray-400 pt-0.5">
                        <span>الصافي الإجمالي:</span>
                        <span className="font-mono">{getCartTotal()} EGP</span>
                    </div>
                    <div className="flex justify-between text-[9px] pt-1">
                        <span>طريقة السداد:</span>
                        <span>نقداً (Cash) - مدفوعة ✅</span>
                    </div>
                </div>

                {/* التوثيق القانوني: السجل التجاري والرقم الضريبي أسفل الفاتورة لسلامة المنشأة */}
                <div className="text-center text-[9px] space-y-0.5 border-t border-dotted border-gray-400 pt-2 pb-1 text-gray-700">
                    <p className="font-semibold">السجل التجاري: XXXXXX</p>
                    <p className="font-semibold">الرقم الضريبي: XXXXXXXXX-XXX</p>
                    <p className="text-[8px] font-medium mt-1">شكراً لزيارتكم وثقتكم بمكتبة دار اللغات!</p>
                </div>
            </div>

            {/* ستايل الميديا كويري الصارم لضغط الحجم للماكينات الحرارية ومنع خروج ورقة ثانية */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { 
                        background: white !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        width: 80mm !important; /* معيار عرض طابعات الفواتير الحرارية */
                    }
                    @page {
                        margin: 2mm !important; /* تقليص الهوامش الخارجية البيضاء تماماً */
                    }
                }
                @media screen {
                    .print-only { display: none !important; }
                }
            `}</style>
        </div>
    );
}
