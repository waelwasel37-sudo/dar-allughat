import { initializeApp, getApps, getApp, type App, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

// 🎯 A robust function to get service account credentials, ensuring the app fails fast with a clear error.
function getServiceAccount(): ServiceAccount {
    // For production/deployment environments: Use the full JSON string from the environment variable.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            // Validate that the parsed object is a valid service account.
            if (!serviceAccount.project_id) {
                throw new Error("The parsed service account object is missing the 'project_id' property.");
            }
            return serviceAccount;
        } catch (e: any) {
            // Provide a more informative error to aid debugging during deployment.
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it's a valid, non-escaped JSON string. Original error: ${e.message}`);
        }
    }

    // For local development: Use individual environment variables.
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        return {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // The private key from an environment variable often has escaped newlines that need to be replaced.
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        } as ServiceAccount;
    }

    // If no credentials are provided in any form, throw a clear error.
    throw new Error('Firebase Admin credentials are not configured. Please set either FIREBASE_SERVICE_ACCOUNT_JSON (for production) or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (for local development).');
}


// 🔒 Initialize the app only once to prevent issues in a serverless environment.
let app: App;

if (getApps().length === 0) {
  // This call will now throw a clear and actionable error if credentials are not set up correctly.
  const serviceAccount = getServiceAccount(); 
  
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.appspot.com`
  });
} else {
  app = getApp();
}

// 🚀 Export clean, safe functions to access Firebase services throughout your app.
export function getAdminApp(): App {
  return app;
}

export function getAdminAuth(): Auth {
  return firebaseGetAuth(app);
}

export function getDb(): Firestore {
  return getFirestore(app);
}

export function getBucket() {
  return getStorage(app).bucket();
}