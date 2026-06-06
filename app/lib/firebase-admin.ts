import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App | null = null;

function initializeAdmin() {
  if (app) return;

  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
    return;
  }

  console.log("Attempting to initialize Firebase Admin SDK from separate environment variables...");

  const projectId = process.env.SERVER_FB_PROJECT_ID;
  const clientEmail = process.env.SERVER_FB_CLIENT_EMAIL;
  const privateKey = process.env.SERVER_FB_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const cleanPrivateKey = privateKey
        .replace(/^"/, '')   
        .replace(/"$/, '')   
        .replace(/\\n/g, '\n'); 

      const serviceAccount = {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: cleanPrivateKey,
      };

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app", 
      });

      console.log("Firebase Admin SDK initialized successfully with modern Storage Bucket.");
    } catch (error: any) {
      console.error("FATAL: Firebase Admin initialization failed:", error);
      app = null;
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Firebase Admin SDK critical boot failure: ${error?.message || error}`);
      }
    }
  } else {
    console.warn("WARNING: Server-side Firebase Admin SDK environment variables not found. Some features may not work.");
  }
}

initializeAdmin();

function ensureInitialized(): App {
  if (!app) {
    initializeAdmin();
    if (!app) {
      throw new Error("Firebase Admin SDK is not initialized. Check server logs for initialization errors.");
    }
  }
  return app;
}

export function getDb(): Firestore {
  const currentApp = ensureInitialized();
  return getFirestore(currentApp); 
}

export function getAuth(): Auth {
  const currentApp = ensureInitialized();
  return getAdminAuth(currentApp); 
}

export function getBucket(bucketName?: string) {
  const currentApp = ensureInitialized();
  const storage = getStorage(currentApp);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;
