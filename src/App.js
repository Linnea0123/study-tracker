import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// 直接引入LeanCloud
const { init, Object: LCObject, Query, User } = require('leancloud-storage');

// 初始化LeanCloud
try {
  init({
    appId: 'H2FWFi8F2AVzuk5TQl3jhFeU-gzGzoHsz',
    appKey: '4VRNjN9fEpzORScMIPbbKviZ',
    serverURLs: 'https://h2fwfi8f.lc-cn-n1-shared.com',
    debug: true // 开启调试模式
  });
  console.log('LeanCloud初始化成功');
} catch (error) {
  console.error('LeanCloud初始化失败:', error);
}

// 定义Task类
class Task extends LCObject {
  constructor() {
    super('Task');
  }
}

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
  const [dataSource, setDataSource] = useState("本地存储");
  const [connectionStatus, setConnectionStatus] = useState("检测中...");

  // 初始化用户ID
  useEffect(() => {
    const initUser = async () => {
      try {
        // 先尝试从本地存储获取用户ID
        const savedUserId = localStorage.getItem('studyTrackerUserId');
        if (savedUserId) {
          setUserId(savedUserId);
          setLoading(false);
          return;
        }
        
        // 创建新的用户ID
        const newUserId = `user_${Date.now()}`;
        setUserId(newUserId);
        localStorage.setItem('studyTrackerUserId', newUserId);
        setLoading(false);
      } catch (err) {
        console.error("用户初始化失败:", err);
        const localUserId = `local_${Date.now()}`;
        setUserId(localUserId);
        localStorage.setItem('studyTrackerUserId', localUserId);
        setLoading(false);
      }
    };
    
    initUser();
  }, []);

  // 测试LeanCloud连接
  useEffect(() => {
    const testConnection = async () => {
      try {
        const query = new Query('Task');
        query.limit(1);
        await query.find();
        setConnectionStatus("已连接云端");
        setDataSource("云端服务器");
      } catch (error) {
        console.log("LeanCloud连接失败，使用本地存储");
        setConnectionStatus("本地模式");
        setDataSource("本地存储");
      }
    };

    if (userId) {
      testConnection();
    }
  }, [userId]);

  // 从本地存储加载数据
  useEffect(() => {
    if (!userId) return;

    const loadTasks = () => {
      try {
        const saved = localStorage.getItem(`studyTrackerData_${userId}`);
        if (saved) {
          setTasksByDate(JSON.parse(saved));
        }
        setError(null);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };

    loadTasks();
  }, [userId]);

  // 保存数据到本地存储
  const saveTasksToLocal = (updatedTasks) => {
    if (!userId) return;
    
    try {
      localStorage.setItem(`studyTrackerData_${userId}`, JSON.stringify(updatedTasks));
      setTasksByDate(updatedTasks);
    } catch (error) {
      console.error("保存数据出错:", error);
      setError("保存失败");
    }
  };

  // 触摸事件处理函数
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
    
    saveTasksToLocal(updatedTasks);
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
      id: `task_${Date.now()}_${index}`,
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
    
    saveTasksToLocal(updatedTasks);
    setBulkText("");
    setShowBulkInput(false);
  };

  // 切换任务完成状态
  const toggleDone = (task) => {
    const updatedTasks = { ...tasksByDate };
    updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
      t.id === task.id ? { ...t, done: !t.done } : t
    );
    saveTasksToLocal(updatedTasks);
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
    
    saveTasksToLocal(updatedTasks);
  };

  // 编辑任务文本
  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务内容", task.text);
    if (newText !== null && newText.trim() !== "") {
      const updatedTasks = { ...tasksByDate };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
        t.id === task.id ? { ...t, text: newText } : t
      );
      saveTasksToLocal(updatedTasks);
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
      saveTasksToLocal(updatedTasks);
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
        setTasksByDate(prev => {
          const updatedTasks = { ...prev };
          updatedTasks[selectedDate] = updatedTasks[selectedDate].map((t) =>
            t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + 1 } : t
          );
          // 立即保存到本地存储
          localStorage.setItem(`studyTrackerData_${userId}`, JSON.stringify(updatedTasks));
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
      saveTasksToLocal(updatedTasks);
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

  // 测试连接按钮功能
  const testConnection = async () => {
    try {
      const query = new Query('Task');
      query.limit(1);
      const result = await query.find();
      setConnectionStatus("已连接云端");
      setDataSource("云端服务器");
      alert('✅ LeanCloud连接成功！');
    } catch (error) {
      setConnectionStatus("本地模式");
      setDataSource("本地存储");
      alert('❌ LeanCloud连接失败，使用本地存储模式');
    }
  };

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(tasksByDate, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `学习数据_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入数据
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setTasksByDate(data);
        saveTasksToLocal(data);
        alert('数据导入成功！');
      } catch (error) {
        alert('数据导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
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

  // 获取当前周日期和选中日期的任务
  const weekDates = getWeekDates(currentMonday);
  const tasks = tasksByDate[selectedDate] || [];

  return (
    <div className="app-container">
      {/* 连接状态显示 */}
      <div className="connection-status">
        <span>连接状态: {connectionStatus}</span>
        <button onClick={testConnection} className="retry-button">
          测试连接
        </button>
      </div>

      {/* 数据来源提示 */}
      <div className="data-source">
        数据状态: {dataSource}
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
                          
                          <div className="task-time">
                            {formatTime(task.timeSpent)}
                          </div>
                        </div>
                      </div>

                      {/* 编辑任务功能 */}
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

      {/* 批量导入任务 */}
      {showBulkInput && (
        <div className="bulk-input">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="每行一个任务，第一行可以是学科名称"
            rows={5}
          />
          <button onClick={handleImportTasks}>导入任务</button>
          <button onClick={() => setShowBulkInput(false)}>取消</button>
        </div>
      )}

      {/* 数据导入导出 */}
      <div className="data-actions">
        <button onClick={exportData} className="export-button">导出数据</button>
        <label htmlFor="import-file" className="import-button">
          导入数据
          <input 
            id="import-file" 
            type="file" 
            accept=".json" 
            onChange={importData} 
            style={{display: 'none'}}
          />
        </label>
      </div>

      {/* 底部操作按钮 */}
      <div className="action-buttons">
        <button onClick={() => setShowAddInput(true)}>添加新任务</button>
        <button onClick={() => setShowBulkInput(true)}>批量导入</button>
        <button onClick={reloadPage}>刷新页面</button>
      </div>
    </div>
  );
}

export default App;