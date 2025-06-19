// components/Firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEiEVL18mBLrhnXQRPheRSLT6YlF1n_Ek",
  authDomain: "bingo-game-fd1f3.firebaseapp.com",
  projectId: "bingo-game-fd1f3",
  storageBucket: "bingo-game-fd1f3.firebasestorage.app",
  messagingSenderId: "704623286919",
  appId: "1:704623286919:web:069e7a3521810e171e3622",
  measurementId: "G-KGV9GJKJWZ",
};

// Initialize Firebase App only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Only initialize analytics if `window` is defined
let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { db, auth, analytics };
