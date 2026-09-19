// app/components/AddToCartButton.tsx
"use client";

import { useCart } from "../context/CartContext";
import { Product } from "../lib/types";
import styles from "./AddToCartButton.module.css";
import React from 'react'; // Import React to use MouseEvent type

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Stop the click event from bubbling up to the parent Link
    e.preventDefault();  // Prevent the default action of the parent Link (navigation)
    
    addToCart(product);
    
    // Provide immediate user feedback
    alert(`"${product.name}" تم إضافته إلى السلة!`);
  };

  return (
    <button onClick={handleAddToCart} className={styles.button}>
      أضف إلى السلة
    </button>
  );
}
