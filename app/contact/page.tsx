'use client';

import { FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa';
import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const whatsappNumber = "+201220396597"; // Your WhatsApp number

  const handleSendWhatsApp = () => {
    const whatsappMessage = `مرحباً، أنا ${name}.\n\n${message}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
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
            {/* Contact Information */}
            <div className="p-8 bg-blue-600 dark:bg-blue-800 text-white">
              <h2 className="text-3xl font-bold mb-6">معلومات التواصل</h2>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <FaMapMarkerAlt className="w-6 h-6 mr-4 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="text-lg font-semibold">العنوان</h3>
                    <p>امام سنترال العبور 2، مول روضة العبور، العبور، محافظة القليوبية 6361122</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FaWhatsapp className="w-6 h-6 mr-4 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="text-lg font-semibold">واتساب</h3>
                    <p dir="ltr">+20 122 039 6597</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* WhatsApp Form */}
            <div className="p-8">
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
                    className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
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
                    className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full"
                  >
                    <FaWhatsapp className="mr-3" />
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
