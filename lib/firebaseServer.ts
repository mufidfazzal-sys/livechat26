import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC3FZvIRhiblOj7qwKr6YQ19teUJGBesPk",
  authDomain: "livechat-6a49e.firebaseapp.com",
  databaseURL: "https://livechat-6a49e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "livechat-6a49e",
  storageBucket: "livechat-6a49e.firebasestorage.app",
  messagingSenderId: "484664231140",
  appId: "1:484664231140:web:98952a956f83a8ecfa58f1",
  measurementId: "G-Z6PKPEB4XT"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
