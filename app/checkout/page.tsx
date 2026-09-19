'use client';

// 🚀 تفعيل الرندر الديناميكي لمنع أخطاء بناء Next.js 15
export const dynamic = 'force-dynamic';

import React from 'react';
import styles from './Checkout.module.css';

export default function CheckoutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>صفحة الدفع</h1>
      <div className={styles.formContainer}>
        {/* سيتم هنا ربط نموذج الدفع وفورم المشترين لاحقاً */}
        <p>نموذج الدفع سيظهر هنا.</p>
      </div>
      <div className={styles.summaryContainer}>
        <h2>ملخص الطلب</h2>
        {/* سيتم جلب وعرض تفاصيل سلة كتب ومستلزمات مدينة العبور هنا */}
        <p>تفاصيل ملخص الطلب ستظهر هنا.</p>
      </div>
    </div>
  );
}