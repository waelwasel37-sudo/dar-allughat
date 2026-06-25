import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App | undefined;
let auth: Auth | undefined;

console.log('[Firebase Admin] Starting Base64 Decoding Initialization...');

try {
  if (getApps().length === 0) {
    const projectId = process.env.SERVER_FB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "dar-allughat-97483992-fc6c5";
    const clientEmail = process.env.SERVER_FB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.SERVER_FB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      // تنظيف علامات التنصيص الزائدة إن وجدت
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }

      // خطوة السحر: إذا كان المفتاح لا يبدأ بالصيغة التقليدية، فإنه مشفر بـ Base64 ونقوم بفكه فورا
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('[Firebase Admin] Base64 encoded key detected. Decoding now...');
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      }

      // إصلاح أسطر المفتاح بعد الفك لضمان قراءته في السيرفر السحابي
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
    console.log('[Firebase Admin] Successfully initialized with decoded private key!');
  } else {
    console.log('[Firebase Admin] Existing app found.');
  }
  
  app = getApp();
  auth = getAdminAuth(app);

} catch (error) {
  console.error('[Firebase Admin] CRITICAL INITIALIZATION ERROR:', error);
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