import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App | undefined;
let auth: Auth | undefined;

console.log('[Firebase Admin] Adaptive JSON Initialization...');

try {
  if (getApps().length === 0) {
    const rawSecret = process.env.FIREBASE_PRIVATE_KEY || process.env.SERVER_FB_PRIVATE_KEY;

    if (!rawSecret) {
      throw new Error('CRITICAL: FIREBASE_PRIVATE_KEY is missing.');
    }

    let credentialConfig: any;
    const trimmedSecret = rawSecret.trim();

    if (trimmedSecret.startsWith('{')) {
      console.log('[Firebase Admin] Full Service Account JSON parsed.');
      const serviceAccount = JSON.parse(trimmedSecret);
      credentialConfig = admin.credential.cert(serviceAccount);
    } else {
      console.log('[Firebase Admin] Using Application Default Credentials fallback.');
      credentialConfig = admin.credential.applicationDefault();
    }

    initializeApp({
      credential: credentialConfig,
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
    
    console.log('[Firebase Admin] SUCCESS! Initialized cleanly.');
  } else {
    app = getApp();
  }
  
  auth = getAdminAuth(app || getApp());

} catch (error) {
  console.error('[Firebase Admin] FATAL INITIALIZATION ERROR:', error);
}

export function getDb(): Firestore {
  const currentApp = app || getApp();
  if (!currentApp) throw new Error("App not initialized.");
  return getFirestore(currentApp);
}

export function getAuth(): Auth {
  const currentAuth = auth || getAdminAuth(app || getApp());
  if (!currentAuth) throw new Error("Auth not initialized.");
  return currentAuth;
}

export function getBucket(bucketName?: string) {
  const currentApp = app || getApp();
  if (!currentApp) throw new Error("App not initialized.");
  const storage = getStorage(currentApp);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;