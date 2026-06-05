import admin from 'firebase-admin';

// تحديث النوع لمنع أخطاء المترجم البرمجي
let app: admin.app.App | null = null;

function initializeAdmin() {
  if (!app) {
    if (admin.apps.length > 0) {
      app = admin.apps[0];
    } else {
      try {
        console.log("Initializing Firebase Admin SDK...");
        // التعديل المستهدف (البند 2): قراءة المتغير السري المعتمد في خطتك بصيغة Base64
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        
        if (serviceAccountBase64) {
          const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
          app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.appspot.com`,
          });
        } else {
          // الجلب التلقائي الذكي عند التشغيل المحلي أو السحابي المرتبط
          app = admin.initializeApp();
        }
        console.log("Firebase Admin SDK initialized successfully.");
      } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        app = null;
      }
    }
  }
  return app;
}

// تشغيل التهيئة الذكية عند استدعاء الملف
initializeAdmin();

// --- الدوال الذكية الديناميكية المعتمدة في بنود خطتك البرمجية (البند 5) ---

export function getDb(): admin.firestore.Firestore {
  if (!app) initializeAdmin();
  if (!app) throw new Error("Firebase Admin SDK is not initialized. Cannot access Firestore.");
  return admin.firestore(app);
}

export function getAuth(): admin.auth.Auth {
  if (!app) initializeAdmin();
  if (!app) throw new Error("Firebase Admin SDK is not initialized. Cannot access Auth.");
  return admin.auth(app);
}

export function getBucket(bucketName?: string) {
  if (!app) initializeAdmin();
  if (!app) throw new Error("Firebase Admin SDK is not initialized. Cannot access Storage.");
  const storage = admin.storage(app);
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}

// تصدير الكائن الافتراضي للتوافق
export default admin;
