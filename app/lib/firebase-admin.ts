import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

// استيراد مباشر لملف Service Account بالاسم الصحيح الحقيقي المتواجد بمشروعك
import serviceAccount from '../../../dar-allughat-97483992-fc6c5-0bf7cef38dad.json';

let app: App;

if (getApps().length === 0) {
  try {
    app = initializeApp({
      credential: adminInstance.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log('[Firebase Admin] Initialized successfully using the correct service account file.');
  } catch (error: any) {
    console.error('[Firebase Admin Fatal Error]: Failed to initialize.', error.message);
    initializeApp();
    app = getApp();
  }
} else {
  app = getApp();
}

// تصدير دوال getter لضمان الحصول على النسخة المهيأة دائمًا
export const getDb = (): Firestore => getFirestore(app);
export const getAuth = (): Auth => getAdminAuth(app);
export const getBucket = () => getAdminStorage(app).bucket();

export const admin = adminInstance;

// التصدير الافتراضي المحدث بالاستدعاء الفوري لتوافقه ككائنات مباشرة مع ملفات APIs والـ Slugs
const adminDefaultExport = {
  apps: getApps(),
  app: () => app,
  firestore: getDb(), // تنفيذ فوري لجلب الكائن
  auth: getAuth(),     // تنفيذ فوري لتشغيل revokeRefreshTokens مباشرة بالسيرفر
  storage: getAdminStorage, 
  ...adminInstance
};

export default adminDefaultExport;