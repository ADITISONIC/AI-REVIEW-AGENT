// Firebase config file
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApDmRYdMcG74bqWuzIDWbdrgch5xSbbkw",
  authDomain: "abstract-1acc3.firebaseapp.com",
  projectId: "abstract-1acc3",
  storageBucket: "abstract-1acc3.firebasestorage.app",
  messagingSenderId: "325226708417",
  appId: "1:325226708417:web:9020ee431795908c634340",
  measurementId: "G-C60MG3BR7X",
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
