'use client';

import Link from 'next/link';
import Image from 'next/image'; // استيراد مكون Image
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import Cart from './Cart';
import ShareButton from './ShareButton';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';

// لا حاجة لاستيراد الشعار من هنا بعد الآن
// import logo from '../../../public/images/logo-horizontal.png';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, loading, isAdmin } = useAuth();
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  useEffect(() => {
    if (!loading && isAdmin) {
      const fetchNewRequestsCount = async () => {
        try {
          const response = await fetch('/api/school-list?status=new');
          if (response.ok) {
            const data = await response.json();
            setNewRequestsCount(data.count || 0);
          } else {
            setNewRequestsCount(0);
          }
        } catch (error) {
          console.error('Error fetching new requests count:', error);
        }
      };

      fetchNewRequestsCount();
      const intervalId = setInterval(fetchNewRequestsCount, 60000); 
      return () => clearInterval(intervalId);
    } else {
      setNewRequestsCount(0);
    }
  }, [isAdmin, loading]);

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" onClick={closeMobileMenu}>
          {/* استخدام المسار العام مباشرة من مجلد public */}
          <Image 
            src="/images/logo-horizontal.png" 
            alt="شعار مكتبات دار اللغات" 
            width={200} // تحديد عرض مناسب
            height={50} // تحديد ارتفاع مناسب
            priority // لإعطاء الأولوية في التحميل
          />
        </Link>
      </div>
      <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileMenu : ''}`}>
        {/* ... باقي روابط القائمة ... */}
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
                <a href="https://www.facebook.com/maktabat.dar.allughat/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}><FaFacebook /></a>
                <a href="https://chat.whatsapp.com/LoAtW84xgZr51vQAbSEw0E" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}><FaWhatsapp /></a>
                <a href="https://t.me/+10C-njs5Xoo0ZDRk" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }}><FaTelegram /></a>
                <a href="https://www.google.com/maps/dir//%D8%A7%D9%85%D8%A7%D9%85+%D8%B3%D9%86%D8%AA%D8%B1%D8%A7%D9%84+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1+2%D8%8C+%D9%85%D9%88%D9%84+%D8%B1%D9%88%D8%B6%D8%A9+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1%D8%8C+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1%D8%8C+%D9%85%D8%AD%D8%A7%D9%81%D8%B8%D8%A9+%D8%A7%D9%84%D9%82%D9%84%D9%8A%D9%88%D8%A8%D9%8A%D8%A9+6361122%E2%80%AE/@30.215903,31.4800317,7901m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x14581b00678ba35d:0x409f8c8e3314ed66!2m2!1d31.4665634!2d30.2006245?entry=ttu" target="_blank" rel="noopener noreferrer" style={{ color: '#DB4437' }}><FaMapMarkerAlt /></a>
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
          &#9776; {/* Hamburger Icon */}
        </button>
      </div>
    </header>
  );
};

export default Header;
