import { NextRequest, NextResponse } from "next/server";
import admin from 'firebase-admin'; 
// 🎯 تم تصحيح الاستيراد بناءً على ملاحظتك الدقيقة
import { getDb, getSecondaryDb } from "@/app/lib/firebase-admin";
import { getSession } from "@/app/lib/session"; 
import { Product } from "@/app/lib/types";
import { generateSlug } from "@/app/lib/utils";

export const dynamic = "force-dynamic";

// GET all products - (يبقى كما هو بدون تغيير)
export async function GET(req: NextRequest) {
    try {
        const db = await getSecondaryDb();
        const productsCollection = db.collection("products");
        const productsSnapshot = await productsCollection.orderBy("createdAt", "desc").get();
        
        if (productsSnapshot.empty) {
            return NextResponse.json({ debug_status: "collection_is_empty_or_not_found", data: [] });
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
        console.error("CRITICAL GET /api/products Error:", error);
        return NextResponse.json({ status: "server_error", error_message: error.message }, { status: 500 });
    }
}

// POST a new product - 🎯 تم تطبيق الحل الأمني المزدوج المصحح
export async function POST(req: NextRequest) {
    try {
        let isAuthorized = false;
        const ADMIN_EMAIL = 'waelwasel37@gmail.com';

        // 1. التحقق من الجلسة (Iron Session)
        const session = await getSession();
        if (session && session.isLoggedIn && session.username === ADMIN_EMAIL) {
            isAuthorized = true;
        }

        // 2. إذا لم تكن الجلسة موجودة، التحقق من التوكن عبر الحزمة الرسمية admin.auth()
        if (!isAuthorized) {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split('Bearer ')[1];
                try {
                    // 🎯 التعديل الحاسم الذي اقترحته: استخدام admin.auth() لحل الخطأ
                    const decodedToken = await admin.auth().verifyIdToken(token);
                    if (decodedToken.email === ADMIN_EMAIL || decodedToken.admin === true) {
                        isAuthorized = true;
                    }
                } catch (tokenError) {
                    console.error("API /products: Token verification failed:", tokenError);
                }
            }
        }

        // 3. إذا فشلت كل طرق التحقق، يتم رفض الطلب
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden. You are not authorized to perform this action.' }, { status: 403 });
        }

        // 4. إذا نجح التحقق، يستمر منطق إضافة المنتج
        const db = await getSecondaryDb();
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
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
