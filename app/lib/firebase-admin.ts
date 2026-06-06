import admin from 'firebase-admin';

let app: admin.app.App | null = null;

function initializeAdmin() {
  if (app) {
    return;
  }
  if (admin.apps.length > 0) {
    app = admin.apps[0];
    return;
  }

  console.log("Attempting to initialize Firebase Admin SDK from separate environment variables...");

  const projectId = process.env.SERVER_FB_PROJECT_ID;
  const clientEmail = process.env.SERVER_FB_CLIENT_EMAIL;
  const privateKey = process.env.SERVER_FB_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const serviceAccount = {
        projectId: projectId,
        clientEmail: clientEmail,
        // The `dotenv` package handles the newlines correctly. We just replace the literal \n with a newline character.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${projectId}.appspot.com`,
      });

      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("FATAL: Firebase Admin initialization failed:", error);
      app = null;
    }
  } else {
    console.warn("WARNING: Server-side Firebase Admin SDK environment variables not found. Some features may not work.");
  }
}

// Initialize on load
initializeAdmin();

function ensureInitialized() {
  if (!app) {
    initializeAdmin();
    if (!app) {
      throw new Error("Firebase Admin SDK is not initialized. Check server logs for initialization errors.");
    }
  }
}

export function getDb(): admin.firestore.Firestore {
  ensureInitialized();
  return admin.firestore(app!); 
}

export function getAuth(): admin.auth.Auth {
  ensureInitialized();
  return admin.auth(app!); 
}

export function getBucket(bucketName?: string) {
  ensureInitialized();
  const storage = admin.storage(app!); 
  return storage.bucket(bucketName); // Use provided bucket name or default
}

export default admin;
