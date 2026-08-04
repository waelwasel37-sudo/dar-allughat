"use client";

import { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaWhatsapp, FaTrash, FaTimes, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import styles from './SlideOutCart.module.css';
import AddressForm from './AddressForm';
import { CartItem } from '../lib/types';
import { addressSchema } from '../lib/schemas';

export default function SlideOutCart() {
  const cartContext = useCart();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cartContext) {
    return null;
  }

  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, getItemSubtotal, isCartOpen, toggleCart } = cartContext;

  // 🎯 تصحيح ذهبي: إذا كانت السلة مغلقة، لا تقم برندر أو عرض أي شيء نهائياً لحماية صفحات المقالات والجوال
  if (!isCartOpen) {
    return null;
  }

  const total = useMemo(() => getCartTotal(), [cart, getCartTotal]);

  const validationResult = useMemo(() => {
    return addressSchema.safeParse({ name, phone, governorate, address });
  }, [name, phone, governorate, address]);

  const isFormValid = validationResult.success;
  const firstError = !validationResult.success
    ? (validationResult.error.format()._errors[0] || validationResult.error.issues[0]?.message)
    : null;

  const handleCreateOrder = async () => {
    if (!isFormValid) {
      alert(firstError || 'الرجاء إدخال البيانات بشكل صحيح.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const orderPayload = {
      items: cart.map((item: CartItem) => ({
        productId: item.id,
        name: item.name,
        slug: item.slug,
        price: item.discount ? item.price * (1 - item.discount / 100) : item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
      })),
      totalAmount: total,
      shippingAddress: {
        recipientName: name,
        streetAddress: address,
        city: governorate,
        governorate: governorate,
        phone: phone,
      },
      status: 'new',
      payment: {
        method: 'cash_on_delivery',
        status: 'pending',
        amount: total,
        currency: 'EGP',
      },
      notes: 'تم إنشاء الطلب عبر سلة التسوق في الموقع.'
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تسجيل الطلب. الرجاء المحاولة مرة أخرى.');
      }

      const storePhoneNumber = '+201220396597';
        let message = "أهلاً، أود تأكيد الطلب التالي:\n\n" +
                      "--- معلومات العميل ---\n" +
                      `👤 *الاسم:* ${name}\n` +
                      `📞 *رقم الهاتف:* ${phone}\n` +
                      `🌍 *المحافظة:* ${governorate}\n` +
                      `📍 *العنوان:* ${address}\n\n` +
                      "--- تفاصيل الطلب ---\n";

        cart.forEach((item: CartItem) => {
            const finalPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
            message += "------------------------\n" +
                       `📖 *المنتج:* ${item.name}\n` +
                       `🔢 *الكود:* ${item.slug}\n` +
                       `📦 *الكمية:* ${item.quantity}\n` +
                       `💲 *السعر:* ${finalPrice.toFixed(2)} جنيه\n`;
        });

        message += "------------------------\n\n" +
                   `💰 *الإجمالي النهائي: ${total.toFixed(2)} جنيه*\n\n`;

      const whatsappUrl = `https://wa.me/${storePhoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      setTimeout(() => {
        clearCart();
        router.push('/thank-you');
        toggleCart();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
      alert(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`${styles.backdrop} ${isCartOpen ? styles.open : ''}`} onClick={toggleCart}></div>
      <div className={`${styles.cartDrawer} ${isCartOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <h2>سلة التسوق</h2>
          <button onClick={toggleCart} className={styles.closeButton} aria-label="إغلاق السلة"><FaTimes /></button>
        </div>

        {cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <h3>سلتك فارغة حالياً.</h3>
            <Link href="/" onClick={toggleCart} className={styles.continueShoppingButton}><FaArrowLeft /> ابدأ التسوق الآن</Link>
          </div>
        ) : (
          <>
            <div className={styles.cartContent}>
              {cart.map((item: CartItem) => {
                const finalPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
                return (
                  <div key={item.slug} className={styles.cartItem}>
                    <Image src={item.imageUrl || ''} alt={item.name} width={60} height={90} className={styles.cartItemImage} />
                    <div className={styles.cartItemDetails}>
                      <Link href={`/products/${item.slug}`} onClick={toggleCart} className={styles.cartItemName}>{item.name}</Link>
                      <span className={styles.finalPrice}>{finalPrice.toFixed(2)} جنيه</span>
                      <div className={styles.cartItemQuantity}>
                        <button onClick={() => updateQuantity(item.slug, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.slug, item.quantity + 1)}>+</button>
                      </div>
                      <div className={styles.subtotal}>الإجمالي: {getItemSubtotal(item).toFixed(2)} ج.م</div>
                    </div>
                    <button onClick={() => removeFromCart(item.slug)} className={styles.removeItemButton}><FaTrash /></button>
                  </div>
                );
              })}
            </div>

            <div className={styles.cartSummary}>
              <div className={styles.cartTotal}>الإجمالي: {total.toFixed(2)} ج.م</div>
              <AddressForm
                onNameChange={setName}
                onPhoneChange={setPhone}
                onGovernorateChange={setGovernorate}
                onAddressChange={setAddress}
              />
              {error && <p className={styles.errorMessage}>{error}</p>}
              <div className={styles.cartActions}>
                <button
                  onClick={handleCreateOrder}
                  className={`${styles.whatsappButton} ${!isFormValid || isLoading ? styles.disabledButton : ''}`}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? <FaSpinner className={styles.spinner} /> : <FaWhatsapp />}
                  {isLoading ? 'جاري تسجيل الطلب...' : 'إتمام الطلب وإرساله واتساب'}
                </button>
                <button onClick={clearCart} className={styles.clearCartButton}>تفريغ السلة</button>
              </div>
              {!isFormValid && (
                <p className={styles.validationMessage}>
                  {name || phone || governorate || address ? `📌 ${firstError}` : "📌 يرجى استكمال البيانات لتفعيل الطلب."}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}