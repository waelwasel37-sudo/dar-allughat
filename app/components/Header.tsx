'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import Cart from './Cart';
import ShareButton from './ShareButton';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, loading, isAdmin } = useAuth();
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  useEffect(() => {
    // 💡 التأكد من أن المستخدم أدمن وجاهز، وموجود فعلياً لإرسال بياناته
    if (isAdmin && user) {
      const fetchNewRequestsCount = async () => {
        try {
          // 🎯 جلب التوكن لإثبات هوية الأدمن للسيرفر ومنع خطأ 401 Unauthorized
          const token = typeof user.getIdToken === 'function' ? await user.getIdToken() : user.token;
          
          const response = await fetch('/api/school-list?status=new', {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setNewRequestsCount(data.count || 0);
          } else {
            console.error('Failed to fetch new requests count:', response.status);
          }
        } catch (error) {
          console.error('Error fetching new requests count:', error);
        }
      };

      fetchNewRequestsCount(); // الجلب عند التحميل الأولي
      const intervalId = setInterval(fetchNewRequestsCount, 60000); // تحديث كل دقيقة

      // تنظيف الـ interval عند إزالة المكون
      return () => clearInterval(intervalId);
    } else {
      // إذا لم يكن المستخدم أدمن، تأكد من أن العدد هو صفر
      setNewRequestsCount(0);
    }
  }, [isAdmin, user]); // ✅ تم استخدام user لضمان قراءة التوكن فور جاهزيته ومنع التكرار العشوائي

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" onClick={closeMobileMenu}>
          <Image 
            src="/images/logo-horizontal.png" 
            alt="شعار مكتبات دار اللغات" 
            width={200}
            height={50}
            priority
          />
        </Link>
      </div>
      <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileMenu : ''}`}>
        <Link href="/" onClick={closeMobileMenu}>الرئيسية</Link>
        <Link href="/about" onClick={closeMobileMenu}>من نحن</Link>
        <Link href="/contact" onClick={closeMobileMenu}>اتصل بنا</Link>
        
        {isAdmin && (
          <>
            <Link href="/admin" onClick={closeMobileMenu}>لوحة التحكم</Link>
            <Link href="/admin/school-lists" onClick={closeMobileMenu} className={styles.notificationLink}>
              طلبات القوائم
              {newRequestsCount > 0 && (
                <span className={styles.notificationBadge}>{newRequestsCount}</span>
              )}
            </Link>
          </>
        )}

        <div className={styles.topActions}>
            <div className={styles.socialLinks}>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}><FaFacebook /></a>
                <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}><FaWhatsapp /></a>
                <a href="https://t.me" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }}><FaTelegram /></a>
                <a href="https://google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#DB4437' }}><FaMapMarkerAlt /></a>
            </div>
            <ShareButton />
        </div>
      </nav>
      <div className={styles.actionsContainer}>
        <Cart />
        {!loading && user ? (
          <div className={styles.userSection}>
            <span className={styles.welcomeMessage}>أهلاً، {user.displayName?.split(' ')[0] || 'زائر'}</span>
            <button onClick={() => { logout(); closeMobileMenu(); }} className={styles.logoutButton}>خروج</button>
          </div>
        ) : !loading && (
          <Link href="/login" onClick={closeMobileMenu} className={styles.loginButton}>
            <FaUserCircle /> دخول
          </Link>
        )}
        <button className={styles.menuButton} onClick={toggleMobileMenu}>
          ☰
        </button>
      </div>
    </header>
  );
};