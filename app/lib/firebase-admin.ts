import * as admin from 'firebase-admin';

// This function ensures Firebase Admin is initialized only once.
const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // 💡 صمام الأمان لمنع انهيار الـ Build في أول 54 ثانية
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("Auth: Build-time detected. Skipping Firebase Admin initialization.");
    return null;
  }

  console.log("Auth: Run-time detected. Initializing Firebase Admin SDK.");
  try {
    const cleanBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim().replace(/\s/g, '');
    const decodedServiceAccount = Buffer.from(cleanBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decodedServiceAccount);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("FATAL: Firebase Admin initialization failed at run-time.", error);
    throw new Error("Could not initialize Firebase Admin SDK at runtime.");
  }
};

// Initialize immediately if credentials exist
initializeAdmin();

// 💡 الدوال الذكية التي قمت بابتكارها
export const getDb = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.firestore();
};

export const getAuth = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.auth();
};

export const getStorage = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.storage();
};

export const getBucket = () => {
  if (!admin.apps.length) initializeAdmin();
  return admin.storage().bucket();
};

// 💡 خطوة التوافق الحيوية: تصدير المتغيرات الثابتة القديمة عبر جلبها من الدوال لكي لا تنهار ملفات البيانات الأخرى
export const db = admin.apps.length ? admin.firestore() : null as any;
export const auth = admin.apps.length ? admin.auth() : null as any;
export const storage = admin.apps.length ? admin.storage() : null as any;
export const bucket = admin.apps.length ? admin.storage().bucket() : null as any;

export default admin;
