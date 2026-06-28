import { NextResponse } from "next/server";
import { auth as adminAuth } from "../../../lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

async function handler(request: Request) {
  console.log("--- V8 (Hybrid) DEBUG: /api/auth/session-login execution started ---");

  let idToken;
  try {
    const body = await request.json();
    // 🛡️ User's flexible token capture
    idToken = body.idToken || body.token;
    if (!idToken) throw new Error("Token payload is missing from request body.");
  } catch (e) {
    const error = e as Error;
    console.error("[DEBUG] Error parsing request JSON:", error);
    return NextResponse.json({ error: "Invalid request body", details: error.message }, { status: 400 });
  }

  let decodedToken: DecodedIdToken;
  try {
    console.log("[1/6] Verifying ID token...");
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[2/6] ID token verified successfully. UID:", decodedToken.uid);
  } catch (error) {
    const err = error as Error;
    console.error("--- V8 CRITICAL: Error verifying ID token ---", err);
    return NextResponse.json({ error: "Invalid token.", details: err.message }, { status: 401 });
  }

  if (decodedToken.email !== "waelwasel37@gmail.com") {
    console.warn(`[⚠️ SECURITY WARNING] Unauthorized login attempt from: ${decodedToken.email}`);
    return NextResponse.json({ error: "Access denied. Unauthorized administrator." }, { status: 403 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  let sessionCookie;
  try {
    console.log("[3/6] Creating session cookie...");
    sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    // AI's detailed diagnostics
    console.log("[4/6] Session cookie created successfully. Type:", typeof sessionCookie);
    console.log("[4/6b] Cookie preview:", sessionCookie ? sessionCookie.substring(0, 30) : "N/A");
  } catch (error) {
    const err = error as Error;
    console.error("--- V8 CRITICAL: Error creating session cookie ---", err);
    return NextResponse.json({ error: "Session creation failed.", details: err.message }, { status: 500 });
  }

  try {
    console.log("[5/6] Generating response with user data...");
    const userPayload = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      role: 'admin',
    };
    const response = NextResponse.json({ status: "success", user: userPayload }, { status: 200 });

    try {
      console.log("[6/6] Attempting to set session cookie on response...");
      response.cookies.set({
        name: "__session",
        value: sessionCookie,
        maxAge: expiresIn / 1000,
        httpOnly: true,
        // User's security enhancement
        secure: true,
        path: "/",
        sameSite: "lax",
      });
      console.log("--- V8 SUCCESS: Cookie set. Responding with success. ---");
      return response;
    } catch (e) {
      // AI's specific error isolation
      const error = e as Error;
      console.error("--- V8 FATAL: FAILED TO SET COOKIE ON RESPONSE ---", error);
      return NextResponse.json({
        status: "error_setting_cookie",
        error: "Authentication successful, but failed to set session cookie.",
        details: error.message
      }, { status: 500 });
    }
  } catch (e) {
    const error = e as Error;
    console.error("--- V8 CRITICAL: General error during response generation ---", error);
    return NextResponse.json({ error: "Response configuration error.", details: error.message }, { status: 500 });
  }
}

export { handler as POST };
