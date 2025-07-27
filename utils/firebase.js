import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBfjvaPybmBUAydFYj5SZacE4unQWs16FI",
    authDomain: "mta-bus-tracker.firebaseapp.com",
    projectId: "mta-bus-tracker",
    storageBucket: "mta-bus-tracker.firebasestorage.app",
    messagingSenderId: "632067631990",
    appId: "1:632067631990:web:153560fc76e0e82d656857",
    measurementId: "G-LQB97WB0QQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);