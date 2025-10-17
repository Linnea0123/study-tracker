import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxkpwxrDkZEYl4-WcqDci-gH3OxMz0YfE",
  authDomain: "study-check-464e8.firebaseapp.com",
  projectId: "study-check-464e8",
  storageBucket: "study-check-464e8.appspot.com",
  messagingSenderId: "486766303015",
  appId: "1:486766303015:web:e1f8ef025340f23162fb02"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 获取 Firestore 实例
export const db = getFirestore(app);