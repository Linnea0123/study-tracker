import { db } from "./firebase"; // 上一步创建的 firebase.js
import { collection, addDoc, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";

import React, { useState, useEffect, useRef } from "react";

const categories = [
  { name: "语文", color: "#4a90e2" },
  { name: "数学", color: "#357ABD" },
  { name: "英语", color: "#1e73be" },
  { name: "阅读", color: "#00aaff" },
  { name: "运动", color: "#3399ff" },
];

// 获取指定日期的周一
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
};

// 根据周一日期生成一周日期
const getWeekDates = (monday) => {
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push({ date: d.toISOString().split("T")[0], label: `周${"一二三四五六日"[i]}` });
  }
  return weekDates;
};

// 获取当前周数
const getWeekNumber = (date) => {
  const d = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + jan1.getDay() + 1) / 7);
};

function App() {
  const [tasksByDate, setTasksByDate] = useState({});
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState(categories[0].name);
  const [bulkText, setBulkText] = useState("");
  const [showAddTaskInput, setShowAddTaskInput] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const timerRefs = useRef({});

  useEffect(() => {
    const stored = localStorage.getItem("tasksByDate");
    if (stored) setTasksByDate(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  const tasks = tasksByDate[selectedDate] || [];
  const weekDates = getWeekDates(currentMonday);

  const handleAddTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    const newTask = { id: Date.now() + Math.random(), text, category: newTaskCategory, done: false, timeSpent: 0, editing: false, note: "", noteEditing: false };
    setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate] ? [...prev[selectedDate], newTask] : [newTask] }));
    setNewTaskText("");
    setShowAddTaskInput(false);
  };

  const handleImportTasks = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    const newTasks = lines.map(line => ({ id: Date.now() + Math.random(), text: line, category: newTaskCategory, done: false, timeSpent: 0, editing: false, note: "", noteEditing: false }));
    setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate] ? [...prev[selectedDate], ...newTasks] : newTasks }));
    setBulkText("");
    setShowBulkInput(false);
  };

  const toggleDone = (id) => setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  const deleteTask = (id) => { clearInterval(timerRefs.current[id]); delete timerRefs.current[id]; setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].filter(t => t.id !== id) })); };
  const toggleEdit = (taskId) => setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === taskId ? { ...t, editing: !t.editing } : t) }));
  const updateTaskText = (taskId, newText) => setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === taskId ? { ...t, text: newText } : t) }));
  const startTimer = (taskId) => { if (timerRefs.current[taskId]) return; timerRefs.current[taskId] = setInterval(() => { setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === taskId ? { ...t, timeSpent: t.timeSpent + 1 } : t) })); }, 1000); };
  const stopTimer = (taskId) => { clearInterval(timerRefs.current[taskId]); delete timerRefs.current[taskId]; };
  const manualAddTime = (taskId) => { const minutes = parseInt(prompt("输入已完成的时间（分钟）"), 10); if (!isNaN(minutes) && minutes > 0) { setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === taskId ? { ...t, timeSpent: t.timeSpent + minutes * 60 } : t) })); } };
  const formatTime = (seconds) => `${Math.floor(seconds/60)}m ${seconds%60}s`;
  const getCategoryTasks = (catName) => tasks.filter(t => t.category === catName);
  const calcProgress = (catName) => { const catTasks = getCategoryTasks(catName); if (catTasks.length === 0) return 0; const doneCount = catTasks.filter(t => t.done).length; return Math.round((doneCount/catTasks.length)*100); };
  const toggleNoteEdit = (taskId) => setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === taskId ? { ...t, noteEditing: !t.noteEditing } : t) }));
  const updateTaskNote = (taskId, newNote) => setTasksByDate(prev => ({ ...prev, [selectedDate]: prev[selectedDate].map(t => t.id === taskId ? { ...t, note: newNote } : t) }));

  const prevWeek = () => { const monday = new Date(currentMonday); monday.setDate(monday.getDate() - 7); setCurrentMonday(monday); setSelectedDate(monday.toISOString().split("T")[0]); };
  const nextWeek = () => { const monday = new Date(currentMonday); monday.setDate(monday.getDate() + 7); setCurrentMonday(monday); setSelectedDate(monday.toISOString().split("T")[0]); };

  const totalCheckedDays = Object.keys(tasksByDate).filter(date => tasksByDate[date].some(t => t.done)).length;
  const totalTasksDone = Object.values(tasksByDate).flat().filter(t => t.done).length;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 15, fontFamily: "sans-serif", backgroundColor: "#f5faff" }}>
      <h1 style={{ textAlign: "left", marginBottom: 5,fontSize: 20,color: "#1a73e8" }}>📚 汤圆的学习计划与打卡</h1>
      <div style={{ textAlign: "left", marginBottom: 5,fontSize: 12,marginBottom: 10 }}>你已经打卡 {totalCheckedDays} 天，已累计完成 {totalTasksDone} 个学习计划</div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 5 }}>
        <button onClick={prevWeek} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", marginRight: 5 }}>⬅️</button>
        <span style={{ fontWeight: "bold", margin: "0 5px" }}>
          {currentMonday.getFullYear()}年 第{getWeekNumber(currentMonday)}周
        </span>
        <button onClick={nextWeek} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", marginLeft: 5 }}>➡️</button>
      </div>



      {/* 周一到周日 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        {weekDates.map(d => {
          const todayStr = new Date().toISOString().split("T")[0];
          return (
            <div key={d.date} onClick={() => setSelectedDate(d.date)}
              style={{
                padding: "4px 6px",
                borderBottom: "2px solid",
                borderColor: d.date === selectedDate ? "#1a73e8" : "#ccc",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                textAlign: "center",
                flex: 1,
                margin: "0 2px",
                backgroundColor: d.date === todayStr ? "#1a73e8" : "#e0f0ff",
                color: d.date === todayStr ? "#fff" : "#000",
              }}>
              <div>{d.label}</div>
              <div style={{ fontSize: 10 }}>{d.date.slice(5)}</div>
            </div>
          );
        })}
      </div>

      {/* 添加任务 / 批量导入按钮 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 5, marginBottom: 10 }}>
        <button onClick={() => setShowAddTaskInput(!showAddTaskInput)} style={{ padding: "5px 10px", borderRadius: 6, backgroundColor: "#1a73e8", color: "#fff", border: "none" }}>添加任务</button>
        <button onClick={() => setShowBulkInput(!showBulkInput)} style={{ padding: "5px 10px", borderRadius: 6, backgroundColor: "#1a73e8", color: "#fff", border: "none" }}>批量导入</button>
      </div>

      {showAddTaskInput && (
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)} style={{ padding: 5 }}>
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
            placeholder="输入任务" style={{ flex: 1, padding: 5, borderRadius: 6, border: "1px solid #ccc" }} />
          <button onClick={handleAddTask} style={{ backgroundColor: "#1a73e8", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6 }}>确定</button>
        </div>
      )}

      {showBulkInput && (
        <div style={{ marginBottom: 10 }}>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
            placeholder="每行一个任务" style={{ width: "100%", height: 60, padding: 5, borderRadius: 6, border: "1px solid #ccc", backgroundColor: "#eaf4ff" }} />
          <button onClick={handleImportTasks} style={{ marginTop: 5, backgroundColor: "#1a73e8", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6 }}>确定</button>
        </div>
      )}

      {/* 分类任务卡片 */}
      {categories.map(c => {
        const catTasks = getCategoryTasks(c.name);
        if (catTasks.length === 0) return null;
        const progress = calcProgress(c.name);
        const totalTime = catTasks.reduce((sum, t) => sum + t.timeSpent, 0);
        return (
          <div key={c.name} style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", border: `2px solid ${c.color}`, backgroundColor: "#fff" }}>
            <div style={{ backgroundColor: c.color, color: "#fff", padding: "5px 10px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{c.name} ({progress}%)</span>
              <span>{Math.floor(totalTime / 60)}m {totalTime % 60}s</span>
            </div>
            <ul style={{ listStyle: "none", padding: 10, margin: 0 }}>
              {catTasks.map(task => (
                <li key={task.id} style={{ display: "flex", flexDirection: "column", marginBottom: 5, borderBottom: "1px solid #eee", paddingBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                    <input type="checkbox" checked={task.done} onChange={() => toggleDone(task.id)} style={{ marginRight: 10 }} />
                    {task.editing ? (
                      <input type="text" value={task.text} onChange={e => updateTaskText(task.id, e.target.value)} onBlur={() => toggleEdit(task.id)} style={{ flex: 1, marginRight: 5 }} />
                    ) : (
                      <span onClick={() => toggleEdit(task.id)} style={{ flex: 1, textDecoration: task.done ? "line-through" : "none", cursor: "pointer" }}>{task.text}</span>
                    )}
                    <span style={{ marginRight: 5 }}>{Math.floor(task.timeSpent / 60)}m {task.timeSpent % 60}s</span>
                    <button onClick={() => startTimer(task.id)} style={{ marginRight: 2 }}>▶️</button>
                    <button onClick={() => stopTimer(task.id)} style={{ marginRight: 2 }}>⏹️</button>
                    <button onClick={() => manualAddTime(task.id)} style={{ marginRight: 2 }}>📝</button>
                    <button onClick={() => deleteTask(task.id)}>❌</button>
                  </div>
                  {/* 备注 */}
                  {task.noteEditing ? (
                    <input type="text" value={task.note || ""} onChange={e => updateTaskNote(task.id, e.target.value)} onBlur={() => toggleNoteEdit(task.id)} placeholder="添加备注" style={{ width: "100%", margin: "2px 0", padding: 2, borderRadius: 4, border: "1px solid #ccc" }} />
                  ) : (
                    <div onClick={() => toggleNoteEdit(task.id)} style={{ fontSize: 12, color: "#555", cursor: "pointer", width: "100%", marginTop: 2 }}>
                      {task.note ? ` ${task.note}` : "点击添加备注"}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default App;
