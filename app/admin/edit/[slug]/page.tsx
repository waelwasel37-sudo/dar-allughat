
// FINAL FIX: V15 PROMISE COMPLIANCE
// The Next.js 15 build process for this project requires BOTH `params`
// and `searchParams` to be treated as Promises. This code now complies fully.

import { getProductBySlug, getCategories } from '../../../lib/data-server';
import EditProductForm from './EditProductForm';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

export const revalidate = 0;

// Define props where BOTH `params` and `searchParams` are explicitly Promises
// to satisfy the build system's strict type constraints.
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EditProductPage(props: PageProps) {
  // Await the `params` promise to resolve the actual values, as it's used below.
  const params = await props.params;
  const { slug } = params;

  // Note: `searchParams` is not used in this component, but its type MUST be
  // a Promise to prevent the build from failing.

  const [product, categories] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>جاري تحميل النموذج...</p></div>}>
        <EditProductForm initialProduct={product} categories={categories} />
    </Suspense>
  );
}
