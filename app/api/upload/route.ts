
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, bucket } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // First, check if the auth and bucket modules were initialized correctly.
    if (!auth || !bucket) {
        console.error('Firebase Admin SDK has not been initialized. Ensure service account is configured correctly.');
        return NextResponse.json(
            { error: 'Firebase Admin not initialized on the server.' },
            { status: 500 }
        );
    }

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const postId = formData.get('postId') as string;

        if (!file || !postId) {
            return NextResponse.json({ error: 'File and Post ID are required.' }, { status: 400 });
        }
        
        const filePath = `posts/${postId}/${Date.now()}_${file.name}`;
        const bucketFile = bucket.file(filePath);

        const fileBuffer = Buffer.from(await file.arrayBuffer());

        await bucketFile.save(fileBuffer, {
            metadata: {
                contentType: file.type,
                cacheControl: 'public, max-age=31536000, immutable',
            },
        });

        await bucketFile.makePublic();
        const publicUrl = bucketFile.publicUrl();

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('[API/UPLOAD] Error:', error);
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
}
