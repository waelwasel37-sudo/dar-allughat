import Link from 'next/link';
import styles from './Footer.module.css';
// 🎯 1. استيراد الأيقونات والروابط الصحيحة
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import { SITE_LINKS } from '@/app/lib/constants';

const Footer = () => {
  // 🎯 2. استخدام رابط خرائط جوجل من الملف المركزي
  const googleMapsUrl = SITE_LINKS.googleMaps;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>روابط سريعة</h3>
          <ul className={styles.linkList}>
            <li><Link href="/">الرئيسية</Link></li>
            <li><Link href="/about">من نحن</Link></li>
            <li><Link href="/contact">اتصل بنا</Link></li>
            <li><Link href="/blog">المدونة</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>السياسات</h3>
          <ul className={styles.linkList}>
            <li><Link href="/shipping-policy">سياسة الشحن والدفع</Link></li>
            <li><Link href="/return-policy">سياسة الاستبدال والاسترجاع</Link></li>
            <li><Link href="/privacy-policy">سياسة الخصوصية</Link></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>تواصل معنا</h3>
          <ul className={styles.linkList}> 
            <li>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                <FaMapMarkerAlt /> مدينة العبور الحى السادس امام سنترال العبور 2 - مول روضة العبور محل 47 الدور الاول
              </a>
            </li>
            {/* 🎯 3. استخدام رقم الهاتف من الملف المركزي */}
            <li><FaPhoneAlt /> {SITE_LINKS.phone}</li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>تابعنا على</h3>
          <div className={styles.socialLinks}>
            {/* 🎯 4. استخدام روابط التواصل الاجتماعي من الملف المركزي */}
            <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.facebookIcon}><FaFacebook /></a>
            <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={styles.whatsappIcon}><FaWhatsapp /></a>
            <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className={styles.telegramIcon}><FaTelegram /></a>
          </div>
        </div>
      </div>
      <div className={styles.copyright}>
        <p>&copy; {new Date().getFullYear()} مكتبات دار اللغات. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
};

export default Footer;