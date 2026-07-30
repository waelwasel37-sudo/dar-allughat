'use client';

import { useCart } from '@/app/context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';
import styles from './Cart.module.css';
import { CartItem } from '@/app/lib/types';

const Cart = () => {
  const { cart, toggleCart } = useCart();

  const totalItems = cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  return (
    <button onClick={toggleCart} className={styles.cartIcon} aria-label="افتح سلة التسوق">
      <FaShoppingCart size={24} />
      {totalItems > 0 && (
        <span className={styles.cartBadge}>{totalItems}</span>
      )}
    </button>
  );
};

export default Cart;
