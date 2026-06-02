
import * as admin from 'firebase-admin';

const BUCKET_NAME = "dar-allughat-97483992-fc6c5.firebasestorage.app";

if (!admin.apps.length) {
    // عند النشر على بيئة جوجل السحابية (مثل App Hosting)،
    // يجد SDK بيانات الاعتماد تلقائيًا من البيئة.
    // هذه هي الطريقة الأكثر أمانًا وموثوقية.
    console.log("Initializing Firebase Admin with Application Default Credentials.");
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: BUCKET_NAME,
    });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = admin.storage().bucket(BUCKET_NAME);
export default admin;
