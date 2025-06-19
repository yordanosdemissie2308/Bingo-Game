import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBEiEVL18mBLrhnXQRPheRSLT6YlF1n_Ek",
  authDomain: "bingo-game-fd1f3.firebaseapp.com",
  projectId: "bingo-game-fd1f3",
  storageBucket: "bingo-game-fd1f3.firebasestorage.app",
  messagingSenderId: "704623286919",
  appId: "1:704623286919:web:069e7a3521810e171e3622",
  measurementId: "G-KGV9GJKJWZ",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let analytics = null;
if (typeof window !== "undefined") {
  // Import getAnalytics only on client side to avoid SSR issues
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

export { db, auth, analytics };
