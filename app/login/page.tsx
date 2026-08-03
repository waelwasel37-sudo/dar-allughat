'use client';

// 🚀 تفعيل الرندر الديناميكي لمنع أخطاء بناء Next.js 15
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';
import { FaGoogle } from 'react-icons/fa';

// 🎯 تصحيح: استيراد signInWithPopup بدلاً من signInWithRedirect المسبب للانهيار
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const LoginPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // توجيه الأدمن فوراً للوحة التحكم عند نجاح الدخول
    if (!loading && user && isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, loading, router]);

  // 🎯 تصحيح ذهبي: تشغيل الـ Popup لإنهاء أخطاء الـ 431 والـ Socket Hang Up نهائياً ومجاناً
  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // إجبار جوجل على إظهار قائمة اختيار الحسابات لضمان الدخول بحسابك الصحيح
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // فتح نافذة منبثقة آمنة ومستقرة تماماً بداخل المتصفح
      await signInWithPopup(auth, provider);
      
    } catch (error) {
      console.error("خطأ أثناء تسجيل الدخول بنظام الـ Popup الخاص بجوجل:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>يتم التحقق من حالة الدخول...</div>;
  }
  
  if (user && !isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>وصول مرفوض</h1>
          <p className={styles.subtitle}>
            أنت مسجل بحساب ({user.email}). هذا الحساب لا يملك صلاحيات الوصول للوحة التحكم.
          </p>
          <p className={styles.subtitle}>
            يرجى تسجيل الدخول بالحساب المصرح له.
          </p>
          <button onClick={handleLogin} className={styles.googleButton} style={{ marginTop: '20px' }}>
            <FaGoogle className={styles.googleIcon} />
            تبديل الحساب والدخول كمشرف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>تسجيل الدخول للوحة التحكم</h1>
        <p className={styles.subtitle}>الوصول مقتصر على مدير الموقع فقط</p>
        <button onClick={handleLogin} className={styles.googleButton}>
          <FaGoogle className={styles.googleIcon} />
          تسجيل الدخول باستخدام Google
        </button>
        <p className={styles.privacyNote}>الدخول آمن ومباشر عبر نافذة Google الرسمية المستقرة.</p>
      </div>
    </div>
  );
};

export default LoginPage;