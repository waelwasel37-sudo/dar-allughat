import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // ضروري جداً لتسجيل الدخول

const firebaseConfig = {
  apiKey: "AIzaSyCX0RCPBcg0_eL28snWBn0bNfDf8ACWzWM",
  authDomain: "dar-allughat-97483992-fc6c5.firebaseapp.com",
  projectId: "dar-allughat-97483992-fc6c5",
  storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
  messagingSenderId: "118615668327",
  appId: "1:118615668327:web:394407c7f6ab1e801a06c2",
  measurementId: "G-5B1BGCLTM8"
};

// تهيئة التطبيق بطريقة تمنع تكرار التهيئة
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// تصدير الخدمات لتعمل في المكونات (Components)
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
export const auth = getAuth(app); // إضافة التصدير الناقص

// تهيئة Analytics بشكل آمن في المتصفح فقط
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export { app };
