import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App;

if (getApps().length === 0) {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;

  // 🚀 التفعيل التلقائي الآمن المتكامل مع الـ API لمنع خطأ 500
  if (!base64Sdk) {
    console.log("Initializing Firebase Admin SDK using specific Service Account ID...");
    app = initializeApp({
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      serviceAccountId: "firebase-app-hosting-compute@dar-allughat-97483992-fc6c5.iam.gserviceaccount.com"
    });
  } else {
    // 💻 بيئة التطوير المحلية في جهازك
    try {
      const sdkJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(sdkJson);

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
      console.log("Firebase Admin SDK initialized successfully from Base64.");
    } catch (error: any) {
      console.warn("Base64 decoding failed, falling back to specific Service Account ID...");
      app = initializeApp({
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
        serviceAccountId: "firebase-app-hosting-compute@dar-allughat-97483992-fc6c5.iam.gserviceaccount.com"
      });
    }
  }
} else {
  app = getApps()[0];
}

export function getDb(): Firestore {
  return getFirestore(app);
}

export function getAuth(): Auth {
  return getAdminAuth(app);
}

export function getBucket(bucketName?: string) {
  const storage = getStorage(app);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;