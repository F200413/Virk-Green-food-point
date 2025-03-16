// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBdDjiLPadhJzTia9EGlViEmFMn_EZ8Aw",
  authDomain: "milk-7de83.firebaseapp.com",
  projectId: "milk-7de83",
  storageBucket: "milk-7de83.firebasestorage.app",
  messagingSenderId: "324307416638",
  appId: "1:324307416638:web:508ce7f640acf46538436f",
  measurementId: "G-BLN6M0XR9M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { firestore };
