import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

// تأمين تهيئة التطبيق كـ Singleton آمن لبيئة الـ SSR في Firebase App Hosting
if (getApps().length === 0) {
  // قراءة المتغيرات مباشرة من ملف apphosting.yaml
  const pKey = process.env.SERVER_FB_PRIVATE_KEY;
  
  const serviceAccount = {
    projectId: process.env.SERVER_FB_PROJECT_ID,
    clientEmail: process.env.SERVER_FB_CLIENT_EMAIL,
    // معالجة الـ \n البرمجية لفك تشفير المفتاح بالشكل الذي يتطلبه الخادم
    privateKey: pKey ? pKey.replace(/\\n/g, '\n') : undefined,
  };

  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
      console.log("Firebase Admin SDK initialized successfully using apphosting.yaml variables.");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin with structured service account:", error);
      initializeApp({
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
    }
  } else {
    // حل احتياطي أوتوماتيكي بناءً على الصلاحيات الافتراضية للـ Container
    initializeApp({
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      serviceAccountId: "firebase-app-hosting-compute@dar-allughat-97483992-fc6c5.iam.gserviceaccount.com",
    });
    console.log("Firebase Admin SDK initialized with default compute serviceAccountId.");
  }
}

// جلب الـ Instance الحالي المضمون دائماً من الـ SDK مباشرة لمنع كسر الـ Context
const currentApp = getApp();

export function getDb(): Firestore {
  return getFirestore(currentApp);
}

export function getAuth(): Auth {
  return getAdminAuth(currentApp);
}

export function getBucket(bucketName?: string) {
  const storage = getStorage(currentApp);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;
