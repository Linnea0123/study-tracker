import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';


// 备份管理模态框组件
const BackupManagerModal = ({ onClose }) => {
  const [backups, setBackups] = useState([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);

  useEffect(() => {
    // 获取备份列表
    setBackups(getBackupList());
  }, []);

  const handleRestore = async (backupKey) => {
    await restoreBackup(backupKey);
    onClose();
  };

  const handleManualBackup = async () => {
    await autoBackup();
    setBackups(getBackupList()); // 刷新列表
    alert('手动备份已创建！');
  };

  const handleDeleteBackup = (backupKey) => {
    if (window.confirm('确定要删除这个备份吗？')) {
      localStorage.removeItem(backupKey);
      setBackups(getBackupList()); // 刷新列表
      alert('备份已删除！');
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
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: 10
        }}>
          <h3 style={{ margin: 0, color: '#1a73e8' }}>📦 备份管理</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* 备份统计 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 15,
          padding: 10,
          backgroundColor: '#f8f9fa',
          borderRadius: 8
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666' }}>备份数量</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a73e8' }}>
              {backups.length} 个
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666' }}>自动备份</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745' }}>
              每30分钟
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <button
            onClick={handleManualBackup}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            💾 立即备份
          </button>
          <button
            onClick={() => {
              // 导出所有备份信息
              const backupInfo = {
                total: backups.length,
                backups: backups,
                exportTime: new Date().toISOString()
              };
              const dataStr = JSON.stringify(backupInfo, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `backup-list_${new Date().toISOString().slice(0, 10)}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#17a2b8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            📋 导出列表
          </button>
        </div>

        {/* 备份列表 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
            备份记录 ({backups.length})
          </div>
          
          {backups.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 20,
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: 6
            }}>
              暂无备份记录
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {backups.map((backup, index) => (
                <div
                  key={backup.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    marginBottom: 8,
                    backgroundColor: index === 0 ? '#e8f5e8' : '#fff'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                      {new Date(backup.time).toLocaleString()}
                      {index === 0 && <span style={{ color: '#28a745', marginLeft: 8 }}>最新</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      任务天数: {backup.tasksCount} | 自动备份
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setShowRestoreConfirm(backup.key)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      恢复
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.key)}
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

        {/* 使用说明 */}
        <div style={{
          fontSize: 12,
          color: '#666',
          padding: 10,
          backgroundColor: '#f8f9fa',
          borderRadius: 6,
          lineHeight: 1.4
        }}>
          <strong>💡 使用说明：</strong><br/>
          • 系统每30分钟自动备份一次<br/>
          • 最多保留7个备份，旧的会自动删除<br/>
          • 恢复备份会覆盖当前所有数据<br/>
          • 建议重要操作前手动备份
        </div>

        {/* 恢复确认模态框 */}
        {showRestoreConfirm && (
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
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              width: '80%',
              maxWidth: 300
            }}>
              <h4 style={{ textAlign: 'center', marginBottom: 15, color: '#d32f2f' }}>
                确认恢复备份？
              </h4>
              <p style={{ textAlign: 'center', marginBottom: 15, fontSize: 14, lineHeight: 1.4 }}>
                这将覆盖当前所有数据，且无法撤销！
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowRestoreConfirm(null)}
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: '#ccc',
                    color: '#000',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => handleRestore(showRestoreConfirm)}
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: '#d32f2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  确认恢复
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};// 在这里添加计时记录模态框组件 ↓
const TimerRecordsModal = ({ records, onClose }) => {
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
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
          ⏱️ 计时记录
        </h3>
        
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
            暂无计时记录
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {records.map(record => (
              <div key={record.id} style={{ 
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {record.taskText}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  📚 {record.category}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
  {/* 把开始和结束时间放在同一行 */}
  🕐 {new Date(record.startTime).toLocaleString()} 
  {record.endTime && ` →  ${new Date(record.endTime).toLocaleString()}`}
</div>
                
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: record.endTime ? '#28a745' : '#ffc107',
                  textAlign: 'right'
                }}>
                  {record.endTime ? 
                    `${Math.floor(record.duration / 60)}分${record.duration % 60}秒` : 
                    '进行中...'
                  }
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '15px',
            backgroundColor: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
};





// 保持这样就行
const PAGE_ID = window.location.pathname.includes('page2') ? 'PAGE_B' : 'PAGE_A';
const STORAGE_KEY = `study-tracker-${PAGE_ID}-v2`;

// ==== 新增：自动备份配置 ====
const AUTO_BACKUP_CONFIG = {
  maxBackups: 7,                    // 保留7个备份
  backupInterval: 30 * 60 * 1000,   // 30分钟（30 * 60 * 1000 毫秒）
  backupPrefix: 'auto_backup_'      // 备份文件前缀
};


// ==== 自动备份功能 ====
const autoBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}${timestamp}`;
    
    const backupData = {
      tasks: await loadMainData('tasks'),
      templates: await loadMainData('templates'),
      pointHistory: await loadMainData('pointHistory'),
      exchange: await loadMainData('exchange'),
      backupTime: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    await cleanupOldBackups();
    console.log(`✅ 自动备份完成: ${timestamp}`);
  } catch (error) {
    console.error('自动备份失败:', error);
  }
};

const cleanupOldBackups = async () => {
  const allKeys = Object.keys(localStorage);
  const backupKeys = allKeys
    .filter(key => key.startsWith(`${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}`))
    .sort((a, b) => b.localeCompare(a));
  
  if (backupKeys.length > AUTO_BACKUP_CONFIG.maxBackups) {
    const keysToDelete = backupKeys.slice(AUTO_BACKUP_CONFIG.maxBackups);
    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ 删除旧备份: ${key}`);
    });
  }
};

const getBackupList = () => {
  const allKeys = Object.keys(localStorage);
  return allKeys
    .filter(key => key.startsWith(`${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}`))
    .map(key => {
      const data = JSON.parse(localStorage.getItem(key));
      return {
        key,
        time: data?.backupTime || key,
        tasksCount: Object.keys(data?.tasks || {}).length
      };
    })
    .sort((a, b) => b.time.localeCompare(a.time));
};

const restoreBackup = async (backupKey) => {
  try {
    const backupData = JSON.parse(localStorage.getItem(backupKey));
    if (!backupData) {
      alert('备份文件不存在');
      return;
    }

    if (window.confirm('确定要恢复此备份吗？当前数据将被覆盖。')) {
      await saveMainData('tasks', backupData.tasks || {});
      await saveMainData('templates', backupData.templates || []);
      await saveMainData('pointHistory', backupData.pointHistory || []);
      await saveMainData('exchange', backupData.exchange || []);
      
      if (window.appInstance) {
        window.appInstance.setState({
          tasksByDate: backupData.tasks || {},
          templates: backupData.templates || [],
          pointHistory: backupData.pointHistory || [],
          exchangeItems: backupData.exchange || []
        });
      }
      
      alert('备份恢复成功！');
      window.location.reload();
    }
  } catch (error) {
    console.error('恢复备份失败:', error);
    alert('恢复备份失败：' + error.message);
  }
};

// 手动触发备份
window.manualBackup = autoBackup;

// 全局调试函数 - 在 Console 中可以直接调用
window.debugStudyTracker = {
  // 检查所有存储数据
  checkStorage: () => {
    console.log('=== 学习跟踪器存储调试 ===');
    const keys = ['tasks', 'templates', 'pointHistory', 'exchange'];
    keys.forEach(key => {
      const storageKey = `${STORAGE_KEY}_${key}`;
      const data = localStorage.getItem(storageKey);
      console.log(`${key}:`, data ? `✅ 有数据 (${data.length} 字符)` : '❌ 无数据');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`  内容:`, parsed);
        } catch (e) {
          console.log(`  解析错误:`, e);
        }
      }
    });
    
    // ==== 新增：显示备份信息 ====
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.includes(AUTO_BACKUP_CONFIG.backupPrefix));
    console.log(`备份文件: ${backupKeys.length} 个`);
    backupKeys.forEach(key => {
      console.log(`  ${key}`);
    });
  },  // 这里需要逗号
  
  // 备份管理
  backupManager: () => {
    const backups = getBackupList();
    console.log('=== 备份管理 ===');
    console.log(`共有 ${backups.length} 个备份文件`);
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.key}`);
      console.log(`   时间: ${new Date(backup.time).toLocaleString()}`);
      console.log(`   任务天数: ${backup.tasksCount}`);
    });
    
    // 在控制台提供恢复选项
    if (backups.length > 0) {
      const choice = prompt(`输入要恢复的备份编号 (1-${backups.length}) 或输入 "c" 取消`);
      if (choice && choice !== 'c') {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < backups.length) {
          restoreBackup(backups[index].key);
        }
      }
    }
  },  // 这里需要逗号
  
  // 手动创建备份
  createBackup: () => {
    autoBackup();
    alert('手动备份已创建！');
  },  // 这里需要逗号
  
  // 手动保存当前数据
  saveAll: () => {
    console.log('💾 手动保存所有数据...');
    // 这些需要在 App 组件内部调用
    if (window.appInstance) {
      window.appInstance.saveAllData();
      // ==== 新增：手动保存时也备份 ====
      autoBackup();
    } else {
      console.log('❌ 无法访问 App 实例');
    }
  },  // 这里需要逗号
  
  // 清除所有数据
  clearAll: () => {
    if (window.confirm('确定要清除所有数据吗？')) {
      const keys = ['tasks', 'templates', 'pointHistory', 'exchange'];
      keys.forEach(key => {
        localStorage.removeItem(`${STORAGE_KEY}_${key}`);
      });
      console.log('✅ 所有数据已清除');
      window.location.reload();
    }
  }  // 最后一个方法不需要逗号
};







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

