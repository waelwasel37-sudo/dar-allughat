import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

// تعريف بيانات الجلسة
export interface SessionData {
  isLoggedIn: boolean;
  username: string;
}

// الإعدادات القياسية دون كلمات سر مكشوفة
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// دالة جلب الجلسة المتوافقة مع Next.js 15
export async function getSession() {
  const cookieStore = await cookies(); 
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}