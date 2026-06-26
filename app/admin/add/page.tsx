import '../../lib/firebase-admin'; // ENGINEERING: Force immediate initialization to prevent race conditions.

// ENGINEERING UPGRADE: V8 (Architectural Fix)
// This page is now a Server Component, responsible for fetching data 
// and passing it to the client component that handles the form logic.

import { getCategories } from '../../lib/data-server'; // CORRECT: Using server-only data fetching
import AddProductForm from './AddProductForm'; // The new client component for the form
import { Suspense } from 'react';
import { Category } from '../../lib/types'; // Import the Category type

// Ensure the page is dynamically rendered to get the latest categories if they ever change.
export const revalidate = 0;

export default async function AddProductPage() {
  // Fetch categories directly as an array of Category objects.
  const categories = await getCategories();

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>جاري تحميل النموذج...</p></div>}>
        {/* Pass the correctly typed array of objects to the client component */}
        <AddProductForm categories={categories} />
    </Suspense>
  );
}
