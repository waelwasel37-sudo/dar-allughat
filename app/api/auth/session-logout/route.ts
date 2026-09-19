import { NextResponse } from "next/server";
// 🎯 استيراد getAdminAuth بدلاً من الاستيراد المباشر
import { getAdminAuth } from "../../../lib/firebase-admin";
// 🎯 استيراد دالة جلب الجلسة الآمنة لتدمير الكوكيز المشفرة
import { getSession } from "@/app/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("--- API Endpoint: /api/auth/session-logout ---");

  try {
    // 🎯 استدعاء getAdminAuth للحصول على كائن المصادقة
    const adminAuth = await getAdminAuth();
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

    // 🎯 جديد: جلب الجلسة الحالية وتدميرها لمسح الكوكيز المشفرة من متصفحك تماماً
    const session = await getSession();
    session.destroy();
    console.log("[3/3] Iron-session cookie destroyed successfully from client browser.");

    return NextResponse.json({ status: "success", message: "Tokens revoked and session cleared." }, { status: 200 });

  } catch (error) {
    const err = error as Error;
    console.error("--- CRITICAL ERROR in session-logout ---", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message }, 
      { status: 500 }
    );
  }
}