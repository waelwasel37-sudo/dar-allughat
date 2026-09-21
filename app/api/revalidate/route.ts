import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * [تحديث أمان هندسي] - ملف مسح الكاش الفوري الآمن (On-Demand Revalidation API)
 * يضمن تحديث المنتجات والأسعار لحظياً فور تغييرها من لوحة تحكم الكاشير أو الـ POS
 */
export async function POST(request: NextRequest) {
  // --- خطوة 1: التأمين والحماية البنكية للرابط ---
  const authHeader = request.headers.get('Authorization');
  
  // التحقق من وجود التوكن ومطابقته لمتغيرات البيئة لحظر أي محاولات اختراق هابطة
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.REVALIDATION_TOKEN) {
    console.warn('🔴 محاولة تحديث كاش غير مصرح بها أو توكن مفقود للوحة التحكم!');
    return NextResponse.json(
      { revalidated: false, message: 'غير مصرح لك بمسح الكاش - توكن الحماية خاطئ' }, 
      { status: 401 }
    );
  }

  try {
    // --- خطوة 2: قراءة وتحليل الطلب القادم من لوحة التحكم ---
    const body = await request.json();
    const { tags, paths } = body;

    if (!tags && !paths) {
      return NextResponse.json({ revalidated: false, message: 'الرجاء إرسال "tags" أو "paths" في جسم الطلب' }, { status: 400 });
    }

    // --- خطوة 3: تنفيذ مسح وتطهير الكاش الفوري المطور لـ Next.js ---
    
    // 1. مسح وتطهير كاش البيانات المربوط بالعلامات (Data Fetch Tags)
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag);
      }
      console.log(`✅ [Next.js Cache] تم مسح الكاش كلياً للعلامات البيانات: ${tags.join(', ')}`);
    }

    // 2. مسح وتطهير كاش المسارات والصفحات (Layout & Page Cache Router)
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        // [تعديل قاطع]: نحدد النوع لـ layout و page معاً لضمان عدم تعليق الكاش في متصفحات الجوال
        revalidatePath(path, 'page');
        revalidatePath(path, 'layout');
      }
      console.log(`✅ [Next.js Cache] تم إجبار السيرفر على بناء الصفحات من جديد للمسارات: ${paths.join(', ')}`);
    }
    
    // --- خطوة 4: إرجاع رد ناجح للوحة التحكم لإنهاء العملية بنجاح ---
    return NextResponse.json({ 
      revalidated: true, 
      message: 'تم تصفير وتحديث الكاش بنجاح في السيرفر الفوري', 
      now: Date.now() 
    }, { status: 200 });

  } catch (error) {
    // --- خطوة 5: التعامل مع الأخطاء الطارئة ---
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف في قراءة السيرفر';
    console.error('🔴 خطأ كارثي أثناء تحديث وتطهير الكاش الذكي لـ Next.js:', errorMessage);
    return NextResponse.json({ revalidated: false, message: `حدث خطأ بالسيرفر: ${errorMessage}` }, { status: 500 });
  }
}
