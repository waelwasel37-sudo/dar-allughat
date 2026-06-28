import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

let app: App;

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim());
      
      app = initializeApp({
        credential: adminInstance.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('[Firebase Admin] Initialized with Unified JSON.');
    } catch (parseError: any) {
      console.error('[Firebase Admin Fatal]:', parseError.message);
      initializeApp();
      app = getApp();
    }
  } else {
    initializeApp();
    app = getApp();
  }
} else {
  app = getApp();
}

// 🎯 التصدير القياسي الصافي لحل أزمة instanceof وعودة المنتجات والأقسام فوراً
export const db = getFirestore(app);
export const auth = getAdminAuth(app);
export const storage = getAdminStorage(app);

export const getDb = () => db;
export const getAuth = () => auth;
export const getBucket = () => storage.bucket();

const adminDefaultExport = {
  apps: getApps(),
  app: () => app,
  firestore: () => db,
  auth: () => auth,
  storage: () => storage,
  ...adminInstance
};

export default adminDefaultExport;