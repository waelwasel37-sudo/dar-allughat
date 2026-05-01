
import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>404 - الصفحة غير موجودة</h1>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
