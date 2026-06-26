import { NextResponse } from "next/server";
import { getAuth } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V5 DEBUG: /api/auth/session-login execution started ---");
  
  let idToken;
  try {
    console.log("[1/8] Awaiting request body...");
    const body = await request.json();
    
    // حل مرن: التقاط التوكن سواء تم إرساله باسم idToken أو token
    idToken = body.idToken || body.token;
    console.log("[2/8] Request body parsed successfully.");
  } catch (e) {
    console.error("[DEBUG] Error parsing request JSON:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // منع السيرفر من الانهيار إذا كان التوكن مفقوداً تماماً وإعادة استجابة صريحة للمتصفح
  if (!idToken) {
    console.log("[❌] Error: No idToken or token found in request body.");
    return NextResponse.json(
      { error: "Token is missing from request body." },
      { status: 400 }
    );
  }
  console.log("[3/8] idToken/token is present.");

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  let auth;
  try {
    console.log("[4/8] Calling getAuth()...");
    auth = getAuth();
    console.log("[5/8] getAuth() successful.");
  } catch (e) {
    console.error("--- V5 CRITICAL: Error initializing Firebase Admin (getAuth) ---", e);
    return NextResponse.json(
      { error: "Server configuration error.", details: e instanceof Error ? e.message : "Failed to get auth instance." }, 
      { status: 500 } 
    );
  }

  let sessionCookie;
  try {
    console.log("[6/8] Calling createSessionCookie...");
    sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log("[7/8] createSessionCookie successful.");
  } catch (e) {
    console.error("--- V5 CRITICAL: Error creating session cookie ---", e);
    return NextResponse.json(
      { error: "Session creation failed. Your token might be expired or invalid.", details: e instanceof Error ? e.message : "Invalid ID token." }, 
      { status: 400 } // تحويله لـ 400 لمنع السيرفر من الانهيار بـ 500 إذا كان التوكن تالفاً
    );
  }

  try {
    console.log("[8/8] Generating raw response and headers...");
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    
    // حل مشكلة المتصفحات الصارمة بتمرير الـ __session cookie في الهيدر مباشرة
    const maxAgeSeconds = expiresIn / 1000;
    response.headers.append(
      "Set-Cookie",
      `__session=${sessionCookie}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`
    );

    console.log("--- V5 DEBUG: Raw Set-Cookie header applied. Responding with success. ---");
    return response;
  } catch (e) {
    console.error("--- V5 CRITICAL: Error setting response cookie ---", e);
    return NextResponse.json(
      { error: "Response configuration error.", details: e instanceof Error ? e.message : "Failed to set cookie on response." }, 
      { status: 500 } 
    );
  }
}