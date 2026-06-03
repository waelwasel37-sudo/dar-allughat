import { NextResponse } from "next/server";
import admin from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // Set session expiration.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // Create the session cookie.
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for the response.
    const response = NextResponse.json({ status: "success" });
    
    // 💡 Crucial Change: Rename the cookie to "__session" to integrate with Firebase Hosting's caching policy.
    // This tells Firebase Hosting not to cache pages for logged-in users.
    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true, // Always true in production for HTTPS
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (e) {
    // Log the actual error to the server console for debugging.
    console.error("Session Login Error:", e);
    
    // Return a more informative error response.
    return NextResponse.json(
      { 
        error: "Failed to create session.", 
        details: e instanceof Error ? e.message : "An unknown error occurred." 
      }, 
      { status: 500 } // Use 500 since it's a server-side failure.
    );
  }
}
