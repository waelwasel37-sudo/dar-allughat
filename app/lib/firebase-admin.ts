import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let appInstance: App | undefined;
let authInstance: Auth | undefined;

console.log('[Firebase Admin] Invoking Clean Cloud Initialization...');

try {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.SERVER_FB_PROJECT_ID || "dar-allughat-97483992-fc6c5";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.SERVER_FB_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.SERVER_FB_PRIVATE_KEY;

    if (privateKey) {
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1).trim();
      }
    }

    appInstance = initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
    console.log('[Firebase Admin] Initialization Success with Clean Cloud Version 4 Cert.');
  } else {
    appInstance = getApp();
  }
  
  if (appInstance) {
    authInstance = getAdminAuth(appInstance);
  }

} catch (error) {
  console.error('[Firebase Admin] CRITICAL INIT ERROR:', error);
  appInstance = getApps().length > 0 ? getApp() : initializeApp();
  authInstance = getAdminAuth(appInstance);
}

export function getDb(): Firestore {
  const currentApp = getApps().length > 0 ? getApp() : appInstance;
  if (!currentApp) throw new Error("Firebase app instance is missing.");
  return getFirestore(currentApp);
}

export function getAuth(): Auth {
  const currentApp = getApps().length > 0 ? getApp() : appInstance;
  if (!currentApp) throw new Error("Firebase app instance is missing.");
  return getAdminAuth(currentApp);
}

export function getBucket(bucketName?: string) {
  const currentApp = getApps().length > 0 ? getApp() : appInstance;
  if (!currentApp) throw new Error("Firebase app instance is missing.");
  const storage = getStorage(currentApp);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export { admin };
export default admin;