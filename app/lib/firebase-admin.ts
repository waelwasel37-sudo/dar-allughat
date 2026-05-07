import * as admin from 'firebase-admin';

const projectId = process.env.PROJECT_ID || "dar-allughat-97483992-fc6c5";

if (!admin.apps.length) {
  try {
    const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJSON && serviceAccountJSON.trim().startsWith('{')) {
      const serviceAccount = JSON.parse(serviceAccountJSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\n/g, '
');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
      });
      console.log('✅ Firebase Admin initialized with Service Account.');
    } else {
      // الاعتماد الكامل على هوية المشروع والمتغير السحابي الموثق
      admin.initializeApp({
        projectId: projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
      });
      console.log(`✅ Firebase Admin initialized with Project ID: ${projectId}`);
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin Init Error:', error.message);
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId: projectId });
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = admin.storage().bucket();

export default admin;