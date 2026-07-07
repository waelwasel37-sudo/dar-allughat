import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// 1. تعريف بنية البيانات المخزنة داخل الجلسة
export interface SessionData {
  isLoggedIn: boolean;
  username: string;
  isAdmin?: boolean; // <-- تمت الإضافة للسماح بتخزين صلاحية المدير
}

// 2. إعدادات الجلسة والكوكيز مع كلمة السر البديلة الصارمة (يجب ألا تقل عن 32 حرفاً)
export const sessionOptions = {
  password: (process.env.SECRET_COOKIE_PASSWORD || "v1_secure_session_cookie_encryption_password_32_chars") as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // تعزيز الأمان ومنع اختراق الجلسة عبر الجافا سكريبت
  },
};

// 3. الدالة المصححة والمتوافقة 100% مع Next.js 15 والـ Build السحابي
export async function getSession() {
  // فك الـ Promise الخاص بالكوكيز إجبارياً في بيئة Next.js 15
  const cookieStore = await cookies();
  
  // تمرير الـ cookieStore المفكك والجاهز للمكتبة
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}
