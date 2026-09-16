import Link from 'next/link';
import styles from './Footer.module.css';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          
          {/* 1. قسم من نحن والكلمات المفتاحية (من النسخة الجديدة) */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>مكتبة دار اللغات بالعبور</h3>
            <p className={styles.aboutText}>
              وجهتكم الأولى والشاملة لشراء الكتب الخارجية، كتب التأسيس، قصص الأطفال، وألعاب تنمية مهارات أطفال منتسوري، بالإضافة إلى كافة الأدوات المكتبية والمستلزمات المدرسية وتوريدات المؤسسات.
            </p>
          </div>

          {/* 2. قسم الروابط السريعة المصحح لـ SEO (مدمج) */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>روابط سريعة</h3>
            <ul className={styles.linkList}>
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/about">من نحن</Link></li>
              {/* 🎯 التصحيح الذهبي لـ SEO: وضع المائل / قبل الـ Hash لتعمل الروابط من داخل أي صفحة فرعية بالمتجر */}
              <li><Link href="/#categories">أقسام المكتبة</Link></li>
              <li><Link href="/#special-offers">العروض الخاصة</Link></li>
            </ul>
          </div>

          {/* 3. قسم تواصل معنا الجغرافي والرقمي (من النسخة القديمة والجديدة) */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>تواصل معنا</h3>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <span>مدينة العبور، القليوبية، مصر</span>
              </li>
              <li className={styles.contactItem}>
                <FaEnvelope className={styles.contactIcon} />
                <a href="mailto:dallughat@gmail.com" className={styles.contactLink}>dallughat@gmail.com</a>
              </li>
              <li className={styles.contactItem}>
                <FaWhatsapp className={styles.contactIcon} />
                {/* 💡 يرجى وضع رقم الواتساب الحقيقي هنا بدلاً من الرقم الافتراضي */}
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>تواصل عبر واتساب</a>
              </li>
            </ul>

            {/* 4. قنوات ومواقع التواصل الاجتماعي الرسمية للمكتبة */}
            <div className={styles.socialIcons}>
              {/* 💡 يرجى استبدال علامة # برابط صفحة الفيسبوك الحقيقي */}
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook Page">
                <FaFacebook />
              </a>
              {/* 💡 يرجى استبدال علامة # برابط قناة التليجرام الحقيقي */}
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Telegram Channel">
                <FaTelegram />
              </a>
            </div>
          </div>

        </div>

        {/* حقوق الملكية الثابتة */}
        <div className={styles.copyright}>
          <p>&copy; {currentYear} مكتبة دار اللغات. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;