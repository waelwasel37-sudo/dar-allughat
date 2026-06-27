import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

// 🎯 المتغير العالمي لتخزين نسخة التطبيق المبدئية
let app: App;

// قراءة المتغيرات الأساسية من السيرفر أونلاين
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.SERVER_FB_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.SERVER_FB_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.SERVER_FB_PRIVATE_KEY;

// 🛡️ معالجة المفتاح الخاص بشكل صحيح وآمن لمنع الـ 500 أونلاين
if (privateKey) {
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // تحويل النص إلى أسطر برمجية حقيقية ليفك التشفير بنجاح
  privateKey = privateKey.replace(/\n/g, '\n');
}

if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: adminInstance.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
    });
    console.log('[Firebase Admin] Initialized successfully with Service Account.');
  } else {
    initializeApp();
    app = getApp();
    console.log('[Firebase Admin] Initialized successfully with Application Default Credentials.');
  }
} else {
  app = getApp();
}

// 1️⃣ التصدير القياسي الحديث للملفات المحدثة
const db: Firestore = getFirestore(app);
const auth: Auth = getAdminAuth(app);
const storage = getAdminStorage(app);

export { db, auth, storage, adminInstance as admin };

// 2️⃣ 🚀 حبل الإنقاذ الحاسم: إعادة تصدير الدوال القديمة لتتوافق مع الـ 13 ملفاً الأخرى فوراً
export const getDb = () => db;
export const getAuth = () => auth;
export const getStorage = () => storage;

// 3️⃣ ⚡ تلبية الـ Default Export لحماية ملف الـ posts وملفات معالجة المنتجات والـ Slugs
const adminDefaultExport = {
  ...adminInstance,
  apps: getApps(),
  app: () => app,
  firestore: () => db,
  auth: () => auth,
  storage: () => storage
};

export default adminDefaultExport;