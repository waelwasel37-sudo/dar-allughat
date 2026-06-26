import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let appInstance: App | undefined;

console.log('[Firebase Admin] Invoking Clean Cloud Initialization...');

try {
  if (getApps().length === 0) {
    // الحل السحري: تفعيل البيئة السحابية الافتراضية بدون الحاجة لـ privateKey يدوي
    appInstance = initializeApp({
      credential: admin.credential.applicationDefault(), // يسحب الصلاحيات تلقائياً من سيرفر جوجل الآمن
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
    console.log('[Firebase Admin] Initialization Success via Application Default Credentials.');
  } else {
    appInstance = getApp();
  }
} catch (error) {
  console.error('[Firebase Admin] CRITICAL INIT ERROR:', error);
  appInstance = getApps().length > 0 ? getApp() : initializeApp();
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