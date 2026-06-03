import { NextResponse } from "next/server";
import { getAuth } from "@/app/lib/firebase-admin"; // 💡 استخدام الدالة الذكية الجديدة

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // +++ START DIAGNOSTIC LOGGING +++
  console.log("--- Executing /api/auth/session-login ---");
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountVar) {
    console.log("SUCCESS: Environment variable FIREBASE_SERVICE_ACCOUNT_BASE64 is PRESENT.");
  } else {
    console.error("FATAL: Environment variable FIREBASE_SERVICE_ACCOUNT_BASE64 is MISSING or UNDEFINED.");
  }
  console.log("--- End of Diagnostic ---");
  // +++ END DIAGNOSTIC LOGGING +++

  try {
    const { idToken } = await request.json().catch(() => ({}));

    if (!idToken) {
      return NextResponse.json({ status: "skipped", message: "No token for guest user." }, { status: 200 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // 💡 استدعاء الدالة الذكية لضمان تهيئة المصادقة
    const auth = getAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: "success" });
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
