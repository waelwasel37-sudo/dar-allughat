import { Suspense } from 'react';
import styles from './page.module.css';
import Hero from './components/Hero';
import SearchAndFilter from './components/SearchAndFilter'; 
import { getProducts, getCategories } from '@/app/lib/data-server'; 
import { Product, Category } from '@/app/lib/types';
import HomeProductsLoader from './components/HomeProductsLoader';
// 👇 تم التأكيد: استيراد Link البرمجي الصحيح من Next.js لتسريع الانتقال بين الصفحات
import Link from 'next/link'; 

async function loadData(): Promise<{ products: Product[], categories: Category[] }> {
  const allCategory: Category = { id: 'all', name: 'الكل', emoji: '✨', slug: 'all' };
  try {
    const [products, rawCategories] = await Promise.all([
      getProducts(), 
      getCategories() 
    ]);

    const categories = [allCategory, ...(rawCategories?.map((c: Category) => ({...c, slug: c.slug || c.id})) || [])];

    return { 
      products: Array.isArray(products) ? products : [], 
      categories: Array.isArray(categories) ? categories : [allCategory]
    };

  } catch (error) {
    console.error("🔴 Failed to load server data for homepage:", error);
    return { products: [], categories: [allCategory] };
  }
}

export default async function Home() {
  const { products: initialProducts, categories } = await loadData();

  return (
    <main className={styles.main}>
      
      {/* قسم النص التشريحي الشامل لأقسام المكتبة وخدماتها لدعم أرشفة جوجل الفورية */}
      <section className={styles.seoIntro} style={{ padding: '30px 20px', backgroundColor: '#fdfdfd', borderBottom: '1px solid #eee', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '26px', color: '#2c3e50', fontWeight: 'bold', marginBottom: '15px' }}>
            مكتبات دار اللغات بالعبور - المنصة الأولى للكتب والمستلزمات التعليمية
          </h1>
          <p style={{ fontSize: '16px', color: '#555', lineHeight: '1.8', marginBottom: '25px' }}>
            مرحباً بكم في <strong>مكتبات دار اللغات في مدينة العبور</strong>. نوفر لأبنائكم تشكيلة متكاملة من 
            <em> كتب خارجية، كتب مدرسية، كتب أزهري، كتب تأسيس، وكتب مستوى رفيع لغات</em> لكافة المراحل التعليمية. 
            كما نتميز بتقديم أفضل <em>كتب تنمية مهارات أطفال، قصص أطفال، وألعاب تنمية مهارات أطفال منتسوري</em> المصممة علمياً لتطوير ذكاء طفلك، 
            بجانب كافة مستلزمات الـ <em>أدوات مكتبية ومدرسية</em> وقسم خاص لـ <em>كتب مرتجع</em> بأسعار تنافسية.
          </p>

          {/* 👇 تم التعديل والتأكيد: استخدام مكونات الـ Link الذكية لسرعة تصفح خارقة للزوار وتكامل الـ SEO */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Link href="/school-lists" style={{ padding: '12px 24px', backgroundColor: '#e74c3c', color: '#fff', borderRadius: '5px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              📋 ارفع قائمة مدرستك الآن
            </Link>
            <Link href="/factory-supplies" style={{ padding: '12px 24px', backgroundColor: '#2ecc71', color: '#fff', borderRadius: '5px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              🏢 قسم توريدات مصانع ومؤسسات
            </Link>
          </div>
        </div>
      </section>

      <Hero />
      
      {/* تفعيل الفلاتر والبحث بدون شاشات رمادية */}
      <Suspense fallback={<div className={styles.loading}>جاري تحميل أقسام المكتبة...</div>}> 
        <SearchAndFilter categories={categories || []} />
      </Suspense>
      
      {/* عرض المنتجات مدمجة مباشرة من السيرفر ليراها جوجل فوراً ويؤرشف الكتب */}
      <Suspense fallback={<div className={styles.loading}>جاري عرض الكتب والمستلزمات...</div>}> 
        <HomeProductsLoader initialProducts={initialProducts || []} categories={categories || []} />
      </Suspense>
    </main>
  );
}