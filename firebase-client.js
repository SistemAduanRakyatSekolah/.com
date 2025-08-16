// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
// IMPORTANT: For security, go to your Firebase Console -> Authentication -> Settings -> Authorized domains and ensure your app's domain is listed.
const firebaseConfig = {
  apiKey: "AIzaSyAiUsdaN7Xgi0EhwiAKCyZmOYUfVUM0EHY",
  authDomain: "sars-data.firebaseapp.com",
  projectId: "sars-data",
  storageBucket: "sars-data.appspot.com",
  messagingSenderId: "973260424431",
  appId: "1:973260424431:web:471b77e6a3a768ee7a471a",
  measurementId: "G-BXR59KW1JX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services to be used in other files
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);