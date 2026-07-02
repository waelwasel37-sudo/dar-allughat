import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const db = await getDb(); // 🎯 تأكد من وجود كلمة await قبل getDb

    try {
        const categoriesCollection = db.collection("categories");
        const categoriesSnapshot = await categoriesCollection.orderBy("name", "asc").get();

        if (categoriesSnapshot.empty) {
            return NextResponse.json([]);
        }

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
