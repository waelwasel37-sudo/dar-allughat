import { NextResponse } from "next/server";
import { auth as adminAuth } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- API Endpoint: /api/auth/session-logout ---");

  try {
    const text = await request.text();
    const body = text ? JSON.parse(text) : {};
    const { uid } = body;

    if (!uid) {
      console.error("UID is missing from the request body.");
      return NextResponse.json({ error: "UID is required." }, { status: 400 });
    }

    console.log(`[1/2] Revoking refresh tokens for UID: ${uid}`);
    await adminAuth.revokeRefreshTokens(uid);
    console.log(`[2/2] Successfully revoked refresh tokens for UID: ${uid}`);

    return NextResponse.json({ status: "success", message: "Tokens revoked." }, { status: 200 });

  } catch (error) {
    const err = error as Error;
    console.error("--- CRITICAL ERROR in session-logout ---", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message }, 
      { status: 500 }
    );
  }
}