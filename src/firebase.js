import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDNerzximtM5fWC_Kp4nTnJtat0d2YSgJY",
  authDomain: "npc-dialogue.firebaseapp.com",
  projectId: "npc-dialogue",
  storageBucket: "npc-dialogue.firebasestorage.app",
  messagingSenderId: "911188160195",
  appId: "1:911188160195:web:cd5213f9884b280bbabc76",
  measurementId: "G-TWHPDHLCRC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app; 