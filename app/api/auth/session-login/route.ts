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

    // 🎯 قائمة الإيميلات الشرعية والمعتمدة لدخول لوحة التحكم (الحصن الثلاثي الموحد)
    const allowedEmails = [
      "waelwasel37@gmail.com", // المالك والأدمن الأعلى (Owner)
      "dallughat@gmail.com",   // الموظف والمحرر الأول (Editor)
      "bondka111@gmail.com"    // الموظف والمحرر الثاني (Editor)
    ];

    // 🛡️ الفحص الهندسي المحدث: إذا لم يكن الإيميل ضمن القائمة المعتمدة، يتم طرده فوراً وحظره
    if (!decodedToken.email || !allowedEmails.includes(decodedToken.email)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // ✅ *** هذا هو التصحيح ***
    // تحديد صلاحية الأدمن بناءً على وجود الإيميل في القائمة المعتمدة
    const isAdmin = allowedEmails.includes(decodedToken.email || '');

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // 🔑 إرجاع استجابة النجاح المخصصة وتمرير علم الـ isAdmin للمتصفح بحسم
    const response = NextResponse.json({ success: true, isAdmin, isEditor: true }, { status: 200 });
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
