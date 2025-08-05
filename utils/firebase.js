import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBfjvaPybmBUAydFYj5SZacE4unQWs16FI",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "mta-bus-tracker.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "mta-bus-tracker",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "mta-bus-tracker.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "632067631990",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:632067631990:web:153560fc76e0e82d656857",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LQB97WB0QQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);