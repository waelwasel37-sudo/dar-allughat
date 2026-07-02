import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// 1. تعريف بنية البيانات المخزنة داخل الجلسة
export interface SessionData {
  isLoggedIn: boolean;
  username: string;
}

// 2. إعدادات الجلسة والكوكيز مع كلمة السر البديلة الصارمة
export const sessionOptions = {
  password: (process.env.SECRET_COOKIE_PASSWORD || "v1_secure_session_cookie_encryption_password_32_chars") as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// 3. 🎯 الدالة المصححة هندسياً والمتوافقة 100% مع Next.js 15 والـ Build السحابي
export async function getSession() {
  // الاستدعاء المباشر المتزامن والآمن للمكتبة لضمان ربط الكوكيز بمتصفح الأدمن دون فواق برمي
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}