import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, getApps, getApp, type App, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

function parseServiceAccountJson(raw: string): ServiceAccount {
    const sanitizedRaw = raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    const serviceAccount = JSON.parse(sanitizedRaw.replace(/\\v/g, '\\\\v'));
    if (!serviceAccount.project_id) {
        throw new Error("The parsed service account object is missing the 'project_id' property.");
    }
    return {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    } as ServiceAccount;
}

export function getServiceAccountFromEnv(env: NodeJS.ProcessEnv = process.env): ServiceAccount {
    const credentialFile = env.FIREBASE_SERVICE_ACCOUNT_FILE || env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialFile) {
        const filePath = resolve(credentialFile);
        if (existsSync(filePath)) {
            try {
                return parseServiceAccountJson(readFileSync(filePath, 'utf8'));
            } catch (e: any) {
                throw new Error(`Failed to read Firebase service account file at ${filePath}. Original error: ${e.message}`);
            }
        }
    }

    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            return parseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (e: any) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it's a valid, non-escaped JSON string. Original error: ${e.message}`);
        }
    }

    if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
            const decoded = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
            return parseServiceAccountJson(decoded);
        } catch (e: any) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64. Ensure it's a valid base64-encoded service account JSON string. Original error: ${e.message}`);
        }
    }

    if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        return {
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        } as ServiceAccount;
    }

    throw new Error('Firebase Admin credentials are not configured. Please set either a service account file path via FIREBASE_SERVICE_ACCOUNT_FILE or GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
}

function getServiceAccount(): ServiceAccount {
    return getServiceAccountFromEnv();
}

// 🔒 Initialize the app lazily so the build does not crash before routes need Firebase.
let app: App | null = null;
let initializationError: Error | null = null;

function initializeAdminApp(): App {
    if (app) {
        return app;
    }

    if (initializationError) {
        throw initializationError;
    }

    try {
        const serviceAccount = getServiceAccount();
        app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.appspot.com`
        });
        return app;
    } catch (error) {
        initializationError = error instanceof Error ? error : new Error(String(error));
        throw initializationError;
    }
}

// 🚀 Export clean, safe functions to access Firebase services throughout your app.
export function getAdminApp(): App {
    return initializeAdminApp();
}

export function getAdminAuth(): Auth {
    return firebaseGetAuth(initializeAdminApp());
}

export function getDb(): Firestore {
    return getFirestore(initializeAdminApp());
}

export function getBucket() {
    return getStorage(initializeAdminApp()).bucket();
}