'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; // تأكد من صحة مسار الـ Context في مشروعك
import { Product, OrderItem } from '../lib/types';
import { FaBarcode, FaPrint, FaTrash, FaSearch, FaSpinner, FaPlus, FaMinus, FaCashRegister, FaFileExcel } from 'react-icons/fa';
// 📊 استيراد مكتبة SheetJS لتوليد ملفات الإكسيل تلقائياً في المتصفح
import * as XLSX from 'xlsx';

export default function POSPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading, user } = useAuth();

    // المخزن المحلي وإدارة المنتجات داخل الكاش
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
    
    // 🌟 سجل فواتير اليوم الخاص بالكاشير لتصديره للإكسيل في نهاية الوردية
    const [posOrdersLog, setPosOrdersLog] = useState<any[]>([]);

    // حالات إدارة النظام والتحميل والرسائل
    const [isFetchingProducts, setIsFetchingProducts] = useState(true);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // الـ References الخاصة بتجميع قراءات جهاز الباركود السريع
    const barcodeBufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    // 1. حماية الصفحة وقصرها على الأدمن أو الكاشير فقط
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, authLoading, router]);

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

    // 4. دالات التحكم في سلة المشتريات والكميات
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

    const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 5. دالة إنهاء البيع وحفظ الفاتورة بالسيرفر مع تسجيلها محلياً للإكسيل
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
                price: item.price,
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

            // 🌟 حفظ الفاتورة في السجل المحلي لليوم تمهيداً لتصدير الإكسيل
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

            setSuccessMessage('تم تسجيل المبيعات وتحديث مخزن Firebase بنجاح!');
            
            setTimeout(() => {
                window.print();
                setCart([]);
                setSuccessMessage(null);
            }, 500);

        } catch (err: any) {
            setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء البيع.');
        } finally {
            // 🎯 تم التصحيح الجذري هنا بناءً على ملحوظة المطور الممتازة
            setIsSubmittingOrder(false);
        }
    };

    // 📊 دالة توليد وتصدير شيت الـ Excel الاحترافي لجرد الخزينة والمبيعات
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
                        
                        {/* 📊 زر تصدير جرد اليوم لشيت إكسيل المضاف حديثاً */}
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
                    {successMessage && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 font-medium border border-green-200">{successMessage}</div>}

                    {/* تنبيه حالة جهاز الباركود */}
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
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 transition-all">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
                                        <span className="text-xs text-gray-500 font-mono">{item.price} EGP</span>
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
                            ))
                        )}
                    </div>

                    {/* الجزء السفلي وحساب الإجمالي وزر الحفظ والطباعة */}
                    <div className="border-t pt-4 mt-4 space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl">
                            <span>إجمالي الفاتورة:</span>
                            <span className="font-mono text-2xl text-blue-600">{getCartTotal()} EGP</span>
                        </div>
                        <button
                            onClick={handleCheckoutAndPrint}
                            disabled={isSubmittingOrder || cart.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-base font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                            {isSubmittingOrder ? <FaSpinner className="animate-spin text-lg" /> : <FaPrint className="text-lg" />}
                            {isSubmittingOrder ? 'جاري تسجيل الطلب...' : 'إنهاء الفاتورة وطباعة 🖨️'}
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

                    {/* شبكة عرض المنتجات المفلوترة للكاشير للاختيار السريع بنقرة زر */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pl-1">
                        {filteredProducts.length === 0 ? (
                            <p className="col-span-full text-center text-gray-400 py-12 text-sm">لم يتم العثور على منتجات مطابقة للبحث اليدوي</p>
                        ) : (
                            filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl flex flex-col justify-between text-right transition-all group shadow-sm active:scale-95"
                                >
                                    <div className="w-full mb-2">
                                        <h3 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 group-hover:text-blue-700 min-h-[2rem]">{product.name}</h3>
                                        <span className="inline-block bg-white text-gray-500 px-2 py-0.5 rounded border text-[10px] mt-1 font-medium">{product.category}</span>
                                    </div>
                                    <div className="w-full flex justify-between items-center mt-2 border-t pt-2 border-gray-200 group-hover:border-blue-200">
                                        <span className="text-xs text-gray-400 font-mono block">الكمية: {product.stock ?? 0}</span>
                                        <span className="font-bold text-xs sm:text-sm text-blue-600 font-mono">{product.price} EGP</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
            {/* ========================================================================= */}
            {/* 🖨️ هيكل الفاتورة المخصصة للطباعة الورقية فقط (تظهر عند استدعاء window.print) */}
            {/* ========================================================================= */}
            <div className="print-only text-black p-4 font-mono w-full" dir="rtl">
                <div className="text-center space-y-1 border-b-2 border-dashed border-black pb-4 mb-4">
                    <h2 className="text-xl font-bold">مكتبة دار اللغات للنشر والتوزيع</h2>
                    <p className="text-xs">فاتورة مبيعات نقدية (فرع المحل)</p>
                    <p className="text-[10px] font-mono">التاريخ: {new Date().toLocaleString('ar-EG')}</p>
                    <p className="text-[10px]">نوع الطلب: شراء مباشر من الفرع (POS)</p>
                </div>

                {/* جدول الأصناف في الورقة المطبوعة */}
                <table className="w-full text-xs text-right mb-4">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="pb-1 text-right">الصنف</th>
                            <th className="pb-1 text-center">الكمية</th>
                            <th className="pb-1 text-left">السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => (
                            <tr key={item.id} className="border-b border-gray-300">
                                <td className="py-1 text-sm font-bold">{item.name}</td>
                                <td className="py-1 text-center font-mono">{item.quantity}</td>
                                <td className="py-1 text-left font-mono">{item.price * item.quantity} EGP</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* الحساب النهائي للفاتورة في الورقة */}
                <div className="border-t-2 border-dashed border-black pt-3 space-y-1 text-sm">
                    <div className="flex justify-between font-bold">
                        <span>إجمالي الفاتورة:</span>
                        <span className="font-mono">{getCartTotal()} EGP</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>طريقة الدفع:</span>
                        <span>نقداً (Cash)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>حالة السداد:</span>
                        <span>مدفوعة بالكامل ✅</span>
                    </div>
                </div>

                <div className="text-center text-[10px] mt-8 pt-4 border-t border-gray-400">
                    <p>شكراً لزيارتكم وثقتكم بنا!</p>
                </div>
            </div>

            {/* ستايل الميديا كويري للتحكم بالظهور والإخفاء بين الشاشة والورق المطبوع */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                }
                @media screen {
                    .print-only { display: none !important; }
                }
            `}</style>
        </div>
    );
}
