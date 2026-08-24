
import React from 'react';
import { FaBookReader, FaGlobe, FaPencilRuler, FaBrain, FaMosque, FaRecycle } from 'react-icons/fa';

export const dynamic = 'force-static';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="bg-white shadow-xl rounded-lg p-8 md:p-12">

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
            مكتبة دار اللغات: شغف المعرفة، وبناء المستقبل
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            في قلب كل عائلة وطالب ومعلم، بذرة شغف للاكتشاف والنمو. نحن في "مكتبة دار اللغات" نؤمن بأن الكلمات هي الماء الذي يروي هذه البذرة. لسنا مجرد مكتبة، بل شركاء لكم في رحلة بناء العقول وصناعة المستقبل.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-blue-700 mb-4">رؤيتنا</h2>
            <p className="text-lg text-gray-600 mb-6">
              أن نكون الوجهة الأولى والموثوقة لكل أسرة عربية تسعى لتمكين أبنائها بأفضل الأدوات التعليمية والمعرفية، وأن نلهم جيلاً جديداً من المفكرين والمبدعين.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-700 mb-4">رسالتنا</h2>
            <p className="text-lg text-gray-600">
              توفير تشكيلة لا مثيل لها من الكتب والمواد التعليمية عالية الجودة، التي تلبي كافة الاحتياجات التعليمية من المهد إلى الجامعة، في بيئة سهلة الوصول وداعمة للتعلم.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-10">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            ما يميزنا: عالم متكامل في مكان واحد
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <FaBrain className="text-4xl text-blue-500 mb-3"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">مستقبل أطفالك يبدأ هنا</h3>
              <p className="text-gray-600">من كتب تأسيس المهارات وقصص تنمية الخيال، إلى ألعاب "منتسوري" المبتكرة، نحتضن عقل طفلك ونطلق العنان لإبداعه.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-green-50 p-6 rounded-lg">
              <FaBookReader className="text-4xl text-green-500 mb-3"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">رفيق الطالب المتفوق</h3>
              <p className="text-gray-600">نوفر أحدث الكتب المدرسية المقررة وكل الكتب الخارجية التي يحتاجها الطالب لتحقيق أعلى الدرجات في جميع المراحل.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <FaGlobe className="text-4xl text-yellow-500 mb-3"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">نافذتك على العالم</h3>
              <p className="text-gray-600">مجموعتنا المتخصصة في تعلم اللغات تفتح أمامك أبواب التواصل مع ثقافات العالم، من القواعد الأساسية إلى المستويات المتقدمة.</p>
            </div>
            {/* Feature 4 */}
            <div className="bg-indigo-50 p-6 rounded-lg">
              <FaMosque className="text-4xl text-indigo-500 mb-3"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">إرث يتجدد</h3>
              <p className="text-gray-600">ركن خاص وشامل لجميع الكتب والمناهج المخصصة لطلاب ومعاهد الأزهر الشريف، دعمًا لمسيرتهم العلمية المباركة.</p>
            </div>
            {/* Feature 5 */}
            <div className="bg-red-50 p-6 rounded-lg">
              <FaRecycle className="text-4xl text-red-500 mb-3"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">كنز المعرفة المستدامة</h3>
              <p className="text-gray-600">نؤمن بأن المعرفة يجب أن تكون في متناول الجميع. قسم الكتب المستخدمة يمنح كنوز المعرفة حياة جديدة بأسعار لا تقبل المنافسة.</p>
            </div>
            {/* Feature 6 */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <FaPencilRuler className="text-4xl text-purple-500 mb-3"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">كل ما يحتاجه المبدع الصغير</h3>
              <p className="text-gray-600">أكمل رحلتك التعليمية مع تشكيلتنا الكاملة من الأدوات المدرسية والمكتبية عالية الجودة التي تلهم على الإبداع.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-10 mt-12 text-center">
            <h2 className="text-3xl font-bold text-blue-700 mb-4">
              تعهدنا لكم
            </h2>
            <div className="flex flex-col md:flex-row justify-center gap-8 text-lg">
                <p><strong>الجودة أولاً:</strong> نختار كل كتاب وكل أداة بعناية فائقة.</p>
                <p><strong>التخصص والشمولية:</strong> كل ما تحتاجه الأسرة في مكان واحد.</p>
                <p><strong>شريككم الدائم:</strong> نحن هنا لدعم رحلتكم التعليمية في كل خطوة.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
