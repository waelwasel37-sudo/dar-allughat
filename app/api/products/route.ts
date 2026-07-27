import { NextRequest, NextResponse } from "next/server";
import admin from 'firebase-admin'; 
import { getDb, getSecondaryDb } from "@/app/lib/firebase-admin";
import { getSession } from "@/app/lib/session"; 
import { Product } from "@/app/lib/types";
import { generateSlug } from "@/app/lib/utils";

export const dynamic = "force-dynamic";

// GET all products - جلب كافة المنتجات وعرضها (مستقر وسليم)
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

// POST a new product - 🎯 إضافة منتج جديد بالتحقق الأمني الصريح والمباشر ببريدك
export async function POST(req: NextRequest) {
    try {
        let isAuthorized = false;
        const ADMIN_EMAIL = 'waelwasel37@gmail.com';

        // 1. التحقق الأول من الجلسة العادية (Iron Session)
        const session = await getSession();
        if (session && session.isLoggedIn && session.username === 'waelwasel37@gmail.com') {
            isAuthorized = true;
        }

        // 2. 🎯 التحقق الثاني من التوكن (Firebase Auth Token) بالبريد الصريح والمباشر لمنع خطأ 403
        if (!isAuthorized) {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                // تأمين استخراج التوكن بالكامل دون انقطاع عبر تخطي أول 7 أحرف
                const token = authHeader.substring(7).trim(); 
                try {
                    const decodedToken = await admin.auth().verifyIdToken(token);
                    
                    // فحص تطابق البريد الإلكتروني الصريح الممرر من حسابك
                    if (decodedToken && (decodedToken.email === 'waelwasel37@gmail.com' || decodedToken.admin === true)) {
                        isAuthorized = true;
                    }
                } catch (tokenError) {
                    console.error("API /products: Token verification failed:", tokenError);
                }
            }
        }

        // 3. إذا فشلت كل طرق التحقق، يتم رفض الطلب نهائياً وحماية السيرفر
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden. You are not authorized to perform this action.' }, { status: 403 });
        }

        // 4. إذا نجح التحقق، يستمر منطق إضافة وحفظ المنتج بكفاءة تامة
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