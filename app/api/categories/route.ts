import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const db = await getDb(); 
        
        const categoriesCollection = db.collection("categories");
        const categoriesSnapshot = await categoriesCollection.orderBy("name", "asc").get();

        if (categoriesSnapshot.empty) {
            return NextResponse.json({ debug_status: "collection_is_empty_or_not_found", data: [] });
        }

        const categories = categoriesSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(categories);

    } catch (error: any) {
        console.error("CRITICAL GET /api/categories Error:", error);
        
        return NextResponse.json(
            { 
              status: "server_error_unveiled", 
              error_message: error.message || "Unknown error message", 
              error_code: error.code || "no_code_provided",
              error_stack: error.stack || "no_stack_provided",
              hint: "Check if Firebase Service Account JSON or credentials match the correct Firestore database instance."
            },
            { status: 500 }
        );
    }
}