import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// 🔥 الطريقة الصحيحة والوحيدة لتهيئة Firebase Client على App Hosting
let firebaseConfig;

// بيئة الاستضافة توفر متغير FIREBASE_WEBAPP_CONFIG يحتوي على الإعدادات الصحيحة
if (process.env.FIREBASE_WEBAPP_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
} else {
    // هذا الكود سيعمل فقط في بيئة التطوير المحلية كخيار احتياطي
    firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
}


// تهيئة Firebase بأمان، ومنع إعادة التهيئة
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// تصدير خدمات Firebase لاستخدامها في التطبيق
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
export const auth = getAuth(app);

// تصدير Google Auth Provider وتعيين المعلمات المخصصة
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// تهيئة Analytics فقط في المتصفح وإذا كان مدعومًا
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

export default app;
