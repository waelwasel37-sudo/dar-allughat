import { NextResponse } from "next/server";
import { auth as adminAuth } from "../../../lib/firebase-admin"; // 🚀 المطابقة الصحيحة مع ملف الأدمن المحدث
import { DecodedIdToken } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

async function handler(request: Request) {
  console.log("--- V6 DEBUG: /api/auth/session-login execution started ---");

  let idToken;
  try {
    const body = await request.json();
    idToken = body.idToken;
    if (!idToken) throw new Error("idToken is missing from request body.");
  } catch (e) {
    const error = e as Error;
    console.error("[DEBUG] Error parsing request JSON:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let decodedToken: DecodedIdToken;
  try {
    console.log("[1/5] Verifying ID token...");
    // ⚡ التعديل الحاسم: استخدام دالة التوثيق المتوافقة مع ملف الأدمن المحدث
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[2/5] ID token verified successfully. UID:", decodedToken.uid);
  } catch (error) {
    const err = error as Error;
    console.error("--- V6 CRITICAL: Error verifying ID token ---", err);
    return NextResponse.json({ error: "Invalid token.", details: err.message }, { status: 401 });
  }

  // 🔐 قفل الأمان الحصري: منع أي بريد إلكتروني آخر في العالم من الدخول سواك
  if (decodedToken.email !== "waelwasel37@gmail.com") {
    console.warn(`[⚠️ SECURITY WARNING] Unauthorized login attempt from: ${decodedToken.email}`);
    return NextResponse.json({ error: "Access denied. Unauthorized administrator." }, { status: 403 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  let sessionCookie;
  try {
    console.log("[3/5] Creating session cookie...");
    // ⚡ التعديل الحاسم: استخدام دالة الكوكيز المتوافقة مع ملف الأدمن المحدث
    sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log("[4/5] Session cookie created successfully.");
  } catch (error) {
    const err = error as Error;
    console.error("--- V6 CRITICAL: Error creating session cookie ---", err);
    return NextResponse.json({ error: "Session creation failed.", details: err.message }, { status: 400 });
  }

  try {
    console.log("[5/5] Generating response with user data and setting cookie...");
    
    const userPayload = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      role: 'admin', 
    };

    const response = NextResponse.json({ status: "success", user: userPayload }, { status: 200 });
    
    response.cookies.set({
      name: "__session", 
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: "/",
      sameSite: "lax",
    });

    console.log("--- V6 DEBUG: Cookie set. Responding with success and user payload. ---");
    return response;
  } catch (e) {
    const error = e as Error;
    console.error("--- V6 CRITICAL: Error setting response cookie ---", error);
    return NextResponse.json({ error: "Response configuration error.", details: error.message }, { status: 500 });
  }
}

export { handler as POST };
