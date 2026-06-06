import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App | null = null;

function initializeAdmin() {
  if (app) return;

  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
    return;
  }

  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;

  if (base64Sdk) {
    console.log("Attempting to initialize Firebase Admin SDK from Base64 secret...");
    try {
      // Decode the Base64 string to a JSON string
      const sdkJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');

      // Parse the JSON string into a service account object
      const serviceAccount = JSON.parse(sdkJson);

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });

      console.log("Firebase Admin SDK initialized successfully from Base64 secret.");
    } catch (error: any) {
      console.error("FATAL: Firebase Admin initialization from Base64 failed:", error);
      app = null;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Firebase Admin SDK critical boot failure from Base64: ${error?.message || error}`);
      }
    }
  } else {
    console.warn("WARNING: FIREBASE_ADMIN_SDK_BASE64 environment variable not found. Some features may not work.");
  }
}

initializeAdmin();

function ensureInitialized(): App {
  if (!app) {
    initializeAdmin();
    if (!app) {
      throw new Error("Firebase Admin SDK is not initialized. Check server logs for initialization errors.");
    }
  }
  return app;
}

export function getDb(): Firestore {
  const currentApp = ensureInitialized();
  return getFirestore(currentApp); 
}

export function getAuth(): Auth {
  const currentApp = ensureInitialized();
  return getAdminAuth(currentApp); 
}

export function getBucket(bucketName?: string) {
  const currentApp = ensureInitialized();
  const storage = getStorage(currentApp);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;