// 统一的存储函数
const saveMainData = async (key, data) => {
  const storageKey = `${STORAGE_KEY}_${key}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`数据保存成功: ${key}`, data);
  } catch (error) {
    console.error(`数据保存失败: ${key}`, error);
  }
};

const loadMainData = async (key) => {
  const storageKey = `${STORAGE_KEY}_${key}`;
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`数据加载失败: ${key}`, error);
    return null;
  }
};






 


// 数据迁移函数 - 从旧版本迁移数据
const migrateLegacyData = async () => {
  const LEGACY_STORAGE_KEY = 'study-tracker-main';
  
  try {
    // 检查旧版本数据是否存在
    const legacyTasks = localStorage.getItem(`${LEGACY_STORAGE_KEY}_tasks`);
    const hasNewData = localStorage.getItem(`${STORAGE_KEY}_tasks`);
    
    // 如果旧数据存在且新数据不存在，则迁移
    if (legacyTasks && !hasNewData) {
      console.log('🔁 检测到旧版本数据，开始迁移...');
      
      const keys = ['tasks', 'templates', 'pointHistory', 'exchange'];
      let migratedCount = 0;
      
      keys.forEach(key => {
        const legacyData = localStorage.getItem(`${LEGACY_STORAGE_KEY}_${key}`);
        if (legacyData) {
          localStorage.setItem(`${STORAGE_KEY}_${key}`, legacyData);
          migratedCount++;
          console.log(`✅ 迁移 ${key} 数据`);
        }
      });
      
      console.log(`🎉 数据迁移完成，共迁移 ${migratedCount} 项数据`);
    }
  } catch (error) {
    console.error('数据迁移失败:', error);
  }
};



// 修复：获取本周一的日期
const getMonday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // 清除时间部分
  const day = d.getDay(); // 0是周日，1是周一，...，6是周六
  
  // 修正：如果今天是周日(0)，需要减去6天；否则减去(day-1)天
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday;
};

// 修复：获取一周的日期
const getWeekDates = (monday) => {
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    // 修正：确保日期格式正确
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    weekDates.push({
      date: `${year}-${month}-${day}`,
      label: `周${"一二三四五六日"[i]}`,
      fullLabel: `周${"一二三四五六日"[i]} (${month}/${day})`
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // 修改这里
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }} onClick={onClose}>  {/* 修复：直接使用 onClose */}
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 350
      }} onClick={e => e.stopPropagation()}>  {/* 修复：移除多余的 > */}
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






// 修改 TimeModal 组件
const TimeModal = ({ config, onSave, onClose }) => {
  const [startHour, setStartHour] = useState(config.startHour || '');
  const [startMinute, setStartMinute] = useState(config.startMinute || '');
  const [endHour, setEndHour] = useState(config.endHour || '');
  const [endMinute, setEndMinute] = useState(config.endMinute || '');

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

        {/* 开始时间 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>开始时间:</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="number"
              placeholder=""
              min="0"
              max="23"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              style={{
                width: '60px',
                padding: '8px',
                border: '2px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
                textAlign: 'center'
              }}
            />
            <span style={{ color: '#666', fontSize: 14 }}>:</span>
            <input
              type="number"
              placeholder=""
              min="0"
              max="59"
              value={startMinute}
              onChange={(e) => setStartMinute(e.target.value)}
              style={{
                width: '60px',
                padding: '8px',
                border: '2px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
                textAlign: 'center'
              }}
            />
          </div>
        </div>

        {/* 结束时间 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>结束时间:</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="number"
              placeholder=""
              min="0"
              max="23"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              style={{
                width: '60px',
                padding: '8px',
                border: '2px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
                textAlign: 'center'
              }}
            />
            <span style={{ color: '#666', fontSize: 14 }}>:</span>
            <input
              type="number"
              placeholder=""
              min="0"
              max="59"
              value={endMinute}
              onChange={(e) => setEndMinute(e.target.value)}
              style={{
                width: '60px',
                padding: '8px',
                border: '2px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
                textAlign: 'center'
              }}
            />
          </div>
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
              onSave({
                startHour,
                startMinute,
                endHour,
                endMinute
              });
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



const TemplateModal = ({ templates, onSave, onClose, onDelete }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState(categories[0].name);
  const [templateContent, setTemplateContent] = useState('');
  const [templateTags, setTemplateTags] = useState([]);
  const [templateScheduledTime, setTemplateScheduledTime] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');
  // 添加这行 - 定义 editData 状态


  // 高级配色方案
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
        {/* 标题栏 */}
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
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = colorPalette.background;
              e.target.style.color = colorPalette.text;
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = colorPalette.textLight;
            }}
          >
            ×
          </button>
        </div>


        {/* 添加新模板 */}
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
            {/* 模板名称 */}
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
                  backgroundColor: colorPalette.background,
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colorPalette.primary;
                  e.target.style.backgroundColor = colorPalette.surface;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colorPalette.border;
                  e.target.style.backgroundColor = colorPalette.background;
                }}
              />
            </div>


            {/* 分类和任务内容在同一行 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '12px',
              alignItems: 'start',
              maxWidth: '600px', // 限制最大宽度
              width: '100%'
            }}>
              {/* 任务类别 */}
              <div style={{ minWidth: 0 }}> {/* 防止内容溢出 */}
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
                    backgroundColor: colorPalette.background,
                    cursor: 'pointer',
                    maxWidth: '100%', // 限制选择框最大宽度
                    boxSizing: 'border-box'
                  }}
                >
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 任务内容 */}
              <div style={{ minWidth: 0 }}> {/* 防止内容溢出 */}
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
                    backgroundColor: colorPalette.background,
                    transition: 'all 0.2s ease',
                    maxWidth: '100%', // 限制输入框最大宽度
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colorPalette.primary;
                    e.target.style.backgroundColor = colorPalette.surface;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colorPalette.border;
                    e.target.style.backgroundColor = colorPalette.background;
                  }}
                />
              </div>
            </div>


            {/* 计划时间 */}
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







              {/* 添加任务内容输入框 */}
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
                    backgroundColor: colorPalette.background,
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colorPalette.primary;
                    e.target.style.backgroundColor = colorPalette.surface;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colorPalette.border;
                    e.target.style.backgroundColor = colorPalette.background;
                  }}
                />
              </div>
            </div>



            {/* 计划时间 */}
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

            {/* 标签编辑 */}
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

              {/* 当前标签 */}
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
                      onMouseOver={(e) => e.target.style.opacity = '1'}
                      onMouseOut={(e) => e.target.style.opacity = '0.8'}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* 添加新标签 */}
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
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                  onMouseOut={(e) => e.target.style.backgroundColor = colorPalette.primary}
                >
                  添加
                </button>
              </div>

              {/* 常用标签 */}
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
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 添加模板按钮 */}
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
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (templateName && templateContent) {
                  e.target.style.backgroundColor = '#2563EB';
                }
              }}
              onMouseOut={(e) => {
                if (templateName && templateContent) {
                  e.target.style.backgroundColor = colorPalette.primary;
                }
              }}
            >
              创建模板
            </button>
          </div>
        </div>

        {/* 现有模板列表 */}
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
                    backgroundColor: colorPalette.background,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colorPalette.background;
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

                    {/* 标签显示 */}
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

                    {/* 计划时间显示 */}
                    {template.scheduledTime && (
                      <div style={{
                        fontSize: '11px',
                        color: colorPalette.primary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⏰</span>
                        {template.scheduledTime

                        }
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
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = '#EF4444';
                      e.target.style.backgroundColor = '#FEF2F2';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = colorPalette.textLight;
                      e.target.style.backgroundColor = 'transparent';
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

  // 添加：计算菜单位置，确保在屏幕内
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

// 日期选择模态框 - 月历视图
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

// 检查今天任务显示
const today = new Date().toISOString().split('T')[0];
console.log('=== 今天任务检查 ===');
console.log('今天日期:', today);
console.log('选中日期:', window.appInstance?.getState().selectedDate);
console.log('任务数据中的今天:', window.appInstance?.getState().tasksByDate[today]);
console.log('今日任务数组:', window.appInstance?.getState().todayTasks);


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
    category: task.category || categories[0].name,
    note: task.note || '',
    reflection: task.reflection || '',
    scheduledTime: task.scheduledTime || '',
    tags: task.tags || [],
    reminderYear: task.reminderTime?.year || '',
    reminderMonth: task.reminderTime?.month || '',
    reminderDay: task.reminderTime?.day || '',
    reminderHour: task.reminderTime?.hour || '',
    reminderMinute: task.reminderTime?.minute || '',
    subTasks: task.subTasks || [], // 确保子任务初始状态
    // 计划时间字段
    startHour: task.scheduledTime ? task.scheduledTime.split('-')[0]?.split(':')[0] || '' : '',
    startMinute: task.scheduledTime ? task.scheduledTime.split('-')[0]?.split(':')[1] || '' : '',
    endHour: task.scheduledTime ? task.scheduledTime.split('-')[1]?.split(':')[0] || '' : '',
    endMinute: task.scheduledTime ? task.scheduledTime.split('-')[1]?.split(':')[1] || '' : '',
    progress: task.progress || {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    pinned: task.pinned || false
    
  });

  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (editData.text.trim() === '') {
      alert('任务内容不能为空！');
      return;
    }

    console.log('保存的子任务数据:', editData.subTasks);

    
    // 构建提醒时间对象
    const reminderTime = {};
    if (editData.reminderYear) reminderTime.year = parseInt(editData.reminderYear);
    if (editData.reminderMonth) reminderTime.month = parseInt(editData.reminderMonth);
    if (editData.reminderDay) reminderTime.day = parseInt(editData.reminderDay);
    if (editData.reminderHour) reminderTime.hour = parseInt(editData.reminderHour);
    if (editData.reminderMinute) reminderTime.minute = parseInt(editData.reminderMinute);

    // 构建计划时间字符串
    let scheduledTime = '';
    if (editData.startHour && editData.startMinute && editData.endHour && editData.endMinute) {
      const formatTime = (hour, minute) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      };
      scheduledTime = `${formatTime(editData.startHour, editData.startMinute)}-${formatTime(editData.endHour, editData.endMinute)}`;
    }

    const finalEditData = {
      ...editData,
      tags: editData.tags || [],
      subTasks: editData.subTasks || [], // 确保子任务数据被保存
      reminderTime: Object.keys(reminderTime).length > 0 ? reminderTime : null,
      scheduledTime: scheduledTime
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


  


  // 常用标签配置
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
        width: '98%',
        maxWidth: 450,
        maxHeight: '85vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid #e0e0e0',
        position: 'relative'
      }}>

        {/* 标题栏 */}
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

          {/* 右上角按钮组 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* 置顶按钮 */}
            <button
              onClick={() => {
                onTogglePinned(task);
                setEditData({ ...editData, pinned: !editData.pinned });
              }}
              style={{
               width: '24px',    // 固定宽度
      height: '24px',   // 固定高度  
      padding: 0,       // 移除padding
      backgroundColor: editData.pinned ? '#ffcc00' : '#f8f9fa',
      color: editData.pinned ? '#000' : '#666',
      border: "1px solid #e0e0e0",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: "16px", // 统一字体大小
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0     // 防止flex压缩
                
              }}
              title={editData.pinned ? "取消置顶" : "置顶任务"}
            >
              {editData.pinned ? '🔝' : '📌'}
            </button>

            {/* 删除按钮 */}
            <button
              onClick={handleDelete}
              style={{
                width: '32px',    // 固定宽度
      height: '32px',   // 固定高度  
      padding: 0,       // 移除padding
      backgroundColor: editData.pinned ? '#ffcc00' : '#f8f9fa',
      color: editData.pinned ? '#000' : '#666',
      border: "1px solid #e0e0e0",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: "16px", // 统一字体大小
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0     // 防止flex压缩
               
              }}
              title="删除任务"
            >
              ❌
            </button>

            {/* 添加图片按钮 */}
            <button
              onClick={handleImageClick}
              style={{
                width: '32px',    // 固定宽度
      height: '32px',   // 固定高度  
      padding: 0,       // 移除padding
      backgroundColor: editData.pinned ? '#ffcc00' : '#f8f9fa',
      color: editData.pinned ? '#000' : '#666',
      border: "1px solid #e0e0e0",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: "16px", // 统一字体大小
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0     // 防止flex压缩
             
              }}
              title="添加图片"
            >
              🖼️
            </button>

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              style={{
                padding: "6px 12px",
                backgroundColor: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                height: '32px',   // 固定高度
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "600",
                transition: "all 0.2s ease"
               
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#0b5ed7"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#1a73e8"}
            >
              保存
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "#666",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all 0.2s ease"
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
          {/* 任务内容 */}
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
            <textarea
              value={editData.text}
              onChange={(e) => setEditData({ ...editData, text: e.target.value })}
              placeholder="请输入任务内容..."
              rows="1"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                backgroundColor: '#fafafa',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 备注和感想 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              备注
            </label>
            <textarea
              value={editData.note}
              onChange={(e) => setEditData({ ...editData, note: e.target.value })}
              placeholder="输入备注..."
              rows="1"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                backgroundColor: '#fafafa',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
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
              感想
            </label>
            <textarea
              value={editData.reflection}
              onChange={(e) => setEditData({ ...editData, reflection: e.target.value })}
              placeholder="输入感想..."
              rows="1"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                backgroundColor: '#fafafa',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 类别和标签在同一行 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            alignItems: 'start'
          }}>
            {/* 任务类别 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: '600',
                color: '#333',
                fontSize: 14
              }}>
                类别
              </label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 14,
                  backgroundColor: '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* 标签编辑 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: '600',
                color: '#333',
                fontSize: 14
              }}>
                标签
              </label>
              
              {/* 当前标签显示 */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                marginBottom: 8,
                minHeight: '44px',
                padding: '8px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                backgroundColor: '#fafafa',
                alignItems: 'center',
                boxSizing: 'border-box'
              }}>
                {editData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      backgroundColor: tag.color,
                      color: tag.textColor || '#fff',
                      borderRadius: 12,
                      border: 'none',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2
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
                        fontSize: 10,
                        padding: 0,
                        width: 12,
                        height: 12,
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
                {(!editData.tags || editData.tags.length === 0) && (
                  <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                    暂无标签
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 标签编辑区域 */}
          <div>
            {/* 添加新标签 */}
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
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box'
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
                  borderRadius: 6,
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
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: '500'
                }}
              >
                添加
              </button>
            </div>

            {/* 常用标签 */}
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

          {/* 计划时间 */}
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
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'nowrap'
            }}>
              {/* 开始时间 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <input
                  type="number"
                  placeholder="00"
                  min="0"
                  max="23"
                  value={editData.startHour || ''}
                  onChange={(e) => setEditData({ ...editData, startHour: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ color: '#666', fontSize: 14 }}>:</span>
                <input
                  type="number"
                  placeholder="00"
                  min="0"
                  max="59"
                  value={editData.startMinute || ''}
                  onChange={(e) => setEditData({ ...editData, startMinute: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <span style={{ color: '#666', fontSize: 14 }}>至</span>
              
              {/* 结束时间 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <input
                  type="number"
                  placeholder="00"
                  min="0"
                  max="23"
                  value={editData.endHour || ''}
                  onChange={(e) => setEditData({ ...editData, endHour: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ color: '#666', fontSize: 14 }}>:</span>
                <input
                  type="number"
                  placeholder="00"
                  min="0"
                  max="59"
                  value={editData.endMinute || ''}
                  onChange={(e) => setEditData({ ...editData, endMinute: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 提醒时间 - 单行布局 */}
<div>
  <label style={{
    display: 'block',
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
    fontSize: 14
  }}>
    ⏰ 提醒时间
  </label>
  <div style={{
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'nowrap',
    justifyContent: 'space-between'
  }}>
    {/* 年 */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>年</div>
      <input
        type="number"
        placeholder=""
        min="2024"
        max="2030"
        value={editData.reminderYear || ''}
        onChange={(e) => setEditData({ ...editData, reminderYear: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 2px',
          border: '2px solid #e0e0e0',
          borderRadius: 6,
          fontSize: 12,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      />
    </div>

    <span style={{ color: '#666', fontSize: 12, marginTop: '16px' }}>/</span>

    {/* 月 */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>月</div>
      <input
        type="number"
        placeholder=""
        min="1"
        max="12"
        value={editData.reminderMonth || ''}
        onChange={(e) => setEditData({ ...editData, reminderMonth: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 2px',
          border: '2px solid #e0e0e0',
          borderRadius: 6,
          fontSize: 12,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      />
    </div>

    <span style={{ color: '#666', fontSize: 12, marginTop: '16px' }}>/</span>

    {/* 日 */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>日</div>
      <input
        type="number"
        placeholder=""
        min="1"
        max="31"
        value={editData.reminderDay || ''}
        onChange={(e) => setEditData({ ...editData, reminderDay: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 2px',
          border: '2px solid #e0e0e0',
          borderRadius: 6,
          fontSize: 12,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      />
    </div>

    <span style={{ color: '#666', fontSize: 12, marginTop: '16px' }}></span>

    {/* 时 */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>时</div>
      <input
        type="number"
        placeholder="00"
        min="0"
        max="23"
        value={editData.reminderHour || ''}
        onChange={(e) => setEditData({ ...editData, reminderHour: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 2px',
          border: '2px solid #e0e0e0',
          borderRadius: 6,
          fontSize: 12,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      />
    </div>

    <span style={{ color: '#666', fontSize: 12, marginTop: '16px' }}>:</span>

    {/* 分 */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>分</div>
      <input
        type="number"
        placeholder="00"
        min="0"
        max="59"
        value={editData.reminderMinute || ''}
        onChange={(e) => setEditData({ ...editData, reminderMinute: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 2px',
          border: '2px solid #e0e0e0',
          borderRadius: 6,
          fontSize: 12,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      />
    </div>
  </div>
</div>

{/* 子任务编辑 - 放在这里 */}
<div>
  <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333', fontSize: 14 }}>
    📋 子任务
  </label>
  
  <div style={{ marginBottom: 12, padding: 10, border: '2px solid #e0e0e0', borderRadius: 8, backgroundColor: '#fafafa' }}>
    {editData.subTasks?.map((subTask, index) => (
      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: 6, backgroundColor: '#fff', borderRadius: 4 }}>
        <input
          type="checkbox"
          checked={subTask.done}
          onChange={(e) => {
            const newSubTasks = [...editData.subTasks];
            newSubTasks[index].done = e.target.checked;
            setEditData({ ...editData, subTasks: newSubTasks });
          }}
        />
        <input
          type="text"
          value={subTask.text}
          onChange={(e) => {
            const newSubTasks = [...editData.subTasks];
            newSubTasks[index].text = e.target.value;
            setEditData({ ...editData, subTasks: newSubTasks });
          }}
          style={{ flex: 1, padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12 }}
          placeholder="子任务内容"
        />
        <button
          onClick={() => {
            const newSubTasks = editData.subTasks.filter((_, i) => i !== index);
            setEditData({ ...editData, subTasks: newSubTasks });
          }}
          style={{ padding: '4px 8px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
        >
          删除
        </button>
      </div>
    ))}
    
    {(!editData.subTasks || editData.subTasks.length === 0) && (
      <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>暂无子任务</div>
    )}
  </div>

  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <input
      type="text"
      placeholder="输入子任务内容"
      value={editData.newSubTask || ''}
      onChange={(e) => setEditData({ ...editData, newSubTask: e.target.value })}
      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14 }}
    />
    <button
      onClick={() => {
        if (editData.newSubTask?.trim()) {
          const newSubTask = { text: editData.newSubTask.trim(), done: false };
          const updatedSubTasks = [...(editData.subTasks || []), newSubTask];
          setEditData({ ...editData, subTasks: updatedSubTasks, newSubTask: '' });
        }
      }}
      style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
    >
      添加子任务
    </button>
  </div>
</div>


          {/* 进度跟踪 */}
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
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>初始值</div>
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
                    padding: '12px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>当前值</div>
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
                    padding: '12px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>目标值</div>
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
                    padding: '12px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>单位</div>
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
                    padding: '12px 4px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 14,
                    height: 'auto',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="%">%</option>
                  <option value="页">页</option>
                  <option value="章">章</option>
                  <option value="题">题</option>
                  <option value="单元">单元</option>
                </select>
              </div>
            </div>
          </div>

          

          {/* 隐藏的文件输入 */}
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
  formatTimeNoSeconds,
  toggleDone,
  formatTimeWithSeconds,
  onMoveTask,
  categories,
  setShowMoveModal,
  onToggleSubTask,
  onStartTimer,
  onPauseTimer,
  isTimerRunning,
  elapsedTime,
  onUpdateProgress,
  onEditSubTask = () => {}
}) => {
  const [editingSubTaskIndex, setEditingSubTaskIndex] = useState(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [showProgressControls, setShowProgressControls] = useState(false);
  

  // 开始编辑子任务
  const startEditSubTask = (index, currentText) => {
    setEditingSubTaskIndex(index);
    setEditSubTaskText(currentText);
  };

  // 保存子任务编辑
  const saveEditSubTask = () => {
    if (editSubTaskText.trim() && editingSubTaskIndex !== null) {
      onEditSubTask(task, editingSubTaskIndex, editSubTaskText.trim());
    }
    setEditingSubTaskIndex(null);
    setEditSubTaskText('');
  };

  // 取消编辑
  const cancelEditSubTask = () => {
    setEditingSubTaskIndex(null);
    setEditSubTaskText('');
  };

  // 处理按键事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEditSubTask();
    } else if (e.key === 'Escape') {
      cancelEditSubTask();
    }
  };

  // ... 其他代码保持不变

  // 计算是否为长文本
  const isLongText = task.text.length > 20; // 可以根据需要调整这个阈值

  // 处理计时器点击
  const handleTimerClick = () => {
    if (isTimerRunning) {
      onPauseTimer(task);
    } else {
      onStartTimer(task);
    }
  };

  // 处理进度调整
  const handleProgressAdjust = (increment) => {
    const newCurrent = Math.max(0, (Number(task.progress.current) || 0) + increment);
    if (onUpdateProgress) {
      onUpdateProgress(task, newCurrent);
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


      {/* 短文本布局 - 所有内容在一行 */}
      {!isLongText ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          {/* 左侧：复选框和任务内容 */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
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
                {task.pinned &&  <span style={{ fontSize: "12px", marginLeft: "4px" }}>📌</span>} 
                {task.isWeekTask && " 🌟"}
                 {task.reminderTime && (
      <span
        style={{
          fontSize: 10,
          color: "#ff6b6b",
          marginLeft: "6px",
          verticalAlign: "1px"
    
        }}
        title={`提醒时间: ${task.reminderTime.year}年${task.reminderTime.month}月${task.reminderTime.day}日 ${task.reminderTime.hour}:${(task.reminderTime.minute || 0).toString().padStart(2, '0')}`}
      >
        ⏰ {task.reminderTime.month}/{task.reminderTime.day} {task.reminderTime.hour}:{(task.reminderTime.minute || 0).toString().padStart(2, '0')}
      </span>
    )}
 

              </div>

            </div>
          </div>

          {/* 右侧：标签、计时器、时间 */}
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
                e.target.blur();
              }}
              style={{
                fontSize: 12,
                padding: "2px 6px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "transparent", // 始终透明背景
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
    // 确保 onEditTime 存在再调用
    if (onEditTime) {
      onEditTime(task);
    }
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
        /* 长文本布局 - 时间信息在右下角 */
        <div>
          {/* 第一行：任务内容 */}
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
              {task.pinned && " 📌"}  {/* 确保这行存在 */}
              {task.isWeekTask && " 🌟"}
               {task.reminderTime && (
      <span
        style={{
          fontSize: 10,
          color: "#ff6b6b",
          marginLeft: "6px",
          verticalAlign: "1px"
        }}
        title={`提醒时间: ${task.reminderTime.year}年${task.reminderTime.month}月${task.reminderTime.day}日 ${task.reminderTime.hour}:${(task.reminderTime.minute || 0).toString().padStart(2, '0')}`}
      >
        ⏰ {task.reminderTime.month}/{task.reminderTime.day} {task.reminderTime.hour}:{(task.reminderTime.minute || 0).toString().padStart(2, '0')}
      </span>
    )}
            </div>
          </div>





          {/* 第二行：标签、计时器、时间（右下角） */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',  // 改为靠右
            alignItems: 'center',
            marginTop: '4px'
          }}>




            {/* 左侧：标签 */}
            <div style={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'flex-end'  // 标签也靠右
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

            {/* 右侧：计时器和时间 */}
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
      {/* 结束智能布局 */}

      {/* 进度条和其他内容（两种布局通用） */}
      {task.progress && task.progress.target > 0 && (
        <div style={{ marginTop: 6 }}>
          {/* 这里是你原来的进度条代码，保持不变 */}
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
                width: `${Math.min(((Number(task.progress.current) - Number(task.progress.initial)) / Math.max(Number(task.progress.target) - Number(task.progress.initial), 1)) * 100, 100)}%`,
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
            marginLeft: "28px", // 调整为24px，与任务文本对齐
            backgroundColor: 'transparent',
            lineHeight: "1.3",
            whiteSpace: "pre-wrap"
          }}
        >
          {task.note}
        </div>
      )}

 
{task.subTasks && task.subTasks.length > 0 && (
  <div style={{ 
    marginLeft: '28px', 
    marginTop: -2,  // 减少上边距
    marginBottom: 0,  // 减少下边距
    borderLeft: '2px solid #e0e0e0', 
    paddingLeft: 8  // 减少内边距
  }}>
    {task.subTasks.map((subTask, index) => (
      <div key={index} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, //子任务和复选框的距离
        marginBottom: 2,  // 减少子任务之间的间距
        fontSize: 12, 
        color: task.done ? '#999' : '#666',
        minHeight: '20px'  // 设置最小高度
      }}>
        <input
          type="checkbox"
          checked={subTask.done}
          onChange={() => onToggleSubTask(task, index)}
          style={{ transform: 'scale(0.8)' }}
        />
        
        {editingSubTaskIndex === index ? (
          <input
            type="text"
            value={editSubTaskText}
            onChange={(e) => setEditSubTaskText(e.target.value)}
            onBlur={saveEditSubTask}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{
              flex: 1,
              padding: '1px 4px',  // 减少内边距
              border: '1px solid #1a73e8',
              borderRadius: '3px',
              fontSize: '12px',
              outline: 'none',
              height: '20px'  // 固定高度
            }}
          />
        ) : (
          <span 
            onClick={() => startEditSubTask(index, subTask.text)}
            style={{ 
              textDecoration: subTask.done ? 'line-through' : 'none',
              cursor: 'pointer',
              flex: 1,
              padding: '1px 4px',  // 减少内边距
              borderRadius: '3px',
              transition: 'background-color 0.2s',
              minHeight: '18px',
              display: 'flex',
              alignItems: 'center',
              lineHeight: '1.2'  // 调整行高
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {subTask.text}
          </span>
        )}
      </div>
    ))}
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
            marginLeft: "28px", // 调整为24px，与任务文本对齐
            whiteSpace: "pre-wrap",
            border: '1px solid #ffd54f'
          }}
        >
          💭 {task.reflection}
        </div>
      )}

      {task.scheduledTime && (
        <div style={{
          fontSize: "11px",
          color: "#666",
          marginTop: "4px",
          marginBottom: "4px",
          padding: "2px 6px",
          backgroundColor: "#f0f0f0",
          borderRadius: "4px",
          display: "inline-block",
          border: "1px solid #ddd"
        }}>
          ⏰ {task.scheduledTime}
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
};//end





function App() {
  const [tasksByDate, setTasksByDate] = useState({});
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTaskText, setNewTaskText] = useState("");
  const [pointHistory, setPointHistory] = useState([]);
  const [newTaskCategory, setNewTaskCategory] = useState(categories[0].name);
  const [bulkText, setBulkText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statsMode, setStatsMode] = useState("week");
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showImageModal, setShowImageModal] = useState(null);
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showDailyLogModal, setShowDailyLogModal] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [repeatConfig, setRepeatConfig] = useState({
    frequency: "daily",
    days: [false, false, false, false, false, false, false],
    startHour: "",
    startMinute: "",
    endHour: "",
    endMinute: "",
    reminderYear: "", // 新增
    reminderMonth: "", // 新增
    reminderDay: "", // 新增
    reminderHour: "", // 新增
    reminderMinute: "", // 新增
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
  const [showTaskEditModal, setShowTaskEditModal] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(null);
  const runningRefs = useRef({});
  const addInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  const [dailyRating, setDailyRating] = useState(0);
  const [dailyReflection, setDailyReflection] = useState('');
  const todayTasks = tasksByDate[selectedDate] || [];
  const [activeTimer, setActiveTimer] = useState(null); // { taskId, startTime }
  const [elapsedTime, setElapsedTime] = useState(0); // 新增：实时计时
  const [isInitialized, setIsInitialized] = useState(false);
  const [timerRecords, setTimerRecords] = useState([]);
  const [showTimerRecords, setShowTimerRecords] = useState(false);

 
  const editSubTask = (task, subTaskIndex, newText) => {
    if (newText && newText.trim() !== '') {
      if (task.isWeekTask) {
        const updatedTasksByDate = { ...tasksByDate };
        Object.keys(updatedTasksByDate).forEach(date => {
          updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
            t.isWeekTask && t.text === task.text ? {
              ...t,
              subTasks: t.subTasks.map((st, index) => 
                index === subTaskIndex ? { ...st, text: newText.trim() } : st
              )
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
              subTasks: t.subTasks.map((st, index) => 
                index === subTaskIndex ? { ...st, text: newText.trim() } : st
              )
            } : t
          )
        }));
      }
    }
  };


// 在 App 组件中的 generateDailyLog 函数
const generateDailyLog = () => {
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

  // 原始格式内容（用于界面显示）
  let logContent = `📅 ${selectedDate} 学习日志\n\n`;

  // Markdown 格式内容（用于复制）
  let markdownContent = `# ${selectedDate} 学习日志\n\n`;

  // 添加评分和感想
  if (dailyRating > 0) {
    const stars = '⭐'.repeat(dailyRating);
    logContent += `🌟 今日评分: ${stars}\n`;
    markdownContent += `## 今日评分: ${stars} \n\n`;
  }
  
  if (dailyReflection) {
    logContent += `💭 今日感想: ${dailyReflection}\n`;
    markdownContent += `## 今日感想\n${dailyReflection}\n\n`;
  }
  
  logContent += '\n';
  markdownContent += `## 任务完成情况\n\n`;

  Object.entries(tasksByCategory).forEach(([category, tasks]) => {
    logContent += `📚 ${category}:\n`;
    markdownContent += `### ${category}\n`;
    
    tasks.forEach((task, index) => {
      const timeText = task.timeSpent ? `${Math.floor(task.timeSpent / 60)}m` : '0m';
      const status = task.done ? '✅' : '❌';
      const markdownStatus = task.done ? '- [x]' : '- [ ]';
      
      logContent += `  ${index + 1}. ${status} ${task.text} - ${timeText}\n`;
      markdownContent += `${markdownStatus} ${task.text} - ${timeText}\n`;
      
      if (task.note) {
        logContent += `     备注: ${task.note}\n`;
        markdownContent += `  - 备注: ${task.note}\n`;
      }
    });
    logContent += '\n';
    markdownContent += '\n';
  });

  logContent += `📊 今日统计:\n`;
  logContent += `   完成任务: ${completedTasks.length} 个\n`;
  logContent += `   总任务数: ${todayTasks.length} 个\n`;
  logContent += `   完成率: ${Math.round((completedTasks.length / todayTasks.length) * 100)}%\n`;
  logContent += `   学习时长: ${totalMinutes} 分钟\n`;
  logContent += `   平均每项: ${completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0} 分钟\n`;

  markdownContent += `## 统计汇总\n`;
  markdownContent += `- 完成任务: ${completedTasks.length} 个\n`;
  markdownContent += `- 总任务数: ${todayTasks.length} 个\n`;
  markdownContent += `- 完成率: ${Math.round((completedTasks.length / todayTasks.length) * 100)}%\n`;
  markdownContent += `- 学习时长: ${totalMinutes} 分钟\n`;
  markdownContent += `- 平均每项: ${completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0} 分钟\n`;

  setShowDailyLogModal({
    visible: true,
    content: logContent,
    markdownContent: markdownContent,
    date: selectedDate,
    stats: {
      completedTasks: completedTasks.length,
      totalTasks: todayTasks.length,
      completionRate: Math.round((completedTasks.length / todayTasks.length) * 100),
      totalMinutes: totalMinutes,
      averagePerTask: completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0,
      categories: Object.keys(tasksByCategory).length,
      dailyRating: dailyRating,
      dailyReflection: dailyReflection
    }
  });
};


  // 添加 ReminderModal 组件
  const ReminderModal = ({ config, onSave, onClose }) => {
    const [reminderYear, setReminderYear] = useState(config.reminderYear || '');
    const [reminderMonth, setReminderMonth] = useState(config.reminderMonth || '');
    const [reminderDay, setReminderDay] = useState(config.reminderDay || '');
    const [reminderHour, setReminderHour] = useState(config.reminderHour || '');
    const [reminderMinute, setReminderMinute] = useState(config.reminderMinute || '');

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
          <h3 style={{ textAlign: 'center', marginBottom: 15 }}>设置提醒</h3>

          {/* 日期行 */}
          <div style={{ marginBottom: 15 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>日期:</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="number"
                placeholder=""
                min="2024"
                max="2030"
                value={reminderYear}
                onChange={(e) => setReminderYear(e.target.value)}
                style={{
                  width: '60px',
                  padding: '8px 4px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  textAlign: 'center'
                }}
              />
              <span style={{ color: '#666', fontSize: 14 }}>年</span>

              <input
                type="number"
                placeholder=""
                min="1"
                max="12"
                value={reminderMonth}
                onChange={(e) => setReminderMonth(e.target.value)}
                style={{
                  width: '50px',
                  padding: '8px 4px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  textAlign: 'center'
                }}
              />
              <span style={{ color: '#666', fontSize: 14 }}>月</span>

              <input
                type="number"
                placeholder=""
                min="1"
                max="31"
                value={reminderDay}
                onChange={(e) => setReminderDay(e.target.value)}
                style={{
                  width: '50px',
                  padding: '8px 4px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  textAlign: 'center'
                }}
              />
              <span style={{ color: '#666', fontSize: 14 }}>日</span>
            </div>
          </div>

          {/* 时间行 */}
          <div style={{ marginBottom: 15 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>时间:</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="number"
                placeholder=""
                min="0"
                max="23"
                value={reminderHour}
                onChange={(e) => setReminderHour(e.target.value)}
                style={{
                  width: '50px',
                  padding: '8px 4px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  textAlign: 'center'
                }}
              />
              <span style={{ color: '#666', fontSize: 14 }}>:</span>

              <input
                type="number"
                placeholder=""
                min="0"
                max="59"
                value={reminderMinute}
                onChange={(e) => setReminderMinute(e.target.value)}
                style={{
                  width: '50px',
                  padding: '8px 4px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  textAlign: 'center'
                }}
              />
            </div>
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
                background: '#ff6b6b',
                color: '#fff',
                border: 'none',
                borderRadius: 5
              }}
              onClick={() => {
                onSave({
                  reminderYear,
                  reminderMonth,
                  reminderDay,
                  reminderHour,
                  reminderMinute
                });
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













  // 积分记录函数
  const recordPointChange = (change, reason, currentTotal) => {
    const historyEntry = {
      date: new Date().toISOString(),
      change: change,
      reason: reason,
      totalAfterChange: currentTotal
    };

    setPointHistory(prev => [historyEntry, ...prev]);
  };

// 清理计时器状态
useEffect(() => {
  return () => {
    // 组件卸载时，如果有活动的计时器，保存当前状态
    if (activeTimer) {
      const timerData = {
        taskId: activeTimer.taskId,
        startTime: activeTimer.startTime,
        elapsedBeforeStart: elapsedTime
      };
      localStorage.setItem(`${STORAGE_KEY}_activeTimer`, JSON.stringify(timerData));
    }
  };
}, [activeTimer, elapsedTime]);


// 恢复计时器状态
useEffect(() => {
  const restoreTimerState = async () => {
    try {
      const savedTimer = await loadMainData('activeTimer');
      if (savedTimer && savedTimer.taskId && savedTimer.startTime) {
        const currentTime = Date.now();
        const timeSinceStart = Math.floor((currentTime - savedTimer.startTime) / 1000);
        
        // 直接使用保存的已用时间 + 从保存到现在的时间
        const totalElapsed = (savedTimer.elapsedBeforeStart || 0) + timeSinceStart;
        
        setElapsedTime(totalElapsed);
        setActiveTimer({
          taskId: savedTimer.taskId,
          startTime: savedTimer.startTime
        });
        
        console.log('⏱️ 恢复计时器:', {
          任务ID: savedTimer.taskId,
          已保存时间: savedTimer.elapsedBeforeStart,
          恢复后运行时间: timeSinceStart,
          总时间: totalElapsed
        });
      }
    } catch (error) {
      console.error('恢复计时器状态失败:', error);
    }
  };

  if (isInitialized) {
    restoreTimerState();
  }
}, [isInitialized]);

// 保存计时器状态
useEffect(() => {
  const saveTimerState = async () => {
    if (activeTimer) {
      const timerData = {
        taskId: activeTimer.taskId,
        startTime: activeTimer.startTime,
        elapsedBeforeStart: elapsedTime,
        savedAt: new Date().toISOString()
      };
      await saveMainData('activeTimer', timerData);
    } else {
      // 没有活动计时器时清除存储
      await saveMainData('activeTimer', null);
    }
  };

  if (isInitialized) {
    saveTimerState();
  }
}, [activeTimer, elapsedTime, isInitialized]);


// 暴露实例给全局调试
useEffect(() => {
  window.appInstance = {
    saveAllData: () => {
      saveMainData('tasks', tasksByDate);
      saveMainData('templates', templates);
      saveMainData('pointHistory', pointHistory);
      saveMainData('exchange', exchangeItems);
      console.log('✅ 所有数据已保存');
    },
    getState: () => ({
      tasksByDate,
      templates,
      pointHistory,
      exchangeItems,
      selectedDate,
      todayTasks: tasksByDate[selectedDate] || []  // 添加 todayTasks
    })
  };
  
  return () => {
    delete window.appInstance;
  };
}, [tasksByDate, templates, pointHistory, exchangeItems, selectedDate]); // 添加 selectedDate 依赖
  
  // ==== 新增：状态变化监听 ====
  useEffect(() => {
    console.log('🔄 tasksByDate 状态变化:', {
      天数: Object.keys(tasksByDate).length,
      总任务数: Object.values(tasksByDate).flat().length,
      内容: tasksByDate
    });
  }, [tasksByDate]);
  
  useEffect(() => {
    console.log('🔄 templates 状态变化:', templates);
  }, [templates]);
  
  useEffect(() => {
    console.log('🔄 pointHistory 状态变化:', pointHistory);
  }, [pointHistory]);
  
  useEffect(() => {
    console.log('🔄 exchangeItems 状态变化:', exchangeItems);
  }, [exchangeItems]);
  
  // ... 其他代码


  // 检查提醒时间并置顶到期任务
useEffect(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const updatedTasksByDate = { ...tasksByDate };
  let hasChanges = false;

  Object.keys(updatedTasksByDate).forEach(date => {
    updatedTasksByDate[date] = updatedTasksByDate[date].map(task => {
      if (task.reminderTime && !task.pinned) {
        const { year, month, day } = task.reminderTime;
        
        // 检查是否到达提醒日期
        if (year === currentYear && 
            month === currentMonth && 
            day === currentDay) {
          hasChanges = true;
          return { ...task, pinned: true };
        }
      }
      return task;
    });
  });

  if (hasChanges) {
    setTasksByDate(updatedTasksByDate);
  }
}, [tasksByDate]);

  // 保存到本地存储
  useEffect(() => {
    const dailyData = {
      rating: dailyRating,
      reflection: dailyReflection,
      date: selectedDate
    };
    localStorage.setItem(`${STORAGE_KEY}_daily_${selectedDate}`, JSON.stringify(dailyData));
  }, [dailyRating, dailyReflection, selectedDate]);

  // 读取数据
  useEffect(() => {
    const savedData = localStorage.getItem(`${STORAGE_KEY}_daily_${selectedDate}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setDailyRating(data.rating || 0);
      setDailyReflection(data.reflection || '');
    }
  }, [selectedDate]);




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
  
  
  // 在开始计时时添加调试
const handleStartTimer = (task) => {
  // 停止其他正在运行的计时器
  if (activeTimer && activeTimer.taskId !== task.id) {
    handlePauseTimer({ id: activeTimer.taskId });
  }

  const startTime = Date.now();
  setActiveTimer({ taskId: task.id, startTime });
  setElapsedTime(0);

  const newRecord = {
    id: Date.now().toString(),
    taskId: task.id,
    taskText: task.text,
    category: task.category,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0
  };
  setTimerRecords(prev => [newRecord, ...prev]);

  console.log('⏱️ 开始计时:', {
    任务: task.text,
    开始时间: new Date(startTime).toLocaleTimeString(),
    任务ID: task.id,
    已有时间: task.timeSpent || 0
  });
};
  
  
  const handlePauseTimer = (task) => {
    if (!activeTimer || activeTimer.taskId !== task.id) return;
  
    const endTime = Date.now();
    const timeSpentThisSession = Math.floor((endTime - activeTimer.startTime) / 1000);
    
    // 在这里添加更新记录 ↓
  setTimerRecords(prev => prev.map(record => 
    record.taskId === task.id && !record.endTime 
      ? {...record, endTime: new Date().toISOString(), duration: timeSpentThisSession}
      : record
  ));

    // 只使用本次会话的时间，elapsedTime已经在实时更新中包含了
    const totalTimeSpent = timeSpentThisSession;
  
    // 更新任务时间
    setTasksByDate(prev => {
      const currentTasks = prev[selectedDate] || [];
      const updatedTasks = currentTasks.map(t =>
        t.id === task.id ? {
          ...t,
          timeSpent: (t.timeSpent || 0) + totalTimeSpent
        } : t
      );
  
      return {
        ...prev,
        [selectedDate]: updatedTasks
      };
    });
  
    setActiveTimer(null);
    setElapsedTime(0);
  
    console.log('⏸️ 暂停计时:', {
      任务: task.text,
      本次计时: totalTimeSpent + '秒',
      总时间: (task.timeSpent || 0) + totalTimeSpent + '秒'
    });
  };


  //修改 - 恢复计时器状态
  useEffect(() => {
    // 检查是否有未完成的计时器
    const keys = Object.keys(localStorage);
    const timerKeys = keys.filter(key => key.startsWith('timer_'));

    if (timerKeys.length > 0) {
      timerKeys.forEach(key => {
        const taskId = key.replace('timer_', '');
        const startTime = parseInt(localStorage.getItem(key));
        const currentTime = Date.now();
        const timeSpent = Math.floor((currentTime - startTime) / 1000);

        // 更新任务时间
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

        // 重新开始计时
        setActiveTimer({ taskId, startTime: Date.now() - timeSpent * 1000 });
      });
    }
  }, []);


// 优化实时计时
useEffect(() => {
  let interval;

  if (activeTimer) {
    interval = setInterval(() => {
      const currentTime = Date.now();
      const timeElapsed = Math.floor((currentTime - activeTimer.startTime) / 1000);
      setElapsedTime(timeElapsed);
      
      // 每30秒自动保存一次计时状态
      if (timeElapsed % 30 === 0) {
        const timerData = {
          taskId: activeTimer.taskId,
          startTime: activeTimer.startTime,
          elapsedBeforeStart: 0, // 现在elapsedTime就是总时间
          savedAt: new Date().toISOString()
        };
        saveMainData('activeTimer', timerData);
      }
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



  //修改 - 统一修改时间显示格式
  const formatTimeNoSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds}s`;
  };

  //修改 - 添加新的时间格式化函数，显示分钟和秒数
  const formatTimeWithSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds}s`;
  };

  // 新增：分类标题专用时间格式（去掉0s）
  const formatCategoryTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m${remainingSeconds}s`;
  };

  // 格式化时间为小时
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



// 修复任务数据保存
useEffect(() => {
  const saveTasks = async () => {
    try {
      // 即使 tasksByDate 为空也保存，避免数据丢失
      await saveMainData('tasks', tasksByDate);
      console.log('任务数据自动保存:', Object.keys(tasksByDate).length, '天的数据');
    } catch (error) {
      console.error('任务数据保存失败:', error);
    }
  };

  // 添加防抖，避免频繁保存
  const timeoutId = setTimeout(saveTasks, 1000);
  return () => clearTimeout(timeoutId);
}, [tasksByDate]);

// 修复其他数据的保存
useEffect(() => {
  const saveTemplateData = async () => {
    if (templates.length > 0) {
      await saveMainData('templates', templates);
    }
  };
  saveTemplateData();
}, [templates]);

useEffect(() => {
  const saveExchangeData = async () => {
    if (exchangeItems.length > 0) {
      await saveMainData('exchange', exchangeItems);
    }
  };
  saveExchangeData();
}, [exchangeItems]);

useEffect(() => {
  const savePointHistory = async () => {
    if (pointHistory.length > 0) {
      await saveMainData('pointHistory', pointHistory);
    }
  };
  savePointHistory();
}, [pointHistory]);


// 读取每日数据
useEffect(() => {
  const loadDailyData = async () => {
    if (selectedDate) {
      const savedData = await loadMainData(`daily_${selectedDate}`);
      if (savedData) {
        setDailyRating(savedData.rating || 0);
        setDailyReflection(savedData.reflection || '');
      }
    }
  };

  loadDailyData();
}, [selectedDate]);


useEffect(() => {
  const initializeApp = async () => {
    console.log('🚀 初始化应用数据...');
    
    // 先迁移旧数据
    await migrateLegacyData();
    
    try {
      console.log('=== 开始加载数据 ===');
      
      // 加载任务数据
      const savedTasks = await loadMainData('tasks');
      console.log('✅ 加载的任务数据:', savedTasks);
      if (savedTasks) {
        setTasksByDate(savedTasks);
        console.log('✅ 任务数据设置成功，天数:', Object.keys(savedTasks).length);
      } else {
        console.log('ℹ️ 没有任务数据，使用空对象');
        setTasksByDate({});
      }
      
      // 加载模板数据
      const savedTemplates = await loadMainData('templates');
      console.log('✅ 加载的模板数据:', savedTemplates);
      if (savedTemplates) {
        setTemplates(savedTemplates);
      }
      
      // 加载积分历史
      const savedPointHistory = await loadMainData('pointHistory');
      console.log('✅ 加载的积分历史:', savedPointHistory);
      if (savedPointHistory) {
        setPointHistory(savedPointHistory);
      } else {
        setPointHistory([{
          date: new Date().toISOString(),
          change: 0,
          reason: '系统初始化',
          totalAfterChange: 0
        }]);
      }
      
      // 加载兑换物品
      const savedExchangeItems = await loadMainData('exchange');
      console.log('✅ 加载的兑换物品:', savedExchangeItems);
      if (savedExchangeItems) {
        setExchangeItems(savedExchangeItems);
      }
      
      console.log('🎉 应用初始化完成');


      await autoBackup();
      
      // 设置定时备份
      const backupTimer = setInterval(autoBackup, AUTO_BACKUP_CONFIG.backupInterval);
      
      // 清理函数
      return () => {
        clearInterval(backupTimer);
      };

      
    } catch (error) {
      console.error('初始化失败:', error);
    }
    
    setIsInitialized(true);
  };

  initializeApp();
}, []);

// 自动保存任务数据
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    console.log('💾 自动保存任务数据...');
    saveMainData('tasks', tasksByDate);
  }
}, [tasksByDate, isInitialized]);

// 自动保存模板数据
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    console.log('💾 自动保存模板数据...');
    saveMainData('templates', templates);
  }
}, [templates, isInitialized]);

