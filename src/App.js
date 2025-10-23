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

    // 如果有计时时间段，显示每个时间段
    if (task.timeSegments && task.timeSegments.length > 0) {
      // 返回第一个时间段
      const segment = task.timeSegments[0];
      if (segment.startTime && segment.endTime) {
        const startTimeDate = new Date(segment.startTime);
        const startTime = `${startTimeDate.getHours().toString().padStart(2, '0')}:${startTimeDate.getMinutes().toString().padStart(2, '0')}`;

        const endTimeDate = new Date(segment.endTime);
        const endTime = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}`;

        return { startTime, endTime, type: 'actual' };
      }
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
                      if (!timeInfo) return null;
                      
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
      backgroundColor: 'rgba(255, 182, 182, 0.5)',
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

// 模板模态框组件
const TemplateModal = ({ templates, onSave, onClose, onDelete }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState(categories[0].name);
  const [templateContent, setTemplateContent] = useState('');
  const [templateTags, setTemplateTags] = useState([]);
  const [templateScheduledTime, setTemplateScheduledTime] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');

  const colorPalette = {
    primary: '#3B82F6',
    secondary: '#6B7280',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1F2937',
    textLight: '#6B7280'
  };

  const commonTags = [
    { name: '重要', color: '#EF4444', textColor: '#FFFFFF' },
    { name: '紧急', color: '#F59E0B', textColor: '#FFFFFF' },
    { name: '复习', color: '#10B981', textColor: '#FFFFFF' },
    { name: '预习', color: '#3B82F6', textColor: '#FFFFFF' },
    { name: '作业', color: '#8B5CF6', textColor: '#FFFFFF' }
  ];

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const newTag = {
        name: newTagName.trim(),
        color: newTagColor,
        textColor: '#FFFFFF'
      };
      setTemplateTags([...templateTags, newTag]);
      setNewTagName('');
      setNewTagColor('#6B7280');
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = [...templateTags];
    newTags.splice(index, 1);
    setTemplateTags(newTags);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: colorPalette.surface,
        padding: '24px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '480px',
        maxHeight: '85vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${colorPalette.border}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${colorPalette.border}`
        }}>
          <h3 style={{ 
            margin: 0, 
            color: colorPalette.text,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            📋 任务模板
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colorPalette.textLight,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h4 style={{
            margin: '0 0 16px 0',
            color: colorPalette.text,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            创建新模板
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                color: colorPalette.text,
                fontSize: '13px',
                fontWeight: '500'
              }}>
                模板名称
              </label>
              <input
                type="text"
                placeholder="输入模板名称..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colorPalette.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colorPalette.background
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  color: colorPalette.text,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  类别
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: colorPalette.background
                  }}
                >
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  color: colorPalette.text,
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  任务内容
                </label>
                <input
                  type="text"
                  placeholder="输入任务内容..."
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: colorPalette.background
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                color: colorPalette.text,
                fontSize: '13px',
                fontWeight: '500'
              }}>
                计划时间
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="time"
                  value={templateScheduledTime.split('-')[0] || ''}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    const endTime = templateScheduledTime.split('-')[1] || '';
                    setTemplateScheduledTime(`${startTime}-${endTime}`);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: colorPalette.background
                  }}
                />
                <span style={{ color: colorPalette.textLight, fontSize: '14px' }}>至</span>
                <input
                  type="time"
                  value={templateScheduledTime.split('-')[1] || ''}
                  onChange={(e) => {
                    const startTime = templateScheduledTime.split('-')[0] || '';
                    const endTime = e.target.value;
                    setTemplateScheduledTime(`${startTime}-${endTime}`);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: colorPalette.background
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                color: colorPalette.text,
                fontSize: '13px',
                fontWeight: '500'
              }}>
                标签
              </label>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px', 
                marginBottom: '12px',
                minHeight: '40px',
                padding: '12px',
                border: `1px solid ${colorPalette.border}`,
                borderRadius: '8px',
                backgroundColor: colorPalette.background
              }}>
                {templateTags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      backgroundColor: tag.color,
                      color: tag.textColor,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '500'
                    }}
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'inherit',
                        opacity: 0.8
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="新标签名称"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: colorPalette.background
                  }}
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  style={{
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={handleAddTag}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colorPalette.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  添加
                </button>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: colorPalette.textLight, marginBottom: '6px' }}>
                  常用标签
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {commonTags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const isAlreadyAdded = templateTags.some(t => t.name === tag.name);
                        if (!isAlreadyAdded) {
                          setTemplateTags([...templateTags, tag]);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: tag.color,
                        color: tag.textColor,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (templateName && templateContent) {
                  onSave({
                    name: templateName,
                    category: templateCategory,
                    content: templateContent,
                    scheduledTime: templateScheduledTime,
                    tags: templateTags
                  });
                  setTemplateName('');
                  setTemplateContent('');
                  setTemplateScheduledTime('');
                  setTemplateTags([]);
                }
              }}
              disabled={!templateName || !templateContent}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: (!templateName || !templateContent) ? colorPalette.border : colorPalette.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: (!templateName || !templateContent) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              创建模板
            </button>
          </div>
        </div>

        <div>
          <h4 style={{
            margin: '0 0 16px 0',
            color: colorPalette.text,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            现有模板 ({templates.length})
          </h4>
          
          {templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: colorPalette.textLight,
              fontSize: '13px',
              padding: '32px 16px',
              backgroundColor: colorPalette.background,
              borderRadius: '8px'
            }}>
              暂无模板
            </div>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {templates.map((template, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '16px',
                    border: `1px solid ${colorPalette.border}`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: colorPalette.background
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: '13px',
                        color: colorPalette.text
                      }}>
                        {template.name}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: colorPalette.primary,
                        color: '#FFFFFF',
                        borderRadius: '4px'
                      }}>
                        {template.category}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: colorPalette.textLight,
                      marginBottom: '8px'
                    }}>
                      {template.content}
                    </div>
                    
                    {template.tags && template.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {template.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              backgroundColor: tag.color,
                              color: tag.textColor,
                              borderRadius: '6px'
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {template.scheduledTime && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: colorPalette.primary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⏰</span>
                        {template.scheduledTime}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colorPalette.textLight,
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 操作菜单模态框
const ActionMenuModal = ({ task, onClose, onEditText, onEditNote, onEditReflection, onTogglePinned, onImageUpload, setShowDeleteModal,
  onEditScheduledTime, onDeleteScheduledTime, position }) => {
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const calculateMenuPosition = (position) => {
    const menuWidth = 120;
    const menuHeight = 200;

    let { top, left } = position;

    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 10;
    }

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
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        padding: '8px 0',
        minWidth: 120,
        zIndex: 1001,
        maxHeight: '70vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
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
          {task.scheduledTime ? '编辑时间' : '添加时间'}
        </button>
        {task.scheduledTime && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.confirm('确定要删除计划时间吗？')) {
                onDeleteScheduledTime(task);
                onClose();
              }
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
            删除时间
          </button>
        )}

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
            const reflection = window.prompt(
              "添加完成感想（支持多行文本）",
              task.reflection || ""
            );
            if (reflection !== null) {
              onEditReflection(task, reflection);
            }
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
          添加感想
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

// 日期选择模态框
const DatePickerModal = ({ onClose, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  const daysInMonth = [];
  const totalDays = lastDayOfMonth.getDate();

  for (let i = 0; i < firstDayOfWeek; i++) {
    daysInMonth.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    daysInMonth.push(i);
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
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
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxWidth: 350
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button
            onClick={prevMonth}
            style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            ◀
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </span>
          <button
            onClick={nextMonth}
            style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            ▶
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              padding: '4px'
            }}>
              {day}
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4
        }}>
          {daysInMonth.map((day, index) => (
            <button
              key={index}
              onClick={() => {
                if (day) {
                  const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  onSelectDate(selectedDate);
                }
              }}
              disabled={!day}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: 6,
                background: !day ? 'transparent' :
                  isToday(day) ? '#1a73e8' : '#f8f9fa',
                color: !day ? 'transparent' :
                  isToday(day) ? 'white' : '#000',
                cursor: day ? 'pointer' : 'default',
                fontSize: '14px',
                minHeight: '36px'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 15,
            background: '#ccc',
            color: '#000',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

// 删除确认模态框
const DeleteConfirmModal = ({ task, selectedDate, onClose, onDelete }) => {
  const [deleteOption, setDeleteOption] = useState('today');

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

// 移动选择模态框
const MoveSelectModal = ({ task, categories, onClose, onMove }) => {
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find(cat => cat.name !== task.category)?.name || categories[0].name
  );

  const availableCategories = categories.filter(cat => cat.name !== task.category);

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
        maxWidth: 300
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>移动到类别</h3>

        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8 }}>选择目标类别:</div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14
            }}
          >
            {availableCategories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              background: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={() => {
              onMove(task, selectedCategory);
              onClose();
            }}
            style={{
              flex: 1,
              padding: 10,
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            确定移动
          </button>
        </div>
      </div>
    </div>
  );
};

// 任务编辑模态框
const TaskEditModal = ({ task, categories, onClose, onSave, onTogglePinned, onImageUpload, setShowDeleteModal }) => {
  const [editData, setEditData] = useState({
    text: task.text || '',
    note: task.note || '',
    reflection: task.reflection || '',
    scheduledTime: task.scheduledTime || '',
    pinned: task.pinned || false,
    category: task.category || categories[0].name,
    progress: task.progress ? { ...task.progress } : { initial: 0, current: 0, target: 0, unit: "%" },
    tags: task.tags || [],
    newTagName: '',
    newTagColor: '#e0e0e0'
  });
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (editData.text.trim() === '') {
      alert('任务内容不能为空！');
      return;
    }
    
    const finalEditData = {
      ...editData,
      tags: editData.tags || []
    };
    
    onSave(finalEditData);
    onClose();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageUpload(e, task);
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个任务吗？')) {
      setShowDeleteModal(task);
      onClose();
    }
  };

  const commonTags = [
    { name: '重要', color: '#ff4444', textColor: '#fff' },
    { name: '紧急', color: '#ff9800', textColor: '#fff' },
    { name: '复习', color: '#4caf50', textColor: '#fff' },
    { name: '预习', color: '#2196f3', textColor: '#fff' },
    { name: '作业', color: '#9c27b0', textColor: '#fff' },
    { name: '考试', color: '#f44336', textColor: '#fff' },
    { name: '背诵', color: '#795548', textColor: '#fff' },
    { name: '练习', color: '#607d8b', textColor: '#fff' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: 10,
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px 15px',
        borderRadius: 16,
        width: '100%',
        maxWidth: 450,
        maxHeight: '85vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid #e0e0e0',
        position: 'relative'
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          paddingBottom: 15,
          borderBottom: "2px solid #f0f0f0"
        }}>
          <h3 style={{ 
            margin: 0, 
            color: "#1a73e8",
            fontSize: 18,
            fontWeight: "600"
          }}>
            ✏️ 编辑任务
          </h3>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={handleSave}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "600"
              }}
            >
              保存
            </button>
            
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%"
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              📝 任务内容
            </label>
            <input
              type="text"
              value={editData.text}
              onChange={(e) => setEditData({ ...editData, text: e.target.value })}
              placeholder="请输入任务内容..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 15,
                backgroundColor: '#fafafa'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: '600',
                color: '#333',
                fontSize: 14
              }}>
                📋 任务备注
              </label>
              <textarea
                value={editData.note}
                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                placeholder="输入备注..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 14,
                  resize: 'vertical',
                  backgroundColor: '#fafafa',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: '600',
                color: '#333',
                fontSize: 14
              }}>
                💭 完成感想
              </label>
              <textarea
                value={editData.reflection}
                onChange={(e) => setEditData({ ...editData, reflection: e.target.value })}
                placeholder="输入感想..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 14,
                  resize: 'vertical',
                  backgroundColor: '#fafafa',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              🗂️ 任务类别
            </label>
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                backgroundColor: '#fafafa',
                cursor: 'pointer'
              }}
            >
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              🏷️ 任务标签
            </label>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 6, 
              marginBottom: 12,
              minHeight: 32,
              padding: 10,
              border: '2px solid #e0e0e0',
              borderRadius: 10,
              backgroundColor: '#fafafa'
            }}>
              {editData.tags?.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: 9,
                    padding: '1px 4px',
                    backgroundColor: tag.color,
                    color: '#fff',
                    borderRadius: 6,
                    border: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '40px'
                  }}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = [...editData.tags];
                      newTags.splice(index, 1);
                      setEditData({ ...editData, tags: newTags });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 0,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'inherit',
                      opacity: 0.7
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {(!editData.tags || editData.tags.length === 0) && (
                <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                  暂无标签
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input
                type="text"
                placeholder="输入标签名称"
                value={editData.newTagName || ''}
                onChange={(e) => setEditData({ ...editData, newTagName: e.target.value })}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 14,
                  backgroundColor: '#fff'
                }}
              />
              <input
                type="color"
                value={editData.newTagColor || '#e0e0e0'}
                onChange={(e) => setEditData({ ...editData, newTagColor: e.target.value })}
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (editData.newTagName?.trim()) {
                    const newTag = {
                      name: editData.newTagName.trim(),
                      color: editData.newTagColor || '#e0e0e0',
                      textColor: '#333'
                    };
                    const updatedTags = [...(editData.tags || []), newTag];
                    setEditData({ 
                      ...editData, 
                      tags: updatedTags,
                      newTagName: '',
                      newTagColor: '#e0e0e0'
                    });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1a73e8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: '500'
                }}
              >
                添加
              </button>
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>常用标签:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {commonTags.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const existingTags = editData.tags || [];
                      const isAlreadyAdded = existingTags.some(t => t.name === tag.name);
                      if (!isAlreadyAdded) {
                        setEditData({ 
                          ...editData, 
                          tags: [...existingTags, tag] 
                        });
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: tag.color,
                      color: tag.textColor,
                      border: 'none',
                      borderRadius: 16,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: '500'
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              ⏰ 计划时间
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editData.scheduledTime.split('-')[0]?.split(':')[0] || ''}
                  onChange={(e) => {
                    const hours = e.target.value.padStart(2, '0');
                    const minutes = editData.scheduledTime.split('-')[0]?.split(':')[1] || '00';
                    const startTime = `${hours}:${minutes}`;
                    const endTime = editData.scheduledTime.split('-')[1] || '';
                    setEditData({ ...editData, scheduledTime: `${startTime}-${endTime}` });
                  }}
                  placeholder="08"
                  style={{
                    width: '50px',
                    padding: '8px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: '#666' }}>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editData.scheduledTime.split('-')[0]?.split(':')[1] || ''}
                  onChange={(e) => {
                    const hours = editData.scheduledTime.split('-')[0]?.split(':')[0] || '00';
                    const minutes = e.target.value.padStart(2, '0');
                    const startTime = `${hours}:${minutes}`;
                    const endTime = editData.scheduledTime.split('-')[1] || '';
                    setEditData({ ...editData, scheduledTime: `${startTime}-${endTime}` });
                  }}
                  placeholder="00"
                  style={{
                    width: '50px',
                    padding: '8px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center'
                  }}
                />
              </div>
              
              <span style={{ color: '#666', fontSize: 14, margin: '0 8px' }}>至</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editData.scheduledTime.split('-')[1]?.split(':')[0] || ''}
                  onChange={(e) => {
                    const hours = e.target.value.padStart(2, '0');
                    const minutes = editData.scheduledTime.split('-')[1]?.split(':')[1] || '00';
                    const endTime = `${hours}:${minutes}`;
                    const startTime = editData.scheduledTime.split('-')[0] || '';
                    setEditData({ ...editData, scheduledTime: `${startTime}-${endTime}` });
                  }}
                  placeholder="17"
                  style={{
                    width: '50px',
                    padding: '8px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: '#666' }}>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editData.scheduledTime.split('-')[1]?.split(':')[1] || ''}
                  onChange={(e) => {
                    const hours = editData.scheduledTime.split('-')[1]?.split(':')[0] || '00';
                    const minutes = e.target.value.padStart(2, '0');
                    const endTime = `${hours}:${minutes}`;
                    const startTime = editData.scheduledTime.split('-')[0] || '';
                    setEditData({ ...editData, scheduledTime: `${startTime}-${endTime}` });
                  }}
                  placeholder="30"
                  style={{
                    width: '50px',
                    padding: '8px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' }}>
              24小时制 (时:分)
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              📊 进度跟踪
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: 8,
              marginBottom: 8
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>初始值</div>
                <input
                  type="number"
                  value={editData.progress?.initial || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    progress: {
                      ...editData.progress,
                      initial: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 12,
                    textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>当前值</div>
                <input
                  type="number"
                  value={editData.progress?.current || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    progress: {
                      ...editData.progress,
                      current: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 12,
                    textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>目标值</div>
                <input
                  type="number"
                  value={editData.progress?.target || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    progress: {
                      ...editData.progress,
                      target: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 12,
                    textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>单位</div>
                <select
                  value={editData.progress?.unit || "%"}
                  onChange={(e) => setEditData({
                    ...editData,
                    progress: {
                      ...editData.progress,
                      unit: e.target.value
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 12
                  }}
                >
                  <option value="%">%</option>
                  <option value="页">页</option>
                  <option value="章">本</option>
                  <option value="题">题</option>
                  <option value="单元">单元</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginTop: 8
          }}>
            <button
              onClick={() => {
                onTogglePinned(task);
                setEditData({ ...editData, pinned: !editData.pinned });
              }}
              style={{
                padding: '10px 8px',
                backgroundColor: editData.pinned ? '#ffcc00' : '#f8f9fa',
                color: editData.pinned ? '#000' : '#666',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: '500'
              }}
            >
              {editData.pinned ? '📌 已置顶' : '📌 置顶'}
            </button>

            <button
              onClick={handleImageClick}
              style={{
                padding: '10px 8px',
                backgroundColor: '#f8f9fa',
                color: '#666',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: '500'
              }}
            >
              🖼️ 添加图片
            </button>

            <button
              onClick={handleDelete}
              style={{
                padding: '10px 8px',
                backgroundColor: '#f8f9fa',
                color: '#666',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: '500'
              }}
            >
              🗑️ 删除任务
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

// 任务项组件
const TaskItem = ({
  task,
  onEditTime,
  onEditNote,
  onEditReflection,
  onOpenEditModal,
  onShowImageModal,
  formatTimeWithSeconds,
  toggleDone,
  formatTimeNoSeconds,
  onMoveTask,
  categories,
  setShowMoveModal,
  onStartTimer,
  onPauseTimer, 
  isTimerRunning,
  elapsedTime,
  onUpdateProgress
}) => {
  const [showProgressControls, setShowProgressControls] = useState(false);
  
  const isLongText = task.text.length > 20;

  const handleProgressAdjust = (increment) => {
    const newCurrent = Math.max(0, (Number(task.progress.current) || 0) + increment);
    if (onUpdateProgress) {
      onUpdateProgress(task, newCurrent);
    }
  };

  const handleTimerClick = () => {
    if (isTimerRunning) {
      onPauseTimer(task);
    } else {
      onStartTimer(task);
    }
  };

  return (
    <li
      className="task-item"
      style={{
        position: "relative",
        background: task.pinned ? "#fff9e6" : "#fff",
        borderRadius: 6,
        minHeight: "24px",
        marginBottom: 4,
        padding: "8px",
        border: "0.5px solid #e0e0e0",
      }}
    >
      {!isLongText ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{
             display: "flex", 
             gap: 8, 
             alignItems: "flex-start", 
             flex: 1,
             minWidth: 0
          }}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task)}
              style={{ marginTop: "2px" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditModal(task);
                }}
                style={{
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                  cursor: "pointer",
                  textDecoration: task.done ? "line-through" : "none",
                  color: task.done ? "#999" : "#000",
                  fontWeight: task.pinned ? "bold" : "normal",
                  lineHeight: "1.4",
                  fontSize: "14px",
                }}
              >
                {task.text}
                {task.pinned && " 📌"}
                {task.isWeekTask && " 🌟"}
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 4,  
            marginTop: 0, 
            alignSelf: 'flex-start',
            alignItems: 'center'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: 3, 
              flexWrap: 'wrap',
              maxWidth: '80px'
            }}>
              {task.tags?.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: 9,
                    padding: '1px 4px',
                    backgroundColor: tag.color,
                    color: '#fff',
                    borderRadius: 6,
                    border: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '40px'
                  }}
                  title={tag.name}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimerClick();
              }}
              style={{
                fontSize: 12,
                padding: "2px 6px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "transparent",
                color: isTimerRunning ? "#ff4444" : "#4CAF50",
                cursor: "pointer",
                flexShrink: 0
              }}
              title={isTimerRunning ? "点击暂停计时" : "点击开始计时"}
            >
              {isTimerRunning ? "⏸️" : "⏱️"}
            </button>

            <span
              onClick={(e) => {
                e.stopPropagation();
                onEditTime(task);
              }}
              style={{
                fontSize: 12,
                color: "#333",
                cursor: "pointer",
                padding: "2px 8px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                backgroundColor: "#f5f5f5",
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
              title="点击修改时间"
            >
              {isTimerRunning 
                ? formatTimeNoSeconds((task.timeSpent || 0) + elapsedTime)
                : formatTimeNoSeconds(task.timeSpent || 0)
              }
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task)}
              style={{ marginTop: "2px" }}
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(task);
              }}
              style={{
                flex: 1,
                wordBreak: "break-word",
                whiteSpace: "normal",
                cursor: "pointer",
                textDecoration: task.done ? "line-through" : "none",
                color: task.done ? "#999" : "#000",
                fontWeight: task.pinned ? "bold" : "normal",
                lineHeight: "1.4",
                fontSize: "14px",
                paddingRight: '20px'
              }}
            >
              {task.text}
              {task.pinned && " 📌"}
              {task.isWeekTask && " 🌟"}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: '4px'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: 3, 
              flexWrap: 'wrap',
              justifyContent: 'flex-end'
            }}>
              {task.tags?.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: 9,
                    padding: '1px 4px',
                    backgroundColor: tag.color,
                    color: '#fff',
                    borderRadius: 6,
                    border: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '40px'
                  }}
                  title={tag.name}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 4, 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTimerClick();
                }}
                style={{
                  fontSize: 12,
                  padding: "2px 6px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "transparent",
                  color: isTimerRunning ? "#ff4444" : "#4CAF50",
                  cursor: "pointer",
                  flexShrink: 0
                }}
                title={isTimerRunning ? "点击暂停计时" : "点击开始计时"}
              >
                {isTimerRunning ? "⏸️" : "⏱️"}
              </button>

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTime(task);
                }}
                style={{
                  fontSize: 12,
                  color: "#333",
                  cursor: "pointer",
                  padding: "2px 8px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#f5f5f5",
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
                title="点击修改时间"
              >
                {isTimerRunning 
                  ? formatTimeNoSeconds((task.timeSpent || 0) + elapsedTime)
                  : formatTimeNoSeconds(task.timeSpent || 0)
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {task.progress && task.progress.target > 0 && (
        <div style={{ marginTop: 6 }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowProgressControls(!showProgressControls);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{
              width: '100%',
              height: 10,
              backgroundColor: '#f0f0f0',
              borderRadius: 5,
              overflow: 'hidden',
              marginBottom: 6
            }}>
              <div style={{
                width: `${Math.min(((Number(task.progress.current) - Number(task.progress.initial)) / 
                        Math.max(Number(task.progress.target) - Number(task.progress.initial), 1)) * 100, 100)}%`,
                height: '100%',
                backgroundColor: Number(task.progress.current) >= Number(task.progress.target) ? '#4CAF50' : '#2196F3',
                borderRadius: 5,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 0,
            height: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 8,
              fontSize: 11.5,
              color: '#666'
            }}>
              <span>{(() => {
                const current = Number(task.progress.current) || 0;
                const initial = Number(task.progress.initial) || 0;
                const target = Number(task.progress.target) || 0;
                const progress = Math.min(((current - initial) / Math.max(target - initial, 1)) * 100, 100);
                return isNaN(progress) ? '0%' : `${Math.round(progress)}%`;
              })()}</span>
              <span>|</span>
              <span>{task.progress.current || 0}/{task.progress.target || 0} {task.progress.unit}</span>
            </div>

            {showProgressControls ? (
              <div style={{ 
                display: 'flex', 
                gap: 4, 
                width: '68px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressAdjust(-1);
                  }}
                  style={{
                    padding: '1px 6px',
                    fontSize: 10,
                    border: '1px solid #ccc',
                    borderRadius: 3,
                    backgroundColor: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    minWidth: '26px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  -
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressAdjust(1);
                  }}
                  style={{
                    padding: '1px 6px',
                    fontSize: 10,
                    border: '1px solid #ccc',
                    borderRadius: 3,
                    backgroundColor: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    minWidth: '26px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  +
                </button>
              </div>
            ) : (
              <div style={{ width: '60px' }} />
            )}
          </div>
        </div>
      )}

      {task.note && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenEditModal(task);
          }}
          style={{
            fontSize: 12,
            color: "#666",
            marginTop: 4,
            marginBottom: 4,
            cursor: "pointer",
            backgroundColor: 'transparent',
            lineHeight: "1.3",
            whiteSpace: "pre-wrap"
          }}
        >
          {task.note}
        </div>
      )}

      {task.reflection && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenEditModal(task);
            const newReflection = window.prompt("编辑感想", task.reflection);
            if (newReflection !== null) {
              onEditReflection(task, newReflection);
            }
          }}
          style={{
            fontSize: 12,
            color: "#000",
            marginTop: 4,
            marginBottom: 4,
            cursor: "pointer",
            backgroundColor: '#fff9c4',
            padding: '6px 8px',
            borderRadius: '4px',
            lineHeight: "1.3",
            whiteSpace: "pre-wrap",
            border: '1px solid #ffd54f'
          }}
        >
          💭 {task.reflection}
        </div>
      )}
      
      {task.image && (
        <div style={{ marginTop: 4, marginBottom: 4 }}>
          <img
            src={task.image}
            alt="任务图片"
            onClick={(e) => {
              e.stopPropagation();
              onShowImageModal(task.image);
            }}
            style={{
              maxWidth: "100%",
              maxHeight: "100px",
              borderRadius: 4,
              cursor: "zoom-in"
            }}
          />
        </div>
      )}
    </li>
  );
};

