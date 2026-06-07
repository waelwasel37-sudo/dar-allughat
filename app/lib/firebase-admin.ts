import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App;

if (getApps().length === 0) {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;

  // 🚀 إذا كنا في السيرفر أو لم يتم العثور على متغير التشفير، يتم التفعيل التلقائي الآمن مجاناً بدون كود
  if (!base64Sdk) {
    console.log("Initializing Firebase Admin SDK using Auto-Credentials...");
    app = initializeApp({
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
  } else {
    // 💻 هذا الجزء سيعمل فقط في جهازك المحلي إذا كنت تستخدم بيئة قديمة أو قمت بتوفير المفتاح
    try {
      const sdkJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(sdkJson);

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
      console.log("Firebase Admin SDK initialized successfully from Base64.");
    } catch (error: any) {
      console.warn("Base64 decoding failed, falling back to Auto-Credentials...");
      app = initializeApp({
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
      });
    }
  }
} else {
  app = getApps()[0];
}

export function getDb(): Firestore {
  return getFirestore(app);
}

export function getAuth(): Auth {
  return getAdminAuth(app);
}

export function getBucket(bucketName?: string) {
  const storage = getStorage(app);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;