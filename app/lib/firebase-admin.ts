import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    // 1. حماية البناء: للتأكد من أن النص هو JSON سليم قبل محاولة قراءته
    if (serviceAccountJSON && serviceAccountJSON.trim().startsWith('{')) {
      const serviceAccount = JSON.parse(serviceAccountJSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "dar-allughat-97483992-fc6c5.firebasestorage.app"
      });
      console.log('✅ Firebase Admin initialized with Service Account.');
    } else {
      // 2. حماية التشغيل: تحديد الـ Project ID صراحة لمنع خطأ 500 على السيرفر
      admin.initializeApp({
        projectId: "dar-allughat-97483992-fc6c5",
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app"
      });
      console.log('✅ Firebase Admin initialized with explicit Default credentials.');
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin Init Error:', error.message);
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: "dar-allughat-97483992-fc6c5"
      });
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = admin.storage().bucket();

export default admin;