import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Bucket } from 'firebase-admin/storage';

// Singleton pattern to initialize Firebase Admin app.
const adminApp: App = getApps().length
  ? getApps()[0]!
  : initializeApp({
    // Explicitly specifying the project ID for clarity and correctness.
    projectId: 'dar-allughat-97483992-fc6c5',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dar-allughat-97483992-fc6c5.firebasestorage.app'
  });

// Initialize services once.
const db: Firestore = getFirestore(adminApp);
const adminAuth: Auth = getAuth(adminApp);
const storage: Bucket = getStorage(adminApp).bucket();

// --- EXPORT FUNCTIONS ---
export function getDb() {
  return db;
}

export function getAdminAuth() {
  return adminAuth;
}

export function getBucket() {
  return storage;
}

export { adminApp };
