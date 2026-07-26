import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
// 🎯 تم الدمج: استيراد نوع الـ Bucket الصحيح لمنع الخطأ 2305 نهائياً
import type { Bucket } from '@google-cloud/storage';

// Singleton pattern to initialize Firebase Admin app.
const adminApp: App = getApps().length
  ? getApps()[0]!
  : initializeApp({
    projectId: 'dar-allughat-97483992-fc6c5',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dar-allughat-97483992-fc6c5.firebasestorage.app'
  });

// Initialize services once.
const db: Firestore = getFirestore(adminApp); // اتصال بقاعدة البيانات (default)
const db_secondary: Firestore = getFirestore(adminApp, 'dar-allughat-97483992-fc6c5'); // 🎯 فكرتك الممتازة للاتصال بالقاعدة الثانية
const adminAuth: Auth = getAuth(adminApp);
const storage: Bucket = getStorage(adminApp).bucket(); // تفعيل الـ bucket بأمان بدون مشاكل أنواع

// --- EXPORT FUNCTIONS ---
export function getDb() {
  return db;
}

// 🎯 دالتك الاحترافية لتصدير الاتصال الصحيح
export function getSecondaryDb() {
  return db_secondary;
}

export function getAdminAuth() {
  return adminAuth;
}

export function getBucket() {
  return storage;
}

export { adminApp };
