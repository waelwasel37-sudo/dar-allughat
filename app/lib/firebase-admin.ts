import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import * as adminInstance from 'firebase-admin';

let app: App;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (getApps().length === 0) {
  try {
    app = initializeApp({
      credential: adminInstance.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log('[Firebase Admin] Initialized successfully using environment variables.');
  } catch (error: any) {
    console.error('[Firebase Admin Fatal Error]: Failed to initialize.', error.message);
    if (!getApps().length) {
      initializeApp();
    }
    app = getApp();
  }
} else {
  app = getApp();
}

export const getDb = (): Firestore => getFirestore(app);
export const getAuth = (): Auth => getAdminAuth(app);
export const getBucket = () => getAdminStorage(app).bucket();

export const admin = adminInstance;

// This named export is necessary for the API routes that use: import { auth } from '...'
export const auth = getAuth();

const adminDefaultExport = {
  ...adminInstance,
  apps: getApps(),
  app: () => app,
  // Using getters ensures lazy evaluation and prevents initialization race conditions.
  get firestore() { return getDb(); },
  get auth() { return getAuth(); },
  storage: getAdminStorage 
};

export default adminDefaultExport;