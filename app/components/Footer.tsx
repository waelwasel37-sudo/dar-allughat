'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic'; // السلاح السري للبتر والـ Code Splitting
import styles from './Footer.module.css';
import { SITE_LINKS } from '@/app/lib/constants'; 

// 🚀 البتر البرمجي: تحميل الأيقونات ديناميكياً لتأمين سرعة أول شاشة (TBT < 200ms)
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
        
        {/* 1. قسم الخدمات العلوية للـ Footer */}
        <div className={styles.servicesSection} style={{ marginBottom: '40px', borderBottom: '1px solid var(--color-border-light, #e9ecef)', paddingBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '25px', color: 'var(--color-text-primary, #343a40)' }}>خدمات مكتبة دار اللغات</h2>
          <div className={styles.grid}>
            
            {/* خدمة القوائم المدرسية محقونة بالسبلايز */}
            <div className={styles.serviceBox}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary, #007bff)', marginBottom: '10px' }}>📋 ارفع قائمة مدرستك والسبلايز</h4>
              <p style={{ fontSize: '15px', lineHeight: '1.6' }}>وفّر وقتك وجهدك؛ ارفع لنا قائمة أدوات وكتب طفلك المدرسية والسبلايز (School Supplies) وسنقوم بتجهيزها لك بالكامل فوراً!</p>
            </div>

            {/* توريدات الشركات */}
            <div className={styles.serviceBox}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary, #007bff)', marginBottom: '10px' }}>🏢 توريدات الشركات والمؤسسات</h4>
              <p style={{ fontSize: '15px', lineHeight: '1.6' }}>نلبي كافة احتياجات الشركات، المصانع، والمؤسسات من الأدوات المكتبية والتجهيزات بأفضل الأسعار المتاحة.</p>
            </div>

          </div>
        </div>

        {/* 2. شبكة الأقمدة الرئيسية والمعلومات القانونية */}
        <div className={styles.grid}>
          
          <div className={styles.column}>
            {/* 👑 اسم المشروع الصافي والنظيف بدون تكرار */}
            <h3 className={styles.columnTitle}>مكتبة دار اللغات</h3>
            {/* حقن السبلايز باللغتين وتفجير الفهرسة */}
            <p className={styles.aboutText}>
              تفخر مكتبة دار اللغات بمدينة العبور بتقديم حلول تعليمية متكاملة تشمل كتب تأسيس الأطفال، كتب مستوى رفيع لغات، وكافة مستلزمات السبلايز (School Supplies)، بالإضافة إلى قسم خاص لـ كتب مرتجع بأسعار اقتصادية تناسب الجميع.
            </p>
            <div className={styles.legalInfo}>
                {/* 🎯 تعديل اتجاه الأرقام بالمليم ليظهر الترتيب الضريبي من الشمال لليمين بشكل سليم */}
                <p dir="ltr" style={{ textAlign: 'right' }}>الرقم الضريبي: 769-499-732</p>
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

        {/* 3. حقوق الملكية وشارة الـ Supplies */}
        <div className={styles.copyright}>
          <p>&copy; {currentYear} مكتبة دار اللغات والسبلايز - Stationery & School Supplies. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;