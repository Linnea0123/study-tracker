import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';

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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const runningRefs = useRef({});
  const [runningState, setRunningState] = useState({});
  const touchStateRef = useRef({});
  const [swipedTask, setSwipedTask] = useState(null);

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

  // 计算本周统计数据
  const calculateWeekStats = () => {
    const weekStats = {
      totalTime: 0,
      byCategory: {},
      byDay: {},
      tasksByDay: {}
    };

    const weekDays = weekDates.map(d => d.date);

    weekDays.forEach(date => {
      const dayTasks = tasksByDate[date] || [];
      let dayTotal = 0;
      let completedTasks = 0;
      
      dayTasks.forEach(task => {
        weekStats.totalTime += task.timeSpent || 0;
        dayTotal += task.timeSpent || 0;
        
        if (!weekStats.byCategory[task.category]) {
          weekStats.byCategory[task.category] = 0;
        }
        weekStats.byCategory[task.category] += task.timeSpent || 0;
        
        if (task.done) completedTasks++;
      });
      
      weekStats.byDay[date] = dayTotal;
      weekStats.tasksByDay[date] = completedTasks;
    });

    return weekStats;
  };

  // 生成图表数据
  const generateChartData = () => {
    const weekStats = calculateWeekStats();
    
    return {
      // 每日学习时间数据
      dailyStudyData: Object.entries(weekStats.byDay).map(([date, time]) => ({
        name: `${new Date(date).getDate()}日`,
        time: time / 60, // 转换为分钟
        date: date.slice(5)
      })),
      
      // 各科目学习时间数据
      categoryData: categories.map(cat => ({
        name: cat.name,
        time: (weekStats.byCategory[cat.name] || 0) / 60,
        color: cat.color
      })),
      
      // 每日完成任务数数据
      dailyTasksData: Object.entries(weekStats.tasksByDay).map(([date, count]) => ({
        name: `${new Date(date).getDate()}日`,
        tasks: count,
        date: date.slice(5)
      }))
    };
  };

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
    setTasksByDate((prev) => {
      const copy = { ...prev };
      if (!copy[selectedDate]) copy[selectedDate] = [];
      copy[selectedDate].push(newTask);
      return copy;
    });
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

    setTasksByDate((prev) => {
      const copy = { ...prev };
      if (!copy[selectedDate]) copy[selectedDate] = [];
      copy[selectedDate] = [...copy[selectedDate], ...newTasks];
      return copy;
    });
    setBulkText("");
    setShowBulkInput(false);
  };

  const toggleDone = (task) => {
    setTasksByDate((prev) => {
      const copy = { ...prev };
      copy[selectedDate] = copy[selectedDate].map((t) =>
        t.id === task.id ? { ...t, done: !t.done } : t
      );
      return copy;
    });
  };

  const deleteTask = (task) => {
    setTasksByDate((prev) => {
      const copy = { ...prev };
      copy[selectedDate] = copy[selectedDate].filter((t) => t.id !== task.id);
      return copy;
    });
    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState((prev) => {
        const n = { ...prev };
        delete n[task.id];
        return n;
      });
    }
    if (swipedTask === task.id) setSwipedTask(null);
  };

  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务", task.text);
    if (newText !== null) {
      setTasksByDate((prev) => {
        const copy = { ...prev };
        copy[selectedDate] = copy[selectedDate].map((t) =>
          t.id === task.id ? { ...t, text: newText } : t
        );
        return copy;
      });
    }
  };

  const editTaskNote = (task) => {
    const newNote = window.prompt("编辑备注", task.note || "");
    if (newNote !== null) {
      setTasksByDate((prev) => {
        const copy = { ...prev };
        copy[selectedDate] = copy[selectedDate].map((t) =>
          t.id === task.id ? { ...t, note: newNote } : t
        );
        return copy;
      });
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
        setTasksByDate((prev) => {
          const copy = { ...prev };
          copy[selectedDate] = copy[selectedDate].map((t) =>
            t.id === task.id
              ? { ...t, timeSpent: (t.timeSpent || 0) + 1 }
              : t
          );
          return copy;
        });
      }, 1000);
      setRunningState((prev) => ({ ...prev, [task.id]: true }));
    }
  };

  const manualAddTime = (task) => {
    const minutes = parseInt(window.prompt("输入已完成的时间（分钟）"), 10);
    if (!isNaN(minutes) && minutes > 0) {
      setTasksByDate((prev) => {
        const copy = { ...prev };
        copy[selectedDate] = copy[selectedDate].map((t) =>
          t.id === task.id
            ? { ...t, timeSpent: (t.timeSpent || 0) + minutes * 60 }
            : t
        );
        return copy;
      });
    }
  };

  const getCategoryTasks = (catName) => tasks.filter((t) => t.category === catName);

  const calcProgress = (catName) => {
    const catTasks = getCategoryTasks(catName);
    if (catTasks.length === 0) return 0;
    const doneCount = catTasks.filter((t) => t.done).length;
    return Math.round((doneCount / catTasks.length) * 100);
  };

  const totalTime = (catName) => {
    const catTasks = getCategoryTasks(catName);
    return catTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  };

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

  const todayTasks = tasksByDate[selectedDate] || [];
  const learningTime = todayTasks
    .filter((t) => t.category !== "体育")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const sportTime = todayTasks
    .filter((t) => t.category === "体育")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const totalTasks = todayTasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((todayTasks.filter((t) => t.done).length / totalTasks) * 100);

  const { dailyStudyData, categoryData, dailyTasksData } = generateChartData();

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 15, fontFamily: "sans-serif", backgroundColor: "#f5faff" }}>
      <h1 style={{ textAlign: "center", color: "#1a73e8", fontSize: 20 }}>📚 学习计划和打卡</h1>
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
      
      {categories.map((c) => {
        const catTasks = getCategoryTasks(c.name);
        if (catTasks.length === 0) return null;
        const progress = calcProgress(c.name);
        return (
          <div key={c.name} style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", border: `2px solid ${c.color}`, backgroundColor: "#fff" }}>
            <div style={{ backgroundColor: c.color, color: "#fff", padding: "6px 10px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{c.name} ({progress}%)</span>
              <span style={{ fontSize: 12 }}>{formatTime(totalTime(c.name))}</span>
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
                    style={{ position: "relative", overflow: "hidden", background: "#fff", borderRadius: 6, marginBottom: 8 }}
                  >
                    <div style={{ transform: isSwiped ? "translateX(-80px)" : "translateX(0)", transition: "transform .18s ease", padding: "8px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <input type="checkbox" checked={task.done} onChange={() => toggleDone(task)} style={{ marginTop: 6 }} />
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
                            <div onClick={() => editTaskNote(task)} style={{ fontSize: 12, color: "#555", marginTop: 6, cursor: "pointer" }}>
                              {task.note}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8, alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "#333", marginRight: 6 }}>{formatTime(task.timeSpent)}</div>
                        <button onClick={() => toggleTimer(task)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
                          {runningState[task.id] ? "⏸️" : "▶️"}
                        </button>
                        <button onClick={() => manualAddTime(task)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
                          ➕
                        </button>
                        <button onClick={() => editTaskNote(task)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
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
                        cursor: "pointer",
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
      
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          onClick={() => setShowAddInput(!showAddInput)}
          style={{ flex: 1, padding: 8, backgroundColor: "#1a73e8", color: "#fff", border: "none", borderRadius: 6 }}
        >
          添加任务
        </button>
        <button
          onClick={() => setShowBulkInput(!showBulkInput)}
          style={{ flex: 1, padding: 8, backgroundColor: "#1a73e8", color: "#fff", border: "none", borderRadius: 6 }}
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
            style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <select
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            style={{ padding: 6 }}
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddTask} style={{ padding: "6px 10px", backgroundColor: "#1a73e8", color: "#fff", border: "none", borderRadius: 6 }}>
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
            style={{ width: "100%", minHeight: 80, padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <button onClick={handleImportTasks} style={{ marginTop: 6, padding: 6, width: "100%", backgroundColor: "#1a73e8", color: "#fff", border: "none", borderRadius: 6 }}>
            导入任务
          </button>
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, padding: "8px 0", backgroundColor: "#e8f0fe", borderRadius: 10 }}>
        {[
          { label: "📘 学习时间", value: formatTime(learningTime) },
          { label: "🏃‍♂️ 运动时间", value: formatTime(sportTime) },
          { label: "📝 任务数量", value: totalTasks },
          { label: "✅ 完成率", value: `${completionRate}%` },
          { 
            label: "📊 统计", 
            value: "",
            onClick: () => setShowStatsModal(true)
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
            <div style={{ fontWeight: "bold", marginTop: 2 }}>{item.value}</div>
          </div>
        ))}
      </div>
      
      {/* 统计弹窗 */}
      {/* 统计弹窗 */}
{showStatsModal && (
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
      width: "90%",
      maxWidth: 500,
      maxHeight: "90vh",
      overflow: "auto"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 15 }}>📊 本周学习统计</h2>
      
      {/* 1. 每日学习时间柱状图 */}
      <div style={{ height: '250px', marginBottom: 30 }}>
        <h3 style={{ textAlign: "center", marginBottom: 10 }}>每日学习时间（分钟）</h3>
        <div style={{ height: '200px' }}>
          <BarChart data={dailyStudyData} width={300} height={200}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar 
              dataKey="time" 
              fill="#1a73e8" 
              radius={[4, 4, 0, 0]}
              label={{
                position: "top",
                formatter: (v) => `${v}分钟`,
                fill: "#666",
                fontSize: 12
              }}
            />
          </BarChart>
        </div>
      </div>
      
      {/* 2. 各科目学习时间柱状图 */}
      <div style={{ height: '250px', marginBottom: 30 }}>
        <h3 style={{ textAlign: "center", marginBottom: 10 }}>各科目学习时间（分钟）</h3>
        <div style={{ height: '200px' }}>
          <BarChart data={categoryData} width={300} height={200}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar 
              dataKey="time" 
              fill="#4a90e2"
              radius={[4, 4, 0, 0]}
              label={{
                position: "top",
                formatter: (v) => `${v}分钟`,
                fill: "#666",
                fontSize: 12
              }}
            />
          </BarChart>
        </div>
      </div>
      
      {/* 3. 每日完成任务数柱状图 */}
      <div style={{ height: '250px' }}>
        <h3 style={{ textAlign: "center", marginBottom: 10 }}>每日完成任务数</h3>
        <div style={{ height: '200px' }}>
          <BarChart data={dailyTasksData} width={300} height={200}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar 
              dataKey="tasks" 
              fill="#00a854" 
              radius={[4, 4, 0, 0]}
              label={{
                position: "top",
                formatter: (v) => `${v}个`,
                fill: "#666",
                fontSize: 12
              }}
            />
          </BarChart>
        </div>
      </div>
      
      <button 
        onClick={() => setShowStatsModal(false)}
        style={{
          display: "block",
          margin: "20px auto 0",
          padding: "8px 16px",
          backgroundColor: "#1a73e8",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer"
        }}
      >
        关闭
      </button>
    </div>
  </div>
)}

      {/* 导入导出按钮 */}
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
            padding: "8px 16px", 
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
          padding: "8px 16px", 
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
      </div>
    </div>
  );
}

export default App;