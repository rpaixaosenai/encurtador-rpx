import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAie35WVAuc2M62kmCCvFbZX7wfuCOwFBI",
  authDomain: "rpx-link.firebaseapp.com",
  projectId: "rpx-link",
  storageBucket: "rpx-link.firebasestorage.app",
  messagingSenderId: "758809764232",
  appId: "1:758809764232:web:89e9013820a3d3c2b89a3d"
};

console.log("🔥 Firebase Config loaded for project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
