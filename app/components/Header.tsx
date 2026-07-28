'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import Cart from './Cart';
import ShareButton from './ShareButton';
import { SITE_LINKS } from '@/app/lib/constants'; 
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';
import { SessionData } from '@/app/lib/session';

interface HeaderProps {
  session: SessionData;
}

const Header = ({ session }: HeaderProps) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, loading, isAdmin } = useAuth();
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [newFactoryRequestsCount, setNewFactoryRequestsCount] = useState(0); // 📊 متغير جديد لإشعارات المصانع

  const isLoggedIn = session?.isLoggedIn || (!!user && !loading);
  const displayName = session?.username || (user?.displayName ? user.displayName.split(' ')[0] : 'عضو');

  useEffect(() => {
    if (isAdmin && user) {
      const fetchAllNewRequests = async () => {
        try {
          const token = typeof user.getIdToken === 'function' ? await user.getIdToken() : (user as any).token;
          const headers = { 'Authorization': `Bearer ${token || ''}` };

          // 1. فحص إشعارات القوائم المدرسية
          const schoolRes = await fetch('/api/school-list?status=new', { headers });
          if (schoolRes.ok) {
            const data = await schoolRes.json();
            setNewRequestsCount(data.count || 0);
          }

          // 2. 🎯 فحص إشعارات طلبات توريد المصانع (المشكلة رقم 4)
          const factoryRes = await fetch('/api/factory-supplies?status=new', { headers });
          if (factoryRes.ok) {
            const data = await factoryRes.json();
            // افترضنا أن الـ API يعيد مصفوفة طلبات، فنحسب طولها لو كانت جديدة
            const count = Array.isArray(data) ? data.filter((r: any) => r.status === 'new').length : (data.count || 0);
            setNewFactoryRequestsCount(count);
          }

        } catch (error) {
          console.error('Error fetching requests counts:', error);
        }
      };

      fetchAllNewRequests();
      const intervalId = setInterval(fetchAllNewRequests, 60000); // تحديث دوري كل دقيقة
      return () => clearInterval(intervalId);
    } else {
      setNewRequestsCount(0);
      setNewFactoryRequestsCount(0);
    } 
  }, [isAdmin, user]);

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" onClick={closeMobileMenu}>
          <Image 
            src="/logo.png" 
            alt="شعار مكتبات دار اللغات" 
            width={256}
            height={64}
            priority={true} 
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
            
            {/* إشعارات قوائم المدارس */}
            <Link href="/admin/school-lists" onClick={closeMobileMenu} className={styles.notificationLink}>
              طلبات القوائم
              {newRequestsCount > 0 && (
                <span className={styles.notificationBadge}>{newRequestsCount}</span>
              )}
            </Link>

            {/* 🎯 إشعارات توريد المصانع والشركات الجديدة */}
            <Link href="/admin/factory-supplies" onClick={closeMobileMenu} className={styles.notificationLink}>
              طلبات الشركات
              {newFactoryRequestsCount > 0 && (
                <span className={`${styles.notificationBadge} bg-red-600`} style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '9999px', padding: '2px 6px', fontSize: '10px', marginRight: '4px' }}>
                  {newFactoryRequestsCount}
                </span>
              )}
            </Link>
          </>
        )}

        <div className={styles.topActions}>
            <div className={styles.socialLinks}>
                <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}><FaFacebook /></a>
                <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}><FaWhatsapp /></a>
                <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }}><FaTelegram /></a>
                <a href={SITE_LINKS.googleMaps} target="_blank" rel="noopener noreferrer" style={{ color: '#DB4437' }}><FaMapMarkerAlt /></a>
            </div>
            <ShareButton />
        </div>
      </nav>
      <div className={styles.actionsContainer}>
        <Cart />
        {isLoggedIn ? (
          <div className={styles.userSection}>
            <span className={styles.welcomeMessage}>أهلاً، {displayName}</span>
            <button onClick={() => { logout(); closeMobileMenu(); }} className={styles.logoutButton}>خروج</button>
          </div>
        ) : (
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

export default Header;