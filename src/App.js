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
      fullLabel: `周${"一二三四五六日"[i]} (${d.getMonth() + 1}/${d.getDate()})`
    });
  }
  return weekDates;
};

// 时间表页面组件
const SchedulePage = ({ tasksByDate, currentMonday, onClose, formatTimeNoSeconds }) => {
  const weekDates = getWeekDates(currentMonday);
  
  
  // 生成时间槽：从6:00到22:00，每30分钟一个间隔
  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  // 获取任务在时间表中的位置信息
  const getTaskTimeInfo = (task, date) => {
    if (!task) return null;

    // 如果有计划时间，使用计划时间
    if (task.scheduledTime) {
      const [startTime, endTime] = task.scheduledTime.split('-');
      return { startTime, endTime, type: 'scheduled' };
    }

    // 如果有计时记录，计算实际执行时间
    if (task.timeSpent && task.timeSpent > 0) {
      // 这里简化处理：假设任务从创建时间开始执行
      // 在实际应用中，你可能需要记录实际的开始时间
      const taskDate = new Date(parseInt(task.id));
      const startTime = `${taskDate.getHours().toString().padStart(2, '0')}:${taskDate.getMinutes().toString().padStart(2, '0')}`;
      const endTimeDate = new Date(taskDate.getTime() + task.timeSpent * 1000);
      const endTime = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}`;
      return { startTime, endTime, type: 'actual' };
    }

    return null;
  };

  // 检查时间是否在区间内
  const isTimeInRange = (time, startTime, endTime) => {
    const [timeHour, timeMinute] = time.split(':').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const timeValue = timeHour * 60 + timeMinute;
    const startValue = startHour * 60 + startMinute;
    const endValue = endHour * 60 + endMinute;
    
    return timeValue >= startValue && timeValue < endValue;
  };

  // 获取时间单元格的任务
  const getTasksForTimeSlot = (time, dayIndex) => {
    const date = weekDates[dayIndex].date;
    const dayTasks = tasksByDate[date] || [];
    
    return dayTasks.filter(task => {
      const timeInfo = getTaskTimeInfo(task, date);
      if (!timeInfo) return false;
      
      return isTimeInRange(time, timeInfo.startTime, timeInfo.endTime);
    });
  };

  // 获取任务显示样式
  const getTaskStyle = (task, timeInfo) => {
    const baseStyle = {
      padding: '2px 4px',
      margin: '1px 0',
      borderRadius: '3px',
      fontSize: '10px',
      color: 'white',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    };

    if (timeInfo.type === 'scheduled') {
      return {
        ...baseStyle,
        backgroundColor: task.done ? '#4CAF50' : '#FF9800',
        border: task.done ? '1px solid #45a049' : '1px solid #e68900'
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#2196F3',
        border: '1px solid #1976D2'
      };
    }
  };

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 15,
      fontFamily: 'sans-serif',
      backgroundColor: '#f5faff'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20
          }}
        >
          ⬅️
        </button>
        <h1 style={{
          textAlign: 'center',
          color: '#1a73e8',
          fontSize: 20
        }}>
          📅 本周时间表 ({currentMonday.getMonth() + 1}/{currentMonday.getDate()} - 
          {new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}/
          {new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()})
        </h1>
        <div style={{ width: 20 }}></div>
      </div>

      {/* 图例说明 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 15,
        fontSize: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#FF9800', borderRadius: 2 }}></div>
          <span>计划任务</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#4CAF50', borderRadius: 2 }}></div>
          <span>已完成</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#2196F3', borderRadius: 2 }}></div>
          <span>实际执行</span>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}>
        {/* 表头 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px repeat(7, 1fr)',
          backgroundColor: '#1a73e8',
          color: 'white',
          fontWeight: 'bold'
        }}>
          <div style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #0b52b0' }}>时间</div>
          {weekDates.map((day, index) => (
            <div 
              key={day.date}
              style={{ 
                padding: '10px', 
                textAlign: 'center',
                borderRight: index < 6 ? '1px solid #0b52b0' : 'none'
              }}
            >
              {day.fullLabel}
            </div>
          ))}
        </div>

        {/* 时间表内容 */}
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {timeSlots.map((time, timeIndex) => (
            <div 
              key={time}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px repeat(7, 1fr)',
                borderBottom: timeIndex < timeSlots.length - 1 ? '1px solid #f0f0f0' : 'none',
                backgroundColor: timeIndex % 2 === 0 ? '#fafafa' : 'white'
              }}
            >
              {/* 时间列 */}
              <div style={{
                padding: '8px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#666',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {time}
              </div>

              {/* 每天的单元格 */}
              {weekDates.map((day, dayIndex) => {
                const tasks = getTasksForTimeSlot(time, dayIndex);
                return (
                  <div
                    key={day.date}
                    style={{
                      padding: '2px',
                      minHeight: '40px',
                      borderRight: dayIndex < 6 ? '1px solid #e0e0e0' : 'none',
                      backgroundColor: tasks.length > 0 ? '#f8f9fa' : 'transparent'
                    }}
                  >
                    {tasks.map((task, taskIndex) => {
                      const timeInfo = getTaskTimeInfo(task, day.date);
                      return (
                        <div
                          key={taskIndex}
                          style={getTaskStyle(task, timeInfo)}
                          title={`${task.text} (${task.category}) ${timeInfo.startTime}-${timeInfo.endTime}`}
                        >
                          {task.text}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 10,
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ marginBottom: 10, color: '#1a73e8' }}>本周统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: '12px' }}>
          <div>
            <strong>计划任务:</strong> {
              weekDates.reduce((total, day) => {
                const dayTasks = tasksByDate[day.date] || [];
                return total + dayTasks.filter(task => task.scheduledTime).length;
              }, 0)
            } 个
          </div>
          <div>
            <strong>已完成:</strong> {
              weekDates.reduce((total, day) => {
                const dayTasks = tasksByDate[day.date] || [];
                return total + dayTasks.filter(task => task.done).length;
              }, 0)
            } 个
          </div>
          <div>
            <strong>实际计时:</strong> {
              weekDates.reduce((total, day) => {
                const dayTasks = tasksByDate[day.date] || [];
                return total + dayTasks.filter(task => task.timeSpent && task.timeSpent > 0).length;
              }, 0)
            } 个
          </div>
          <div>
            <strong>总学习时间:</strong> {
              formatTimeNoSeconds(
                weekDates.reduce((total, day) => {
                  const dayTasks = tasksByDate[day.date] || [];
                  return total + dayTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
                }, 0)
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

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

        {/* 重复频率选择 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>重复频率:</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                flex: 1,
                padding: 10,
                background: frequency === 'daily' ? '#1a73e8' : '#f0f0f0',
                color: frequency === 'daily' ? '#fff' : '#000',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
              onClick={() => setFrequency('daily')}
            >
              每天
            </button>
            <button
              style={{
                flex: 1,
                padding: 10,
                background: frequency === 'weekly' ? '#1a73e8' : '#f0f0f0',
                color: frequency === 'weekly' ? '#fff' : '#000',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
              onClick={() => setFrequency('weekly')}
            >
              每周
            </button>
          </div>
        </div>

        {/* 星期选择 - 始终显示 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>选择星期:</div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center'
          }}>
            {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
              <button
                key={day}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: days[index] ? '#1a73e8' : '#f0f0f0',
                  color: days[index] ? '#fff' : '#000',
                  border: 'none',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'none'
                }}
                onClick={() => toggleDay(index)}
                onMouseOver={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'none';
                }}
              >
                周{day}
              </button>
            ))}
          </div>
        </div>

        {/* 说明文字 */}
        <div style={{
          fontSize: 12,
          color: '#666',
          textAlign: 'center',
          marginBottom: 15,
          lineHeight: 1.4
        }}>
          {frequency === 'daily' ? '任务将在未来7天重复' : '选择任务重复的星期'}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            style={{
              flex: 1,
              padding: 12,
              background: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            取消
          </button>
          <button
            style={{
              flex: 1,
              padding: 12,
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer'
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
const ActionMenuModal = ({ task, onClose, onEditText, onEditNote, onTogglePinned, onImageUpload, setShowDeleteModal, position }) => {
  console.log('ActionMenuModal 收到的任务:', task);
  console.log('任务ID:', task?.id);
  console.log('任务文本:', task?.text);
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 添加：计算菜单位置，确保在屏幕内
  const calculateMenuPosition = (position) => {
    const menuWidth = 120; // 菜单宽度
    const menuHeight = 200; // 菜单高度估计值
    
    let { top, left } = position;
    
    // 如果右边超出屏幕，向左移动
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }
    
    // 如果底部超出屏幕，向上移动
    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 10;
    }
    
    // 确保不超出屏幕顶部和左侧
    top = Math.max(10, top);
    left = Math.max(10, left);
    
    return { top, left };
  };

  const adjustedPosition = calculateMenuPosition(position);

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
        top: adjustedPosition.top,  // 使用调整后的位置
        left: adjustedPosition.left, // 使用调整后的位置
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        padding: '8px 0',
        minWidth: 120,
        zIndex: 1001,
        // 添加最大高度和滚动，防止内容过多
        maxHeight: '70vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        {/* 菜单选项保持不变 */}
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
          onClick={() => {
            onEditScheduledTime(task);
            onClose();
          }}
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
          {task.scheduledTime ? '编辑计划时间' : '添加计划时间'}
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
          onClick={() => {
            onTogglePinned(task);
            onClose();
          }}
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
            setShowDeleteModal(task);
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

// 删除确认模态框
const DeleteConfirmModal = ({ task, selectedDate, onClose, onDelete }) => {
  const [deleteOption, setDeleteOption] = useState('today'); // today, future, all

  const handleDelete = () => {
    onDelete(task, deleteOption);
    onClose();
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
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#d32f2f' }}>
          删除任务
        </h3>

        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>删除选项:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={deleteOption === 'today'}
                onChange={() => setDeleteOption('today')}
              />
              <span>仅删除今日 ({selectedDate})</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={deleteOption === 'future'}
                onChange={() => setDeleteOption('future')}
              />
              <span>删除今日及以后</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={deleteOption === 'all'}
                onChange={() => setDeleteOption('all')}
              />
              <span>删除所有日期</span>
            </label>
          </div>
        </div>

        <div style={{
          fontSize: 12,
          color: '#666',
          marginBottom: 15,
          padding: 8,
          backgroundColor: '#f5f5f5',
          borderRadius: 4
        }}>
          {deleteOption === 'today' && '仅删除当前日期的此任务'}
          {deleteOption === 'future' && '删除从今天开始的所有此任务'}
          {deleteOption === 'all' && '删除所有日期的此任务'}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            取消
          </button>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={handleDelete}
          >
            确认删除
          </button>
        </div>
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
  const [showSchedule, setShowSchedule] = useState(false); // 新增：控制时间表显示
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
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const runningRefs = useRef({});
  const [runningState, setRunningState] = useState({});
  const addInputRef = useRef(null);
  const bulkInputRef = useRef(null);

  // 格式化时间显示 - 用于计时显示（显示秒数）
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  // 汇总数据显示 - 不显示秒数
  const formatTimeNoSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  // 初始化数据
  useEffect(() => {
    const saved = localStorage.getItem("tasksByDate");
    if (saved) setTasksByDate(JSON.parse(saved));
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  // 点击页面任意区域收缩输入框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addInputRef.current && addInputRef.current.contains(event.target)) {
        return;
      }
      if (bulkInputRef.current && bulkInputRef.current.contains(event.target)) {
        return;
      }
      if (event.target.closest('.action-button')) {
        return;
      }
      
      setShowAddInput(false);
      setShowBulkInput(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const tasks = tasksByDate[selectedDate] || [];

  // 获取本周任务 - 从全局任务中筛选出本周任务
  const getWeekTasks = () => {
    const allTasks = Object.values(tasksByDate).flat();
    const weekTasks = allTasks.filter(task => task.category === "本周任务");

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

  // 计算积分荣誉 - 按完成的任务数量计算
  const calculateHonorPoints = () => {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = getMonday(new Date()).toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

    let todayPoints = 0;
    let weekPoints = 0;
    let monthPoints = 0;
    let totalPoints = 0;
    const pointsByCategory = {};

    categories.forEach(cat => {
      pointsByCategory[cat.name] = {
        today: 0,
        week: 0,
        month: 0,
        total: 0
      };
    });

    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      tasks.forEach(task => {
        if (task.done) {
          const points = 1;
          totalPoints += points;

          if (date === today) {
            todayPoints += points;
          }
          if (date >= weekStart) {
            weekPoints += points;
          }
          if (date >= monthStart) {
            monthPoints += points;
          }

          if (pointsByCategory[task.category]) {
            pointsByCategory[task.category].total += points;
            if (date === today) pointsByCategory[task.category].today += points;
            if (date >= weekStart) pointsByCategory[task.category].week += points;
            if (date >= monthStart) pointsByCategory[task.category].month += points;
          }
        }
      });
    });

    return { todayPoints, weekPoints, monthPoints, totalPoints, pointsByCategory };
  };

  const { todayPoints, weekPoints, monthPoints, totalPoints, pointsByCategory } = calculateHonorPoints();

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

    const baseTask = {
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

    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };

      const hasRepeatConfig = repeatConfig.frequency &&
        (repeatConfig.frequency === "daily" ||
          (repeatConfig.frequency === "weekly" && repeatConfig.days.some(day => day)));

      if (hasRepeatConfig) {
        if (repeatConfig.frequency === "daily") {
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];

            if (!newTasksByDate[dateStr]) {
              newTasksByDate[dateStr] = [];
            }

            const existingTask = newTasksByDate[dateStr].find(
              task => task.text === text && task.category === newTaskCategory
            );

            if (!existingTask) {
              newTasksByDate[dateStr].push({
                ...baseTask,
                id: `${baseTask.id}_${dateStr}`,
                isRepeating: true,
                repeatId: baseTask.id
              });
            }
          }
        } else if (repeatConfig.frequency === "weekly") {
          const today = new Date();

          for (let week = 0; week < 4; week++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() + (week * 7));
            const dayOfWeek = weekStart.getDay();
            const monday = new Date(weekStart);
            monday.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

            repeatConfig.days.forEach((isSelected, dayIndex) => {
              if (isSelected) {
                const taskDate = new Date(monday);
                taskDate.setDate(monday.getDate() + dayIndex);
                const dateStr = taskDate.toISOString().split("T")[0];

                if (taskDate >= today) {
                  if (!newTasksByDate[dateStr]) {
                    newTasksByDate[dateStr] = [];
                  }

                  const existingTask = newTasksByDate[dateStr].find(
                    task => task.text === text && task.category === newTaskCategory
                  );

                  if (!existingTask) {
                    newTasksByDate[dateStr].push({
                      ...baseTask,
                      id: `${baseTask.id}_${dateStr}`,
                      isRepeating: true,
                      repeatId: baseTask.id
                    });
                  }
                }
              }
            });
          }
        }
      } else {
        if (!newTasksByDate[selectedDate]) {
          newTasksByDate[selectedDate] = [];
        }

        const existingTask = newTasksByDate[selectedDate].find(
          task => task.text === text && task.category === newTaskCategory
        );

        if (!existingTask) {
          newTasksByDate[selectedDate].push(baseTask);
        }
      }

      return newTasksByDate;
    });

    setNewTaskText("");
    setShowAddInput(false);
    setRepeatConfig({
      frequency: "daily",
      days: [false, false, false, false, false, false, false],
      startTime: "",
      endTime: ""
    });
  };

  // 添加本周任务
  const handleAddWeekTask = (text) => {
    if (!text.trim()) return;

    const weekDates = getWeekDates(currentMonday);
    const taskId = Date.now().toString();

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
      isWeekTask: true
    };

    const newTasksByDate = { ...tasksByDate };

    weekDates.forEach(dateObj => {
      if (!newTasksByDate[dateObj.date]) {
        newTasksByDate[dateObj.date] = [];
      }

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

    const newTasks = lines.slice(1).map((line, index) => ({
      id: Date.now().toString() + index,
      text: line,
      category,
      done: false,
      timeSpent: 0,
      note: "",
      image: null,
      scheduledTime: "",
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

  // 修复置顶功能
  const togglePinned = (task) => {
    console.log('Toggling pinned for task:', task.id, 'Current pinned:', task.pinned);

    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };

      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? { ...t, pinned: !t.pinned } : t
        );
      });

      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => {
        const currentTasks = prev[selectedDate] || [];
        const updatedTasks = currentTasks.map(t =>
          t.id === task.id ? { ...t, pinned: !t.pinned } : t
        );

        return {
          ...prev,
          [selectedDate]: updatedTasks
        };
      });
    }
  };

  // 删除任务
  const deleteTask = (task, deleteOption = 'today') => {
    console.log('Deleting task:', task.text, 'Option:', deleteOption);

    if (task.isWeekTask || deleteOption === 'all') {
      const updatedTasksByDate = { ...tasksByDate };

      Object.keys(updatedTasksByDate).forEach(date => {
        if (task.isWeekTask) {
          updatedTasksByDate[date] = updatedTasksByDate[date].filter(
            t => !(t.isWeekTask && t.text === task.text)
          );
        } else {
          updatedTasksByDate[date] = updatedTasksByDate[date].filter(
            t => t.text !== task.text || t.category !== task.category
          );
        }
      });

      setTasksByDate(updatedTasksByDate);
    } else if (deleteOption === 'future') {
      const updatedTasksByDate = { ...tasksByDate };
      const today = new Date(selectedDate);

      Object.keys(updatedTasksByDate).forEach(date => {
        const taskDate = new Date(date);
        if (taskDate >= today) {
          updatedTasksByDate[date] = updatedTasksByDate[date].filter(
            t => t.id !== task.id
          );
        }
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
      if (task.isWeekTask) {
        console.log('处理本周任务...');
        const updatedTasksByDate = { ...tasksByDate };

        Object.keys(updatedTasksByDate).forEach(date => {
          updatedTasksByDate[date] = updatedTasksByDate[date].map(t => {
            console.log('比较:', t.id, '===', task.id, '结果:', t.id === task.id);
            console.log('比较文本:', t.text, '===', task.text, '结果:', t.text === task.text);
            if (t.isWeekTask && t.text === task.text) {
              console.log('✅ 找到匹配的本周任务');
              return { ...t, note: newNote };
            }
            return t;
          });
        });

        setTasksByDate(updatedTasksByDate);
      } else {
        console.log('处理普通任务...');
        setTasksByDate(prev => {
          const currentTasks = prev[selectedDate] || [];
          console.log('当前日期任务数量:', currentTasks.length);

          const updatedTasks = currentTasks.map(t => {
            console.log('比较任务ID:', t.id, '===', task.id, '结果:', t.id === task.id);
            if (t.id === task.id) {
              console.log('✅ 找到匹配的普通任务');
              return { ...t, note: newNote };
            }
            return t;
          });

          return {
            ...prev,
            [selectedDate]: updatedTasks
          };
        });
      }
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
    console.log('打开菜单，任务对象:', task);
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
          background: task.pinned ? "#fff9e6" : "#fff",
          borderRadius: 6,
          alignItems: "center",
          marginBottom: 4,
          padding: "8px",
          border: "0.5px solid #e0e0e0",
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
                onClick={(e) => {
                  e.stopPropagation();
                  editTaskText(task);
                }}
                style={{
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                  cursor: "pointer",
                  textDecoration: task.done ? "line-through" : "none",
                  color: task.done ? "#999" : "#000",
                  fontWeight: task.pinned ? "bold" : "normal"
                }}
              >
                {task.text}
                {task.pinned && " 📌"}
                {task.isWeekTask && " 🌟"}
              </div>
              {task.note && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    editTaskNote(task);
                  }}
                  style={{
                    fontSize: 12,
                    color: "#000",
                    marginTop: 4,
                    marginBottom: 4,
                    cursor: "pointer",
                    backgroundColor: 'yellow'
                  }}
                >
                  备注: {task.note}
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
              gap: 50,
              fontSize: 12,
              color: "#666"
            }}>
              {task.scheduledTime && (
                <span>⏰ {task.scheduledTime}</span>
              )}
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span style={{
                fontSize: 12,
                color: "#333",
                position: "relative",
                top: "8px"
              }}>
                {formatTime(task.timeSpent)}
              </span>
              <div style={{
                display: "flex",
                gap: 6,
                alignItems: "center"
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTimer(task);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: -15,
                    height: 32,
                    width: 32,
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    top: "8px",
                    marginRight: -10,
                    justifyContent: "center",
                    fontSize: 12
                  }}
                >
                  {runningState[task.id] ? "⏸️" : "▶️"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editTaskNote(task);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    height: 32,
                    width: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    marginRight: -10,
                    top: "8px",
                    fontSize: 12
                  }}
                  title="编辑备注"
                >
                  📝
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    manualAddTime(task);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    height: 32,
                    width: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    marginRight: -10,
                    top: "8px",
                    fontSize: 12
                  }}
                >
                  ➕
                </button>
                {task.image && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImage(!showImage);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      height: 32,
                      width: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: -10,
                      position: "relative",
                      top: "8px",
                      fontSize: 12
                    }}
                  >
                    {showImage ? "🖼️" : "🖼️"}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openActionMenu(task, e);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    height: 32,
                    width: 32,
                    display: "flex",
                    alignItems: "center",
                    marginRight: -10,
                    position: "relative",
                    top: "8px",
                    justifyContent: "center",
                    fontSize: 12
                  }}
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>

          {task.image && showImage && (
            <div style={{ marginTop: 8 }}>
              <img
                src={task.image}
                alt="任务图片"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(task.image);
                }}
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
            <div style={{ marginBottom: 8, fontWeight: "bold" }}>时间统计:</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>今日积分:</span>
              <span style={{ fontWeight: "bold" }}>{todayPoints} 分</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>本周积分:</span>
              <span style={{ fontWeight: "bold" }}>{weekPoints} 分</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>本月积分:</span>
              <span style={{ fontWeight: "bold" }}>{monthPoints} 分</span>
            </div>
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
                <span style={{ fontWeight: "bold" }}>
                  今日:{pointsByCategory[cat.name]?.today || 0} /
                  本周:{pointsByCategory[cat.name]?.week || 0} /
                  总计:{pointsByCategory[cat.name]?.total || 0}
                </span>
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

  // 如果显示时间表页面
  if (showSchedule) {
    return (
      <SchedulePage
        tasksByDate={tasksByDate}
        currentMonday={currentMonday}
        onClose={() => setShowSchedule(false)}
        formatTimeNoSeconds={formatTimeNoSeconds} 
      />
    );
  }

  // 如果显示统计页面
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
{/* === 在这里添加版本信息 === */}
      <h1 style={{textAlign: "center", color: "red", fontSize: "16px"}}>
        学习跟踪器 - 新版本 1.2
      </h1>
      <p style={{textAlign: "center", color: "red", fontSize: "12px"}}>
        更新时间: {new Date().toLocaleString()}
      </p>
      {/* ========================== */}



      {/* 所有模态框组件保持不变 */}
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
          onEditScheduledTime={editScheduledTime} 
          setShowDeleteModal={setShowDeleteModal}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmModal
          task={showDeleteModal}
          selectedDate={selectedDate}
          onClose={() => setShowDeleteModal(null)}
          onDelete={deleteTask}
        />
      )}

      {/* 主页面内容保持不变 */}
      <h1 style={{
        textAlign: "center",
        color: "#1a73e8",
        fontSize: 20
      }}>
        📚 汤圆学习打卡系统
      </h1>
      <div style={{
        textAlign: "center",
        fontSize: 13,
        marginBottom: 10
      }}>
        你已经打卡 {Object.keys(tasksByDate).length} 天，已累计完成 {Object.values(tasksByDate).flat().filter(t => t.done).length} 个学习计划
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

      {/* 本周任务区域 */}
      <div style={{
        marginBottom: 8,
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
                e.stopPropagation();
                const text = window.prompt("添加本周任务");
                if (text && text.trim()) {
                  handleAddWeekTask(text.trim());
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 16,
                padding: 0,
                margin: 0
              }}
            >
              ➕
            </button>
          </div>
        </div>

        {!collapsedCategories["本周任务"] && weekTasks.length > 0 && (
          <ul style={{
            listStyle: "none",
            padding: 8,
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
          marginBottom: 8,
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
            <span>📌 置顶任务 ({pinnedTasks.length})</span><span style={{ fontSize: 12 }}>
              {formatTimeNoSeconds(pinnedTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)).replace(' 0s', '')}
            </span>
          </div>
          <ul style={{
            listStyle: "none",
            padding: 8,
            margin: 0
          }}>
            {pinnedTasks
              .sort((a, b) => {
                return b.id - a.id;
              })
              .map((task) => (
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
              marginBottom: 8,
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
                {formatTimeNoSeconds(totalTime(c.name)).replace(' 0s', '')} {isCollapsed ? "⬇️" : "⬆️"}
              </span>
            </div>
            {!isCollapsed && (
              <ul style={{
                listStyle: "none",
                padding: 8,
                margin: 0
              }}>
                {catTasks
                  .sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return 0;
                  })
                  .map((task) => (
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
          className="action-button"
          onClick={(e) => {
            e.stopPropagation();
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
          className="action-button"
          onClick={(e) => {
            e.stopPropagation();
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
        <div ref={addInputRef} style={{ marginTop: 8 }}>
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
                border: "1px solid #ccc",
                fontSize: "16px"
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <select
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              style={{ padding: 6 }}
              onClick={(e) => e.stopPropagation()}
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddTask();
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setShowRepeatModal(true);
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setShowTimeModal(true);
              }}
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
        <div ref={bulkInputRef} style={{ marginTop: 8 }}>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="第一行写类别，其余每行一条任务"
            style={{
              width: "100%",
              minHeight: 80,
              padding: 6,
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: "16px"
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleImportTasks();
            }}
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
          { label: "📘 学习时间", value: formatTimeNoSeconds(learningTime).replace(' 0s', '') },
          { label: "🏃‍♂️ 运动时间", value: formatTimeNoSeconds(sportTime).replace(' 0s', '') },
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

      {/* 修改底部按钮区域，添加时间表按钮 */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 10,
        marginTop: 20,
        marginBottom: 20,
        flexWrap: "wrap"
      }}>
        <button
          onClick={handleExportData}
          style={{
            padding: "6px 10px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            fontSize: 12,
            borderRadius: 6,
            width: "70px",
            height: "30px",
            cursor: "pointer"
          }}
        >
          导出数据
        </button>
        <button
          onClick={() => setShowSchedule(true)}
          style={{
            padding: "6px 10px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            fontSize: 12,
            borderRadius: 6,
            width: "70px",
            height: "30px",
            cursor: "pointer"
          }}
        >
          时间表
        </button>
        <button
          onClick={() => {
            document.getElementById('import-file').click();
          }}
          style={{
            padding: "6px 10px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            width: "70px",
            height: "30px",
            cursor: "pointer"
          }}
        >
          导入数据
        </button>
        <input
          id="import-file"
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
        <button
          onClick={clearAllData}
          style={{
            padding: "6px 10px",
            backgroundColor: "#ff4444",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            width: "70px",
            height: "30px",
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
