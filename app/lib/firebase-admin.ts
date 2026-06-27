import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

// 🎯 المتغير العالمي لتخزين نسخة التطبيق المبدئية لضمان عدم تكرار التهيئة
let app: App;

// قراءة المتغيرات الأساسية مرة واحدة عند بدء تشغيل الخادم
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.SERVER_FB_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.SERVER_FB_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.SERVER_FB_PRIVATE_KEY;

// 🛡️ الإصلاح الجذري والنهائي لمعالجة المفتاح الخاص بشكل صحيح وآمن
if (privateKey) {
  // 1. إزالة علامات الاقتباس إذا وجدت بالخطأ
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // 2. ⚡ السطر الحاسم والمظبوط للسيرفر: تحويل النص إلى أسطر برمجية حقيقية ليفك التشفير بنجاح
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log('[Firebase Admin] Initialized successfully with Service Account.');
  } else {
    initializeApp();
    app = getApp();
    console.log('[Firebase Admin] Initialized successfully with Application Default Credentials.');
  }
} else {
  app = getApp();
}

// تصدير دوال نظيفة ومتوافقة مع أنواع TypeScript الصارمة
const db: Firestore = getFirestore(app);
const auth: Auth = getAdminAuth(app);
const storage = getStorage(app);

export { db, auth, storage, admin };