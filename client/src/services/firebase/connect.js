import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDFAsLE2SwWEPUGsATf302AMsdd1a6Kdpo",
    authDomain: "cs308-74845.firebaseapp.com",
    projectId: "cs308-74845",
    storageBucket: "cs308-74845.firebasestorage.app",
    messagingSenderId: "162391926853",
    appId: "1:162391926853:web:a4fa2166f4fa1692289b2c"
};

export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth(app)
