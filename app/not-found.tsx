import Link from 'next/link';

// تعريف الصفحة كصفحة ديناميكية على مستوى السيرفر لمنع خطأ الـ Prerender
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', color: '#dc3545', margin: '0 0 10px 0' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#333' }}>عذراً، الصفحة غير موجودة!</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>الرابط الذي تحاول الوصول إليه قد يكون تم حذفه أو نقله.</p>
      <Link href="/" style={{
        padding: '10px 20px',
        backgroundColor: '#0070f3',
        color: '#fff',
        borderRadius: '5px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
}