import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, setDoc, doc } from "firebase/firestore";

// Firebase 配置
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
const db = getFirestore(app);

// 读取任务数据
export const readTasksData = async () => {
  const tasksRef = collection(db, "tasks"); // "tasks" 是 Firestore 中的集合名称
  const querySnapshot = await getDocs(tasksRef);
  const tasks = [];
  querySnapshot.forEach((doc) => {
    tasks.push({ id: doc.id, ...doc.data() });  // 获取文档数据并附加ID
  });
  return tasks;
};

// 写入单个任务数据
export const writeTaskData = async (task) => {
  const taskRef = doc(db, "tasks", task.id);  // 使用任务的id作为文档ID
  await setDoc(taskRef, task);  // 更新/创建任务文档
};

// 写入任务数据（批量）
export const writeTasksData = async (tasks) => {
  const batch = db.batch();
  tasks.forEach(task => {
    const taskRef = doc(db, "tasks", task.id.toString());  // 使用任务的id作为文档ID
    batch.set(taskRef, task);  // 批量写入任务
  });
  await batch.commit();  // 提交批量操作
};

export { db };
