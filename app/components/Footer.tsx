       'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './Footer.module.css';
import { SITE_LINKS } from '@/app/lib/constants'; 

const FaFacebook = dynamic(() => import('react-icons/fa').then((mod) => mod.FaFacebook));
const FaTelegram = dynamic(() => import('react-icons/fa').then((mod) => mod.FaTelegram));
const FaWhatsapp = dynamic(() => import('react-icons/fa').then((mod) => mod.FaWhatsapp));
const FaMapMarkerAlt = dynamic(() => import('react-icons/fa').then((mod) => mod.FaMapMarkerAlt));
const FaEnvelope = dynamic(() => import('react-icons/fa').then((mod) => mod.FaEnvelope));

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>مكتبة دار اللغات والسبلايز</h3>
            <p className={styles.aboutText}>
              وجهتكم الأولى في العبور لشراء الكتب الخارجية، كتب التأسيس، وألعاب تنمية المهارات، بالإضافة إلى كافة الأدوات المكتبية والمستلزمات المدرسية والسبلايز (Stationery & School Supplies).
            </p>
            <div className={styles.legalInfo}>
                <p>الرقم الضريبي: 769-499-732</p>
                <p>السجل التجاري: 100160</p>
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>روابط سريعة</h3>
            <ul className={styles.linkList}>
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/about">من نحن</Link></li>
              <li><Link href="/blog">المدونة</Link></li>
              <li><Link href="/contact">اتصل بنا</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>تواصل معنا - Contact Us</h3>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <a href={SITE_LINKS.googleMaps} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                  مدينة العبور، القليوبية، مصر
                </a>
              </li>
              <li className={styles.contactItem}>
                <FaEnvelope className={styles.contactIcon} />
                <a href="mailto:dallughat@gmail.com" className={styles.contactLink}>dallughat@gmail.com</a>
              </li>
              <li className={styles.contactItem}>
                <FaWhatsapp className={styles.contactIcon} />
                <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                  تواصل عبر واتساب - WhatsApp
                </a>
              </li>
            </ul>

            <div className={styles.socialIcons}>
              <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Page">
                <FaFacebook />
              </a>
              <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram Channel">
                <FaTelegram />
              </a>
            </div>
          </div>

        </div>

        <div className={styles.copyright}>
          <p>&copy; {currentYear} مكتبة دار اللغات والسبلايز - Stationery & School Supplies. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;