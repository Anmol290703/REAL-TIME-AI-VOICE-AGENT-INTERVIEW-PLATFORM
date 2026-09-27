import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore";

 const firebaseConfig = {
  apiKey: "AIzaSyAeskIy0wdr0ewyDd9Me_vwYTAhgXFa43Y",
  authDomain: "prepwise-f7833.firebaseapp.com",
  projectId: "prepwise-f7833",
  storageBucket: "prepwise-f7833.firebasestorage.app",
  messagingSenderId: "278236104797",
  appId: "1:278236104797:web:a9d3ad50fad86ddaf2e5b4",
  measurementId: "G-SQ8NMBPQZL"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);