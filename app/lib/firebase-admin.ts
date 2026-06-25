import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

// Initialize the app using Application Default Credentials
// This is the recommended approach for Google Cloud environments like Firebase App Hosting.
if (getApps().length === 0) {
  initializeApp({
    storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
  });
  console.log("Firebase Admin SDK initialized using Application Default Credentials.");
}

// Get the initialized app instance
const currentApp = getApp();

// Export utility functions to get SDK services
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
