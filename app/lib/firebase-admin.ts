import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, type App, cert, applicationDefault, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

function parseServiceAccountJson(raw: string): ServiceAccount {
    if (!raw || !raw.trim()) {
        throw new Error('The provided service account JSON is empty.');
    }

    const repairedRaw = raw
        .trim()
        .replace(/\v/g, '\\n')
        .replace(/\V/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

    let serviceAccount: any;
    try {
        serviceAccount = JSON.parse(repairedRaw);
    } catch (firstError: any) {
        const fallbackRaw = repairedRaw.replace(/\(?!["\\/bfnrtu])/g, '\\');
        try {
            serviceAccount = JSON.parse(fallbackRaw);
        } catch (secondError: any) {
            throw new Error(`Failed to parse service account JSON. Original error: ${secondError.message}`);
        }
    }

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("The parsed service account object is missing required fields.");
    }

    return {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: String(serviceAccount.private_key).replace(/\n/g, '\n'),
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
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Original error: ${e.message}`);
        }
    }

    if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
            const decoded = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
            return parseServiceAccountJson(decoded);
        } catch (e: any) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64. Original error: ${e.message}`);
        }
    }

    if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        return {
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\n/g, '\n'),
        } as ServiceAccount;
    }

    throw new Error('Firebase Admin credentials are not configured.');
}

function getServiceAccount(): ServiceAccount {
    return getServiceAccountFromEnv();
}

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
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.firebasestorage.app`
        });
        return app;
    } catch (error) {
        try {
            if (!app) {
                app = initializeApp({
                    credential: applicationDefault(),
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dar-allughat-97483992-fc6c5.firebasestorage.app'
                });
                return app;
            }
        } catch {
            // fall through
        }

        initializationError = error instanceof Error ? error : new Error(String(error));
        throw initializationError;
    }
}

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