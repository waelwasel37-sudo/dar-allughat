'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import { SITE_LINKS } from '@/app/lib/constants';
// 🎯 استدعاء مباشر وصريح للأيقونات العلوية لمنع اختفائها كلياً وتصفير التعبئة
import { FaBars, FaUserCircle, FaTimes, FaFacebook, FaWhatsapp, FaTelegram, FaMapMarkerAlt } from 'react-icons/fa'; 
import { SessionData } from '@/app/lib/session';

const Cart = dynamic(() => import('./Cart'), { ssr: false });
const ShareButton = dynamic(() => import('./ShareButton'), { ssr: false });

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
      {/* سطر الـ SEO المخفي لعناكب جوجل */}
      <h1 
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}
      >
        مكتبة دار اللغات بالعبور - المنصة الأولى للكتب وألعاب تنمية المهارات والمنتسوري والمستلزمات المدرسية والسبلايز (Stationery & School Supplies).
      </h1>

      {/* 🎯 شريط الرأس العلوي المطور والمأمن 100% بالـ Inline Styles الخرسانية ضد البهتان */}
      <div style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 1rem', width: '100%' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'between', gap: '0.75rem' }} className="justify-between">
          
          {/* الأرقام القانونية محصنة بلون أسود فاحم صريح وجريء جداً لمنع البهتان قسرياً */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <p style={{ margin: '0', fontWeight: '800', color: '#000000', fontSize: '13px' }}>
              الرقم الضريبي: <span dir="ltr">769499732</span>
            </p>
            <p style={{ margin: '0', fontWeight: '800', color: '#000000', fontSize: '13px' }}>
              السجل التجاري: 100160
            </p>
          </div>

          {/* أيقونات التواصل الاجتماعي العلوية محقونة ومفجرة بالألوان الرسمية الحادة لمنع الاختفاء نهائياً */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontSize: '18px', display: 'flex', alignItems: 'center' }} aria-label="تابع صفحتنا على فيسبوك"><FaFacebook /></a>
            <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', fontSize: '18px', display: 'flex', alignItems: 'center' }} aria-label="تواصل معنا عبر واتساب"><FaWhatsapp /></a>
            <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#2AABEE', fontSize: '18px', display: 'flex', alignItems: 'center' }} aria-label="تابع قناتنا على تليجرام"><FaTelegram /></a>
            <a href={SITE_LINKS.googleMaps} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center' }} aria-label="موقع مكتبتنا على خرائط جوجل"><FaMapMarkerAlt /></a>
          </div>

        </div>
      </div>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Link href="/" onClick={closeMobileMenu}>
            <Image
              src="/images/logo-horizontal.png1.png" 
              alt="شعار متجر مكتبة دار اللغات والسبلايز - Stationery & School Supplies"
              width={256}
              height={64}
              priority={true}
              sizes="(max-width: 768px) 200px, 256px"
              className="object-contain"
            />
          </Link>
        </div>

        {/* ================================================================= */}
        {/* 🎯 طبقة العزل الملوكية وقائمة التصفح المستجيبة للموبايل           */}
        {/* ================================================================= */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuOverlay} onClick={closeMobileMenu} />
        )}
        
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileMenu : ''}`}>
          {/* زر إغلاق القائمة من الداخل للموبايل */}
          <button onClick={closeMobileMenu} className={styles.closeMenuButton}>
            <FaTimes /> إغلاق
          </button>

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
        {/* ================================================================= */}
        {/* 🎯 نهاية التعديل الشامل                                           */}
        {/* ================================================================= */}
        
        {/* حاوية أزرار الكاشير وسلة الشراء والتحقق من جلسة الموظفين الحية */}
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