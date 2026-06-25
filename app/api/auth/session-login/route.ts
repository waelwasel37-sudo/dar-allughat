import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // الاستدعاء الرسمي المضمون في Next 15
import { getAuth } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- V4: /api/auth/session-login execution started ---");
  try {
    console.log("[1/6] Awaiting request body...");
    const { idToken } = await request.json().catch(() => ({}));
    console.log("[2/6] Request body parsed.");

    if (!idToken) {
      console.log("[3/6] No idToken found. Skipping session for guest.");
      return NextResponse.json(
        { status: "skipped", message: "No token for guest user." },
        { status: 200 }
      );
    }
    console.log("[3/6] idToken is present.");

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    console.log("[4/6] Calling getAuth() to get Firebase Auth instance...");
    const auth = getAuth();
    
    console.log("[5/6] Firebase Auth instance received. Calling createSessionCookie...");
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log("[6/6] Session cookie created successfully.");

    // إضافة await هنا لضمان التوافق مع Next.js 15
    const cookieStore = cookies();
    cookieStore.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000, 
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    });

    console.log("--- V4: Session cookie set in headers. Responding with success. ---");
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (e) {
    console.error("--- V4: CRITICAL: Caught an error in session-login ---");
    console.error(e);
    return NextResponse.json(
      { 
        error: "Failed to create session.", 
        details: e instanceof Error ? e.message : "An unknown error occurred during session creation." 
      }, 
      { status: 500 } 
    );
  }
}