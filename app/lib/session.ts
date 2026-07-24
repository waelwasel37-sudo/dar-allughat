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
  // 🔴 حل مؤقت وعاجل: تم وضع كلمة مرور قوية هنا مباشرة
  // لإيقاف انهيار الخادم فورًا. لاحقًا، يجب نقلها إلى متغيرات البيئة.
  password: 'ThisIsAVerySecureSecretForIronSession32CharsLong!@#',
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // تعزيز الأمان ومنع اختراق الجلسة عبر الجافا سكريبت
  },
};

// 3. دالة الحصول على الجلسة، متوافقة مع Next.js 15 وأكثر أمانًا
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    return session;
  } catch (error) {
    console.error('Failed to create or get server session:', error);
    // في حالة حدوث خطأ، يتم إرجاع جلسة افتراضية لمنع انهيار التطبيق
    return { isLoggedIn: false, username: '', isAdmin: false } as unknown as SessionData;
  }
}
