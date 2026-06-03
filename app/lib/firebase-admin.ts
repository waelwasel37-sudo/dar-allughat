
import * as admin from 'firebase-admin';

// Helper function to decode base64 string.
const decodeBase64 = (base64String: string): string => {
    return Buffer.from(base64String, 'base64').toString('utf8');
};

if (!admin.apps.length) {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    let credential;

    // Use Service Account credentials if the private key is available in environment variables.
    // This works for both local development (from .env.local) and production on App Hosting.
    if (process.env.SERVER_FB_PRIVATE_KEY_B64) {
        console.log("Auth: Initializing Firebase Admin with Service Account credentials from env.");
        credential = admin.credential.cert({
            projectId: process.env.SERVER_FB_PROJECT_ID,
            clientEmail: process.env.SERVER_FB_CLIENT_EMAIL,
            privateKey: decodeBase64(process.env.SERVER_FB_PRIVATE_KEY_B64),
        });
    } else {
        // Fallback for environments where service account isn't set via env vars.
        // App Hosting provides these automatically.
        console.warn("Auth: Service Account environment variables not found. Falling back to Application Default Credentials.");
        credential = admin.credential.applicationDefault();
    }

    if (!storageBucket) {
        console.error("FIREBASE_STORAGE_BUCKET environment variable is not set. Server-side storage operations will fail.");
    }

    admin.initializeApp({
        credential,
        storageBucket: storageBucket,
    });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
// Get the default bucket from the initialized app.
export const bucket = admin.storage().bucket();
export default admin;
