"use client";

import { useCart } from '../context/CartContext';
import CartRecommendations from './CartRecommendations';

export default function RelatedProductsBar() {
  const cartContext = useCart();

  if (!cartContext) return null;

  const { isCartOpen, cart } = cartContext;

  // 🎯 الشرط السحري: إذا كانت السلة مفتوحة، اختفِ تماماً ولا تضايق العميل أثناء كتابة بياناته!
  if (isCartOpen || cart.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      zIndex: 99, // أقل من الـ Backdrop والـ Drawer الخاص بالسلة لضمان عدم التغطية
      padding: '1rem',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      <div className="container mx-auto">
        <h4 className="text-sm font-bold mb-2 text-gray-700">منتجات قد تهمك وتكمل عجلتك الدراسية:</h4>
        <CartRecommendations cartItems={cart} />
      </div>
    </div>
  );
}