import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  
  // 🎯 التصحيح النهائي القاطع: استخدام النطاق الأصلي لـ Firebase لتجاوز البروكسي المعطوب
  authDomain: "dar-allughat-97483992-fc6c5.firebaseapp.com",
  
  databaseURL: "https://dar-allughat-97483992-fc6c5-default-rtdb.firebaseio.com/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 1. تهيئة التطبيق بالطريقة الرسمية الأكثر استقراراً لمنع الانهيار
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. تهيئة كافة الخدمات المطلوبة في المشروع (تتضمن الـ Storage والصور)
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const database = getDatabase(app);

// 3. التحقق الذكي والمحمي من دعم المتصفح للإحصائيات لحماية الواجهة الخلفية
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// 4. التصدير الشامل والكامل لكل عناصر المتجر لإنهاء أخطاء البناء
export { app, auth, db, storage, database, analytics };