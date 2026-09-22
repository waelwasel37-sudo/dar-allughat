'use client';

import Link from 'next/link';
import { FaFacebook, FaTelegram, FaWhatsapp, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa'; // 🎯 استدعاء نقي ومباشر للأيقونات العلوية وسحق الـ dynamic crash
import { SITE_LINKS } from '@/app/lib/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    // 🎯 تم نسف الـ Inline Styles واستبدالها بكلاسات Tailwind النظيفة المتناسقة بلون الكحلي والرمادي
    <footer className="w-full bg-slate-50 border-t border-slate-200 py-12 px-4 font-inherit">
      <div className="max-w-[1200px] margin-0-auto" style={{ margin: '0 auto' }}>
        
        {/* شبكة الأعمدة الاستجابية للمحمول والكمبيوتر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* العمود الأول: بيانات المكتبة والتعريف القانوني والتسويقي الفاحم الأسود */}
          <div className="flex flex-col gap-4">
            {/* تثبيت مسمى مكتبة دار اللغات بالمفرد الصريح للبرستيج */}
            <h3 className="text-xl font-extrabold text-[#0A2E54] m-0">مكتبة دار اللغات</h3>
            
            {/* حقن كلمات ألعاب المنتسوري والشنط والسبلايز باللغتين صراحة للـ SEO لجلب الأمهات */}
            <p className="text-sm leading-relaxed text-slate-600 m-0">
              تفخر مكتبة دار اللغات بمدينة العبور بتقديم حلول تعليمية متكاملة تشمل كتب تأسيس الأطفال، كتب مستوى رفيع لغات، <strong>ألعاب تنمية مهارات أطفال منتسوري - Montessori & Skills Development Toys</strong>، وكافة مستلزمات السبلايز (School Supplies)، <strong>شنط مدرسية - School Bags & Backpacks</strong>، بالإضافة إلى قسم خاص لـ كتب مرتجع بأسعار اقتصادية تناسب الجميع.
            </p>
            
            <div className="mt-2 pt-3 border-t border-dashed border-slate-300">
              <h4 className="text-sm font-bold text-[#0A2E54] mb-1 m-0">
                📋 ارفع قائمة مدرستك والسبلايز
              </h4>
              <p className="text-xs leading-normal text-slate-600 m-0">
                وفّر وقتك وجهدك؛ ارفع لنا قائمة أدوات وكتب طفلك المدرسية والسبلايز (School Supplies) وسنقوم بتجهيزها لك بالكامل فوراً!
              </p>
            </div>

            <div className="mt-1">
              <h4 className="text-sm font-bold text-[#0A2E54] mb-1 m-0">
                🏢 توريدات الشركات والمؤسسات
              </h4>
              <p className="text-xs leading-normal text-slate-600 m-0">
                نلبي كافة احتياجات الشركات، المصانع، والمؤسسات من الأدوات المكتبية والتجهيزات بأفضل الأسعار المتاحة.
              </p>
            </div>

            {/* 🎯 البيانات القانونية محصنة ومعزولة بلون أسود فاحم صريح بالـ Tailwind لمنع البهتان نهائياً */}
            <div className="mt-4 bg-slate-100 p-3 rounded-lg border border-slate-200">
                <p dir="ltr" className="text-right m-0 mb-1 font-extrabold text-black text-sm">
                  الرقم الضريبي: 769499732
                </p>
                <p className="m-0 font-extrabold text-black text-sm">
                  السجل التجاري: 100160
                </p>
            </div>
          </div>
          {/* العمود الثاني: الروابط السريعة المحدثة بسياسات جوجل لضمان جودة الحساب ومطابقتها لميرشنت */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-[#0A2E54] m-0">روابط سريعة</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm font-semibold">
              <li><Link href="/" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">الرئيسية</Link></li>
              <li><Link href="/about" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">من نحن</Link></li>
              <li><Link href="/blog" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">المدونة</Link></li>
              <li><Link href="/contact" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">اتصل بنا</Link></li>
              <li><Link href="/privacy-policy" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">سياسة الخصوصية</Link></li>
              <li><Link href="/shipping-policy" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">سياسة الشحن</Link></li>
              <li><Link href="/return-policy" className="text-slate-600 hover:text-[#FFC107] no-underline transition-colors duration-200">سياسة الاسترجاع</Link></li>
            </ul>
          </div>

          {/* العمود الثالث: قنوات التواصل بالعبور وشبكة الأيقونات الملونة رسمياً */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-[#0A2E54] m-0">تواصل معنا - Contact Us</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-2 text-slate-600">
                <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                <a href={SITE_LINKS.googleMaps} target="_blank" rel="noopener noreferrer" className="text-slate-600 no-underline font-semibold">
                  مدينة العبور، القليوبية، مصر
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <FaEnvelope className="text-sky-600 flex-shrink-0" />
                <a href="mailto:dallughat@gmail.com" className="text-slate-600 no-underline font-semibold">dallughat@gmail.com</a>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <FaWhatsapp className="text-green-500 flex-shrink-0" />
                <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-slate-600 no-underline font-semibold">
                  تواصل عبر واتساب - WhatsApp
                </a>
              </li>
            </ul>

            {/* 🔥 الأيقونات الرسمية الحادة بألوانها النارية وحجمها الضخم لمنع الاختفاء كلياً */}
            <div className="flex items-center gap-4 mt-2">
              <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Page" className="hover:scale-105 transition-transform duration-200">
                <FaFacebook style={{ color: '#1877F2', fontSize: '32px' }} />
              </a>
              <a href={SITE_LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram Channel" className="hover:scale-105 transition-transform duration-200">
                <FaTelegram style={{ color: '#2AABEE', fontSize: '32px' }} />
              </a>
            </div>
          </div>

        </div>

        {/* سطر الحقوق السفلي النظيف بالكامل بالـ Tailwind */}
        <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-500 font-semibold">
          <p className="m-0">&copy; {currentYear} مكتبة دار اللغات. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
