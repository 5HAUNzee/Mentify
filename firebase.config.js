// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAH4QfTmDvAmCvchpR7xZvGDcLAOv8nWA",
  authDomain: "mentify-d4964.firebaseapp.com",
  projectId: "mentify-d4964",
  storageBucket: "mentify-d4964.firebasestorage.app",
  messagingSenderId: "25384358410",
  appId: "1:25384358410:web:f5e529c6416e37f03145f3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("✅ Firebase initialized:", app.name);

// Initialize Firestore and export
export const db = getFirestore(app);
