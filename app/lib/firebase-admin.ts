import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App | undefined;
let auth: Auth | undefined;

console.log('[Firebase Admin] Final Adaptive Cloud-Native Initialization...');

try {
  if (getApps().length === 0) {
    const rawSecret = process.env.FIREBASE_PRIVATE_KEY || process.env.SERVER_FB_PRIVATE_KEY;
    const projectId = process.env.SERVER_FB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "dar-allughat-97483992-fc6c5";
    const clientEmail = process.env.SERVER_FB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

    if (!rawSecret) {
      throw new Error('CRITICAL: FIREBASE_PRIVATE_KEY environment variable is missing.');
    }

    let credentialConfig: any;

    // الفحص الذكي: إذا كان النص يبدأ بقوس JSON، نقوم بتحليله كملف كامل مثل خطتك
    if (rawSecret.trim().startsWith('{')) {
      console.log('[Firebase Admin] Full Service Account JSON structure detected.');
      const serviceAccount = JSON.parse(rawSecret.trim());
      credentialConfig = admin.credential.cert(serviceAccount);
    } else {
      // إذا كان النص هو سطر المفتاح الخاص الصافي فقط
      console.log('[Firebase Admin] Individual Private Key string detected.');
      let cleanKey = rawSecret.trim();
      if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }
      cleanKey = cleanKey.replace(/\n/g, '
');

      credentialConfig = admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: cleanKey,
      });
    }

    initializeApp({
      credential: credentialConfig,
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
    
    console.log('[Firebase Admin] SUCCESS! Initialized with adaptive configuration.');
  } else {
    console.log('[Firebase Admin] Existing app found.');
  }
  
  app = getApp();
  auth = getAdminAuth(app);

} catch (error) {
  console.error('[Firebase Admin] FATAL INITIALIZATION ERROR:', error);
}

export function getDb(): Firestore {
  if (!app) throw new Error("Firebase Admin App not initialized.");
  return getFirestore(app);
}

export function getAuth(): Auth {
  if (!auth) throw new Error("Firebase Admin Auth not initialized.");
  return auth;
}

export function getBucket(bucketName?: string) {
  if (!app) throw new Error("Firebase Admin App not initialized.");
  const storage = getStorage(app);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;