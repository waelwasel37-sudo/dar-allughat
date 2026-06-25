import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

let app: App | undefined;
let auth: Auth | undefined;

console.log('[Firebase Admin] RUNTIME ENVIRONMENT DIAGNOSTICS...');

const clientEmail = process.env.SERVER_FB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.SERVER_FB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

console.log(`[Firebase Admin] Client Email loaded: ${!!clientEmail}`);
console.log(`[Firebase Admin] Private Key loaded: ${!!privateKey}`);

// دالة فك تشفير Base64 رياضية نقية %100 لتفادي تعارض الـ Build والـ Buffer
function safeBase64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const buffer = new Uint8Array(str.length);
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '=') break;
    const v = chars.indexOf(c);
    if (v === -1) continue;
    value = (value << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      buffer[index++] = (value >> bits) & 0xff;
    }
  }
  
  // تحويل الـ Uint8Array إلى نص يونيكود صافي بشكل آمن بيئياً
  let result = '';
  for (let i = 0; i < index; i++) {
    result += String.fromCharCode(buffer[i]);
  }
  return result;
}

try {
  if (getApps().length === 0) {
    const projectId = process.env.SERVER_FB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "dar-allughat-97483992-fc6c5";
    
    let effectivePrivateKey = privateKey;

    if (effectivePrivateKey) {
      effectivePrivateKey = effectivePrivateKey.trim();
      if (effectivePrivateKey.startsWith('"') && effectivePrivateKey.endsWith('"')) {
        effectivePrivateKey = effectivePrivateKey.slice(1, -1).trim();
      }

      // الفحص والفك الرياضي الآمن تماماً وقت البناء
      if (!effectivePrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('[Firebase Admin] Base64 encoded key detected. Decoding via safe decoder...');
        effectivePrivateKey = safeBase64Decode(effectivePrivateKey).trim();
      }

      effectivePrivateKey = effectivePrivateKey.replace(/\n/g, '
');
    }

    initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: effectivePrivateKey,
      }),
      storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
    });
    console.log('[Firebase Admin] Successfully initialized with decoded private key!');
  } else {
    console.log('[Firebase Admin] Existing app found.');
  }
  
  app = getApp();
  auth = getAdminAuth(app);

} catch (error) {
  console.error('[Firebase Admin] CRITICAL INITIALIZATION ERROR:', error);
}

export function getDb(): Firestore {
  if (!app) throw new Error("Firebase Admin App not initialized.");
  return getFirestore(app);
}

export function getAuth(): Auth {
  if (!auth) throw new Error("Firebase Admin Auth not initialized.");
  return auth;
}

export function getBucket(bucketName?: string) {
  if (!app) throw new Error("Firebase Admin App not initialized.");
  const storage = getStorage(app);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

export default admin;