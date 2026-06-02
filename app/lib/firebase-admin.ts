
import * as admin from 'firebase-admin';

// لا تقم بتعريف اسم الدلو كقيمة ثابتة هنا.
// const BUCKET_NAME = "dar-allughat-97483992-fc6c5.firebasestorage.app";

if (!admin.apps.length) {
    // اسم الدلو سيتم قراءته من متغيرات البيئة التي تم إعدادها في App Hosting.
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    
    console.log("Initializing Firebase Admin with Application Default Credentials.");
    console.log(`Using storage bucket: ${storageBucket}`);

    if (!storageBucket) {
        console.error("FIREBASE_STORAGE_BUCKET environment variable is not set. Server-side storage operations will fail.");
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        // استخدم المتغير الديناميكي هنا
        storageBucket: storageBucket,
    });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
// استخدم نفس المتغير الديناميكي هنا أيضًا لضمان الاتساق
export const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
export default admin;
