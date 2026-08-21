'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import Cart from './Cart';
import ShareButton from './ShareButton';
import { SITE_LINKS } from '@/app/lib/constants';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaUserCircle, FaBars } from 'react-icons/fa';
import { SessionData } from '@/app/lib/session';

interface HeaderProps {
  session: SessionData;
}

const Header = ({ session }: HeaderProps) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, loading, isAdmin } = useAuth();
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [newFactoryRequestsCount, setNewFactoryRequestsCount] = useState(0);

  const isLoggedIn = session?.isLoggedIn || (!!user && !loading);
  const displayName = session?.username || (user?.displayName ? user.displayName.split(' ')[0] : 'عضو');

  useEffect(() => {
    if (isAdmin && user) {
      const fetchAllNewRequests = async () => {
        try {
          const token = typeof user.getIdToken === 'function' ? await user.getIdToken() : (user as any).token;
          const headers = { 'Authorization': `Bearer ${token || ''}` };
          const schoolRes = await fetch('/api/school-list?status=new', { headers });
          if (schoolRes.ok) {
            const data = await schoolRes.json();
            setNewRequestsCount(data.count || 0);
          }
          const factoryRes = await fetch('/api/factory-supplies?status=new', { headers });
          if (factoryRes.ok) {
            const data = await factoryRes.json();
            const count = Array.isArray(data) ? data.filter((r: any) => r.status === 'new').length : (data.count || 0);
            setNewFactoryRequestsCount(count);
          }
        } catch (error) {
          console.error('Error fetching requests counts:', error);
        }
      };

      fetchAllNewRequests();
      const intervalId = setInterval(fetchAllNewRequests, 60000); 
      return () => clearInterval(intervalId);
    } else {
      setNewRequestsCount(0);
      setNewFactoryRequestsCount(0);
    }
  }, [isAdmin, user]);

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={styles.headerWrapper}>
      {/* 🎯 نص سيو احترافي مخفي تماماً عن الجمهور ومرئي بالكامل لروبوتات جوجل لتسريع الفهرسة فوراً */}
      <h1 className="sr-only">
        مكتبات دار اللغات بالعبور - المنصة الأولى للكتب والمستلزمات التعليمية. 
        مرحباً بكم في مكتبات دار اللغات في مدينة العبور. نوفر لأبنائكم تشكيلة متكاملة من كتب خارجية, 
        كتب مدرسية, كتب أزهري, كتب تأسيس, وكتب مستوى رفيع لغات لكافة المراحل التعليمية. 
        كما نتميز بتقديم أفضل كتب تنمية مهارات أطفال, قصص أطفال، وألعاب تنمية مهارات أطفال منتسوري 
        المصممة علمياً لتطوير ذكاء طفلك، بجانب كافة مستلزمات الـ أدوات مكتبية ومدرسية وقسم خاص لـ كتب مرتجع بأسعار تنافسية.
        📋 ارفع قائمة مدرستك الآن
        🏢 قسم توريدات مصانع ومؤسسات
      </h1>

      {/* 1. الشريط العلوي للمعلومات الثانوية */}
      <div className={styles.topBar}>
        <div className={styles.topBarContainer}>
          <p className={styles.taxNumber}>الرقم الضريبي: 769499732</p>
          <div className={styles.socialLinks}>
            <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" className={styles.facebookIcon} aria-label="تابع صفحتنا على فيسبوك"><FaFacebook /></a>
            <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.whatsappIcon} aria-label="تواصل معنا عبر واتساب"><FaWhatsapp /></a>
            <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" className={styles.telegramIcon} aria-label="تابع قناتنا على تليجرام"><FaTelegram /></a>
            <a href={SITE_LINKS.googleMaps} target="_blank" rel="noopener noreferrer" className={styles.mapIcon} aria-label="موقع مكتبتنا على خرائط جوجل"><FaMapMarkerAlt /></a>
          </div>
        </div>
      </div>

      {/* 2. الهيدر الرئيسي (الشعار، القائمة، السلة، إلخ) */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <Link href="/" onClick={closeMobileMenu}>
            <Image
              src="/images/logo-horizontal.png" 
              alt="شعار مكتبات دار اللغات"
              width={256}
              height={64}
              priority={true}
              // 🚀 تنحيف الشعار: إجبار الخادم على توليد المقاس الفعلي فقط ومنع هدر 30.2 كيبيبايت
              sizes="(max-width: 768px) 200px, 256px"
              className="object-contain"
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
                {newRequestsCount > 0 && <span className={styles.notificationBadge}>{newRequestsCount}</span>}
              </Link>
              <Link href="/admin/factory-supplies" onClick={closeMobileMenu} className={styles.notificationLink}>
                طلبات الشركات
                {newFactoryRequestsCount > 0 && <span className={styles.notificationBadge} style={{backgroundColor: '#dc2626'}}>{newFactoryRequestsCount}</span>}
              </Link>
            </>
          )}

          <div className={styles.mobileOnlyActions}>
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
          <button className={styles.menuButton} onClick={toggleMobileMenu} aria-label="افتح قائمة التصفح"><FaBars /></button>
        </div>
      </div>
    </header>
  );
};

export default Header;