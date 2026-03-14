import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: החלף עם הפרטים שלך מ-Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDBwrwv-UDiVLaRaVOFQkZdiBaIm2RkcB8",
  authDomain: "home-manager-2ff9c.firebaseapp.com",
  projectId: "home-manager-2ff9c",
  storageBucket: "home-manager-2ff9c.firebasestorage.app",
  messagingSenderId: "904743304166",
  appId: "1:904743304166:web:f471a63a89f4b59c41b427"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'boaz65sa@gmail.com';
