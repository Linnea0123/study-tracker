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

    console.log('🔍 检查任务时间信息:', {
      任务: task.text,
      计时时间: task.timeSpent,
      开始时间: task.actualStartTime,
      日期: date
    });

    // 如果有计划时间，使用计划时间
    if (task.scheduledTime) {
      const [startTime, endTime] = task.scheduledTime.split('-');
      return { startTime, endTime, type: 'scheduled' };
    }

    // 如果有计时时间段，显示每个时间段
    if (task.timeSegments && task.timeSegments.length > 0) {
      // 返回第一个时间段
      const segment = task.timeSegments[0];
      const startTimeDate = new Date(segment.startTime);
      const startTime = `${startTimeDate.getHours().toString().padStart(2, '0')}:${startTimeDate.getMinutes().toString().padStart(2, '0')}`;

      const endTimeDate = new Date(segment.endTime);
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

// 模板管理模态框
const TemplateModal = ({ templates, onSave, onClose, onDelete }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState(categories[0].name);
  const [templateContent, setTemplateContent] = useState('');

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
        maxWidth: 350,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>任务模板</h3>

        {/* 添加新模板 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>添加新模板:</div>
          <input
            type="text"
            placeholder="模板名称"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <select
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          >
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="任务内容"
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button
            onClick={() => {
              if (templateName && templateContent) {
                onSave({
                  name: templateName,
                  category: templateCategory,
                  content: templateContent
                });
                setTemplateName('');
                setTemplateContent('');
              }
            }}
            style={{
              width: '100%',
              padding: 10,
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            添加模板
          </button>
        </div>

        {/* 现有模板列表 */}
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>现有模板:</div>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
              暂无模板
            </div>
          ) : (
            templates.map((template, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 4,
                  marginBottom: 8
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 12 }}>{template.name}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>
                    {template.category} - {template.content}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(index)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#d32f2f',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};




// 操作菜单模态框
const ActionMenuModal = ({ task, onClose, onEditText, onEditNote, onEditReflection, onTogglePinned, onImageUpload, setShowDeleteModal,
  onEditScheduledTime, onDeleteScheduledTime, position }) => {
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
        {/* == 添加感想选项 == */}
        <button
          onClick={() => {
            const reflection = window.prompt(
              "添加完成感想（支持多行文本）",
              task.reflection || ""
            );
            if (reflection !== null) {
              // 这里需要调用父组件的更新函数
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


//== 在所有模态框组件之后添加 ==//
//== 修改 DatePickerModal 为月历视图 ==//
// 日期选择模态框 - 月历视图
const DatePickerModal = ({ onClose, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 获取月份的第一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  // 获取月份的最后一天
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  // 获取月份的第一天是星期几（0=周日，1=周一，...）
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 生成月份的日期数组
  const daysInMonth = [];
  const totalDays = lastDayOfMonth.getDate();

  // 添加空白格子（上个月的日期）
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysInMonth.push(null);
  }

  // 添加本月的日期
  for (let i = 1; i <= totalDays; i++) {
    daysInMonth.push(i);
  }

  // 周几的标题
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 切换到上个月
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 切换到下个月
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 检查是否是今天
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxWidth: 350
      }}>
        {/* 年月导航 */}
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

        {/* 周几标题 */}
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

        {/* 日期网格 */}
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
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeItems, setExchangeItems] = useState([]);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(null); //== 添加任务编辑模态框状态 ==//


  const runningRefs = useRef({});
  const addInputRef = useRef(null);
  const bulkInputRef = useRef(null);

  // 格式化时间显示 - 只显示分钟
  const formatTimeNoSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  // 格式化时间为小时 - 显示0.0h格式
  const formatTimeInHours = (seconds) => {
    const hours = (seconds / 3600).toFixed(1); // 保留1位小数
    return `${hours}h`;
  };

  // 初始化数据
  useEffect(() => {
    const saved = localStorage.getItem("tasksByDate");
    if (saved) setTasksByDate(JSON.parse(saved));

    const savedTemplates = localStorage.getItem("taskTemplates");
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

    const savedExchangeItems = localStorage.getItem("exchangeItems");
    if (savedExchangeItems) setExchangeItems(JSON.parse(savedExchangeItems));
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  // 保存兑换物品数据到本地存储
  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
    localStorage.setItem("exchangeItems", JSON.stringify(exchangeItems));
  }, [tasksByDate, exchangeItems]);

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

  // 添加任务 - 修复日期选择问题
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
      reflection: "", //== 添加感想字段 ==//
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
            const date = new Date(selectedDate); // 使用选中的日期作为起始点
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
                repeatId: baseTask.id
              });
            }
          }
        } else if (repeatConfig.frequency === "weekly") {
          const startDate = new Date(selectedDate); // 使用选中的日期

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

                if (taskDate >= new Date(selectedDate)) { // 从选中日期开始
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
        // 单次任务，使用选中的日期
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
      reflection: "" //== 确保有这个字段 ==//
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
      reflection: "" //== 确保有这个字段 ==//
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


 //== 打开任务编辑模态框 ==//
const openTaskEditModal = (task) => {
  setShowTaskEditModal(task);
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

  // 编辑任务备注 - 使用多行文本输入框
  const editTaskNote = (task) => {
    const newNote = window.prompt("编辑备注（支持多行文本）", task.note || "");
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

  //== 编辑任务感想 ==//
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

  //== 保存任务编辑 ==//
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
          scheduledTime: editData.scheduledTime
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
          scheduledTime: editData.scheduledTime
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
      // 验证时间格式
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

          // 找到该分类的第一个任务来调整时间
          const catTasks = todayTasks.filter(t => t.category === catName);
          if (catTasks.length > 0) {
            // 在第一个任务上调整时间
            const firstTask = catTasks[0];
            newTasksByDate[selectedDate] = todayTasks.map(t =>
              t.id === firstTask.id ? { ...t, timeSpent: (t.timeSpent || 0) + timeDifference } : t
            );
          } else {
            // 如果没有该分类的任务，创建一个虚拟任务来记录时间
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

  //== 添加日期选择处理函数 ==//
  const handleDateSelect = (selectedDate) => {
    const selectedMonday = getMonday(selectedDate);
    setCurrentMonday(selectedMonday);
    setSelectedDate(selectedDate.toISOString().split("T")[0]);
    setShowDatePickerModal(false);
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

  // 生成每日日志 - 修复显示复选框状态
  const generateDailyLog = () => {
    const todayTasks = tasksByDate[selectedDate] || [];
    const completedTasks = todayTasks.filter(task => task.done);

    if (completedTasks.length === 0) {
      alert('今日还没有完成的任务！');
      return;
    }

    // 按分类分组
    const tasksByCategory = {};
    todayTasks.forEach(task => {
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = [];
      }
      tasksByCategory[task.category].push(task);
    });

    // 统计信息
    const totalTime = completedTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const totalMinutes = Math.floor(totalTime / 60);

    // 生成日志内容 - 显示完成状态
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

    // 显示汇总弹窗
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

  // 添加兑换物品 - 修改为接收参数
  const handleAddExchangeItem = (newItemData) => {
    if (newItemData.name && newItemData.points > 0) {
      setExchangeItems(prev => [...prev, newItemData]);
    }
  };

  // 删除兑换物品
  const handleDeleteExchangeItem = (index) => {
    setExchangeItems(prev => prev.filter((_, i) => i !== index));
  };

  // 兑换物品
  const handleExchange = (item, index) => {
    if (totalPoints >= item.points) {
      if (window.confirm(`确定要兑换 ${item.name} 吗？这将消耗 ${item.points} 积分。`)) {
        alert(`成功兑换 ${item.name}！`);
      }
    }
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
  const { dailyStudyData, categoryData, dailyTasksData, avgCompletion, avgDailyTime } = generateChartData();

  // 任务项组件 - 修改布局，图片移到备注下
const TaskItem = ({ task, openLongPressMenu = () => {} }) => {
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
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => toggleDone(task)}
            style={{
              marginTop: "3.5px"
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                openTaskEditModal(task); // == 改为打开编辑模态框 ==
              }}
              style={{
                wordBreak: "break-word",
                whiteSpace: "normal",
                cursor: "pointer",
                textDecoration: task.done ? "line-through" : "none",
                color: task.done ? "#999" : "#000",
                fontWeight: task.pinned ? "bold" : "normal",
                lineHeight: "1.4"
              }}
            >
              {task.text}
              {task.pinned && " 📌"}
              {task.isWeekTask && " 🌟"}
            </div>







              {/* 备注 - 移到任务文本下方 */}
              {task.note && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    editTaskNote(task);
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
              {/* == 感想显示 - 黄色背景 == */}
              {task.reflection && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    // 点击感想可以编辑
                    const newReflection = window.prompt("编辑感想", task.reflection);
                    if (newReflection !== null) {
                      editTaskReflection(task, newReflection);
                    }
                  }}
                  style={{
                    fontSize: 12,
                    color: "#000",
                    marginTop: 4,
                    marginBottom: 4,
                    cursor: "pointer",
                    backgroundColor: '#fff9c4', // 黄色背景
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






              {/* 图片 - 移到备注下方 */}
              {task.image && (
                <div style={{ marginTop: 4, marginBottom: 4 }}>
                  <img
                    src={task.image}
                    alt="任务图片"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageModal(task.image);
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
                <span style={{
                  position: "relative",
                  top: "0px"
                }}>⏰ {task.scheduledTime}</span>
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
                top: "0px"
              }}>
                {formatTimeNoSeconds(task.timeSpent)}
              </span>
              <div style={{
                display: "flex",
                gap: 6,
                alignItems: "center"
              }}>
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
                    top: "0px",
                    fontSize: 12
                  }}
                >
                  ➕
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
                    top: "0px",
                    fontSize: 12
                  }}
                  title="编辑备注"
                >
                  📝
                </button>
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
                    top: "0px",
                    justifyContent: "center",
                    fontSize: 12
                  }}
                >
                  ⚙️
                </button>
              </div>
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
        {/* 积分兑换按钮区域 */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 20,
          marginBottom: 15
        }}>
          <button
            onClick={() => {
              setShowHonorModal(false);
              setShowExchangeModal(true);
            }}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold"
            }}
          >
            🎁 积分兑换
          </button>
          <button
            onClick={() => setShowHonorModal(false)}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            关闭
          </button>
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

