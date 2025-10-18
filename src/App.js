import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// 手机端优化的LeanCloud配置
const initLeanCloud = () => {
  try {
    // 使用require避免import问题
    const { init, Query, Object: LCObject } = require('leancloud-storage');
    
    // 手机端专用配置
    const config = {
      appId: 'H2FWFi8F2AVzuk5TQl3jhFeU-gzGzoHsz',
      appKey: '4VRNjN9fEpzORScMIPbbKviZ',
      serverURLs: {
        engine: 'https://h2fwfi8f.lc-cn-n1-shared.com',
        api: 'https://h2fwfi8f.lc-cn-n1-shared.com',
        push: 'https://h2fwfi8f.lc-cn-n1-shared.com'
      }
    };
    
    init(config);
    console.log('LeanCloud初始化成功');
    return { init, Query, Object: LCObject };
  } catch (error) {
    console.error('LeanCloud初始化失败:', error);
    return null;
  }
};

// 全局LeanCloud实例
let leancloudInstance = null;
let isLCInitialized = false;

// 学科分类配置
const categories = [
  { name: "语文", color: "#4a90e2" },
  { name: "数学", color: "#357ABD" },
  { name: "英语", color: "#1e73be" },
  { name: "科学", color: "#00aaff" },
  { name: "体育", color: "#3399ff" },
];

