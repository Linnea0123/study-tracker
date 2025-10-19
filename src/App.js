import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';

// 获取周数
const getWeekNumber = (date) => {
  const d = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + jan1.getDay() + 1) / 7);
};

const categories = [
  { name: "语文", color: "#4a90e2" },
  { name: "数学", color: "#357ABD" },
  { name: "英语", color: "#1e73be" },
  { name: "科学", color: "#00aaff" },
  { name: "体育", color: "#3399ff" },
];

// 获取本周一的日期
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
};

// 获取一周的日期
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

// 格式化时间显示
const formatTime = (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

function App() {
  const [tasksByDate, setTasksByDate] = useState({});
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState(categories[0].name);
  const [bulkText, setBulkText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsMode, setStatsMode] = useState("week"); // week/month/custom
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const runningRefs = useRef({});
  const [runningState, setRunningState] = useState({});
  const touchStateRef = useRef({});
  const [swipedTask, setSwipedTask] = useState(null);
  const [showImageModal, setShowImageModal] = useState(null);
  const [repeatConfig, setRepeatConfig] = useState({
    frequency: "daily",
    days: [false, false, false, false, false, false, false],
    startTime: "",
    endTime: ""
  });
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // 初始化数据
  useEffect(() => {
    const saved = localStorage.getItem("tasksByDate");
    if (saved) setTasksByDate(JSON.parse(saved));
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  const tasks = tasksByDate[selectedDate] || [];
  const weekDates = getWeekDates(currentMonday);

  // 判断分类是否全部完成
  const isCategoryComplete = (catName) => {
    const catTasks = getCategoryTasks(catName);
    if (catTasks.length === 0) return false;
    return catTasks.every(task => task.done);
  };

  // 计算统计数据
  const calculateStats = (dateRange) => {
    const stats = {
      totalTime: 0,
      byCategory: {},
      byDay: {},
      tasksByDay: {},
      completionRates: [],
      dailyTimes: []
    };

    dateRange.forEach(date => {
      const dayTasks = tasksByDate[date] || [];
      let dayTotal = 0;
      let completedTasks = 0;

      dayTasks.forEach(task => {
        stats.totalTime += task.timeSpent || 0;
        dayTotal += task.timeSpent || 0;

        if (!stats.byCategory[task.category]) {
          stats.byCategory[task.category] = 0;
        }
        stats.byCategory[task.category] += task.timeSpent || 0;

        if (task.done) completedTasks++;
      });

      stats.byDay[date] = dayTotal;
      stats.tasksByDay[date] = completedTasks;
      
      if (dayTasks.length > 0) {
        stats.completionRates.push((completedTasks / dayTasks.length) * 100);
      }
      
      stats.dailyTimes.push(dayTotal);
    });

    return stats;
  };

  // 生成图表数据（分钟取整）
  const generateChartData = () => {
    let dateRange = [];
    if (statsMode === "week") {
      dateRange = weekDates.map(d => d.date);
    } else if (statsMode === "month") {
      const firstDay = new Date(currentMonday);
      firstDay.setDate(1);
      const lastDay = new Date(firstDay);
      lastDay.setMonth(lastDay.getMonth() + 1);
      lastDay.setDate(0);
      
      dateRange = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        dateRange.push(d.toISOString().split("T")[0]);
      }
    } else {
      // Custom date range would be handled here
    }

    const stats = calculateStats(dateRange);

    return {
      dailyStudyData: Object.entries(stats.byDay).map(([date, time]) => ({
        name: `${new Date(date).getDate()}日`,
        time: Math.round(time / 60),
        date: date.slice(5)
      })),
      categoryData: categories.map(cat => ({
        name: cat.name,
        time: Math.round((stats.byCategory[cat.name] || 0) / 60),
        color: cat.color
      })),
      dailyTasksData: Object.entries(stats.tasksByDay).map(([date, count]) => ({
        name: `${new Date(date).getDate()}日`,
        tasks: count,
        date: date.slice(5)
      })),
      avgCompletion: stats.completionRates.length > 0 ? 
        Math.round(stats.completionRates.reduce((a, b) => a + b, 0) / stats.completionRates.length) : 0,
      avgDailyTime: stats.dailyTimes.length > 0 ? 
        Math.round(stats.dailyTimes.reduce((a, b) => a + b, 0) / stats.dailyTimes.length / 60) : 0
    };
  };

  // 添加任务
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
      image: null,
      scheduledTime: repeatConfig.startTime && repeatConfig.endTime ? 
        `${repeatConfig.startTime}-${repeatConfig.endTime}` : ""
    };

    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newTask]
    }));

    setNewTaskText("");
    setShowAddInput(false);
  };

  // 批量导入任务
  const handleImportTasks = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let category = categories[0].name;
    for (const c of categories) {
      if (lines[0].includes(c.name)) {
        category = c.name;
        break;
      }
    }

    const newTasks = lines.slice(1).map(line => ({
      id: Date.now().toString() + Math.random(),
      text: line,
      category,
      done: false,
      timeSpent: 0,
      note: "",
      image: null,
      scheduledTime: repeatConfig.startTime && repeatConfig.endTime ? 
        `${repeatConfig.startTime}-${repeatConfig.endTime}` : ""
    }));

    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), ...newTasks]
    }));

    setBulkText("");
    setShowBulkInput(false);
  };

  // 切换任务完成状态
  const toggleDone = (task) => {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? { ...t, done: !t.done } : t
      )
    }));
  };

  // 删除任务
  const deleteTask = (task) => {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].filter(t => t.id !== task.id)
    }));

    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState(prev => ({ ...prev, [task.id]: false }));
    }

    if (swipedTask === task.id) setSwipedTask(null);
  };

  // 编辑任务文本
  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务", task.text);
    if (newText !== null) {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, text: newText } : t
        )
      }));
    }
  };

  // 编辑任务备注
  const editTaskNote = (task) => {
    const newNote = window.prompt("编辑备注", task.note || "");
    if (newNote !== null) {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, note: newNote } : t
        )
      }));
    }
  };

  // 上传任务图片
  const handleImageUpload = (e, task) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, image: event.target.result } : t
        )
      }));
    };
    reader.readAsDataURL(file);
  };

  // 删除任务图片
  const removeImage = (task) => {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? { ...t, image: null } : t
      )
    }));
  };

  // 切换计时器
  const toggleTimer = (task) => {
    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState(prev => ({ ...prev, [task.id]: false }));
    } else {
      runningRefs.current[task.id] = setInterval(() => {
        setTasksByDate(prev => ({
          ...prev,
          [selectedDate]: prev[selectedDate].map(t =>
            t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + 1 } : t
          )
        }));
      }, 1000);
      setRunningState(prev => ({ ...prev, [task.id]: true }));
    }
  };

  // 手动添加时间
  const manualAddTime = (task) => {
    const minutes = parseInt(window.prompt("输入已完成的时间（分钟）"), 10);
    if (!isNaN(minutes) && minutes > 0) {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, timeSpent: (t.timeSpent || 0) + minutes * 60 } : t
        )
      }));
    }
  };

  // 获取分类任务
  const getCategoryTasks = (catName) =>
    tasks.filter(t => t.category === catName);

  // 计算分类完成进度
  const calcProgress = (catName) => {
    const catTasks = getCategoryTasks(catName);
    if (catTasks.length === 0) return 0;
    const doneCount = catTasks.filter(t => t.done).length;
    return Math.round((doneCount / catTasks.length) * 100);
  };

  // 计算分类总时间
  const totalTime = (catName) =>
    getCategoryTasks(catName).reduce((sum, t) => sum + (t.timeSpent || 0), 0);

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

  // 触摸事件处理
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
    state.currentX = touch.clientX;
    if (touch.clientX - state.startX < -10) state.swiping = true;
  };

  const onTouchEnd = (e, taskId) => {
    const state = touchStateRef.current[taskId];
    if (!state) return;
    const dx = state.currentX - state.startX;
    if (dx < -70) setSwipedTask(taskId);
    else if (swipedTask === taskId) setSwipedTask(null);
    delete touchStateRef.current[taskId];
  };

  // 点击文档关闭滑动删除
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest(".task-li-swiped")) setSwipedTask(null);
    };
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  // 清空所有数据
  const clearAllData = () => {
    if (window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
      setTasksByDate({});
      localStorage.removeItem("tasksByDate");
    }
  };

  // 计算今日统计数据
  const todayTasks = tasksByDate[selectedDate] || [];
  const learningTime = todayTasks
    .filter(t => t.category !== "体育")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const sportTime = todayTasks
    .filter(t => t.category === "体育")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const totalTasks = todayTasks.length;
  const completionRate = totalTasks === 0 ? 0 : 
    Math.round((todayTasks.filter(t => t.done).length / totalTasks) * 100);

  const { dailyStudyData, categoryData, dailyTasksData, avgCompletion, avgDailyTime } = generateChartData();

  // 任务项组件
  const TaskItem = ({ task }) => {
    const [showImage, setShowImage] = useState(false);
  
    return (
      <li
        className={swipedTask === task.id ? "task-li-swiped" : ""}
        onTouchStart={(e) => onTouchStart(e, task.id)}
        onTouchMove={(e) => onTouchMove(e, task.id)}
        onTouchEnd={(e) => onTouchEnd(e, task.id)}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#fff",
          borderRadius: 6,
          marginBottom: 8,
          padding: "8px"
        }}
      >
        <div style={{ 
          transform: swipedTask === task.id ? "translateX(-80px)" : "translateX(0)",
          transition: "transform .18s ease"
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
                  color: task.done ? "#999" : "#000",
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
                    marginTop: 4,
                    marginBottom: 4,
                    cursor: "pointer"
                  }}
                >
                  {task.note}
                </div>
              )}
              {task.scheduledTime && (
                <div style={{ 
                  fontSize: 12,
                  color: "#888",
                  marginBottom: 4
                }}>
                  ⏰ {task.scheduledTime}
                </div>
              )}
              {task.image && showImage && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={task.image}
                    alt="任务图片"
                    onClick={() => setShowImageModal(task.image)}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      borderRadius: 4,
                      cursor: "zoom-in"
                    }}
                  />
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
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
            >
              {runningState[task.id] ? "⏸️" : "▶️"}
            </button>
            <button
              onClick={() => manualAddTime(task)}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
            >
              ➕
            </button>
            {task.image && (
              <button
                onClick={() => setShowImage(!showImage)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
              >
                {showImage ? "🖼️▲" : "🖼️▼"}
              </button>
            )}
            {!task.image && (
              <label style={{ cursor: "pointer", padding: 6 }}>
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, task)}
                  style={{ display: "none" }}
                />
              </label>
            )}
            <button
              onClick={() => editTaskNote(task)}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
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
            transform: swipedTask === task.id ? "translateX(0)" : "translateX(80px)",
            transition: "transform .18s ease",
            cursor: "pointer",
          }}
          onClick={() => deleteTask(task)}
        >
          ❌
        </div>
      </li>
    );
  };

  // 重复设置模态框
  const RepeatModal = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        maxWidth: 350
      }}>
        <h3 style={{ textAlign: "center", marginBottom: 15 }}>设置重复</h3>
        
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>重复频率:</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setRepeatConfig(prev => ({ ...prev, frequency: "daily" }))}
              style={{
                padding: "6px 12px",
                background: repeatConfig.frequency === "daily" ? "#1a73e8" : "#eee",
                color: repeatConfig.frequency === "daily" ? "#fff" : "#000",
                border: "none",
                borderRadius: 4
              }}
            >
              每天
            </button>
            <button
              onClick={() => setRepeatConfig(prev => ({ ...prev, frequency: "weekly" }))}
              style={{
                padding: "6px 12px",
                background: repeatConfig.frequency === "weekly" ? "#1a73e8" : "#eee",
                color: repeatConfig.frequency === "weekly" ? "#fff" : "#000",
                border: "none",
                borderRadius: 4
              }}
            >
              每周
            </button>
            <button
              onClick={() => setRepeatConfig(prev => ({ ...prev, frequency: "monthly" }))}
              style={{
                padding: "6px 12px",
                background: repeatConfig.frequency === "monthly" ? "#1a73e8" : "#eee",
                color: repeatConfig.frequency === "monthly" ? "#fff" : "#000",
                border: "none",
                borderRadius: 4
              }}
            >
              每月
            </button>
          </div>
        </div>
        
        {repeatConfig.frequency === "weekly" && (
          <div style={{ marginBottom: 15 }}>
            <div style={{ marginBottom: 8 }}>选择星期:</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["一", "二", "三", "四", "五", "六", "日"].map((day, i) => (
                <button
                  key={day}
                  onClick={() => {
                    const newDays = [...repeatConfig.days];
                    newDays[i] = !newDays[i];
                    setRepeatConfig(prev => ({ ...prev, days: newDays }));
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    background: repeatConfig.days[i] ? "#1a73e8" : "#eee",
                    color: repeatConfig.days[i] ? "#fff" : "#000",
                    border: "none",
                    borderRadius: 4
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => setShowRepeatModal(false)}
            style={{
              padding: "8px 16px",
              background: "#ccc",
              color: "#000",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            取消
          </button>
          <button
            onClick={() => setShowRepeatModal(false)}
            style={{
              padding: "8px 16px",
              background: "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );

  // 时间设置模态框
  const TimeModal = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        maxWidth: 350
      }}>
        <h3 style={{ textAlign: "center", marginBottom: 15 }}>设置计划时间</h3>
        
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>开始时间:</div>
          <input
            type="time"
            value={repeatConfig.startTime}
            onChange={(e) => setRepeatConfig(prev => ({ ...prev, startTime: e.target.value }))}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>结束时间:</div>
          <input
            type="time"
            value={repeatConfig.endTime}
            onChange={(e) => setRepeatConfig(prev => ({ ...prev, endTime: e.target.value }))}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>
        
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => setShowTimeModal(false)}
            style={{
              padding: "8px 16px",
              background: "#ccc",
              color: "#000",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            取消
          </button>
          <button
            onClick={() => setShowTimeModal(false)}
            style={{
              padding: "8px 16px",
              background: "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );

  // 图片查看模态框
  const ImageModal = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.9)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }} onClick={() => setShowImageModal(null)}>
      <img 
        src={showImageModal} 
        alt="预览" 
        style={{ 
          maxWidth: "90%", 
          maxHeight: "90%",
          objectFit: "contain"
        }} 
      />
    </div>
  );

  // 统计页面
  const StatsPage = () => {
    const chartHeight = window.innerWidth <= 768 ? 200 : 300;
    const fontSize = window.innerWidth <= 768 ? 10 : 12;

    return (
      <div style={{ 
        maxWidth: 600, 
        margin: "0 auto", 
        padding: 15, 
        fontFamily: "sans-serif", 
        backgroundColor: "#f5faff" 
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 20 
        }}>
          <button
            onClick={() => setShowStats(false)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 20
            }}
          >
            ⬅️
          </button>
          <h1 style={{ 
            textAlign: "center", 
            color: "#1a73e8", 
            fontSize: 20 
          }}>
            {statsMode === "week" ? "本周统计" : statsMode === "month" ? "本月统计" : "自选统计"}
          </h1>
          <div style={{ width: 20 }}></div> {/* 占位 */}
        </div>

        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: 10, 
          marginBottom: 20 
        }}>
          <button
            onClick={() => setStatsMode("week")}
            style={{
              padding: "6px 12px",
              background: statsMode === "week" ? "#1a73e8" : "#eee",
              color: statsMode === "week" ? "#fff" : "#000",
              border: "none",
              borderRadius: 4
            }}
          >
            本周
          </button>
          <button
            onClick={() => setStatsMode("month")}
            style={{
              padding: "6px 12px",
              background: statsMode === "month" ? "#1a73e8" : "#eee",
              color: statsMode === "month" ? "#fff" : "#000",
              border: "none",
              borderRadius: 4
            }}
          >
            本月
          </button>
          <button
            onClick={() => setStatsMode("custom")}
            style={{
              padding: "6px 12px",
              background: statsMode === "custom" ? "#1a73e8" : "#eee",
              color: statsMode === "custom" ? "#fff" : "#000",
              border: "none",
              borderRadius: 4
            }}
          >
            自选
          </button>
        </div>

        {statsMode === "custom" && (
          <div style={{ 
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 10,
            marginBottom: 20
          }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ marginBottom: 5 }}>选择日期范围:</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" style={{ flex: 1, padding: 8 }} />
                <span style={{ lineHeight: "36px" }}>至</span>
                <input type="date" style={{ flex: 1, padding: 8 }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ marginBottom: 5 }}>选择类别:</div>
              <select style={{ width: "100%", padding: 8 }}>
                <option value="">全部类别</option>
                {categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              style={{
                width: "100%",
                padding: 10,
                background: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: 5
              }}
            >
              生成统计
            </button>
          </div>
        )}

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: 20, 
          padding: "8px 0", 
          backgroundColor: "#e8f0fe", 
          borderRadius: 10 
        }}>
          {[
            { label: "📊 平均完成率", value: `${avgCompletion}%` },
            { label: "⏱️ 日均时长", value: `${avgDailyTime}m` }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 12,
                borderRight: idx < 1 ? "1px solid #cce0ff" : "none",
                padding: "4px 0"
              }}
            >
              <div>{item.label}</div>
              <div style={{ fontWeight: "bold", marginTop: 2 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* 1. 每日学习时间柱状图 */}
        <div style={{ height: chartHeight, marginBottom: 30 }}>
          <h3 style={{ textAlign: "center", marginBottom: 10, fontSize: fontSize + 2 }}>
            每日学习时间
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={dailyStudyData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Bar 
                dataKey="time" 
                fill="#1a73e8" 
                radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* 2. 各科目学习时间柱状图 */}
        <div style={{ height: chartHeight, marginBottom: 30 }}>
          <h3 style={{ textAlign: "center", marginBottom: 10, fontSize: fontSize + 2 }}>
            各科目学习时间
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={categoryData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Bar 
                dataKey="time" 
                fill="#4a90e2"
                radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* 3. 每日完成任务数柱状图 */}
        <div style={{ height: chartHeight }}>
          <h3 style={{ textAlign: "center", marginBottom: 10, fontSize: fontSize + 2 }}>
            每日完成任务数
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={dailyTasksData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Bar 
                dataKey="tasks" 
                fill="#00a854" 
                radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (showStats) {
    return <StatsPage />;
  }

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: "0 auto", 
      padding: 15, 
      fontFamily: "sans-serif", 
      backgroundColor: "#f5faff" 
    }}>
      {showImageModal && <ImageModal />}
      {showRepeatModal && <RepeatModal />}
      {showTimeModal && <TimeModal />}
      
      <h1 style={{ 
        textAlign: "center", 
        color: "#1a73e8", 
        fontSize: 20 
      }}>
        📚 学习打卡系统
      </h1>
      <div style={{ 
        textAlign: "center", 
        fontSize: 13, 
        marginBottom: 10 
      }}>
        你已经打卡 {Object.keys(tasksByDate).length} 天，已累计完成 {Object.values(tasksByDate).flat().length} 个学习计划
      </div>

      <div style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        alignItems: "center", 
        marginBottom: 5 
      }}>
        <button
          onClick={prevWeek}
          style={{
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            marginRight: 10
          }}
        >
          ⬅️
        </button>
        <span style={{ 
          fontWeight: "bold", 
          margin: "0 6px" 
        }}>
          {currentMonday.getFullYear()}年 第{getWeekNumber(currentMonday)}周
        </span>
        <button
          onClick={nextWeek}
          style={{
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            marginLeft: 6
          }}
        >
          ➡️
        </button>
      </div>

      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: 10 
      }}>
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

      {categories.map((c) => {
        const catTasks = getCategoryTasks(c.name);
        if (catTasks.length === 0) return null;
        const isComplete = isCategoryComplete(c.name);
        const progress = calcProgress(c.name);
        const isCollapsed = collapsedCategories[c.name];

        return (
          <div 
            key={c.name}
            style={{ 
              marginBottom: 12,
              borderRadius: 10,
              overflow: "hidden",
              border: `2px solid ${isComplete ? "#ccc" : c.color}`,
              backgroundColor: "#fff"
            }}
          >
            <div
              onClick={() => setCollapsedCategories(prev => ({
                ...prev,
                [c.name]: !prev[c.name]
              }))}
              style={{ 
                backgroundColor: isComplete ? "#f0f0f0" : c.color,
                color: isComplete ? "#888" : "#fff",
                padding: "6px 10px",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              <span>
                {c.name} ({progress}%)
                {isComplete && " ✓"}
              </span>
              <span style={{ fontSize: 12 }}>
                {formatTime(totalTime(c.name))} {isCollapsed ? "⬇️" : "⬆️"}
              </span>
            </div>
            {!isCollapsed && (
              <ul style={{ 
                listStyle: "none", 
                padding: 10, 
                margin: 0 
              }}>
                {catTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <div style={{ 
        display: "flex", 
        gap: 10, 
        marginTop: 10 
      }}>
        <button
          onClick={() => {
            setShowAddInput(!showAddInput);
            setShowBulkInput(false);
          }}
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
          onClick={() => {
            setShowBulkInput(!showBulkInput);
            setShowAddInput(false);
          }}
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
        <div style={{ marginTop: 8 }}>
          <div style={{ 
            display: "flex", 
            gap: 6, 
            marginBottom: 8 
          }}>
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
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setShowRepeatModal(true)}
              style={{ 
                padding: "6px 10px", 
                backgroundColor: "#1a73e8", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6 
              }}
            >
              重复
            </button>
            <button
              onClick={() => setShowTimeModal(true)}
              style={{ 
                padding: "6px 10px", 
                backgroundColor: "#1a73e8", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6 
              }}
            >
              计划时间
            </button>
          </div>
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
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              onClick={() => setShowRepeatModal(true)}
              style={{ 
                flex: 1,
                padding: "6px 10px", 
                backgroundColor: "#1a73e8", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6 
              }}
            >
              重复
            </button>
            <button
              onClick={() => setShowTimeModal(true)}
              style={{ 
                flex: 1,
                padding: "6px 10px", 
                backgroundColor: "#1a73e8", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6 
              }}
            >
              计划时间
            </button>
          </div>
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
          { label: "📘 学习时间", value: formatTime(learningTime) },
          { label: "🏃‍♂️ 运动时间", value: formatTime(sportTime) },
          { label: "📝 任务数量", value: totalTasks },
          { label: "✅ 完成率", value: `${completionRate}%" },
          { 
            label: "📊 统计", 
            value: "",
            onClick: () => setShowStats(true)
          }
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={item.onClick}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12,
              borderRight: idx < 4 ? "1px solid #cce0ff" : "none",
              padding: "4px 0",
              cursor: item.onClick ? "pointer" : "default"
            }}
          >
            <div>{item.label}</div>
            <div style={{ 
              fontWeight: "bold", 
              marginTop: 2,
              display: "flex",
              justifyContent: "center"
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: 10, 
        marginTop: 20,
        marginBottom: 20
      }}>
        <button
          onClick={() => {
            const dataStr = JSON.stringify(tasksByDate);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `学习打卡数据_${new Date().toISOString().slice(0,10)}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
          style={{ 
            padding: "6px 12px", 
            backgroundColor: "#1a73e8", 
            color: "#fff", 
            border: "none", 
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          导出数据
        </button>
        <label style={{ 
          padding: "6px 12px", 
          backgroundColor: "#1a73e8", 
          color: "#fff", 
          border: "none", 
          borderRadius: 6,
          fontSize: 14,
          cursor: "pointer"
        }}>
          导入数据
          <input 
            type="file" 
            accept=".json"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const data = JSON.parse(event.target.result);
                  if (window.confirm('导入数据将覆盖当前所有任务，确定要继续吗？')) {
                    setTasksByDate(data);
                    alert('数据导入成功！');
                  }
                } catch (error) {
                  alert('导入失败：文件格式不正确');
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }} 
            style={{ display: "none" }} 
          />
        </label>
        <button
          onClick={clearAllData}
          style={{ 
            padding: "6px 12px", 
            backgroundColor: "#ff4444", 
            color: "#fff", 
            border: "none", 
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          清空数据
        </button>
      </div>
    </div>
  );
}

export default App;