'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic'; // البتر البرمجي لتخفيف الأداء وسحق الـ TBT
import styles from './Footer.module.css';
import { SITE_LINKS } from '@/app/lib/constants'; 

// تحميل الأيقونات ديناميكياً لتسريع الصفحة الافتتاحية الأولى أمام عناكب جوجل
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
        
        {/* شبكة الأعمدة الرئيسية والنظيفة تماماً وبدون أي تكرار أو نسخ قديمة */}
        <div className={styles.grid}>
          
          {/* العمود الأول: اسم المشروع والتعريف المالي والتسويقي المعقم */}
          <div className={styles.column}>
            {/* ✅ تثبيت الاسم الرسمي النظيف والموحد بدون أي زيادات */}
            <h3 className={styles.columnTitle}>مكتبة دار اللغات</h3>
            
            {/* ✅ تم حقن ألعاب تنمية المهارات والمنتسوري باللغتين بذكاء خارق للـ SEO لجلب ماميز العبور */} 
            <p className={styles.aboutText} style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', margin: '0' }}> 
              تفخر مكتبة دار اللغات بمدينة العبور بتقديم حلول تعليمية متكاملة تشمل كتب تأسيس الأطفال، كتب مستوى رفيع لغات، ألعاب تنمية مهارات أطفال منتسوري - Montessori & Skills Development Toys، وكافة مستلزمات السبلايز (School Supplies)، بالإضافة إلى قسم خاص لـ كتب مرتجع بأسعار اقتصادية تناسب الجميع. 
            </p>
            
            {/* ✅ دمج خدمة القوائم المدرسية والسبلايز هنا بنظافة وبدون تكرار عناوين */}
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--color-border-light, #e9ecef)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary, #007bff)', marginBottom: '5px' }}>
                📋 ارفع قائمة مدرستك والسبلايز
              </h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0' }}>
                وفّر وقتك وجهدك؛ ارفع لنا قائمة أدوات وكتب طفلك المدرسية والسبلايز (School Supplies) وسنقوم بتجهيزها لك بالكامل فوراً!
              </p>
            </div>

            {/* ✅ دمج خدمة توريدات الشركات والمؤسسات بنظافة وعزل تسييبي */}
            <div style={{ marginTop: '15px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary, #007bff)', marginBottom: '5px' }}>
                🏢 توريدات الشركات والمؤسسات
              </h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0' }}>
                نلبي كافة احتياجات الشركات، المصانع، والمؤسسات من الأدوات المكتبية والتجهيزات بأفضل الأسعار المتاحة.
              </p>
            </div>

            {/* ✅ البيانات القانونية الموثقة بالرقم الضريبي الصحيح الصافي 100% */}
            <div className={styles.legalInfo} style={{ marginTop: '20px' }}>
                {/* 🎯 حماية الأرقام: استخدام dir="ltr" الموحد لمنع المتصفح من عكس ترتيب الرقم الضريبي كلياً */}
                <p dir="ltr" style={{ textAlign: 'right', margin: '5px 0', fontWeight: 'bold' }}>
                  الرقم الضريبي: 769499732
                </p>
                <p style={{ margin: '5px 0' }}>السجل التجاري: 100160</p>
            </div>
          </div>

          {/* العمود الثاني: الروابط السريعة المبتورة للخفة */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>روابط سريعة</h3>
            <ul className={styles.linkList}>
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/about">من نحن</Link></li>
              <li><Link href="/blog">المدونة</Link></li>
              <li><Link href="/contact">اتصل بنا</Link></li>
            </ul>
          </div>

          {/* العمود الثالث: قنوات التواصل والربط الجغرافي بالعبور */}
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

        {/* ✅ السطر الأخير المعقم تماماً: مسح الكلمات الإنجليزية بناءً على طلبك الصارم وثبات اسم مكتبة دار اللغات فقط */}
        <div className={styles.copyright}>
          <p>&copy; {currentYear} مكتبة دار اللغات. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;