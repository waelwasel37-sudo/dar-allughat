
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
};

// A cart item is a product with a quantity
export type CartItem = Product & {
  quantity: number;
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