// 自动保存积分历史
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    console.log('💾 自动保存积分历史...');
    saveMainData('pointHistory', pointHistory);
  }
}, [pointHistory, isInitialized]);

// 自动保存兑换物品
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    console.log('💾 自动保存兑换物品...');
    saveMainData('exchange', exchangeItems);
  }
}, [exchangeItems, isInitialized]);

// 数据完整性检查
useEffect(() => {
  const checkDataIntegrity = async () => {
    try {
      const savedTasks = await loadMainData('tasks');
      if (savedTasks && Object.keys(savedTasks).length > 0) {
        let fixedCount = 0;
        const fixedTasks = {};

        Object.entries(savedTasks).forEach(([date, tasks]) => {
          if (Array.isArray(tasks)) {
            // 修复任务数据格式
            const fixedTaskList = tasks.map(task => ({
              id: task.id || `fixed_${Date.now()}_${Math.random()}`,
              text: task.text || '未命名任务',
              category: task.category || categories[0].name,
              done: task.done || false,
              timeSpent: task.timeSpent || 0,
              note: task.note || "",
              reflection: task.reflection || "",
              image: task.image || null,
              scheduledTime: task.scheduledTime || "",
              pinned: task.pinned || false,
              isWeekTask: task.isWeekTask || false,
              tags: task.tags || [],
              subTasks: task.subTasks || [],
              progress: task.progress || {
                initial: 0,
                current: 0,
                target: 0,
                unit: "%"
              }
            }));

            if (fixedTaskList.length !== tasks.length) {
              fixedCount += (fixedTaskList.length - tasks.length);
            }

            fixedTasks[date] = fixedTaskList;
          }
        });

        if (fixedCount > 0) {
          console.log(`修复了 ${fixedCount} 个任务的数据格式`);
          await saveMainData('tasks', fixedTasks);
          setTasksByDate(fixedTasks);
        }
      }
    } catch (error) {
      console.error('数据完整性检查失败:', error);
    }
  };

  if (Object.keys(tasksByDate).length > 0) {
    checkDataIntegrity();
  }
}, [tasksByDate]);


  


  // 替换现有的 useEffect 点击外部处理逻辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 检查是否点击了重复设置或计划时间的按钮
      const isRepeatButton = event.target.closest('button')?.textContent?.includes('重复');
      const isTimeButton = event.target.closest('button')?.textContent?.includes('计划时间');
      const isTemplateButton = event.target.closest('button')?.textContent?.includes('模板');

      // 如果点击了这些功能按钮，不关闭输入框
      if (isRepeatButton || isTimeButton || isTemplateButton) {
        return;
      }

      if (addInputRef.current && !addInputRef.current.contains(event.target)) {
        // 检查是否点击了模态框
        const isModalClick = event.target.closest('[style*="position: fixed"]') ||
          event.target.closest('[style*="z-index: 1000"]');

        if (!isModalClick) {
          setShowAddInput(false);
        }
      }

      if (bulkInputRef.current && !bulkInputRef.current.contains(event.target)) {
        const isModalClick = event.target.closest('[style*="position: fixed"]') ||
          event.target.closest('[style*="z-index: 1000"]');

        if (!isModalClick) {
          setShowBulkInput(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
  const pinnedTasks = todayTasks.filter(task => task.pinned);
  const weekDates = getWeekDates(currentMonday);

  // 计算积分荣誉
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
      reminderYear: repeatConfig.reminderYear || "",
      reminderMonth: repeatConfig.reminderMonth || "",
      reminderDay: repeatConfig.reminderDay || "",
      reminderHour: repeatConfig.reminderHour || "",
      reminderMinute: repeatConfig.reminderMinute || "",
      done: false,
      timeSpent: 0,
      subTasks: [], // 新增子任务数组
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

  // 在批量导入任务的函数中修改
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
      tags: [{ name: '作业', color: '#9c27b0', textColor: '#fff' }] // 添加默认标签
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
  const wasDone = task.done;

  const updateTaskWithDone = (t, doneState) => {
    // 如果主任务被标记为完成，所有子任务也自动完成
    // 如果主任务被取消完成，子任务状态保持不变
    const newSubTasks = doneState 
      ? t.subTasks.map(st => ({ ...st, done: true }))
      : t.subTasks;
    
    return {
      ...t,
      done: doneState,
      subTasks: newSubTasks
    };
  };

  if (task.isWeekTask) {
    const updatedTasksByDate = { ...tasksByDate };
    Object.keys(updatedTasksByDate).forEach(date => {
      updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
        t.isWeekTask && t.text === task.text ? updateTaskWithDone(t, !wasDone) : t
      );
    });
    setTasksByDate(updatedTasksByDate);
  } else {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? updateTaskWithDone(t, !wasDone) : t
      )
    }));
  }

  setTimeout(() => {
    const { totalPoints: newTotal } = calculateHonorPoints();
    if (!wasDone) {
      recordPointChange(1, `完成任务: ${task.text}`, newTotal);
    } else {
      recordPointChange(-1, `取消完成: ${task.text}`, newTotal);
    }
  }, 100);
};










