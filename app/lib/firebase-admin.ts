import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJSON) {
      // استخدام المفاتيح إذا كانت متوفرة (للتشغيل المحلي والـ Build)
      const serviceAccount = JSON.parse(serviceAccountJSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "dar-allughat-97483992-fc6c5.firebasestorage.app"
      });
      console.log('✅ Firebase Admin initialized with Service Account.');
    } else {
      // الاعتماد على صلاحيات السيرفر التلقائية (أثناء التشغيل الفعلي على Firebase)
      admin.initializeApp();
      console.log('✅ Firebase Admin initialized with default credentials.');
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin Init Error:', error.message);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = admin.storage().bucket();

export default admin;