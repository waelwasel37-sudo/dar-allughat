import { NextResponse } from "next/server";
// 🎯 استيراد getAdminAuth بدلاً من الاستيراد المباشر
import { getAdminAuth } from "../../../lib/firebase-admin";
// 🎯 استيراد دالة جلب الجلسة الآمنة لتشغيل الكوكيز
import { getSession } from "@/app/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V8 (Hybrid) DEBUG: /api/auth/session-login execution started ---");

  try {
    const adminAuth = await getAdminAuth();
    const body = await request.json();
    const idToken = body.idToken || body.token;
    
    if (!idToken) {
      return NextResponse.json({ error: "Token payload is missing" }, { status: 400 });
    }

    console.log("[1/2] Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[2/2] ID token verified successfully. UID:", decodedToken.uid);

    // التحقق الصارم من بريدك الإلكتروني
    if (decodedToken.email !== "waelwasel37@gmail.com") {
      console.warn(`[⚠️ SECURITY WARNING] Unauthorized login attempt from: ${decodedToken.email}`);
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // 🎯 جلب الجلسة
    const session = await getSession();
    session.isLoggedIn = true;
    
    // 🎯 التصحيح: أخذ العنصر الأول من المصفوفة [0] لضمان تمرير نص (String) وليس مصفوفة
    session.username = decodedToken.email ? decodedToken.email.split('@')[0] : "Admin";
    
    // حفظ الجلسة وتوليد الكوكيز المشفرة في متصفحك
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

// 🎯 جديد ومحمي: منع خطأ 405 الصادر من السيرفر تماماً
// إذا حاول المتصفح استدعاء المسار عبر GET أثناء إعادة التوجيه، يتم تحويله لصفحة الدخول بأمان بدلاً من انهيار الطلب
export async function GET() {
  return NextResponse.redirect(new URL("/login", "https://hosted.app"));
}