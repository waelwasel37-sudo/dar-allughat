import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App;

if (getApps().length === 0) {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;

  if (base64Sdk) {
    // 💻 Local development environment
    try {
      const sdkJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(sdkJson);

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
      console.log("Firebase Admin SDK initialized successfully from Base64 for local dev.");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK from Base64. Ensure FIREBASE_ADMIN_SDK_BASE64 is set correctly.", error);
      app = initializeApp({
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
    }
  } else {
    // 🚀 Deployed environment (App Hosting)
    // serviceAccountId is explicitly set to sign session cookies.
    app = initializeApp({
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      serviceAccountId: "firebase-app-hosting-compute@dar-allughat-97483992-fc6c5.iam.gserviceaccount.com",
    });
    console.log("Firebase Admin SDK initialized for deployed environment with serviceAccountId.");
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