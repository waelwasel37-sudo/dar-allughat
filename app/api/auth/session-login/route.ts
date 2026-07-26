import { NextResponse, NextRequest } from "next/server";
import { getAdminAuth } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken missing" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Strict check for the sole admin email
    if (decodedToken.email !== "waelwasel37@gmail.com") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Cookie expiration time (e.g., 14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; 
    
    // Create the session cookie using Firebase Admin SDK
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set secure cookie options
    const options = {
      name: "__session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    // Create a response and set the cookie in the header
    const response = NextResponse.json({ success: true, isAdmin: true }, { status: 200 });
    response.cookies.set(options);

    return response;

  } catch (error: any) {
    console.error("Session login API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
