
// app/context/CartContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, CartContextType } from '@/app/lib/types';

// Define fbq on the window object for TypeScript
declare global {
    interface Window {
        fbq: (...args: any[]) => void;
    }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            try {
                const storedCart = localStorage.getItem('cart');
                if (storedCart) {
                    const parsedCart = JSON.parse(storedCart);
                    if (Array.isArray(parsedCart)) {
                        const validCart = parsedCart.filter(item => typeof item.slug === 'string' && item.slug);
                        setCart(validCart);
                        if (validCart.length !== parsedCart.length) {
                            localStorage.setItem('cart', JSON.stringify(validCart));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to parse cart from localStorage", error);
                localStorage.removeItem('cart');
            }
        }
    }, [isClient]);

    useEffect(() => {
        if (isClient) {
            try {
                localStorage.setItem('cart', JSON.stringify(cart));
            } catch (error) {
                console.error("Failed to save cart to localStorage", error);
            }
        }
    }, [cart, isClient]);

    const getCartTotal = () => {
        if (!isClient) return 0;
        return cart.reduce((total, item) => {
            const originalPrice = item.price || 0;
            const discountPercentage = item.discount || 0;
            const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
            return total + (discountedPrice * item.quantity);
        }, 0);
    };
    
    const getItemSubtotal = (item: CartItem) => {
        if (!isClient) return 0;
        const originalPrice = item.price || 0;
        const discountPercentage = item.discount || 0;
        const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
        return discountedPrice * item.quantity;
    };

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setMessage(null), 500);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const toggleCart = () => {
        setIsCartOpen(prev => !prev);
    };

    const addToCart = (product: Product, quantity: number = 1) => {
        if (!product.slug) {
            setMessage('خطأ: لا يمكن إضافة منتج بدون معرّف فريد (slug).');
            return;
        }

        // 🌟 حزام الأمان الأول: فحص المخزون قبل الإضافة (يمنع إضافة كتاب نفد مخزونه)
        if (product.stock !== undefined && product.stock <= 0) {
            setMessage(`عذراً، منتج "${product.name}" نفد من المخزون حالياً ولا يمكن إضافته.`);
            return;
        }

        let isStockExceeded = false;

        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.slug === product.slug);
            if (existingItem) {
                // 🌟 حزام الأمان الثاني: التأكد من أن العميل لا يطلب كمية أكبر من المتاحة في المخزن
                const totalRequested = existingItem.quantity + quantity;
                if (product.stock !== undefined && totalRequested > product.stock) {
                    isStockExceeded = true;
                    return currentCart; // إرجاع السلة كما هي دون زيادة
                }
                return currentCart.map(item =>
                    item.slug === product.slug ? { ...item, quantity: totalRequested } : item
                );
            } else {
                return [...currentCart, { ...product, quantity }];
            }
        });

        // إذا تجاوز العميل الحد المتاح في المخزن، نبهه ولا تفتح السلة
        if (isStockExceeded) {
            setMessage(`عذراً، لا يمكنك إضافة المزيد. الكمية المتاحة في المخزن هي ${product.stock} فقط.`);
            return;
        }

        setMessage(`${product.name} تمت إضافته إلى السلة!`);
        setIsCartOpen(true);

        // Fire Facebook Pixel AddToCart event with rich data
        if (typeof window.fbq === 'function') {
            const price = product.price || 0;
            const discount = product.discount || 0;
            const discountedPrice = price - (price * (discount / 100));

            window.fbq('track', 'AddToCart', {
                content_name: product.name,
                content_ids: [product.slug],
                content_type: 'product',
                value: discountedPrice * quantity,
                currency: 'EGP' 
            });
        }
    };

    const removeFromCart = (slug: string) => {
        setCart(currentCart => currentCart.filter(item => item.slug !== slug));
        setMessage('تمت إزالة المنتج من السلة.');
    };

    const updateQuantity = (slug: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(slug);
        } else {
            // 🌟 حزام الأمان الثالث: حماية دالة تحديث الكمية داخل صفحة السلة نفسها لكي لا يتخطى المخزون
            setCart(currentCart => {
                return currentCart.map(item => {
                    if (item.slug === slug) {
                        if (item.stock !== undefined && quantity > item.stock) {
                            // إذا حاول العميل كتابة رقم أكبر من المخزون، نثبته على الحد الأقصى للمخزون وننبهه
                            setMessage(`الكمية المتاحة للمنتج "${item.name}" هي ${item.stock} فقط.`);
                            return { ...item, quantity: item.stock };
                        }
                        return { ...item, quantity };
                    }
                    return item;
                });
            });
        }
    };

    const clearCart = () => {
        setCart([]);
        setMessage('تم تفريغ السلة.');
    };

    const isInCart = (slug: string) => {
        if (!isClient) return false;
        return cart.some(item => item.slug === slug);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getItemSubtotal,
            isInCart,
            message,
            isVisible,
            isCartOpen,
            toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
