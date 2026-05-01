import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore"; // Import the type

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    if (!db) {
        console.error('Firestore has not been initialized. Ensure service account is configured correctly.');
        return NextResponse.json(
            { error: 'Firestore not initialized on the server.' },
            { status: 500 }
        );
    }

    try {
        const categoriesCollection = db.collection("categories");
        const categoriesSnapshot = await categoriesCollection.orderBy("name", "asc").get();

        if (categoriesSnapshot.empty) {
            return NextResponse.json([]);
        }

        // Fix the TypeScript error by explicitly typing 'doc'
        const categories = categoriesSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(categories);

    } catch (error: any) {
        console.error("GET /api/categories Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
