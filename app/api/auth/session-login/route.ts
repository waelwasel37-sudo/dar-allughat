import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'waelwasel37@gmail.com';

export async function POST(req: NextRequest) {
    // First, check if the auth module was initialized correctly.
    if (!auth) {
        console.error('Firebase Admin SDK has not been initialized. Ensure service account is configured correctly.');
        return NextResponse.json(
            { error: 'Firebase Admin not initialized on the server.' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const idToken = body.idToken;

        if (!idToken) {
            return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
        }

        // Now that we've checked auth is not null, TypeScript is happy.
        const decodedToken = await auth.verifyIdToken(idToken);
        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid ID token.' }, { status: 401 });
        }

        const isAdmin = decodedToken.email === ADMIN_EMAIL;
        await auth.setCustomUserClaims(decodedToken.uid, { role: isAdmin ? 'admin' : 'user' });

        const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        const response = NextResponse.json({ status: 'success' });

        response.cookies.set({
            name: 'session',
            value: sessionCookie,
            maxAge: expiresIn,
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'lax',
        });

        return response;

    } catch (error: any) {
        console.error('Session Login Error:', error);
        return NextResponse.json(
            { 
                error: 'An internal server error occurred during session creation.',
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}
