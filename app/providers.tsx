'use client';

import { AuthProvider } from '@/app/context/AuthContext';
import { CartProvider } from '@/app/context/CartContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
