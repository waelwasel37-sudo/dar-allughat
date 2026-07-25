import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Bucket } from 'firebase-admin/storage';

// Helper function to get service account credentials from environment variables.
function getServiceAccount() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // ✅ تم التصحيح: تحويل حروف \n النصية القادمة من السيرفر إلى أسطر حقيقية ليتمكن Firebase من قراءتها
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase Admin credentials are not configured correctly in environment variables.');
  }

  return serviceAccount;
}

// Singleton pattern to initialize Firebase Admin app.
const adminApp: App = getApps().length
  ? getApps()[0]! 
  : initializeApp({
      credential: cert(getServiceAccount()),
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
