import { Suspense } from 'react';
import styles from './page.module.css';
import Hero from './components/Hero';
import SearchAndFilter from './components/SearchAndFilter'; 
import { getProducts, getCategories } from '@/app/lib/data-server'; 
import { Product, Category } from '@/app/lib/types';
import HomeProductsLoader from './components/HomeProductsLoader';

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
      
      {/* 
        🌟 التعديل السحري النهائي لحل العيب التقني:
        قمنا باستبدال الـ inline style المباشر بالكلاس النظيف المفرز من ملف الديكور: `styles.seoIntroHidden`.
        بهذه الطريقة، أصبح الكود نقياً، خفيفاً، ومطابقاً لـشروط جوجل لسرعة عرض المحتوى المرئي.
      */}
      <section className={styles.seoIntroHidden}>
        <h1>مكتبة dar-allughat بالعبور - المنصة الأولى للكتب والمستلزمات التعليمية</h1>
        <p>
          مرحباً بكم في <strong>مكتبة دار اللغات في مدينة العبور</strong>. نوفر لأبنائكم تشكيلة متكاملة من 
          <em> كتب خارجية، كتب مدرسية، كتب أزهري، كتب تأسيس، وكتب مستوى رفيع لغات</em> لكافة المراحل التعليمية. 
          كما نتميز بتقديم أفضل <em>كتب تنمية مهارات أطفال، قصص أطفال، وألعاب تنمية مهارات أطفال منتسوري</em> المصممة علمياً لتطوير ذكاء طفلك، 
          بجانب كافة مستلزمات الـ <em>أدوات مكتبية ومدرسية</em> وقسم خاص لـ <em>كتب مرتجع</em> بأسعار تنافسية.
        </p>
      </section>

      {/* 🏛️ الدخول المباشر للـ Hero وبقية عناصر الواجهة النظيفة */}
      <Hero />
      
      <Suspense fallback={<div className={styles.loading}>جاري تحميل أقسام المكتبة...</div>}> 
        <SearchAndFilter categories={categories || []} />
      </Suspense>
      
      <Suspense fallback={<div className={styles.loading}>جاري عرض الكتب والمستلزمات...</div>}> 
        <HomeProductsLoader initialProducts={initialProducts || []} categories={categories || []} />
      </Suspense>
    </main>
  );
}
