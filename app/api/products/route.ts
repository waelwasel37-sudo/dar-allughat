
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

import admin, { db, auth } from "@/app/lib/firebase-admin";
import { Product } from "@/app/lib/types";
import { generateSlug } from "@/app/lib/utils";


// Ensures the function is always run dynamically on the server
export const dynamic = "force-dynamic";

// GET all products
export async function GET(req: NextRequest) {
    if (!db) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const productsCollection = db.collection("products");
        const productsSnapshot = await productsCollection.orderBy("createdAt", "desc").get();
        if (productsSnapshot.empty) {
            return NextResponse.json([]);
        }
        const products = productsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)).toISOString(),
                updatedAt: (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)).toISOString(),
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
    if (!auth || !db || !admin) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        // 1. Authorization: Verify user is an admin
        const sessionCookie = (await cookies()).get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized. No session cookie.' }, { status: 401 });
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. User is not an admin.' }, { status: 403 });
        }

        // 2. Data Handling: Read the JSON body
        const productData: Omit<Product, 'id'> = await req.json();

        if (!productData.name || !productData.price || !productData.imageUrl) {
            return NextResponse.json({ error: "Missing required fields: name, price, or imageUrl." }, { status: 400 });
        }

        const productsRef = db.collection('products');

        // 3. Server-Side Slug Generation: Ensure a unique slug
        const baseSlug = productData.slug || generateSlug(productData.name);
        let newSlug = baseSlug;
        let counter = 1;
        while (true) {
            const snapshot = await productsRef.where('slug', '==', newSlug).limit(1).get();
            if (snapshot.empty) break;
            newSlug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        // 4. Category Management: Ensure category exists
        const categoryName = productData.category || 'Uncategorized';
        const categoryRef = db.collection('categories').doc(generateSlug(categoryName));
        const categoryDoc = await categoryRef.get();
        let categoryEmoji = '✨';
        if (categoryDoc.exists) {
             categoryEmoji = categoryDoc.data()?.emoji || '✨';
        } else {
            await categoryRef.set({ name: categoryName, emoji: categoryEmoji });
        }

        // 5. Database Write: Prepare the final object for Firestore
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
