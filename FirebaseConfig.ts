import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";


const firebaseConfig = {
  apiKey: "AIzaSyC9l7CEXtrK8qtjTZWd2kV6GP3P4LUJM6U",
  authDomain: "healthapp-cbb07.firebaseapp.com",
  projectId: "healthapp-cbb07",
  storageBucket: "healthapp-cbb07.appspot.com",
  messagingSenderId: "766606119808",
  appId: "1:766606119808:web:532dfa596f14f08410e765"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_FUNCTIONS = getFunctions(FIREBASE_APP);
