import { initializeApp, getApps, getApp, type App, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

// 🎯 الكود الذكي والموحد الذي يعمل في بيئة التطوير والنشر
function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      // فك التشفير عن ملف الـ JSON الكامل الذي يجلبه التطبيق من Google Cloud Secret Manager
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }
  
  // الخيار الاحتياطي الذكي لبيئة التطوير المحلية (Local Development)
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // معالجة الأسطر الجديدة للمفتاح بشكل حاسم
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  };
}

// 🔒 حماية تكرار التهيئة لضمان عدم انهيار خادم Next.js
let app: App;

if (getApps().length === 0) {
  const serviceAccount = getServiceAccount();
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.appspot.com`
  });
} else {
  app = getApp();
}

// 🚀 الدوال النظيفة والمصدرة بأمان لكافة ملفات متجرك
export function getAdminApp(): App {
  return app;
}

export function getAdminAuth(): Auth {
  return firebaseGetAuth(app);
}

export function getDb(): Firestore {
  return getFirestore(app);
}

export function getBucket() {
  return getStorage(app).bucket();
}