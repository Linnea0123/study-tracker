
/* eslint-disable no-undef */
import React, { useState, useEffect, useRef, useCallback} from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';

// 重命名文件顶部的 categories 为 baseCategories
const baseCategories = [
  { 
    name: "校内", 
    color: "#1a73e8",
    subCategories: ["数学", "语文", "英语", "运动"]
  },
  { name: "语文", color: "#5b8def" },
  { name: "数学", color: "#397ef6" },
  { name: "英语", color: "#739df9" },
  { name: "科学", color: "#4db9e8" },
  { name: "运动", color: "#7baaf7" }
]
;
// 保持这样就行
const PAGE_ID = 'PAGE_A'; 
const STORAGE_KEY = `study-tracker-${PAGE_ID}-v2`;

// ========== 成就系统配置 ==========
const ACHIEVEMENTS_CONFIG = {
  // 新手成就
  beginner: [
    {
      id: 'first_task',
      name: '启程之日',
      description: '完成第一个任务',
      icon: '🎯',
      condition: (userData) => {
        const allTasks = Object.values(userData.tasksByDate).flat();
        return allTasks.some(task => task.done);
      },
      points: 5
    },
    {
      id: 'first_30min',
      name: '学习起步', 
      description: '单日学习时间达到30分钟',
      icon: '⏱️',
      condition: (userData) => {
        const today = new Date().toISOString().split('T')[0];
        const todayTime = userData.tasksByDate[today]?.reduce((sum, task) => sum + (task.timeSpent || 0), 0) || 0;
        return todayTime >= 1800;
      },
      points: 10
    },
    {
      id: 'plan_master',
      name: '计划达人',
      description: '创建10个任务',
      icon: '📝',
      condition: (userData) => {
        const allTasks = Object.values(userData.tasksByDate).flat();
        return allTasks.length >= 10;
      },
      points: 15
    }
  ],
  
  // 时间成就
  time: [
    {
      id: 'one_hour',
      name: '时间管理者',
      description: '单日学习1小时',
      icon: '🕐',
      condition: (userData) => {
        const today = new Date().toISOString().split('T')[0];
        const todayTime = userData.tasksByDate[today]?.reduce((sum, task) => sum + (task.timeSpent || 0), 0) || 0;
        return todayTime >= 3600;
      },
      points: 20
    },
    {
      id: 'three_hours',
      name: '学习狂人',
      description: '单日学习3小时', 
      icon: '🕒',
      condition: (userData) => {
        const today = new Date().toISOString().split('T')[0];
        const todayTime = userData.tasksByDate[today]?.reduce((sum, task) => sum + (task.timeSpent || 0), 0) || 0;
        return todayTime >= 10800;
      },
      points: 40
    }
  ],
  
  // 连续成就
  streak: [
    {
      id: 'three_days',
      name: '渐入佳境',
      description: '连续学习3天',
      icon: '🔥',
      condition: (userData) => {
        return calculateCurrentStreak(userData.tasksByDate) >= 3; // 这里使用函数
      },
      points: 25
    },
    {
      id: 'one_week',
      name: '持之以恒',
      description: '连续学习7天',
      icon: '🌟',
      condition: (userData) => {
        return calculateCurrentStreak(userData.tasksByDate) >= 7; // 这里使用函数
      },
      points: 50
    },
    {
      id: 'one_month',
      name: '铁人',
      description: '连续学习30天',
      icon: '💪',
      condition: (userData) => {
        return calculateCurrentStreak(userData.tasksByDate) >= 30; // 这里使用函数
      },
      points: 100
    }
  ],
  
  // 科目成就
  subject: [
    {
      id: 'math_lover',
      name: '数学爱好者',
      description: '数学学习时间达到2小时',
      icon: '📐',
      condition: (userData) => {
        const allTasks = Object.values(userData.tasksByDate).flat();
        const mathTime = allTasks
          .filter(task => task.category === '数学')
          .reduce((sum, task) => sum + (task.timeSpent || 0), 0);
        return mathTime >= 7200;
      },
      points: 30
    },
    {
      id: 'english_master',
      name: '英语达人',
      description: '英语学习时间达到2小时',
      icon: '🔤',
      condition: (userData) => {
        const allTasks = Object.values(userData.tasksByDate).flat();
        const englishTime = allTasks
          .filter(task => task.category === '英语')
          .reduce((sum, task) => sum + (task.timeSpent || 0), 0);
        return englishTime >= 7200;
      },
      points: 30
    },
    {
  id: 'balanced',
  name: '全面发展',
  description: '所有科目都有学习记录',
  icon: '⚖️',
  condition: (userData) => {
    const allTasks = Object.values(userData.tasksByDate).flat();
    const studiedCategories = new Set(allTasks.map(task => task.category));
    return baseCategories.every(cat => studiedCategories.has(cat.name));
  },
  points: 40
}
  ],
  
  custom: [
    // 这里会动态添加用户自定义的成就
  ],

  // 特殊成就
  special: [
   {
    id: 'early_bird',
    name: '早起的鸟儿',
    description: '在早上6-8点之间完成任务',
    icon: '🐦',
    condition: (userData) => {
      const allTasks = Object.values(userData.tasksByDate).flat();
      return allTasks.some(task => {
        if (task.done && task.timeSegments) {
          return task.timeSegments.some(segment => {
            if (segment.startTime) {
              const hour = new Date(segment.startTime).getHours();
              return hour >= 6 && hour < 8; // 早上6-8点
            }
            return false;
          });
        }
        return false;
      });
    },
    points: 25
  },
    {
    id: 'weekend_hero',
    name: '周末英雄',
    description: '在周末完成5个任务',
    icon: '🎪',
    condition: (userData) => {
      const weekendTasks = Object.entries(userData.tasksByDate)
        .filter(([date]) => {
          const day = new Date(date).getDay();
          return day === 0 || day === 6; // 周六或周日
        })
        .flatMap(([_, tasks]) => tasks.filter(task => task.done));
      
      return weekendTasks.length >= 5;
    },
    points: 35
  }
  ]
};
//成就系统end








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
            

// 在 BackupManagerModal 组件中更新备份信息显示
// 替换现有的备份列表部分
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
        <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
          任务天数: {backup.tasksCount} | 版本: {backup.version || '1.0'}
        </div>
        {/* ✅ 修复：显示成就数据状态 */}
        <div style={{ fontSize: 11, color: backup.hasAchievements ? '#28a745' : '#ffc107' }}>
          {backup.hasAchievements ? '✅ 包含成就数据' : '⚠️ 无成就数据'}
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
};


