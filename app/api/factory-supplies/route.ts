
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase-client'; // Using the client-side initialized db for simplicity

export const dynamic = 'force-dynamic';

// Define the interface for the factory supply data
interface FactorySupply {
    id: string;
    companyName?: string;
    contactPerson?: string;
    phone: string;
    requiredItems?: string;
    status: 'new' | 'approved' | 'in-progress';
    createdAt: any;
}

// GET all factory supply requests
export async function GET(req: NextRequest) {
    try {
        const suppliesCollection = collection(db, 'factory-supplies');
        const q = query(suppliesCollection, orderBy('createdAt', 'desc'));
        const suppliesSnapshot = await getDocs(q);

        if (suppliesSnapshot.empty) {
            return NextResponse.json([]);
        }

        const supplies = suppliesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure createdAt is a serializable format
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            };
        }) as FactorySupply[];

        return NextResponse.json(supplies);

    } catch (error: any) {
        console.error("GET /api/factory-supplies Error:", error);
        return NextResponse.json({ error: 'Failed to fetch factory supplies' }, { status: 500 });
    }
}
