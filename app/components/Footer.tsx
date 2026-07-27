import Link from 'next/link';
import styles from './Footer.module.css';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import { SITE_LINKS } from '@/app/lib/constants';

const Footer = () => {
  const googleMapsDirectionUrl = "https://www.google.com/maps/place/%D9%85%D9%83%D8%AA%D8%A8%D8%A7%D8%AA+%D8%AF%D8%A7%D8%B1+%D8%A7%D9%84%D9%84%D8%BA%D8%A7%D8%AA+%D9%81%D8%B1%D8%B9+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1%E2%80%AD/@30.2005431,31.469131,17z/data=!3m1!4b1!4m6!3m5!1s0x14581b00678ba35d:0x409f8c8e3314ed66!8m2!3d30.2005385!4d31.4665561!16s%2Fg%2F11yry7h42m?entry=ttu";
  const googleMapsEmbedUrl = "https://maps.google.com/maps?q=30.2005385,31.4665561&hl=ar&z=17&amp;output=embed";

  return (
    <footer className={styles.footer}>
      <div className={styles.mapSection}>
        <h3 className={styles.mapTitle}>زوروا فرعنا في مدينة العبور</h3>
        <div className={styles.mapOuterContainer}>
          <div className={styles.mapInfo}>
            <p className={styles.addressText}>
              <FaMapMarkerAlt /> 
              <span>مدينة العبور، الحي السادس، أمام سنترال العبور 2، مول روضة العبور - محل 47، الدور الأول.</span>
            </p>
            <a href={googleMapsDirectionUrl} target="_blank" rel="noopener noreferrer" className={styles.directionButton}>
              الحصول على الاتجاهات
            </a>
          </div>
          <div className={styles.mapEmbedContainer}>
            <iframe
              src={googleMapsEmbedUrl}
              className={styles.mapEmbed}
              allowFullScreen={true} /* 🎯 تم تطبيق تصحيحك الذكي هنا */
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="موقع مكتبات دار اللغات فرع العبور"
            ></iframe>
          </div>
        </div>
      </div>

      {/* === الأقسام الأصلية للفوتر === */}
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
            <li><FaPhoneAlt /> {SITE_LINKS.phone}</li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>تابعنا على</h3>
          <div className={styles.socialLinks}>
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