// 在这里添加计时记录模态框组件 ↓
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
        borderRadius: 15,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative' // 添加相对定位
      }}>
         {/* 右上角关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
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
        
    
      </div>
    </div>
  );
};



const CustomAchievementModal = ({ onSave, onClose, editAchievement = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetType: 'taskCount',
    targetValue: '',
    subject: '语文',
    icon: '🎯',
    points: 10
  });

  const iconOptions = ['🎯', '⭐', '🏆', '🔥', '🌟', '💪', '📚', '⏱️', '✅', '📊'];

  const handleSave = () => {
    if (!formData.name.trim() || !formData.targetValue) {
      alert('请填写成就名称和目标值');
      return;
    }

    const customAchievement = {
      id: `custom_${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || `完成目标：${formData.targetValue}`,
      icon: formData.icon,
      points: parseInt(formData.points) || 10,
      condition: (userData) => {
        switch (formData.targetType) {
          case 'taskCount':
            const allTasks = Object.values(userData.tasksByDate).flat();
            return allTasks.filter(task => task.done).length >= parseInt(formData.targetValue);
          case 'subjectTime':
            const allTasks2 = Object.values(userData.tasksByDate).flat();
            const subjectTime = allTasks2
              .filter(task => task.category === formData.subject && task.done)
              .reduce((sum, task) => sum + (task.timeSpent || 0), 0);
            return subjectTime >= (parseInt(formData.targetValue) * 3600);
          case 'totalTime':
            const allTasks3 = Object.values(userData.tasksByDate).flat();
            const totalTime = allTasks3
              .filter(task => task.done)
              .reduce((sum, task) => sum + (task.timeSpent || 0), 0);
            return totalTime >= (parseInt(formData.targetValue) * 3600);
          default:
            return false;
        }
      },
      isCustom: true
    };

    onSave(customAchievement);
  };

  return (
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
      zIndex: 1000,
      padding: '10px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        width: '95%',
        maxWidth: 500,
        // 修改高度设置
        maxHeight: '90vh', // 改为90vh而不是固定高度
        overflow: 'auto', // 整个模态框可以滚动
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#1a73e8' }}>
          创建自定义成就
        </h3>

        {/* 图标选择 */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>选择图标:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {iconOptions.map(icon => (
              <button
                key={icon}
                onClick={() => setFormData({ ...formData, icon })}
                style={{
                  fontSize: '20px',
                  padding: '8px',
                  border: `2px solid ${formData.icon === icon ? '#1a73e8' : '#ddd'}`,
                  borderRadius: '8px',
                  backgroundColor: formData.icon === icon ? '#e8f0fe' : 'white',
                  cursor: 'pointer'
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* 成就名称 */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>成就名称:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：数学大师"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>

        {/* 目标类型 */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>目标类型:</label>
          <select
            value={formData.targetType}
            onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          >
            <option value="taskCount">完成任务数量</option>
            <option value="subjectTime">科目学习时间</option>
            <option value="totalTime">总学习时间</option>
          </select>
        </div>

        {/* 目标值 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>目标值:</label>
          <input
            type="number"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
            placeholder="例如：10"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', backgroundColor: '#ccc', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
};





// 修改成就模态框组件
const AchievementsModal = ({ 
  achievements, 
  onClose, 
  isNew = false, 
  unlockedAchievements = [], 
  onAddCustom, 
  onEditCustom, 
  onDeleteCustom, 
  customAchievements = [] 
}) => {
  
  // 获取所有系统成就（排除custom数组）
  const allSystemAchievements = Object.values(ACHIEVEMENTS_CONFIG)
    .filter(config => Array.isArray(config) && config !== ACHIEVEMENTS_CONFIG.custom)
    .flat();
  
  // 合并系统成就和自定义成就
  const allAchievements = [...allSystemAchievements, ...customAchievements];
  
  return (
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
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        width: '95%',
        maxWidth: 500,
        maxHeight: '80vh',
        overflow: 'auto',
        textAlign: 'center',
        position: 'relative' // 添加相对定位
      }}>
 {/* 右上角关闭按钮 */}
 <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
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




        {isNew && achievements.length > 0 && (
          <div style={{ fontSize: 24, marginBottom: 10, color: '#ff6b6b', fontWeight: 'bold' }}>
            🎉 成就解锁！
          </div>
        )}
        
        <h3 style={{ marginBottom: 20, color: '#1a73e8' }}>🏆 成就徽章墙</h3>
        
        {/* 自定义成就按钮 */}
        <div style={{ marginBottom: 15 }}>
          <button
            onClick={(e) => {
              
              e.stopPropagation(); // 阻止事件冒泡
              onAddCustom();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ➕ 创建自定义成就
          </button>
        </div>

        {/* 统计信息 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '12px'
        }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>已解锁</div>
            <div>{unlockedAchievements.length}/{allAchievements.length}</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>总积分</div>
            <div>{allAchievements
              .filter(ach => unlockedAchievements.includes(ach.id))
              .reduce((sum, ach) => sum + ach.points, 0)}分</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>完成度</div>
            <div>{allAchievements.length > 0 ? Math.round((unlockedAchievements.length / allAchievements.length) * 100) : 0}%</div>
          </div>
        </div>

        {/* 成就网格 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 20
        }}>
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const isCustom = achievement.isCustom;
            
            return (
              <div
                key={achievement.id}
                style={{
                  padding: '12px 8px',
                  backgroundColor: isUnlocked ? '#e8f5e8' : '#f5f5f5',
                  borderRadius: '10px',
                  border: `2px solid ${isUnlocked ? '#4CAF50' : isCustom ? '#ffa726' : '#ddd'}`,
                  textAlign: 'center',
                  opacity: isUnlocked ? 1 : 0.7,
                  position: 'relative'
                }}
              >
                {/* 自定义成就标识 */}
                {isCustom && (
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    fontSize: '10px',
                    color: '#ffa726'
                  }}>
                    ✏️
                  </div>
                )}
                
                <div style={{
                  fontSize: '24px',
                  marginBottom: '8px',
                  filter: isUnlocked ? 'none' : 'grayscale(100%)'
                }}>
                  {achievement.icon}
                </div>
                
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginBottom: '4px',
                  color: isUnlocked ? '#333' : '#999'
                }}>
                  {achievement.name}
                </div>
                
                <div style={{
                  fontSize: '10px',
                  color: isUnlocked ? '#666' : '#999',
                  marginBottom: '6px',
                  lineHeight: '1.2'
                }}>
                  {achievement.description}
                </div>
                
                <div style={{
                  fontSize: '9px',
                  color: isUnlocked ? '#4CAF50' : '#ccc',
                  fontWeight: 'bold'
                }}>
                  {isUnlocked ? `+${achievement.points}积分` : '未解锁'}
                </div>

                {/* 自定义成就操作按钮 */}
                {isCustom && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCustom(achievement);
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustom(achievement.id);
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
      
      </div>
    </div>
  );
};
//成就模块end












// ==== 新增：自动备份配置 ====
const AUTO_BACKUP_CONFIG = {
  maxBackups: 7,                    // 保留7个备份
  backupInterval: 2 * 60 * 1000,   // 2分钟（2 * 60 * 1000 毫秒）- 修改这里
  backupPrefix: 'auto_backup_'      // 备份文件前缀
};


// 计算连续学习天数
const calculateCurrentStreak = (tasksByDate) => {
  const dates = Object.keys(tasksByDate)
    .filter(date => {
      const dayTasks = tasksByDate[date] || [];
      return dayTasks.some(task => task.done) || 
             dayTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0) > 0;
    })
    .sort((a, b) => b.localeCompare(a));
  
  if (dates.length === 0) return 0;
  
  let streak = 1;
  let currentDate = new Date(dates[0]);
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i]);
    const diffTime = currentDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
};


// 修改成就检查函数，添加 customAchievements 参数
const checkAchievements = (userData, unlockedAchievements, customAchievements = []) => {
  const newAchievements = [];
  
  // 获取所有系统成就（排除custom数组）
  const allSystemAchievements = Object.values(ACHIEVEMENTS_CONFIG)
    .filter(config => Array.isArray(config) && config !== ACHIEVEMENTS_CONFIG.custom)
    .flat();
  
  // 合并系统成就和自定义成就
  const allAchievements = [...allSystemAchievements, ...customAchievements];
  
  allAchievements.forEach(achievement => {
    if (!unlockedAchievements.includes(achievement.id) && achievement.condition(userData)) {
      newAchievements.push(achievement);
    }
  });
  
  return newAchievements;
};


// 替换现有的 autoBackup 函数
const autoBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}${timestamp}`;
    
    // ✅ 修复：包含所有关键数据
    const backupData = {
      tasks: await loadMainData('tasks') || {},
      templates: await loadMainData('templates') || [],
      pointHistory: await loadMainData('pointHistory') || [],
      exchange: await loadMainData('exchange') || [],
      customAchievements: await loadMainData('customAchievements') || [],
      unlockedAchievements: await loadMainData('unlockedAchievements') || [],
      categories: await loadMainData('categories') || baseCategories,
      backupTime: new Date().toISOString(),
      version: '1.1' // 更新版本号
    };
    
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    console.log('💾 完整备份创建成功:', backupKey);
    await cleanupOldBackups();
    
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





// 替换现有的 restoreBackup 函数
const restoreBackup = async (backupKey) => {
  try {
    const backupData = JSON.parse(localStorage.getItem(backupKey));
    if (!backupData) {
      alert('备份文件不存在');
      return;
    }

    if (window.confirm('确定要恢复此备份吗？当前数据将被覆盖。')) {
      console.log('🔄 开始恢复备份...');
      
      // 保存所有关键数据到 localStorage
      await saveMainData('tasks', backupData.tasks || {});
      await saveMainData('templates', backupData.templates || []);
      await saveMainData('pointHistory', backupData.pointHistory || []);
      await saveMainData('exchange', backupData.exchange || []);
      
      // ✅ 修复：添加缺失的数据恢复
      await saveMainData('customAchievements', backupData.customAchievements || []);
      await saveMainData('unlockedAchievements', backupData.unlockedAchievements || []);
      await saveMainData('categories', backupData.categories || baseCategories);
      
      console.log('✅ 所有数据已保存到 localStorage');
      
      // 添加短暂延迟确保数据写入完成
      setTimeout(() => {
        alert('备份恢复成功！页面将重新加载。');
        window.location.reload();
      }, 500);
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
    const keys = ['tasks', 'templates', 'pointHistory', 'exchange', 'customAchievements', 'unlockedAchievements', 'categories'];
    keys.forEach(key => {
      const storageKey = `${STORAGE_KEY}_${key}`;
      const data = localStorage.getItem(storageKey);
      console.log(`${key}:`, data ? `✅ 有数据 (${data.length} 字符)` : '❌ 无数据');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const size = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          console.log(`  内容大小: ${size} 项`);
        } catch (e) {
          console.log(`  解析错误:`, e);
        }
      }
    });
    
    // ==== 增强：显示备份信息 ====
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.includes(AUTO_BACKUP_CONFIG.backupPrefix));
    console.log(`备份文件: ${backupKeys.length} 个`);
    backupKeys.forEach(key => {
      try {
        const backup = JSON.parse(localStorage.getItem(key));
        console.log(`  ${key} - 版本: ${backup?.version || '1.0'} - 任务: ${Object.keys(backup?.tasks || {}).length}天`);
      } catch (e) {
        console.log(`  ${key} - 损坏的备份`);
      }
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
      console.log(`   版本: ${backup.version || '1.0'}`);
      console.log(`   成就数据: ${backup.hasAchievements ? '✅ 有' : '❌ 无'}`);
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
  
  // 修复缺失数据
  fixMissingData: async () => {
    console.log('🔧 开始修复缺失数据...');
    
    // 检查并修复所有关键数据
    const keys = ['customAchievements', 'unlockedAchievements', 'categories'];
    let fixedCount = 0;
    
    for (const key of keys) {
      const data = await loadMainData(key);
      if (data === null) {
        console.log(`⚠️ ${key} 数据缺失，重新初始化...`);
        const fallback = key === 'categories' ? baseCategories : [];
        await saveMainData(key, fallback);
        fixedCount++;
      }
    }
    
    console.log(`✅ 修复完成，共修复 ${fixedCount} 个数据项`);
    alert(`数据修复完成，修复了 ${fixedCount} 个缺失的数据项`);
  },  // 这里需要逗号
  
  // 清除所有数据
  clearAll: () => {
    if (window.confirm('确定要清除所有数据吗？')) {
      const keys = ['tasks', 'templates', 'pointHistory', 'exchange', 'customAchievements', 'unlockedAchievements', 'categories'];
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

// 修复：正确的周一计算
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
  
  // 计算到本周一的差值
  // 如果是周日(0)，需要往前推6天；如果是周一(1)，差值为0；以此类推
  const diff = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  console.log('📅 计算周一:', {
    输入日期: date.toDateString(),
    星期: ['日','一','二','三','四','五','六'][day],
    差值: diff,
    输出周一: monday.toDateString()
  });
  
  return monday;
};







// 修复：生成周一到周日的日期
const getWeekDates = (monday) => {
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
      
      weekDates.push({
        date: `${year}-${month}-${day}`,
        label: `周${weekDays[i]}`,
        fullLabel: `周${weekDays[i]} (${month}/${day})`
      });
    }
    
    console.log('📅 生成周日期:', weekDates.map(d => d.date));
    return weekDates;
  };
  




  const SchedulePage = ({ tasksByDate, currentMonday, onClose, formatTimeNoSeconds }) => {
    const weekDates = getWeekDates(currentMonday);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    
  
    
    const calculateTimeSlots = () => {
      const timeSlots = [];
      for (let hour = 6; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }
      return timeSlots;
    };
  
    const timeSlots = calculateTimeSlots();
  
    const getTaskTimeInfo = (task, date) => {
      if (!task) return null;
  
      if (task.scheduledTime) {
        const [startTime, endTime] = task.scheduledTime.split('-');
        return { startTime, endTime, type: 'scheduled' };
      }
  
      if (task.timeSegments && task.timeSegments.length > 0) {
        const dateSegments = task.timeSegments.filter(segment => {
          if (segment.startTime) {
            const localDate = new Date(segment.startTime);
            const segmentDate = localDate.toISOString().split('T')[0];
            return segmentDate === date;
          }
          return false;
        });
  
        if (dateSegments.length > 0) {
          const segment = dateSegments[0];
          if (segment.startTime && segment.endTime) {
            const startTimeLocal = new Date(segment.startTime);
            const endTimeLocal = new Date(segment.endTime);
            
            const startTime = `${startTimeLocal.getHours().toString().padStart(2, '0')}:${startTimeLocal.getMinutes().toString().padStart(2, '0')}`;
            const endTime = `${endTimeLocal.getHours().toString().padStart(2, '0')}:${endTimeLocal.getMinutes().toString().padStart(2, '0')}`;
            
            return { startTime, endTime, type: 'actual' };
          }
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
    
    const getTasksForTimeSlot = (time, dayIndex) => {
      const date = weekDates[dayIndex].date;
      const dayTasks = tasksByDate[date] || [];
  
      return dayTasks.filter(task => {
        const timeInfo = getTaskTimeInfo(task, date);
        if (!timeInfo) return false;
  
        if (timeInfo.type === 'actual') {
          const [timeHour, timeMinute] = time.split(':').map(Number);
          const [startHour, startMinute] = timeInfo.startTime.split(':').map(Number);
          
          const timeValue = timeHour * 60 + timeMinute;
          const startValue = startHour * 60 + startMinute;
          
          const timeSlotDuration = 30;
          const isAtStartTime = timeValue >= startValue && timeValue < startValue + timeSlotDuration;
          
          if (isAtStartTime) {
            return true;
          }
        }
  
        return isTimeInRange(time, timeInfo.startTime, timeInfo.endTime);
      });
    };
  
    const getTaskStyle = (task, timeInfo) => {
      const baseStyle = {
        padding: '2px 3px',
        margin: '1px 0',
        borderRadius: '2px',
        fontSize: '10px',
        color: 'white',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        lineHeight: '1.1'
      };
  
      const category = baseCategories.find(cat => cat.name === task.category);
      const categoryColor = category ? category.color : '#666';
  
      if (timeInfo.type === 'scheduled') {
        return {
          ...baseStyle,
          backgroundColor: task.done ? '#4CAF50' : categoryColor,
          border: task.done ? '1px solid #45a049' : `1px solid ${categoryColor}`
        };
      } else {
        const [startHour, startMinute] = timeInfo.startTime.split(':').map(Number);
        const [endHour, endMinute] = timeInfo.endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        
        if (duration < 30) {
          return {
            ...baseStyle,
            backgroundColor: categoryColor,
            border: `1px solid ${categoryColor}`,
            height: '8px',
            minHeight: '8px',
            fontSize: '8px',
            padding: '1px 2px',
            lineHeight: '1'
          };
        } else {
          return {
            ...baseStyle,
            backgroundColor: categoryColor,
            border: `1px solid ${categoryColor}`
          };
        }
      }
    };
  
    // 固定时间槽高度
    const slotHeight = 25;
  
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: '10px',
        fontFamily: 'sans-serif',
        backgroundColor: '#f5faff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 头部 - 固定高度 */}
        <div style={{
          flexShrink: 0,
          marginBottom: '10px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ⬅️
            </button>
            <h1 style={{
              textAlign: 'center',
              color: '#1a73e8',
              fontSize: '16px',
              margin: 0
            }}>
              📅 本周时间表
            </h1>
            <div style={{ width: '30px' }}></div>
          </div>
  
          {/* 简化的图例 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#FF9800', borderRadius: '1px' }}></div>
              <span>计划</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#4CAF50', borderRadius: '1px' }}></div>
              <span>完成</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#2196F3', borderRadius: '1px' }}></div>
              <span>实际</span>
            </div>
          </div>
        </div>
  
        {/* 时间表主体 - 占据剩余空间 */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 表头 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px repeat(7, 1fr)',
            backgroundColor: '#1a73e8',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '11px',
            flexShrink: 0
          }}>
            <div style={{ 
              padding: '6px 2px', 
              textAlign: 'center', 
              borderRight: '1px solid #0b52b0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              时间
            </div>
            {weekDates.map((day, index) => (
              <div
                key={day.date}
                style={{
                  padding: '6px 1px',
                  textAlign: 'center',
                  borderRight: index < 6 ? '1px solid #0b52b0' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '1px'
                }}
              >
                <div>{day.label}</div>
                <div style={{ fontSize: '9px', opacity: 0.9 }}>
                  {day.date.slice(5)}
                </div>
              </div>
            ))}
          </div>
  
          {/* 时间表内容 - 可滚动区域 */}
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 200px)'
          }}>
            {timeSlots.map((time, timeIndex) => (
              <div
                key={time}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px repeat(7, 1fr)',
                  borderBottom: timeIndex < timeSlots.length - 1 ? '1px solid #f0f0f0' : 'none',
                  backgroundColor: timeIndex % 2 === 0 ? '#fafafa' : 'white',
                  height: `${slotHeight}px`,
                  minHeight: `${slotHeight}px`
                }}
              >
                {/* 时间列 - 固定位置 */}
                <div style={{
                  padding: '2px',
                  textAlign: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#666',
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: timeIndex % 2 === 0 ? '#f5f5f5' : 'white',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1
                }}>
                  {time}
                </div>
  
                {/* 日期列 */}
                {weekDates.map((day, dayIndex) => {
                  const tasks = getTasksForTimeSlot(time, dayIndex);
                  return (
                    <div
                      key={day.date}
                      style={{
                        padding: '1px',
                        borderRight: dayIndex < 6 ? '1px solid #e0e0e0' : 'none',
                        backgroundColor: timeIndex % 2 === 0 ? '#fafafa' : 'white',
                        cursor: tasks.length > 0 ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px',
                        height: '100%'
                      }}
                      onClick={() => {
                        if (tasks.length > 0) {
                          setSelectedTimeSlot({
                            time,
                            date: day.date,
                            dateLabel: day.fullLabel,
                            tasks: tasks
                          });
                        }
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
                            {task.text.length > 6 ? task.text.substring(0, 6) + '...' : task.text}
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
  
        {/* 底部统计 - 固定高度 */}
        <div style={{
          flexShrink: 0,
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0',
          fontSize: '11px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
            <div><strong>计划任务:</strong> {
              weekDates.reduce((total, day) => {
                const dayTasks = tasksByDate[day.date] || [];
                return total + dayTasks.filter(task => task.scheduledTime).length;
              }, 0)
            }</div>
            <div><strong>已完成:</strong> {
              weekDates.reduce((total, day) => {
                const dayTasks = tasksByDate[day.date] || [];
                return total + dayTasks.filter(task => task.done).length;
              }, 0)
            }</div>
          </div>
        </div>
  
        {/* 时间线详情弹窗 */}
        {selectedTimeSlot && (
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
          }} onClick={() => setSelectedTimeSlot(null)}>
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              width: '95%',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'auto'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#1a73e8' }}>
                ⏱️ 时间段详情
              </h3>
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {selectedTimeSlot.dateLabel} {selectedTimeSlot.time}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  共 {selectedTimeSlot.tasks.length} 个任务
                </div>
              </div>
  
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {selectedTimeSlot.tasks.map((task, index) => {
                  const timeInfo = getTaskTimeInfo(task, selectedTimeSlot.date);
                  return (
                    <div key={index} style={{
                      padding: '8px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        {task.text}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        📚 {task.category}
                      </div>
                      {timeInfo && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          🕐 {timeInfo.startTime} - {timeInfo.endTime}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
  
              <button
                onClick={() => setSelectedTimeSlot(null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '10px',
                  backgroundColor: '#1a73e8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        )}
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
  const [frequency, setFrequency] = useState(config.frequency|| '');
  const [days, setDays] = useState([...config.days]);



  // 修复：确保至少选择一天
  const handleSave = () => {
    if (frequency === 'weekly' && !days.some(day => day)) {
      alert('请至少选择一天！');
      return;
    }
    
    onSave({ frequency, days });
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
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 350
      }} onClick={e => e.stopPropagation()}>
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
             {/* 添加不重复选项 */}
            <button
              style={{
                flex: 1,
                padding: 10,
                background: !frequency ? '#1a73e8' : '#f0f0f0',
                color: !frequency ? '#fff' : '#000',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
              onClick={() => setFrequency('')}
            >
              不重复
            </button>
          </div>
        </div>

      {/* 星期选择 */}
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
          cursor: frequency === 'daily' ? 'default' : 'pointer',
          opacity: frequency === 'daily' ? 0.5 : 1
        }}
        onClick={() => {
          if (frequency === 'weekly') {
            const newDays = [...days];
            newDays[index] = !newDays[index]; // 切换选中状态
            setDays(newDays);
          }
        }}
        disabled={frequency === 'daily'}
        title={frequency === 'daily' ? '每日重复时自动选择所有日期' : `周${day}`}
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
          lineHeight: 1.4,
          padding: 8,
          backgroundColor: '#f5f5f5',
          borderRadius: 4
        }}>
          {frequency === 'daily' 
            ? '任务将在未来7天重复创建' 
            : days.some(day => day) 
              ? `已选择：${days.map((selected, idx) => selected ? `周${['一','二','三','四','五','六','日'][idx]}` : '').filter(Boolean).join('、')}`
              : '请选择重复的星期'
          }
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
              cursor: (frequency === 'weekly' && !days.some(day => day)) ? 'not-allowed' : 'pointer',
              opacity: (frequency === 'weekly' && !days.some(day => day)) ? 0.5 : 1
            }}
            onClick={handleSave}
            disabled={frequency === 'weekly' && !days.some(day => day)}
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


const TemplateModal = ({ templates, onSave, onClose, onDelete, categories = baseCategories }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState(baseCategories[0].name);
  const [templateContent, setTemplateContent] = useState('');
  const [templateTags, setTemplateTags] = useState([]);
  const [templateScheduledTime, setTemplateScheduledTime] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#e0e0e0');
  const [templateSubCategory, setTemplateSubCategory] = useState('');
  const [templateProgress, setTemplateProgress] = useState({
    initial: 0,
    current: 0,
    target: 0,
    unit: "%"
  });
  const [repeatFrequency, setRepeatFrequency] = useState('');
  const [repeatDays, setRepeatDays] = useState([false, false, false, false, false, false, false]);
  const [templateImage, setTemplateImage] = useState(null);

  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (templateName.trim() === '' || templateContent.trim() === '') {
      alert('模板名称和任务内容不能为空！');
      return;
    }

    const newTemplate = {
      name: templateName.trim(),
      category: templateCategory,
      content: templateContent.trim(),
      subCategory: templateSubCategory,
      tags: templateTags || [],
      scheduledTime: templateScheduledTime,
      progress: templateProgress,
      repeatFrequency: repeatFrequency,
      repeatDays: repeatDays,
      image: templateImage,
      // 模板特有的字段
      isTemplate: true,
      templateId: Date.now().toString()
    };

    onSave(newTemplate);
    
    // 重置表单
    setTemplateName('');
    setTemplateContent('');
    setTemplateTags([]);
    setTemplateScheduledTime('');
    setTemplateSubCategory('');
    setTemplateProgress({
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    });
    setRepeatFrequency('');
    setRepeatDays([false, false, false, false, false, false, false]);
    setTemplateImage(null);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setTemplateImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = () => {
    setTemplateImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (index) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      onDelete(index);
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
            任务模板
          </h3>

          {/* 右上角按钮组 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* 添加图片按钮 */}
            <button
              onClick={handleImageClick}
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                backgroundColor: '#f8f9fa',
                color: '#666',
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "16px",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
                height: '32px',
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

          {/* 模板图片预览 */}
          {templateImage && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>
                模板图片预览
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={templateImage}
                  alt="模板预览"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '150px',
                    borderRadius: 8,
                    border: '2px solid #e0e0e0'
                  }}
                />
                <button
                  onClick={handleDeleteImage}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    background: 'rgba(255,255,255,0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#ff4444'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 模板名称 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              📝 模板名称
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="请输入模板名称..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#fafafa',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a73e8';
                e.target.style.backgroundColor = '#fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.backgroundColor = '#fafafa';
              }}
            />
          </div>

          {/* 任务内容 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14
            }}>
              📄 任务内容
            </label>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              placeholder="请输入任务内容..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#fafafa',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                height: templateContent && templateContent.split('\n').length > 1 ? 'auto' : '44px',
                minHeight: '44px',
                resize: templateContent && templateContent.split('\n').length > 1 ? 'vertical' : 'none',
                outline: 'none',
                lineHeight: '1.4',
                overflow: 'hidden'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a73e8';
                e.target.style.backgroundColor = '#fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.backgroundColor = '#fafafa';
              }}
            />
          </div>

          {/* 类别和子类别在同一行 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            alignItems: 'start',
            marginBottom: 12,
          }}>
            {/* 任务类别 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
                color: '#333',
                fontSize: 14,
              }}>
                类别
              </label>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={templateCategory}
                  onChange={(e) => {
                    setTemplateCategory(e.target.value);
                    setTemplateSubCategory('');
                  }}
                  style={{
                    flex: 1,
                    height: 36,
                    padding: '0 10px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

         
{/* 子类别选择 */}
<div>
  <label style={{
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    color: '#333',
    fontSize: 14,
  }}>
    子类别
  </label>

  <select
  value={templateSubCategory || ''}
  onChange={(e) => setTemplateSubCategory(e.target.value)}
  style={{
    width: '100%',
    height: 36,
    padding: '0 10px',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxSizing: 'border-box',
  }}
>
     <option value="">选择子类别（可选）</option>
    {categories
      .find((cat) => cat.name === templateCategory)
      ?.subCategories?.map((subCat) => (
        <option key={subCat} value={subCat}>
          {subCat}
        </option>
      ))}
  </select>
</div>



          </div>

          {/* 标签编辑 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 12,
          }}>
            {/* 添加新标签 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontWeight: 600,
                color: '#333',
                fontSize: 13,
              }}>
                添加标签
              </label>

              <div style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}>
                <input
                  type="text"
                  placeholder="标签名称"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  style={{
                    flex: 1,
                    height: 32,
                    padding: '0 8px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                    minWidth: 0,
                  }}
                />

                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (newTagName?.trim()) {
                      const newTag = {
                        name: newTagName.trim(),
                        color: newTagColor || '#e0e0e0',
                        textColor: '#333',
                      };
                      const updatedTags = [...(templateTags || []), newTag];
                      setTemplateTags(updatedTags);
                      setNewTagName('');
                      setNewTagColor('#e0e0e0');
                    }
                  }}
                  style={{
                    height: 32,
                    width: 32,
                    backgroundColor: '#f9f9f9',
                    color: '#333',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* 当前标签 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontWeight: 600,
                color: '#333',
                fontSize: 13,
              }}>
                当前标签
              </label>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                minHeight: 32,
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: 6,
                backgroundColor: '#fafafa',
                alignItems: 'center',
                boxSizing: 'border-box',
                maxHeight: 80,
                overflow: 'auto',
              }}>
                {templateTags?.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: 11,
                      padding: '3px 6px',
                      backgroundColor: tag.color,
                      color: tag.textColor || '#fff',
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      flexShrink: 0,
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = [...templateTags];
                        newTags.splice(index, 1);
                        setTemplateTags(newTags);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: 0,
                        width: 12,
                        height: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'inherit',
                        opacity: 0.8,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}

                {(!templateTags || templateTags.length === 0) && (
                  <span style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>
                    暂无标签
                  </span>
                )}
              </div>
            </div>
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
                    const existingTags = templateTags || [];
                    const isAlreadyAdded = existingTags.some(t => t.name === tag.name);
                    if (!isAlreadyAdded) {
                      setTemplateTags([...existingTags, tag]);
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

          {/* 重复设置 */}
          <div style={{ marginBottom: 15 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14,
            }}>
              🔄 重复设置
            </label>
            
            <div style={{ marginBottom: 10 }}>
              <div style={{ marginBottom: 6, fontWeight: '500', fontSize: 13 }}>重复频率:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: repeatFrequency === 'daily' ? '#1a73e8' : '#f0f0f0',
                    color: repeatFrequency === 'daily' ? '#fff' : '#000',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                  onClick={() => setRepeatFrequency('daily')}
                >
                  每天
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: repeatFrequency === 'weekly' ? '#1a73e8' : '#f0f0f0',
                    color: repeatFrequency === 'weekly' ? '#fff' : '#000',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                  onClick={() => setRepeatFrequency('weekly')}
                >
                  每周
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: !repeatFrequency ? '#1a73e8' : '#f0f0f0',
                    color: !repeatFrequency ? '#fff' : '#000',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                  onClick={() => setRepeatFrequency('')}
                >
                  不重复
                </button>
              </div>
            </div>

            {repeatFrequency === 'weekly' && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ marginBottom: 6, fontWeight: '500', fontSize: 13 }}>选择星期:</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: 4,
                  justifyContent: 'space-between',
                  overflowX: 'auto'
                }}>
                  {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: repeatDays?.[index] ? '#1a73e8' : '#f0f0f0',
                        color: repeatDays?.[index] ? '#fff' : '#000',
                        border: repeatDays?.[index] ? '2px solid #0b52b0' : '1px solid #e0e0e0',
                        fontSize: 12,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      onClick={() => {
                        const currentRepeatDays = repeatDays || [false, false, false, false, false, false, false];
                        const newRepeatDays = [...currentRepeatDays];
                        newRepeatDays[index] = !newRepeatDays[index];
                        setRepeatDays(newRepeatDays);
                      }}
                      title={`周${day}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {repeatFrequency && (
              <div style={{
                fontSize: 11,
                color: '#666',
                textAlign: 'center',
                padding: '6px 8px',
                backgroundColor: '#f5f5f5',
                borderRadius: 4
              }}>
                {repeatFrequency === 'daily' 
                  ? '任务将在未来7天重复创建' 
                  : repeatFrequency === 'weekly' && repeatDays?.some(day => day)
                    ? `已选择：${repeatDays?.map((selected, idx) => selected ? `周${['一','二','三','四','五','六','日'][idx]}` : '').filter(Boolean).join('、')}`
                    : '请选择重复的星期'
                }
              </div>
            )}
          </div>

          {/* 计划时间 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#333',
              fontSize: 14,
            }}>
              ⏰ 计划时间
            </label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
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
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
              <span style={{ color: '#666' }}>至</span>
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
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
          </div>

          {/* 进度跟踪 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 600,
              color: '#333',
              fontSize: 14,
            }}>
              📊 进度跟踪
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              alignItems: 'end',
            }}>
              {/* 初始值 */}
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>
                  初始值
                </div>
                <input
                  type="number"
                  value={templateProgress.initial || ''}
                  onChange={(e) => setTemplateProgress({
                    ...templateProgress,
                    initial: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 6px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    backgroundColor: '#fff'
                  }}
                />
              </div>

              {/* 当前值 */}
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>
                  当前值
                </div>
                <input
                  type="number"
                  value={templateProgress.current || ''}
                  onChange={(e) => setTemplateProgress({
                    ...templateProgress,
                    current: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 6px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    backgroundColor: '#fff'
                  }}
                />
              </div>

              {/* 目标值 */}
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>
                  目标值
                </div>
                <input
                  type="number"
                  value={templateProgress.target || ''}
                  onChange={(e) => setTemplateProgress({
                    ...templateProgress,
                    target: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 6px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    backgroundColor: '#fff'
                  }}
                />
              </div>

              {/* 单位 */}
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>
                  单位
                </div>
                <select
                  value={templateProgress.unit || '%'}
                  onChange={(e) => setTemplateProgress({
                    ...templateProgress,
                    unit: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 6px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 14,
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
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

        {/* 现有模板列表 */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{
            margin: '0 0 16px 0',
            color: '#333',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            现有模板 ({templates.length})
          </h4>

          {templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '13px',
              padding: '32px 16px',
              backgroundColor: '#f8f9fa',
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
                    border: `1px solid #e0e0e0`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: '#f8f9fa',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
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
                        color: '#333'
                      }}>
                        {template.name}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#1a73e8',
                        color: '#FFFFFF',
                        borderRadius: '4px'
                      }}>
                        {template.category}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px'
                    }}>
                      {template.content}
                    </div>
                    {/* 显示模板图片 */}
                    {template.image && (
                      <img
                        src={template.image}
                        alt="模板图片"
                        style={{
                          maxWidth: '50px',
                          maxHeight: '50px',
                          borderRadius: 4,
                          marginBottom: '4px'
                        }}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#666',
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
                      e.target.style.color = '#666';
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
const ActionMenuModal = ({ task, onClose, setShowCrossDateModal, onEditText, onEditNote, onEditReflection, onTogglePinned, onImageUpload, setShowDeleteModal,
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


const DatePickerModal = ({ onClose, onSelectDate, tasksByDate = {} }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 柔和颜色方案
  const softColors = {
    primary: '#8B9DC3',
    secondary: '#A8B5C1', 
    background: '#F8FAFD',
    surface: '#FFFFFF',
    border: '#E1E8ED',
    text: '#2C3E50',
    textLight: '#7F8C8D',
    today: '#3498DB',
    dotComplete: '#2ECC71',
    dotIncomplete: '#E74C3C',
    dotFuture: '#F39C12'
  };

  // 日期圆点组件
  const DateDot = ({ date, tasksByDate }) => {
    if (!tasksByDate) {
      return null;
    }

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayTasks = tasksByDate[dateStr] || [];

    const filteredTasks = dayTasks.filter(task => task.category !== "本周任务");
  
    if (filteredTasks.length === 0) return null;
    
   
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);
    
    const isFuture = taskDate > today;
    const allDone = filteredTasks.every(task => task.done)
    
    let dotColor = '';
    if (isFuture) {
      dotColor = softColors.dotFuture;
    } else if (allDone) {
      dotColor = softColors.dotComplete;
    } else {
      dotColor = softColors.dotIncomplete;
    }
    
    return (
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: dotColor,
        margin: '2px auto 0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }} />
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
  // 修改这里：让周一成为第一天
  let firstDayOfWeek = firstDayOfMonth.getDay();
  if (firstDayOfWeek === 0) {
    firstDayOfWeek = 6; // 如果是周日，显示在最后（向前推6天）
  } else {
    firstDayOfWeek = firstDayOfWeek - 1; // 其他日子减1
  }

  const daysInMonth = [];
  const totalDays = lastDayOfMonth.getDate();

  for (let i = 0; i < firstDayOfWeek; i++) {
    daysInMonth.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    daysInMonth.push(i);
  }

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: softColors.surface,
        padding: '20px',
        borderRadius: '16px',
        width: '380px', // 固定宽度
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: `1px solid ${softColors.border}`
      }}>
        {/* 月份导航 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: softColors.background,
          borderRadius: '12px',
          border: `1px solid ${softColors.border}`
        }}>
          <button 
            onClick={prevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: softColors.primary,
              padding: '8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(139, 157, 195, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ◀
          </button>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '16px',
            color: softColors.text 
          }}>
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </span>
          <button 
            onClick={nextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: softColors.primary,
              padding: '8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(139, 157, 195, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ▶
          </button>
        </div>

        {/* 图例说明 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '10px 12px',
          backgroundColor: softColors.background,
          borderRadius: '10px',
          border: `1px solid ${softColors.border}`,
          fontSize: '10px',
          color: softColors.textLight
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: softColors.dotComplete }} />
            <span>全部完成</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: softColors.dotIncomplete }} />
            <span>未完成</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: softColors.dotFuture }} />
            <span>未来任务</span>
          </div>
        </div>

        {/* 星期标题 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 12
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: softColors.textLight,
              padding: '8px 2px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          marginBottom: '16px'
        }}>
          {daysInMonth.map((day, index) => {
            if (!day) return <div key={index} style={{ minHeight: '44px' }} />;
            
            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            
            return (
              <button
                key={index}
                onClick={() => {
                  const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  onSelectDate(selectedDate);
                }}
                style={{
                  padding: '8px 2px',
                  border: `1px solid ${softColors.border}`,
                  borderRadius: '8px',
                  background: isToday(day) ? softColors.today : softColors.background,
                  color: isToday(day) ? '#FFFFFF' : softColors.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  minHeight: '44px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isToday(day)) {
                    e.target.style.background = '#E8F4FD';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isToday(day)) {
                    e.target.style.background = isToday(day) ? softColors.today : softColors.background;
                  }
                }}
              >
                {day}
                <DateDot date={cellDate} tasksByDate={tasksByDate} />
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: softColors.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#7A8FB5';
          }}
          onMouseOut={(e) => {
            e.target.style.background = softColors.primary;
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





// 任务迁移模态框组件
const TaskMoveModal = ({ task, onClose, onMove, categories, tasksByDate }) => {
  const [moveOption, setMoveOption] = useState('single'); // 'single' 或 'category'
  const [targetDate, setTargetDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(task.category);

  // 生成未来7天的日期选项
  const getDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = `${date.getMonth() + 1}月${date.getDate()}日`;
      
      options.push({
        value: dateStr,
        label: i === 0 ? `今天 (${formattedDate})` : 
               i === 1 ? `明天 (${formattedDate})` : formattedDate
      });
    }
    return options;
  };

  const handleMove = () => {
    if (!targetDate) {
      alert('请选择目标日期');
      return;
    }

    onMove(task, targetDate, moveOption, selectedCategory);
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
        maxWidth: 400
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
          📅 迁移任务
        </h3>

        {/* 迁移选项 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>迁移方式:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={moveOption === 'single'}
                onChange={() => setMoveOption('single')}
              />
              <span>仅迁移此任务</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={moveOption === 'category'}
                onChange={() => setMoveOption('category')}
              />
              <span>迁移整个分类</span>
            </label>
          </div>
        </div>

        {/* 分类选择（仅当选择迁移整个分类时显示） */}
        {moveOption === 'category' && (
          <div style={{ marginBottom: 15 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>选择分类:</div>
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
              {baseCategories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 目标日期选择 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>目标日期:</div>
          <select
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14
            }}
          >
            <option value="">请选择日期</option>
            {getDateOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 说明文字 */}
        <div style={{
          fontSize: 12,
          color: '#666',
          marginBottom: 15,
          padding: 8,
          backgroundColor: '#f5f5f5',
          borderRadius: 4
        }}>
          {moveOption === 'single' 
            ? '仅将当前任务移动到目标日期'
            : `将 "${selectedCategory}" 分类的所有任务移动到目标日期`
          }
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
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={handleMove}
          >
            确认迁移
          </button>
        </div>
      </div>
    </div>
  );
};

// 任务编辑模态框
const TaskEditModal = ({ task, categories, setShowCrossDateModal,setShowMoveTaskModal, onClose, onSave, onTogglePinned, onImageUpload, setShowDeleteModal }) => {
  const [editData, setEditData] = useState({
    text: task.text || '',
    category: task.category || categories[0].name,
    subCategory: task.subCategory || '', // 新增子类别字段
    note: task.note || '',
    reflection: task.reflection || '',
    
    scheduledTime: task.scheduledTime || '',
    tags: task.tags || [],
    reminderYear: task.reminderTime?.year || '',
    reminderMonth: task.reminderTime?.month || '',
    reminderDay: task.reminderTime?.day || '',
    reminderHour: task.reminderTime?.hour || '',
     repeatFrequency: task.repeatFrequency || '', // 'daily', 'weekly', or ''
  repeatDays: task.repeatDays || [false, false, false, false, false, false, false],
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
  subCategory: editData.subCategory || '',
  subTasks: editData.subTasks || [],
  reminderTime: Object.keys(reminderTime).length > 0 ? reminderTime : null,
  scheduledTime: scheduledTime,
  // 确保重复设置被保存
  repeatFrequency: editData.repeatFrequency || '',
  repeatDays: editData.repeatDays || [false, false, false, false, false, false, false]
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
            编辑
          </h3>

          {/* 右上角按钮组 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
           

          <button
    onClick={() => {
      onClose();
      setTimeout(() => {
        setShowCrossDateModal(task);
      }, 100);
    }}
    style={{
      width: '32px',
      height: '32px',
      padding: 0,
      backgroundColor: '#f8f9fa',
      color: '#666',
      border: "1px solid #e0e0e0",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: "16px",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}
    title="跨日期显示"
  >
    📅
  </button>
  {/* 迁移按钮 */}
  <button
    onClick={() => {
      onClose();
      setTimeout(() => {
        setShowMoveTaskModal(task);
      }, 100);
    }}
    style={{
      width: '32px',
      height: '32px',
      padding: 0,
      backgroundColor: '#f8f9fa', // 改为灰色背景
      color: '#666', // 改为灰色文字
      border: "1px solid #e0e0e0",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: "16px",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}
    title="迁移任务"
  >
    📤
  </button>
            <button
              onClick={() => {
                onTogglePinned(task);
                setEditData({ ...editData, pinned: !editData.pinned });
              }}
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
    style={{
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e0e0',
      borderRadius: 8,
      fontSize: 14,
      backgroundColor: '#fafafa',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      height: '44px', // 默认固定高度
      minHeight: '44px',
      resize: 'vertical', // 始终允许垂直调整
      outline: 'none',
      lineHeight: '1.4',
      overflow: 'auto' // 改为 auto 而不是 hidden
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#1a73e8';
      e.target.style.backgroundColor = '#fff';
      // 聚焦时自动调整高度
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#e0e0e0';
      e.target.style.backgroundColor = '#fafafa';
      // 失焦时如果内容只有一行，恢复固定高度
      if (editData.text.split('\n').length <= 1) {
        e.target.style.height = '44px';
      }
    }}
    onInput={(e) => {
      // 输入时自动调整高度
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
  />
</div>


{/* 备注 */}
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
    style={{
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e0e0',
      borderRadius: 8,
      fontSize: 14,
      backgroundColor: '#fafafa',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      height: '44px', // 默认固定高度
      minHeight: '44px',
      resize: 'vertical',
      outline: 'none',
      lineHeight: '1.4',
      overflow: 'auto'
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#1a73e8';
      e.target.style.backgroundColor = '#fff';
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#e0e0e0';
      e.target.style.backgroundColor = '#fafafa';
      if (editData.note.split('\n').length <= 1) {
        e.target.style.height = '44px';
      }
    }}
    onInput={(e) => {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
  />
</div>

{/* 感想 */}
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
    style={{
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e0e0',
      borderRadius: 8,
      fontSize: 14,
      backgroundColor: '#fff9c4',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      height: '44px', // 默认固定高度
      minHeight: '44px',
      resize: 'vertical',
      outline: 'none',
      lineHeight: '1.4',
      overflow: 'auto'
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#1a73e8';
      e.target.style.backgroundColor = '#fff';
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#e0e0e0';
      e.target.style.backgroundColor = '#fff9c4';
      if (editData.reflection.split('\n').length <= 1) {
        e.target.style.height = '44px';
      }
    }}
    onInput={(e) => {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
  />
</div>







{/* 类别和子类别在同一行 */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    alignItems: 'start',
    marginBottom: 12,
  }}
>
  {/* 任务类别 */}
  <div>
    <label
      style={{
        display: 'block',
        marginBottom: 8,
        fontWeight: 600,
        color: '#333',
        fontSize: 14,
      }}
    >
      类别
    </label>

    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        value={editData.category}
        onChange={(e) =>
          setEditData({
            ...editData,
            category: e.target.value,
            subCategory: '', // 切换类别时清空子类别
          })
        }
        style={{
          flex: 1,
          height: 36,
          padding: '0 10px',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 14,
          backgroundColor: '#fff',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        {baseCategories.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => {
          const newCategory = window.prompt('输入新类别名称:');
          if (newCategory && newCategory.trim()) {
            alert(`新类别 "${newCategory}" 需要修改代码添加`);
          }
        }}
        style={{
          height: 36,
          width: 36,
          backgroundColor: '#f9f9f9',
          color: '#333',
          border: '1px solid #ccc',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 18,
          fontWeight: 600,
          lineHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
        title="添加新类别"
      >
        +
      </button>
    </div>
  </div>

  {/* 子类别选择 */}
  <div>
    <label
      style={{
        display: 'block',
        marginBottom: 8,
        fontWeight: 600,
        color: '#333',
        fontSize: 14,
      }}
    >
      子类别
    </label>

    <select
      value={editData.subCategory || ''}
      onChange={(e) =>
        setEditData({ ...editData, subCategory: e.target.value })
      }
      style={{
        width: '100%',
        height: 36,
        padding: '0 10px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        backgroundColor: '#fff',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      <option value="">选择子类别（可选）</option>
      {categories
        .find((c) => c.name === editData.category)
        ?.subCategories?.map((subCat) => (
          <option key={subCat} value={subCat}>
            {subCat}
          </option>
        ))}
    </select>
  </div>
</div>









{/* 编辑任务界面  添加标签  当前标签 */}
<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  }}
>
  {/* 添加新标签 */}
  <div>
    <label
      style={{
        display: 'block',
        marginBottom: 6,
        fontWeight: 600,
        color: '#333',
        fontSize: 13,
      }}
    >
      添加标签
    </label>

    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}
    >
      {/* 标签名称输入框 */}
      <input
        type="text"
        placeholder="标签名称"
        value={editData.newTagName || ''}
        onChange={(e) =>
          setEditData({ ...editData, newTagName: e.target.value })
        }
        style={{
          flex: 1,
          height: 32,
          padding: '0 8px',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 13,
          backgroundColor: '#fff',
          boxSizing: 'border-box',
          minWidth: 0, // 防止输入框溢出
        }}
      />

      {/* 颜色选择器（正方形） */}
      <input
        type="color"
        value={editData.newTagColor || '#e0e0e0'}
        onChange={(e) =>
          setEditData({ ...editData, newTagColor: e.target.value })
        }
        style={{
          width: 32,
          height: 32,
          padding: 0,
          border: '1px solid #ccc',
          borderRadius: 6,
          cursor: 'pointer',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      />

      {/* 添加按钮（仅 +） */}
      <button
        type="button"
        onClick={() => {
          if (editData.newTagName?.trim()) {
            const newTag = {
              name: editData.newTagName.trim(),
              color: editData.newTagColor || '#e0e0e0',
              textColor: '#333',
            };
            const updatedTags = [...(editData.tags || []), newTag];
            setEditData({
              ...editData,
              tags: updatedTags,
              newTagName: '',
              newTagColor: '#e0e0e0',
            });
          }
        }}
        style={{
          height: 32,
          width: 32,
          backgroundColor: '#f9f9f9',
          color: '#333',
          border: '1px solid #ccc',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  </div>

  {/* 当前标签 */}
  <div>
    <label
      style={{
        display: 'block',
        marginBottom: 6,
        fontWeight: 600,
        color: '#333',
        fontSize: 13,
      }}
    >
      当前标签
    </label>

    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        minHeight: 32,
        padding: '6px 8px',
        border: '1px solid #ccc',
        borderRadius: 6,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        boxSizing: 'border-box',
        maxHeight: 80,
        overflow: 'auto',
      }}
    >
      {editData.tags?.map((tag, index) => (
        <span
          key={index}
          style={{
            fontSize: 11,
            padding: '3px 6px',
            backgroundColor: tag.color,
            color: tag.textColor || '#fff',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            flexShrink: 0,
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
              fontSize: 11,
              padding: 0,
              width: 12,
              height: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'inherit',
              opacity: 0.8,
            }}
          >
            ×
          </button>
        </span>
      ))}

      {(!editData.tags || editData.tags.length === 0) && (
        <span style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>
          暂无标签
        </span>
      )}
    </div>
  </div>
</div>







{/* 常用标签保持原样 */}
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


{/* 重复设置 */}
<div style={{ marginBottom: 15 }}>
  <label style={{
    display: 'block',
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  }}>
    🔄 重复设置
  </label>
  
  {/* 重复频率选择 */}
  <div style={{ marginBottom: 10 }}>
    <div style={{ marginBottom: 6, fontWeight: '500', fontSize: 13 }}>重复频率:</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        style={{
          flex: 1,
          padding: '8px 12px',
          background: editData.repeatFrequency === 'daily' ? '#1a73e8' : '#f0f0f0',
          color: editData.repeatFrequency === 'daily' ? '#fff' : '#000',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          cursor: 'pointer'
        }}
        onClick={() => setEditData({ ...editData, repeatFrequency: 'daily' })}
      >
        每天
      </button>
      <button
        type="button"
        style={{
          flex: 1,
          padding: '8px 12px',
          background: editData.repeatFrequency === 'weekly' ? '#1a73e8' : '#f0f0f0',
          color: editData.repeatFrequency === 'weekly' ? '#fff' : '#000',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          cursor: 'pointer'
        }}
        onClick={() => setEditData({ ...editData, repeatFrequency: 'weekly' })}
      >
        每周
      </button>
      <button
        type="button"
        style={{
          flex: 1,
          padding: '8px 12px',
          background: !editData.repeatFrequency ? '#1a73e8' : '#f0f0f0',
          color: !editData.repeatFrequency ? '#fff' : '#000',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          cursor: 'pointer'
        }}
        onClick={() => setEditData({ ...editData, repeatFrequency: '' })}
      >
        不重复
      </button>
    </div>
  </div>

{/* 星期选择（仅在每周重复时显示） */}
{/* 星期选择（仅在每周重复时显示） */}
{editData.repeatFrequency === 'weekly' && (
  <div style={{ marginBottom: 10 }}>
    <div style={{ marginBottom: 6, fontWeight: '500', fontSize: 13 }}>选择星期:</div>
    <div style={{
      display: 'flex',
      flexWrap: 'nowrap', // 改为不换行
      gap: 4, // 缩小间距
      justifyContent: 'space-between', // 水平均匀分布
      overflowX: 'auto' // 允许水平滚动
    }}>
      {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
        <button
          key={day}
          type="button"
          style={{
            width: 32, // 稍微缩小宽度
            height: 32, // 稍微缩小高度
            borderRadius: '50%',
            background: editData.repeatDays?.[index] ? '#1a73e8' : '#f0f0f0',
            color: editData.repeatDays?.[index] ? '#fff' : '#000',
            border: editData.repeatDays?.[index] ? '2px solid #0b52b0' : '1px solid #e0e0e0',
            fontSize: 12,
            cursor: 'pointer',
            flexShrink: 0 // 防止按钮被压缩
          }}
          onClick={() => {
            // 修复：确保 repeatDays 数组存在
            const currentRepeatDays = editData.repeatDays || [false, false, false, false, false, false, false];
            const newRepeatDays = [...currentRepeatDays];
            newRepeatDays[index] = !newRepeatDays[index];
            setEditData({ 
              ...editData, 
              repeatDays: newRepeatDays 
            });
          }}
          title={`周${day}`}
        >
          {day} {/* 只显示数字，去掉"周"字 */}
        </button>
      ))}
    </div>
  </div>
)}

  {/* 重复说明 */}
  {editData.repeatFrequency && (
    <div style={{
      fontSize: 11,
      color: '#666',
      textAlign: 'center',
      padding: '6px 8px',
      backgroundColor: '#f5f5f5',
      borderRadius: 4
    }}>
      {editData.repeatFrequency === 'daily' 
        ? '任务将在未来7天重复创建' 
        : editData.repeatFrequency === 'weekly' && editData.repeatDays?.some(day => day)
          ? `已选择：${editData.repeatDays?.map((selected, idx) => selected ? `周${['一','二','三','四','五','六','日'][idx]}` : '').filter(Boolean).join('、')}`
          : '请选择重复的星期'
      }
    </div>
  )}
</div>



{/* 🕓 计划时间 */}
<div>
  <label
    style={{
      display: 'block',
      marginBottom: 8,
      fontWeight: 600,
      color: '#333',
      fontSize: 14,
    }}
  >
    ⏰ 计划时间
  </label>

  <div
    style={{
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'nowrap',
    }}
  >
    {/* 年 */}
    <input
      type="number"
      min="2024"
      max="2030"
      placeholder="2025"
      value={editData.planYear || ''}
      onChange={(e) =>
        setEditData({ ...editData, planYear: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}>/</span>

    {/* 月 */}
    <input
      type="number"
      min="1"
      max="12"
      placeholder="MM"
      value={editData.planMonth || ''}
      onChange={(e) =>
        setEditData({ ...editData, planMonth: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}>/</span>

    {/* 日 */}
    <input
      type="number"
      min="1"
      max="31"
      placeholder="DD"
      value={editData.planDay || ''}
      onChange={(e) =>
        setEditData({ ...editData, planDay: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}> </span>

    {/* 时 */}
    <input
      type="number"
      min="0"
      max="23"
      placeholder="HH"
      value={editData.planHour || ''}
      onChange={(e) =>
        setEditData({ ...editData, planHour: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}>:</span>

    {/* 分 */}
    <input
      type="number"
      min="0"
      max="59"
      placeholder="MM"
      value={editData.planMinute || ''}
      onChange={(e) =>
        setEditData({ ...editData, planMinute: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />
  </div>
</div>

{/* 🔔 提醒时间 */}
<div>
  <label
    style={{
      display: 'block',
      marginBottom: 8,
      fontWeight: 600,
      color: '#333',
      fontSize: 14,
    }}
  >
    🔔 提醒时间
  </label>

  <div
    style={{
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'nowrap',
    }}
  >
    <input
      type="number"
      min="2024"
      max="2030"
      placeholder="2025"
      value={editData.reminderYear || ''}
      onChange={(e) =>
        setEditData({ ...editData, reminderYear: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}>/</span>

    <input
      type="number"
      min="1"
      max="12"
      placeholder="MM"
      value={editData.reminderMonth || ''}
      onChange={(e) =>
        setEditData({ ...editData, reminderMonth: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}>/</span>

    <input
      type="number"
      min="1"
      max="31"
      placeholder="DD"
      value={editData.reminderDay || ''}
      onChange={(e) =>
        setEditData({ ...editData, reminderDay: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}> </span>

    <input
      type="number"
      min="0"
      max="23"
      placeholder="HH"
      value={editData.reminderHour || ''}
      onChange={(e) =>
        setEditData({ ...editData, reminderHour: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />

    <span style={{ color: '#666' }}>:</span>

    <input
      type="number"
      min="0"
      max="59"
      placeholder="MM"
      value={editData.reminderMinute || ''}
      onChange={(e) =>
        setEditData({ ...editData, reminderMinute: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 4px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />
  </div>
</div>


        


{/* 📋 子任务编辑 */}
<div>
  <label
    style={{
      display: 'block',
      marginBottom: 8,
      fontWeight: 600,
      color: '#333',
      fontSize: 14,
    }}
  >
    📋 子任务
  </label>

  {/* 添加子任务 */}
  <div
    style={{
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 12,
    }}
  >
    <input
      type="text"
      placeholder="输入子任务内容"
      value={editData.newSubTask || ''}
      onChange={(e) =>
        setEditData({ ...editData, newSubTask: e.target.value })
      }
      style={{
        flex: 1,
        height: 36,
        padding: '0 10px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    />
    <button
      onClick={() => {
        if (editData.newSubTask?.trim()) {
          const newSubTask = {
            text: editData.newSubTask.trim(),
            done: false,
          };
          const updatedSubTasks = [
            ...(editData.subTasks || []),
            newSubTask,
          ];
          setEditData({
            ...editData,
            subTasks: updatedSubTasks,
            newSubTask: '',
          });
        }
      }}
      style={{
        height: 36,
        width: 36,
        backgroundColor: '#f9f9f9',
        color: '#333',
        border: '1px solid #ccc',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 18,
        fontWeight: 600,
        lineHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      +
    </button>
  </div>

  {/* 子任务列表（仅当有内容时显示） */}
  {editData.subTasks?.length > 0 && (
    <div>
      {editData.subTasks.map((subTask, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <input
            type="checkbox"
            checked={subTask.done || false}
            onChange={(e) => {
              const newSubTasks = [...editData.subTasks];
              newSubTasks[index] = {
                ...newSubTasks[index],
                done: e.target.checked,
              };
              setEditData({ ...editData, subTasks: newSubTasks });
            }}
            style={{
              transform: 'scale(1.2)',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={subTask.text || ''}
            onChange={(e) => {
              const newSubTasks = [...editData.subTasks];
              newSubTasks[index] = {
                ...newSubTasks[index],
                text: e.target.value,
              };
              setEditData({ ...editData, subTasks: newSubTasks });
            }}
            placeholder="子任务内容"
            style={{
              flex: 1,
              height: 36,
              padding: '0 10px',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: '#fff',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => {
              const newSubTasks = editData.subTasks.filter(
                (_, i) => i !== index
              );
              setEditData({ ...editData, subTasks: newSubTasks });
            }}
            style={{
              height: 36,
              width: 48,
              backgroundColor: '#f9f9f9',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              boxSizing: 'border-box',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}
</div>





{/* 📊 进度跟踪 */}
<div>
  <label
    style={{
      display: 'block',
      marginBottom: 8,
      fontWeight: 600,
      color: '#333',
      fontSize: 14,
    }}
  >
    📊 进度跟踪
  </label>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      alignItems: 'end',
    }}
  >
    {/* 初始值 */}
    <div>
      <div
        style={{
          fontSize: 11,
          color: '#666',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        初始值
      </div>
      <input
        type="number"
        value={editData.progress?.initial || ''}
        onChange={(e) =>
          setEditData({
            ...editData,
            progress: {
              ...editData.progress,
              initial:
                e.target.value === ''
                  ? 0
                  : parseInt(e.target.value) || 0,
            },
          })
        }
        style={{
          width: '100%',
          height: 36,
          padding: '0 6px',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 14,
          textAlign: 'center',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      />
    </div>

    {/* 当前值 */}
    <div>
      <div
        style={{
          fontSize: 11,
          color: '#666',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        当前值
      </div>
      <input
        type="number"
        value={editData.progress?.current || ''}
        onChange={(e) =>
          setEditData({
            ...editData,
            progress: {
              ...editData.progress,
              current:
                e.target.value === ''
                  ? 0
                  : parseInt(e.target.value) || 0,
            },
          })
        }
        style={{
          width: '100%',
          height: 36,
          padding: '0 6px',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 14,
          textAlign: 'center',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      />
    </div>

    {/* 目标值 */}
    <div>
      <div
        style={{
          fontSize: 11,
          color: '#666',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        目标值
      </div>
      <input
        type="number"
        value={editData.progress?.target || ''}
        onChange={(e) =>
          setEditData({
            ...editData,
            progress: {
              ...editData.progress,
              target:
                e.target.value === ''
                  ? 0
                  : parseInt(e.target.value) || 0,
            },
          })
        }
        style={{
          width: '100%',
          height: 36,
          padding: '0 6px',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 14,
          textAlign: 'center',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      />
    </div>

    {/* 单位 */}
    <div>
      <div
        style={{
          fontSize: 11,
          color: '#666',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        单位
      </div>
      <select
        value={editData.progress?.unit || '%'}
        onChange={(e) =>
          setEditData({
            ...editData,
            progress: {
              ...editData.progress,
              unit: e.target.value,
            },
          })
        }
        style={{
          width: '100%',
          height: 36,
          padding: '0 6px',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 14,
          textAlign: 'center',
          backgroundColor: '#fff',
          cursor: 'pointer',
          boxSizing: 'border-box',
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
  activeTimer,
  onEditSubTask = () => {}
}) => {
  const [editingSubTaskIndex, setEditingSubTaskIndex] = useState(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [showProgressControls, setShowProgressControls] = useState(false);
  const [editingSubTaskNoteIndex, setEditingSubTaskNoteIndex] = useState(null);

  // 在 TaskItem 组件中，修复计时器状态判断
  const isThisTaskRunning = activeTimer && (
    activeTimer.taskId === task.id || 
    (task.isWeekTask && activeTimer.taskText === task.text)
  );

  // 在计时器按钮的点击处理中
  const handleTimerClick = () => {
    if (isThisTaskRunning) {
      onPauseTimer(task);
    } else {
      onStartTimer(task);
    }
  };



  // 开始编辑子任务
  const startEditSubTask = (index, currentText) => {
    setEditingSubTaskIndex(index);
    setEditSubTaskText(currentText);
  };

  // 修改保存子任务函数
  const saveEditSubTask = () => {
    if (editSubTaskText.trim() && editingSubTaskIndex !== null) {
      // 获取当前子任务的备注
      const currentSubTask = task.subTasks[editingSubTaskIndex];
      const currentNote = currentSubTask?.note || '';
      
      // 保存文本和备注
      onEditSubTask(task, editingSubTaskIndex, editSubTaskText.trim(), currentNote);
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

  // 处理进度调整
  const handleProgressAdjust = (increment) => {
    const newCurrent = Math.max(0, (Number(task.progress?.current) || 0) + increment);
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
      {/* 第一行：任务内容 + 复选框 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
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
            cursor: "pointer",
            color: task.done ? "#999" : "#000",
            fontWeight: task.pinned ? "bold" : "normal",
            fontSize: "14px",
            lineHeight: 1.4,
            flex: 1,
    maxWidth: "calc(100% - 40px)", // 新增：限制最大宽度
    overflow: "hidden",
    whiteSpace: "pre-wrap",  // 改为 pre-wrap
    wordWrap: "break-word"   // 添加这行
          }}
        >
          {task.text}
          {task.pinned && " 📌"}
          {task.isWeekTask && " 🌟"}
        </div>
      </div>

      {/* 第二行：备注和感想 */}
      {(task.note || task.reflection) && (
        <div style={{ 
          marginLeft: "20px", 
          marginBottom: 4,
          position: "relative" // 为计时器定位做准备
        }}>
          {/* 备注 */}
          {task.note && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(task);
              }}
              style={{
                fontSize: 12,
                color: "#666",
                cursor: "pointer",
                backgroundColor: 'transparent',
                lineHeight: "1.3",
                whiteSpace: "pre-wrap",
                marginBottom: task.reflection ? "2px" : "0",
                paddingRight: "60px" // 为计时器留出空间
              }}
            >
              {task.note}
            </div>
          )}
          
          {/* 感想 */}
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
                cursor: "pointer",
                backgroundColor: '#fff9c4',
                padding: '4px 8px',
                borderRadius: '4px',
                lineHeight: "1.3",
                whiteSpace: "pre-wrap",
                border: '1px solid #ffd54f',
                marginBottom: "4px",
                paddingRight: "60px" // 为计时器留出空间
              }}
            >
              💭 {task.reflection}
            </div>
          )}

          {/* 计时器 - 显示在右下角 */}
          <div style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
    if (activeTimer?.taskId === task.id) {
      handlePauseTimer(task);
    } else {
      handleStartTimer(task);
    }
              }}
              style={{
                fontSize: 12,
                border: "none",
                background: "transparent",
                color: isThisTaskRunning ? "#ff4444" : "#4CAF50",
                cursor: "pointer",
                padding: "2px"
              }}
              title={isThisTaskRunning ? "点击暂停计时" : "点击开始计时"}
            >
              {isThisTaskRunning ? "⏸️" : "⏱️"}
            </button>

            <span
              onClick={(e) => {
                e.stopPropagation();
                onEditTime?.(task);
              }}
              style={{
                fontSize: 12,
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                backgroundColor: "#f5f5f5",
                padding: "2px 6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                minWidth: "45px",
                textAlign: "center"
              }}
              title="点击修改时间"
            >
              {isThisTaskRunning
                ? formatTimeNoSeconds((task.timeSpent || 0) + elapsedTime)
                : formatTimeNoSeconds(task.timeSpent || 0)}
            </span>
          </div>
        </div>
      )}

      {/* 如果没有备注和感想，计时器单独一行显示在右下角 */}
      {!task.note && !task.reflection && (
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: 4,
          marginLeft: "20px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTimerClick();
              }}
              style={{
                fontSize: 12,
                border: "none",
                background: "transparent",
                color: isThisTaskRunning ? "#ff4444" : "#4CAF50",
                cursor: "pointer",
                padding: "2px"
              }}
              title={isThisTaskRunning ? "点击暂停计时" : "点击开始计时"}
            >
              {isThisTaskRunning ? "⏸️" : "⏱️"}
            </button>

            <span
              onClick={(e) => {
                e.stopPropagation();
                onEditTime?.(task);
              }}
              style={{
                fontSize: 12,
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                backgroundColor: "#f5f5f5",
                padding: "2px 6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                minWidth: "45px",
                textAlign: "center"
              }}
              title="点击修改时间"
            >
              {isThisTaskRunning
                ? formatTimeNoSeconds((task.timeSpent || 0) + elapsedTime)
                : formatTimeNoSeconds(task.timeSpent || 0)}
            </span>
          </div>
        </div>
      )}

      {/* 标签显示 */}
      {task.tags && task.tags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          marginLeft: "20px",
          marginTop: 4,
          marginBottom: 4
        }}>
          {task.tags.map((tag, index) => (
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
      )}

      {/* 进度条和其他内容 */}
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

      {/* 备注、感想和子任务的容器 */}
      <div style={{ marginLeft: "20px" }}>
        {task.subTasks && task.subTasks.length > 0 && (
          <div style={{ 
            marginTop: (task.note || task.reflection) ? 2 : -2,
            marginBottom: 0,
            borderLeft: '2px solid #e0e0e0', 
            paddingLeft: 8
          }}>
            {task.subTasks.map((subTask, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1,
                marginBottom: 4,
                fontSize: 13, 
                color: task.done ? '#999' : '#666',
                minHeight: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="checkbox"
                    checked={subTask.done}
                    onChange={() => onToggleSubTask(task, index)}
                    style={{ transform: 'scale(0.8)' }}
                  />
                  
                  {editingSubTaskIndex === index ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        type="text"
                        value={editSubTaskText}
                        onChange={(e) => setEditSubTaskText(e.target.value)}
                        onBlur={saveEditSubTask}
                        onKeyDown={handleKeyPress}
                        autoFocus
                        style={{
                          padding: '1px 4px',
                          border: '1px solid #1a73e8',
                          borderRadius: '3px',
                          fontSize: '13px',
                          outline: 'none',
                          height: '20px'
                        }}
                      />
                      {/* 编辑模式下也显示备注 */}
                      {subTask.note && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#333',
                          marginLeft: '0px',
                          padding: '2px 6px',
                          backgroundColor: '#fff9c4',
                          borderRadius: '3px',
                          border: '1px solid #ffd54f',
                          lineHeight: '1.3'
                        }}>
                          💭 {subTask.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span 
                      onClick={() => startEditSubTask(index, subTask.text, subTask.note)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newNote = window.prompt("添加备注", subTask.note || "");
                        if (newNote !== null) {
                          onEditSubTask(task, index, subTask.text, newNote);
                        }
                      }}
                      style={{ 
                        textDecoration: "none",
                        cursor: 'pointer',
                        flex: 1,
                        padding: '3px 4px 1px 4px',
                        borderRadius: '3px',
                        transition: 'background-color 0.2s',
                        minHeight: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        lineHeight: '1.5'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="左键编辑文本，右键添加备注"
                    >
                      {subTask.text}
                    </span>
                  )}
                </div>
                
                {/* 非编辑模式下备注显示在子任务下面 - 内联编辑版本 */}
                {editingSubTaskIndex !== index && subTask.note && (
                  <div style={{ 
                    marginLeft: '20px'
                  }}>
                    {editingSubTaskNoteIndex === index ? (
                      <input
                        type="text"
                        defaultValue={subTask.note}
                        onBlur={(e) => {
                          const newNote = e.target.value.trim();
                          if (newNote !== subTask.note) {
                            onEditSubTask(task, index, subTask.text, newNote);
                          }
                          setEditingSubTaskNoteIndex(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newNote = e.target.value.trim();
                            if (newNote !== subTask.note) {
                              onEditSubTask(task, index, subTask.text, newNote);
                            }
                            setEditingSubTaskNoteIndex(null);
                          } else if (e.key === 'Escape') {
                            setEditingSubTaskNoteIndex(null);
                          }
                        }}
                        autoFocus
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          border: '1px solid #1a73e8',
                          borderRadius: '3px',
                          outline: 'none',
                          width: '100%',
                          backgroundColor: '#fff9c4'
                        }}
                      />
                    ) : (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubTaskNoteIndex(index);
                        }}
                        style={{ 
                          fontSize: '11px', 
                          color: '#333',
                          padding: '2px 6px',
                          backgroundColor: '#fff9c4',
                          borderRadius: '3px',
                          border: '1px solid #ffd54f',
                          lineHeight: '1.3',
                          cursor: 'pointer'
                        }}
                        title="点击编辑备注"
                      >
                        💭 {subTask.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
};







function App() {
  const [tasksByDate, setTasksByDate] = useState({});
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTaskText, setNewTaskText] = useState("");
  const [pointHistory, setPointHistory] = useState([]);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [bulkTags, setBulkTags] = useState([]); // 当前选中的标签
  const [bulkNewTagName, setBulkNewTagName] = useState(""); // 新建标签名
  const [bulkNewTagColor, setBulkNewTagColor] = useState("#e0e0e0"); // 新建标签颜色
  const [showBulkInput, setShowBulkInput] = useState(false); // 控制是否显示批量导入框
  const [newTaskCategory, setNewTaskCategory] = useState(baseCategories[0].name);
  const [bulkText, setBulkText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTaskSubCategory, setNewTaskSubCategory] = useState('');
  const [showStats, setShowStats] = useState(false);
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
  // 临时保留旧变量避免错误

  const todayTasks = tasksByDate[selectedDate] || [];
 
  const [isInitialized, setIsInitialized] = useState(false);
  const [timerRecords, setTimerRecords] = useState([]);
  const [showTimerRecords, setShowTimerRecords] = useState(false);
  const [customAchievements, setCustomAchievements] = useState([]);
  const [showCustomAchievementModal, setShowCustomAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null); // 新增：正在编辑的类别
 const [collapsedSubCategories, setCollapsedSubCategories] = useState({});

const [categories, setCategories] = useState(baseCategories.map(cat => ({
  ...cat,
  subCategories: []
})));



  const [showSchedule, setShowSchedule] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statsMode, setStatsMode] = useState("week");
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showImageModal, setShowImageModal] = useState(null);
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showMoveTaskModal, setShowMoveTaskModal] = useState(null);
  const [showDailyLogModal, setShowDailyLogModal] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [dailyMoods, setDailyMoods] = useState({});
  const [dailyRatings, setDailyRatings] = useState({});
  const [dailyReflections, setDailyReflections] = useState({});
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showCrossDateModal, setShowCrossDateModal] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [repeatConfig, setRepeatConfig] = useState({
  frequency: "", // 改为空字符串，默认不重复
  days: [false, false, false, false, false, false, false],
  startHour: "",
  startMinute: "",
  endHour: "",
  endMinute: "",
  reminderYear: "",
  reminderMonth: "",
  reminderDay: "",
  reminderHour: "",
  reminderMinute: "",
});



// 获取当前日期的心情和评价
const getCurrentDailyMood = useCallback(() => {
  return dailyMoods[selectedDate] || 0;
}, [dailyMoods, selectedDate]);

const getCurrentDailyRating = useCallback(() => {
  return dailyRatings[selectedDate] || 0;
}, [dailyRatings, selectedDate]);



// 设置当前日期的心情和评价
const setCurrentDailyMood = (mood) => {
  setDailyMoods(prev => ({
    ...prev,
    [selectedDate]: mood
  }));
};

const setCurrentDailyRating = (rating) => {
  setDailyRatings(prev => ({
    ...prev,
    [selectedDate]: rating
  }));
};

const dailyMood = getCurrentDailyMood();
const dailyRating = getCurrentDailyRating();
// 获取当前选中日期的复盘内容
const getCurrentDailyReflection = () => {
  return dailyReflections[selectedDate] || '';
};

// 设置当前选中日期的复盘内容
const setCurrentDailyReflection = (reflection) => {
  setDailyReflections(prev => ({
    ...prev,
    [selectedDate]: reflection
  }));
};

// 添加表情选项
const moodOptions = [
  { emoji: '', label: '无', value: 0 },
  { emoji: '😊', label: '开心', value: 1 },
  { emoji: '😐', label: '平静', value: 2 },
  { emoji: '😔', label: '疲惫', value: 3 },
  { emoji: '😤', label: '烦躁', value: 4 },
  { emoji: '🤩', label: '充满活力', value: 5 },
  { emoji: '😴', label: '困倦', value: 6 }
];

const saveDailyData = useCallback(async () => {
  const dailyData = {
    mood: getCurrentDailyMood(),
    rating: getCurrentDailyRating(),
    reflection: dailyReflections[selectedDate] || '',
    date: selectedDate
  };
  await saveMainData(`daily_${selectedDate}`, dailyData);
}, [selectedDate, dailyReflections, getCurrentDailyMood, getCurrentDailyRating]);










// ========== 全新的计时器系统 ==========



// 2. 简化的恢复函数 - 只在初始化时调用一次
const restoreTimer = useCallback(() => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_activeTimer`);
    console.log('🔍 恢复计时器检查:', saved ? '有数据' : '无数据');
    
    if (!saved) {
      setActiveTimer(null);
      setElapsedTime(0);
      return;
    }

    const timerData = JSON.parse(saved);
    
    // 检查是否已暂停
    if (timerData.status === 'paused') {
      console.log('⏸️ 计时器已暂停，不恢复');
      localStorage.removeItem(`${STORAGE_KEY}_activeTimer`);
      setActiveTimer(null);
      setElapsedTime(0);
      return;
    }

    // 检查是否超时（超过2分钟不恢复）
    const now = Date.now();
    const timeSinceSave = Math.floor((now - timerData.savedAt) / 1000);
    if (timeSinceSave > 120) {
      console.log('⏰ 计时器中断时间过长，不恢复');
      localStorage.removeItem(`${STORAGE_KEY}_activeTimer`);
      setActiveTimer(null);
      setElapsedTime(0);
      return;
    }

    // 恢复计时器
    const totalElapsed = (timerData.elapsedTime || 0) + timeSinceSave;
    
    console.log('✅ 恢复计时器成功:', {
      类型: timerData.taskId ? '任务' : '分类',
      标识: timerData.taskId || timerData.category,
      已过时间: totalElapsed + '秒'
    });

    setActiveTimer({
      ...timerData,
      startTime: now - (totalElapsed * 1000) // 重新计算开始时间
    });
    setElapsedTime(totalElapsed);

  } catch (error) {
    console.error('❌ 恢复计时器失败:', error);
    localStorage.removeItem(`${STORAGE_KEY}_activeTimer`);
    setActiveTimer(null);
    setElapsedTime(0);
  }
}, []);

// 3. 保存计时器状态
const saveTimerState = useCallback((timer, currentElapsed, status = 'running') => {
  const timerData = {
    ...timer,
    elapsedTime: currentElapsed,
    savedAt: Date.now(),
    status: status
  };
  
  localStorage.setItem(`${STORAGE_KEY}_activeTimer`, JSON.stringify(timerData));
  console.log('💾 保存计时器状态:', status, currentElapsed + '秒');
}, []);

// 4. 清理计时器状态
const clearTimerState = useCallback(() => {
  localStorage.removeItem(`${STORAGE_KEY}_activeTimer`);
  setActiveTimer(null);
  setElapsedTime(0);
  console.log('🗑️ 清理计时器状态');
}, []);

// 5. 开始计时 - 统一函数
const handleStartTimer = (target) => {
  console.log('🎯 开始计时:', target.text || target.category);
  
  // 如果已有计时器在运行，先暂停它
  if (activeTimer) {
    if (activeTimer.taskId) {
      handlePauseTimer({ id: activeTimer.taskId });
    } else if (activeTimer.category) {
      handlePauseCategoryTimer(activeTimer.category, activeTimer.subCategory);
    }
  }

  const newTimer = target.id ? {
    taskId: target.id,
    startTime: Date.now(),
    taskText: target.text,
    isWeekTask: target.isWeekTask,
    category: target.category
  } : {
    category: target.category,
    subCategory: target.subCategory || null,
    startTime: Date.now()
  };

  setActiveTimer(newTimer);
  setElapsedTime(0);
  
  // 立即保存
  saveTimerState(newTimer, 0, 'running');
  
  // 创建计时记录（仅任务）
  if (target.id) {
    const newRecord = {
      id: Date.now().toString(),
      taskId: target.id,
      taskText: target.text,
      category: target.category,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0
    };
    setTimerRecords(prev => [newRecord, ...prev]);
  }

  console.log('✅ 计时器启动完成');
};

// 6. 暂停计时 - 统一函数
const handlePauseTimer = (task) => {
  if (!activeTimer || !activeTimer.taskId) {
    console.log('⚠️ 没有任务计时器可暂停');
    return;
  }

  const endTime = Date.now();
  const sessionTime = Math.floor((endTime - activeTimer.startTime) / 1000);
  const totalElapsed = elapsedTime + sessionTime;

  console.log('⏸️ 暂停任务计时器:', {
    任务: task.text,
    本次计时: sessionTime + '秒',
    总计时: totalElapsed + '秒'
  });

  // 更新计时记录
  setTimerRecords(prev => prev.map(record => 
    record.taskId === task.id && !record.endTime 
      ? { ...record, endTime: new Date().toISOString(), duration: sessionTime } 
      : record
  ));

  // 更新任务时间
  setTasksByDate(prev => {
    const updated = { ...prev };
    Object.keys(updated).forEach(date => {
      updated[date] = updated[date].map(t => {
        if (t.id === task.id || (task.isWeekTask && t.isWeekTask && t.text === task.text)) {
          const updatedSegments = [...(t.timeSegments || [])];
          if (updatedSegments.length > 0) {
            const lastSegment = updatedSegments[updatedSegments.length - 1];
            if (lastSegment && !lastSegment.endTime) {
              updatedSegments[updatedSegments.length - 1] = {
                ...lastSegment,
                endTime: new Date().toISOString(),
                duration: sessionTime
              };
            }
          }
          
          return {
            ...t,
            timeSpent: (t.timeSpent || 0) + sessionTime,
            timeSegments: updatedSegments
          };
        }
        return t;
      });
    });
    return updated;
  });

  // 保存暂停状态
  saveTimerState(activeTimer, totalElapsed, 'paused');
  
  // 清理状态
  setTimeout(clearTimerState, 100);
};

// 7. 暂停分类计时器
const handlePauseCategoryTimer = (categoryName, subCategoryName = null) => {
  if (!activeTimer || activeTimer.category !== categoryName) {
    console.log('⚠️ 没有分类计时器可暂停');
    return;
  }
  
  const endTime = Date.now();
  const sessionTime = Math.floor((endTime - activeTimer.startTime) / 1000);
  const totalElapsed = elapsedTime + sessionTime;

  console.log('⏸️ 暂停分类计时器:', {
    分类: categoryName,
    子分类: subCategoryName,
    计时: sessionTime + '秒'
  });

  // 时间分配到任务
  let targetTasks = [];
  if (subCategoryName) {
    targetTasks = getCategoryTasks(categoryName).filter(task => task.subCategory === subCategoryName);
  } else {
    targetTasks = getCategoryTasks(categoryName);
  }

  if (targetTasks.length > 0) {
    const timePerTask = Math.floor(sessionTime / targetTasks.length);
    
    setTasksByDate(prev => {
      const updated = { ...prev };
      const todayTasks = updated[selectedDate] || [];
      
      updated[selectedDate] = todayTasks.map(t => {
        if (t.category === categoryName && (!subCategoryName || t.subCategory === subCategoryName)) {
          return { 
            ...t, 
            timeSpent: (t.timeSpent || 0) + timePerTask
          };
        }
        return t;
      });
      
      return updated;
    });
  }

  // 保存暂停状态
  saveTimerState(activeTimer, totalElapsed, 'paused');
  
  // 清理状态
  setTimeout(clearTimerState, 100);
};

// 8. 实时计时器
useEffect(() => {
  let intervalId = null;

  if (activeTimer) {
    console.log('▶️ 启动实时计时器');
    
    intervalId = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        // 每15秒保存一次
        if (newTime % 15 === 0) {
          saveTimerState(activeTimer, newTime, 'running');
        }
        return newTime;
      });
    }, 1000);
  }

  return () => {
    if (intervalId) {
      console.log('⏹️ 停止实时计时器');
      clearInterval(intervalId);
    }
  };
}, [activeTimer, saveTimerState]);

// 9. 页面关闭前保存
useEffect(() => {
  const handleBeforeUnload = () => {
    if (activeTimer) {
      saveTimerState(activeTimer, elapsedTime, 'running');
      console.log('🔒 页面关闭前保存计时器');
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [activeTimer, elapsedTime, saveTimerState]);

// 10. 初始化时恢复计时器
useEffect(() => {
  if (isInitialized) {
    console.log('🔄 初始化完成，恢复计时器...');
    restoreTimer();
  }
}, [isInitialized, restoreTimer]);



// 调试函数验证星期对应关系
window.testWeekDays = () => {
  console.log('=== 星期对应关系测试 ===');
  const testDate = new Date(); // 今天
  








  // 测试 getMonday 函数
  const monday = getMonday(testDate);
  console.log('今天:', testDate.toDateString(), '星期:', ['日','一','二','三','四','五','六'][testDate.getDay()]);
  console.log('本周一:', monday.toDateString());
  
  // 测试一周的每一天
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    console.log(`索引 ${i}: ${dayDate.toDateString()} (周${['一','二','三','四','五','六','日'][i]})`);
  }
  
  // 测试重复配置
  console.log('当前重复配置:', repeatConfig);
  console.log('选择的星期:', repeatConfig.days.map((selected, idx) => 
    selected ? `周${['一','二','三','四','五','六','日'][idx]}` : null
  ).filter(Boolean));
};

// 添加调试函数来检查重复任务创建
useEffect(() => {
  window.debugRepeatTasks = () => {
    console.log('重复配置:', repeatConfig);
    console.log('任务数据:', tasksByDate);
    
    // 检查重复任务
    const repeatingTasks = Object.entries(tasksByDate).flatMap(([date, tasks]) => 
      tasks.filter(task => task.isRepeating).map(task => ({ date, task: task.text }))
    );
    console.log('重复任务:', repeatingTasks);
  };
}, [repeatConfig, tasksByDate]);











  


  // 修复：成就检查逻辑
useEffect(() => {
  const checkAndUnlockAchievements = () => {
    console.log('🔍 开始成就检查:', {
      isInitialized,
      任务天数: Object.keys(tasksByDate).length,
      已解锁成就: unlockedAchievements.length
    });

    if (isInitialized && Object.keys(tasksByDate).length > 0) {
      const userData = {
        tasksByDate,
        templates,
        pointHistory,
        exchangeItems
      };
      
      const newlyUnlocked = checkAchievements(userData, unlockedAchievements, customAchievements);
      
      console.log('🎯 新解锁成就检查结果:', newlyUnlocked);
      
      if (newlyUnlocked.length > 0) {
        console.log('🎉 发现新成就，准备解锁:', newlyUnlocked.map(a => a.name));
        
        // 修复：确保状态更新和存储保存
        const newUnlockedIds = newlyUnlocked.map(ach => ach.id);
        const updatedUnlocked = [...unlockedAchievements, ...newUnlockedIds];
        
        // 先更新状态
        setUnlockedAchievements(updatedUnlocked);
        setNewAchievements(newlyUnlocked);
        
        // 然后保存到存储
        saveMainData('unlockedAchievements', updatedUnlocked)
          .then(() => {
            console.log('✅ 成就数据保存成功');
            setShowAchievementsModal(true);
          })
          .catch(error => {
            console.error('❌ 成就数据保存失败:', error);
          });
      }
    }
  };

  // 延迟检查，确保数据完全加载
  if (isInitialized) {
    const timer = setTimeout(checkAndUnlockAchievements, 1500);
    return () => clearTimeout(timer);
  }
  
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tasksByDate, isInitialized]);


  

// 跨日期任务模态框
const CrossDateModal = ({ task, onClose, onSave, selectedDate }) => {
  const [selectedDays, setSelectedDays] = useState([new Date(selectedDate).getDay()]);
  
  // 获取未来7天的日期选项
  const getDateOptions = () => {
    const options = [];
    const today = new Date(selectedDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const dayName = weekDays[dayOfWeek];
      
      options.push({
        value: dateStr,
        day: dayOfWeek,
        label: i === 0 ? `今天 (周${dayName})` : 
               i === 1 ? `明天 (周${dayName})` : 
               `周${dayName} (${date.getMonth() + 1}/${date.getDate()})`
      });
    }
    return options;
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    const selectedDates = getDateOptions()
      .filter(option => selectedDays.includes(option.day))
      .map(option => option.value);
    
    onSave(task, selectedDates);
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
        maxWidth: 400
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
          📅 设置显示日期
        </h3>

        <div style={{ marginBottom: 15 }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>选择显示日期:</div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8 
          }}>
            {getDateOptions().map(option => (
              <label 
                key={option.value}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  padding: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  backgroundColor: selectedDays.includes(option.day) ? '#e8f0fe' : 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(option.day)}
                  onChange={() => toggleDay(option.day)}
                />
                <span style={{ fontSize: 14 }}>{option.label}</span>
              </label>
            ))}
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
          任务将在选中的日期同时显示，完成状态会自动同步
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
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={handleSave}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

const handleCrossDateTask = (task, targetDates) => {
  const taskId = task.crossDateId || task.id || `cross_${Date.now()}`;
  
  console.log('创建/更新跨日期任务:', {
    任务: task.text,
    跨日期ID: taskId,
    目标日期: targetDates
  });
  
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    targetDates.forEach(date => {
      if (!newTasksByDate[date]) {
        newTasksByDate[date] = [];
      }
      
      // 查找是否已存在相同任务（按文本和分类）
      const existingTaskIndex = newTasksByDate[date].findIndex(
        t => t.text === task.text && t.category === task.category
      );
      
      if (existingTaskIndex !== -1) {
        // 更新现有任务为跨日期任务
        console.log(`更新现有任务在 ${date}`);
        newTasksByDate[date][existingTaskIndex] = {
          ...newTasksByDate[date][existingTaskIndex],
          crossDateId: taskId,
          isCrossDate: true,
          crossDates: targetDates,
          done: task.done // 保持原有完成状态
        };
      } else {
        // 创建新的跨日期任务
        console.log(`创建新任务在 ${date}`);
        newTasksByDate[date].push({
          ...task,
          id: `${taskId}_${date}`,
          crossDateId: taskId,
          isCrossDate: true,
          crossDates: targetDates,
          done: false // 新创建的任务默认未完成
        });
      }
    });
    
    return newTasksByDate;
  });
  
  alert(`任务已设置在 ${targetDates.length} 个日期显示`);
};


// 修改 toggleDone 函数，支持跨日期任务同步
const toggleDone = (task) => {
  const wasDone = task.done;

  console.log('=== 开始切换任务状态 ===');
  console.log('任务:', task.text, '当前状态:', wasDone, '跨日期ID:', task.crossDateId);

  // 如果是跨日期任务，同步所有日期的状态
  if (task.isCrossDate && task.crossDateId) {
    console.log('检测到跨日期任务，开始同步');
    
    setTasksByDate(prevTasksByDate => {
      const newTasksByDate = { ...prevTasksByDate };
      let updatedCount = 0;

      // 遍历所有日期
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t => {
          if (t.crossDateId === task.crossDateId) {
            updatedCount++;
            console.log(`✅ 更新日期 ${date} 的任务: "${t.text}", 新状态: ${!wasDone}`);
            return {
              ...t,
              done: !wasDone,
              subTasks: t.subTasks ? t.subTasks.map(st => ({ ...st, done: !wasDone })) : t.subTasks
            };
          }
          return t;
        });
      });

      console.log(`🎯 总共同步了 ${updatedCount} 个任务`);
      
      // 立即检查存储
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('study-tracker-PAGE_A-v2_tasks'));
        const fridayTask = stored?.['2025-10-25']?.find(t => t.crossDateId === task.crossDateId);
        const saturdayTask = stored?.['2025-10-26']?.find(t => t.crossDateId === task.crossDateId);
        console.log('存储后检查:');
        console.log('  周五任务状态:', fridayTask?.done);
        console.log('  周六任务状态:', saturdayTask?.done);
      }, 100);
      
      return newTasksByDate;
    });

  } else {
    // 原有逻辑（普通任务和本周任务）
    const updateTaskWithDone = (t, doneState) => {
      const currentSubTasks = t.subTasks || [];
      const newSubTasks = doneState 
        ? currentSubTasks.map(st => ({ ...st, done: true }))
        : currentSubTasks;
      
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






// 迁移任务函数
const moveTaskToDate = (task, targetDate, moveOption, selectedCategory) => {
  if (moveOption === 'single') {
    // 迁移单个任务
    if (task.isWeekTask) {
      // 本周任务需要特殊处理
      const updatedTasksByDate = { ...tasksByDate };
      
      // 从所有日期中移除该任务
      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].filter(
          t => !(t.isWeekTask && t.text === task.text)
        );
      });
      
      // 在目标日期添加任务
      if (!updatedTasksByDate[targetDate]) {
        updatedTasksByDate[targetDate] = [];
      }
      updatedTasksByDate[targetDate].push({
        ...task,
        isWeekTask: false // 不再是本周任务
      });
      
      setTasksByDate(updatedTasksByDate);
    } else {
      // 普通任务
      setTasksByDate(prev => {
        const newTasksByDate = { ...prev };
        
        // 从原日期移除
        if (newTasksByDate[selectedDate]) {
          newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(
            t => t.id !== task.id
          );
        }
        
        // 添加到目标日期
        if (!newTasksByDate[targetDate]) {
          newTasksByDate[targetDate] = [];
        }
        newTasksByDate[targetDate].push(task);
        
        return newTasksByDate;
      });
    }
  } else {
    // 迁移整个分类
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      
      // 从原日期移除该分类的所有任务
      if (newTasksByDate[selectedDate]) {
        newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(
          t => t.category !== selectedCategory
        );
      }
      
      // 将原日期的该分类任务添加到目标日期
      const originalTasks = prev[selectedDate] || [];
      const categoryTasks = originalTasks.filter(t => t.category === selectedCategory);
      
      if (!newTasksByDate[targetDate]) {
        newTasksByDate[targetDate] = [];
      }
      
      // 添加任务到目标日期，避免重复
      categoryTasks.forEach(task => {
        const exists = newTasksByDate[targetDate].some(
          t => t.text === task.text && t.category === task.category
        );
        if (!exists) {
          newTasksByDate[targetDate].push(task);
        }
      });
      
      return newTasksByDate;
    });
  }
  
  alert('任务迁移成功！');
};
  
  



  
  // 在状态更新后强制渲染
 

 const editSubTask = (task, subTaskIndex, newText, newNote = '') => {
  console.log('保存子任务:', { newText, newNote, subTaskIndex }); // 添加日志
  
  if (newText && newText.trim() !== '') {
    const updateTaskWithSubTaskEdit = (t) => {
      const currentSubTasks = t.subTasks || [];
      return {
        ...t,
        subTasks: currentSubTasks.map((st, index) => 
          index === subTaskIndex ? { 
            ...st, 
            text: newText.trim(),
            note: newNote // 确保备注被保存
          } : st
        )
      };
    };

    if (task.isWeekTask) {
      const updatedTasksByDate = { ...tasksByDate };
      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? updateTaskWithSubTaskEdit(t) : t
        );
      });
      setTasksByDate(updatedTasksByDate);
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? updateTaskWithSubTaskEdit(t) : t
        )
      }));
    }
  }
};

// ========== 自定义成就处理函数 ==========
const handleAddCustomAchievement = (achievement) => {
  console.log('添加自定义成就:', achievement);
  const updatedAchievements = [...customAchievements, achievement];
  setCustomAchievements(updatedAchievements);
  saveMainData('customAchievements', updatedAchievements);
  setShowCustomAchievementModal(false);
  setEditingAchievement(null);
};

const handleEditCustomAchievement = (achievement) => {
  setCustomAchievements(prev => prev.map(a => 
    a.id === achievement.id ? achievement : a
  ));
  saveMainData('customAchievements', customAchievements);
};

const handleDeleteCustomAchievement = (achievementId) => {
  if (window.confirm('确定要删除这个自定义成就吗？')) {
    setCustomAchievements(prev => prev.filter(a => a.id !== achievementId));
    setUnlockedAchievements(prev => prev.filter(id => id !== achievementId));
    saveMainData('customAchievements', customAchievements.filter(a => a.id !== achievementId));
  }
};

const handleOpenCustomAchievementModal = (achievement = null) => {
  setEditingAchievement(achievement);
  setShowCustomAchievementModal(true);
};


// 子类别管理模态框组件
const SubCategoryModal = ({ category, onSave, onClose }) => {
  const [subCategories, setSubCategories] = useState(category.subCategories || []);
  const [newSubCategory, setNewSubCategory] = useState('');

  const handleAddSubCategory = () => {
    if (newSubCategory.trim() && !subCategories.includes(newSubCategory.trim())) {
      setSubCategories([...subCategories, newSubCategory.trim()]);
      setNewSubCategory('');
    }
  };

  const handleRemoveSubCategory = (index) => {
    const newSubCategories = [...subCategories];
    newSubCategories.splice(index, 1);
    setSubCategories(newSubCategories);
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
        maxWidth: 400
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
          管理 {category.name} 子类别
        </h3>

        {/* 添加新子类别 */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              placeholder="输入子类别名称"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 14
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory()}
            />
            <button
              onClick={handleAddSubCategory}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              添加
            </button>
          </div>
        </div>

        {/* 子类别列表 */}
        <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 15 }}>
          {subCategories.map((subCat, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                marginBottom: 6,
                backgroundColor: '#f8f9fa'
              }}
            >
              <span>{subCat}</span>
              <button
                onClick={() => handleRemoveSubCategory(index)}
                style={{
                  padding: '4px 8px',
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
          ))}
          
          {subCategories.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
              暂无子类别
            </div>
          )}
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
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={() => {
              onSave(category.name, subCategories);
              onClose();
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};



// ========== 修复成就系统 ==========

// 强制日期更新 - 放在组件最前面
useEffect(() => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  if (selectedDate !== todayStr) {
    setSelectedDate(todayStr);
    setCurrentMonday(getMonday(today));
    
    // 强制重新渲染
    setTimeout(() => {
      setSelectedDate(prev => prev);
    }, 100);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// 方法2：直接禁用这条规则的警告
useEffect(() => {
  const todayStr = new Date().toISOString().split("T")[0];
  if (selectedDate !== todayStr) {
    setSelectedDate(todayStr);
    setCurrentMonday(getMonday(new Date()));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// 加载已解锁的成就
useEffect(() => {
  const loadUnlockedAchievements = async () => {
    try {
      const savedAchievements = await loadMainData('unlockedAchievements');
      if (savedAchievements) {
        setUnlockedAchievements(savedAchievements);
      }
    } catch (error) {
      console.error('加载成就数据失败:', error);
    }
  };

  if (isInitialized) {
    loadUnlockedAchievements();
  }
}, [isInitialized]);

// 保存已解锁的成就
useEffect(() => {
  const saveUnlockedAchievements = async () => {
    if (isInitialized && unlockedAchievements.length > 0) {
      await saveMainData('unlockedAchievements', unlockedAchievements);
    }
  };

  saveUnlockedAchievements();
}, [unlockedAchievements, isInitialized]);

// 调试函数 - 在控制台测试成就
useEffect(() => {
  window.debugAchievements = {
    // 强制检查所有成就
    checkAll: () => {
      const userData = {
        tasksByDate,
        templates,
        pointHistory,
        exchangeItems
      };
      const allAchievements = Object.values(ACHIEVEMENTS_CONFIG).flat();
      const unlocked = allAchievements.filter(ach => ach.condition(userData));
      console.log('可解锁成就:', unlocked);
      return unlocked;
    },
    // 重置成就
    reset: async () => {
      setUnlockedAchievements([]);
      await saveMainData('unlockedAchievements', []);
      console.log('成就已重置');
    },
    // 解锁特定成就（用于测试）
    unlock: (achievementId) => {
      const allAchievements = Object.values(ACHIEVEMENTS_CONFIG).flat();
      const achievement = allAchievements.find(ach => ach.id === achievementId);
      if (achievement && !unlockedAchievements.includes(achievementId)) {
        setNewAchievements([achievement]);
        setUnlockedAchievements(prev => [...prev, achievementId]);
        setShowAchievementsModal(true);
      }
    }
  };
}, [tasksByDate, templates, pointHistory, exchangeItems, unlockedAchievements]);

// 修复：成就检查 - 只在任务数据变化时检查
useEffect(() => {
  if (isInitialized && Object.keys(tasksByDate).length > 0) {
    console.log('🔄 任务数据变化，检查成就...');
    
    const userData = {
      tasksByDate,
      templates: templates || [],
      pointHistory: pointHistory || [],
      exchangeItems: exchangeItems || []
    };
    
    const newlyUnlocked = checkAchievements(userData, unlockedAchievements, customAchievements || []);
    
    if (newlyUnlocked.length > 0) {
      console.log('🎉 解锁新成就:', newlyUnlocked.map(a => a.name));
      
      // 更新状态
      const newUnlockedIds = newlyUnlocked.map(ach => ach.id);
      const updatedUnlocked = [...unlockedAchievements, ...newUnlockedIds];
      
      setUnlockedAchievements(updatedUnlocked);
      setNewAchievements(newlyUnlocked);
      
      // 保存到存储
      saveMainData('unlockedAchievements', updatedUnlocked);
      
      // 显示成就弹窗
      setTimeout(() => {
        setShowAchievementsModal(true);
      }, 500);
    }
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tasksByDate, isInitialized]);



const generateDailyLog = () => {
  const completedTasks = todayTasks.filter(task => task.done);
  const incompleteTasks = todayTasks.filter(task => !task.done);


  
 

  // 获取当前日期的复盘内容
 



  // 按分类和子分类组织任务
  const tasksByCategory = {};
  
  // 处理已完成任务
  completedTasks.forEach(task => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = {
        withSubCategories: {},
        withoutSubCategories: []
      };
    }
    
    if (task.subCategory) {
      if (!tasksByCategory[task.category].withSubCategories[task.subCategory]) {
        tasksByCategory[task.category].withSubCategories[task.subCategory] = [];
      }
      tasksByCategory[task.category].withSubCategories[task.subCategory].push({...task, isCompleted: true});
    } else {
      tasksByCategory[task.category].withoutSubCategories.push({...task, isCompleted: true});
    }
  });

  // 处理未完成任务 - 只处理"校内"分类
  incompleteTasks.forEach(task => {
    if (task.category === "校内") {
      if (!tasksByCategory[task.category]) {
        tasksByCategory[task.category] = {
          withSubCategories: {},
          withoutSubCategories: []
        };
      }
      
      if (task.subCategory) {
        if (!tasksByCategory[task.category].withSubCategories[task.subCategory]) {
          tasksByCategory[task.category].withSubCategories[task.subCategory] = [];
        }
        tasksByCategory[task.category].withSubCategories[task.subCategory].push({...task, isCompleted: false});
      } else {
        tasksByCategory[task.category].withoutSubCategories.push({...task, isCompleted: false});
      }
    }
  });

  const totalTime = completedTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
  const totalMinutes = Math.floor(totalTime / 60);

  // 原始格式内容
  let logContent = ``;

  // Markdown 格式内容
  let markdownContent = `# 学习任务\n\n`;

  // 遍历每个分类
  Object.entries(tasksByCategory).forEach(([category, categoryData]) => {
    logContent += `${category}\n`;
    markdownContent += `## ${category}\n`;
    
    // 1️⃣ 先显示没有子分类的任务
    if (categoryData.withoutSubCategories.length > 0) {
      categoryData.withoutSubCategories.forEach((task) => {
        const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
        const timeText = minutes > 0 ? `【${minutes}m】` : "";
        
        if (task.isCompleted) {
          // 已完成任务
          logContent += `  ✔️ ${task.text}${timeText}\n`;
          markdownContent += `- ✔️ ${task.text}${timeText}\n`;
        } else {
          // 未完成任务 - 只针对校内分类
          logContent += `  ❌ ${task.text}${timeText}\n`;
          markdownContent += `- ❌ ${task.text}${timeText}\n`;
        }
      });
    }

    // 2️⃣ 再显示有子分类的任务
    if (categoryData.withoutSubCategories.length > 0 && Object.keys(categoryData.withSubCategories).length > 0) {
      logContent += '\n';
      markdownContent += '\n';
    }

    Object.entries(categoryData.withSubCategories).forEach(([subCategory, subTasks]) => {
      logContent += `  - ${subCategory}\n`;
      markdownContent += `### - ${subCategory}\n`;

      subTasks.forEach((task) => {
        const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
        const timeText = minutes > 0 ? `【${minutes}m】` : "";

        if (task.isCompleted) {
          // 已完成任务
          logContent += `    ✔️ ${task.text}${timeText}\n`;
          markdownContent += `  - ✔️ ${task.text}${timeText}\n`;
        } else {
          // 未完成任务 - 只针对校内分类
          logContent += `    ❌ ${task.text}${timeText}\n`;
          markdownContent += `  - ❌ ${task.text}${timeText}\n`;
        }
      });
      
      if (Object.keys(categoryData.withSubCategories).length > 1) {
        logContent += '\n';
        markdownContent += '\n';
      }
    });
    
    logContent += '\n';
    markdownContent += '\n';
  });

  // 统计信息
  const totalTasksCount = completedTasks.length + incompleteTasks.filter(t => t.category === "校内").length;

  markdownContent += `# 学习统计\n`;
  markdownContent += `- 完成任务: ${completedTasks.length} 个\n`;
  markdownContent += `- 未完成任务: ${incompleteTasks.filter(t => t.category === "校内").length} 个\n`;
  markdownContent += `- 总任务数: ${totalTasksCount} 个\n`;
  markdownContent += `- 完成率: ${Math.round((completedTasks.length / totalTasksCount) * 100)}%\n`;
  markdownContent += `- 学习时长: ${totalMinutes} 分钟\n`;
  markdownContent += `- 平均每项: ${completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0} 分钟`;



  setShowDailyLogModal(prev => {
  const newStats = {
    completedTasks: completedTasks.length,
    incompleteTasks: incompleteTasks.filter(t => t.category === "校内").length,
    totalTasks: totalTasksCount,
    completionRate: Math.round((completedTasks.length / totalTasksCount) * 100),
    totalMinutes: totalMinutes,
    averagePerTask: completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0,
    categories: Object.keys(tasksByCategory).length
  };
  
  // 如果状态没变，返回之前的状态避免重新渲染
  if (prev && prev.stats && JSON.stringify(prev.stats) === JSON.stringify(newStats)) {
    return prev;
  }
  
  return {
    visible: true,
    content: logContent,
    markdownContent: markdownContent,
    date: selectedDate,
    stats: newStats
  };
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











// 暴露实例给全局调试
useEffect(() => {
  window.appInstance = {
    saveAllData: () => {
      saveMainData('tasks', tasksByDate);
      saveMainData('templates', templates);
      saveMainData('pointHistory', pointHistory);
      saveMainData('exchange', exchangeItems);
      saveMainData('customAchievements', customAchievements);
      saveMainData('unlockedAchievements', unlockedAchievements);
      
    },
    getState: () => ({
      tasksByDate,
      templates,
      pointHistory,
      exchangeItems,
      customAchievements,
      unlockedAchievements,
      isInitialized,
      selectedDate,
      // 添加模态框状态
      showAchievementsModal,
      showCustomAchievementModal,
      editingAchievement,
      todayTasks: tasksByDate[selectedDate] || []
    }),
    // 添加setState方法
    setState: (newState) => {
      if (newState.showAchievementsModal !== undefined) setShowAchievementsModal(newState.showAchievementsModal);
      if (newState.showCustomAchievementModal !== undefined) setShowCustomAchievementModal(newState.showCustomAchievementModal);
      if (newState.unlockedAchievements !== undefined) setUnlockedAchievements(newState.unlockedAchievements);
      if (newState.customAchievements !== undefined) setCustomAchievements(newState.customAchievements);
      
    }
  };
  
  return () => {
    delete window.appInstance;
  };
}, [tasksByDate, templates, pointHistory, exchangeItems, customAchievements, unlockedAchievements, isInitialized, selectedDate, showAchievementsModal, showCustomAchievementModal, editingAchievement]);
  


// 成就检查逻辑
useEffect(() => {
  console.log('🔍 成就检查触发:', {
    isInitialized,
    tasksByDateCount: Object.keys(tasksByDate).length,
    unlockedAchievementsCount: unlockedAchievements.length
  });
  
  if (isInitialized && Object.keys(tasksByDate).length > 0) {
    const userData = {
      tasksByDate,
      templates,
      pointHistory,
      exchangeItems
    };
    
    const newlyUnlocked = checkAchievements(userData, unlockedAchievements, customAchievements);
    
    console.log('新解锁成就:', newlyUnlocked);
    
    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked);
      setUnlockedAchievements(prev => [
        ...prev,
        ...newlyUnlocked.map(ach => ach.id)
      ]);
      
      setTimeout(() => {
        setShowAchievementsModal(true);
      }, 1000);
    }
  }
}, [tasksByDate, isInitialized, unlockedAchievements, templates, pointHistory, exchangeItems, customAchievements]);









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
  
  
  


 
// ========== 计时器持久化修复 ==========

// 1. 修复计时器状态保存
useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeTimer) {
        const timerData = {
          taskId: activeTimer.taskId,
          startTime: activeTimer.startTime,
          elapsedTime: elapsedTime, // 保存当前经过的时间
          savedAt: Date.now()
        };
        localStorage.setItem(`${STORAGE_KEY}_activeTimer`, JSON.stringify(timerData));
        console.log('💾 页面关闭前保存计时器:', timerData);
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTimer, elapsedTime]);
  







// 暴露给控制台用于调试
useEffect(() => {
  window.debugTimer = {
    getState: () => ({
      activeTimer,
      elapsedTime,
      storage: localStorage.getItem(`${STORAGE_KEY}_activeTimer`)
    }),
    clear: clearTimerState, // ← 使用新的 clearTimerState 函数
    forceSave: () => {
      if (activeTimer) {
        const timerData = {
          ...activeTimer,
          elapsedTime: elapsedTime,
          savedAt: Date.now(),
          status: 'running'
        };
        localStorage.setItem(`${STORAGE_KEY}_activeTimer`, JSON.stringify(timerData));
        console.log('💾 强制保存:', timerData);
      }
    }
  };
}, [activeTimer, elapsedTime, clearTimerState]); // ← 添加 clearTimerState 依赖



// 修改 - 恢复计时器状态
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

// 修改 - 统一修改时间显示格式
const formatTimeNoSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m${remainingSeconds}s`;
};

// 修改 - 添加新的时间格式化函数，显示分钟和秒数
const formatTimeWithSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m${remainingSeconds}s`;
};

// 新增：分类标题专用时间格式（去掉0s）
const formatCategoryTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m${remainingSeconds}s`;
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


useEffect(() => {
  const initializeApp = async () => {
    // 先迁移旧数据
    await migrateLegacyData();
    
    try {
 



// 在 initializeApp 函数开始处添加这个辅助函数
const loadDataWithFallback = async (key, fallback) => {
  try {
    const data = await loadMainData(key);
    return data !== null ? data : fallback;
  } catch (error) {
    console.error(`加载 ${key} 失败:`, error);
    return fallback;
  }
};

// 然后替换现有的数据加载代码：

// 加载任务数据
const savedTasks = await loadDataWithFallback('tasks', {});
console.log('✅ 加载的任务数据:', savedTasks);
if (savedTasks) {
  setTasksByDate(savedTasks);
  console.log('✅ 任务数据设置成功，天数:', Object.keys(savedTasks).length);
} else {
  console.log('ℹ️ 没有任务数据，使用空对象');
  setTasksByDate({});
}

// 加载模板数据
const savedTemplates = await loadDataWithFallback('templates', []);
if (savedTemplates) {
  setTemplates(savedTemplates);
}

// 加载积分历史
const savedPointHistory = await loadDataWithFallback('pointHistory', []);
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
const savedExchangeItems = await loadDataWithFallback('exchange', []);
if (savedExchangeItems) {
  setExchangeItems(savedExchangeItems);
}

// 加载自定义成就
const savedCustomAchievements = await loadDataWithFallback('customAchievements', []);
if (savedCustomAchievements) {
  setCustomAchievements(savedCustomAchievements);
} else {
  setCustomAchievements([]);
}

// 加载已解锁成就
const savedUnlockedAchievements = await loadDataWithFallback('unlockedAchievements', []);
console.log('✅ 加载的已解锁成就:', savedUnlockedAchievements);
if (savedUnlockedAchievements) {
  setUnlockedAchievements(savedUnlockedAchievements);
} else {
  setUnlockedAchievements([]);
}

// 加载分类数据
const savedCategories = await loadDataWithFallback('categories', null);
if (savedCategories) {
  // 如果已有保存的分类，确保每个分类都有子类别
  const updatedCategories = savedCategories.map(cat => {
    let defaultSubCategories = [];
    switch(cat.name) {
      case '校内':
        defaultSubCategories = ["数学", "语文", "英语", "运动"];
        break;
      default:
        defaultSubCategories = [];
    }
    
    // 如果保存的分类没有子类别或子类别为空，使用预设值
    return {
      ...cat,
      subCategories: cat.subCategories && cat.subCategories.length > 0 
        ? cat.subCategories 
        : defaultSubCategories
    };
  });
  
  setCategories(updatedCategories);
  await saveMainData('categories', updatedCategories);
} else {
  // 没有保存的分类数据，使用预设值初始化
  const categoriesWithSubCategories = baseCategories.map(cat => {
    let subCategories = [];
    switch(cat.name) {
      case '校内':
        subCategories = ["数学", "语文", "英语", "运动"];
        break;
      default:
        subCategories = [];
    }
    return { ...cat, subCategories };
  });
  
  setCategories(categoriesWithSubCategories);
  await saveMainData('categories', categoriesWithSubCategories);
}



      // 设置定时备份
      localStorage.setItem('study-tracker-PAGE_A-v2_isInitialized', 'true');
      console.log('✅ 初始化状态已保存到存储');
      setIsInitialized(true);
      console.log('✅ isInitialized 设置为 true');

      const backupTimer = setInterval(autoBackup, AUTO_BACKUP_CONFIG.backupInterval);
      
      // 清理函数
      return () => {
        clearInterval(backupTimer);
      };

    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  initializeApp();
}, []);
//初始化end





// ==== 替换：调用 loadDailyData 的 useEffect ====
useEffect(() => {
  const loadData = async () => {
    if (isInitialized) {
      const today = new Date().toISOString().split("T")[0];
      const savedDailyData = await loadMainData(`daily_${today}`);
      if (savedDailyData) {
        setCurrentDailyRating(savedDailyData.rating || 0);
        setCurrentDailyMood(savedDailyData.mood || 0);
      }
      
      // 加载所有日期的复盘数据
      const allReflections = {};
      const allMoods = {};
      const allRatings = {};
      const allKeys = Object.keys(localStorage);
      const dailyKeys = allKeys.filter(key => key.startsWith(`${STORAGE_KEY}_daily_`));
      
      for (const key of dailyKeys) {
        try {
          const data = await loadMainData(key.replace(`${STORAGE_KEY}_`, ''));
          if (data && data.date) {
            allReflections[data.date] = data.reflection || '';
            allMoods[data.date] = data.mood || 0;
            allRatings[data.date] = data.rating || 0;
          }
        } catch (error) {
          console.error('加载每日数据失败:', key, error);
        }
      }
      setDailyMoods(allMoods);
      setDailyRatings(allRatings);
      setDailyReflections(allReflections);
    }
  };

  loadData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isInitialized]);




// ==== 保留：原来的成就检查 useEffect ====
useEffect(() => {
  if (isInitialized && Object.keys(tasksByDate).length > 0) {
    const userData = {
      tasksByDate,
      templates,
      pointHistory,
      exchangeItems
    };
    
    const newlyUnlocked = checkAchievements(userData, unlockedAchievements, customAchievements);
    
    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked);
      setUnlockedAchievements(prev => [
        ...prev,
        ...newlyUnlocked.map(ach => ach.id)
      ]);
      
      setTimeout(() => {
        setShowAchievementsModal(true);
      }, 1000);
    }
  }
}, [tasksByDate, isInitialized, unlockedAchievements, templates, pointHistory, exchangeItems, customAchievements]);











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



// 在组件中添加数据完整性检查函数
const checkDataIntegrity = async () => {
  console.log('🔍 开始数据完整性检查...');
  
  const integrityReport = {
    tasks: { exists: false, count: 0 },
    templates: { exists: false, count: 0 },
    customAchievements: { exists: false, count: 0 },
    unlockedAchievements: { exists: false, count: 0 },
    categories: { exists: false, count: 0 }
  };

  try {
    // 检查所有关键数据
    const tasks = await loadMainData('tasks');
    integrityReport.tasks.exists = !!tasks;
    integrityReport.tasks.count = tasks ? Object.keys(tasks).length : 0;

    const templates = await loadMainData('templates');
    integrityReport.templates.exists = !!templates;
    integrityReport.templates.count = templates ? templates.length : 0;

    const customAchievements = await loadMainData('customAchievements');
    integrityReport.customAchievements.exists = !!customAchievements;
    integrityReport.customAchievements.count = customAchievements ? customAchievements.length : 0;

    const unlockedAchievements = await loadMainData('unlockedAchievements');
    integrityReport.unlockedAchievements.exists = !!unlockedAchievements;
    integrityReport.unlockedAchievements.count = unlockedAchievements ? unlockedAchievements.length : 0;

    const categories = await loadMainData('categories');
    integrityReport.categories.exists = !!categories;
    integrityReport.categories.count = categories ? categories.length : 0;

    console.log('📊 数据完整性报告:', integrityReport);
    
    // 如果有数据缺失，尝试修复
    if (!integrityReport.tasks.exists) {
      console.log('⚠️ 任务数据缺失，重新初始化...');
      await saveMainData('tasks', {});
    }
    
    if (!integrityReport.customAchievements.exists) {
      console.log('⚠️ 自定义成就数据缺失，重新初始化...');
      await saveMainData('customAchievements', []);
    }
    
    if (!integrityReport.unlockedAchievements.exists) {
      console.log('⚠️ 已解锁成就数据缺失，重新初始化...');
      await saveMainData('unlockedAchievements', []);
    }

  } catch (error) {
    console.error('数据完整性检查失败:', error);
  }
};

// 在初始化时调用数据完整性检查
useEffect(() => {
  if (isInitialized) {
    checkDataIntegrity();
  }
}, [isInitialized]);

  

  


  // 替换现有的 useEffect 点击外部处理逻辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 检查是否点击了重复设置或计划时间的按钮
      const isRepeatButton = event.target.closest('button')?.textContent?.includes('重复');
      const isTimeButton = event.target.closest('button')?.textContent?.includes('计划时间');
      const isTemplateButton = event.target.closest('button')?.textContent?.includes('模板');
      
      // 新增：检查是否点击了自定义成就模态框
      const isCustomAchievementModal = event.target.closest('[style*="position: fixed"]')?.querySelector('h3')?.textContent?.includes('自定义成就');
  
      // 如果点击了这些功能按钮或模态框，不关闭输入框
      if (isRepeatButton || isTimeButton || isTemplateButton || isCustomAchievementModal) {
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

  // 详细调试：检查每个日期的任务
  console.log('=== 时间表详细调试 ===');
  weekDates.forEach(day => {
    const dayTasks = tasksByDate[day.date] || [];
    console.log(`日期 ${day.date} (${day.label}):`, {
      任务数量: dayTasks.length,
      任务列表: dayTasks.map(t => ({
        文本: t.text,
        timeSegments: t.timeSegments,
        scheduledTime: t.scheduledTime
      }))
    });
  });
  console.log('=== 调试结束 ===');

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
      // 使用正确的周一到周日日期范围
      dateRange = getWeekDates(currentMonday).map(d => d.date);
      console.log('📊 统计周日期范围:', dateRange);
    } else if (statsMode === "month") {
      // ... 月份逻辑保持不变
    } else {
      dateRange = getWeekDates(currentMonday).map(d => d.date);
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

// 修复 SubCategoryModal 的 onSave
const handleSaveSubCategories = (categoryName, subCategories) => {
  // 更新 categories 状态
  const updatedCategories = categories.map(cat => 
    cat.name === categoryName 
      ? { ...cat, subCategories }
      : cat
  );
  
  setCategories(updatedCategories);
  
  // 保存到本地存储
  saveMainData('categories', updatedCategories); // 添加这行
};




        


const handleAddTask = (template = null) => {
  console.log('=== 开始添加任务 ===');
  console.log('template:', template);
  console.log('newTaskText:', newTaskText);
  console.log('newTaskCategory:', newTaskCategory);
  console.log('selectedDate:', selectedDate);
  
  let text, category;

  if (template) {
    text = template.content;
    category = template.category;
    console.log('使用模板:', { text, category });
  } else {
    text = newTaskText.trim();
    category = newTaskCategory;
    console.log('手动输入:', { text, category });
    if (!text) {
      console.log('❌ 任务内容为空，停止添加');
      alert('请输入任务内容');
      return;
    }
  }

  // 检查当前选中的日期是否是今天
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  console.log('今天日期:', todayStr);
  
  if (selectedDate !== todayStr) {
    const confirmAdd = window.confirm(
      `当前选中的日期是 ${selectedDate}，不是今天(${todayStr})。确定要在这个日期添加任务吗？`
    );
    if (!confirmAdd) {
      console.log('❌ 用户取消在非今天日期添加');
      return;
    }
  }

  const baseTask = {
    id: Date.now().toString(),
    text,
    category,
    subCategory: newTaskSubCategory,
    done: false,
    timeSpent: 0,
    subTasks: [],
    note: "",
    reflection: "",
    image: null,
    scheduledTime: "",
    pinned: false,
    progress: {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    }
  };

  console.log('✅ 准备添加任务:', baseTask);

  setTasksByDate(prev => {
    console.log('=== 开始更新状态 ===');
    console.log('之前的 tasksByDate:', prev);
    
    const newTasksByDate = { ...prev };
    
    // 确保选中日期的任务数组存在
    if (!newTasksByDate[selectedDate]) {
      console.log('📅 创建新的日期数组:', selectedDate);
      newTasksByDate[selectedDate] = [];
    }

    // 检查是否已存在相同任务
    const existingTask = newTasksByDate[selectedDate].find(
      task => task.text === text && task.category === category
    );

    if (!existingTask) {
      newTasksByDate[selectedDate].push(baseTask);
      console.log(`✅ 任务已添加到 ${selectedDate}`, baseTask);
      console.log(`该日期现在有 ${newTasksByDate[selectedDate].length} 个任务`);
    } else {
      console.log('⚠️ 任务已存在，跳过添加');
    }

    console.log('更新后的 tasksByDate:', newTasksByDate);
    return newTasksByDate;
  });

  if (!template) {
    setNewTaskText("");
    setShowAddInput(false);
    setNewTaskSubCategory('');
    console.log('✅ 重置表单状态');
  }

  console.log('=== 添加任务完成 ===');
};



// 添加本周任务
const handleAddWeekTask = (text) => {
    if (!text.trim()) return;
  
    const weekDates = getWeekDates(currentMonday); // 这里使用 currentMonday
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


  



  const handleImportTasks = () => {
  console.log('🎯 === 开始批量导入 - 详细调试 ===');
  
  // 1. 检查输入内容
  if (!bulkText.trim()) {
    console.log('❌ 批量文本为空');
    alert('请输入要导入的任务内容');
    return;
  }
  console.log('✅ 批量文本内容:', bulkText);

  // 2. 解析文本
  const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
  console.log('✅ 解析后的行数:', lines.length, '内容:', lines);
  
  if (lines.length < 1) {
    console.log('❌ 没有有效内容');
    alert('请输入任务内容');
    return;
  }

  // 3. 确定分类和子分类
  const category = "校内"; // 固定分类
  let subCategory = "未分类";
  
  // 尝试从第一行提取子分类
  if (lines.length > 0) {
    const firstLine = lines[0];
    const subCategoryKeywords = ["数学", "语文", "英语", "运动"];
    const matched = subCategoryKeywords.find(k => firstLine.includes(k));
    if (matched) {
      subCategory = matched;
      console.log('✅ 检测到子分类:', subCategory);
    }
  }

  console.log('📝 最终分类:', { category, subCategory });

  // 4. 生成任务对象
  const taskLines = lines.length > 1 ? lines.slice(1) : lines;
  console.log('✅ 任务行:', taskLines);
  
  const newTasks = taskLines.map((line, index) => {
    const [taskText, note] = line.split("|").map(s => s.trim());
    
    return {
      id: `import_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      text: taskText || `导入任务${index + 1}`,
      category: category,
      subCategory: subCategory,
      done: false,
      timeSpent: 0,
      note: note || "",
      image: null,
      scheduledTime: "",
      pinned: false,
      reflection: "",
      tags: [...(bulkTags || [])],
      subTasks: [],
      progress: {
        initial: 0,
        current: 0,
        target: 0,
        unit: "%"
      }
    };
  });

  console.log('🎁 生成的新任务:', newTasks);

  // 5. 更新状态 - 使用函数式更新确保正确性
  setTasksByDate(prevTasksByDate => {
    console.log('🔄 开始更新 tasksByDate 状态');
    console.log('更新前的状态:', prevTasksByDate);
    
    // 创建新的对象
    const updatedTasksByDate = { ...prevTasksByDate };
    
    // 确保选中日期的数组存在
    if (!updatedTasksByDate[selectedDate]) {
      updatedTasksByDate[selectedDate] = [];
      console.log('📅 创建新的日期数组:', selectedDate);
    }
    
    console.log('更新前该日期的任务:', updatedTasksByDate[selectedDate]);

    // 添加新任务（避免重复）
    let addedCount = 0;
    newTasks.forEach(newTask => {
      const exists = updatedTasksByDate[selectedDate].some(
        existingTask => existingTask.text === newTask.text && existingTask.category === newTask.category
      );
      
      if (!exists) {
        updatedTasksByDate[selectedDate].push(newTask);
        addedCount++;
        console.log('✅ 添加任务:', newTask.text);
      } else {
        console.log('⚠️ 跳过重复任务:', newTask.text);
      }
    });

    console.log(`📊 成功添加 ${addedCount} 个任务`);
    console.log('更新后的状态:', updatedTasksByDate);
    console.log('更新后该日期的任务:', updatedTasksByDate[selectedDate]);
    
    return updatedTasksByDate;
  });

  // 6. 更新分类结构
  setCategories(prevCategories => {
    const categoryIndex = prevCategories.findIndex(c => c.name === category);
    if (categoryIndex >= 0) {
      const updatedCategories = [...prevCategories];
      const currentSubs = updatedCategories[categoryIndex].subCategories || [];
      
      if (!currentSubs.includes(subCategory)) {
        console.log('🏷️ 添加新子类别到分类:', subCategory);
        updatedCategories[categoryIndex].subCategories = [...currentSubs, subCategory];
      }
      
      return updatedCategories;
    }
    return prevCategories;
  });

  // 7. 清理和反馈
  setBulkText("");
  setBulkTags([]);
  setShowBulkInput(false);
  
  console.log('🎉 批量导入流程完成');
  
  // 8. 延迟检查结果
  setTimeout(() => {
    console.log('⏰ 延迟检查导入结果:');
    console.log('当前 tasksByDate:', tasksByDate);
    console.log('选中日期任务:', tasksByDate[selectedDate]);
    window.debugImport && window.debugImport();
  }, 500);
  
  alert(`成功导入 ${newTasks.length} 个任务到 ${selectedDate}！`);
};



// 修复 toggleSubTask 函数
const toggleSubTask = (task, subTaskIndex) => {
  const updateTaskWithSubTasks = (t) => {
    // 确保 subTasks 存在
    const currentSubTasks = t.subTasks || [];
    
    const newSubTasks = currentSubTasks.map((st, index) => 
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

 const saveTaskEdit = (task, editData) => {
  // 如果有重复设置，先删除原有的重复任务（如果是重复任务的话）
  if (task.repeatId) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].filter(t => 
          !(t.repeatId === task.repeatId)
        );
      });
      return newTasksByDate;
    });
  }

  // 如果有新的重复设置，创建重复任务
  if (editData.repeatFrequency) {
    const baseTask = {
      id: task.id || Date.now().toString(),
      text: editData.text,
      category: editData.category,
      subCategory: editData.subCategory || '',
      done: false,
      timeSpent: 0,
      subTasks: editData.subTasks || [],
      note: editData.note || "",
      reflection: editData.reflection || "",
      image: task.image || null,
      scheduledTime: editData.scheduledTime || "",
      pinned: editData.pinned || false,
      progress: editData.progress || {
        initial: 0,
        current: 0,
        target: 0,
        unit: "%"
      },
      tags: editData.tags || [],
      reminderTime: editData.reminderTime || null,
      repeatFrequency: editData.repeatFrequency,
      repeatDays: editData.repeatDays || [false, false, false, false, false, false, false],
      isRepeating: true,
      repeatId: task.repeatId || `repeat_${Date.now()}`
    };

    const startDate = new Date(selectedDate);
    
    if (editData.repeatFrequency === 'daily') {
      // 每日重复 - 未来7天
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        setTasksByDate(prev => {
          const newTasksByDate = { ...prev };
          if (!newTasksByDate[dateStr]) {
            newTasksByDate[dateStr] = [];
          }

          // 检查是否已存在相同任务
          const existingTask = newTasksByDate[dateStr].find(
            t => t.repeatId === baseTask.repeatId
          );

          if (!existingTask) {
            newTasksByDate[dateStr].push({
              ...baseTask,
              id: `${baseTask.repeatId}_${dateStr}`
            });
          }

          return newTasksByDate;
        });
      }
    } else if (editData.repeatFrequency === 'weekly') {
      // 每周重复
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (week * 7));
        const weekMonday = getMonday(weekStart);

        editData.repeatDays.forEach((isSelected, dayIndex) => {
          if (isSelected) {
            const taskDate = new Date(weekMonday);
            taskDate.setDate(weekMonday.getDate() + dayIndex);
            
            const year = taskDate.getFullYear();
            const month = String(taskDate.getMonth() + 1).padStart(2, '0');
            const day = String(taskDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const today = new Date(selectedDate);
            today.setHours(0, 0, 0, 0);
            const taskDateClean = new Date(taskDate);
            taskDateClean.setHours(0, 0, 0, 0);

            if (taskDateClean >= today) {
              setTasksByDate(prev => {
                const newTasksByDate = { ...prev };
                if (!newTasksByDate[dateStr]) {
                  newTasksByDate[dateStr] = [];
                }

                const existingTask = newTasksByDate[dateStr].find(
                  t => t.repeatId === baseTask.repeatId
                );

                if (!existingTask) {
                  newTasksByDate[dateStr].push({
                    ...baseTask,
                    id: `${baseTask.repeatId}_${dateStr}`
                  });
                }

                return newTasksByDate;
              });
            }
          }
        });
      }
    }
  } else {
    // 没有重复设置，只更新当前任务
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
            subCategory: editData.subCategory || '',
            progress: editData.progress,
            tags: editData.tags || [],
            subTasks: editData.subTasks || [],
            reminderTime: editData.reminderTime,
            repeatFrequency: '',
            repeatDays: [false, false, false, false, false, false, false],
            isRepeating: false
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
            subCategory: editData.subCategory || '',
            progress: editData.progress,
            tags: editData.tags || [],
            subTasks: editData.subTasks || [],
            reminderTime: editData.reminderTime,
            repeatFrequency: '',
            repeatDays: [false, false, false, false, false, false, false],
            isRepeating: false
          } : t
        )
      }));
    }
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


// 修改 getTasksBySubCategory 函数
const getTasksBySubCategory = (catName) => {
  const catTasks = todayTasks.filter(t => t.category === catName);
  const grouped = {};
  
  catTasks.forEach(task => {
    const subCat = task.subCategory || '未分类';
    if (!grouped[subCat]) {
      grouped[subCat] = [];
    }
    grouped[subCat].push(task);
  });
  
  return grouped;
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

     // 修复：清空成就数据
    setUnlockedAchievements([]);
    setNewAchievements([]);
    setCustomAchievements([]);
    
    
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

     // 清空初始化状态
    localStorage.removeItem('study-tracker-PAGE_A-v2_isInitialized');
    
    // 清空每日数据
    const today = new Date().toISOString().split("T")[0];
    await saveMainData(`daily_${today}`, {
      rating: 0,
      reflection: '',
      date: today
    });
  }
};



// 替换现有的 handleExportData 函数
const handleExportData = async () => {
  try {
    // ✅ 修复：导出所有关键数据
    const allData = {
      tasks: await loadDataWithFallback('tasks', {}),
      templates: await loadDataWithFallback('templates', []),
      exchange: await loadDataWithFallback('exchange', []),
      pointHistory: await loadDataWithFallback('pointHistory', []),
      customAchievements: await loadDataWithFallback('customAchievements', []),
      unlockedAchievements: await loadDataWithFallback('unlockedAchievements', []),
      categories: await loadDataWithFallback('categories', baseCategories),
      exportDate: new Date().toISOString(),
      version: '1.1'
    };
    
    // 验证数据完整性
    const dataStats = {
      任务天数: Object.keys(allData.tasks).length,
      模板数量: allData.templates.length,
      成就数量: allData.customAchievements.length,
      已解锁成就: allData.unlockedAchievements.length
    };
    console.log('📊 导出数据统计:', dataStats);
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `study-tracker-backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('✅ 数据导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试: ' + error.message);
  }
};




  
  
const DailyLogModal = ({ logData, onClose, onCopy, dailyMood, dailyRating, dailyReflection }) => {
  
  
   const moodOptions = [
    { emoji: '', label: '无', value: 0 },
    { emoji: '😊', label: '开心', value: 1 },
    { emoji: '😐', label: '平静', value: 2 },
    { emoji: '😔', label: '疲惫', value: 3 },
    { emoji: '😤', label: '烦躁', value: 4 },
    { emoji: '🤩', label: '充满活力', value: 5 },
    { emoji: '😴', label: '困倦', value: 6 }
  ];
  
  
  const totalHours = (logData.stats.totalMinutes / 60).toFixed(1);

  const generateFormattedContent = () => {
    return logData.content.replace(/✅/g, '');
  };

 
const generateMarkdownContent = () => {
  let markdown = `# 学习任务\n\n`;
  
  // 添加心情、评分和复盘内容到最上方
  if (dailyMood > 0 || dailyRating > 0 || getCurrentDailyReflection) {
    markdown += "## 💭 今日总结\n\n";
    
    // 心情显示
    if (dailyMood > 0) {
      const selectedMood = moodOptions.find(m => m.value === dailyMood);
      markdown += `- **心情**: ${selectedMood?.emoji} ${selectedMood?.label}\n`;
    }
    
    // 评分显示
    if (dailyRating > 0) {
      markdown += `- **评分**: ${'⭐'.repeat(dailyRating)} (${dailyRating}/5)\n`;
    }
    
    // 复盘显示
    if (dailyReflection) {
      markdown += `- **复盘**: ${dailyReflection}\n`;
    }
    
    markdown += "\n";
  }
  
  markdown += logData.markdownContent.replace('# 学习任务\n\n', '');
  return markdown;
};



  const formattedContent = generateFormattedContent();
  const markdownContent = generateMarkdownContent();

  // 在复制功能中使用 markdownContent
  const handleCopy = () => {
    onCopy(markdownContent); // 使用 markdownContent
  };

  return (
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
      zIndex: 1000,
      padding: '10px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        width: '95%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
  position: 'relative'
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 20, 
          color: '#1a73e8',
          fontSize: '18px',
          flexShrink: 0
        }}>
          📅 {logData.date} 学习汇总
        </h3>

        {/* 统计卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 20,
          flexShrink: 0
        }}>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 8,
            borderRadius: 8,
            textAlign: 'center',
            minHeight: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>完成任务</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.completedTasks} 个
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 8,
            borderRadius: 8,
            textAlign: 'center',
            minHeight: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>总任务数</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.totalTasks} 个
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 8,
            borderRadius: 8,
            textAlign: 'center',
            minHeight: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>完成率</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8' }}>
              {logData.stats.completionRate}%
            </div>
          </div>
          <div style={{
            backgroundColor: '#e8f0fe',
            padding: 8,
            borderRadius: 8,
            textAlign: 'center',
            minHeight: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>学习时长</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8' }}>
              {totalHours}h
            </div>
          </div>
        </div>
















        

<div style={{
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 12,
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
    flex: 1,
    minHeight: 'auto'
  }}>
    {/* 添加心情总结到最上方 */}
    {(dailyMood > 0 || dailyRating > 0 || dailyReflection) && (
      <>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: 8,
          color: '#1a73e8',
          borderBottom: '1px solid #1a73e8',
          paddingBottom: 4
        }}>
          === 今日总结 ===
        </div>
        
        {/* 心情显示 */}
        {dailyMood > 0 && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 'bold' }}>心情: </span>
            {(() => {
              const selectedMood = moodOptions.find(m => m.value === dailyMood);
              return `${selectedMood?.emoji} ${selectedMood?.label}`;
            })()}
          </div>
        )}
        
        {/* 评分显示 */}
        {dailyRating > 0 && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 'bold' }}>评分: </span>
            {'⭐'.repeat(dailyRating)} ({dailyRating}/5)
          </div>
        )}
        
        

        {/* 复盘显示 */}
{dailyReflection && (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>复盘:</div>
    <div style={{ 
      backgroundColor: '#fff9c4', 
      padding: 8, 
      borderRadius: 4,
      border: '1px solid #ffd54f'
    }}>
      {dailyReflection}
    </div>
  </div>
)}

<div style={{ 
  borderBottom: '1px solid #ccc', 
  margin: '12px 0',
  opacity: 0.5
}}></div>
</>
)}

{/* 任务内容 - 让未完成任务变灰 */}
{formattedContent.split('\n').map((line, index) => {
  const isIncompleteTask = line.includes('❌');
  
  return (
    <div
      key={index}
      style={{
        color: isIncompleteTask ? '#999' : '#000',
        filter: isIncompleteTask ? 'grayscale(100%) opacity(0.6)' : 'none',
        backgroundColor: 'transparent',
        // 移除 padding 和 margin，只保留颜色变化
        padding: '0',
        marginBottom: '0',
        borderRadius: '0'
      }}
    >
      {line || '\u00A0'}
    </div>
  );
})}
</div>


        
{/* 心情、评价、复盘区域（横排简洁版） */}
<div
  style={{
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#333',
  }}
>
 


 {/* 心情选择 - 第一行 */}
<div style={{ marginBottom: 12 }}>
  <label style={{ display: 'block', marginBottom: 4, color: '#555', textAlign: 'left' }}>心情：</label>
  <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
    {moodOptions.map((mood) => (
      <button
        key={mood.value}
        onClick={(e) => {
          e.preventDefault(); // 阻止默认行为
          e.stopPropagation(); // 阻止事件冒泡
          setCurrentDailyMood(mood.value);
        }}
        style={{
          flex: 1,
          padding: '6px 0',
          border: 'none',
          borderRadius: 6,
          backgroundColor: getCurrentDailyMood() === mood.value ? '#ffe066' : '#f1f3f4',
          fontSize: mood.emoji ? '18px' : '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: getCurrentDailyMood() === mood.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          minHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={mood.label}
      >
        {mood.emoji || '无'}
      </button>
    ))}
  </div>
</div>

{/* 评分选择 - 第二行 */}
<div style={{ marginBottom: 12 }}>
  <label style={{ display: 'block', marginBottom: 4, color: '#555' , textAlign: 'left'}}>评价：</label>
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={(e) => {
          e.preventDefault(); // 阻止默认行为
          e.stopPropagation(); // 阻止事件冒泡
          setCurrentDailyRating(star);
        }}
        style={{
          flex: 1,
          padding: '6px 0',
          border: 'none',
          borderRadius: 6,
          backgroundColor: getCurrentDailyRating() >= star ? '#ffe066' : '#f1f3f4',
          fontSize: 18,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: getCurrentDailyRating() >= star ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          minHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ⭐
      </button>
    ))}
  </div>
</div>
  


  
</div>







        {/* 按钮区域 */}
        <div style={{ 
          display: 'flex', 
          gap: 10,
          flexShrink: 0
        }}>
         <button
  onClick={onClose}
  style={{
    position: 'absolute',
    top: 10,
    right: 10,
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
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
           <button
        onClick={handleCopy}
        style={{
          flex: 1,
          padding: 12,
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 'bold'
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
      overflowX: "hidden", // 防止横向滚动
  width: "100%", // 确保宽度100%
  boxSizing: "border-box" // 包含padding在宽度内
    }}>

      {/* 所有模态框组件 */}
      {showImageModal && (
        <ImageModal
          imageUrl={showImageModal}
          onClose={() => setShowImageModal(null)}
        />
      )}

{/* 迁移任务模态框 */}
{showMoveTaskModal && (
      <TaskMoveModal
        task={showMoveTaskModal}
        onClose={() => setShowMoveTaskModal(null)}
        onMove={moveTaskToDate}
        categories={categories}
        tasksByDate={tasksByDate}
      />
    )}



{console.log('渲染时 showCustomAchievementModal:', showCustomAchievementModal) || null}
{showCustomAchievementModal && (
  <CustomAchievementModal
    onSave={(achievement) => {
      console.log('保存成就:', achievement);
      if (editingAchievement) {
        handleEditCustomAchievement(achievement);
      } else {
        handleAddCustomAchievement(achievement);
      }
    }}
    onClose={() => {
      console.log('🔴 CustomAchievementModal onClose 被调用了！'); // 添加这行
      setShowCustomAchievementModal(false);
      setEditingAchievement(null);
    }}
    editAchievement={editingAchievement}
  />
)}

{/* 子类别管理模态框 */}
{editingCategory && (
  <SubCategoryModal
    category={editingCategory}
    onSave={handleSaveSubCategories}
    onClose={() => setEditingCategory(null)}
  />
)}



 
      {/* 成就模态框 */}
      {showAchievementsModal && (
  <AchievementsModal
    achievements={newAchievements}
    onClose={() => {
      setShowAchievementsModal(false);
      setNewAchievements([]);
    }}
    isNew={newAchievements.length > 0}
    unlockedAchievements={unlockedAchievements}
    onAddCustom={() => {
      console.log('开始设置 showCustomAchievementModal 为 true');
      setShowCustomAchievementModal(true);
      console.log('设置 showCustomAchievementModal 为 true');
  
      // 添加一个延时检查状态
      setTimeout(() => {
        console.log('当前 showCustomAchievementModal 状态:', showCustomAchievementModal);
      }, 100);
    }}
    onEditCustom={handleOpenCustomAchievementModal}
    onDeleteCustom={handleDeleteCustomAchievement}
    customAchievements={customAchievements}
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

      const generateFullContent = () => {
        let content = '';
        
        // 添加心情、评分和复盘内容到最上方
        if (dailyMood > 0 || dailyRating > 0 || getCurrentDailyReflection()) {
          content += "=== 今日总结 ===\n";
          
          // 心情显示
          if (dailyMood > 0) {
            const selectedMood = moodOptions.find(m => m.value === dailyMood);
            content += `心情: ${selectedMood?.emoji} ${selectedMood?.label}\n`;
          }
          
          // 评分显示
          if (dailyRating > 0) {
            content += `评分: ${'⭐'.repeat(dailyRating)} (${dailyRating}/5)\n`;
          }
          
          // 修复：确保 currentReflection 被使用
          const currentReflection = getCurrentDailyReflection();
          if (currentReflection) {
            content += `复盘:\n${currentReflection}\n`; // 这里使用它
          }
          
          content += "\n";
        }
        
        content += showDailyLogModal.content.replace(/✅/g, '');
        return content;
      };





      const fullContent = generateFullContent();
      
      copyToClipboard(fullContent).then(() => {
        alert('日志已复制到剪贴板！');
      }).catch(() => {
        alert('复制失败，请手动复制日志内容');
      });
    }}
    dailyMood={dailyMood}
    dailyRating={dailyRating}
    dailyReflection={getCurrentDailyReflection()} // 这里也要改为使用新函数
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
          categories={categories}
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

      {/* 跨日期任务模态框 */}
{showCrossDateModal && (
  <CrossDateModal
    task={showCrossDateModal}
    onClose={() => setShowCrossDateModal(null)}
    onSave={handleCrossDateTask}
    selectedDate={selectedDate}
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
          tasksByDate={tasksByDate}  // 添加这行
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
    // ==== 添加这行 ====
    setShowMoveTaskModal={setShowMoveTaskModal}
    setShowCrossDateModal={setShowCrossDateModal}
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
        marginTop: "-5px",      // 确保为0
        marginBottom: "10px",  // 调整下边距
        paddingTop: "0px"      // 确保为0
      }}>
        汤圆学习记录
      </h1>
      <div style={{
        textAlign: "center",
        fontSize: 13,
        marginTop: "-5px",      // 确保为0
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


{/* 日期选择器 */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
}}>
  {getWeekDates(currentMonday).map((d) => {
    const today = new Date();
    // 使用本地日期格式，不要用 toISOString()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
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
          backgroundColor: isToday ? "#1a73e8" : (isSelected ? "#fff9c4" : "transparent"),
          color: isToday ? "#fff" : (isSelected ? "#000" : "#000"),
          borderRadius: isSelected ? "4px" : "0",
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
      activeTimer={activeTimer}  // 添加这行
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
    activeTimer={activeTimer}  // 添加这行
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
            

{/* 分类标题 */}
<div
  onClick={() => setCollapsedCategories(prev => ({
    ...prev,
    [c.name]: !prev[c.name]
  }))}
  style={{
    backgroundColor: isComplete ? "#f0f0f0" : c.color,
    color: isComplete ? "#888" : "#fff",
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
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span>
      {c.name} ({getCategoryTasks(c.name).filter(t => t.done).length}/{getCategoryTasks(c.name).length})
      {isComplete && " ✓"}
    </span>
    
    {/* 子类别管理按钮 */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditingCategory(c);
      }}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#fff',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '10px',
        padding: '1px 6px'
      }}
      title="管理子类别"
    >
      📁
    </button>
  </div>

  {/* 将计时器和时间显示移到右边 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {/* 分类计时器按钮 */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (activeTimer?.category === c.name && !activeTimer?.subCategory) {
          handlePauseCategoryTimer(c.name);
        } else {
          handleStartTimer({
            category: c.name
          });
        }
      }}
      style={{
        background: 'transparent',
        border: 'none',
        color: isComplete ? "#888" : "#fff",
        cursor: 'pointer',
        fontSize: '12px',
        padding: '1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title={activeTimer?.category === c.name && !activeTimer?.subCategory ? "暂停分类计时" : "开始分类计时"}
    >
      {activeTimer?.category === c.name && !activeTimer?.subCategory ? "⏸️" : "⏱️"}
    </button>

    {/* 时间显示 */}
   {/* 时间显示 - 优化版本 */}
<span
  onClick={(e) => {
    e.stopPropagation();
    editCategoryTime(c.name);
  }}
  style={{
    fontSize: 11, // 稍微减小字体
    color: isComplete ? "#888" : "#fff",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "rgba(255,255,255,0.2)",
    minWidth: "50px", // 确保最小宽度
    maxWidth: "70px", // 限制最大宽度
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis", // 文字过多显示...
    flexShrink: 0, // 防止被压缩
    fontFamily: "monospace" // 等宽字体，显示更整齐
  }}
  title="点击修改总时间"
>
  {(() => {
    const baseTime = totalTime(c.name);
    if (activeTimer?.category === c.name && !activeTimer?.subCategory) {
      return formatCategoryTime(baseTime + elapsedTime);
    }
    return formatCategoryTime(baseTime);
  })()}
</span>
  </div>
</div>


{!isCollapsed && (
  <div style={{ padding: 8 }}>
    {(() => {
      const subCategoryTasks = getTasksBySubCategory(c.name);
      const subCategoryKeys = Object.keys(subCategoryTasks);
      
      return subCategoryKeys.map((subCat) => {
        const subCatTasks = subCategoryTasks[subCat];
        const subCatKey = `${c.name}_${subCat}`;
        const allDone = subCatTasks.length > 0 && subCatTasks.every(task => task.done);
        
        // 自动折叠逻辑：如果全部完成且用户没有手动展开，则自动折叠
        const isSubCollapsed = collapsedSubCategories[subCatKey] !== undefined 
          ? collapsedSubCategories[subCatKey] 
          : allDone; // 如果用户没有手动设置，全部完成时自动折叠
        
        // add - 计算子类别总时间
        const subCategoryTotalTime = subCatTasks.reduce((sum, task) => {
          const taskTime = task.timeSpent || 0;
          // 如果任务正在计时，加上实时计时
          if (activeTimer && activeTimer.taskId === task.id) {
            return sum + taskTime + elapsedTime;
          }
          return sum + taskTime;
        }, 0);
        // end
        
        return (
          <div key={subCat} style={{ marginBottom: 8 }}>
            <div
              onClick={() => setCollapsedSubCategories(prev => ({
                ...prev,
                [subCatKey]: !isSubCollapsed
              }))}
              style={{
                backgroundColor: allDone ? '#e8f5e8' : '#f0f0f0',
                color: '#333',
                padding: '4px 8px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '4px',
                border: allDone ? '1px solid #4CAF50' : 'none'
              }}
            >
              <span>
                {subCat} ({subCatTasks.filter(t => t.done).length}/{subCatTasks.length})
                {allDone && " ✓"}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
              <button
  onClick={(e) => {
    e.stopPropagation();
    const currentSubCat = subCat === '未分类' ? null : subCat;
    if (activeTimer?.category === c.name && activeTimer?.subCategory === currentSubCat) {
      handlePauseCategoryTimer(c.name, currentSubCat);
    } else {
      handleStartTimer({
        category: c.name,
        subCategory: currentSubCat
      });
    }
  }}
  style={{
    background: 'transparent',
    border: 'none',
    color: '#333',
    cursor: 'pointer',
    fontSize: '10px',
    padding: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
  title={activeTimer?.category === c.name && activeTimer?.subCategory === (subCat === '未分类' ? null : subCat) ? "暂停子分类计时" : "开始子分类计时"}
>
  {activeTimer?.category === c.name && activeTimer?.subCategory === (subCat === '未分类' ? null : subCat) ? "⏸️" : "⏱️"}
</button>

               
               
                {/* add - 子类别计时器开始 */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTime = window.prompt(`修改 ${subCat} 子类别总时间（分钟）`, Math.floor(subCategoryTotalTime / 60));
                    if (newTime !== null && !isNaN(newTime) && newTime >= 0) {
                      const seconds = parseInt(newTime) * 60;
                      const timeDifference = seconds - subCategoryTotalTime;
                      
                      if (timeDifference !== 0 && subCatTasks.length > 0) {
                        // 平均分配到每个任务
                        const timePerTask = Math.floor(timeDifference / subCatTasks.length);
                        
                        setTasksByDate(prev => {
                          const newTasksByDate = { ...prev };
                          const todayTasks = newTasksByDate[selectedDate] || [];
                          
                          newTasksByDate[selectedDate] = todayTasks.map(t => 
                            t.category === c.name && t.subCategory === subCat 
                              ? { ...t, timeSpent: (t.timeSpent || 0) + timePerTask }
                              : t
                          );
                          
                          return newTasksByDate;
                        });
                      }
                    }
                  }}
                  style={{
                    fontSize: '11px',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    whiteSpace: 'nowrap'
                  }}
                  title="点击修改子类别总时间"
                  >
                  {(() => {
                    const baseTime = subCategoryTotalTime;
                    // 如果这个子分类正在计时，加上实时计时
                    const currentSubCat = subCat === '未分类' ? null : subCat;
                    if (activeTimer?.category === c.name && activeTimer?.subCategory === currentSubCat) {
                      return formatCategoryTime(baseTime + elapsedTime);
                    }
                    return formatCategoryTime(baseTime);
                  })()}
                  </span>



                 
        
                {/* end - 子类别计时器结束 */}
                
                
              </div>
            </div>
            
            {!isSubCollapsed && (
              <ul style={{
                listStyle: "none",
                padding: "0 0 0 8px",
                margin: 0,
                borderLeft: "2px solid #e0e0e0"
              }}>
                {subCatTasks
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
                      categories={baseCategories}
                      activeTimer={activeTimer}
                      setShowMoveModal={setShowMoveModal}
                      onUpdateProgress={handleUpdateProgress}
                      onStartTimer={handleStartTimer}
                      onPauseTimer={handlePauseTimer}
                      onEditSubTask={editSubTask}
                      onToggleSubTask={toggleSubTask}
                      isTimerRunning={activeTimer?.taskId === task.id}
                      elapsedTime={elapsedTime}
                    />
                  ))}
              </ul>
            )}
          </div>
        );
      });
    })()}
  </div>
)}
</div>
);
})}








<div style={{ marginBottom: 10 }}>
  {/* 复盘输入框 - 点击弹窗 */}
  <div style={{
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '12px',
    marginBottom: 8
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }}>
      {/* 左边：复盘标签 */}
      <div style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        minWidth: '40px',
        paddingTop: '4px'
      }}>
        复盘
      </div>
      
      {/* 右边：输入框（点击弹窗） */}
      <div style={{ flex: 1 }}>
        <div
          onClick={() => setShowReflectionModal(true)}
          style={{
            width: '100%',
            minHeight: '20px', // 只有1排高度
            maxHeight: '60px', // 最大3排
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 14,
            lineHeight: 1.5,
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        >
          {getCurrentDailyReflection()  || '点击输入今日复盘内容...'}
        </div>
      </div>
    </div>
  </div>
</div>


{showReflectionModal && (
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
      maxHeight: '80vh'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
        今日复盘
      </h3>
      
      <textarea
        value={getCurrentDailyReflection()}
        onChange={(e) => setCurrentDailyReflection(e.target.value)}
        placeholder="记录今日的学习收获、反思和改进点..."
        style={{
          width: '100%',
          minHeight: 200,
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1.5,
          resize: 'vertical',
          backgroundColor: '#fafafa',
          fontFamily: 'inherit',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}
        autoFocus
      />
      
      <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
        <button
          onClick={() => setShowReflectionModal(false)}
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
          onClick={() => {
            saveDailyData();
            setShowReflectionModal(false);
          }}
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
)}




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



{/* 在添加任务按钮区域后面添加子类别选择 */}
{newTaskCategory && categories.find(c => c.name === newTaskCategory)?.subCategories?.length > 0 && (
  <div style={{ marginBottom: 8 }}>
    <label style={{
      display: 'block',
      marginBottom: 8,
      fontWeight: '600',
      color: '#333',
      fontSize: 14
    }}>
      子类别
    </label>
    <select
      value={newTaskSubCategory || ''}
      onChange={(e) => setNewTaskSubCategory(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '2px solid #e0e0e0',
        borderRadius: 6,
        fontSize: 14,
        backgroundColor: '#fafafa',
        cursor: 'pointer'
      }}
    >
      <option value="">选择子类别（可选）</option>
      {categories.find(c => c.name === newTaskCategory)?.subCategories?.map(subCat => (
        <option key={subCat} value={subCat}>{subCat}</option>
      ))}
    </select>
  </div>
)}

        </div>
      )}

     
     {showBulkInput && (
  <div ref={bulkInputRef} style={{ marginTop: 8 }}>
    <textarea
      value={bulkText}
      onChange={(e) => setBulkText(e.target.value)}
      placeholder="第一行：主任务内容
第二行及以后：子任务（每行一个子任务）"
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

    {/* 标签选择区域 */}
    <div style={{ margin: "8px 0" }}>
      <div style={{ marginBottom: 5, fontWeight: "bold", fontSize: 14 }}>选择标签:</div>

     {/* 标签显示 + 添加标签 */}
<div
  style={{
    display: "flex",
    alignItems: "stretch",   // 两边高度一致
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
    width: "100%"
  }}
>
  
{/* 标签显示 + 添加标签 */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 8,
    marginBottom: 8
  }}
>
  {/* 已选标签显示 */}
  <div
    style={{
      flex: "0 0 50%",
      width: "50%",
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 8px",
      border: "1px solid #ddd",
      borderRadius: 6,
      backgroundColor: "#fafafa",
      height: 36,                // ✅ 固定高度
      boxSizing: "border-box",
      overflowX: "auto",         // ✅ 横向滚动
      whiteSpace: "nowrap",      // ✅ 不换行
      scrollbarWidth: "thin"     // 🔹 Firefox 细滚动条
    }}
  >
    {bulkTags?.length > 0 ? (
      bulkTags.map((tag, index) => (
        <span
          key={index}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,            // ✅ 更小
            padding: "2px 6px",      // ✅ 紧凑
            backgroundColor: tag.color || "#e0e0e0",
            color: "#333",
            borderRadius: 10,
            border: "1px solid #ccc",
            height: 20,
            lineHeight: "1",
            flexShrink: 0            // ✅ 防止被压缩
          }}
        >
          {tag.name}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const newTags = [...bulkTags];
              newTags.splice(index, 1);
              setBulkTags(newTags);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              padding: 0,
              width: 14,
              height: 14,
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>
        </span>
      ))
    ) : (
      <span style={{ fontSize: 11, color: "#999" }}>暂无标签，可在右侧添加</span>
    )}
  </div>

  {/* 添加新标签 */}
  <div
    style={{
      flex: "0 0 50%",
      width: "50%",
      display: "flex",
      alignItems: "center",
      gap: 6,
      boxSizing: "border-box",
      height: 36                 // ✅ 与左侧等高
    }}
  >
    <input
      type="text"
      placeholder="标签名"
      value={bulkNewTagName}
      onChange={(e) => setBulkNewTagName(e.target.value)}
      style={{
        flex: 1,
        height: "100%",
        padding: "6px 8px",
        border: "1px solid #ddd",
        borderRadius: 6,
        fontSize: 12,
        boxSizing: "border-box"
      }}
    />
    <input
      type="color"
      value={bulkNewTagColor}
      onChange={(e) => setBulkNewTagColor(e.target.value)}
      style={{
        width: 34,
        height: "100%",
        border: "1px solid #ddd",
        borderRadius: 6,
        padding: 0,
        cursor: "pointer"
      }}
    />
    <button
      type="button"
      onClick={() => {
        if (bulkNewTagName?.trim()) {
          const newTag = {
            name: bulkNewTagName.trim(),
            color: bulkNewTagColor || "#e0e0e0"
          };
          const updatedTags = [...(bulkTags || []), newTag];
          setBulkTags(updatedTags);
          setBulkNewTagName("");
          setBulkNewTagColor("#e0e0e0");
        }
      }}
      style={{
        height: "100%",
        padding: "0 12px",
        backgroundColor: "#1a73e8",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 12,
        whiteSpace: "nowrap"
      }}
    >
      添加
    </button>
  </div>
</div>
</div>



     
      {/* 常用标签 */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>常用标签:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {[
            { name: "重要", color: "#ff4444" },
            { name: "紧急", color: "#ff9800" },
            { name: "复习", color: "#4caf50" },
            { name: "预习", color: "#2196f3" },
            { name: "作业", color: "#9c27b0" },
            { name: "考试", color: "#e91e63" },
            { name: "背诵", color: "#795548" },
            { name: "练习", color: "#607d8b" }
          ].map((tag, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                const existingTags = bulkTags || [];
                const isAlreadyAdded = existingTags.some((t) => t.name === tag.name);
                if (!isAlreadyAdded) {
                  setBulkTags([...existingTags, tag]);
                }
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: tag.color,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 11
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* 导入任务按钮 */}
<button
  onClick={(e) => {
    console.log('🎯 === 批量导入按钮被点击 ===');
    console.log('批量文本内容:', bulkText);
    console.log('批量标签:', bulkTags);
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
        borderRadius: 10,
  maxWidth: "100%", // 确保不超出容器
  overflow: "hidden"
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

        // ✅ 修复：增强数据验证
        if (!importedData.tasks || !importedData.version) {
          throw new Error('无效的数据文件格式');
        }

        // 显示导入预览
        const importStats = {
          任务天数: Object.keys(importedData.tasks || {}).length,
          模板数量: (importedData.templates || []).length,
          成就数量: (importedData.customAchievements || []).length,
          版本: importedData.version || '未知'
        };
        
        const confirmMessage = `确定要导入以下数据吗？\n` +
          `• 任务天数: ${importStats.任务天数}\n` +
          `• 模板数量: ${importStats.模板数量}\n` +
          `• 成就数量: ${importStats.成就数量}\n` +
          `• 数据版本: ${importStats.版本}\n\n` +
          `这将覆盖当前所有数据！`;

        if (window.confirm(confirmMessage)) {
          console.log('🔄 开始导入数据...', importStats);
          
          // 使用 loadDataWithFallback 确保数据完整性
          await saveMainData('tasks', importedData.tasks || {});
          await saveMainData('templates', importedData.templates || []);
          await saveMainData('exchange', importedData.exchange || []);
          await saveMainData('pointHistory', importedData.pointHistory || []);
          
          // ✅ 修复：导入所有关键数据
          await saveMainData('customAchievements', importedData.customAchievements || []);
          await saveMainData('unlockedAchievements', importedData.unlockedAchievements || []);
          await saveMainData('categories', importedData.categories || baseCategories);
          
          // 更新状态
          setTasksByDate(importedData.tasks || {});
          setTemplates(importedData.templates || []);
          setExchangeItems(importedData.exchange || []);
          setPointHistory(importedData.pointHistory || []);
          setCustomAchievements(importedData.customAchievements || []);
          setUnlockedAchievements(importedData.unlockedAchievements || []);
          setCategories(importedData.categories || baseCategories);
          
          console.log('✅ 所有数据导入完成');
          
          // 添加延迟确保状态更新完成
          setTimeout(() => {
            alert('数据导入成功！页面将重新加载以应用更改。');
            window.location.reload();
          }, 1000);
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
 
        {/* 在这里添加成就按钮 */}
        <button
          onClick={() => setShowAchievementsModal(true)}
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
          我的成就
        </button>

      </div>
    </div>
  );
}


  
  
  export default App;
