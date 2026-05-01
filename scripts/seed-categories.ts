// scripts/seed-categories.ts
import { getDb, admin } from '@/app/lib/firebase-admin';

// The exact list of categories provided and corrected by the user.
const categoriesToSeed = [
    { name: 'كتب خارجيه', emoji: '📘' },
    { name: 'كتب مدرسيه', emoji: '🏫' },
    { name: 'كتب مرتجع', emoji: '♻️' },
    { name: 'كتب ازهرى', emoji: '🕌' },
    { name: 'كتب مستوى رفيع لغات', emoji: '🌐' },
    { name: 'كتب تأسيس اطفال', emoji: '🖍️' },
    { name: 'كتب تنمية مهارات اطفال', emoji: '🧠' },
    { name: 'قصص اطفال', emoji: '🧸' },
    { name: 'العاب تنمية مهارات اطفال مونتيسوري', emoji: '🧩' }, // Corrected name
    { name: 'ادوات مكتبيه ومدرسيه', emoji: '✏️' }
];

async function seedCategories() {
    console.log('Starting to seed categories with the correct, updated list...');
    const db = getDb();
    const batch = db.batch();
    const categoriesCollection = db.collection('categories');

    let count = 0;
    for (const cat of categoriesToSeed) {
        // Create a unique, URL-friendly slug from the name
        const slug = cat.name.trim().toLowerCase().replace(/[\s_.,;:'\"()[\]{}]+/g, '-').replace(/--+/g, '-').replace(/[^\w\d\-\u0600-\u06FF]/g, '').replace(/^-+|-+$/g, '');
        const docRef = categoriesCollection.doc(slug);

        // Set the data for the category
        batch.set(docRef, {
            name: cat.name,
            emoji: cat.emoji,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
        console.log(`Prepared category for batch: ${cat.name}`);
    }

    try {
        await batch.commit();
        console.log(`✅ Successfully committed ${count} categories to the database.`);
    } catch (error) {
        console.error('❌ Error committing batch:', error);
        process.exit(1); // Exit with an error code
    }

    console.log('Seeding finished successfully.');
    // We don't call process.exit() in a server environment script like this
}

// We will call this function using a specific script command, not by running the file directly.
// This ensures better control over its execution.
if (require.main === module) {
    seedCategories().catch(error => {
        console.error('Seeding script failed:', error);
        process.exit(1);
    });
}

// Export the function in case we want to use it programmatically elsewhere (optional)
export default seedCategories;
