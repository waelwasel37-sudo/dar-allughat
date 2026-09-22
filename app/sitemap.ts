import { MetadataRoute } from 'next';
import { getProducts, getPosts } from './lib/data-server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dar-allughat-com--dar-allughat-97483992-fc6c5.us-central1.hosted.app';
  const staticLastMod = new Date('2026-09-22');

  // ============================================
  // 1. الصفحات الثابتة
  // ============================================
  const staticRoutes = [
    '',                    // الرئيسية
    '/about',              // من نحن
    '/contact',            // اتصل بنا
    '/blog',               // المدونة
    '/products',           // كل المنتجات
    '/privacy-policy',     // سياسة الخصوصية
    '/return-policy',      // سياسة الاسترجاع
    '/shipping-policy',    // سياسة الشحن
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: staticLastMod,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : route === '/products' ? 0.9 : 0.7,
  }));

  // ============================================
  // 2. أقسام المشروع الـ 11 (بالـ slug العربي الحقيقي)
  // ============================================
  const categorySlugs = [
    'كتب-خارجيه',                              // كتب خارجية
    'كتب-تنمية-مهارات-اطفال',                  // كتب تنمية مهارات أطفال
    'كتب-تأسيس-اطفال',                         // كتب تأسيس أطفال
    'كتب-مستوى-رفيع-لغات',                     // كتب مستوى رفيع لغات
    'كتب-مدرسيه',                              // كتب مدرسية
    'كتب-مرتجع',                               // كتب مرتجع
    'كتب-ازهرى',                               // كتب أزهرى
    'العاب-تنمية-مهارات-اطفال-مونتيسوري',      // ألعاب منتسوري (بدون همزة)
    'ادوات-مكتبيه-ومدرسيه',                    // أدوات مكتبية ومدرسية
    'قصص-اطفال',                               // قصص أطفال
    'شنط-مدرسية',                              // شنط مدرسية
  ];

  const categoryRoutes = categorySlugs.map((slug) => ({
    url: `${baseUrl}/?category=${encodeURIComponent(slug)}`,
    lastModified: staticLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // ============================================
  // 3. المنتجات
  // ============================================
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = (products || [])
      .filter((product: any) => !product.slug.endsWith('-1')) // فلترة المكرر
      .map((product: any) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt || staticLastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  // ============================================
  // 4. المقالات
  // ============================================
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPosts();
    postRoutes = (posts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || staticLastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...postRoutes];
}