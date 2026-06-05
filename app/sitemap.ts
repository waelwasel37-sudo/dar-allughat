// 🚀 السطر السحري: إجبار محركات البحث على جلب البيانات الحية فوراً من Firestore عند كل زيارة للملف
export const dynamic = 'force-dynamic';
export const revalidate = 0; // تعطيل الكاش نهائياً لضمان الفورية

import { MetadataRoute } from 'next';
import { getProducts, getPosts } from './lib/data-server'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dar-allughat.com'; 

  // 1. الصفحات الثابتة الأساسية للموقع
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/blog',
    '/privacy-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.7,
  }));

  // 2. صفحات المنتجات الديناميكية (تُجلب حية فوراً)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt || new Date().toISOString(),
      changeFrequency: 'always' as const, // إخبار جوجل أن هذه الصفحة تتحدث باستمرار
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error fetching live products for sitemap:", error);
  }

  // 3. صفحات المقالات والمدونة الديناميكية
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPosts();
    postRoutes = posts.map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Error fetching live posts for sitemap:", error);
  }

  // دمج كافة المسارات الحية وإعادتها لمحركات البحث
  return [
    ...staticRoutes,
    ...productRoutes,
    ...postRoutes,
  ];
}
