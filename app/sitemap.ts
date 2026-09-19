import { MetadataRoute } from 'next';
import { getProducts, getPosts } from './lib/data-server'; 

// 👇 تم التطهير النهائي: تم إزالة خطوط force-dynamic و revalidate=0 لمنع استهلاك خطة Blaze المالي.
// الآن سيعتمد الـ sitemap على دوال الكاش المستقرة والآمنة التي بنيناها في data-server.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // استخدام المتغير العام للمشروع لتحديد رابط الموقع ديناميكياً بدلاً من الرابط الثابت
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hosted.app'; 

  // 1. المسارات الثابتة العامة (المستخرجة من تقرير الـ Build الفعلي لمشروعك)
  const staticRoutes = [
    '',               // الرئيسية
    '/about',         // من نحن
    '/contact',       // اتصل بنا
    '/blog',          // المدونة العامة
    '/products',      // صفحة المنتجات العامة
    '/privacy-policy', 
    '/return-policy', 
    '/shipping-policy'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const, 
    priority: route === '' ? 1.0 : route === '/products' ? 0.9 : 0.7,
  }));

  // 2. مسارات تفاصيل المنتجات الديناميكية (تُقرأ بسرعة ومن الكاش دون استهلاك Firebase)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = (products || []).map((product: any) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt || new Date().toISOString(),
      changeFrequency: 'always' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error fetching live products for sitemap:", error);
  }

  // 3. مسارات تفاصيل مقالات المدونة الديناميكية
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPosts();
    postRoutes = (posts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error fetching live posts for sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes, ...postRoutes];
}