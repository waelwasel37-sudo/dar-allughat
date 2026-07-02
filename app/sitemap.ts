export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { MetadataRoute } from 'next';
import { getAdminAuth } from './lib/firebase-admin'; 
import { getProducts, getPosts } from './lib/data-server'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dar-allughat.com'; 

  const staticRoutes = [
    '', '/about', '/contact', '/blog', '/privacy-policy'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.7,
  }));

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

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPosts();
    postRoutes = (posts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Error fetching live posts for sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes, ...postRoutes];
}