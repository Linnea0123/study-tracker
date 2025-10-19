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

// 图片模态框组件
const ImageModal = ({ imageUrl, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }} onClick={onClose}>
    <img
      src={imageUrl}
      alt="预览"
      style={{
        maxWidth: '90%',
        maxHeight: '90%',
        objectFit: 'contain'
      }}
      onClick={e => e.stopPropagation()}
    />
  </div>
);

// 重复设置模态框
const RepeatModal = ({ config, onSave, onClose }) => {
  const [frequency, setFrequency] = useState(config.frequency);
  const [days, setDays] = useState([...config.days]);

  const toggleDay = (index) => {
    const newDays = [...days];
    newDays[index] = !newDays[index];
    setDays(newDays);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 350
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>重复设置</h3>

        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>重复频率:</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                flex: 1,
                padding: 8,
                background: frequency === 'daily' ? '#1a73e8' : '#eee',
                color: frequency === 'daily' ? '#fff' : '#000',
                border: 'none',
                borderRadius: 4
              }}
              onClick={() => setFrequency('daily')}
            >
              每天
            </button>
            <button
              style={{
                flex: 1,
                padding: 8,
                background: frequency === 'weekly' ? '#1a73e8' : '#eee',
                color: frequency === 'weekly' ? '#fff' : '#000',
                border: 'none',
                borderRadius: 4
              }}
              onClick={() => setFrequency('weekly')}
            >
              每周
            </button>
          </div>
        </div>

        {frequency === 'weekly' && (
          <div style={{ marginBottom: 15 }}>
            <div style={{ marginBottom: 8 }}>选择星期:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
                <button
                  key={day}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: days[index] ? '#1a73e8' : '#eee',
                    color: days[index] ? '#fff' : '#000',
                    border: 'none'
                  }}
                  onClick={() => toggleDay(index)}
                >
                  周{day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 5
            }}
            onClick={onClose}
          >
            取消
          </button>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 5
            }}
            onClick={() => {
              onSave({ frequency, days });
              onClose();
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// 时间设置模态框
const TimeModal = ({ config, onSave, onClose }) => {
  const [startTime, setStartTime] = useState(config.startTime);
  const [endTime, setEndTime] = useState(config.endTime);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 350
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>计划时间</h3>

        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>开始时间:</div>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>结束时间:</div>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 5
            }}
            onClick={onClose}
          >
            取消
          </button>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 5
            }}
            onClick={() => {
              onSave({ startTime, endTime });
              onClose();
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// 操作菜单模态框
const ActionMenuModal = ({ task, onClose, onEditText, onEditNote, onTogglePinned, onImageUpload, onDelete, position }) => {
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        padding: '8px 0',
        minWidth: 120,
        zIndex: 1001
      }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onEditText}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          编辑任务
        </button>
        <button
          onClick={onEditNote}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          编辑备注
        </button>
        <button
          onClick={onTogglePinned}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          {task.pinned ? '取消置顶' : '置顶'}
        </button>
        <button
          onClick={handleImageClick}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          添加图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            onImageUpload(e, task);
            onClose();
          }}
          style={{ display: 'none' }}
        />
        <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }}></div>
        <button
          onClick={() => {
            onDelete(task);
            onClose();
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14,
            color: '#d32f2f'
          }}
        >
          删除任务
        </button>
      </div>
    </div>
  );
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
  const [showStats, setShowStats] = useState(false);
  const [statsMode, setStatsMode] = useState("week");
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showImageModal, setShowImageModal] = useState(null);
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [repeatConfig, setRepeatConfig] = useState({
    frequency: "daily",
    days: [false, false, false, false, false, false, false],
    startTime: "",
    endTime: ""
  });
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);

  const runningRefs = useRef({});
  const [runningState, setRunningState] = useState({});

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

  // 获取本周任务 - 从全局任务中筛选出本周任务
  const getWeekTasks = () => {
    const allTasks = Object.values(tasksByDate).flat();
    const weekTasks = allTasks.filter(task => task.category === "本周任务");

    // 去重，基于任务文本内容
    const uniqueTasks = [];
    const seenTexts = new Set();

    weekTasks.forEach(task => {
      if (!seenTexts.has(task.text)) {
        seenTexts.add(task.text);
        uniqueTasks.push(task);
      }
    });

    return uniqueTasks;
  };

  const weekTasks = getWeekTasks();
  const pinnedTasks = tasks.filter(task => task.pinned);
  const weekDates = getWeekDates(currentMonday);

  // 计算积分荣誉
  const calculateHonorPoints = () => {
    const pointsByCategory = {};
    let totalPoints = 0;

    Object.values(tasksByDate).flat().forEach(task => {
      if (task.done) {
        const points = Math.floor((task.timeSpent || 0) / 60); // 每分钟1分
        totalPoints += points;

        if (!pointsByCategory[task.category]) {
          pointsByCategory[task.category] = 0;
        }
        pointsByCategory[task.category] += points;
      }
    });

    return { totalPoints, pointsByCategory };
  };

  const { totalPoints, pointsByCategory } = calculateHonorPoints();

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
      dateRange = weekDates.map(d => d.date);
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
        `${repeatConfig.startTime}-${repeatConfig.endTime}` : "",
      pinned: false
    };

    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newTask]
    }));

    setNewTaskText("");
    setShowAddInput(false);
  };

  // 添加本周任务 - 创建一条任务，在整周的所有日期都显示
  const handleAddWeekTask = (text) => {
    if (!text.trim()) return;

    const weekDates = getWeekDates(currentMonday);
    const taskId = Date.now().toString(); // 使用同一个ID

    const newTask = {
      id: taskId,
      text: text.trim(),
      category: "本周任务",
      done: false,
      timeSpent: 0,
      note: "",
      image: null,
      scheduledTime: "",
      pinned: false,
      isWeekTask: true // 标记为本周任务
    };

    const newTasksByDate = { ...tasksByDate };

    // 为本周的每一天都添加这个任务
    weekDates.forEach(dateObj => {
      if (!newTasksByDate[dateObj.date]) {
        newTasksByDate[dateObj.date] = [];
      }

      // 检查是否已存在相同的本周任务
      const existingTask = newTasksByDate[dateObj.date].find(
        task => task.isWeekTask && task.text === text.trim()
      );

      if (!existingTask) {
        newTasksByDate[dateObj.date] = [...newTasksByDate[dateObj.date], { ...newTask }];
      }
    });

    setTasksByDate(newTasksByDate);
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
        `${repeatConfig.startTime}-${repeatConfig.endTime}` : "",
      pinned: false
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
    // 如果是本周任务，需要在所有日期中更新状态
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };

      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? { ...t, done: !t.done } : t
        );
      });

      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, done: !t.done } : t
        )
      }));
    }
  };

  // 切换置顶状态
  const togglePinned = (task) => {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? { ...t, pinned: !t.pinned } : t
      )
    }));
  };

  // 删除任务
  const deleteTask = (task) => {
    // 如果是本周任务，从所有日期中删除
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };

      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].filter(
          t => !(t.isWeekTask && t.text === task.text)
        );
      });

      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].filter(t => t.id !== task.id)
      }));
    }

    if (runningRefs.current[task.id]) {
      clearInterval(runningRefs.current[task.id]);
      delete runningRefs.current[task.id];
      setRunningState(prev => ({ ...prev, [task.id]: false }));
    }
  };

  // 编辑任务文本
  const editTaskText = (task) => {
    const newText = window.prompt("编辑任务", task.text);
    if (newText !== null) {
      // 如果是本周任务，需要在所有日期中更新
      if (task.isWeekTask) {
        const updatedTasksByDate = { ...tasksByDate };

        Object.keys(updatedTasksByDate).forEach(date => {
          updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
            t.isWeekTask && t.text === task.text ? { ...t, text: newText } : t
          );
        });

        setTasksByDate(updatedTasksByDate);
      } else {
        setTasksByDate(prev => ({
          ...prev,
          [selectedDate]: prev[selectedDate].map(t =>
            t.id === task.id ? { ...t, text: newText } : t
          )
        }));
      }
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

  // 打开操作菜单
  const openActionMenu = (task, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setShowActionMenu({
      task,
      position: {
        top: rect.bottom + 5,
        left: rect.left
      }
    });
  };

  // 清空所有数据
  const clearAllData = () => {
    if (window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
      setTasksByDate({});
      localStorage.removeItem("tasksByDate");
    }
  };

  // 导出数据
  const handleExportData = () => {
    const dataStr = JSON.stringify(tasksByDate);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `study-data_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
        className="task-item"
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 6,
          marginBottom: 8,
          padding: "8px"
        }}
      >
        <div>
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
                {task.pinned && " 📌"}
                {task.isWeekTask && " 🌟"}
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
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#666"
            }}>
              {task.scheduledTime && (
                <span>⏰ {task.scheduledTime}</span>
              )}
              <span>{formatTime(task.timeSpent)}</span>
            </div>

            <div style={{
              display: "flex",
              gap: 6,
              alignItems: "center"
            }}>
              <button
                onClick={() => toggleTimer(task)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  height: 32,
                  width: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16
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
                  padding: 6,
                  height: 32,
                  width: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16
                }}
              >
                ➕
              </button>
              {task.image && (
                <button
                  onClick={() => setShowImage(!showImage)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    height: 32,
                    width: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16
                  }}
                >
                  {showImage ? "🖼️▲" : "🖼️▼"}
                </button>
              )}
              <button
                onClick={(e) => openActionMenu(task, e)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  height: 32,
                  width: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16
                }}
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </li>
    );
  };

  // 积分荣誉模态框
  const HonorModal = () => (
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
        <h3 style={{ textAlign: "center", marginBottom: 15 }}>🏆 积分荣誉</h3>

        <div style={{ marginBottom: 15 }}>
          <div style={{
            textAlign: "center",
            fontSize: 24,
            fontWeight: "bold",
            color: "#1a73e8",
            marginBottom: 10
          }}>
            {totalPoints} 分
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 8, fontWeight: "bold" }}>各科目积分:</div>
            {categories.map(cat => (
              <div key={cat.name} style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6
              }}>
                <span>{cat.name}</span>
                <span style={{ fontWeight: "bold" }}>{pointsByCategory[cat.name] || 0} 分</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowHonorModal(false)}
          style={{
            display: "block",
            margin: "0 auto",
            padding: "8px 16px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          关闭
        </button>
      </div>
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
          <div style={{ width: 20 }}></div>
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
      backgroundColor: "#f5faff",
      overflowX: "hidden"
    }}>
      {showImageModal && (
        <ImageModal
          imageUrl={showImageModal}
          onClose={() => setShowImageModal(null)}
        />
      )}
      {showHonorModal && <HonorModal />}
      {showRepeatModal && (
        <RepeatModal
          config={repeatConfig}
          onSave={(newConfig) => setRepeatConfig(newConfig)}
          onClose={() => setShowRepeatModal(false)}
        />
      )}
      {showTimeModal && (
        <TimeModal
          config={repeatConfig}
          onSave={(newConfig) => setRepeatConfig(newConfig)}
          onClose={() => setShowTimeModal(false)}
        />
      )}
      {showActionMenu && (
        <ActionMenuModal
          task={showActionMenu.task}
          position={showActionMenu.position}
          onClose={() => setShowActionMenu(null)}
          onEditText={editTaskText}
          onEditNote={editTaskNote}
          onTogglePinned={togglePinned}
          onImageUpload={handleImageUpload}
          onDelete={deleteTask}
        />
      )}

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
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5
      }}>
        <button
          onClick={() => setShowHonorModal(true)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          积分荣誉: {totalPoints}
        </button>
        <div style={{ display: "flex", alignItems: "center" }}>
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

      {/* 本周任务区域 - 浅蓝色 */}
      <div style={{
        marginBottom: 12,
        borderRadius: 10,
        overflow: "hidden",
        border: "2px solid #87CEEB",
        backgroundColor: "#fff"
      }}>
        <div
          onClick={() => setCollapsedCategories(prev => ({
            ...prev,
            "本周任务": !prev["本周任务"]
          }))}
          style={{
            backgroundColor: "#87CEEB",
            color: "#fff",
            padding: "6px 10px",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
        >
          <span>📅 本周任务 ({weekTasks.length})</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12 }}>
              {collapsedCategories["本周任务"] ? "⬇️" : "⬆️"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发折叠
                const text = window.prompt("添加本周任务");
                if (text && text.trim()) {
                  handleAddWeekTask(text.trim());
                }
              }}
              style={{
                background: "transparent",
                border: "1px solid #fff",
                color: "#fff",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* 本周任务列表 - 根据折叠状态显示 */}
        {!collapsedCategories["本周任务"] && weekTasks.length > 0 && (
          <ul style={{
            listStyle: "none",
            padding: 10,
            margin: 0
          }}>
            {weekTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>

      {/* 置顶任务区域 */}
      {pinnedTasks.length > 0 && (
        <div style={{
          marginBottom: 12,
          borderRadius: 10,
          overflow: "hidden",
          border: "2px solid #ffcc00",
          backgroundColor: "#fff"
        }}>
          <div
            style={{
              backgroundColor: "#ffcc00",
              color: "#000",
              padding: "6px 10px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>📌 置顶任务 ({pinnedTasks.length})</span>
            <span style={{ fontSize: 12 }}>
              {formatTime(pinnedTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0))}
            </span>
          </div>
          <ul style={{
            listStyle: "none",
            padding: 10,
            margin: 0
          }}>
            {pinnedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </div>
      )}

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
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          {showAddInput ? "取消添加" : "添加任务"}
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
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          {showBulkInput ? "取消批量" : "批量导入"}
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
                borderRadius: 6,
                cursor: "pointer"
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
                borderRadius: 6,
                cursor: "pointer"
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
                borderRadius: 6,
                cursor: "pointer"
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
                borderRadius: 6,
                cursor: "pointer"
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
                borderRadius: 6,
                cursor: "pointer"
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
              borderRadius: 6,
              cursor: "pointer"
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
          { label: "✅ 完成率", value: `${completionRate}%` },
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
          onClick={handleExportData}
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
        }}
        >
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