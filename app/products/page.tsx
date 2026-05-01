
// ENGINEERING UPGRADE: V7 (Dynamic Server-Side Rendering)
// This page is now a dynamically rendered Server Component.

import { Suspense } from 'react';
import { getProducts } from '../lib/data';
import ProductsView from '../components/ProductsView';
import { Product } from '../lib/types';

// --- DYNAMIC RENDERING ---
// This ensures the page always fetches the latest product data on every request.
export const revalidate = 0;

// --- SERVER-SIDE DATA FETCHING ---
async function loadProducts(): Promise<Product[]> {
  try {
    const products = await getProducts();
    console.log('Fetched Products directly on server for /products page:', products);
    return products;
  } catch (error) {
    console.error("Error loading products for /products page:", error);
    return [];
  }
}

export default async function ProductsPage() {
  // Data is fetched on the server before the page is sent to the client.
  const products = await loadProducts();

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>جاري تحميل المنتجات...</div>}>
      <ProductsView products={products} />
    </Suspense>
  );
}
