import { useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([
    { id: 1, name: "英语学习 30 分钟", done: false },
    { id: 2, name: "写作业 20 分钟", done: false },
    { id: 3, name: "跳绳 500 个", done: false },
    { id: 4, name: "阅读科普书籍 15 分钟", done: false },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const clearDone = () => {
    setTasks(tasks.map(t => ({ ...t, done: false })));
  };

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">今日学习计划</h1>

      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-3 mb-2 rounded cursor-pointer ${
              task.done ? "bg-green-100" : "hover:bg-gray-100"
            }`}
            onClick={() => toggleTask(task.id)}
          >
            <span className={`${task.done ? "line-through text-gray-400" : ""}`}>
              {task.name}
            </span>
            {task.done && <span className="text-green-500 font-bold">✔</span>}
          </div>
        ))}

        <div className="mt-4 flex justify-between items-center">
          <span>已完成：{doneCount} / {tasks.length}</span>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            onClick={clearDone}
          >
            清除完成
          </button>
        </div>
      </div>
    </div>
  );
}