//== 任务编辑模态框 ==//
const TaskEditModal = ({ task, onClose, onSave }) => {
  const [editData, setEditData] = useState({
    text: task.text || '',
    note: task.note || '',
    reflection: task.reflection || '',
    scheduledTime: task.scheduledTime || ''
  });

  const handleSave = () => {
    if (editData.text.trim() === '') {
      alert('任务内容不能为空！');
      return;
    }
    onSave(editData);
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
        width: '90%',
        maxWidth: 400,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>编辑任务</h3>
        
        {/* 任务内容 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 5, fontWeight: 'bold' }}>任务内容:</div>
          <input
            type="text"
            value={editData.text}
            onChange={(e) => setEditData({...editData, text: e.target.value})}
            placeholder="输入任务内容"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>

        {/* 备注 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 5, fontWeight: 'bold' }}>备注:</div>
          <textarea
            value={editData.note}
            onChange={(e) => setEditData({...editData, note: e.target.value})}
            placeholder="输入备注（支持多行文本）"
            rows="3"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              resize: 'vertical'
            }}
          />
        </div>

        {/* 感想 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 5, fontWeight: 'bold' }}>完成感想:</div>
          <textarea
            value={editData.reflection}
            onChange={(e) => setEditData({...editData, reflection: e.target.value})}
            placeholder="输入完成感想"
            rows="3"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              resize: 'vertical'
            }}
          />
        </div>

        {/* 计划时间 */}
        {/* 计划时间 - 修改为时间选择器 */}
<div style={{ marginBottom: 20 }}>
  <div style={{ marginBottom: 5, fontWeight: 'bold' }}>计划时间:</div>
  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
    <input
      type="time"
      value={editData.scheduledTime.split('-')[0] || ''}
      onChange={(e) => {
        const startTime = e.target.value;
        const endTime = editData.scheduledTime.split('-')[1] || '';
        setEditData({...editData, scheduledTime: `${startTime}-${endTime}`});
      }}
      style={{
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14
      }}
    />
    <span style={{ lineHeight: '36px' }}>至</span>
    <input
      type="time"
      value={editData.scheduledTime.split('-')[1] || ''}
      onChange={(e) => {
        const startTime = editData.scheduledTime.split('-')[0] || '';
        const endTime = e.target.value;
        setEditData({...editData, scheduledTime: `${startTime}-${endTime}`});
      }}
      style={{
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14
      }}
    />
  </div>
  <div style={{ fontSize: 12, color: '#666' }}>
    使用 24 小时制时间选择器
  </div>
  {editData.scheduledTime && (
    <div style={{ 
      fontSize: 12, 
      color: '#1a73e8', 
      marginTop: 4,
      padding: '4px 8px',
      backgroundColor: '#e8f0fe',
      borderRadius: 4
    }}>
      已设置: {editData.scheduledTime}
    </div>
  )}
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
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
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

          {/* 统计卡片 */}
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

          {/* 日志内容预览 */}
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

  // 积分兑换模态框 - 修复版本
  const ExchangeModal = ({
    exchangeItems,
    totalPoints,
    onClose,
    onExchange,
    onAddItem,
    onDeleteItem
  }) => {
    const fileInputRef = useRef(null);

    // 使用完全独立的本地状态管理输入
    const [localName, setLocalName] = useState('');
    const [localPoints, setLocalPoints] = useState(0);
    const [localImage, setLocalImage] = useState(null);

    // 处理图片上传
    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalImage(event.target.result);
      };
      reader.readAsDataURL(file);
    };

    // 处理添加物品
    const handleAddItem = () => {
      if (localName && localPoints > 0) {
        const newItemData = {
          name: localName,
          points: localPoints,
          image: localImage
        };

        // 调用父组件的添加函数
        onAddItem(newItemData);

        // 重置本地状态
        setLocalName('');
        setLocalPoints(0);
        setLocalImage(null);

        // 如果有文件输入，也重置
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
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
          width: '90%',
          maxWidth: 400,
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative'  // 添加这个让关闭按钮可以绝对定位
        }}>
          {/* 左上角关闭按钮 */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              zIndex: 1001
            }}
            title="关闭"
          >
            ×
          </button>

          <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
            🎁 积分兑换
          </h3>

          {/* 当前积分 */}
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 12,
            borderRadius: 8,
            textAlign: 'center',
            marginBottom: 15
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>当前积分</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1a73e8' }}>
              {totalPoints} 分
            </div>
          </div>

          {/* 添加新物品 */}
          <div style={{ marginBottom: 20, padding: 15, border: '1px solid #e0e0e0', borderRadius: 8 }}>
            <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 14 }}>添加兑换物品:</div>

            <input
              type="text"
              placeholder="物品名称"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: 8,
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 14
              }}
            />

            <input
              type="number"
              placeholder="所需积分"
              value={localPoints}
              onChange={(e) => setLocalPoints(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: 8,
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 14
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: 8,
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                选择图片
              </button>
              {localImage && (
                <button
                  onClick={() => setLocalImage(null)}
                  style={{
                    padding: 8,
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  清除
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {localImage && (
              <img
                src={localImage}
                alt="预览"
                style={{
                  width: '100%',
                  maxHeight: 100,
                  objectFit: 'contain',
                  borderRadius: 6,
                  marginBottom: 8
                }}
              />
            )}

            <button
              onClick={handleAddItem}
              disabled={!localName || localPoints <= 0}
              style={{
                width: '100%',
                padding: 10,
                backgroundColor: (!localName || localPoints <= 0) ? '#ccc' : '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: (!localName || localPoints <= 0) ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              添加物品
            </button>
          </div>

          {/* 兑换物品列表 */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>可兑换物品:</div>
            {exchangeItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', fontSize: 12, padding: 20 }}>
                暂无兑换物品
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {exchangeItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 10,
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      marginBottom: 8,
                      backgroundColor: totalPoints >= item.points ? '#f8f9fa' : '#f5f5f5'
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: 'cover',
                          borderRadius: 4,
                          marginRight: 10
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>需要 {item.points} 积分</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexDirection: 'column' }}>
                      <button
                        onClick={() => onExchange(item, index)}
                        disabled={totalPoints < item.points}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: totalPoints < item.points ? '#ccc' : '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: totalPoints < item.points ? 'not-allowed' : 'pointer',
                          fontSize: 12
                        }}
                      >
                        兑换
                      </button>
                      <button
                        onClick={() => onDeleteItem(index)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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

      {/* 简洁版更新时间 */}
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
      {showHonorModal && <HonorModal />}
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

      {showExchangeModal && (
        <ExchangeModal
          exchangeItems={exchangeItems}
          totalPoints={totalPoints}
          onClose={() => setShowExchangeModal(false)}
          onExchange={handleExchange}
          onAddItem={handleAddExchangeItem}
          onDeleteItem={handleDeleteExchangeItem}
        // 移除 newItem 和 onNewItemChange 参数
        />
      )}

      {/* == 添加 DatePickerModal 的渲染 == */}
      {showDatePickerModal && (
        <DatePickerModal
          onClose={() => setShowDatePickerModal(false)}
          onSelectDate={handleDateSelect}
        />
      )}

      {/* == 在这里添加任务编辑模态框 == */}
{showTaskEditModal && (
  <TaskEditModal
    task={showTaskEditModal}
    onClose={() => setShowTaskEditModal(null)}
    onSave={(editData) => saveTaskEdit(showTaskEditModal, editData)}
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
          {/* == 添加日历图标 == */}
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
            <span>📌 置顶任务 ({pinnedTasks.length})</span>
            <span style={{ fontSize: 12 }}>
              {formatTimeNoSeconds(pinnedTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0))}
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
              <span
                style={{ fontSize: 12, cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  editCategoryTime(c.name);
                }}
                title="点击修改总时间"
              >
                {formatTimeNoSeconds(totalTime(c.name))} ✏️
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

            {/* 模板按钮 */}
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
              {item.value}
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
          清空数据
        </button>
      </div>
    </div>
  );
}

export default App;
