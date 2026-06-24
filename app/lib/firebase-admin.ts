import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

// تأمين تهيئة التطبيق كـ Singleton آمن للـ SSR
if (getApps().length === 0) {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;

  if (base64Sdk) {
    // 💻 Local development environment
    try {
      const sdkJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(sdkJson);

      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
      console.log("Firebase Admin SDK initialized successfully from Base64 for local dev.");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK from Base64. Ensure FIREBASE_ADMIN_SDK_BASE64 is set correctly.", error);
      initializeApp({
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
    }
  } else {
    // 🚀 Deployed environment (App Hosting)
    initializeApp({
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      serviceAccountId: "firebase-app-hosting-compute@dar-allughat-97483992-fc6c5.iam.gserviceaccount.com",
    });
    console.log("Firebase Admin SDK initialized for deployed environment with serviceAccountId.");
  }
}

// جلب الـ Instance الحالي المضمون دائماً من الـ SDK مباشرة لمنع كسر الـ Context
const currentApp = getApp();

export function getDb(): Firestore {
  return getFirestore(currentApp);
}

export function getAuth(): Auth {
  return getAdminAuth(currentApp);
}

export function getBucket(bucketName?: string) {
  const storage = getStorage(currentApp);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;