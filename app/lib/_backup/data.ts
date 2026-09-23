
import { collection, getDocs, doc, getDoc, Timestamp, query, where, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from './types';

const generateSlug = (text: string): string => {
    if (!text) return 'product';
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '') || 'product';
};

const safeParseNumber = (value: any, fallback = 0): number => {
  if (value === undefined || value === null) return fallback;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

const safeParseDate = (value: any, fallback: string = new Date().toISOString()): string => {
    if (!value) return fallback;
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date.toISOString();
    }
    return fallback;
};

const createProductFromDoc = (docSnap: any): Product => {
    const data = docSnap.data();
    if (!data) {
        // Create a fallback product shell if data is missing
        return {
            id: docSnap.id,
            name: 'Unnamed Product',
            slug: 'product-' + docSnap.id,
            price: 0,
            imageUrl: '',
            category: 'غير مصنف',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    const name = data.name || 'Unnamed Product';
    const price = data.price ?? data.priceAfter ?? data.priceBefore ?? 0;

    const product: Product = {
        id: docSnap.id,
        name: name,
        slug: data.slug || generateSlug(name),
        price: safeParseNumber(price, 0),
        imageUrl: data.imageUrl || data.image || '',
        category: data.category || 'غير مصنف',
        createdAt: safeParseDate(data.createdAt),
        updatedAt: safeParseDate(data.updatedAt),
        
        // Assign optional fields with safe fallbacks
        sku: data.sku || '',
        description: data.description || '',
        discount: safeParseNumber(data.discount, 0),
        stock: safeParseNumber(data.stock, 0),
        year: safeParseNumber(data.year, undefined),
        imagePath: data.imagePath || '',
        categoryEmoji: data.categoryEmoji || '',
        secondaryImageUrl: data.secondaryImageUrl || '',
        videoUrl: data.videoUrl || '',
        ratingCount: safeParseNumber(data.ratingCount, 0),
        averageRating: safeParseNumber(data.averageRating, 0),
    };
    // If year was not present, remove it instead of defaulting to 0
    if (data.year === undefined || data.year === null) {
        delete product.year;
    }

    return product;
};

export async function getProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) {
      console.warn("No products found.");
      return [];
    }
    const products = snapshot.docs.map(createProductFromDoc);
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return products;
  } catch (error) {
    console.error("Critical error in getProducts:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(collection(db, 'products'), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.warn(`No product found with slug: ${slug}`);
      return null;
    }
    return createProductFromDoc(snapshot.docs[0]);
  } catch (error) {
    console.error(`Error fetching product with slug "${slug}":`, error);
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, 'products', id));
    if (!docSnap.exists()) {
      console.warn(`No product found with ID: ${id}`);
      return null;
    }
    return createProductFromDoc(docSnap);
  } catch (error) {
    console.error(`Error fetching product with ID "${id}":`, error);
    return null;
  }
}

export async function getRelatedProducts(category: string, currentProductId: string): Promise<Product[]> {
    try {
        if (!category || category === 'غير مصنف') return [];
        const q = query(collection(db, 'products'), where('category', '==', category), limit(5));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs
            .map(createProductFromDoc)
            .filter(p => p.id !== currentProductId)
            .slice(0, 4);
    } catch (error) {
        console.error(`Error fetching related products for "${category}":`, error);
        return [];
    }
}
