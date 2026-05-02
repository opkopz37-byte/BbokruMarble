import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// rspgame-9091a — used by 가위바위보 only
// (뽁루마블 uses its own config at public/boardgame/firebase-config.js)
const firebaseConfig = {
  apiKey: "AIzaSyA8t8mHpml7UeJU6GyuSDROBRNfGKYSj7I",
  authDomain: "rspgame-9091a.firebaseapp.com",
  databaseURL:
    "https://rspgame-9091a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rspgame-9091a",
  storageBucket: "rspgame-9091a.firebasestorage.app",
  messagingSenderId: "948430682965",
  appId: "1:948430682965:web:f9bae19453aff02d7c8ddc",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);
