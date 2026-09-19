import '../../lib/firebase-admin'; // ENGINEERING: Force immediate initialization to prevent race conditions.

// 🎯 التصحيح الجذري لإنهاء خطأ الـ Build: استبدال الـ revalidate بالتمكين الديناميكي الكامل لمنع توقف فحص الـ Secret Manager
export const dynamic = 'force-dynamic';

import { getCategories } from '../../lib/data-server'; // CORRECT: Using server-only data fetching
import AddProductForm from './AddProductForm'; // The new client component for the form
import { Suspense } from 'react';
import { Category } from '../../lib/types'; // Import the Category type

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
