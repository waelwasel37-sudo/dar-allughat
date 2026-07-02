import { NextResponse } from "next/server";
// 🎯 استيراد getAdminAuth بدلاً من الاستيراد المباشر
import { getAdminAuth } from "../../../lib/firebase-admin";
// 🎯 استيراد دالة جلب الجلسة الآمنة التي أنشأناها لتشفير الكوكيز
import { getSession } from "@/app/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V8 (Hybrid) DEBUG: /api/auth/session-login execution started ---");

  try {
    // 🎯 استدعاء getAdminAuth للحصول على كائن المصادقة
    const adminAuth = await getAdminAuth();
    const body = await request.json();
    const idToken = body.idToken || body.token;
    
    if (!idToken) {
      return NextResponse.json({ error: "Token payload is missing" }, { status: 400 });
    }

    console.log("[1/2] Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[2/2] ID token verified successfully. UID:", decodedToken.uid);

    // التحقق من البريد الإلكتروني الخاص بالأدمن لضمان الصلاحية
    if (decodedToken.email !== "waelwasel37@gmail.com") {
      console.warn(`[⚠️ SECURITY WARNING] Unauthorized login attempt from: ${decodedToken.email}`);
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // 🎯 جديد: جلب الجلسة الحالية وتخزين البيانات المشفرة بداخلها
    const session = await getSession();
    session.isLoggedIn = true;
    session.username = decodedToken.email ? decodedToken.email.split('@')[0] : "Admin";
    
    // 🎯 جديد: حفظ الجلسة لإرسال الكوكيز المشفرة إلى متصفح المستخدم تلقائياً
    await session.save();
    console.log("[3/3] Session saved and encrypted cookie generated successfully.");

    console.log("--- V8 SUCCESS: Responding with light success to bypass CDN limit ---");
    return NextResponse.json({ 
      status: "success", 
      user: { uid: decodedToken.uid, email: decodedToken.email } 
    }, { status: 200 });

  } catch (error) {
    const err = error as Error;
    console.error("--- V8 CRITICAL ERROR ---", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}