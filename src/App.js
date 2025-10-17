import React, { useState, useRef, useEffect } from "react";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

// 学科分类配置
const categories = [
  { name: "语文", color: "#4a90e2" },
  { name: "数学", color: "#357ABD" },
  { name: "英语", color: "#1e73be" },
  { name: "科学", color: "#00aaff" },
  { name: "体育", color: "#3399ff" },
];

// 获取当前周的周一日期
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
};

// 获取一周的日期数组
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

// 计算当前是第几周
const getWeekNumber = (date) => {
  const d = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + jan1.getDay() + 1) / 7);
};

// 格式化时间显示
const formatTime = (seconds) => {
  if (!seconds) return "0m 0s";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

function App() {
  // 状态管理
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
  const [dataSource, setDataSource] = useState("服务器");

  // 初始化用户ID
  useEffect(() => {
    let id = localStorage.getItem("userId");
    if (!id) {
      // 生成固定格式的用户ID确保跨浏览器一致
      id = `user_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("userId", id);
    }
    setUserId(id);
  }, []);

  // 实时数据监听
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    const userDocRef = doc(db, "userTasks", userId);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      { includeMetadataChanges: true }, // 包含元数据变化
      (doc) => {
        // 更新数据来源显示
        setDataSource(doc.metadata.fromCache ? "本地缓存" : "服务器");
        
        if (doc.exists()) {
          setTasksByDate(doc.data().tasks || {});
        } else {
          // 如果文档不存在，创建初始文档
          setDoc(userDocRef, { tasks: {} })
            .catch(e => console.error("初始化文档失败:", e));
        }
        setLoading(false);
      },
      (error) => {
        console.error("数据监听错误:", error);
        setError("数据同步失败，请检查网络连接");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // 保存数据到Firebase
  const saveTasksToFirebase = async (updatedTasks) => {
    if (!userId) return;
    
    try {
      await setDoc(
        doc(db, "userTasks", userId),
        { 
          tasks: updatedTasks,
          lastUpdated: new Date().toISOString() 
        },
        { merge: true } // 合并更新而不覆盖整个文档
      );
      setError(null);
    } catch (error) {
      console.error("保存数据出错:", error);
      setError("保存失败，请检查网络后重试");
    }
  };

  // 滑动删除相关处理函数
  const onTouchStart = (e, taskId) => {
    const touch = e.touches[0];
    touchStateRef.current[taskId] = { 
      startX: touch.clientX, 
      currentX: touch.clientX, 
      swiping: false 
    };
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
    if (dx < -70) {
      setSwipedTask(taskId);
    } else if (swipedTask === taskId) {
      setSwipedTask(null);
    }
    delete touchStateRef.current[taskId];
  };

  // 获取当前周日期和选中日期的任务
  const weekDates = getWeekDates(currentMonday);
  const tasks = tasksByDate[selectedDate] || [];

  // 添加新任务
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
      createdAt: new Date().toISOString()
    };

    const updatedTasks = { ...tasksByDate };
    if (!updatedTasks[selectedDate]) {
      updatedTasks[selectedDate] = [];
    }
    updatedTasks[selectedDate].push(newTask);
    
    saveTasksToFirebase(updatedTasks);
    setNewTaskText("");
    setShowAddInput(false);
  };

  // 批量导入任务
  const handleImportTasks = () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
      
    if (lines.length === 0) return;

    // 从第一行识别类别
    let category = categories[0].name;
    for (const c of categories) {
      if (lines[0].includes(c.name)) {
        category = c.name;
        break;
      }
    }

    // 生成任务列表
    const taskLines = lines.slice(1);
    const newTasks = taskLines.map((line, index) => ({
      id: `${Date.now()}_${index}`,
      text: line,
      category,
      done: false,
      timeSpent: 0,
      note: "",
      createdAt: new Date().toISOString()
    }));

    const updatedTasks = { ...tasksByDate };
    if (!updatedTasks[selectedDate]) {
      updatedTasks[selectedDate] = [];
    }
    updatedTasks[selectedDate] = [...updatedTasks[selectedDate], ...newTasks];
    
    saveTasksToFirebase(updatedTasks);
    setBulkText("");
    setShowBulkInput(false);
  };

  // 切换任务完成状态
  const toggleDone = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
      t.id === task.id ? { ...t, done: !t.done } : t
    );
    saveTasksToFirebase(updatedTasks);
  };

  // 删除任务
  const deleteTask = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].filter(
      (t) => t.id !== task.id
    );
    
    // 停止相关计时器
    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => {
        const newState = { ...prev };
        delete newState[task.id];
        return newState;
      });
    }
    
    // 重置滑动状态
    if (swipedTask === task.id) {
      setSwipedTask(null);
    }
    
    saveTasksToFirebase(updatedTasks);
  };

  // 编辑任务文本
  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务内容", task.text);
    if (newText !== null && newText.trim() !== "") {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, text: newText } : t
      );
      saveTasksToFirebase(updatedTasks);
    }
  };

  // 编辑任务备注
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

  // 启动/停止计时器
  const toggleTimer = (task) => {
    const isRunning = !!runningRefs.current[task.id];
    
    if (isRunning) {
      // 停止计时
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => ({ ...prev, [task.id]: false }));
    } else {
      // 开始计时
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

  // 手动添加时间
  const manualAddTime = (task) => {
    const input = window.prompt("输入已完成的时间（分钟）");
    if (!input) return;
    
    const minutes = parseInt(input, 10);
    if (!isNaN(minutes) && minutes > 0) {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { 
          ...t, 
          timeSpent: (t.timeSpent || 0) + minutes * 60 
        } : t
      );
      saveTasksToFirebase(updatedTasks);
    }
  };

  // 切换到上一周
  const prevWeek = () => {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() - 7);
    setCurrentMonday(monday);
    setSelectedDate(monday.toISOString().split("T")[0]);
  };

  // 切换到下一周
  const nextWeek = () => {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() + 7);
    setCurrentMonday(monday);
    setSelectedDate(monday.toISOString().split("T")[0]);
  };

  // 重新加载页面
  const reloadPage = () => {
    window.location.reload();
  };

  // 加载状态显示
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>正在加载你的学习数据...</p>
      </div>
    );
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={reloadPage}>刷新页面</button>
      </div>
    );
  }

  // 主界面渲染
  return (
    <div className="app-container">
      {/* 数据来源提示 */}
      <div className="data-source">
        数据状态: {dataSource}
        {dataSource === "本地缓存" && (
          <button onClick={reloadPage}>刷新获取最新数据</button>
        )}
      </div>

      <h1 className="app-title">📚 学习计划打卡</h1>
      
      <div className="stats-summary">
        已打卡 {Object.keys(tasksByDate).length} 天，累计完成{" "}
        {Object.values(tasksByDate).flat().filter((t) => t.done).length} 个任务
      </div>

      {/* 周导航 */}
      <div className="week-navigation">
        <button className="nav-button" onClick={prevWeek}>
          ⬅️
        </button>
        <span className="week-title">
          {currentMonday.getFullYear()}年 第{getWeekNumber(currentMonday)}周
        </span>
        <button className="nav-button" onClick={nextWeek}>
          ➡️
        </button>
      </div>

      {/* 日期选择器 */}
      <div className="date-selector">
        {weekDates.map((d) => {
          const todayStr = new Date().toISOString().split("T")[0];
          const isToday = d.date === todayStr;
          const isSelected = d.date === selectedDate;
          
          return (
            <div
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`date-item ${isToday ? "today" : ""} ${
                isSelected ? "selected" : ""
              }`}
            >
              <div className="day-label">{d.label}</div>
              <div className="date-number">{d.date.slice(5)}</div>
            </div>
          );
        })}
      </div>

      {/* 按学科分类显示任务 */}
      {categories.map((c) => {
        const catTasks = tasks.filter((t) => t.category === c.name);
        if (catTasks.length === 0) return null;
        
        const doneCount = catTasks.filter((t) => t.done).length;
        const progress = Math.round((doneCount / catTasks.length) * 100);
        
        return (
          <div
            key={c.name}
            className="category-container"
            style={{ borderColor: c.color }}
          >
            <div className="category-header" style={{ backgroundColor: c.color }}>
              <span>
                {c.name} ({progress}%)
              </span>
            </div>
            
            <ul className="task-list">
              {catTasks.map((task) => {
                const isSwiped = swipedTask === task.id;
                
                return (
                  <li
                    key={task.id}
                    className={`task-item ${isSwiped ? "swiped" : ""}`}
                    onTouchStart={(e) => onTouchStart(e, task.id)}
                    onTouchMove={(e) => onTouchMove(e, task.id)}
                    onTouchEnd={(e) => onTouchEnd(e, task.id)}
                  >
                    <div
                      className="task-content"
                      style={{ transform: isSwiped ? "translateX(-80px)" : "none" }}
                    >
                      <div className="task-main">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleDone(task)}
                          className="task-checkbox"
                        />
                        
                        <div className="task-text-container">
                          <div
                            onClick={() => editTaskText(task)}
                            className={`task-text ${task.done ? "completed" : ""}`}
                          >
                            {task.text}
                          </div>
                          
                          {task.note && (
                            <div
                              onClick={() => editTaskNote(task)}
                              className="task-note"
                            >
                              {task.note}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="task-controls">
                        <div className="task-time">
                          {formatTime(task.timeSpent)}
                        </div>
                        
                        <button
                          onClick={() => toggleTimer(task)}
                          className="control-button"
                        >
                          {runningState[task.id] ? "⏸️" : "▶️"}
                        </button>
                        
                        <button
                          onClick={() => manualAddTime(task)}
                          className="control-button"
                        >
                          ➕
                        </button>
                        
                        <button
                          onClick={() => editTaskNote(task)}
                          className="control-button"
                        >
                          📝
                        </button>
                      </div>
                    </div>
                    
                    <div
                      className="delete-button"
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

      {/* 任务操作按钮 */}
      <div className="action-buttons">
        <button
          onClick={() => setShowAddInput(!showAddInput)}
          className="action-button"
        >
          {showAddInput ? "取消" : "添加任务"}
        </button>
        
        <button
          onClick={() => setShowBulkInput(!showBulkInput)}
          className="action-button"
        >
          {showBulkInput ? "取消" : "批量导入"}
        </button>
      </div>

      {/* 添加任务表单 */}
      {showAddInput && (
        <div className="add-task-form">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="输入任务内容"
            className="task-input"
          />
          
          <select
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            className="category-select"
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          
          <button onClick={handleAddTask} className="submit-button">
            确认
          </button>
        </div>
      )}

      {/* 批量导入表单 */}
      {showBulkInput && (
        <div className="bulk-import-form">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="第一行写类别，其余每行一条任务"
            className="bulk-textarea"
          />
          
          <button onClick={handleImportTasks} className="submit-button">
            导入任务
          </button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="stats-container">
        {[
          {
            label: "📘 学习时间",
            value: formatTime(
              tasks
                .filter((t) => t.category !== "体育")
                .reduce((sum, t) => sum + (t.timeSpent || 0), 0)
            ),
          },
          {
            label: "🏃‍♂️ 运动时间",
            value: formatTime(
              tasks
                .filter((t) => t.category === "体育")
                .reduce((sum, t) => sum + (t.timeSpent || 0), 0)
            ),
          },
          {
            label: "📝 任务数量",
            value: tasks.length,
          },
          {
            label: "✅ 完成率",
            value:
              tasks.length > 0
                ? `${Math.round(
                    (tasks.filter((t) => t.done).length / tasks.length) * 100
                  )}%`
                : "0%",
          },
        ].map((item, idx) => (
          <div key={idx} className="stat-item">
            <div className="stat-label">{item.label}</div>
            <div className="stat-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;