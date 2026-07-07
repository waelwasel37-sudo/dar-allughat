import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/firebase-admin"; // تأكد من مطابقة مسار ملف الإدمن لديك
import { getSession } from "@/app/lib/session";

// إجبار المسار على العمل بشكل ديناميكي كامل لمنع أخطاء البناء السحابي بسبب الكوكيز
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken missing" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // التحقق الصارم من بريدك الإلكتروني كأدمن وحيد للمتجر
    if (decodedToken.email !== "waelwasel37@gmail.com") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 🎯 تطبيق التعديلات الذكية المحدثة منك الآن
    session.isLoggedIn = true;
    session.username = decodedToken.email ? decodedToken.email.split('@')[0] : "Admin";
    session.isAdmin = true; // تفعيل القيمة الحاسمة لحماية لوحة التحكم
    
    await session.save();

    return NextResponse.json({ success: true, username: session.username, isAdmin: session.isAdmin });

  } catch (error: any) {
    console.error("Session login API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
