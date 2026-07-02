import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers'; // 🎯 هذا السطر كان ناقصاً وتسبب في خطأ الـ tsc

export interface SessionData {
  isLoggedIn: boolean;
  username: string;
}

export const sessionOptions = {
  password: (process.env.SECRET_COOKIE_PASSWORD || "v1_secure_session_cookie_encryption_password_32_chars") as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession() {
  const cookieStore = await cookies(); 
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}
