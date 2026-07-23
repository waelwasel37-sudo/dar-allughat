// app/api/product-feed/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { Product } from '@/app/lib/types';

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  try {
    const productsCollection = db.collection("products");
    const productsSnapshot = await productsCollection.orderBy("createdAt", "desc").get();
    
    const products: Product[] = productsSnapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
        updatedAt: data.updatedAt instanceof firestore.Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || Date.now()).toISOString(),
      } as Product;
    });

    const domain = process.env.NEXT_PUBLIC_SITE_URL;
    if (!domain) {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set in the environment variables.");
    }

    const feedItems = products.map(item => {
      const originalPrice = item.price || 0;
      const discountPercentage = item.discount || 0;
      const finalPrice = discountPercentage > 0
        ? originalPrice - (originalPrice * (discountPercentage / 100))
        : originalPrice;

      const description = (item.description || 'وصف غير متوفر حاليًا.').replace(/<[^>]*>/g, '');
      
      const productSlug = item.slug || item.id;
      const productLink = `${domain}/products/${encodeURIComponent(productSlug)}`;

      const availability = item.stock && item.stock > 0 ? 'in_stock' : 'out_of_stock';

      return `
        <item>
          <g:id>${item.id}</g:id>
          <g:title><![CDATA[${item.name}]]></g:title>
          <link><![CDATA[${productLink}]]></link>
          <g:price>${finalPrice.toFixed(2)} EGP</g:price>
          <description><![CDATA[${description}]]></description>
          <g:image_link><![CDATA[${item.imageUrl}]]></g:image_link>
          <g:availability>${availability}</g:availability>
          <g:condition>new</g:condition>
          <g:brand><![CDATA[مكتبات دار اللغات]]></g:brand>
          <g:google_product_category>Media &gt; Books</g:google_product_category>
        </item>
      `;
    }).join('');

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
        <channel>
          <title>موجز منتجات مكتبات دار اللغات</title>
          <link>${domain}</link>
          <description>قائمة محدثة بجميع الكتب والمنتجات المتوفرة في مكتبات دار اللغات.</description>
          ${feedItems}
        </channel>
      </rss>
    `.trim();

    return new NextResponse(xmlFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });

  } catch (error: any) {
    console.error("Error generating product feed:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
