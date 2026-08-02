'use client';

// 🎯 التصحيح الجذري لإنهاء خطأ الـ Build: إجبار صفحة اتصل بنا على العمل ديناميكياً لتجاوز قفل الـ Secret Manager ونجاح النشر الفعلي
export const dynamic = 'force-dynamic';

import { FaWhatsapp, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const whatsappNumber = "+201220396597"; // رقم الواتساب الرسمي للمتجر
  const phoneNumber = "01220396597"; // رقم الاتصال الهاتفي المباشر

  const handleSendWhatsApp = () => {
    const whatsappMessage = `مرحباً، أنا ${name}.\n\n${message}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200" dir="rtl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            تواصل معنا
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            نسعد دائمًا باستقبال استفساراتكم واقتراحاتكم. يمكنكم التواصل معنا عبر القنوات التالية.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* 🎯 تصحيح: حماية ألوان صندوق معلومات التواصل ليكون واضحاً والكلام بارزاً باللون الأبيض 100% */}
            <div className="p-8 bg-purple-700 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-white">معلومات التواصل</h2>
                <ul className="space-y-6">
                  
                  {/* العنوان */}
                  <li className="flex items-start gap-3">
                    <FaMapMarkerAlt className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">العنوان</h3>
                      <p className="text-gray-100 font-medium text-sm leading-relaxed">امام سنترال العبور 2، مول روضة العبور، العبور، محافظة القليوبية 6361122</p>
                    </div>
                  </li>
                  
                  {/* 🎯 تصحيح: تحويل الرقم لرابط شات واتساب مباشر بمجرد النقر عليه */}
                  <li className="flex items-start gap-3">
                    <FaWhatsapp className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white">واتساب</h3>
                      <a 
                        href={`https://wa.me/${whatsappNumber}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-yellow-200 font-bold block mt-1 hover:text-white underline transition-colors"
                        dir="ltr"
                      >
                        +20 122 039 6597
                      </a>
                    </div>
                  </li>

                  {/* 🎯 تصحيح مضاف: زر للاتصال الهاتفي المباشر الفوري عند الضغط من الموبايل */}
                  <li className="flex items-start gap-3">
                    <FaPhoneAlt className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-white">الاتصال المباشر</h3>
                      <a 
                        href={`tel:${phoneNumber}`} 
                        className="text-yellow-200 font-bold block mt-1 hover:text-white underline transition-colors"
                        dir="ltr"
                      >
                        01220396597
                      </a>
                    </div>
                  </li>

                </ul>
              </div>
            </div>

            {/* WhatsApp Form */}
            <div className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">أرسل لنا رسالة عبر واتساب</h2>
              <div className="grid grid-cols-1 gap-y-6">
                <div>
                  <label htmlFor="full-name" className="sr-only">الاسم الكامل</label>
                  <input
                    type="text"
                    name="full-name"
                    id="full-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="block w-full border border-gray-300 dark:border-gray-600 shadow-sm py-3 px-4 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="sr-only">الرسالة</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="block w-full shadow-sm py-3 px-4 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-bold rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full transition-colors"
                  >
                    <FaWhatsapp className="ml-3 text-xl" />
                    إرسال عبر واتساب
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}