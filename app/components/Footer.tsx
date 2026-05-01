import Link from 'next/link';
import styles from './Footer.module.css';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';

const Footer = () => {
  // Generated a more precise Google Maps URL
  const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%AF%D9%8A%D9%86%D8%A9+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1+%D8%A7%D9%84%D8%AD%D9%89+%D8%A7%D9%84%D8%B3%D8%A7%D8%AF%D8%B3+%D8%A7%D9%85%D8%A7%D9%85+%D8%B3%D9%86%D8%AA%D8%B1%D8%A7%D9%84+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1+2+-+%D9%85%D9%88%D9%84+%D8%B1%D9%88%D8%B6%D8%A9+%D8%A7%D9%84%D8%B9%D8%A8%D9%88%D8%B1+%D9%85%D8%AD%D9%84+47+%D8%A7%D9%84%D8%AF%D9%88%D8%B1+%D8%A7%D9%84%D8%A7%D9%88%D9%84";

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
            <li><FaPhoneAlt /> 01220396597</li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>تابعنا على</h3>
          <div className={styles.socialLinks}>
            <a href="https://www.facebook.com/maktabat.dar.allughat/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.facebookIcon}><FaFacebook /></a>
            <a href="https://chat.whatsapp.com/LoAtW84xgZr51vQAbSEw0E" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={styles.whatsappIcon}><FaWhatsapp /></a>
            <a href="https://t.me/+10C-njs5Xoo0ZDRk" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className={styles.telegramIcon}><FaTelegram /></a>
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
