import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSecondaryDb, getAdminAuth } from '@/app/lib/firebase-admin';

// 🎯 الموظفين المسموح لهم
const STAFF_EMAILS = [
    'waelwasel37@gmail.com',
    'dallughat@gmail.com',
    'bondka111@gmail.com'
];

// 🔐 دالة التحقق من الجلسة
async function verifyStaff(): Promise<{ email: string } | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;
        if (!sessionCookie) return null;

        const firebaseAuth = getAdminAuth();
        const decoded = await firebaseAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
        if (!decoded || !decoded.email) return null;
        if (!STAFF_EMAILS.includes(decoded.email)) return null;

        return { email: decoded.email };
    } catch (e) {
        return null;
    }
}

// 🎯 PUT /api/factory-supplies/[id]
export async function PUT(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 🆕 التحقق من الصلاحيات
        const staff = await verifyStaff();
        if (!staff) {
            return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
        }

        const { id } = await params; 
        const body = await request.json();
        const { status, price } = body;

        if (!id || !status) {
            return NextResponse.json({ message: 'المعرف والحالة مطلوبان' }, { status: 400 });
        }

        const cleanId = decodeURIComponent(id);
        const db = getSecondaryDb();
        const docRef = db.collection('factory-supplies').doc(cleanId);
        
        const updateData: { status: string; price?: number | null } = { status };
        if (price !== null && price !== undefined && price !== '') {
            updateData.price = Number(price);
        } else {
            updateData.price = null;
        }

        await docRef.update(updateData);

        return NextResponse.json({ message: 'تم تحديث الطلب بنجاح' }, { status: 200 });

    } catch (error) {
        console.error('حدث خطأ أثناء تحديث طلب التوريد:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
        return NextResponse.json({ message: `فشل تحديث الطلب: ${errorMessage}` }, { status: 500 });
    }
}

// 🎯 DELETE /api/factory-supplies/[id]
export async function DELETE(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 🆕 التحقق من الصلاحيات
        const staff = await verifyStaff();
        if (!staff) {
            return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ message: 'المعرف مطلوب' }, { status: 400 });
        }

        const cleanId = decodeURIComponent(id);
        const db = getSecondaryDb();
        const docRef = db.collection('factory-supplies').doc(cleanId);

        const docSnapshot = await docRef.get();
        if (!docSnapshot.exists) {
            return NextResponse.json({ message: 'طلب التوريد غير موجود بالفعل أو تم حذفه مسبقاً' }, { status: 404 });
        }

        await docRef.delete();

        return NextResponse.json({ message: 'تم حذف الطلب بنجاح' }, { status: 200 });

    } catch (error) {
        console.error('حدث خطأ أثناء حذف طلب التوريد:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
        return NextResponse.json({ message: `فشل حذف الطلب: ${errorMessage}` }, { status: 500 });
    }
}
