import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { browserLocalPersistence, setPersistence } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDq56aUs91FWSyTGYbZi_JvBtH4KJ0droI",
  authDomain: "mybench-b3984.firebaseapp.com",
  projectId: "mybench-b3984",
  storageBucket: "mybench-b3984.appspot.com",
  messagingSenderId: "517163805217",
  appId: "1:517163805217:web:109f3d0e304838a7951160"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
