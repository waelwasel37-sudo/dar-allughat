'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';
import { FaGoogle } from 'react-icons/fa';

// 🎯 جديد: استيراد دوال Firebase المباشرة لتشغيل نظام الـ Redirect
import { getAuth, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';

const LoginPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // توجيه الأدمن فوراً للوحة التحكم عند نجاح الدخول
    if (!loading && user && isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, loading, router]);

  // 🎯 تعديل: تشغيل الـ Redirect بدلاً من الـ Popup الميت لمنع حظر المتصفح
  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // إجبار جوجل على إظهار قائمة اختيار الحسابات لضمان الدخول بحسابك الصحيح
      provider.setCustomParameters({ prompt: 'select_account' });
      
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("خطأ أثناء تحويل تسجيل الدخول بجوجل:", error);
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
          {/* 🎯 إضافة زر لإتاحة إعادة المحاولة بالحساب الصحيح دون تعليق */}
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
        <p className={styles.privacyNote}>الدخول آمن ومباشر عبر إعادة توجيه Google الرسمية.</p>
      </div>
    </div>
  );
};

export default LoginPage;