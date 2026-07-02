// 1. تعريف بنية البيانات المخزنة داخل الجلسة (اسم المستخدم وحالة تسجيل الدخول)
export interface SessionData {
  isLoggedIn: boolean;
  username: string;
}

// 2. إعدادات الجلسة والكوكيز مع القيمة البديلة لحماية عملية بناء الصفحات الثابتة (Static Pages)
export const sessionOptions = {
  // يقرأ المفتاح الحقيقي من Google Cloud في البيئة الحية، وإذا لم يجده أثناء الـ Build يستخدم النص البديل الآمن
  password: (process.env.SECRET_COOKIE_PASSWORD || "a_dummy_secure_password_at_least_32_characters_long") as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    // تفعيل خاصية التشفير والأمان التام فقط في بيئة الإنتاج الحية (Firebase)
    secure: process.env.NODE_ENV === 'production',
  },
};

// 3. دالة جلب الجلسة المحدثة والمحمية المتوافقة تماماً مع Next.js 15
export async function getSession() {
  const cookieStore = await cookies(); 
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}
