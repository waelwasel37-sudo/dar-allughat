
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AlzaSyCX0RCPBcg0_eL28snWBn0bNfDf8ACWzWM",
  authDomain: "dar-allughat-97483992-fc6c5.firebaseapp.com",
  projectId: "dar-allughat-97483992-fc6c5",
  storageBucket: "dar-allughat-97483992-fc6c5.firebasestorage.app",
  messagingSenderId: "118615668327",
  appId: "1:118615668327:web:394407c7f6ab1e801a06c2"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export { db };
