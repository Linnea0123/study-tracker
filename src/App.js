import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  // 从 localStorage 读取数据
  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) setTasks(JSON.parse(storedTasks));
  }, []);

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // 添加新任务
  const addTask = () => {
    if (input.trim() === "") return;
    const newTask = { id: Date.now(), text: input.trim(), done: false };
    setTasks([...tasks, newTask]);
    setInput("");
  };

  // 切换打卡状态
  const toggleDone = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  // 删除任务
  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // 统计完成率
  const completedCount = tasks.filter((task) => task.done).length;
  const totalCount = tasks.length;
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="App" style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
      <h1>📚 学习打卡</h1>

      <div style={{ display: "flex", marginBottom: 10 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入今日任务"
          style={{ flex: 1, padding: 5 }}
        />
        <button onClick={addTask} style={{ marginLeft: 5 }}>添加</button>
      </div>

      {tasks.length === 0 ? (
        <p>还没有任务，快添加一个吧！</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((task) => (
            <li key={task.id} style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task.id)}
                style={{ marginRight: 10 }}
              />
              <span style={{ flex: 1, textDecoration: task.done ? "line-through" : "none" }}>
                {task.text}
              </span>
              <button onClick={() => deleteTask(task.id)}>❌</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 20 }}>
        <strong>完成率: {completionRate}% ({completedCount}/{totalCount})</strong>
        <div style={{ height: 10, background: "#ddd", marginTop: 5 }}>
          <div style={{ width: `${completionRate}%`, height: "100%", background: "#4caf50" }} />
        </div>
      </div>
    </div>
  );
}

export default App;
