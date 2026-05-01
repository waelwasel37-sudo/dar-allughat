"use client";

import { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaWhatsapp, FaTrash, FaTimes, FaArrowLeft } from 'react-icons/fa';
import styles from './SlideOutCart.module.css';
import AddressForm from './AddressForm';
import CartRecommendations from './CartRecommendations'; // <-- 1. Import the new component
import { CartItem } from '../lib/types';
import { addressSchema } from '../lib/schemas';

export default function SlideOutCart() {
  const cartContext = useCart();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState(''); 
  const [address, setAddress] = useState('');

  if (!cartContext) {
    return null; 
  }

  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, getItemSubtotal, isCartOpen, toggleCart } = cartContext;

  const total = useMemo(() => getCartTotal(), [cart, getCartTotal]);

  const validationResult = useMemo(() => {
    return addressSchema.safeParse({ name, phone, governorate, address });
  }, [name, phone, governorate, address]);

  // تم تعديل هذا السطر ليتوافق مع Zod و TypeScript
  const isFormValid = validationResult.success;
  const firstError = !validationResult.success 
    ? (validationResult.error.format()._errors[0] || validationResult.error.issues[0]?.message) 
    : null;

  const handleWhatsAppOrder = () => {
    if (!isFormValid) {
        alert(firstError || 'الرجاء إدخال البيانات بشكل صحيح.');
        return;
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
        const originalPrice = item.price || 0;
        const finalPrice = item.discount ? originalPrice * (1 - item.discount / 100) : originalPrice;
        message += "------------------------\n" +
                   `📖 *المنتج:* ${item.name}\n` +
                   `🔢 *الكود:* ${item.slug}\n` +
                   `📦 *الكمية:* ${item.quantity}\n` +
                   `💲 *السعر:* ${finalPrice.toFixed(2)} جنيه\n` +
                   `🖼️ *الصورة:* ${item.imageUrl}\n` +
                   `🔗 *الرابط:* ${window.location.origin}/products/${item.slug}\n`;
    });
    
    message += "------------------------\n\n" +
               `💰 *الإجمالي النهائي: ${total.toFixed(2)} جنيه*\n\n`;

    const whatsappUrl = `https://wa.me/${storePhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => { 
      router.push('/thank-you'); 
      toggleCart(); // Close the cart after order
    }, 1000);
  };

  return (
    <>
      <div className={`${styles.backdrop} ${isCartOpen ? styles.open : ''}`} onClick={toggleCart}></div>
      <div className={`${styles.cartDrawer} ${isCartOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <h2>سلة التسوق</h2>
          <button onClick={toggleCart} className={styles.closeButton}><FaTimes /></button>
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

            {/* <-- 2. Add the component here, passing the cart items */}
            <CartRecommendations cartItems={cart} />

            <div className={styles.cartSummary}>
              <div className={styles.cartTotal}>الإجمالي: {total.toFixed(2)} ج.م</div>
              <AddressForm 
                onNameChange={setName}
                onPhoneChange={setPhone}
                onGovernorateChange={setGovernorate}
                onAddressChange={setAddress}
              />
              <div className={styles.cartActions}>
                <button 
                  onClick={handleWhatsAppOrder} 
                  className={`${styles.whatsappButton} ${!isFormValid ? styles.disabledButton : ''}`}
                  disabled={!isFormValid}
                >
                  <FaWhatsapp /> إرسال الطلب عبر واتساب
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