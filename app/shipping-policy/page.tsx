
// app/shipping-policy/page.tsx
import styles from '../page.module.css'; // Re-use some global styles

export default function ShippingPolicyPage() {
  return (
    <main className={`${styles.main} px-4 md:px-8 lg:px-16`}>
        <div className="bg-white shadow-md rounded-lg p-6 md:p-10 w-full max-w-4xl mx-auto my-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">سياسة الشحن والدفع</h1>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">خيارات الشحن</h2>
                <p className="text-gray-600 leading-relaxed">
                    نحن في مكتبات دار اللغات نسعى لتوفير أفضل تجربة لكم، ولذلك نوفر خيارات شحن مرنة لتناسب احتياجاتكم داخل جميع أنحاء الجمهورية.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">مدة التوصيل</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li><strong>داخل القاهرة والجيزة:</strong> يتم التوصيل خلال 2-4 أيام عمل.</li>
                    <li><strong>باقي المحافظات:</strong> يتم التوصيل خلال 3-7 أيام عمل.</li>
                    <li>قد تزيد مدة التوصيل في أوقات العروض والمواسم. سيتم إبلاغكم بأي تأخير متوقع.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">تكلفة الشحن</h2>
                <p className="text-gray-600 leading-relaxed">
                    يتم تحديد تكلفة الشحن بناءً على المحافظة والعنوان المحدد عند إتمام الطلب. ستظهر التكلفة النهائية للشحن قبل تأكيد الطلب مباشرة.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">طرق الدفع المتاحة</h2>
                <p className="text-gray-600 leading-relaxed">
                    نوفر لكم طرق دفع متنوعة لتسهيل عملية الشراء:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                    <li><strong>الدفع عند الاستلام:</strong> يمكنك الدفع نقدًا لمندوب الشحن عند استلام طلبك.</li>
                    <li><strong>الدفع عبر انستا باي (InstaPay):</strong> يمكنك التحويل مباشرةً إلى حسابنا عبر تطبيق انستا باي.</li>
                    <li><strong>الدفع عبر المحافظ الإلكترونية:</strong> ندعم الدفع من خلال المحافظ الإلكترونية المختلفة.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-3">
                    عند اختيار الدفع المسبق (انستا باي أو محفظة إلكترونية)، سيتم التواصل معكم عبر واتساب لتزويدكم ببيانات التحويل وتأكيد الدفع.
                </p>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">تتبع الطلبات</h2>
                <p className="text-gray-600 leading-relaxed">
                    بمجرد شحن طلبك، سيتم تزويدك برقم تتبع (إن وجد) عبر رسالة نصية أو عبر واتساب، والذي يمكنك استخدامه لمتابعة حالة شحنتك مع شركة الشحن المسؤولة.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">استفسارات؟</h2>
                <p className="text-gray-600 leading-relaxed">
                    إذا كان لديكم أي استفسارات بخصوص الشحن والدفع، لا تترددوا في التواصل معنا عبر صفحة <a href="/contact" className="text-blue-600 hover:underline">اتصل بنا</a>.
                </p>
            </section>
        </div>
    </main>
  );
}
