import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAoX-gI1JG8ol-iqJgrIpum1hsxMZKZ7VQ",
  authDomain: "deepshield-54de1.firebaseapp.com",
  projectId: "deepshield-54de1",
  storageBucket: "deepshield-54de1.firebasestorage.app",
  messagingSenderId: "776272983636",
  appId: "1:776272983636:web:e9ec81634354053c9a5fc1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);