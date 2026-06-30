import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase-admin/auth'; // 🎯 تم تعديل الاسم هنا لمنع التعارض
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'dar-allughat-97483992-fc6c5', // ✅ خيار احتياطي آمن للمشروع الحالي
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // 🎯 ضمان معالجة محرف السطر الجديد بشكل صحيح من متغيرات البيئة
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// 💡 دالة التهيئة القابلة للتصدير والاستدعاء عند الحاجة
export const initializeAdminApp = async (): Promise<App> => {
  if (getApps().length > 0) {
    return getApp();
  }
  try {
    const app = initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log('[Firebase Admin] Initialized successfully.');
    return app;
  } catch (error: any) {
    console.error('[Firebase Admin Fatal Error] Failed to initialize:', error.message);
    if (!getApps().length) {
      initializeApp();
    }
    return getApp();
  }
};

// الدوال المساعدة التي تضمن التهيئة قبل الاستخدام
export const getDb = async (): Promise<Firestore> => {
  const app = await initializeAdminApp();
  return getFirestore(app);
};

export const getAdminAuth = async (): Promise<Auth> => { // 🎯 تم تغيير اسم الدالة هنا لـ getAdminAuth لمنع تكرار المعرف البرمجي
  const app = await initializeAdminApp();
  return firebaseGetAuth(app);
};

export const getBucket = async () => {
    const app = await initializeAdminApp();
    return getStorage(app).bucket();
};

// تصدير النسخة الأصلية من firebase-admin إذا لزم الأمر
export { admin };