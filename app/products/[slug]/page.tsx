import { getProductBySlug, getRelatedProducts } from '../../lib/data-server';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import ProductClientPage from './ProductClientPage';
import Breadcrumbs from '../../components/Breadcrumbs';

// تحديث الصفحة كل ساعة لضمان توازن الأداء وتحديث البيانات
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 1. تحسين الـ Metadata لضمان ظهور صور المنتجات في واتساب وفيسبوك
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'مكتبات دار اللغات - المنتج غير موجود',
      description: 'عذراً، هذا المنتج الذي تبحث عنه غير متوفر حالياً.',
    };
  }

  const pageTitle = `مكتبات دار اللغات - ${product.name}`;
  const pageDescription = (product.description || `اكتشف المزيد حول ${product.name} وأفضل الأسعار في مصر.`)
    .substring(0, 160);

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${slug}`,
      siteName: 'مكتبات دار اللغات',
      images: [
        {
          url: product.imageUrl, // تأكد أنه رابط كامل يبدأ بـ https
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      locale: 'ar_EG',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [product.imageUrl],
    },
  };
}

const ProductDetailsPage = async ({ params, searchParams }: PageProps) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // استخدام الـ slug بدلاً من id لجلب المنتجات ذات الصلة تماشياً مع فلسفة المشروع
  const relatedProducts = await getRelatedProducts(product.category, product.slug);

  // 2. تحسين JSON-LD Schema (الـ SKU أصبح هو الـ slug)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    sku: product.slug, // توحيد المعرف ليكون slug
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${slug}`,
      priceCurrency: 'EGP',
      price: product.price,
      // الربط مع حالة المخزون أو الطلب المسبق
      availability: (product.stock ?? 0) > 0 
        ? 'https://schema.org/InStock' 
        : (product.preOrderEnabled ? 'https://schema.org/PreOrder' : 'https://schema.org/OutOfStock'),
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  const crumbs = [
    { label: 'الرئيسية', href: '/' },
    { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
    { label: product.name },
  ];

  return (
    <main>
      {/* حقن الـ Schema في الـ Head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Breadcrumbs crumbs={crumbs} />
      
      {/* ملاحظة: تأكد من حذف Breadcrumbs و JSON-LD من داخل ملف ProductClientPage لمنع التكرار */}
      <ProductClientPage product={product} relatedProducts={relatedProducts} />
    </main>
  );
};

export default ProductDetailsPage;
