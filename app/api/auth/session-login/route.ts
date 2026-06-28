import { NextResponse } from "next/server";
import { auth as adminAuth } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V8 (Hybrid) DEBUG: /api/auth/session-login execution started ---");

  try {
    const body = await request.json();
    const idToken = body.idToken || body.token;
    
    if (!idToken) {
      return NextResponse.json({ error: "Token payload is missing" }, { status: 400 });
    }

    console.log("[1/2] Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[2/2] ID token verified successfully. UID:", decodedToken.uid);

    if (decodedToken.email !== "waelwasel37@gmail.com") {
      console.warn(`[⚠️ SECURITY WARNING] Unauthorized login attempt from: ${decodedToken.email}`);
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    console.log("--- V8 SUCCESS: Responding with light success to bypass CDN limit ---");
    return NextResponse.json({ status: "success", user: { uid: decodedToken.uid, email: decodedToken.email } }, { status: 200 });

  } catch (error) {
    const err = error as Error;
    console.error("--- V8 CRITICAL ERROR ---", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