// 切换子任务完成状态
const toggleSubTask = (task, subTaskIndex) => {
  const updateTaskWithSubTasks = (t) => {
    const newSubTasks = t.subTasks.map((st, index) => 
      index === subTaskIndex ? { ...st, done: !st.done } : st
    );
    
    // 检查是否所有子任务都完成了
    const allSubTasksDone = newSubTasks.length > 0 && newSubTasks.every(st => st.done);
    
    return {
      ...t,
      subTasks: newSubTasks,
      done: allSubTasksDone // 自动设置主任务完成状态
    };
  };

  if (task.isWeekTask) {
    const updatedTasksByDate = { ...tasksByDate };
    Object.keys(updatedTasksByDate).forEach(date => {
      updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
        t.isWeekTask && t.text === task.text ? updateTaskWithSubTasks(t) : t
      );
    });
    setTasksByDate(updatedTasksByDate);
  } else {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? updateTaskWithSubTasks(t) : t
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
          tags: editData.tags || [],
          subTasks: editData.subTasks || [] , // 添加这行
          reminderTime: editData.reminderTime // 添加这行
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
          tags: editData.tags || [],
          subTasks: editData.subTasks || [] , // 添加这行
          reminderTime: editData.reminderTime // 添加这行
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
    todayTasks.filter(t => t.category === catName);

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
  try {
    console.log('当前周一:', currentMonday);
    
    // 创建新的日期对象
    const newMonday = new Date(currentMonday);
    console.log('复制后的周一:', newMonday);
    
    // 增加7天
    newMonday.setDate(newMonday.getDate() + 7);
    console.log('增加7天后的周一:', newMonday);
    
    // 更新状态
    setCurrentMonday(newMonday);
    
    // 修复：使用本地日期格式，避免时区问题
    const year = newMonday.getFullYear();
    const month = String(newMonday.getMonth() + 1).padStart(2, '0');
    const day = String(newMonday.getDate()).padStart(2, '0');
    const newSelectedDate = `${year}-${month}-${day}`;
    
    console.log('新的选中日期:', newSelectedDate);
    setSelectedDate(newSelectedDate);
    
    console.log('切换完成');
  } catch (error) {
    console.error('切换下一周时出错:', error);
  }
};



  // 日期选择处理函数
  const handleDateSelect = (selectedDate) => {
    const selectedMonday = getMonday(selectedDate);
    setCurrentMonday(selectedMonday);
    setSelectedDate(selectedDate.toISOString().split("T")[0]);
    setShowDatePickerModal(false);
  };

