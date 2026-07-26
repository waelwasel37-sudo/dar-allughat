import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import admin from 'firebase-admin'; 
// 🎯 تم الاستيراد الصحيح: جلب getDb للتحقق من الصلاحيات، و getSecondaryDb لحفظ المنتجات
import { getDb, getSecondaryDb } from "@/app/lib/firebase-admin";
import { getSession } from "@/app/lib/session"; 
import { Product } from "@/app/lib/types";
import { generateSlug } from "@/app/lib/utils";

export const dynamic = "force-dynamic";

// GET all products - يجلب المنتجات من القاعدة المخصصة الموحدة في أوروبا
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

// POST a new product - يتحقق من الأمان في القاعدة الأم ويكتب في القاعدة الجديدة
export async function POST(req: NextRequest) {
    try {
        // 1. 🎯 الأمان أولاً: الاتصال بالقاعدة الأم (default) لفحص جلسة تسجيل الدخول المشفرة
        const db_auth = await getDb();

        const session = await getSession();
        if (!session || !session.isLoggedIn || !session.username) {
            return NextResponse.json({ error: 'Unauthorized. No active session found.' }, { status: 401 });
        }

        const ADMIN_EMAIL = 'waelwasel37@gmail.com';
        if (session.username !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden. User is not authorized as admin.' }, { status: 403 });
        }

        // 2. 🎯 البيانات ثانياً: الاتصال بالقاعدة المخصصة في أوروبا لحفظ المنتج الجديد والأقسام الموحدة
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
