import { NextResponse } from "next/server";
import admin from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // +++ START DIAGNOSTIC LOGGING +++
  console.log("--- Executing /api/auth/session-login ---");
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountVar) {
    console.log("SUCCESS: Environment variable FIREBASE_SERVICE_ACCOUNT_BASE64 is PRESENT.");
    console.log(`Variable length: ${serviceAccountVar.length}`);
  } else {
    console.error("FATAL: Environment variable FIREBASE_SERVICE_ACCOUNT_BASE64 is MISSING or UNDEFINED.");
  }
  console.log("--- End of Diagnostic ---");
  // +++ END DIAGNOSTIC LOGGING +++

  try {
    const { idToken } = await request.json().catch(() => ({}));

    // 💡 صمام الأمان الحاسم: إذا كان التوكن فارغاً (حالة زوار الصفحة الرئيسية)، ننهي الطلب بنجاح 200 لمنع ظهور خطأ 500 في الـ F12
    if (!idToken) {
      return NextResponse.json({ status: "skipped", message: "No token for guest user." }, { status: 200 });
    }

    // Set session expiration.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // Create the session cookie.
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for the response.
    const response = NextResponse.json({ status: "success" });
    
    // 💡 التعديل العبقري الخاص بك:
    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true, 
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (e) {
    console.error("Session Login Error:", e);
    return NextResponse.json(
      { 
        error: "Failed to create session.", 
        details: e instanceof Error ? e.message : "An unknown error occurred." 
      }, 
      { status: 500 } 
    );
  }
}