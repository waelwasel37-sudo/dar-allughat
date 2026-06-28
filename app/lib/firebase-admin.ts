import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

let app: App;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY; 

// 🛡️ حبل الإنقاذ للتشغيل أونلاين: تحويل الرموز النصية لأسطر حقيقية لتجنب خطأ الـ DECODER
if (privateKey) {
  // إزالة أي علامات اقتباس مزدوجة قد تفرضها المنصة أونلاين
  privateKey = privateKey.trim().replace(/^[\"']|[\"']$/g, '');
  
  // تحويل الـ \n النصية لأسطر برمجية حقيقية ليفك التشفير بنجاح أونلاين
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
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

// 🚀 مصفوفة التوافق الرجعي المكتملة والمثالية التي أصلحت الـ APIs والـ Upload
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