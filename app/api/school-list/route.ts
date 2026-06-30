import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// 🎯 تم تعديل الاستيراد لـ getAdminAuth ليتوافق مع تعديلات ملف الحماية ويمنع الـ Build Error
import { getDb, getAdminAuth, admin } from '@/app/lib/firebase-admin';
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
        const firebaseAuth = await getAdminAuth(); // 🔑 تم تعديل اسم الدالة والمتغير لمنع التعارض الحرج
        const db = await getDb();     

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value; 
        
        // 🎯 إذا كان الطلب قادم من الـ Header وبدون كوكيز، يتحقق السيرفر من الـ Authorization Header أيضاً
        let decodedToken: any = null;
        
        if (sessionCookie) {
            decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        } else {
            const authHeader = req.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split('Bearer ')[1];
                decodedToken = await firebaseAuth.verifyIdToken(token);
            }
        }

        if (!decodedToken || decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const requestsRef = db.collection('schoolListRequests');

        if (status === 'new') {
            const snapshot = await requestsRef.where('status', '==', 'new').get();
            return NextResponse.json({ count: snapshot.size });
        }

        const snapshot = await requestsRef.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return NextResponse.json([]);
        }

        const requests = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt || Date.now()).toISOString(),
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
        const db = await getDb(); 
        const data: Omit<SchoolListRequest, 'id' | 'createdAt' | 'status'> = await req.json();

        if (!data.fullName || !data.imageUrl) {
            return NextResponse.json({ error: "Full name and image URL are required" }, { status: 400 });
        }

        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const slug = `${generateSlug(data.fullName)}-${Date.now()}`;
        
        const newRequest = {
            fullName: data.fullName,
            slug: slug,
            phone: data.phone || null,
            address: data.address || null,
            imageUrl: data.imageUrl,
            imagePath: data.imagePath || null,
            status: 'new',
            createdAt: serverTimestamp,
        };

        const docRef = await db.collection('schoolListRequests').add(newRequest);
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
        const firebaseAuth = await getAdminAuth(); // 🔑 تعديل مصلح وآمن
        const db = await getDb();     

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

        const requestRef = db.collection('schoolListRequests').doc(id);
        await requestRef.update({ status });

        return NextResponse.json({ message: `Request ${id} status updated to ${status}` });

    } catch (error: any) {
        console.error('[PATCH /api/school-list]', error);
        return NextResponse.json({ error: `Failed to update status: ${error.message}` }, { status: 500 });
    }
}
