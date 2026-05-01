import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCX0RCPBcg0_eL28snWBn0bNfDf8ACWzWM",
  authDomain: "dar-allughat-97483992-fc6c5.firebaseapp.com",
  projectId: "dar-allughat-97483992-fc6c5",
  storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
  messagingSenderId: "118615668327",
  appId: "1:118615668327:web:394407c7f6ab1e801a06c2",
  measurementId: "G-5B1BGCLTM8"
};

// Initialize the app (prevent re-initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics (only works in the browser)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Export the tools for use in the rest of the project
export { app, auth, db, storage, analytics };
