
import { NextRequest, NextResponse } from 'next/server';
import admin, { db, auth } from '@/app/lib/firebase-admin';
import { cookies } from 'next/headers';
import { SchoolListRequest } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

// GET endpoint for admin to view requests and get counts
export async function GET(req: NextRequest) {
    if (!auth || !db) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as SchoolListRequest;
        });

        return NextResponse.json(requests);

    } catch (error: any) {
        console.error('[GET /api/school-list]', error);
        return NextResponse.json({ error: `Failed to fetch requests: ${error.message}` }, { status: 500 });
    }
}

// POST endpoint for PUBLIC new requests
export async function POST(req: NextRequest) {
    if (!db || !admin) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const data: Omit<SchoolListRequest, 'id' | 'createdAt' | 'status'> = await req.json();

        if (!data.fullName || !data.imageUrl) {
            return NextResponse.json({ error: "Full name and image URL are required" }, { status: 400 });
        }

        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        
        const newRequest = {
            fullName: data.fullName,
            phone: data.phone || null,
            address: data.address || null,
            imageUrl: data.imageUrl,
            imagePath: data.imagePath || null,
            status: 'new',
            createdAt: serverTimestamp,
        };

        const docRef = await db.collection('schoolListRequests').add(newRequest);

        return NextResponse.json({ 
            message: "Request submitted successfully, pending review.", 
            id: docRef.id 
        }, { status: 201 });

    } catch (error: any) {
        console.error("[POST /api/school-list]", error);
        return NextResponse.json({ error: "An error occurred while submitting the request." }, { status: 500 });
    }
}

// PATCH endpoint for admin to update request status
export async function PATCH(req: NextRequest) {
    if (!auth || !db) {
        console.error('Firebase Admin SDK not initialized');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
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
