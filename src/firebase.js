import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig"; // 引入 firebase 配置
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const App = () => {
  const [tasksByDate, setTasksByDate] = useState({});

  // 保存数据到 Firestore
  const saveData = async () => {
    const newData = { /* 你要保存的数据 */ };
    try {
      const docRef = doc(db, "tasks", "your-doc-id");
      await setDoc(docRef, newData);
      console.log("Data saved!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // 实时监听数据变化
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "tasks", "your-doc-id"), (doc) => {
      if (doc.exists()) {
        setTasksByDate(doc.data());
      } else {
        console.log("No such document!");
      }
    });

    // 清理监听器
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Task List</h1>
      <button onClick={saveData}>Save Data</button>
      <ul>
        {Object.entries(tasksByDate).map(([date, tasks]) => (
          <li key={date}>
            <h2>{date}</h2>
            {tasks.map((task, idx) => (
              <div key={idx}>{task.text}</div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
