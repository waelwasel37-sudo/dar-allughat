import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// 🎯 تصحيح: استيراد الدوال المحدثة
import { getAdminAuth, getBucket } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // 🎯 تصحيح: استخدام الدوال المحدثة مع await وأسماء متغيرات آمنة
    const firebaseAuth = await getAdminAuth();
    const bucket = await getBucket();

    try {
        // 1. التحقق من صلاحيات المستخدم (Admin Check)
        // 🎯 تصحيح: التأكد من استخدام await مع cookies() كما اتفقنا
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized: No session cookie found.' }, { status: 401 });
        }
        
        const decodedToken = await firebaseAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: User is not an admin.' }, { status: 403 });
        }

        // 2. استخراج الملف من الطلب
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'Bad Request: No file provided.' }, { status: 400 });
        }

        // 3. تجهيز الملف للرفع
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`; // استبدال المسافات
        const blob = bucket.file(`products/${fileName}`);
        
        // 4. استخدام Stream لرفع الملف إلى Google Cloud Storage
        const blobStream = blob.createWriteStream({
            metadata: { 
                contentType: file.type,
                cacheControl: 'public, max-age=31536000, immutable',
            }
        });

        const imageUrl = await new Promise<string>((resolve, reject) => {
            blobStream.on('error', (err) => {
                console.error("Blob Stream Error:", err);
                reject('Failed to upload file.');
            });

            blobStream.on('finish', async () => {
                try {
                    await blob.makePublic();
                    const publicUrl = blob.publicUrl();
                    resolve(publicUrl);
                } catch (error) {
                    console.error("Error making file public or getting URL:", error);
                    reject('Failed to process file after upload.');
                }
            });

            blobStream.end(buffer);
        });

        // 5. إعادة الرابط والمسار للواجهة الأمامية
        return NextResponse.json({ imageUrl, imagePath: `products/${fileName}` });

    } catch (error: any) {
        console.error("[API/UPLOAD] Error:", error.message);
        if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/invalid-session-cookie') {
            return NextResponse.json({ error: 'Unauthorized: Session expired or invalid.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}