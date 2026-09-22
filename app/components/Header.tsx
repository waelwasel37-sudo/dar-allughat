'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import { SITE_LINKS } from '@/app/lib/constants';
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
    // Your existing useEffect logic remains the same
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

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={styles.headerWrapper}>
      <h1 className="sr-only">
        مكتبة دار اللغات بالعبور - المنصة الأولى للكتب وألعاب تنمية المهارات والمنتسوري والمستلزمات المدرسية والسبلايز (Stationery & School Supplies).
      </h1>

      {/* 🎯 Top Bar converted to Tailwind CSS */}
      <div className="bg-slate-100 border-b border-slate-200 py-2 px-4 w-full">
         <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex gap-5 flex-wrap">
            <p className="m-0 font-extrabold text-black text-xs sm:text-sm">
              الرقم الضريبي: <span dir="ltr">769499732</span>
            </p>
            <p className="m-0 font-extrabold text-black text-xs sm:text-sm">
              السجل التجاري: 100160
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }} className="text-lg hover:opacity-80 transition-opacity" aria-label="تابع صفحتنا على فيسبوك"><FaFacebook /></a>
            <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }} className="text-lg hover:opacity-80 transition-opacity" aria-label="تواصل معنا عبر واتساب"><FaWhatsapp /></a>
            <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#2AABEE' }} className="text-lg hover:opacity-80 transition-opacity" aria-label="تابع قناتنا على تليجرام"><FaTelegram /></a>
            <a href={SITE_LINKS.googleMaps} target="_blank" rel="noopener noreferrer" style={{ color: '#EA4335' }} className="text-lg hover:opacity-80 transition-opacity" aria-label="موقع مكتبتنا على خرائط جوجل"><FaMapMarkerAlt /></a>
          </div>

        </div>
      </div>
      
      {/* Main Header */}
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

        {/* ✅ Mobile Menu Fix: Added z-index classes */}
        {isMobileMenuOpen && (
          <div className={`${styles.mobileMenuOverlay} z-40`} onClick={closeMobileMenu} />
        )}
        
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileMenu : ''} z-50`}>
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
