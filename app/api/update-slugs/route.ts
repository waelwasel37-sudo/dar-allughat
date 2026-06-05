
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateSlug } from "@/app/lib/utils";
import { getDb, getAuth } from "@/app/lib/firebase-admin";

export const dynamic = 'force-dynamic';

/**
 * API Route to update all products in the database that are missing a slug.
 * 
 * SECURITY:
 * This is a powerful, one-off maintenance endpoint. 
 * It is protected and can only be run by an authenticated admin user.
 * It iterates through all products, checks if a `slug` field is missing or empty,
 * generates a new unique slug from the product's name, and updates the document.
 */
export async function POST(req: Request) {
    const auth = getAuth();
    const db = getDb();

    try {
        // --- Admin Authentication Check ---
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("__session")?.value; // CORRECT COOKIE NAME

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized. No session cookie provided.' }, { status: 401 });
        }

        const decodedToken = await auth.verifySessionCookie(sessionCookie, true).catch(() => null);
        if (!decodedToken || decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. You must be an admin to perform this action.' }, { status: 403 });
        }

        // --- Main Logic: Find and Update Products ---
        console.log("Starting batch slug update process for admin:", decodedToken.email);
        const productsRef = db.collection('products');
        const snapshot = await productsRef.get();

        if (snapshot.empty) {
            return NextResponse.json({ message: "No products found to update." });
        }

        const batch = db.batch();
        let updatedCount = 0;

        for (const doc of snapshot.docs) {
            const product = doc.data();
            
            if (!product.slug) {
                const name = product.name;
                if (!name) {
                    console.warn(`Product with ID ${doc.id} has no name and no slug. Skipping.`);
                    continue;
                }

                const baseSlug = generateSlug(name);
                let newSlug = baseSlug;
                let counter = 1;

                while (true) {
                    const slugSnapshot = await productsRef.where('slug', '==', newSlug).get();
                    if (slugSnapshot.empty) {
                        break;
                    }
                    newSlug = `${baseSlug}-${counter}`;
                    counter++;
                }

                console.log(`Updating product: ${doc.id}, Name: \"${name}\", New Slug: \"${newSlug}\"`);
                batch.update(doc.ref, { slug: newSlug });
                updatedCount++;
            }
        }

        if (updatedCount === 0) {
            return NextResponse.json({ message: "Success. All products already have slugs." });
        }

        await batch.commit();

        return NextResponse.json({ 
            message: `Successfully updated ${updatedCount} products with new slugs.` 
        });

    } catch (error: any) {
        console.error("Error in /api/update-slugs:", error);
        return NextResponse.json({ 
            error: "An unexpected error occurred during the update process.",
            details: error.message 
        }, { status: 500 });
    }
}