// 工具函数保持不变
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
  const [dataSource, setDataSource] = useState("本地存储");
  const [connectionStatus, setConnectionStatus] = useState("检测中...");

  // 初始化用户ID和LeanCloud
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. 初始化用户ID
        let user = localStorage.getItem('study_user_id');
        if (!user) {
          user = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('study_user_id', user);
        }
        setUserId(user);

        // 2. 初始化LeanCloud（只在需要时加载）
        const lc = initLeanCloud();
        if (lc) {
          leancloudInstance = lc;
          isLCInitialized = true;
          
          // 测试连接
          try {
            const query = new lc.Query('Task');
            query.limit(1);
            await query.find();
            setConnectionStatus("已连接云端");
            setDataSource("云端服务器");
          } catch (testError) {
            console.log('LeanCloud连接测试失败，使用本地模式');
            setConnectionStatus("本地模式");
            setDataSource("本地存储");
          }
        } else {
          setConnectionStatus("本地模式");
          setDataSource("本地存储");
        }

        // 3. 加载本地数据
        const savedData = localStorage.getItem(`study_data_${user}`);
        if (savedData) {
          setTasksByDate(JSON.parse(savedData));
        }

        setLoading(false);
      } catch (err) {
        console.error('应用初始化失败:', err);
        setConnectionStatus("本地模式");
        setDataSource("本地存储");
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // 保存数据到本地存储
  const saveToLocalStorage = (data) => {
    if (!userId) return;
    try {
      localStorage.setItem(`study_data_${userId}`, JSON.stringify(data));
      setTasksByDate(data);
    } catch (err) {
      console.error('保存到本地存储失败:', err);
    }
  };

  // 尝试保存到LeanCloud（失败时自动回退到本地）
  const saveData = async (updatedTasks) => {
    if (isLCInitialized && leancloudInstance) {
      try {
        // 尝试保存到LeanCloud
        const { Object: LCObject } = leancloudInstance;
        const tasksToSave = updatedTasks[selectedDate] || [];
        
        for (const task of tasksToSave) {
          const Task = LCObject.extend('Task');
          const taskObj = task.id ? Task.createWithoutData(task.id) : new Task();
          await taskObj.save({
            ...task,
            userId,
            date: selectedDate
          });
        }
        setDataSource("云端服务器");
      } catch (err) {
        console.warn('保存到LeanCloud失败，使用本地存储:', err);
        saveToLocalStorage(updatedTasks);
        setDataSource("本地存储");
      }
    } else {
      saveToLocalStorage(updatedTasks);
    }
  };

  // 添加新任务
  const handleAddTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    
    const newTask = {
      id: `task_${Date.now()}`,
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
    
    saveData(updatedTasks);
    setNewTaskText("");
    setShowAddInput(false);
  };

  // 切换任务完成状态
  const toggleDone = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
      t.id === task.id ? { ...t, done: !t.done } : t
    );
    saveData(updatedTasks);
  };

  // 删除任务
  const deleteTask = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].filter(
      (t) => t.id !== task.id
    );
    
    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => {
        const newState = { ...prev };
        delete newState[task.id];
        return newState;
      });
    }
    
    saveData(updatedTasks);
  };

  // 编辑任务文本
  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务内容", task.text);
    if (newText !== null && newText.trim() !== "") {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, text: newText } : t
      );
      saveData(updatedTasks);
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
      saveData(updatedTasks);
    }
  };

  // 启动/停止计时器
  const toggleTimer = (task) => {
    const isRunning = !!runningRefs.current[task.id];
    
    if (isRunning) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => ({ ...prev, [task.id]: false }));
    } else {
      runningRefs.current[task.id] = setInterval(() => {
        setTasksByDate(prev => {
          const updatedTasks = { ...prev };
          updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
            t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + 1 } : t
          );
          saveToLocalStorage(updatedTasks);
          return updatedTasks;
        });
      }, 1000);
      setRunningState((prev) => ({ ...prev, [task.id]: true }));
    }
  };

  // 手动添加时间
  const manualAddTime = (task) => {
    const minutes = parseInt(window.prompt("输入已完成的时间（分钟）"), 10);
    if (!isNaN(minutes) && minutes > 0) {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + minutes * 60 } : t
      );
      saveData(updatedTasks);
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

  // 重新测试连接
  const retryConnection = async () => {
    setConnectionStatus("重新连接中...");
    try {
      const lc = initLeanCloud();
      if (lc) {
        leancloudInstance = lc;
        isLCInitialized = true;
        
        const query = new lc.Query('Task');
        query.limit(1);
        await query.find();
        setConnectionStatus("已连接云端");
        setDataSource("云端服务器");
      } else {
        setConnectionStatus("本地模式");
      }
    } catch (error) {
      setConnectionStatus("本地模式");
      setDataSource("本地存储");
    }
  };

  // 加载状态显示
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>正在初始化...</p>
      </div>
    );
  }

  const weekDates = getWeekDates(currentMonday);
  const tasks = tasksByDate[selectedDate] || [];

  return (
    <div className="app-container">
      {/* 连接状态显示 */}
      <div className="connection-status">
        <span>状态: {connectionStatus}</span>
        {connectionStatus.includes("本地") && (
          <button onClick={retryConnection} className="retry-button">
            重试连接
          </button>
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
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      touchStateRef.current[task.id] = { 
                        startX: touch.clientX,
                        currentX: touch.clientX,
                        swiping: false
                      };
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const state = touchStateRef.current[task.id];
                      if (!state) return;
                      
                      const dx = touch.clientX - state.startX;
                      state.currentX = touch.clientX;
                      if (dx < -10) state.swiping = true;
                    }}
                    onTouchEnd={(e) => {
                      const state = touchStateRef.current[task.id];
                      if (!state) return;
                      
                      const dx = state.currentX - state.startX;
                      if (dx < -70) {
                        setSwipedTask(task.id);
                      } else if (swipedTask === task.id) {
                        setSwipedTask(null);
                      }
                      delete touchStateRef.current[task.id];
                    }}
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
                          
                          <div className="task-time">
                            {formatTime(task.timeSpent)}
                          </div>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button onClick={() => toggleTimer(task)}>
                          {runningState[task.id] ? "停止计时" : "开始计时"}
                        </button>
                        <button onClick={() => manualAddTime(task)}>添加时间</button>
                        <button onClick={() => deleteTask(task)}>删除</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* 新任务输入 */}
      {showAddInput && (
        <div className="new-task-input">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="输入新任务"
            autoFocus
          />
          <select
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddTask}>添加任务</button>
          <button onClick={() => setShowAddInput(false)}>取消</button>
        </div>
      )}

      {/* 底部操作按钮 */}
      <div className="action-buttons">
        <button onClick={() => setShowAddInput(true)}>添加新任务</button>
        <button onClick={retryConnection}>重新连接</button>
      </div>
    </div>
  );
}

export default App;