// 清空所有数据
const clearAllData = async () => {
  if (window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
    setTasksByDate({});
    setTemplates([]);
    setExchangeItems([]);
    setPointHistory([{
      date: new Date().toISOString(),
      change: 0,
      reason: '系统初始化',
      totalAfterChange: 0
    }]);
    setActiveTimer(null);
    setElapsedTime(0);
    
    // 清空所有存储
    await saveMainData('tasks', {});
    await saveMainData('templates', []);
    await saveMainData('exchange', []);
    await saveMainData('pointHistory', [{
      date: new Date().toISOString(),
      change: 0,
      reason: '系统初始化',
      totalAfterChange: 0
    }]);
    await saveMainData('activeTimer', null);
    
    // 清空每日数据
    const today = new Date().toISOString().split("T")[0];
    await saveMainData(`daily_${today}`, {
      rating: 0,
      reflection: '',
      date: today
    });
  }
};



// 导出数据
const handleExportData = async () => {
  try {
    const allData = {
      tasks: await loadMainData('tasks'),
      templates: await loadMainData('templates'),
      exchange: await loadMainData('exchange'),
      pointHistory: await loadMainData('pointHistory'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `study-tracker-backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  }
};
  
  
// 每日日志汇总模态框
const DailyLogModal = ({ logData, onClose, onCopy }) => {
  if (!logData) return null;

  // 生成 Markdown 格式的日志内容
  const generateMarkdownContent = () => {
    let markdownContent = `# ${logData.date} 学习日志\n\n`;

    // 添加评分和感想
    if (logData.stats.dailyRating > 0) {
      const stars = '⭐'.repeat(logData.stats.dailyRating);
      markdownContent += `## 今日评分: ${stars} (${logData.stats.dailyRating}星)\n\n`;
    }
    
    if (logData.stats.dailyReflection) {
      markdownContent += `## 今日感想\n${logData.stats.dailyReflection}\n\n`;
    }

    // 将任务列表转换为 Markdown 复选框
    const markdownTasks = logData.content
      .replace(/✅/g, '- [x]')
      .replace(/❌/g, '- [ ]')
      .replace(/📚/g, '##')
      .replace(/📊/g, '##');

    return markdownContent + markdownTasks;
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

        {/* 日志内容 */}
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
            onClick={() => {
              const markdownContent = generateMarkdownContent();
              onCopy(markdownContent);
            }}
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

  // 添加兑换物品
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


  // 积分荣誉模态框 - 调整后的版本
  const HonorModal = () => {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    
    const handleClearPoints = async () => {
      const currentPoints = totalPoints;
      recordPointChange(-currentPoints, '积分清零', 0);
    
      const clearedTasksByDate = {};
      Object.keys(tasksByDate).forEach(date => {
        clearedTasksByDate[date] = tasksByDate[date].map(task => ({
          ...task,
          done: false
        }));
      });
    
      setTasksByDate(clearedTasksByDate);
      
      // 保存到存储
      await saveMainData('tasks', clearedTasksByDate);
      
      setShowClearConfirm(false);
      setShowHonorModal(false);
      setTasksByDate(clearedTasksByDate);
    };


      
    
    

    // 积分历史记录组件
    const PointHistory = () => (
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
        zIndex: 1002
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
          <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
            📊 积分历史记录
          </h3>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
            maxHeight: 300,
            overflow: 'auto'
          }}>
            {pointHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                暂无积分记录
              </div>
            ) : (
              pointHistory.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 8px',
                    borderBottom: index < pointHistory.length - 1 ? '1px solid #e0e0e0' : 'none',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: entry.change > 0 ? '#28a745' : entry.change < 0 ? '#dc3545' : '#666'
                    }}>
                      {entry.change > 0 ? '+' : ''}{entry.change} 分
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {entry.reason}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                      {new Date(entry.date).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#1a73e8',
                    marginLeft: 10
                  }}>
                    总计: {entry.totalAfterChange}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowHistory(false)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            关闭
          </button>
        </div>
      </div>
    );

    return (
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
          maxWidth: 400,
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          <h3 style={{
            textAlign: "center",
            marginBottom: 15,
            color: "#1a73e8",
            fontSize: 18,
            marginTop: 0
          }}>
            🏆 积分荣誉
          </h3>

          {/* 积分显示区域 */}
          <div style={{
            textAlign: "center",
            marginBottom: 15,
            padding: 12,
            backgroundColor: '#e8f0fe',
            borderRadius: 10,
            border: '2px solid #1a73e8'
          }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 5 }}>
              当前积分
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1a73e8",
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              {totalPoints} 分
            </div>
          </div>

          {/* 时间统计 */}
          <div style={{
            marginBottom: 15,
            padding: 12,
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
            flex: 1,
            minHeight: 0,
            overflow: 'auto'
          }}>
            <div style={{ marginBottom: 12, fontWeight: "bold", color: "#333", fontSize: 14 }}>时间统计:</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              textAlign: 'center',
              marginBottom: 15
            }}>
              <div style={{
                padding: 10,
                backgroundColor: '#fff',
                borderRadius: 8,
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>今日</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#28a745' }}>
                  {todayPoints} 分
                </div>
              </div>
              <div style={{
                padding: 10,
                backgroundColor: '#fff',
                borderRadius: 8,
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>本周</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1a73e8' }}>
                  {weekPoints} 分
                </div>
              </div>
              <div style={{
                padding: 10,
                backgroundColor: '#fff',
                borderRadius: 8,
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>本月</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff6b6b' }}>
                  {monthPoints} 分
                </div>
              </div>
            </div>

            {/* 各科目积分 */}
            <div style={{ marginBottom: 12, fontWeight: "bold", color: "#333", fontSize: 14 }}>各科目积分:</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6
            }}>
              {categories.map(cat => (
                <div key={cat.name} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 8px",
                  backgroundColor: '#fff',
                  borderRadius: 6,
                  border: '1px solid #e0e0e0',
                  fontSize: 12
                }}>
                  <span>{cat.name}</span>
                  <span style={{
                    fontWeight: "bold",
                    color: pointsByCategory[cat.name]?.total > 0 ? '#1a73e8' : '#666'
                  }}>
                    {pointsByCategory[cat.name]?.total || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 按钮区域 - 确保在可视区域内 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginTop: 'auto'
          }}>
            <button
              onClick={() => {
                setShowHonorModal(false);
                setShowExchangeModal(true);
              }}
              style={{
                padding: "10px 6px",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "bold",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              🎁 兑换
            </button>

            <button
              onClick={() => setShowHistory(true)}
              style={{
                padding: "10px 6px",
                backgroundColor: "#17a2b8",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "bold",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              📊 历史
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                padding: "10px 6px",
                backgroundColor: "#ff6b6b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "bold",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              🗑️ 清零
            </button>

            <button
              onClick={() => setShowHonorModal(false)}
              style={{
                padding: "10px 6px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: "bold",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              ❌ 关闭
            </button>
          </div>

          {/* 积分历史模态框 */}
          {showHistory && <PointHistory />}

          {/* 清零确认模态框 */}
          {showClearConfirm && (
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
              zIndex: 1001
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
                width: '80%',
                maxWidth: 300
              }}>
                <h4 style={{ textAlign: 'center', marginBottom: 15, color: '#d32f2f' }}>
                  确认清零积分？
                </h4>
                <p style={{ textAlign: 'center', marginBottom: 15, fontSize: 14, lineHeight: 1.4 }}>
                  这将重置所有任务的完成状态，当前积分 {totalPoints} 分将被清零。
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      flex: 1,
                      padding: 10,
                      backgroundColor: '#ccc',
                      color: '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClearPoints}
                    style={{
                      flex: 1,
                      padding: 10,
                      backgroundColor: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    确认清零
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };



  // 积分兑换模态框
  const ExchangeModal = ({
    exchangeItems,
    totalPoints,
    onClose,
    onExchange,
    onAddItem,
    onDeleteItem
  }) => {
    const fileInputRef = useRef(null);
    const [localName, setLocalName] = useState('');
    const [localPoints, setLocalPoints] = useState(0);
    const [localImage, setLocalImage] = useState(null);

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalImage(event.target.result);
      };
      reader.readAsDataURL(file);
    };

    const handleAddItem = () => {
      if (localName && localPoints > 0) {
        const newItemData = {
          name: localName,
          points: localPoints,
          image: localImage
        };

        onAddItem(newItemData);
        setLocalName('');
        setLocalPoints(0);
        setLocalImage(null);

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
          position: 'relative'
        }}>
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
    return <StatsPage />;
  }


// ==== 渲染调试 - 展开详细内容 ====
console.log('🎨 组件渲染 - 详细状态:', {
  任务天数: Object.keys(tasksByDate).length,
  任务数据所有日期: Object.keys(tasksByDate),
  选中日期: selectedDate,
  今日任务数量: todayTasks.length,
  今日任务详情: todayTasks,
  模板数量: templates.length,
  积分历史数量: pointHistory.length,
  积分历史详情: pointHistory,
  兑换物品数量: exchangeItems.length,
  是否初始化: isInitialized
});

// 特别检查今日任务
console.log('📅 今日任务检查:');
console.log('  - 选中日期:', selectedDate);
console.log('  - 任务数据中该日期的任务:', tasksByDate[selectedDate]);
console.log('  - todayTasks 变量:', todayTasks);


// 如果任务数据为空，显示警告
if (isInitialized && Object.keys(tasksByDate).length === 0) {
  console.warn('⚠️ 警告: 已初始化但任务数据为空');
}

if (isInitialized && todayTasks.length === 0) {
  console.warn('⚠️ 警告: 已初始化但今日任务为空');
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

      {/* 在模态框渲染部分添加 */}
      {showReminderModal && (
        <ReminderModal
          config={repeatConfig}
          onSave={(newConfig) => setRepeatConfig(newConfig)}
          onClose={() => setShowReminderModal(false)}
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
      {/* 备份管理模态框 */}
      {showBackupModal && (
        <BackupManagerModal onClose={() => setShowBackupModal(false)} />
      )}

{/* 在这里添加计时记录模态框 ↓ */}
{showTimerRecords && (
  <TimerRecordsModal 
    records={timerRecords}
    onClose={() => setShowTimerRecords(false)}
  />
)}

      {/* 主页面内容 */}
      <h1 style={{
        textAlign: "center",
        color: "#1a73e8",
        fontSize: "20px",
        marginTop: "0px",      // 确保为0
        marginBottom: "10px",  // 调整下边距
        paddingTop: "0px"      // 确保为0
      }}>
        汤圆学习打卡系统
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

        <div style={{
          display: "flex",
          alignItems: "center"
        }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevWeek();
            }}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              marginRight: 10,
              padding: "8px",
              fontSize: "16px"
            }}
            title="上一周"
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
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('右箭头被点击'); // 添加调试信息
    nextWeek();
  }}
  style={{
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    marginLeft: 6,
    padding: "8px",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}
  title="下一周"
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

      {(() => {
        const validatedMonday = getMonday(new Date(selectedDate));
        if (validatedMonday.getTime() !== currentMonday.getTime()) {
          setCurrentMonday(validatedMonday);
        }
        return null;
      })()}

<div style={{
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
}}>
  {getWeekDates(currentMonday).map((d) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isSelected = d.date === selectedDate;
    const isToday = d.date === todayStr;
    
    return (
      <div
        key={d.date}
        onClick={() => setSelectedDate(d.date)}
        style={{
          padding: "4px 6px",
          borderBottom: `2px solid ${isSelected ? "#0b52b0" : "#e0e0e0"}`,
          textAlign: "center",
          flex: 1,
          margin: "0 2px",
          fontSize: 12,
          cursor: "pointer",
          backgroundColor: isToday ? "#1a73e8" : "transparent",
          color: isToday ? "#fff" : "#000",
          transition: "all 0.2s ease",
          boxSizing: "border-box"
        }}
      >
        <div>{d.label}</div>
        <div style={{ fontSize: 10 }}>{d.date.slice(5)}</div>
      </div>
    );
  })}
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
  <span>置顶 ({pinnedTasks.length})</span>
  <span
    style={{
      fontSize: 12,
      color: "#333",
      padding: "2px 8px",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      backgroundColor: "#f5f5f5",
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }}
    title="置顶任务总时间"
  >
    {(() => {
      // 计算所有置顶任务的总时间
      const totalTime = pinnedTasks.reduce((sum, task) => {
        const taskTime = task.timeSpent || 0;
        // 如果这个任务正在计时，加上实时计时
        if (activeTimer && activeTimer.taskId === task.id) {
          return sum + taskTime + elapsedTime;
        }
        return sum + taskTime;
      }, 0);
      return formatTimeNoSeconds(totalTime);
    })()}
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
      onToggleSubTask={toggleSubTask} // 添加这行
      onPauseTimer={handlePauseTimer}
      isTimerRunning={activeTimer?.taskId === task.id}
      elapsedTime={elapsedTime} // 新增这行
      onEditSubTask={editSubTask}  // 添加这行 - 这里缺少了
    />
))}
          </ul>
        </div>
      )}


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
    onEditSubTask={editSubTask}  // 添加这行 - 这里缺少了
    onStartTimer={handleStartTimer}
    elapsedTime={elapsedTime} // 新增这行
    onToggleSubTask={toggleSubTask}  // 添加这行
    onPauseTimer={handlePauseTimer}
    isTimerRunning={activeTimer?.taskId === task.id}
  />
))}
          </ul>
        )}
      </div>

      

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
      onEditSubTask={editSubTask}  // 添加这行 - 这里缺少了
      onToggleSubTask={toggleSubTask}
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
            backgroundColor: "#1a73e8",
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

      {/* 默认显示的评分和感想（没有展开输入框时） */}
      {!showAddInput && !showBulkInput && (
        <div style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
          alignItems: "center",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px"
        }}>
          {/* 今日评分 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", marginBottom: "4px", color: "#666" }}>
              今日评分:
            </div>
            <select
              value={dailyRating}
              onChange={(e) => setDailyRating(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px",
                backgroundColor: "white"
              }}
            >
              <option value="0">评分</option>
              <option value="1">⭐</option>
              <option value="2">⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="5">⭐⭐⭐⭐⭐</option>
            </select>
          </div>

         {/* 今日感想 */}
