
import { ReactNode } from 'react';

// Defines the shape of props for Next.js pages
export type PageProps<T = { slug?: string }> = {
    params: Promise<T>; 
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Represents a product in the store. 
 * Properties are made optional if they might not exist for every product document in Firestore.
 */
export type Product = {
  id: string; // Unique identifier from Firestore
  name: string; // Product name
  slug: string; // URL-friendly slug
  price: number; // The main price of the product
  imageUrl: string; // Main image URL
  category: string; // The category the product belongs to
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  
  // Optional properties
  sku?: string;
  description?: string;
  discount?: number; // Discount percentage
  stock?: number; // Available stock quantity
  year?: number; // Manufacturing or release year
  imagePath?: string; // Path for Firebase Storage if applicable
  categoryEmoji?: string;
  secondaryImageUrl?: string;
  videoUrl?: string;
  ratingCount?: number; // Number of ratings received
  averageRating?: number; // Average rating score
  preOrderEnabled?: boolean; // Whether pre-ordering is enabled
  releaseDate?: string; // Expected release date for pre-orders
  isbn?: string; // 🌟 ISBN/GTIN for the product
};

// A cart item is a product with a quantity
export type CartItem = Product & {
  quantity: number;
};

// This is the data structure for creating a new order from the cart
export type OrderData = {
  customerName: string;
  customerPhone: string;
  customerGovernorate: string;
  customerAddress: string;
  items: CartItem[];
  total: number;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
};

export type Category = {
  id: string;
  name: string;
  emoji?: string;
  slug?: string;
};

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl?: string; // Optional: URL for the post's feature image
  description?: string; // Optional: A short summary of the post
  createdAt: string;
  updatedAt: string;
}

export type SchoolListRequest = {
  id: string;
  fullName: string;
  phone?: string;
  address?: string;
  imageUrl: string;
  imagePath?: string;
  status: 'new' | 'in-progress' | 'completed';
  createdAt: string; // String on client
};

// Defines the shape of the shopping cart context
export type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (slug: string) => void;
    updateQuantity: (slug: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getItemSubtotal: (item: CartItem) => number;
    isInCart: (slug: string) => boolean;
    message: string | null;
    isVisible: boolean;
    isCartOpen: boolean;
    toggleCart: () => void;
};

// --- Order Schema Definitions ---

// واجهة لبيانات عنوان الشحن
export interface ShippingAddress {
    recipientName: string;
    streetAddress: string;
    city: string;
    governorate: string; // محافظة
    postalCode?: string;
    phone: string;
}

// واجهة لكل منتج داخل الطلب
export interface OrderItem {
    productId: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

// واجهة لمعلومات الدفع
export interface PaymentDetails {
    method: 'credit_card' | 'cash_on_delivery' | 'installment';
    transactionId?: string; // ID من بوابة الدفع
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number;
    currency: 'EGP' | 'USD'; // عملة الدفع
}

// واجهة لمعلومات التقسيط (إذا كان الدفع بالتقسيط)
export interface InstallmentDetails {
    provider: string; // اسم شركة التقسيط (e.g., 'valu', 'souhoola')
    plan: string; // وصف الخطة (e.g., '6 months, 0% interest')
    monthlyPayment: number;
    totalAmount: number;
    numberOfMonths: number;
}

// الواجهة الرئيسية للطلب (Order Schema)
export interface Order {
    id: string;
    userId: string; // ID المستخدم الذي قام بالطلب
    items: OrderItem[];
    totalAmount: number; // المبلغ الإجمالي للطلب
    shippingAddress: ShippingAddress;
    shippingFee: number; // رسوم الشحن
    status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    payment: PaymentDetails;
    installment?: InstallmentDetails; // اختياري: يضاف فقط في حالة الدفع بالتقسيط
    createdAt: string;
    updatedAt: string;
    trackingNumber?: string; // رقم تتبع الشحنة
    notes?: string; // ملاحظات من العميل
}
