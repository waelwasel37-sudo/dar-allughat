
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  let credential;

  // The user-approved, robust method: Use a single, cleaned, base64-encoded service account variable.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("Auth: Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT_BASE64 env var.");
    try {
      // Crucial cleaning step to remove any whitespace or newlines from the env var.
      const cleanBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim().replace(/\s/g, '');
      
      // Decode the cleaned base64 string to get the full JSON service account object.
      const decodedServiceAccount = Buffer.from(cleanBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(decodedServiceAccount);
      credential = admin.credential.cert(serviceAccount);

    } catch (error) {
      console.error("Auth Error: Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64. Make sure it's a valid base64 encoded JSON.", error);
      // Fallback if parsing fails, to allow builds to continue in some cases.
      credential = admin.credential.applicationDefault();
    }
  } else {
    // Fallback for production environments like App Hosting where ADC is automatically configured.
    console.log("Auth: FIREBASE_SERVICE_ACCOUNT_BASE64 not found. Falling back to Application Default Credentials.");
    credential = admin.credential.applicationDefault();
  }

  if (!storageBucket) {
    console.error("FIREBASE_STORAGE_BUCKET environment variable is not set. Server-side storage operations will fail.");
  }

  try {
    admin.initializeApp({
      credential,
      storageBucket: storageBucket,
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error) {
      console.error("Firebase Admin initialization failed:", error);
  }
}

// Export safely, ensuring the app doesn't crash if initialization failed.
const isInitialized = admin.apps.length > 0;

export const db = isInitialized ? admin.firestore() : undefined;
export const auth = isInitialized ? admin.auth() : undefined;
export const storage = isInitialized ? admin.storage() : undefined;
export const bucket = isInitialized && admin.storage() ? admin.storage().bucket() : undefined;

export default admin;