<div style={{ flex: 2 }}>
  <div style={{ fontSize: "12px", marginBottom: "4px", color: "#666" }}>
    今日感想:
  </div>
  <input
    type="text"
    value={dailyReflection}
    onChange={(e) => setDailyReflection(e.target.value)}
    placeholder="记录今天的收获和感悟..."
    style={{
      width: "100%",
      padding: "6px 8px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "12px"
    }}
            />
          </div>
        </div>
      )}

      {/* 添加任务输入框（展开时显示） */}
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
                e.preventDefault();
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

            {/* 在这里添加计划时间按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
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

            {/* 在这里添加提醒按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReminderModal(true);
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
              提醒
            </button>


            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTemplateModal(true);
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
              模板
            </button>

            {templates.map((template, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
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


          {/* 展开状态下显示的评分和感想 */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginTop: "10px",
            alignItems: "center",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px"
          }}>
            {/* 今日评分 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", marginBottom: "4px", color: "#666" }}>
                今日评分:
              </div>
              <select
                value={dailyRating}
                onChange={(e) => setDailyRating(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  backgroundColor: "white"
                }}
              >
                <option value="0">评分</option>
                <option value="1">⭐</option>
                <option value="2">⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
              </select>
            </div>

            {/* 今日感想 */}
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: "12px", marginBottom: "4px", color: "#666" }}>
                今日感想:
              </div>
              <input
                type="text"
                value={dailyReflection}
                onChange={(e) => setDailyReflection(e.target.value)}
                placeholder="记录今天的收获和感悟..."
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 批量导入输入框（展开时显示） */}
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

          {/* 展开状态下显示的评分和感想 */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginTop: "10px",
            alignItems: "center",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px"
          }}>
            {/* 今日评分 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", marginBottom: "4px", color: "#666" }}>
                今日评分:
              </div>
              <select
                value={dailyRating}
                onChange={(e) => setDailyRating(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  backgroundColor: "white"
                }}
              >
                <option value="0">请选择评分</option>
                <option value="1">⭐ (1星)</option>
                <option value="2">⭐⭐ (2星)</option>
                <option value="3">⭐⭐⭐ (3星)</option>
                <option value="4">⭐⭐⭐⭐ (4星)</option>
                <option value="5">⭐⭐⭐⭐⭐ (5星)</option>
              </select>
            </div>

            {/* 今日感想 */}
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: "12px", marginBottom: "4px", color: "#666" }}>
                今日感想:
              </div>
              <input
                type="text"
                value={dailyReflection}
                onChange={(e) => setDailyReflection(e.target.value)}
                placeholder="记录今天的收获和感悟..."
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
            </div>
          </div>
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
  onChange={async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        // 验证数据格式
        if (!importedData.tasks || !importedData.version) {
          throw new Error('无效的数据文件格式');
        }

        if (window.confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
          // 依次导入各个部分
          if (importedData.tasks) {
            await saveMainData('tasks', importedData.tasks);
            setTasksByDate(importedData.tasks);
          }
          if (importedData.templates) {
            await saveMainData('templates', importedData.templates);
            setTemplates(importedData.templates);
          }
          if (importedData.exchange) {
            await saveMainData('exchange', importedData.exchange);
            setExchangeItems(importedData.exchange);
          }
          if (importedData.pointHistory) {
            await saveMainData('pointHistory', importedData.pointHistory);
            setPointHistory(importedData.pointHistory);
          }
          
          alert('数据导入成功！');
        }
      } catch (error) {
        console.error('导入失败:', error);
        alert(`导入失败：${error.message || '文件格式不正确'}`);
      }
    };

    reader.onerror = () => {
      alert('文件读取失败，请重试');
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
          清空数据
        </button>
        {/* 测试按钮 - 临时添加用于调试 */}



<button
          onClick={() => setShowBackupModal(true)}
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
          备份管理
        </button>
       
<button
  onClick={() => setShowTimerRecords(true)}
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
  计时记录
</button>
      </div>
    </div>
  );
}

export default App;
