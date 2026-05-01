
// app/privacy-policy/page.tsx
import styles from '../page.module.css';

export default function PrivacyPolicyPage() {
  return (
    <main className={`${styles.main} px-4 md:px-8 lg:px-16`}>
        <div className="bg-white shadow-md rounded-lg p-6 md:p-10 w-full max-w-4xl mx-auto my-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">سياسة الخصوصية</h1>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">جمع المعلومات</h2>
                <p className="text-gray-600 leading-relaxed">
                    نحن في مكتبات دار اللغات نقوم بجمع المعلومات اللازمة لتقديم خدماتنا وتحسينها. تشمل هذه المعلومات اسمك، عنوانك، رقم هاتفك، وعنوان بريدك الإلكتروني عند قيامك بإنشاء حساب أو تقديم طلب.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">استخدام المعلومات</h2>
                <p className="text-gray-600 leading-relaxed">
                    تُستخدم المعلومات التي نجمعها في معالجة طلباتك، وتوصيل مشترياتك، والتواصل معك بخصوص طلباتك أو عروضنا الجديدة، وتحسين تجربة تسوقك على موقعنا.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">أمان المعلومات</h2>
                <p className="text-gray-600 leading-relaxed">
                    نحن نتعهد بحماية معلوماتك الشخصية ونستخدم إجراءات أمنية مناسبة لمنع الوصول غير المصرح به أو الكشف عنها. لا نشارك معلوماتك مع أي أطراف ثالثة إلا بالقدر اللازم لإتمام خدماتنا (مثل شركات الشحن).
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">تواصل معنا</h2>
                <p className="text-gray-600 leading-relaxed">
                    إذا كان لديك أي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر صفحة <a href="/contact" className="text-blue-600 hover:underline">اتصل بنا</a>.
                </p>
            </section>

        </div>
    </main>
  );
}
