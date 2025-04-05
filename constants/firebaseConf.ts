import { initializeApp } from "firebase/app";
import * as firebaseAuth from 'firebase/auth';
import { initializeAuth } from "firebase/auth";
import { enableNetwork, getFirestore, setLogLevel } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

const firebaseConfig = {
  apiKey: "AIzaSyDXuabYKwZOMmWawp98KfGS2WgvyUR87H4",
  authDomain: "blissm-mh.firebaseapp.com",
  projectId: "blissm-mh",
  storageBucket: "blissm-mh.firebasestorage.app",
  messagingSenderId: "796218715843",
  appId: "1:796218715843:web:dfce014e3850998bfb3c76",
  measurementId: "G-1VS2GPDGY1"
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
const FIRESTORE_DB = getFirestore(FIREBASE_APP);

// Force Firestore to go online (also run this immediately after initialization)
enableNetwork(FIRESTORE_DB)
  .then(() => console.log('Firestore is online'))
  .catch((err) => console.error('Error enabling network:', err));

export { FIRESTORE_DB };

export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: reactNativePersistence(AsyncStorage),
});

export default {
  FIREBASE_APP,
  FIRESTORE_DB,
  FIREBASE_AUTH,
}