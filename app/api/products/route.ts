import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
// 🎯 تم استخدام اسم الدالة المصلحة getAdminAuth لمنع أخطاء البناء والتعارض
import { getDb, getAdminAuth, admin } from "@/app/lib/firebase-admin";
import { Product } from "@/app/lib/types";
import { generateSlug } from "@/app/lib/utils";

export const dynamic = "force-dynamic";

// GET all products
export async function GET(req: NextRequest) {
    try {
        const db = await getDb(); // 🔑 استخدام await
        const productsCollection = db.collection("products");
        const productsSnapshot = await productsCollection.orderBy("createdAt", "desc").get();
        
        if (productsSnapshot.empty) {
            return NextResponse.json([]);
        }
        
        const products = productsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof admin.firestore.Timestamp 
                    ? data.createdAt.toDate().toISOString() 
                    : new Date(data.createdAt || Date.now()).toISOString(),
                updatedAt: data.updatedAt instanceof admin.firestore.Timestamp 
                    ? data.updatedAt.toDate().toISOString() 
                    : new Date(data.updatedAt || Date.now()).toISOString(),
            };
        });
        return NextResponse.json(products);
    } catch (error: any) {
        console.error("GET /api/products Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}

// POST a new product
export async function POST(req: NextRequest) {
    try {
        const firebaseAuth = await getAdminAuth(); // 🔑 استخدام الدالة المصلحة واسم متغير آمن
        const db = await getDb();     // 🔑 استخدام await

        const sessionCookie = (await cookies()).get("__session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized. No session cookie.' }, { status: 401 });
        }
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. User is not an admin.' }, { status: 403 });
        }

        const productData: Omit<Product, 'id'> = await req.json();

        if (!productData.name || !productData.price || !productData.imageUrl) {
            return NextResponse.json({ error: "Missing required fields: name, price, or imageUrl." }, { status: 400 });
        }

        const productsRef = db.collection('products');
        const baseSlug = productData.slug || generateSlug(productData.name);
        let newSlug = baseSlug;
        let counter = 1;
        while (true) {
            const snapshot = await productsRef.where('slug', '==', newSlug).limit(1).get();
            if (snapshot.empty) break;
            newSlug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        const categoryName = productData.category || 'Uncategorized';
        const categoryRef = db.collection('categories').doc(generateSlug(categoryName));
        const categoryDoc = await categoryRef.get();
        let categoryEmoji = '✨';
        if (categoryDoc.exists) {
             categoryEmoji = categoryDoc.data()?.emoji || '✨';
        } else {
            await categoryRef.set({ name: categoryName, emoji: categoryEmoji });
        }

        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const finalProduct: Omit<Product, 'id'> = {
            ...productData,
            slug: newSlug,
            category: categoryName,
            categoryEmoji: categoryEmoji, 
            secondaryImageUrl: productData.secondaryImageUrl || undefined,
            videoUrl: productData.videoUrl || undefined,
            createdAt: serverTimestamp as any, 
            updatedAt: serverTimestamp as any,
        };

        const docRef = await productsRef.add(finalProduct);

        return NextResponse.json({ message: "Product created successfully", id: docRef.id, slug: newSlug }, { status: 201 });

    } catch (error: any) {
        console.error("POST /api/products Error:", error);
        if (error.code === 'auth/session-cookie-expired') {
            return NextResponse.json({ error: 'Session expired, please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
