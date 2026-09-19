import { NextRequest, NextResponse } from "next/server";
import admin from 'firebase-admin'; 
import { getDb, getSecondaryDb } from "@/app/lib/firebase-admin";
import { getSession } from "@/app/lib/session"; 
import { Product } from "@/app/lib/types";
import { generateSlug } from "@/app/lib/utils";

export const dynamic = "force-dynamic";

// =========================================================================
// 🔎 1. دالة جلب المنتجات (GET): تم تحديثها لتدعم البحث بالباركود الموفر للفاتورة
// =========================================================================
export async function GET(req: NextRequest) {
    try {
        const db = await getSecondaryDb();
        const productsCollection = db.collection("products");
        
        // [1] استخراج متغير الباركود من الرابط (Query Parameter) إذا وُجد
        // مثال للرابط: /api/products?barcode=9781234567890
        const { searchParams } = new URL(req.url);
        const barcode = searchParams.get('barcode');

        let productsSnapshot;

        // [2] التحقق من طريقة طلب البيانات لحماية فاتورة Firebase Blaze
        if (barcode) {
            // 🔥 حركة ذكية وموفرة: إذا أرسل الكاشير باركود، نبحث عنه مباشرة في Firestore
            // باستخدام حقل الـ 'isbn' المدمج وبحد أقصى وثيقة واحدة فقط (limit 1)
            // هذا التعديل يستهلك (عملية قراءة واحدة فقط 1 Read) بدلاً من قراءة المخزن بالكامل.
            productsSnapshot = await productsCollection.where("isbn", "==", barcode).limit(1).get();
        } else {
            // السلوك الافتراضي للموقع: جلب كل المنتجات مرتبة من الأحدث للأقدم
            productsSnapshot = await productsCollection.orderBy("createdAt", "desc").get();
        }
        
        // [3] إذا لم يتم العثور على أي منتج متوافق مع البحث
        if (productsSnapshot.empty) {
            return NextResponse.json({ debug_status: "collection_is_empty_or_not_found", data: [] });
        }
        
        // [4] تحويل البيانات القادمة من Firestore إلى كائنات JSON معالجة التواريخ
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

        // [5] إرجاع النتيجة (ستحتوي على منتج واحد فقط في حالة البحث بالباركود)
        return NextResponse.json(products);

    } catch (error: any) {
        console.error("CRITICAL GET /api/products Error:", error);
        return NextResponse.json({ status: "server_error", error_message: error.message }, { status: 500 });
    }
}

// =========================================================================
// 🛠️ 2. دالة إضافة منتج جديد (POST): تم الاحتفاظ بكود الحماية الأصلي كما هو
// =========================================================================
export async function POST(req: NextRequest) {
    try {
        let isAuthorized = false;
        const ADMIN_EMAIL = 'waelwasel37@gmail.com';

        // 1. التحقق من صلاحية الجلسة عبر Iron Session
        const session = await getSession();
        if (session && session.isLoggedIn && session.username === ADMIN_EMAIL) {
            isAuthorized = true;
        }

        // 2. التحقق من صلاحية الجلسة عبر Firebase Auth Token
        if (!isAuthorized) {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7).trim(); 
                try {
                    const decodedToken = await admin.auth().verifyIdToken(token);
                    if (decodedToken && (decodedToken.email === ADMIN_EMAIL || decodedToken.admin === true)) {
                        isAuthorized = true;
                    }
                } catch (tokenError) {
                    console.error("API /products: Token verification failed:", tokenError);
                }
            }
        }

        // 3. رفض الطلب فوراً إذا لم يكن المستخدم هو الـ Admin
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden. You are not authorized to perform this action.' }, { status: 403 });
        }

        // 4. معالجة وحفظ بيانات المنتج الجديد
        const db = await getSecondaryDb();
        const productData: Omit<Product, 'id'> = await req.json();

        // التأكد من وجود الحقول الإجبارية
        if (!productData.name || !productData.price || !productData.imageUrl) {
            return NextResponse.json({ error: "Missing required fields: name, price, or imageUrl." }, { status: 400 });
        }

        // إنشاء الـ Slug والتأكد من عدم تكراره في الداتابيز
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
        
        // التحقق من الفئة (Category) وإرفاق الـ Emoji الخاص بها
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
        
        // بناء كائن المنتج النهائي بأمان
        const finalProduct: any = {
            ...productData,
            slug: newSlug,
            category: categoryName,
            categoryEmoji: categoryEmoji,
            createdAt: serverTimestamp,
            updatedAt: serverTimestamp,
        };

        // تنظيف الكائن من أي حقول قيمتها undefined لمنع أخطاء فريزبيز
        Object.keys(finalProduct).forEach(key => {
            if (finalProduct[key] === undefined) {
                delete finalProduct[key];
            }
        });

        // حفظ المنتج في الـ Collection
        const docRef = await productsRef.add(finalProduct);

        return NextResponse.json({ message: "Product created successfully", id: docRef.id, slug: newSlug }, { status: 201 });

    } catch (error: any) {
        console.error("POST /api/products Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
