import { getProductBySlug, getRelatedProducts } from '../../lib/data-server';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import ProductClientPage from './ProductClientPage';
import Breadcrumbs from '../../components/Breadcrumbs';

// الكاش الزمني تم إلغاؤه والاعتماد كلياً على التحديث عند الطلب (On-Demand Revalidation) لتوفير قراءات قاعدة البيانات.

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 1. تحسين الـ Metadata لضمان ظهور صور المنتجات في واتساب وفيسبوك وسكايب بشكل صحيح
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodeURIComponent(encodedSlug);
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'مكتبة دار اللغات - المنتج غير موجود', // 🌟 تم تعديلها إلى مكتبة
      description: 'عذراً، هذا المنتج الذي تبحث عنه غير متوفر حالياً.',
    };
  }

  const pageTitle = `مكتبة دار اللغات - ${product.name}`; // 🌟 تم تعديلها إلى مكتبة
  const pageDescription = (product.description || `اكتشف المزيد حول ${product.name} وأفضل الأسعار في مصر.`)
    .substring(0, 160);

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${slug}`,
      siteName: 'مكتبة دار اللغات', // 🌟 تم تعديلها إلى مكتبة
      images: [
        {
          url: product.imageUrl, 
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      locale: 'ar_EG',
      type: 'article',
    },
    // 🌟 الطريقة القياسية لحقن الـ custom meta tags لـ ISBN في Next.js بدون أخطاء TypeScript
    other: product.isbn ? {
      'product:isbn': product.isbn,
    } : {},
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [product.imageUrl],
    },
  };
}

const ProductDetailsPage = async ({ params, searchParams }: PageProps) => {
  // استخراج الـ slug بـ await لضمان التوافق مع إصدارات Next.js الحديثة ومنع أخطاء الـ Build
  const { slug: encodedSlug } = await params;
  
  // فك تشفير الـ slug يدويًا لضمان التعامل مع الأحرف العربية بشكل صحيح في روابط البحث والأرشفة
  const slug = decodeURIComponent(encodedSlug);

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // جلب المنتجات ذات الصلة بناءً على فئة المنتج والـ slug الحالي لتفادي تكراره في المقترحات
  const relatedProducts = await getRelatedProducts(product.category, product.slug);

  // 2. تحسين هيكل الـ JSON-LD Schema لمطابقة محركات البحث وجوجل فوراً
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    sku: product.slug, 
    isbn: product.isbn || '',
    mpn: product.isbn || product.slug,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${slug}`,
      priceCurrency: 'EGP',
      price: product.price, // السعر المبدئي المحفوظ في الكاش والمستهدف للـ SEO
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
      {/* حقن الـ Schema التوضيحية ليتعرف روبوت جوجل على مواصفات الكتاب والأسعار فوراً */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <Breadcrumbs crumbs={crumbs} />
      
      {/* 
        تمرير البيانات كـ props مبدئية لعرضها فوراً أمام جوجل والزوار، 
        على أن يتولى الـ Client Component تحديث السعر الدقيق والمخزون الحي بالخلفية.
      */}
      <ProductClientPage product={product} relatedProducts={relatedProducts} />
    </main>
  );
};

export default ProductDetailsPage;
