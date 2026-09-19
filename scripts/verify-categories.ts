import { getDb } from '../app/lib/firebase-admin';

async function verifyCategories() {
  console.log('⏳ Starting category verification...');
  try {
    const db = getDb();
    console.log('✅ Firebase Admin SDK initialized and database object retrieved.');

    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();

    if (snapshot.empty) {
      console.error('❌ Verification Result: The "categories" collection is EMPTY.');
      return;
    }

    let count = 0;
    console.log('✔️ Verification Result: Found the following categories:');
    snapshot.forEach(doc => {
      count++;
      const data = doc.data();
      console.log(`  - Name: ${data.name}, Slug: ${data.slug}`);
    });
    console.log(`
Total categories found: ${count}`);

  } catch (error) {
    console.error('🔥 An error occurred during verification:', error);
    process.exit(1);
  }
}

verifyCategories();
