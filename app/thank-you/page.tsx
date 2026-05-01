
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import styles from './ThankYou.module.css';
import { FaCheckCircle, FaWhatsapp, FaHome } from 'react-icons/fa';

export default function ThankYouPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart as soon as the customer reaches the thank you page
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
            href="https://wa.me/+201220396597" // Correct WhatsApp number
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
    </div>
  );
}
