
// Simplified and more direct Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCX0RCPBcg0_eL28snWBn0bNfDf8ACWzWM",
  authDomain: "dar-allughat-97483992-fc6c5.firebaseapp.com",
  projectId: "dar-allughat-97483992-fc6c5",
  storageBucket: "dar-allughat-97483992-fc6c5.appspot.com", // Corrected common typo from previous versions if any
  messagingSenderId: "118615668327",
  appId: "1:118615668327:web:394407c7f6ab1e801a06c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and export them immediately
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
