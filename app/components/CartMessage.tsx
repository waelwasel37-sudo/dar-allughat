// app/components/CartMessage.tsx
"use client";

import { useCart } from '@/app/context/CartContext';
import styles from './CartMessage.module.css';

const CartMessage = () => {
    const { message, isVisible } = useCart();

    if (!message) return null;

    return (
        <div className={`${styles.cartMessage} ${isVisible ? styles.visible : ''}`}>
            {message}
        </div>
    );
};

export default CartMessage;
