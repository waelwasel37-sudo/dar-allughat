'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';
import { FaGoogle } from 'react-icons/fa';

const LoginPage = () => {
  const { loginWithGoogle, user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user is already logged in and is an admin, redirect to the admin panel
    if (!loading && user && isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, loading, router]);

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  // Display a loading message while checking auth status
  if (loading) {
    return <div className={styles.loading}>يتم التحقق من حالة الدخول...</div>;
  }
  
  // If the user is logged in but not an admin, show a message
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
        <p className={styles.privacyNote}>الدخول آمن ومباشر عبر نافذة Google.</p>
      </div>
    </div>
  );
};

export default LoginPage;
