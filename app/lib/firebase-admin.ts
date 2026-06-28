import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

let app: App;

if (getApps().length === 0) {
  // 💡 الحل الموحد والأكثر أمانًا: استخدام كائن JSON الكامل من الأسرار
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      // 🎯 تحويل نص الـ JSON السحابي الموحد القادم من الخزنة إلى كائن كامل جاهز
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      
      app = initializeApp({
        credential: adminInstance.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('[Firebase Admin] Initialized successfully with Unified Service Account JSON.');
    } catch (parseError: any) {
      console.error('[Firebase Admin FATAL] Failed to parse Service Account JSON:', parseError.message);
      // Fallback to default credentials if parsing fails
      initializeApp();
      app = getApp();
    }
  } else {
    // Fallback for local development or other environments
    console.log('[Firebase Admin] Initializing with Application Default Credentials.');
    initializeApp();
    app = getApp();
  }
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAdminAuth(app);
const storage = getAdminStorage(app);

export { db, auth, storage, adminInstance as admin };

// 🚀 Compatibility exports
export const getDb = () => db;
export const getAuth = () => auth;
export const getBucket = () => storage.bucket(); 

// Default export for convenience
const adminDefaultExport = {
  ...adminInstance,
  apps: getApps(),
  app: () => app,
  firestore: () => db,
  auth: () => auth,
  storage: () => storage
};

export default adminDefaultExport;
