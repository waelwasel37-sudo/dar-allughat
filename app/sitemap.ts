
export const revalidate = 0;

import { MetadataRoute } from 'next';
import admin, { db } from '@/app/lib/firebase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dar-allughat.com';

  const fetchCollection = async (
    collectionName: string,
    baseUrl: string,
    priority: number,
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<MetadataRoute.Sitemap> => {
    if (!db) {
        console.warn(`Sitemap generation for '${collectionName}' skipped: Database not initialized.`);
        return [];
    }
    try {
      const snapshot = await db.collection(collectionName).orderBy('updatedAt', 'desc').get();
      const entries: MetadataRoute.Sitemap = [];

      snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        const data = doc.data();

        if (data.slug && typeof data.slug === 'string') {
          const updatedAt = data.updatedAt instanceof admin.firestore.Timestamp
            ? data.updatedAt.toDate()
            : new Date();

          const url = baseUrl.endsWith('=')
            ? `${siteUrl}${baseUrl}${encodeURIComponent(data.slug)}`
            : `${siteUrl}${baseUrl}/${data.slug}`;

          entries.push({
            url: url,
            lastModified: updatedAt,
            changeFrequency: changeFrequency,
            priority: priority,
          });
        }
      });

      return entries;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error fetching ${collectionName} for sitemap:`, error.message);
      } else {
        console.error(`An unknown error occurred while fetching ${collectionName} for sitemap.`);
      }
      return [];
    }
  };

  const productEntries = await fetchCollection('products', '/products', 0.8, 'weekly');
  const categoryEntries = await fetchCollection('categories', '/products?category=', 0.7, 'weekly');
  const blogPostEntries = await fetchCollection('posts', '/blog', 0.9, 'daily');

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/cart`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/policies/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/policies/returns`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/policies/shipping`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [...staticPages, ...productEntries, ...categoryEntries, ...blogPostEntries];
}
