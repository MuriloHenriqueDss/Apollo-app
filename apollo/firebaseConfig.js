import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB9t1cKcevW_N4uBfG5DPbq0eQFmexA7Bs",
    authDomain: "auth-firebase-apollo.firebaseapp.com",
    projectId: "auth-firebase-apollo",
    storageBucket: "auth-firebase-apollo.firebasestorage.app",
    messagingSenderId: "128447270036",
    appId: "1:128447270036:web:ce7147f855def43fbc7881"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db, collection, getDocs};

export default app;