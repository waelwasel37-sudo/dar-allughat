import React from 'react';
import styles from './Checkout.module.css';

export default function CheckoutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>صفحة الدفع</h1>
      <div className={styles.formContainer}>
        {/* Add your checkout form here */}
        <p>نموذج الدفع سيظهر هنا.</p>
      </div>
      <div className={styles.summaryContainer}>
        <h2>ملخص الطلب</h2>
        {/* Add your order summary here */}
        <p>تفاصيل ملخص الطلب ستظهر هنا.</p>
      </div>
    </div>
  );
}