// 每日日志汇总模态框
const DailyLogModal = ({ logData, onClose, onCopy }) => {
  if (!logData) return null;

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
        maxWidth: 400,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
          📅 {logData.date} 学习汇总
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 15
        }}>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 10,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>完成任务</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.completedTasks} 个
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 10,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>总任务数</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.totalTasks} 个
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 10,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>完成率</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.completionRate}%
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 10,
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#666' }}>学习时长</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.totalMinutes} 分钟
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: 10,
          borderRadius: 6,
          marginBottom: 15,
          maxHeight: 200,
          overflow: 'auto',
          fontSize: 12,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap'
        }}>
          {logData.content}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
          <button
            onClick={onCopy}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            📋 复制日志
          </button>
        </div>
      </div>
    </div>
  );
};

// 统计页面组件
const StatsPage = ({ statsMode, setStatsMode, setShowStats, dailyStudyData, categoryData, dailyTasksData, avgCompletion, avgDailyTime }) => {
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
      </div>

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

// 主应用组件
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
  const [shelddiTasks, setShelddiTasks] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [statsMode, setStatsMode] = useState("week");
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showImageModal, setShowImageModal] = useState(null);
  const [showDailyLogModal, setShowDailyLogModal] = useState(null);
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(null);
  const runningRefs = useRef({});
  const addInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

