import { NextRequest, NextResponse } from 'next/server';
import { getSecondaryDb } from '@/app/lib/firebase-admin'; // الحساب المخصص الصحيح للمتجر

// 🎯 PUT /api/factory-supplies/[id]
// تعديل حالة وسعر طلب التوريد في قاعدة البيانات (نسخة محدثة متوافقة مع Next.js 15 والسلوج العربي)
export async function PUT(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> } // 🎯 تصحيح Next.js 15 الإجباري: تحويل params إلى Promise
) {
    try {
        // 🎯 تصحيح Next.js 15: فك معرّف الطلب باستخدام await لضمان القراءة السليمة
        const { id } = await params; 
        const body = await request.json();
        const { status, price } = body;

        if (!id || !status) {
            return NextResponse.json({ message: 'المعرف والحالة مطلوبان' }, { status: 400 });
        }

        // 🎯 أمان السلوج العربي: فك تشفير المعرف إذا أرسله المتصفح برموز مشفرة
        const cleanId = decodeURIComponent(id);

        // 1. الاتصال بقاعدة البيانات الثانوية الصحيحة للمشروع
        const db = getSecondaryDb();
        
        // 2. تحديد مكان الطلب بالظبط باستخدام الـ id النظيف
        const docRef = db.collection('factory-supplies').doc(cleanId);
        
        // 3. تجهيز البيانات الجديدة لحفظها (مع معالجة السعر الفارغ)
        const updateData: { status: string; price?: number | null } = { status };
        if (price !== null && price !== undefined && price !== '') {
            updateData.price = Number(price);
        } else {
            updateData.price = null; // تفريغ خانة السعر في قاعدة البيانات إذا كانت القيمة فارغة
        }

        // 4. حفظ وتحديث البيانات في Firebase
        await docRef.update(updateData);

        return NextResponse.json({ message: 'تم تحديث الطلب بنجاح' }, { status: 200 });

    } catch (error) {
        console.error('حدث خطأ أثناء تحديث طلب التوريد:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
        return NextResponse.json({ message: `فشل تحديث الطلب: ${errorMessage}` }, { status: 500 });
    }
}

// 🎯 DELETE /api/factory-supplies/[id]
// حذف طلب توريد معين من قاعدة البيانات
export async function DELETE(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> } // تصحيح Next.js 15 الإجباري
) {
    try {
        const { id } = await params; // فك المعرّف باستخدام await

        if (!id) {
            return NextResponse.json({ message: 'المعرف مطلوب' }, { status: 400 });
        }

        // أمان السلوج العربي والـ IDs المشفرة
        const cleanId = decodeURIComponent(id);

        // 1. الاتصال بقاعدة البيانات
        const db = getSecondaryDb();
        
        // 2. تحديد المستند المطلوب للحذف باستخدام المعرف النظيف
        const docRef = db.collection('factory-supplies').doc(cleanId);

        // التحقق من وجود المستند قبل حذفه من الفايربيس
        const docSnapshot = await docRef.get();
        if (!docSnapshot.exists) {
            return NextResponse.json({ message: 'طلب التوريد غير موجود بالفعل أو تم حذفه مسبقاً' }, { status: 404 });
        }

        // 3. تنفيذ عملية الحذف النهائية
        await docRef.delete();

        return NextResponse.json({ message: 'تم حذف الطلب بنجاح' }, { status: 200 });

    } catch (error) {
        console.error('حدث خطأ أثناء حذف طلب التوريد:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
        return NextResponse.json({ message: `فشل حذف الطلب: ${errorMessage}` }, { status: 500 });
    }
}
