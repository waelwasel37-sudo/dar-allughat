import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// 1. بنية البيانات للجلسة
export interface SessionData {
  isLoggedIn: boolean;
  username: string;
  email?: string;
  isAdmin?: boolean;
}

// 2. قائمة البريد الإلكتروني للمدراء
const ALLOWED_ADMIN_EMAILS = [
  'waelwasel37@gmail.com'
].map(email => email.toLowerCase());

// 3. 🎯 الأمان: جلب كلمة المرور مباشرة من السر الذي أنشأته في Google Secret Manager
const SECRET_COOKIE_PASSWORD = process.env.SECRET_COOKIE_PASSWORD;

// 4. فحص أمان حاسم: التأكد من أن السر موجود
if (!SECRET_COOKIE_PASSWORD) {
  throw new Error(
    'SECRET_COOKIE_PASSWORD environment variable is not loaded from Secret Manager. Check your backend configuration.'
  );
}

// 5. إعدادات الجلسة الآمنة
export const sessionOptions = {
  password: SECRET_COOKIE_PASSWORD, // استخدام السر الحقيقي من Google Cloud
  cookieName: 'dar-allughat-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

// 6. دالة الحصول على الجلسة مع منطق الصلاحيات الذكي
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (session.isLoggedIn && session.email) {
      session.isAdmin = ALLOWED_ADMIN_EMAILS.includes(session.email.toLowerCase());
    } else {
      session.isAdmin = false;
    }

    return session;
  } catch (error) {
    console.error('Failed to create or get server session:', error);
    return { isLoggedIn: false, username: '', email: '', isAdmin: false } as unknown as SessionData;
  }
}
