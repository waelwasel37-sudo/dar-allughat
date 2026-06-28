import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

let app: App;

const projectId = process.env.SERVER_FB_PROJECT_ID;
const clientEmail = process.env.SERVER_FB_CLIENT_EMAIL;
let privateKey = process.env.SERVER_FB_PRIVATE_KEY;

// 🎯 التطهير الحاسم والنهائي لـ Private Key لكسر الدائرة المغلقة للأبد
if (privateKey) {
  privateKey = privateKey.trim()
    .replace(/^["']|["']$/g, '')              // إزالة علامات الاقتباس الخارجية إن وجدت
    .replace(/\\n/g, '\n')                     // تحويل أسطر \n النصية إلى أسطر حقيقية
    .replace(/\\/g, '');                       // مسح أي علامات مائلة زائدة (Backslashes) تخرب التشفير
}

if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: adminInstance.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log('[Firebase Admin] Initialized successfully with Service Account.');
  } else {
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

export const getDb = () => db;
export const getAuth = () => auth;
export const getBucket = () => storage.bucket(); 

const adminDefaultExport = {
  ...adminInstance,
  apps: getApps(),
  app: () => app,
  firestore: () => db,
  auth: () => auth,
  storage: () => storage
};

export default adminDefaultExport;