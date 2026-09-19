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
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || '',
cookieName: 'dar-allughat-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none', // 🎯 الإضافة الحاسمة لحل المشكلة
  },
};

// 6. دالة الحصول على الجلسة مع منطق الصلاحيات الذكي
export async function getSession() {
  try {
    if (!process.env.SECRET_COOKIE_PASSWORD) { throw new Error("SECRET_COOKIE_PASSWORD is missing"); }
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, { ...sessionOptions, password: process.env.SECRET_COOKIE_PASSWORD });

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
