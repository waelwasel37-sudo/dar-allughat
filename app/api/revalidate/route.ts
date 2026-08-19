import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * هذا هو "الريموت كنترول" الخاص بالكاش في موقعنا (On-Demand Revalidation).
 * إنه ملف API آمن ومحمي. عند استدعائه مع "كلمة سر" (token) صحيحة،
 * يقوم بمسح "كاش البيانات" الخاص بـ Next.js لجزء معين من الموقع (عن طريق العلامات tags).
 * هذا يسمح لنا بتحديث المحتوى (مثل المنتجات أو الأسعار) من لوحة التحكم بشكل فوري
 * وعرضه للزوار مباشرة دون الحاجة لإعادة نشر الموقع بالكامل وتوفير فاتورة خطة Blaze.
 */

export async function POST(request: NextRequest) {
  // --- خطوة 1: التأمين والحماية البنكية للرابط ---
  // يتم التأكد من أن الطلب يحتوي على كلمة سر مطابقة للموجودة في متغيرات البيئة (.env) لضمان الأمان.
  const secret = request.headers.get('Authorization');
  if (secret !== `Bearer ${process.env.REVALIDATION_TOKEN}`) {
    console.warn('🔴 محاولة تحديث كاش غير مصرح بها للوحة التحكم!');
    return NextResponse.json({ revalidated: false, message: 'كلمة السر غير صحيحة' }, { status: 401 });
  }

  // --- خطوة 2: قراءة وتحليل الطلب القادم من لوحة التحكم ---
  // يتم قراءة البيانات المرسلة في الطلب، والتي يجب أن تحتوي على العلامات (tags) أو المسارات (paths) المراد تطهير كاشها.
  const body = await request.json();
  const { tags, paths } = body;

  if (!tags && !paths) {
    return NextResponse.json({ revalidated: false, message: 'الرجاء إرسال "tags" أو "paths" في الطلب' }, { status: 400 });
  }

  try {
    // --- خطوة 3: تنفيذ مسح وتطهير الكاش الفوري ---
    // يتم تحديث الكاش لكل علامة (tag) تم إرسالها لتبني الصفحات المرتبطة بها بياناتها من جديد.
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag);
      }
      console.log(`✅ تم مسح وتطهير الكاش بنجاح للعلامات: ${tags.join(', ')}`);
    }

    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path);
      }
       console.log(`✅ تم مسح وتطهير الكاش بنجاح للمسارات: ${paths.join(', ')}`);
    }
    
    // --- خطوة 4: إرجاع رد ناجح للوحة التحكم لإنهاء العملية ---
    return NextResponse.json({ revalidated: true, now: Date.now() });

  } catch (error) {
    // --- خطوة 5: التعامل مع الأخطاء الطارئة ---
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('🔴 خطأ أثناء تحديث وتطهير الكاش الذكي:', errorMessage);
    return NextResponse.json({ revalidated: false, message: `حدث خطأ: ${errorMessage}` }, { status: 500 });
  }
}