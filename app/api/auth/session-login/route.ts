import { NextResponse } from "next/server";
import * as adminInstance from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- 🕵️‍♂️ RUNTIME DIAGNOSTIC START: /api/auth/session-login ---");
  
  try {
    const body = await request.json();
    const idToken = body.idToken || body.token;
    
    if (!idToken) {
      console.error("[❌ DIAGNOSTIC] idToken is totally missing from frontend payload");
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    console.log("[1] Checking available exports in firebase-admin lib...");
    // طباعة محتويات ملف الأدمن للتحقق من الدوال المصدرة أونلاين
    console.log("[🔍 KEYS FOUND]:", Object.keys(adminInstance));

    let authObj;
    // فحص الطريقة الصحيحة لاستدعاء مكتبة التوثيق
    if (typeof adminInstance.getAuth === 'function') {
      console.log("[2] Invoking via getAuth() function");
      authObj = adminInstance.getAuth();
    } else if ((adminInstance as any).auth) {
      console.log("[2] Invoking via auth object property");
      authObj = (adminInstance as any).auth;
    } else {
      throw new Error("CRITICAL: Neither getAuth() nor auth object exists in firebase-admin file!");
    }

    console.log("[3] Generating Session Cookie on Google Cloud...");
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await authObj.createSessionCookie(idToken, { expiresIn });
    console.log("[4] Session Cookie generated successfully!");

    const response = NextResponse.json({ status: "success" }, { status: 200 });
    response.cookies.set({
      name: "__session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    });

    return response;

  } catch (error: any) {
    // 💥 صيد الأخطاء الجسيمة وطباعة تفاصيلها كاملة في السجلات (Logs)
    console.error("--- 🚨 CRITICAL RUNTIME EXCEPTION DETECTED ---");
    console.error("Error Message:", error?.message || error);
    console.error("Error Stack Trace:", error?.stack || "No stack trace available");
    
    // إرجاع تفاصيل الخطأ البرمجي للواجهة الأمامية لمنع الـ 500 الصامتة
    return NextResponse.json({ 
      error: "Internal Server Diagnostic Break", 
      message: error?.message || "Unknown exception",
      stack: error?.stack || null
    }, { status: 500 });
  }
}
