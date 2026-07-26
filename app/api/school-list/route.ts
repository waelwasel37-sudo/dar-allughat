import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// 🎯 تم التعديل: استيراد دالة getSecondaryDb التي تضمن الاتصال بالقاعدة الصحيحة في أوروبا
import { getSecondaryDb, getAdminAuth } from '@/app/lib/firebase-admin';
import { firestore } from 'firebase-admin';
import { SchoolListRequest } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

const generateSlug = (name: string) => {
    if (!name) return '';
    return name.trim().toLowerCase()
        .replace(/[^\w\d\s\u0600-\u06FF]/g, '')
        .replace(/\s+/g, '-');
};

// GET method - مخصص للأدمن لقراءة طلبات المدارس والعدد الجديد
export async function GET(req: NextRequest) {
    try {
        const firebaseAuth = getAdminAuth();
        // 🎯 تم التعديل هنا لربط لوحة التحكم بالقاعدة الصحيحة والوحيدة
        const db = getSecondaryDb();     

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value; 
        
        let decodedToken: any = null;
        
        if (sessionCookie) {
            decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true).catch(() => null);
        } else {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7); 
                decodedToken = await firebaseAuth.verifyIdToken(token).catch(() => null);
            }
        }

        if (!decodedToken || decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const requestsRef = db.collection('school-lists');

        if (status === 'new') {
            const snapshot = await requestsRef.where('status', '==', 'new').get();
            return NextResponse.json({ count: snapshot.size });
        }

        const snapshot = await requestsRef.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        const requests = snapshot.docs.map((doc: firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
            } as SchoolListRequest;
        });

        return NextResponse.json(requests);

    } catch (error: any) {
        console.error('[GET /api/school-list]', error);
        return NextResponse.json({ error: `Failed to fetch requests: ${error.message}` }, { status: 500 });
    }
}

// POST method - مفتوح للعامة والجمهور لإرسال طلباتهم وإرسال الواتساب
export async function POST(req: NextRequest) {
    try {
        // 🎯 تم التعديل هنا ليتم كتابة طلبات الزبائن الجديدة في القاعدة الصحيحة مباشرة
        const db = getSecondaryDb(); 
        const data: Omit<SchoolListRequest, 'id' | 'createdAt' | 'status'> = await req.json();

        if (!data.fullName || !data.imageUrl) {
            return NextResponse.json({ error: "Full name and image URL are required" }, { status: 400 });
        }

        const serverTimestamp = firestore.FieldValue.serverTimestamp();
        const slug = `${generateSlug(data.fullName)}-${Date.now()}`;
        
        const newRequest = {
            ...data, 
            slug: slug,
            status: 'new',
            createdAt: serverTimestamp,
        };

        const docRef = await db.collection('school-lists').add(newRequest);
        
        const myWhatsAppNumber = "201220396597"; 
        const messageText = `مرحباً دار اللغات، لقد قمت برفع قائمة مدرستي عبر الموقع:\n\n👤 *الاسم:* ${data.fullName}\n📞 *الهاتف:* ${data.phone || 'غير محدد'}\n📍 *العنوان:* ${data.address || 'غير محدد'}\n🖼️ *رابط القائمة:* ${data.imageUrl}`;
        const whatsappUrl = `https://wa.me/${myWhatsAppNumber}?text=${encodeURIComponent(messageText)}`;

        return NextResponse.json({ 
            message: "Request submitted successfully, pending review.", 
            id: docRef.id,
            slug: slug,
            whatsappUrl: whatsappUrl
        }, { status: 201 });

    } catch (error: any) {
        console.error("[POST /api/school-list]", error);
        return NextResponse.json({ error: "An error occurred while submitting the request." }, { status: 500 });
    }
}

// PATCH method - تحديث حالة الطلبات للأدمن فقط
export async function PATCH(req: NextRequest) {
    try {
        const firebaseAuth = getAdminAuth();
        // 🎯 تم التعديل هنا لتحديث حالة الطلب للأدمن في القاعدة الموحدة الصحيحة
        const db = getSecondaryDb();     

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value; 
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id, status } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Request ID and new status are required' }, { status: 400 });
        }
        
        if (!['new', 'in-progress', 'completed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        const requestRef = db.collection('school-lists').doc(id);
        await requestRef.update({ status });

        return NextResponse.json({ message: `Request ${id} status updated to ${status}` });

    } catch (error: any) {
        console.error('[PATCH /api/school-list]', error);
        return NextResponse.json({ error: `Failed to update status: ${error.message}` }, { status: 500 });
    }
}
