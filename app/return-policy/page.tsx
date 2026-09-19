
// app/return-policy/page.tsx
import styles from '../page.module.css';

export default function ReturnPolicyPage() {
  return (
    <main className={`${styles.main} px-4 md:px-8 lg:px-16`}>
        <div className="bg-white shadow-md rounded-lg p-6 md:p-10 w-full max-w-4xl mx-auto my-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">سياسة الاستبدال والاسترجاع</h1>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">شروط الاسترجاع والاستبدال</h2>
                <p className="text-gray-600 leading-relaxed">
                    نحن في مكتبات دار اللغات نضمن رضاكم عن مشترياتكم. إذا لم تكن راضيًا تمامًا عن طلبك، يمكنك طلب استرجاع أو استبدال المنتج خلال 14 يومًا من تاريخ الاستلام، بشرط أن يكون المنتج في حالته الأصلية وغير مستخدم، ومرفقًا به الفاتورة الأصلية.
                </p>
                <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">المنتجات غير القابلة للإرجاع:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>الكتب التي تم فتح غلافها الأصلي.</li>
                    <li>الأدوات المدرسية المستعملة.</li>
                    <li>القسائم الشرائية أو بطاقات الهدايا.</li>
                </ul>
            </section>

             <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">خطوات تقديم طلب</h2>
                <p className="text-gray-600 leading-relaxed">
                   لتقديم طلب استرجاع أو استبدال، يرجى التواصل معنا عبر صفحة <a href="/contact" className="text-blue-600 hover:underline">اتصل بنا</a> وتزويدنا برقم الطلب وتفاصيل المنتج الذي ترغب في إرجاعه أو استبداله.
                </p>
            </section>

        </div>
    </main>
  );
}
