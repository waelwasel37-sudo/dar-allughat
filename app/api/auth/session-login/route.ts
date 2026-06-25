import { NextResponse } from "next/server";
import { getAuth } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V5 DEBUG: /api/auth/session-login execution started ---");
  
  let idToken;
  try {
    console.log("[1/8] Awaiting request body...");
    const body = await request.json();
    idToken = body.idToken;
    console.log("[2/8] Request body parsed successfully.");
  } catch (e) {
    console.error("[DEBUG] Error parsing request JSON:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!idToken) {
    console.log("[3/8] No idToken found. Skipping session for guest.");
    return NextResponse.json(
      { status: "skipped", message: "No token for guest user." },
      { status: 200 }
    );
  }
  console.log("[3/8] idToken is present.");

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
      { error: "Session creation failed.", details: e instanceof Error ? e.message : "Invalid ID token or Firebase error." }, 
      { status: 500 } 
    );
  }

  try {
    console.log("[8/8] Generating raw response and headers...");
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    
    // الحل الجذري لتخطي حظر متصفح فايرفوكس والـ Partitioning عن طريق الهيدرز الخام
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
