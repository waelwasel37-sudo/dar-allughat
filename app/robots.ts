import { MetadataRoute } from 'next';

// This file is generated dynamically on the server.
// It instructs search engine crawlers which pages they are allowed to access
// and provides the location of the sitemap.

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dar-allughat-97483992-fc6c5.web.app';

  return {
    rules: [
        {
            userAgent: '*', // Applies to all bots
            allow: '/',       // Allow crawling of the entire site by default
            disallow: '/admin/', // Disallow crawling of the admin section
        }
    ],
    sitemap: `${siteUrl}/sitemap.xml`, // Points to the dynamic sitemap
  };
}
