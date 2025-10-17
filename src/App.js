import React, { useState, useRef, useEffect } from "react";
import { doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

const categories = [
  { name: "语文", color: "#4a90e2" },
  { name: "数学", color: "#357ABD" },
  { name: "英语", color: "#1e73be" },
  { name: "科学", color: "#00aaff" },
  { name: "体育", color: "#3399ff" },
];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
};

const getWeekDates = (monday) => {
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push({
      date: d.toISOString().split("T")[0],
      label: `周${"一二三四五六日"[i]}`,
    });
  }
  return weekDates;
};

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
  const [showAddInput, setShowAddInput] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const runningRefs = useRef({});
  const [runningState, setRunningState] = useState({});
  const touchStateRef = useRef({});
  const [swipedTask, setSwipedTask] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化用户ID
  useEffect(() => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = Date.now().toString();
      localStorage.setItem("userId", id);
    }
    setUserId(id);
  }, []);

  // 监听Firestore数据变化
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("连接超时，请检查网络后刷新");
    }, 10000);

    const userDocRef = doc(db, "userTasks", userId);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        clearTimeout(timeout);
        if (doc.exists()) {
          setTasksByDate(doc.data().tasks || {});
        } else {
          setDoc(userDocRef, { tasks: {} })
            .catch(e => console.error("初始化文档失败:", e));
        }
        setLoading(false);
      },
      (error) => {
        clearTimeout(timeout);
        console.error("数据监听错误:", error);
        setError("数据加载失败，请刷新重试");
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [userId]);

  const saveTasksToFirebase = async (updatedTasks) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, "userTasks", userId), {
        tasks: updatedTasks
      }, { merge: true });
      setError(null);
    } catch (error) {
      console.error("保存数据出错:", error);
      setError("保存数据失败，请检查网络连接");
    }
  };

  // 滑动删除处理
  const onTouchStart = (e, taskId) => {
    const touch = e.touches[0];
    touchStateRef.current[taskId] = { startX: touch.clientX, currentX: touch.clientX, swiping: false };
  };

  const onTouchMove = (e, taskId) => {
    const touch = e.touches[0];
    const state = touchStateRef.current[taskId];
    if (!state) return;
    const dx = touch.clientX - state.startX;
    state.currentX = touch.clientX;
    if (dx < -10) state.swiping = true;
  };

  const onTouchEnd = (e, taskId) => {
    const state = touchStateRef.current[taskId];
    if (!state) return;
    const dx = state.currentX - state.startX;
    if (dx < -70) setSwipedTask(taskId);
    else if (swipedTask === taskId) setSwipedTask(null);
    delete touchStateRef.current[taskId];
  };

  const tasks = tasksByDate[selectedDate] || [];
  const weekDates = getWeekDates(currentMonday);

  const handleAddTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    const newTask = {
      id: Date.now().toString(),
      text,
      category: newTaskCategory,
      done: false,
      timeSpent: 0,
      note: "",
    };
    const updatedTasks = { ...tasksByDate };
    if (!updatedTasks[selectedDate]) updatedTasks[selectedDate] = [];
    updatedTasks[selectedDate].push(newTask);
    saveTasksToFirebase(updatedTasks);
    setNewTaskText("");
    setShowAddInput(false);
  };

  const handleImportTasks = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let category = categories[0].name;
    for (const c of categories) {
      if (lines[0].includes(c.name)) {
        category = c.name;
        break;
      }
    }

    const taskLines = lines.slice(1);
    const newTasks = taskLines.map((line) => ({
      id: Date.now().toString() + Math.random(),
      text: line,
      category,
      done: false,
      timeSpent: 0,
      note: "",
    }));

    const updatedTasks = { ...tasksByDate };
    if (!updatedTasks[selectedDate]) updatedTasks[selectedDate] = [];
    updatedTasks[selectedDate] = [...updatedTasks[selectedDate], ...newTasks];
    saveTasksToFirebase(updatedTasks);
    setBulkText("");
    setShowBulkInput(false);
  };

  const toggleDone = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
      t.id === task.id ? { ...t, done: !t.done } : t
    );
    saveTasksToFirebase(updatedTasks);
  };

  const deleteTask = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].filter((t) => t.id !== task.id);
    saveTasksToFirebase(updatedTasks);
    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => {
        const newState = { ...prev };
        delete newState[task.id];
        return newState;
      });
    }
    if (swipedTask === task.id) setSwipedTask(null);
  };

  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务", task.text);
    if (newText !== null) {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, text: newText } : t
      );
      saveTasksToFirebase(updatedTasks);
    }
  };

  const editTaskNote = (task) => {
    const newNote = window.prompt("编辑备注", task.note || "");
    if (newNote !== null) {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, note: newNote } : t
      );
      saveTasksToFirebase(updatedTasks);
    }
  };

  const toggleTimer = (task) => {
    const isRunning = !!runningRefs.current[task.id];
    if (isRunning) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => ({ ...prev, [task.id]: false }));
    } else {
      runningRefs.current[task.id] = setInterval(() => {
        const updatedTasks = { ...tasksByDate };
        updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
          t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + 1 } : t
        );
        saveTasksToFirebase(updatedTasks);
      }, 1000);
      setRunningState((prev) => ({ ...prev, [task.id]: true }));
    }
  };

  const manualAddTime = (task) => {
    const minutes = parseInt(window.prompt("输入已完成的时间（分钟）"), 10);
    if (!isNaN(minutes) && minutes > 0) {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + minutes * 60 } : t
      );
      saveTasksToFirebase(updatedTasks);
    }
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const prevWeek = () => {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() - 7);
    setCurrentMonday(monday);
    setSelectedDate(monday.toISOString().split("T")[0]);
  };

  const nextWeek = () => {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() + 7);
    setCurrentMonday(monday);
    setSelectedDate(monday.toISOString().split("T")[0]);
  };

  const reloadPage = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>正在加载你的学习数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={reloadPage}>刷新页面</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 15, fontFamily: "sans-serif", backgroundColor: "#f5faff" }}>
      <h1 style={{ textAlign: "center", color: "#1a73e8", fontSize: 20 }}>📚 汤圆学习计划和打卡</h1>
      <div style={{ textAlign: "center", fontSize: 13, marginBottom: 10 }}>
        你已经打卡 {Object.keys(tasksByDate).length} 天，已累计完成 {Object.values(tasksByDate).flat().length} 个学习计划
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 5 }}>
        <button onClick={prevWeek} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", marginRight: 10 }}>⬅️</button>
        <span style={{ fontWeight: "bold", margin: "0 6px" }}>{currentMonday.getFullYear()}年 第{getWeekNumber(currentMonday)}周</span>
        <button onClick={nextWeek} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", marginLeft: 6 }}>➡️</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        {weekDates.map((d) => {
          const todayStr = new Date().toISOString().split("T")[0];
          return (
            <div
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              style={{
                padding: "4px 6px",
                borderBottom: d.date === selectedDate ? "2px solid #0b52b0" : "1px solid #ccc",
                textAlign: "center",
                flex: 1,
                margin: "0 2px",
                fontSize: 12,
                cursor: "pointer",
                backgroundColor: d.date === todayStr ? "#1a73e8" : "transparent",
                color: d.date === todayStr ? "#fff" : "#000",
              }}
            >
              <div>{d.label}</div>
              <div style={{ fontSize: 10 }}>{d.date.slice(5)}</div>
            </div>
          );
        })}
      </div>
      
      {/* 任务显示部分 */}
      {categories.map((c) => {
        const catTasks = tasks.filter((t) => t.category === c.name);
        if (catTasks.length === 0) return null;
        const progress = Math.round((catTasks.filter((t) => t.done).length / catTasks.length) * 100);
        return (
          <div key={c.name} style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", border: `2px solid ${c.color}`, backgroundColor: "#fff" }}>
            <div style={{ backgroundColor: c.color, color: "#fff", padding: "6px 10px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{c.name} ({progress}%)</span>
            </div>
            <ul style={{ listStyle: "none", padding: 10, margin: 0 }}>
              {catTasks.map((task) => {
                const isSwiped = swipedTask === task.id;
                return (
                  <li 
                    key={task.id} 
                    className={isSwiped ? "task-li-swiped" : ""} 
                    onTouchStart={(e) => onTouchStart(e, task.id)} 
                    onTouchMove={(e) => onTouchMove(e, task.id)} 
                    onTouchEnd={(e) => onTouchEnd(e, task.id)} 
                    style={{ 
                      position: "relative", 
                      overflow: "hidden", 
                      background: "#fff", 
                      borderRadius: 6, 
                      marginBottom: 8 
                    }}
                  >
                    <div style={{ 
                      transform: isSwiped ? "translateX(-80px)" : "translateX(0)", 
                      transition: "transform .18s ease", 
                      padding: "8px" 
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <input 
                          type="checkbox" 
                          checked={task.done} 
                          onChange={() => toggleDone(task)} 
                          style={{ marginTop: 6 }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div 
                            onClick={() => editTaskText(task)} 
                            style={{ 
                              wordBreak: "break-word", 
                              whiteSpace: "normal", 
                              cursor: "pointer", 
                              textDecoration: task.done ? "line-through" : "none", 
                              color: task.done ? "#999" : "#000" 
                            }}
                          >
                            {task.text}
                          </div>
                          {task.note && (
                            <div 
                              onClick={() => editTaskNote(task)} 
                              style={{ 
                                fontSize: 12, 
                                color: "#555", 
                                marginTop: 6, 
                                cursor: "pointer" 
                              }}
                            >
                              {task.note}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "flex-end", 
                        gap: 6, 
                        marginTop: 8, 
                        alignItems: "center" 
                      }}>
                        <div style={{ fontSize: 12, color: "#333", marginRight: 6 }}>
                          {formatTime(task.timeSpent)}
                        </div>
                        <button 
                          onClick={() => toggleTimer(task)} 
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            cursor: "pointer", 
                            padding: 6 
                          }}
                        >
                          {runningState[task.id] ? "⏸️" : "▶️"}
                        </button>
                        <button 
                          onClick={() => manualAddTime(task)} 
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            cursor: "pointer", 
                            padding: 6 
                          }}
                        > 
                          ➕ 
                        </button>
                        <button 
                          onClick={() => editTaskNote(task)} 
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            cursor: "pointer", 
                            padding: 6 
                          }}
                        > 
                          📝 
                        </button>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        position: "absolute", 
                        right: 0, 
                        top: 0, 
                        bottom: 0, 
                        width: 80, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        background: "#cde9ff", 
                        color: "#fff", 
                        transform: isSwiped ? "translateX(0)" : "translateX(80px)", 
                        transition: "transform .18s ease", 
                        cursor: "pointer" 
                      }} 
                      onClick={() => deleteTask(task)}
                    > 
                      ❌ 
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      
      {/* 输入框部分 */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button 
          onClick={() => setShowAddInput(!showAddInput)} 
          style={{ 
            flex: 1, 
            padding: 8, 
            backgroundColor: "#1a73e8", 
            color: "#fff", 
            border: "none", 
            borderRadius: 6 
          }}
        > 
          添加任务 
        </button>
        <button 
          onClick={() => setShowBulkInput(!showBulkInput)} 
          style={{ 
            flex: 1, 
            padding: 8, 
            backgroundColor: "#1a73e8", 
            color: "#fff", 
            border: "none", 
            borderRadius: 6 
          }}
        > 
          批量导入 
        </button>
      </div>
      
      {showAddInput && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input 
            type="text" 
            value={newTaskText} 
            onChange={(e) => setNewTaskText(e.target.value)} 
            placeholder="输入任务" 
            style={{ 
              flex: 1, 
              padding: 6, 
              borderRadius: 6, 
              border: "1px solid #ccc" 
            }} 
          />
          <select 
            value={newTaskCategory} 
            onChange={(e) => setNewTaskCategory(e.target.value)} 
            style={{ padding: 6 }}
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={handleAddTask} 
            style={{ 
              padding: "6px 10px", 
              backgroundColor: "#1a73e8", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6 
            }}
          > 
            确认 
          </button>
        </div>
      )}
      
      {showBulkInput && (
        <div style={{ marginTop: 8 }}>
          <textarea 
            value={bulkText} 
            onChange={(e) => setBulkText(e.target.value)} 
            placeholder="第一行写类别，其余每行一条任务" 
            style={{ 
              width: "100%", 
              minHeight: 80, 
              padding: 6, 
              borderRadius: 6, 
              border: "1px solid #ccc" 
            }} 
          />
          <button 
            onClick={handleImportTasks} 
            style={{ 
              marginTop: 6, 
              padding: 6, 
              width: "100%", 
              backgroundColor: "#1a73e8", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6 
            }}
          >
            导入任务
          </button>
        </div>
      )}
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginTop: 20, 
        padding: "8px 0", 
        backgroundColor: "#e8f0fe", 
        borderRadius: 10 
      }}>
        {[
          { label: "📘 学习时间", value: formatTime(tasks.filter((t) => t.category !== "体育").reduce((sum, t) => sum + (t.timeSpent || 0), 0)) },
          { label: "🏃‍♂️ 运动时间", value: formatTime(tasks.filter((t) => t.category === "体育").reduce((sum, t) => sum + (t.timeSpent || 0), 0)) },
          { label: "📝 任务数量", value: tasks.length },
          { label: "✅ 完成率", value: tasks.length > 0 ? `${Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)}%` : "0%" },
        ].map((item, idx) => (
          <div 
            key={idx} 
            style={{ 
              flex: 1, 
              textAlign: "center", 
              fontSize: 12, 
              borderRight: idx < 3 ? "1px solid #cce0ff" : "none", 
              padding: "4px 0" 
            }}
          >
            <div>{item.label}</div>
            <div style={{ fontWeight: "bold", marginTop: 2 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;