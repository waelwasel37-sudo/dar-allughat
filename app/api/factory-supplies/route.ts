import { NextRequest, NextResponse } from "next/server";
import { getSecondaryDb } from "@/app/lib/firebase-admin";
import admin from 'firebase-admin';

export const dynamic = "force-dynamic";

// POST a new factory supply request
export async function POST(req: NextRequest) {
    try {
        const db = await getSecondaryDb();
        const supplyData = await req.json();

        // Basic validation
        if (!supplyData.companyName || !supplyData.contactPerson || !supplyData.phone || !supplyData.requiredItems) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const suppliesRef = db.collection('factory-supplies'); // 🎯 Using the correct plural collection name

        const docRef = await suppliesRef.add({
            ...supplyData,
            status: 'new', // Set default status
            createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
        });

        return NextResponse.json({ message: "Supply request created successfully", id: docRef.id }, { status: 201 });

    } catch (error: any) {
        console.error("POST /api/factory-supplies Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

// GET all factory supply requests
export async function GET(req: NextRequest) {
    try {
        const db = await getSecondaryDb();
        const suppliesCollection = db.collection("factory-supplies");
        const suppliesSnapshot = await suppliesCollection.orderBy("createdAt", "desc").get();
        
        if (suppliesSnapshot.empty) {
            return NextResponse.json([]);
        }
        
        const supplies = suppliesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt instanceof admin.firestore.Timestamp 
                    ? data.createdAt.toDate().toISOString() 
                    : new Date(data.createdAt || Date.now()).toISOString(),
            };
        });

        return NextResponse.json(supplies);

    } catch (error: any) {
        console.error("GET /api/factory-supplies Error:", error);
        return NextResponse.json({ status: "server_error", error_message: error.message }, { status: 500 });
    }
}
