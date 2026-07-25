import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

function getServiceAccount() {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        return {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // التصحيح هنا: استخدام '\n' داخل السلسلة النصية لتمريرها بشكل صحيح
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
    }
    throw new Error('Firebase Admin credentials are not configured correctly in environment variables.');
}

const adminApp: App = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(getServiceAccount()),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dar-allughat-97483992-fc6c5.firebasestorage.app'
    });

const adminAuth: Auth = getAuth(adminApp);
const db: Firestore = getFirestore(adminApp);
const bucket = getStorage(adminApp).bucket();

export { adminApp, adminAuth, db, bucket };
