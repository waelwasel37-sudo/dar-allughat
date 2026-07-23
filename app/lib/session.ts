import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// 1. تعريف بنية البيانات المخزنة داخل الجلسة
export interface SessionData {
  isLoggedIn: boolean;
  username: string;
  isAdmin?: boolean;
}

// 2. إعدادات الجلسة مع الاعتماد الكامل والآمن على متغير البيئة السري
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // تعزيز الأمان ومنع اختراق الجلسة عبر الجافا سكريبت
  },
};

// 3. دالة الحصول على الجلسة، متوافقة مع Next.js 15
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}
