import { NextResponse } from 'next/server';
import { getSecondaryDb } from '@/app/lib/firebase-admin'; // الحساب المخصص الصحيح للمتجر

// PUT /api/factory-supplies/[id]
// تعديل حالة وسعر طلب التوريد في قاعدة البيانات
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params; // استخراج المعرف مباشرة
        const body = await request.json();
        const { status, price } = body;

        if (!id || !status) {
            return NextResponse.json({ message: 'المعرف والحالة مطلوبان' }, { status: 400 });
        }

        // 1. الاتصال بقاعدة البيانات الثانوية الصحيحة للمشروع
        const db = getSecondaryDb();
        
        // 2. تحديد مكان الطلب بالظبط باستخدام الـ id
        const docRef = db.collection('factory-supplies').doc(id);
        
        // 3. تجهيز البيانات الجديدة لحفظها (مع معالجة السعر الفارغ)
        const updateData: { status: string; price?: number | null } = { status };
        if (price !== null && price !== undefined && price !== '') {
            updateData.price = Number(price);
        } else {
            // تفريغ خانة السعر في قاعدة البيانات إذا كانت القيمة فارغة
            updateData.price = null; 
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
