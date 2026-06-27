import { NextResponse } from "next/server";
import { getAuth } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V5 DEBUG: /api/auth/session-login execution started ---");
  
  // حاقن أمن للمزامنة: تأمين قراءة المتغيرات أونلاين إذا كانت مرفوعة بأسماء SERVER_FB
  if (!process.env.FIREBASE_PRIVATE_KEY && process.env.SERVER_FB_PRIVATE_KEY) {
    process.env.FIREBASE_PRIVATE_KEY = process.env.SERVER_FB_PRIVATE_KEY;
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL && process.env.SERVER_FB_CLIENT_EMAIL) {
    process.env.FIREBASE_CLIENT_EMAIL = process.env.SERVER_FB_CLIENT_EMAIL;
  }
  if (!process.env.FIREBASE_PROJECT_ID && process.env.SERVER_FB_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = process.env.SERVER_FB_PROJECT_ID;
  }

  let idToken;
  try {
    console.log("[1/8] Awaiting request body...");
    const body = await request.json();
    idToken = body.idToken || body.token;
    console.log("[2/8] Request body parsed successfully.");
  } catch (e) {
    console.error("[DEBUG] Error parsing request JSON:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

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
      { status: 400 }
    );
  }

  try {
    console.log("[8/8] Generating response and setting cookie...");
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    
    response.cookies.set({
      name: "__session", 
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: "/",
      sameSite: "lax",
    });

    console.log("--- V5 DEBUG: Cookie set via NextResponse API. Responding with success. ---");
    return response;
  } catch (e) {
    console.error("--- V5 CRITICAL: Error setting response cookie ---", e);
    return NextResponse.json(
      { error: "Response configuration error.", details: e instanceof Error ? e.message : "Failed to set cookie on response." }, 
      { status: 500 } 
    );
  }
}