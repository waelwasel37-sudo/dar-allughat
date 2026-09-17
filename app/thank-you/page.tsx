'use client';

import Link from 'next/link';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../context/CartContext';
import styles from './ThankYou.module.css';
import { FaCheckCircle, FaWhatsapp, FaHome } from 'react-icons/fa';
import GoogleReviewsOptIn from '../components/GoogleReviewsOptIn';

const ThankYouContent = () => {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();

  // قراءة بيانات الطلب من الرابط
  const orderId = searchParams.get('orderId');
  const email = searchParams.get('email');
  const country = searchParams.get('country');
  const deliveryDate = searchParams.get('deliveryDate');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <FaCheckCircle className={styles.icon} />
        <h1 className={styles.title}>شكرًا لك، تم استلام طلبك بنجاح!</h1>
        <p className={styles.message}>
          لقد تم إرسال تفاصيل طلبك عبر الواتساب. سيقوم أحد أعضاء فريقنا بالتواصل معك قريبًا لتأكيد تفاصيل الشحن والتوصيل.
        </p>
        <p className={styles.nextSteps}>
          <strong>ماذا بعد؟</strong> فريقنا يعمل الآن على مراجعة طلبك وسيتم التواصل معك على الرقم الذي قمت بتزويدنا به.
        </p>
        <div className={styles.buttonContainer}>
          <a 
            href="https://wa.me/201220396597"
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${styles.button} ${styles.whatsappButton}`}>
            <FaWhatsapp /> متابعة على الواتساب
          </a>
          <Link href="/" className={`${styles.button} ${styles.homeButton}`}>
            <FaHome /> العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
      
      {/* التأكد من وجود البيانات قبل عرض نافذة جوجل */}
      {orderId && email && country && deliveryDate && (
        <GoogleReviewsOptIn 
          orderId={orderId}
          customerEmail={email}
          deliveryCountry={country}
          estimatedDeliveryDate={deliveryDate}
        />
      )}
    </div>
  );
}

// استخدام Suspense لضمان عمل useSearchParams بشكل صحيح
export default function ThankYouPage() {
  return (
    <Suspense fallback={<div>جارٍ تحميل صفحة الشكر...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