// 添加处理 Shelddi 任务的函数
const handleAddShelddiTask = (text) => {
    const newTask = {
      id: Date.now().toString(),
      text,
      done: false,
      category: "Shelddi",
      createdAt: new Date().toISOString(),
      timeSpent: 0,
      note: "",
      reflection: "",
      progress: 
      {  // ← 这里改成对象，而不是数字 0
        initial: 0,
        current: 0,
        target: 0,
        unit: "%"
      }
    };
    setShelddiTasks(prev => [...prev, newTask]);
  };
  
  // 添加其他必要的处理函数
  const toggleShelddiTaskDone = (taskId) => {
    setShelddiTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  };
  
  const editShelddiTaskTime = (taskId, timeSpent) => {
    setShelddiTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, timeSpent } : task
      )
    );
  };
  




  // 进度更新函数
  const handleUpdateProgress = (task, newCurrent) => {
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };
      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? {
            ...t,
            progress: {
              ...t.progress,
              current: newCurrent
            }
          } : t
        );
      });
      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? {
            ...t,
            progress: {
              ...t.progress,
              current: newCurrent
            }
          } : t
        )
      }));
    }
  };

  // 开始计时
  const handleStartTimer = (task) => {
    if (activeTimer && activeTimer.taskId !== task.id) {
      handlePauseTimer({ id: activeTimer.taskId });
    }
    
    const startTime = Date.now();
    setActiveTimer({ taskId: task.id, startTime });
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active.postMessage({
          type: 'START_TIMER',
          taskId: task.id,
          startTime: startTime
        });
      });
    }
    
    localStorage.setItem(`timer_${task.id}`, startTime.toString());
  };

  // 暂停计时
  const handlePauseTimer = (task) => {
    if (!activeTimer || activeTimer.taskId !== task.id) return;
    
    const endTime = Date.now();
    const timeSpent = Math.floor((endTime - activeTimer.startTime) / 1000);
    
    setTasksByDate(prev => {
      const currentTasks = prev[selectedDate] || [];
      const updatedTasks = currentTasks.map(t =>
        t.id === task.id ? { 
          ...t, 
          timeSpent: (t.timeSpent || 0) + timeSpent 
        } : t
      );
      
      return {
        ...prev,
        [selectedDate]: updatedTasks
      };
    });
    
    setActiveTimer(null);
    localStorage.removeItem(`timer_${task.id}`);
  };

  // 恢复计时器状态
  useEffect(() => {
    const keys = Object.keys(localStorage);
    const timerKeys = keys.filter(key => key.startsWith('timer_'));
    
    if (timerKeys.length > 0) {
      timerKeys.forEach(key => {
        const taskId = key.replace('timer_', '');
        const startTime = parseInt(localStorage.getItem(key));
        const currentTime = Date.now();
        const timeSpent = Math.floor((currentTime - startTime) / 1000);
        
        setTasksByDate(prev => {
          const updatedTasksByDate = { ...prev };
          Object.keys(updatedTasksByDate).forEach(date => {
            updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
              t.id === taskId ? { 
                ...t, 
                timeSpent: (t.timeSpent || 0) + timeSpent 
              } : t
            );
          });
          return updatedTasksByDate;
        });
        
        setActiveTimer({ taskId, startTime: Date.now() - timeSpent * 1000 });
      });
    }
  }, []);

  // 实时更新计时显示
  useEffect(() => {
    let interval;
    
    if (activeTimer) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const timeElapsed = Math.floor((currentTime - activeTimer.startTime) / 1000);
        setElapsedTime(timeElapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTimer]);

  // 时间格式化函数
  const formatTimeNoSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds}s`;
  };

  const formatTimeWithSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds}s`;
  };

  const formatCategoryTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m${remainingSeconds}s`;
  };

  const formatTimeInHours = (seconds) => {
    const hours = (seconds / 3600).toFixed(1);
    return `${hours}h`;
  };

  // 移动任务函数
  const moveTask = (task, targetCategory) => {
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };
      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? { ...t, category: targetCategory } : t
        );
      });
      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, category: targetCategory } : t
        )
      }));
    }
  };

  // 初始化数据
  useEffect(() => {
    const saved = localStorage.getItem("tasksByDate");
    if (saved) setTasksByDate(JSON.parse(saved));

    const savedTemplates = localStorage.getItem("taskTemplates");
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
    }
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  // 保存模板到本地存储
  useEffect(() => {
    localStorage.setItem("taskTemplates", JSON.stringify(templates));
  }, [templates]);

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

  // 获取本周任务
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

  // 生成图表数据
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

  const { dailyStudyData, categoryData, dailyTasksData, avgCompletion, avgDailyTime } = generateChartData();

  // 添加任务
  const handleAddTask = (template = null) => {
    let text, category;

    if (template) {
      text = template.content;
      category = template.category;
    } else {
      text = newTaskText.trim();
      category = newTaskCategory;
      if (!text) return;
    }

    const baseTask = {
      id: Date.now().toString(),
      text,
      category,
      done: false,
      timeSpent: 0,
      note: "",
      reflection: "",
      image: null,
      scheduledTime: repeatConfig.startTime && repeatConfig.endTime ?
        `${repeatConfig.startTime}-${repeatConfig.endTime}` : "",
      pinned: false,
      progress: {
        initial: 0,
        current: 0,
        target: 0,
        unit: "%"
      }
    };

    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };

      const hasRepeatConfig = repeatConfig.frequency &&
        (repeatConfig.frequency === "" ||
          (repeatConfig.frequency === "weekly" && repeatConfig.days.some(day => day)));

      if (hasRepeatConfig) {
        if (repeatConfig.frequency === "daily") {
          for (let i = 0; i < 7; i++) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];

            if (!newTasksByDate[dateStr]) {
              newTasksByDate[dateStr] = [];
            }

            const existingTask = newTasksByDate[dateStr].find(
              task => task.text === text && task.category === category
            );

            if (!existingTask) {
              newTasksByDate[dateStr].push({
                ...baseTask,
                id: `${baseTask.id}_${dateStr}`,
                isRepeating: true,
                repeatId: baseTask.id,
                progress: null
              });
            }
          }
        } else if (repeatConfig.frequency === "weekly") {
          const startDate = new Date(selectedDate);

          for (let week = 0; week < 4; week++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() + (week * 7));
            const dayOfWeek = weekStart.getDay();
            const monday = new Date(weekStart);
            monday.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

            repeatConfig.days.forEach((isSelected, dayIndex) => {
              if (isSelected) {
                const taskDate = new Date(monday);
                taskDate.setDate(monday.getDate() + dayIndex);
                const dateStr = taskDate.toISOString().split("T")[0];

                if (taskDate >= new Date(selectedDate)) {
                  if (!newTasksByDate[dateStr]) {
                    newTasksByDate[dateStr] = [];
                  }

                  const existingTask = newTasksByDate[dateStr].find(
                    task => task.text === text && task.category === category
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
          task => task.text === text && task.category === category
        );

        if (!existingTask) {
          newTasksByDate[selectedDate].push(baseTask);
        }
      }

      return newTasksByDate;
    });

    if (!template) {
      setNewTaskText("");
      setShowAddInput(false);
      setRepeatConfig({
        frequency: "daily",
        days: [false, false, false, false, false, false, false],
        startTime: "",
        endTime: ""
      });
    }
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
      isWeekTask: true,
      reflection: ""
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
      pinned: false,
      reflection: "",
      tags: [{ name: '作业', color: '#9c27b0', textColor: '#fff' }]
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

  // 打开任务编辑模态框
  const openTaskEditModal = (task) => {
    setShowTaskEditModal(task);
  };

  // 编辑任务时间
  const editTaskTime = (task) => {
    const currentTime = Math.floor((task.timeSpent || 0) / 60);
    const newTime = window.prompt("修改任务时间（分钟）", currentTime);

    if (newTime !== null && !isNaN(newTime) && newTime >= 0) {
      const seconds = parseInt(newTime) * 60;

      if (task.isWeekTask) {
        const updatedTasksByDate = { ...tasksByDate };

        Object.keys(updatedTasksByDate).forEach(date => {
          updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
            t.isWeekTask && t.text === task.text ? { ...t, timeSpent: seconds } : t
          );
        });

        setTasksByDate(updatedTasksByDate);
      } else {
        setTasksByDate(prev => ({
          ...prev,
          [selectedDate]: prev[selectedDate].map(t =>
            t.id === task.id ? { ...t, timeSpent: seconds } : t
          )
        }));
      }
    }
  };

  // 修复置顶功能
  const togglePinned = (task) => {
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
    const newNote = window.prompt("编辑备注（支持多行文本）", task.note || "");
    if (newNote !== null) {
      if (task.isWeekTask) {
        const updatedTasksByDate = { ...tasksByDate };

        Object.keys(updatedTasksByDate).forEach(date => {
          updatedTasksByDate[date] = updatedTasksByDate[date].map(t => {
            if (t.isWeekTask && t.text === task.text) {
              return { ...t, note: newNote };
            }
            return t;
          });
        });

        setTasksByDate(updatedTasksByDate);
      } else {
        setTasksByDate(prev => {
          const currentTasks = prev[selectedDate] || [];
          const updatedTasks = currentTasks.map(t => {
            if (t.id === task.id) {
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

  // 编辑任务感想
  const editTaskReflection = (task, reflection) => {
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };

      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? { ...t, reflection } : t
        );
      });

      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, reflection } : t
        )
      }));
    }
  };

  // 保存任务编辑
  const saveTaskEdit = (task, editData) => {
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };
      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? {
            ...t,
            text: editData.text,
            note: editData.note,
            reflection: editData.reflection,
            scheduledTime: editData.scheduledTime,
            category: editData.category,
            progress: editData.progress,
            tags: editData.tags || []
          } : t
        );
      });
      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? {
            ...t,
            text: editData.text,
            note: editData.note,
            reflection: editData.reflection,
            scheduledTime: editData.scheduledTime,
            category: editData.category,
            progress: editData.progress,
            tags: editData.tags || []
          } : t
        )
      }));
    }
  };

  // 编辑计划时间
  const editScheduledTime = (task) => {
    const currentTime = task.scheduledTime || "";
    const newTime = window.prompt("编辑计划时间 (格式: HH:MM-HH:MM)", currentTime);

    if (newTime !== null) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (newTime === "" || timeRegex.test(newTime)) {
        if (task.isWeekTask) {
          const updatedTasksByDate = { ...tasksByDate };

          Object.keys(updatedTasksByDate).forEach(date => {
            updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
              t.isWeekTask && t.text === task.text ? { ...t, scheduledTime: newTime } : t
            );
          });

          setTasksByDate(updatedTasksByDate);
        } else {
          setTasksByDate(prev => ({
            ...prev,
            [selectedDate]: prev[selectedDate].map(t =>
              t.id === task.id ? { ...t, scheduledTime: newTime } : t
            )
          }));
        }
      } else {
        alert("时间格式不正确！请使用 HH:MM-HH:MM 格式，例如：09:00-10:30");
      }
    }
  };

  // 删除计划时间
  const deleteScheduledTime = (task) => {
    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };

      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? { ...t, scheduledTime: "" } : t
        );
      });

      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? { ...t, scheduledTime: "" } : t
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

  // 手动修改分类总时间
  const editCategoryTime = (catName) => {
    const currentTime = totalTime(catName);
    const newTime = window.prompt(`修改 ${catName} 的总时间（分钟）`, Math.floor(currentTime / 60));

    if (newTime !== null && !isNaN(newTime) && newTime >= 0) {
      const seconds = parseInt(newTime) * 60;
      const timeDifference = seconds - currentTime;

      if (timeDifference !== 0) {
        setTasksByDate(prev => {
          const newTasksByDate = { ...prev };
          const todayTasks = newTasksByDate[selectedDate] || [];

          const catTasks = todayTasks.filter(t => t.category === catName);
          if (catTasks.length > 0) {
            const firstTask = catTasks[0];
            newTasksByDate[selectedDate] = todayTasks.map(t =>
              t.id === firstTask.id ? { ...t, timeSpent: (t.timeSpent || 0) + timeDifference } : t
            );
          } else {
            if (!newTasksByDate[selectedDate]) {
              newTasksByDate[selectedDate] = [];
            }
            newTasksByDate[selectedDate].push({
              id: `time_${catName}_${Date.now()}`,
              text: `${catName}时间记录`,
              category: catName,
              done: true,
              timeSpent: seconds,
              note: "时间记录",
              image: null,
              scheduledTime: "",
              pinned: false
            });
          }

          return newTasksByDate;
        });
      }
    }
  };

  // 获取分类任务
  const getCategoryTasks = (catName) =>
    tasks.filter(t => t.category === catName);

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

  // 日期选择处理函数
  const handleDateSelect = (selectedDate) => {
    const selectedMonday = getMonday(selectedDate);
    setCurrentMonday(selectedMonday);
    setSelectedDate(selectedDate.toISOString().split("T")[0]);
    setShowDatePickerModal(false);
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

  // 生成每日日志
  const generateDailyLog = () => {
    const todayTasks = tasksByDate[selectedDate] || [];
    const completedTasks = todayTasks.filter(task => task.done);

    if (completedTasks.length === 0) {
      alert('今日还没有完成的任务！');
      return;
    }

    const tasksByCategory = {};
    todayTasks.forEach(task => {
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = [];
      }
      tasksByCategory[task.category].push(task);
    });

    const totalTime = completedTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const totalMinutes = Math.floor(totalTime / 60);

    let logContent = `📅 ${selectedDate} 学习日志\n\n`;

    Object.entries(tasksByCategory).forEach(([category, tasks]) => {
      logContent += `📚 ${category}:\n`;
      tasks.forEach((task, index) => {
        const timeText = task.timeSpent ? `${Math.floor(task.timeSpent / 60)}m` : '0m';
        const status = task.done ? '✅' : '❌';
        logContent += `  ${index + 1}. ${status} ${task.text} - ${timeText}\n`;
        if (task.note) {
          logContent += `     备注: ${task.note}\n`;
        }
      });
      logContent += '\n';
    });

    logContent += `📊 今日统计:\n`;
    logContent += `   完成任务: ${completedTasks.length} 个\n`;
    logContent += `   总任务数: ${todayTasks.length} 个\n`;
    logContent += `   完成率: ${Math.round((completedTasks.length / todayTasks.length) * 100)}%\n`;
    logContent += `   学习时长: ${totalMinutes} 分钟\n`;
    logContent += `   平均每项: ${completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0} 分钟\n`;

    setShowDailyLogModal({
      visible: true,
      content: logContent,
      date: selectedDate,
      stats: {
        completedTasks: completedTasks.length,
        totalTasks: todayTasks.length,
        completionRate: Math.round((completedTasks.length / todayTasks.length) * 100),
        totalMinutes: totalMinutes,
        averagePerTask: completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0,
        categories: Object.keys(tasksByCategory).length
      }
    });
  };

  // 添加模板
  const handleAddTemplate = (template) => {
    setTemplates(prev => [...prev, template]);
  };

  // 删除模板
  const handleDeleteTemplate = (index) => {
    setTemplates(prev => prev.filter((_, i) => i !== index));
  };

  // 使用模板
  const handleUseTemplate = (template) => {
    handleAddTask(template);
  };

  // 计算今日统计数据
  const todayTasks = tasksByDate[selectedDate] || [];
  const learningTime = tasks
    .filter(t => t.category !== "体育")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const sportTime = todayTasks
    .filter(t => t.category === "体育")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const totalTasks = todayTasks.length;
  const completionRate = totalTasks === 0 ? 0 :
    Math.round((todayTasks.filter(t => t.done).length / totalTasks) * 100);

  // 如果显示时间表页面
  if (showSchedule) {
    return (
      <SchedulePage
        tasksByDate={tasksByDate}
        currentMonday={currentMonday}
        onClose={() => setShowSchedule(false)}
        formatTimeNoSeconds={formatTimeNoSeconds}
        onMoveTask={moveTask}
        categories={categories}
      />
    );
  }

  // 如果显示统计页面
  if (showStats) {
    return (
      <StatsPage
        statsMode={statsMode}
        setStatsMode={setStatsMode}
        setShowStats={setShowStats}
        dailyStudyData={dailyStudyData}
        categoryData={categoryData}
        dailyTasksData={dailyTasksData}
        avgCompletion={avgCompletion}
        avgDailyTime={avgDailyTime}
      />
    );
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

      <div style={{
        textAlign: "center",
        fontSize: "11px",
        color: "#999",
        marginBottom: "10px"
      }}>
        更新于: {new Date().toLocaleString()}
      </div>

      {/* 所有模态框组件 */}
      {showImageModal && (
        <ImageModal
          imageUrl={showImageModal}
          onClose={() => setShowImageModal(null)}
        />
      )}
      {showRepeatModal && (
        <RepeatModal
          config={repeatConfig}
          onSave={(newConfig) => setRepeatConfig(newConfig)}
          onClose={() => setShowRepeatModal(false)}
        />
      )}
      {showDailyLogModal && (
        <DailyLogModal
          logData={showDailyLogModal}
          onClose={() => setShowDailyLogModal(null)}
          onCopy={() => {
            const copyToClipboard = (text) => {
              if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(text);
              } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                  document.execCommand('copy');
                  return Promise.resolve();
                } catch (err) {
                  return Promise.reject(err);
                } finally {
                  document.body.removeChild(textArea);
                }
              }
            };

            copyToClipboard(showDailyLogModal.content).then(() => {
              alert('日志已复制到剪贴板！');
            }).catch(() => {
              alert('复制失败，请手动复制日志内容');
            });
          }}
        />
      )}
      {showTimeModal && (
        <TimeModal
          config={repeatConfig}
          onSave={(newConfig) => setRepeatConfig(newConfig)}
          onClose={() => setShowTimeModal(false)}
        />
      )}
      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          onSave={handleAddTemplate}
          onClose={() => setShowTemplateModal(false)}
          onDelete={handleDeleteTemplate}
        />
      )}

      {showDatePickerModal && (
        <DatePickerModal
          onClose={() => setShowDatePickerModal(false)}
          onSelectDate={handleDateSelect}
        />
      )}

      {showTaskEditModal && (
        <TaskEditModal
          task={showTaskEditModal}
          categories={categories}
          onClose={() => setShowTaskEditModal(null)}
          onSave={(editData) => saveTaskEdit(showTaskEditModal, editData)}
          onTogglePinned={togglePinned}
          onImageUpload={handleImageUpload}
          setShowDeleteModal={setShowDeleteModal}
        />
      )}

      {showMoveModal && (
        <MoveSelectModal
          task={showMoveModal}
          categories={categories}
          onClose={() => setShowMoveModal(null)}
          onMove={moveTask}
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
          onEditReflection={editTaskReflection}
          onImageUpload={handleImageUpload}
          onEditScheduledTime={editScheduledTime}
          onDeleteScheduledTime={deleteScheduledTime}
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

      {/* 主页面内容 */}
      <h1 style={{
        textAlign: "center",
        color: "#1a73e8",
        fontSize: 20
      }}>
        每日任务管理
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
        <div style={{ width: 80 }}></div>
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
          <button
            onClick={() => setShowDatePickerModal(true)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "8px"
            }}
            title="选择日期"
          >
            📅
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
            padding: "3px 8px",  // 上下padding改小
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            fontSize: "13px",  // 文字变小
  minHeight: "24px"  // 控制最小高度
          }}
        >
          <span>本周任务 ({weekTasks.filter(t => t.done).length}/{weekTasks.length})</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12 }}>
             
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
              <TaskItem
                key={task.id}
                task={task}
                onEditTime={editTaskTime}
                onEditNote={editTaskNote}
                onEditReflection={editTaskReflection}
                onOpenEditModal={openTaskEditModal}
                onShowImageModal={setShowImageModal}
                toggleDone={toggleDone}
                formatTimeNoSeconds={formatTimeNoSeconds}
                formatTimeWithSeconds={formatTimeWithSeconds}
                onMoveTask={moveTask}
                categories={categories}
                setShowMoveModal={setShowMoveModal}
                onUpdateProgress={handleUpdateProgress}
                onStartTimer={handleStartTimer}
                elapsedTime={elapsedTime} // 新增这行
  onPauseTimer={handlePauseTimer}
  isTimerRunning={activeTimer?.taskId === task.id}
              />
            ))}
          </ul>
        )}
      </div>


{/* Shelddi 固定区域 */}
<div style={{
  marginBottom: 8,
  borderRadius: 10,
  overflow: "hidden",
  border: "2px solid #9370DB",
  backgroundColor: "#fff"
}}>
  <div
    onClick={() => setCollapsedCategories(prev => ({
      ...prev,
      "Shelddi": !prev["Shelddi"]
    }))}
    style={{
      backgroundColor: "#9370DB",
      color: "#fff",
      padding: "3px 8px",
      fontWeight: "bold",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "13px",
      minHeight: "24px"
    }}
  >
    <span>Shelddi ({shelddiTasks.filter(t => t.done).length}/{shelddiTasks.length})</span>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          const text = window.prompt("添加 Shelddi 任务");
          if (text && text.trim()) {
            handleAddShelddiTask(text.trim()); // 使用定义好的函数
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

  {!collapsedCategories["Shelddi"] && shelddiTasks.length > 0 && (
    <ul style={{
      listStyle: "none",
      padding: 8,
      margin: 0
    }}>
      {shelddiTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEditTime={editShelddiTaskTime} // 使用专门的处理函数
          onEditNote={editTaskNote}
          onEditReflection={editTaskReflection}
          onOpenEditModal={openTaskEditModal}
          onShowImageModal={setShowImageModal}
          toggleDone={toggleShelddiTaskDone} // 使用专门的处理函数
          formatTimeNoSeconds={formatTimeNoSeconds}
          formatTimeWithSeconds={formatTimeWithSeconds}
          onMoveTask={moveTask}
          categories={categories}
          setShowMoveModal={setShowMoveModal}
          onUpdateProgress={handleUpdateProgress}
          onStartTimer={handleStartTimer}
          elapsedTime={elapsedTime}
          onPauseTimer={handlePauseTimer}
          isTimerRunning={activeTimer?.taskId === task.id}
        />
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
            <span>📌 置顶任务 ({pinnedTasks.length})</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (pinnedTasks.length > 0) {
                  editTaskTime(pinnedTasks[0]);
                }
              }}
              style={{
                fontSize: "12px",
                color: "#666",
                cursor: "pointer",
                padding: "2px 6px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#f5f5f5"
              }}
              title="点击修改时间"
            >
              ✏️
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
                <TaskItem
                  key={task.id}
                  task={task}
                  onEditTime={editTaskTime}
                  onEditNote={editTaskNote}
                  onEditReflection={editTaskReflection}
                  onOpenEditModal={openTaskEditModal}
                  onShowImageModal={setShowImageModal}
                  toggleDone={toggleDone}
                  formatTimeNoSeconds={formatTimeNoSeconds}
                  formatTimeWithSeconds={formatTimeWithSeconds}
                  onMoveTask={moveTask}
                  categories={categories}
                  setShowMoveModal={setShowMoveModal}
                  onUpdateProgress={handleUpdateProgress}
                  onStartTimer={handleStartTimer}
  onPauseTimer={handlePauseTimer}
  isTimerRunning={activeTimer?.taskId === task.id}
  elapsedTime={elapsedTime} // 新增这行
                />
              ))}
          </ul>
        </div>
      )}

      {categories.map((c) => {
        const catTasks = getCategoryTasks(c.name);
        if (catTasks.length === 0) return null;
        const isComplete = isCategoryComplete(c.name);
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
                padding: "3px 8px",  // 上下padding改小
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontSize: "13px",  // 文字变小
  minHeight: "24px"  // 控制最小高度
              }}
            >
              <span>
              {c.name} ({getCategoryTasks(c.name).filter(t => t.done).length}/{getCategoryTasks(c.name).length})
                {isComplete && " ✓"}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  editCategoryTime(c.name);
                }}
                style={{
                  fontSize: 12,
                  color: isComplete ? "#888" : "#fff",
                  cursor: "pointer",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "transparent"
                }}
                title="点击修改总时间"
              >
                {formatCategoryTime(totalTime(c.name))}
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
                    <TaskItem
                      key={task.id}
                      task={task}
                      onEditTime={editTaskTime}
                      onEditNote={editTaskNote}
                      onEditReflection={editTaskReflection}
                      onOpenEditModal={openTaskEditModal}
                      onShowImageModal={setShowImageModal}
                      toggleDone={toggleDone}
                      formatTimeNoSeconds={formatTimeNoSeconds}
                      formatTimeWithSeconds={formatTimeWithSeconds}
                      onMoveTask={moveTask}
                      categories={categories}
                      setShowMoveModal={setShowMoveModal}
                      onUpdateProgress={handleUpdateProgress}
                      onStartTimer={handleStartTimer}
  onPauseTimer={handlePauseTimer}
  isTimerRunning={activeTimer?.taskId === task.id}
  elapsedTime={elapsedTime} // 新增这行
                    />
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
            backgroundColor: "#1a73e8", // 固定蓝色背景
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
    outline: "none",
    boxShadow: "none",
    transform: "none",
    transition: "none"
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            // 强制保持样式
            e.target.style.backgroundColor = "#1a73e8";
            e.target.style.color = "#fff";
          }}
          onMouseUp={(e) => {
            e.target.style.backgroundColor = "#1a73e8";
            e.target.style.color = "#fff";
          }}
          onFocus={(e) => {
            e.target.style.backgroundColor = "#1a73e8";
            e.target.style.color = "#fff";
          }}
          onBlur={(e) => {
            e.target.style.backgroundColor = "#1a73e8";
            e.target.style.color = "#fff";
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTemplateModal(true);
              }}
              style={{
                padding: "6px 10px",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              模板
            </button>

            {templates.map((template, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseTemplate(template);
                }}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "12px"
                }}
                title={`${template.name}: ${template.content}`}
              >
                {template.name}
              </button>
            ))}
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
          { label: "学习时间", value: formatTimeInHours(learningTime) },
          { label: "运动时间", value: formatTimeInHours(sportTime) },
          { label: "任务数量", value: `${todayTasks.filter(t => t.done).length}/${totalTasks}` },
          { label: "完成进度", value: `${completionRate}%` },
          {
            label: "统计汇总",
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
              {item.value || ""}
            </div>
          </div>
        ))}
      </div>

      {/* 底部按钮区域 */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 10,
        marginTop: 20,
        marginBottom: 20,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => generateDailyLog()}
          style={{
            padding: "6px 10px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            fontSize: 12,
            borderRadius: 6,
            width: "70px",
            height: "30px",
            cursor: "pointer"
          }}
        >
          每日日志
        </button>
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
          清空数据222
        </button>
      </div>
    </div>
  );
}

export default App;
