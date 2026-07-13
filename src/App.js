/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

/* eslint-disable react-hooks/exhaustive-deps */  // 添加这一行
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';







// 搜索任务模态框组件
const SearchTaskModal = ({ tasksByDate, onClose }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // 获取所有任务
  const getAllTasks = useCallback(() => {
    const allTasks = [];
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      tasks.forEach(task => {
        allTasks.push({
          ...task,
          date: date
        });
      });
    });
    return allTasks;
  }, [tasksByDate]);
  
  // 执行搜索
 // 执行搜索
const performSearch = useCallback(() => {
  // ✅ 关键修复：没有关键词时，清空结果，不显示任何任务
  if (!searchKeyword.trim()) {
    setSearchResults([]);
    return;
  }
  
  let allTasks = getAllTasks();
  
  // 关键词过滤
  const keyword = searchKeyword.trim().toLowerCase();
  allTasks = allTasks.filter(task => 
    task.text.toLowerCase().includes(keyword) ||
    (task.note && task.note.toLowerCase().includes(keyword)) ||
    (task.reflection && task.reflection.toLowerCase().includes(keyword))
  );
  
  // 分类过滤
  if (selectedCategory !== 'all') {
    allTasks = allTasks.filter(task => task.category === selectedCategory);
  }
  
  // 状态过滤
  if (selectedStatus === 'completed') {
    allTasks = allTasks.filter(task => task.done === true && task.abandoned !== true);
  } else if (selectedStatus === 'incomplete') {
    allTasks = allTasks.filter(task => task.done !== true && task.abandoned !== true);
  } else if (selectedStatus === 'abandoned') {
    allTasks = allTasks.filter(task => task.abandoned === true);
  }
  
  // 按日期倒序排序
  allTasks.sort((a, b) => b.date.localeCompare(a.date));
  
  setSearchResults(allTasks);
}, [searchKeyword, selectedCategory, selectedStatus, getAllTasks]);
  // 监听搜索条件变化
  useEffect(() => {
    performSearch();
  }, [searchKeyword, selectedCategory, selectedStatus, performSearch]);
  
  // 获取所有分类（用于筛选）
  const categories = useMemo(() => {
    const cats = new Set();
    getAllTasks().forEach(task => {
      cats.add(task.category);
    });
    return ['all', ...Array.from(cats)];
  }, [getAllTasks]);
  
  // 统计信息
  const stats = {
    total: searchResults.length,
    completed: searchResults.filter(t => t.done === true && t.abandoned !== true).length,
    incomplete: searchResults.filter(t => t.done !== true && t.abandoned !== true).length,
    abandoned: searchResults.filter(t => t.abandoned === true).length
  };
  
  // 获取任务状态样式
  const getTaskStatusIcon = (task) => {
    if (task.abandoned) {
      return <span style={{ color: '#999', fontSize: '12px' }}>❌</span>;
    }
    if (task.done) {
      return <span style={{ color: '#4caf50', fontSize: '12px' }}>✅</span>;
    }
    return <span style={{ color: '#f44336', fontSize: '12px' }}>⬜</span>;
  };
  
  // 获取分类颜色
  const getCategoryColor = (category) => {
    const colors = {
      '语文': '#FFFCE8',
      '数学': '#E8F5E9',
      '英语': '#FCE4EC',
      '通识': '#E1F5FE',
      '运动': '#E3F2FD',
      '校内': '#61A2Da'
    };
    return colors[category] || '#f0f0f0';
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
      padding: '10px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* 标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0, color: '#61A2Da', fontSize: '16px' }}>
            🔍 搜索任务
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>
        
        {/* 搜索输入框 */}
        <div style={{ marginBottom: '12px', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="输入关键词搜索任务、备注或感想..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        {/* 筛选栏 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px', 
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: '1px solid #ddd',
              fontSize: '12px',
              backgroundColor: '#fff'
            }}
          >
            <option value="all">全部分类</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {/* 状态筛选 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: '1px solid #ddd',
              fontSize: '12px',
              backgroundColor: '#fff'
            }}
          >
            <option value="all">全部状态</option>
            <option value="completed">✅ 已完成</option>
            <option value="incomplete">⬜ 未完成</option>
            <option value="abandoned">❌ 已放弃</option>
          </select>
        </div>
        
        {/* 统计信息 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          flexShrink: 0
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#666' }}>找到</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a73e8' }}>{stats.total}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#666' }}>已完成</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>{stats.completed}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#666' }}>未完成</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>{stats.incomplete}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#666' }}>已放弃</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#999' }}>{stats.abandoned}</div>
          </div>
        </div>
        
      
{/* 搜索结果列表 */}
<div style={{
  flex: 1,
  overflowY: 'auto',
  minHeight: 0
}}>
  {!searchKeyword.trim() ? (
    // 没有输入关键词时，显示提示
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: '#999',
      fontSize: '13px'
    }}>
      🔍 输入关键词开始搜索
    </div>
  ) : searchResults.length === 0 ? (
    // 有关键词但没有结果
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: '#999',
      fontSize: '13px'
    }}>
      没有找到匹配的任务
    </div>
  ) : (
    // 显示搜索结果
    searchResults.map((task, idx) => (
      <div
        key={`${task.id}_${idx}`}
        style={{
          padding: '12px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
          borderRadius: '8px',
          marginBottom: '8px'
        }}
      >


                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {/* 状态图标 */}
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {getTaskStatusIcon(task)}
                  </div>
                  
                  {/* 主要内容 */}
                  <div style={{ flex: 1 }}>
                    {/* 任务文本 */}
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: task.done ? '#999' : '#333',
                      textDecoration: task.done ? 'line-through' : 'none',
                      marginBottom: '4px'
                    }}>
                      {task.text}
                    </div>
                    
                    {/* 元信息 */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '10px',
                      color: '#999',
                      marginBottom: '4px'
                    }}>
                      <span>📅 {task.date.slice(5)}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        backgroundColor: getCategoryColor(task.category),
                        color: task.category === '校内' ? '#fff' : '#333'
                      }}>
                        {task.category}{task.subCategory ? ` / ${task.subCategory}` : ''}
                      </span>
                      {task.timeSpent > 0 && (
                        <span>⏱ {Math.floor(task.timeSpent / 60)}分钟</span>
                      )}
                    </div>
                    
                    {/* 备注预览 */}
                    {task.note && (
                      <div style={{
                        fontSize: '11px',
                        color: '#666',
                        backgroundColor: '#f5f5f5',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                         {task.note}
                      </div>
                    )}
                    
                    {/* 感想预览 */}
                    {task.reflection && (
                      <div style={{
                        fontSize: '11px',
                        color: '#8B4513',
                        backgroundColor: '#fff9c4',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        💡 {task.reflection}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 关闭按钮 */}
        <div
          onClick={onClose}
          style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: '#61A2Da',
            color: '#fff',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          关闭
        </div>
      </div>
    </div>
  );
};

// 科目待办模态框 - 在 SubjectGuideModal 组件后面添加
const SubjectTodoModal = ({ onClose, isVisible, tasksByDate = {} }) => {
  const [forceUpdate, setForceUpdate] = useState(Date.now());
  const [activeTab, setActiveTab] = useState('数学');
  const [expandedTodoId, setExpandedTodoId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('regular');
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('subject_todo_entries_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const tabs = ['数学', '语文', '英语', '其他'];

  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('subject_todo_entries_v2', JSON.stringify(todos));
  }, [todos]);

 // 在 SubjectTodoModal 组件中，修改 currentTodos 的处理逻辑
const currentTodos = todos[activeTab] || [];

// 分离重点和常规任务，并分别排序（未完成在上，已完成在下）
const getSortedTodos = (todos, isImportant) => {
  const filtered = todos.filter(todo => 
    isImportant ? todo.priority === 'important' : todo.priority !== 'important'
  );
  // 未完成的排前面，已完成的排后面
  return [...filtered.filter(t => !t.done), ...filtered.filter(t => t.done)];
};

const importantTodos = getSortedTodos(currentTodos, true);
const regularTodos = getSortedTodos(currentTodos, false);

  // 查找关联任务
  const findRelatedTasks = useCallback((keyword) => {
    if (!keyword || !tasksByDate) return [];
    
    const relatedTasks = [];
    
    const getSearchCategories = (tab) => {
      switch(tab) {
        case '数学':
          return ['数学', '校内-数学'];
        case '语文':
          return ['语文', '校内-语文'];
        case '英语':
          return ['英语', '校内-英语'];
        case '其他':
          return ['通识', '运动', '其他', '校内'];
        default:
          return [tab];
      }
    };
    
    const searchCategories = getSearchCategories(activeTab);
    
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      tasks.forEach(task => {
        if (task.done === true && task.text && task.text.includes(keyword)) {
          let taskCategory = task.category;
          if (task.category === '校内' && task.subCategory) {
            taskCategory = `校内-${task.subCategory}`;
          }
          
          const isCategoryMatch = searchCategories.some(cat => 
            taskCategory === cat || taskCategory.includes(cat)
          );
          
          if (isCategoryMatch) {
            const timeMinutes = Math.floor((task.timeSpent || 0) / 60);
            relatedTasks.push({
              id: task.id,
              text: task.text,
              date: date,
              timeMinutes: timeMinutes,
              timeDisplay: timeMinutes > 0 ? `${timeMinutes}分钟` : '未记录',
              category: task.category,
              subCategory: task.subCategory,
              note: task.note || '',
              reflection: task.reflection || ''
            });
          }
        }
      });
    });
    
    return relatedTasks.sort((a, b) => b.date.localeCompare(a.date));
  }, [tasksByDate, activeTab]);

  // 切换完成状态
  const toggleTodo = (todoId) => {
    setTodos(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map(todo =>
        todo.id === todoId ? { ...todo, done: !todo.done } : todo
      )
    }));
  };

  // 打开添加弹窗
  const handleAddTodo = () => {
    setNewTodoTitle('');
    setSelectedPriority('regular');
    setShowAddModal(true);
  };

  // 保存待办
  const saveTodo = () => {
    if (!newTodoTitle.trim()) {
      alert('请输入待办内容');
      return;
    }
    
    const newTodo = {
      id: Date.now().toString(),
      title: newTodoTitle.trim(),
      keyword: newTodoTitle.trim(),
      createdAt: new Date().toISOString(),
      done: false,
      priority: selectedPriority
    };
    setTodos(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newTodo]
    }));
    setShowAddModal(false);
    setNewTodoTitle('');
  };

  // 编辑待办
  const handleEditTodo = (todo) => {
    const newTitle = window.prompt('编辑待办内容：', todo.title);
    if (newTitle && newTitle.trim()) {
      setTodos(prev => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).map(t =>
          t.id === todo.id ? { ...t, title: newTitle.trim(), keyword: newTitle.trim() } : t
        )
      }));
    }
  };

  // 删除待办
  const handleDeleteTodo = (todoId) => {
    if (window.confirm('确定要删除这个待办吗？')) {
      setTodos(prev => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).filter(t => t.id !== todoId)
      }));
    }
  };

  // 获取待办的关联任务和统计
  const getTodoStats = (todo) => {
    const relatedTasks = findRelatedTasks(todo.keyword || todo.title);
    const totalCount = relatedTasks.length;
    const totalMinutes = relatedTasks.reduce((sum, t) => sum + t.timeMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    return {
      relatedTasks,
      totalCount,
      totalMinutes,
      totalHours,
      lastPracticeDate: relatedTasks.length > 0 ? relatedTasks[0].date : null
    };
  };

  // 统计信息
  const stats = {
    total: currentTodos.length,
    completed: currentTodos.filter(t => t.done).length,
    incomplete: currentTodos.filter(t => !t.done).length
  };

  // 渲染单个待办项
  // 渲染单个待办项
const renderTodoItem = (todo) => {
  const { relatedTasks, totalCount, totalMinutes, totalHours } = getTodoStats(todo);
  const isExpanded = expandedTodoId === todo.id;
  const isImportant = todo.priority === 'important';
  const isDone = todo.done;  // 👈 获取完成状态
  
  return (
    <div
      key={todo.id}
      style={{
        backgroundColor: isDone ? '#f5f5f5' : 'white',  // 👈 完成后变灰
        borderRadius: '12px',
        border: isImportant 
          ? (isDone ? '1px solid #ddd' : '1px solid #FF6B6B')  // 👈 完成后边框变灰
          : '1px solid #e5e7eb',
        overflow: 'hidden',
        flexShrink: 0,
        marginBottom: '5px',
        opacity: isDone ? 0.7 : 1  // 👈 完成后降低透明度
      }}
    >
      {/* 主要内容行 */}
      <div
        style={{
          padding: '12px 15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          backgroundColor: isImportant && !isDone ? '#FFF5F5' : (isDone ? '#f5f5f5' : 'white')  // 👈 完成后背景变灰
        }}
        onClick={() => setExpandedTodoId(isExpanded ? null : todo.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={(e) => {
              e.stopPropagation();
              toggleTodo(todo.id);
            }}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              margin: 0,
              flexShrink: 0
            }}
          />
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleEditTodo(todo);
            }}
            style={{
              fontSize: '14px',
              color: isDone ? '#bbb' : (isImportant ? '#FF6B6B' : '#333'),  // 👈 完成后文字变浅灰
              textDecoration: isDone ? 'line-through' : 'none',  // 👈 完成后添加删除线
              cursor: 'pointer',
              flex: 1,
              wordBreak: 'break-word',
              fontWeight: isImportant && !isDone ? 'bold' : 'normal'
            }}
          >
            {isImportant && !isDone && <span style={{ marginRight: '6px' }}>⭐</span>}
            {isImportant && isDone && <span style={{ marginRight: '6px', color: '#bbb' }}>⭐</span>}
            {todo.title}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {totalCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: isDone ? '#bbb' : '#4caf50',  // 👈 完成后变灰
              backgroundColor: isDone ? '#e8e8e8' : '#e8f5e9',  // 👈 完成后背景变灰
              padding: '2px 8px',
              borderRadius: '16px'
            }}>
              <span>{totalCount}次</span>
              {totalMinutes > 0 && <span>({totalHours}h)</span>}
            </div>
          )}
          
          <div style={{
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDone ? '#bbb' : '#999'  // 👈 完成后箭头变灰
          }}>
            {isExpanded ? '▲' : '▼'}
          </div>
          
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTodo(todo.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDone ? '#bbb' : '#999',  // 👈 完成后叉号变灰
              flexShrink: 0
            }}
          >
            ×
          </div>
        </div>
      </div>
      
      {/* 展开区域 - 完成后保持原样，不加额外修改 */}
      {isExpanded && (
        // ... 展开区域代码保持不变
        <div style={{
          padding: '12px 15px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* 内容保持不变 */}
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#666',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>关联练习记录</span>
            {totalCount > 0 && (
              <span style={{
                fontSize: '11px',
                color: isDone ? '#bbb' : '#4caf50',
                backgroundColor: isDone ? '#e8e8e8' : '#e8f5e9',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                共 {totalCount} 次
              </span>
            )}
          </div>
          
          {relatedTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#999',
              fontSize: '12px'
            }}>
              暂无关联练习记录
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                在主界面完成任务后会自动统计
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {relatedTasks.map((task, idx) => (
                <div
                  key={task.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333',
                        wordBreak: 'break-word'
                      }}>
                        {task.text}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '4px',
                        fontSize: '10px',
                        color: '#999'
                      }}>
                        <span>{task.date.slice(5)}</span>
                        {task.category && (
                          <span>{task.category}{task.subCategory ? ` - ${task.subCategory}` : ''}</span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#61A2Da',
                      backgroundColor: '#e8f0fe',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {task.timeDisplay}
                    </div>
                  </div>
                  
                  {task.note && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#555'
                    }}>
                      {task.note}
                    </div>
                  )}
                  
                  {task.reflection && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      backgroundColor: '#fff9c4',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#333'
                    }}>
                      {task.reflection}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {totalCount > 0 && (
            <div style={{
              marginTop: '10px',
              padding: '8px 10px',
              backgroundColor: '#e8f0fe',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <span style={{ fontWeight: 'bold', color: '#61A2Da' }}>总计</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>练习次数: {totalCount}</span>
                {totalMinutes > 0 && <span>总时长: {totalHours}小时</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f5faff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: 0,
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: '#f5faff',
        padding: '15px',
        borderRadius: 0,
        width: '100%',
        maxWidth: '600px',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: '0 auto',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* 标题栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexShrink: 0
        }}>
          <div style={{ width: '60px' }}></div>
          <h2 style={{ 
            textAlign: 'center', 
            margin: 0,
            color: '#61A2Da',
            fontSize: '20px'
          }}>
            待办
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            height: '28px'
          }}>
            <button
              onClick={handleAddTodo}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                borderRadius: '4px'
              }}
              title="添加待办"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="4" x2="12" y2="20" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                borderRadius: '4px'
              }}
              title="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* 科目标签切换 */}
        <div style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '15px',
          borderBottom: '1px solid #e0e0e0',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0
        }}>
          {tabs.map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#61A2Da' : '#f0f0f0',
                color: activeTab === tab ? '#fff' : '#666',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                borderBottom: activeTab === tab ? '2px solid #61A2Da' : 'none',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        
        {/* 统计卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px',
          flexShrink: 0
        }}>
          <div style={{
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>全部</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a73e8' }}>{stats.total}</div>
          </div>
          <div style={{
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>已完成</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>{stats.completed}</div>
          </div>
          <div style={{
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>未完成</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>{stats.incomplete}</div>
          </div>
        </div>

        {/* 添加待办弹窗 - 一次性输入内容+选择优先级 */}
        {showAddModal && (
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
            zIndex: 1100,
            padding: '10px'
          }} onClick={() => setShowAddModal(false)}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '320px',
              overflow: 'hidden',
              textAlign: 'center'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0f0',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#333'
              }}>
                添加待办
              </div>
              
              <div style={{ padding: '16px' }}>
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="输入待办内容..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    marginBottom: '16px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveTodo();
                    }
                  }}
                />
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textAlign: 'left' }}>
                    选择优先级：
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                      onClick={() => setSelectedPriority('important')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: selectedPriority === 'important' ? '#FF6B6B' : '#f5f5f5',
                        color: selectedPriority === 'important' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        border: selectedPriority === 'important' ? 'none' : '1px solid #ddd'
                      }}
                    >
                      ⭐ 重点
                    </div>
                    <div
                      onClick={() => setSelectedPriority('regular')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: selectedPriority === 'regular' ? '#61A2Da' : '#f5f5f5',
                        color: selectedPriority === 'regular' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        border: selectedPriority === 'regular' ? 'none' : '1px solid #ddd'
                      }}
                    >
                      📋 常规
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                  >
                    取消
                  </div>
                  <div
                    onClick={saveTodo}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#61A2Da',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  >
                    添加
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 待办列表 - 重点在上，常规在下 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {currentTodos.length === 0 ? (
            <div style={{
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              暂无待办
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
                点击右上角 + 添加 {activeTab} 待办
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}>
              
              {/* 重点任务区域 */}
              {importantTodos.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#FF6B6B',
                    marginBottom: '8px',
                    paddingLeft: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⭐ 重点任务</span>
                    <span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>
                      ({importantTodos.length})
                    </span>
                  </div>
                  {importantTodos.map(todo => renderTodoItem(todo))}
                </div>
              )}
              
              {/* 常规任务区域 */}
              {regularTodos.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#61A2Da',
                    marginBottom: '8px',
                    paddingLeft: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>📋 常规任务</span>
                    <span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>
                      ({regularTodos.length})
                    </span>
                  </div>
                  {regularTodos.map(todo => renderTodoItem(todo))}
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




const TimeRecordModal = ({ onClose, tasksByDate, categories, selectedDate, onEditRecord, onDeleteRecord }) => {
  const [selectedFilterDate, setSelectedFilterDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [dateOptions, setDateOptions] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMinutes, setEditMinutes] = useState('');

   const getCategoryColor = (category, subCategory) => {
    if (category === '校内' && subCategory) {
      const colors = {
        '数学': '#E8F5E9',
        '语文': '#FFF9C4',
        '英语': '#FCE4EC',
        '运动': '#E3F2FD'
      };
      return colors[subCategory] || '#61A2Da';
    }
    
    const categoryColors = {
      '语文': '#FFF9C4',
      '数学': '#E8F5E9',
      '英语': '#FCE4EC',
      '通识': '#E1F5FE',
      '运动': '#E3F2FD',
      '校内': '#61A2DA'
    };
    return categoryColors[category] || '#f0f0f0';
  };

  useEffect(() => {
    const dates = Object.keys(tasksByDate || {})
      .filter(date => (tasksByDate[date] || []).length > 0)
      .sort((a, b) => b.localeCompare(a));
    setDateOptions(dates);
  }, [tasksByDate]);

  useEffect(() => {
    const tasks = tasksByDate[selectedFilterDate] || [];
    const tasksWithRecords = tasks.filter(task => 
      task.timeRecords && task.timeRecords.length > 0
    );
    setFilteredTasks(tasksWithRecords);
  }, [tasksByDate, selectedFilterDate]);

 // 获取类别对应的背景色



  const getTotalMinutes = (task) => {
    if (task.timeRecords && task.timeRecords.length > 0) {
      return task.timeRecords.reduce((sum, r) => sum + (r.change || 0), 0);
    }
    return 0;
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
      zIndex: 1100,
      padding: '10px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '16px',
        width: '95%',
        maxWidth: '500px',
        maxHeight: '85vh',
        overflow: 'auto',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#61A2Da', fontSize: '18px' }}>⏱时间记录汇总</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px', display: 'block' }}>选择日期</label>
          <select
            value={selectedFilterDate}
            onChange={(e) => setSelectedFilterDate(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: '#fff' }}
          >
            {dateOptions.map(date => <option key={date} value={date}>{date}</option>)}
            {dateOptions.length === 0 && <option>暂无数据</option>}
          </select>
        </div>

        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
              📭 该日期暂无时间记录
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#ccc' }}>
                点击任务右侧的 0m 添加时间记录
              </div>
            </div>
          ) : (
            filteredTasks.map(task => {
              const timeRecords = task.timeRecords || [];
              const totalMinutes = getTotalMinutes(task);
              const categoryColor = getCategoryColor(task.category);
              
              return (
                <div key={task.id} style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: categoryColor, borderRadius: '12px', color: task.category === '校内' ? '#fff' : '#333' }}>{task.category}</span>
                    {task.subCategory && <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#e8f0fe', borderRadius: '12px', color: '#333' }}>{task.subCategory}</span>}
                    <span style={{ fontSize: '12px', color: '#61A2Da', fontWeight: 'bold', marginLeft: 'auto' }}>总计: {totalMinutes}分钟</span>
                  </div>

                  <div style={{ fontSize: '14px', color: '#333', marginBottom: '12px', fontWeight: '500' }}>{task.text}</div>

                  <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                    {timeRecords.map((record, idx) => (
                      <div key={idx} style={{ padding: '6px 0', borderBottom: idx < timeRecords.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ backgroundColor: '#e8f0fe', padding: '2px 8px', borderRadius: '16px', fontSize: '11px', color: '#61A2Da' }}>
                              {record.time || '--:--'}
                            </span>
                            
                            {editingRecord?.taskId === task.id && editingRecord?.recordIndex === idx ? (
                              <input
                                type="number"
                                value={editMinutes}
                                onChange={(e) => setEditMinutes(e.target.value)}
                                onBlur={() => {
                                  const newMinutes = parseInt(editMinutes);
                                  if (!isNaN(newMinutes) && newMinutes > 0) {
                                    onEditRecord?.(task, idx, newMinutes);
                                  }
                                  setEditingRecord(null);
                                  setEditMinutes('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newMinutes = parseInt(editMinutes);
                                    if (!isNaN(newMinutes) && newMinutes > 0) {
                                      onEditRecord?.(task, idx, newMinutes);
                                    }
                                    setEditingRecord(null);
                                    setEditMinutes('');
                                  } else if (e.key === 'Escape') {
                                    setEditingRecord(null);
                                    setEditMinutes('');
                                  }
                                }}
                                autoFocus
                                style={{
                                  width: '60px',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #61A2Da',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  textAlign: 'center'
                                }}
                              />
                            ) : (
                              <span 
                                onClick={() => {
                                  setEditingRecord({ taskId: task.id, recordIndex: idx });
                                  setEditMinutes(record.change.toString());
                                }}
                                style={{ 
                                  fontWeight: 'bold', 
                                  color: record.change > 0 ? '#4caf50' : '#f44336',
                                  cursor: 'pointer',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  fontSize: '11px'
                                }}
                                title="点击修改时长"
                              >
                                {record.change > 0 ? `+${record.change}` : record.change}分钟
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
    if (window.confirm('确定要删除这条时间记录吗？')) {
      onDeleteRecord?.(task, idx);
    }
  }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="删除记录"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <line x1="18" y1="6" x2="6" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="6" y1="6" x2="18" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                        {record.note && (
                          <div style={{ fontSize: '11px', color: '#666', marginLeft: '8px', paddingLeft: '8px', borderLeft: '2px solid #61A2Da', marginTop: '4px' }}>
                             {record.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

   
      </div>
    </div>
  );
};


const TimeEditModal = ({ task, onClose, onSave, onEditRecord, onDeleteRecord, toggleDone, onSavePlannedTime }) => {
  const [addMinutes, setAddMinutes] = useState('');
  const [note, setNote] = useState('');
  const [plannedMinutes, setPlannedMinutes] = useState(() => {
    return task.plannedTime || '';
  });
  const [editingHistoryRecord, setEditingHistoryRecord] = useState(null);
  const [editHistoryMinutes, setEditHistoryMinutes] = useState('');
  const timeRecords = task.timeRecords || [];

  // 保存计划时间
  const handleSavePlannedTime = () => {
    const minutes = parseInt(plannedMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      if (onSavePlannedTime) {
        onSavePlannedTime(task, minutes);
      }
    } else if (plannedMinutes === '' || plannedMinutes === '0') {
      if (onSavePlannedTime) {
        onSavePlannedTime(task, null);
      }
    }
  };

  // 保存实际时间
   const handleSave = () => {
    const minutes = parseInt(addMinutes);
    if (!isNaN(minutes)) {  // ✅ 允许负数，不再要求 > 0
      if (onSave) {
        onSave(task, minutes, note);
      }
      
      // ✅ 如果是正数且任务未完成，自动完成
      if (minutes > 0 && task.done !== true && typeof toggleDone === 'function') {
        toggleDone(task);
      }
    }
    onClose();
  };

  const handleDeleteRecord = (recordIndex) => {
    if (window.confirm('确定要删除这条时间记录吗？')) {
      if (onDeleteRecord) {
        onDeleteRecord(task, recordIndex);
      }
    }
  };

  const getActualTotalMinutes = () => {
    return Math.floor((task.timeSpent || 0) / 60);
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
      zIndex: 1200,
      padding: '10px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* 标题栏 + 确认增加按钮在右上角 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#61A2Da', fontSize: '16px' }}>
            时间记录
          </h3>
          
          {/* 确认增加按钮 - 右上角 */}
          <div
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              backgroundColor: '#61A2Da',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            确认增加
          </div>
        </div>
        
        {/* 计划时间和本次学习时长 - 同一行 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* 计划时间输入框 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>
              计划时间
            </label>
            <input
              type="number"
              placeholder="分钟"
              value={plannedMinutes}
              onChange={(e) => {
                setPlannedMinutes(e.target.value);
              }}
              onBlur={handleSavePlannedTime}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 本次学习时长输入框 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>
              本次学习时长
            </label>
            <input
              type="number"
              placeholder="分钟"
              value={addMinutes}
              onChange={(e) => setAddMinutes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        {/* 备注 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>
            备注
          </label>
          <textarea
            placeholder="可选"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            rows="1"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              resize: 'none',
              fontFamily: 'inherit',
              minHeight: '40px',
              overflow: 'hidden'
            }}
          />
        </div>
        
        {/* 时间统计卡片 */}
        <div style={{ 
          textAlign: 'center', 
          padding: '8px', 
          backgroundColor: '#e8f0fe', 
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '12px', color: '#666' }}>实际总时间：</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#61A2Da' }}>
            {getActualTotalMinutes()}
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}> 分钟</span>
          
          {task.plannedTime && parseInt(task.plannedTime) > 0 && (
            <>
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '12px' }}>计划时间：</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f44336' }}>
                {task.plannedTime}
              </span>
              <span style={{ fontSize: '12px', color: '#666' }}> 分钟</span>
            </>
          )}
        </div>
        
        {/* 历史记录列表 */}
        {timeRecords.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              历史记录
            </div>
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              {timeRecords.map((record, idx) => (
                <div key={idx} style={{ 
                  padding: '8px 12px', 
                  borderBottom: idx < timeRecords.length - 1 ? '1px solid #f0f0f0' : 'none',
                  backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        backgroundColor: '#e8f0fe', 
                        padding: '2px 8px', 
                        borderRadius: '16px', 
                        fontSize: '11px', 
                        color: '#61A2Da' 
                      }}>
                        {record.time || '--:--'}
                      </span>
                      
                      {editingHistoryRecord === idx ? (
                        <input
                          type="number"
                          value={editHistoryMinutes}
                          onChange={(e) => setEditHistoryMinutes(e.target.value)}
                          onBlur={() => {
                            const newMinutes = parseInt(editHistoryMinutes);
                            if (!isNaN(newMinutes) && newMinutes > 0 && onEditRecord) {
                              onEditRecord(task, idx, newMinutes);
                            }
                            setEditingHistoryRecord(null);
                            setEditHistoryMinutes('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newMinutes = parseInt(editHistoryMinutes);
                              if (!isNaN(newMinutes) && newMinutes > 0 && onEditRecord) {
                                onEditRecord(task, idx, newMinutes);
                              }
                              setEditingHistoryRecord(null);
                              setEditHistoryMinutes('');
                            } else if (e.key === 'Escape') {
                              setEditingHistoryRecord(null);
                              setEditHistoryMinutes('');
                            }
                          }}
                          autoFocus
                          style={{
                            width: '70px',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #61A2Da',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingHistoryRecord(idx);
                            setEditHistoryMinutes(record.change.toString());
                          }}
                          style={{ 
                            fontWeight: 'bold', 
                            color: '#4caf50',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          title="点击修改时长"
                        >
                          {record.change > 0 ? `+${record.change}` : record.change}分钟
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleDeleteRecord(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        color: '#999'
                      }}
                      title="删除记录"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  {record.note && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#666', 
                      marginLeft: '8px', 
                      paddingLeft: '8px', 
                      borderLeft: '2px solid #61A2Da', 
                      marginTop: '6px' 
                    }}>
                       {record.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 取消按钮 - 底部居中 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <div
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer',
              minWidth: '100px'
            }}
          >
            取消
          </div>
        </div>
      </div>
    </div>
  );
};


const ReflectionModalContent = ({ initialRating, initialReflection, onSave, onClose }) => {
  const [rating, setRating] = useState(initialRating);
  const [reflection, setReflection] = useState(initialReflection);

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: 8,
      width: '90%',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '12px', fontSize: '15px', color: '#61A2Da' }}>
        今日复盘
      </h3>
      
      {/* 复盘输入框 */}
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="记录今日的学习收获、反思和改进点..."
        style={{
          width: '100%',
          minHeight: '150px',
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '13px',
          lineHeight: 1.5,
          resize: 'vertical',
          backgroundColor: '#fafafa',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          marginBottom: '16px'
        }}
        autoFocus
      />

      {/* ===== ❌ 删除：⏰ 学习结束时间 ===== */}
      {/* ===== ❌ 删除：今日状态评分 ===== */}

      {/* 按钮区域 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div
          onClick={onClose}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            borderRadius: 6,
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          取消
        </div>
        <div
          onClick={() => onSave(rating, reflection)}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#61A2Da',
            color: '#fff',
            borderRadius: 6,
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          保存
        </div>
      </div>
    </div>
  );
};


// 修改 baseCategories 的颜色
const baseCategories = [
  { 
    name: "健康", 
    color: "#E8F5E9", 
    textColor: "#333",
    emoji: "💪",
    description: "身体健康、运动锻炼"
  },
  { 
    name: "财富", 
    color: "#FFF8E1", 
    textColor: "#333",
    emoji: "💰",
    description: "财富积累、财务管理"
  },
  { 
    name: "智慧", 
    color: "#E3F2FD", 
    textColor: "#333",
    emoji: "📚",
    description: "学习、技能、知识"
  },
  { 
    name: "家庭", 
    color: "#FCE4EC", 
    textColor: "#333",
    emoji: "👨‍👩‍👧",
    description: "家庭、人际关系"
  },
  { 
    name: "心神", 
    color: "#FFF3E0", 
    textColor: "#333",
    emoji: "🧠",
    description: "心理健康、情绪管理"
  },
  
  
  { 
    name: "悦己", 
    color: "#F3E5F5", 
    textColor: "#333",
    emoji: "⛰️",
    description: "休闲、娱乐、自我享受"
  }
];
// 保持这样就行
const PAGE_ID = 'LIFE_OS'; 
const STORAGE_KEY = `life-os-${PAGE_ID}-v2`;



// 统一的存储函数
const saveMainData = async (key, data) => {
  const storageKey = `${STORAGE_KEY}_${key}`;
  try {
    // 将数据转换为JSON字符串
    const jsonData = JSON.stringify(data);
    localStorage.setItem(storageKey, jsonData);
    
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




// 备份管理模态框组件
const BackupManagerModal = ({ onClose }) => {
  const [backups, setBackups] = useState([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBackups = () => {
    setIsLoading(true);
    try {
      const backupList = getBackupList();
      console.log('加载的备份列表:', backupList);
      setBackups(backupList);
    } catch (error) {
      console.error('加载备份失败:', error);
    } finally {
      setIsLoading(false);
    }
  };


  
  useEffect(() => {
    loadBackups();
  }, []);
const handleManualBackup = async () => {
  setIsLoading(true);
  try {
    // 设置标记，让 autoBackup 知道这是手动备份
    window.__manualBackup = true;
    await autoBackup();
    window.__manualBackup = false;
    
    // 延迟加载，确保数据已写入
    setTimeout(() => {
      loadBackups();
      alert('✅ 手动备份已创建！');
    }, 500);
  } catch (error) {
    console.error('备份失败:', error);
    alert('❌ 备份失败: ' + error.message);
    window.__manualBackup = false;
  } finally {
    setIsLoading(false);
  }
};

  const handleDeleteBackup = (backupKey) => {
    if (window.confirm('确定要删除这个备份吗？')) {
      localStorage.removeItem(backupKey);
      loadBackups(); // 立即刷新列表
    }
  };



  

  useEffect(() => {

    // 获取备份列表
    setBackups(getBackupList());
  }, []);

  const handleRestore = async (backupKey) => {
    await restoreBackup(backupKey);
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
          <h3 style={{ margin: 0, color: '#61A2Da' }}>📦 备份管理</h3>
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
      {backups.map((backup, index) => {
  return (
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
          {backup.displayTime || new Date(backup.time).toLocaleString()}
          {index === 0 && <span style={{ color: '#28a745', marginLeft: 8 }}>最新</span>}
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
          任务天数: {backup.tasksCount || 0} | 版本: {backup.version || '1.0'}
        </div>
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
        );
      })}
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










const GitHubSyncModal = ({ config, onSave, onClose }) => {
  const [token, setToken] = useState(config.token || '');
const [autoSync, setAutoSync] = useState(config.autoSync !== undefined ? config.autoSync : false); // ✅ 改成 false
  const [gistId, setGistId] = useState(config.gistId || '978de7cead4b35c6c0784051f5cc7405');

  // 获取 Token 后四位
const handleSave = () => {
  if (!token.trim()) {
    alert('请输入 GitHub Token');
    return;
  }
  

  
  onSave({ token, autoSync, gistId });
  onClose();
};

  // ✅ 修改这里：期望的后四位改为 ocb0

   const hasAutoSavedRef = useRef(false);  // <-- 添加这行

 

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
          ☁️ GitHub 同步设置
        </h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            GitHub Personal Access Token:
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              // 用户手动修改时，重置自动保存标记
              hasAutoSavedRef.current = false;
            }}
            placeholder="输入 GitHub Token"
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
          
        
          
          {token.length > 0 && token.length < 4 && (
            <div style={{ fontSize: 12, marginTop: 5, color: '#ff9800' }}>
              Token 至少需要4位（当前{token.length}位）
            </div>
          )}
          
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            需要 gist 权限。获取地址：<br/>
            https://github.com/settings/tokens
          </div>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Gist ID:
          </label>
          <input
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder="已有 Gist ID，留空则新建"
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
          
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            <span>自动同步（数据变化后5秒自动同步）</span>
          </label>
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
            onClick={handleSave}
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
            保存
          </button>
        </div>
      </div>
    </div>
  );
};


// 在 GitHubSyncModal 组件后面添加：

// 恢复数据模态框组件
const RestoreDataModal = ({ onClose, onRestore }) => {
  const [gistUrl, setGistUrl] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

// 从 Gist URL 提取 ID - 最宽松的版本
const extractGistId = (url) => {
  // 如果看起来像完整的 URL，尝试提取 ID
  if (url.includes('gist.github.com')) {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    // 返回最后一个部分，去掉可能的查询参数
    return lastPart.split('?')[0];
  }
  // 否则直接返回输入
  return url;
};




  
// 从 GitHub 获取数据
const fetchFromGitHub = async (gistId) => {
  try {
    setIsLoading(true);
    
    // 尝试不使用 token 访问（公开 Gist）
    const response = await fetch(`https://api.github.com/gists/${gistId}`);
    
    if (!response.ok) {
      // 如果是 404 或 403，尝试使用用户自己的 token
      const token = localStorage.getItem('github_token');
      if (token) {
        const authResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (authResponse.ok) {
          const gist = await authResponse.json();
          const files = Object.values(gist.files);
          
          // 查找学习跟踪器数据文件
const dataFile = files.find(file => 
  file.filename.includes('life-os') || 
  file.filename.includes('json') ||
  file.filename.includes('backup')
);
          
          if (!dataFile) {
            throw new Error('未找到学习跟踪器数据文件');
          }

          return JSON.parse(dataFile.content);
        }
      }
      
      throw new Error(`获取失败: ${response.status} - 请确保 Gist 是公开的或提供正确的访问权限`);
    }

    const gist = await response.json();
    const files = Object.values(gist.files);
    
   // 查找学习跟踪器数据文件（更宽松的匹配）
const dataFile = files.find(file => 
  file.filename.includes('life-os') || 
  file.filename.includes('json') ||
  file.filename.includes('backup') ||
  file.filename === 'life-os-data.json'
);
    
    if (!dataFile) {
      throw new Error('未找到学习跟踪器数据文件，请检查文件名称');
    }

    return JSON.parse(dataFile.content);
  } catch (error) {
    throw error;
  } finally {
    setIsLoading(false);
  }
};



  // 从文件恢复
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        setFileContent(JSON.stringify(content, null, 2));
      } catch (error) {
        alert('文件格式错误: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

 


// 从 URL 恢复
const handleUrlRestore = async () => {
  if (!gistUrl.trim()) {
    alert('请输入 Gist URL 或 ID');
    return;
  }

  try {
    const gistId = extractGistId(gistUrl);
    
  
    
    const data = await fetchFromGitHub(gistId);
    setFileContent(JSON.stringify(data, null, 2));
  } catch (error) {
    alert('恢复失败: ' + error.message + '\n\n提示：请确保：\n1. Gist 是公开的\n2. 或者您有该 Gist 的访问权限\n3. 或者先设置 GitHub Token');
  }
};

// 在 RestoreDataModal 组件内部添加这个方法：

// 测试 Gist 访问
const testGistAccess = async () => {
  if (!gistUrl.trim()) {
    alert('请输入 Gist URL 或 ID');
    return;
  }

  try {
    const gistId = extractGistId(gistUrl);
    console.log('测试 Gist ID:', gistId);
    
    // 测试公开访问
    const publicResponse = await fetch(`https://api.github.com/gists/${gistId}`);
    console.log('公开访问状态:', publicResponse.status);
    
    // 测试带 token 访问
    const token = localStorage.getItem('github_token');
    if (token) {
      const authResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('带 Token 访问状态:', authResponse.status);
    }
    
    alert(`测试结果：
公开访问: ${publicResponse.status}
带 Token 访问: ${token ? '已测试' : '未设置 Token'}

如果都是 404，说明 Gist 不存在或 ID 错误
如果是 403，说明需要权限`);
    
  } catch (error) {
    console.error('测试失败:', error);
    alert('测试失败: ' + error.message);
  }
};


  // 确认恢复
// 原来的 confirmRestore 函数，替换为：
const confirmRestore = () => {
  if (!fileContent) {
    alert('请先选择数据源');
    return;
  }

  try {
    const data = JSON.parse(fileContent);
    
    // 验证数据格式
    if (!data.tasks && !data.tasksByDate) {
      throw new Error('无效的数据格式');
    }

    // ✅ 静默合并，不询问用户
    if (onRestore) {
      onRestore(data, 'merge');  // 直接使用合并模式
    }
    onClose();
  } catch (error) {
    alert('数据格式错误: ' + error.message);
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
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>
          🔄 恢复数据
        </h3>

        {/* 方法1: 从文件恢复 */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 10 }}>📁 从文件恢复</h4>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              marginBottom: 10
            }}
          />
          <div style={{ fontSize: 12, color: '#666' }}>
            选择之前导出的 .json 备份文件
          </div>
        </div>

        {/* 方法2: 从 GitHub Gist 恢复 */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 10 }}>🌐 从 GitHub 恢复</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              placeholder="输入 Gist URL 或 ID"
              value={gistUrl}
              onChange={(e) => setGistUrl(e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 6
              }}
            />
            <button
              onClick={handleUrlRestore}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoading ? '#ccc' : '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '加载中...' : '获取'}
            </button>
    {/* 添加测试按钮 */}
    <button
      onClick={testGistAccess}
      style={{
        padding: '8px 12px',
        backgroundColor: '#6c757d',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: '12px'
      }}
      title="测试 Gist 访问"
    >
      测试
    </button>



          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            示例: https://gist.github.com/username/1234567890abcdef
          </div>
        </div>




        {/* 数据预览 */}
        {fileContent && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>👀 数据预览</h4>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: 10,
              borderRadius: 6,
              maxHeight: 200,
              overflow: 'auto',
              fontSize: 12,
              border: '1px solid #e0e0e0'
            }}>
              <pre>{fileContent.substring(0, 500)}...</pre>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
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
            onClick={confirmRestore}
            disabled={!fileContent}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: !fileContent ? '#ccc' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: !fileContent ? 'not-allowed' : 'pointer'
            }}
          >
            确认恢复
          </button>
        </div>
      </div>
    </div>
  );
};

















// ==== 新增：自动备份配置 ====
const AUTO_BACKUP_CONFIG = {
  maxBackups: 2,                    // 保留7个备份
  backupInterval: 60 * 60 * 1000,  // 1小时备份一次   // 10分钟（30 * 60 * 1000 毫秒）- 修改这里
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




const autoBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}${timestamp}`;
    
    console.log('💾 开始创建备份，当前时间:', new Date().toLocaleString());
    
    // 直接从 localStorage 读取最新数据
    // 注意：这里不能直接使用 tasksByDate，因为它是在 App 组件内部的状态变量
    const currentTasks = await loadMainData('tasks') || {};
    const currentTemplates = await loadMainData('templates') || [];
    const currentCategories = await loadMainData('categories') || baseCategories;
    const currentMonthTasks = await loadMainData('monthTasks') || [];
    
    // 获取每日数据
    const allDailyRatings = {};
    const allDailyReflections = {};
    const allKeys = Object.keys(localStorage);
    const dailyKeys = allKeys.filter(key => key.startsWith(`${STORAGE_KEY}_daily_`));
    
    dailyKeys.forEach(key => {
      try {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data && data.date) {
            allDailyRatings[data.date] = data.rating || 0;
            allDailyReflections[data.date] = data.reflection || '';
          }
        }
      } catch (e) {
        console.error('解析每日数据失败:', key, e);
      }
    });
    
     // 从 localStorage 读取 studyEndTimes
    let studyEndTimes = {};
    const endTimesStr = localStorage.getItem('daily_study_end_times');
    if (endTimesStr) {
      studyEndTimes = JSON.parse(endTimesStr);
    }
    const backupData = {
      tasks: currentTasks,
      templates: currentTemplates,
      categories: currentCategories,
      monthTasks: currentMonthTasks,
      
      studyEndTimes: studyEndTimes, 
      dailyRatings: allDailyRatings,
      dailyReflections: allDailyReflections,
      backupTime: new Date().toISOString(),
      version: '2.0'
    };
    
    // 保存到 localStorage
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    console.log('✅ 备份创建成功:', backupKey);
    console.log('📅 备份时间:', new Date().toLocaleString());
    
    // 清理旧备份
    await cleanupOldBackups();
    
    // 可选：显示成功提示
    if (window.__manualBackup) {
      alert(`✅ 备份成功！\n时间：${new Date().toLocaleString()}\n包含：${Object.keys(currentTasks).length}天任务数据`);
    }
    
  } catch (error) {
    console.error('❌ 自动备份失败:', error);
    if (window.__manualBackup) {
      alert('备份失败: ' + error.message);
    }
  }
};

const cleanupOldBackups = async () => {
  const allKeys = Object.keys(localStorage);
  const backupKeys = allKeys
    .filter(key => key.startsWith(`${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}`))
    .sort((a, b) => {
      // 按时间倒序排序（最新的在前）
      return b.localeCompare(a);
    });
  
  console.log('当前备份数量:', backupKeys.length);
  
  if (backupKeys.length > AUTO_BACKUP_CONFIG.maxBackups) {
    const keysToDelete = backupKeys.slice(AUTO_BACKUP_CONFIG.maxBackups);
    console.log('删除旧备份:', keysToDelete);
    
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
        displayTime: data?.backupTime ? new Date(data.backupTime).toLocaleString() : '未知时间',
        tasksCount: Object.keys(data?.tasks || {}).length,
        monthTasksCount: (data?.monthTasks || []).length,
        version: data?.version || '1.0',
        hasAchievements: !!(data?.customAchievements || data?.unlockedAchievements)
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
      console.log('🔄 开始恢复备份...');
      
      // 保存所有关键数据到 localStorage
      await saveMainData('tasks', backupData.tasks || {});
      await saveMainData('templates', backupData.templates || []);
      await saveMainData('customAchievements', backupData.customAchievements || []);
      await saveMainData('unlockedAchievements', backupData.unlockedAchievements || []);
      await saveMainData('categories', backupData.categories || baseCategories);
      await saveMainData('monthTasks', backupData.monthTasks || []);
      
      console.log('✅ 所有数据已保存到 localStorage');
      
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
    const keys = ['tasks', 'categories'];
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
      const keys = ['tasks',   'categories'];
      keys.forEach(key => {
        localStorage.removeItem(`${STORAGE_KEY}_${key}`);
      });
      console.log('✅ 所有数据已清除');
      window.location.reload();
    }
  }  // 最后一个方法不需要逗号
};






const getWeekNumber = (date) => {
  // 使用北京时间
  const d = new Date(date);
  const beijingDate = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  const year = beijingDate.getUTCFullYear();
  const month = beijingDate.getUTCMonth();
  const day = beijingDate.getUTCDate();
  
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((new Date(year, month, day) - jan1) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + jan1.getDay() + 1) / 7);
};


// 统一的存储函数






 






const getMonday = (date) => {
  // 使用北京时间
  const d = new Date(date);
  // 转换为北京时间（UTC+8）
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  
  const year = beijingTime.getUTCFullYear();
  const month = beijingTime.getUTCMonth();
  const day = beijingTime.getUTCDate();
  
  const localDate = new Date(year, month, day);
  
  const weekDay = localDate.getDay();
  const diff = weekDay === 0 ? -6 : 1 - weekDay;
  
  const monday = new Date(year, month, day + diff);
  monday.setHours(0, 0, 0, 0);
  
  return monday;
};







// 修复：生成周一到周日的日期
const getWeekDates = (monday) => {
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    // 使用北京时间
    const beijingDate = new Date(d.getTime() + (8 * 60 * 60 * 1000));
    const year = beijingDate.getUTCFullYear();
    const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingDate.getUTCDate()).padStart(2, '0');
    
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    
    weekDates.push({
      date: `${year}-${month}-${day}`,
      label: `周${weekDays[i]}`,
      fullLabel: `周${weekDays[i]} (${month}/${day})`
    });
  }
  
  return weekDates;
};
  


const SchedulePage = ({ tasksByDate, currentMonday, onClose, formatTimeNoSeconds }) => {
  const weekDates = getWeekDates(currentMonday);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const tableContainerRef = useRef(null);
  const headerRef = useRef(null);
  
  // 计算时间槽
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

  // 同步横向滚动
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const header = headerRef.current;

    const handleScroll = () => {
      if (header && tableContainer) {
        header.scrollLeft = tableContainer.scrollLeft;
      }
    };

    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // 获取任务时间信息
  const getTaskTimeInfo = (task, date) => {
    if (!task) return null;
  
    // 优先显示计时器记录的实际时间段
    if (task.timeSegments && task.timeSegments.length > 0) {
      const dateSegments = task.timeSegments.filter(segment => {
        if (segment.startTime) {
          const segmentDate = new Date(segment.startTime).toISOString().split('T')[0];
          return segmentDate === date;
        }
        return false;
      });
  
      if (dateSegments.length > 0) {
        const segment = dateSegments[0];
        if (segment.startTime && segment.endTime) {
          const startTime = new Date(segment.startTime);
          const endTime = new Date(segment.endTime);
          
          const startStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
          const endStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
          
          return { 
            startTime: startStr, 
            endTime: endStr, 
            type: 'actual',
            segment: segment
          };
        }
      }
    }
  
    // 其次显示计划时间
    if (task.scheduledTime) {
      const [startTime, endTime] = task.scheduledTime.split('-');
      return { startTime, endTime, type: 'scheduled' };
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
  
  // 获取时间槽的任务
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

  // 计算任务高度
  const calculateTaskHeight = (task, timeInfo) => {
    const baseHeight = 20; // 基础高度（像素）
    
    if (timeInfo.type === 'scheduled') {
      return baseHeight;
    } else {
      // 实际计时时间 - 根据持续时间计算高度
      const [startHour, startMinute] = timeInfo.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeInfo.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      
      // 每30分钟增加一个单位高度
      const heightMultiplier = Math.max(1, Math.floor(duration / 30));
      
      // 根据文本长度调整高度（长文本需要更多行）
      const textLength = task.text.length;
      if (textLength > 20) {
        return baseHeight * heightMultiplier * 1.5;
      } else if (textLength > 10) {
        return baseHeight * heightMultiplier * 1.2;
      }
      
      return baseHeight * heightMultiplier;
    }
  };

  // 获取任务样式
  const getTaskStyle = (task, timeInfo) => {
    const baseStyle = {
      padding: '2px 4px',
      margin: '1px 0',
      borderRadius: '3px',
      fontSize: '10px',
      color: 'white',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      cursor: 'pointer',
      lineHeight: '1.2',
      boxSizing: 'border-box',
      width: '100%',
      minHeight: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start'
    };

    const category = baseCategories.find(cat => cat.name === task.category);
    const categoryColor = category ? category.color : '#666';

    if (timeInfo.type === 'scheduled') {
      return {
        ...baseStyle,
        backgroundColor: task.done ? '#4CAF50' : categoryColor,
        border: task.done ? '1px solid #45a049' : `1px solid ${categoryColor}`,
        height: 'auto'
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#4CAF50',
        border: '1px solid #45a049',
        height: `${calculateTaskHeight(task, timeInfo)}px`
      };
    }
  };

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
      {/* 头部 */}
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
{/* 修改后的返回按钮 */}
          {/* 修改后的返回按钮 */}
<button 
  onClick={onClose}
  style={{
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    margin: '0',
    color: '#1a73e8',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
  ⬅️
</button>

          



          <h1 style={{ textAlign: 'center', color: '#1a73e8', fontSize: '16px', margin: 0 }}>
            📅 本周时间表
          </h1>
          <div style={{ width: '30px' }}></div>
        </div>
      </div>

      {/* 时间表主体 */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 表头 - 固定位置 */}
        <div ref={headerRef} style={{
          display: 'grid',
          gridTemplateColumns: '50px repeat(7, 1fr)',
          backgroundColor: '#1a73e8',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '11px',
          flexShrink: 0,
          overflowX: 'hidden',
          position: 'sticky',
          top: 0,
          zIndex: 10
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
                gap: '1px',
                minWidth: '80px'
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
        <div ref={tableContainerRef} style={{ 
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
                minHeight: '25px',
                alignItems: 'stretch'
              }}
            >
              {/* 时间列 */}
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
                zIndex: 2
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
                      height: 'auto',
                      minWidth: '80px',
                      maxWidth: '100px',
                      overflow: 'visible',
                      position: 'relative'
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
        ⏱ 时间段详情
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
          
          // 计算任务时长（分钟）
          const calculateDuration = () => {
            if (!timeInfo) return 0;
            
            const [startHour, startMinute] = timeInfo.startTime.split(':').map(Number);
            const [endHour, endMinute] = timeInfo.endTime.split(':').map(Number);
            
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;
            
            return endTotalMinutes - startTotalMinutes;
          };
          
          const duration = calculateDuration();
          const durationText = duration >= 60 
            ? `${Math.floor(duration / 60)}小时${duration % 60}分钟`
            : `${duration}分钟`;

          return (
            <div key={index} style={{
              padding: '8px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              marginBottom: '5px',
              backgroundColor: '#f8f9fa',
              position: 'relative'
            }}>
              {/* 任务文本 */}
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '13px',
                paddingRight: '70px',
                marginBottom: '4px',
                lineHeight: '1.3'
              }}>
                {task.text}
              </div>
              
              {/* 时长显示在右上角 */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '10px',
                color: '#1a73e8',
                fontWeight: 'bold',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(26, 115, 232, 0.2)',
                whiteSpace: 'nowrap'
              }}>
                ⏱ {durationText}
              </div>
              
              {/* 其他信息 */}
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
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

const DailyLogModal = ({ onClose, onCopy, dailyRating, dailyReflection, tasksByDate, selectedDate, studyEndTime }) => {
  // 实时从 tasksByDate 和 selectedDate 生成日志内容
// 在 DailyLogModal 组件中，替换 generateRealTimeContent 函数

// 在 DailyLogModal 组件中，找到 generateRealTimeContent 函数并替换为：

// 在 DailyLogModal 组件中，找到 generateRealTimeContent 函数并替换：



const generateRealTimeContent = useCallback(() => {
  const dayTasks = (tasksByDate && tasksByDate[selectedDate]) || [];
  
  // ✅ 辅助函数：判断是否为常规任务
  const isRegularTask = (task) => {
    return task.isRegularTask === true;
  };
  
  // ✅ 辅助函数：获取任务的完成状态
  const getTaskCompletedStatus = (task, currentDate) => {
    if (task.abandoned) return false;
    
    // 跨日期任务：只有当天的 actualCompletedDate 等于当前日期才算完成
    if (task.crossDateId) {
      return task.actualCompletedDate === currentDate;
    }
    
    // 普通任务
    return task.done === true;
  };
  
  // ✅ 辅助函数：判断任务是否应该显示
  const shouldShowTask = (task, currentDate) => {
    if (task.abandoned) return true;
    
    // 跨日期任务：只有当天的 actualCompletedDate 等于当前日期时才显示
    if (task.crossDateId) {
      return task.actualCompletedDate === currentDate;
    }
    
    return true;
  };
  
  // ✅ 筛选当前日期应该显示的任务
  let filteredTasks = dayTasks.filter(task => {
    // 排除所有常规任务
    if (isRegularTask(task)) return false;
    if (task.category === "本周任务") return false;
    if (!shouldShowTask(task, selectedDate)) return false;
    return true;
  });
  
  // ========== ✅ 构建层级任务列表：母任务 + 子任务缩进 ==========
  const hierarchicalTasks = [];
  
  filteredTasks.forEach(task => {
    const hasSubTasks = task.subTasks && Array.isArray(task.subTasks) && task.subTasks.length > 0;
    const isCompleted = getTaskCompletedStatus(task, selectedDate);
    
    if (hasSubTasks) {
      // 1. 先添加母任务（不勾选）
      hierarchicalTasks.push({
        ...task,
        isCompleted: false,  // 母任务不显示勾选
        isParentTask: true,
        level: 0,
        displayText: task.text,
        subTaskCount: task.subTasks.length,
        completedSubCount: task.subTasks.filter(st => st.done).length,
      });
      
      // 2. 再添加子任务（缩进）
      task.subTasks.forEach(subTask => {
        hierarchicalTasks.push({
          ...task,
          id: `${task.id}_sub_${subTask.id || Math.random()}`,
          text: subTask.text || task.text,
          isCompleted: subTask.done || false,
          isSubTask: true,
          isParentTask: false,
          level: 1,
          parentTaskId: task.id,
          parentTaskText: task.text,
          displayText: subTask.text || task.text,
          timeSpent: 0,
          note: subTask.note || '',
          originalTask: task,
        });
      });
    } else {
      // 没有子任务：正常显示
      hierarchicalTasks.push({
        ...task,
        isCompleted: isCompleted,
        isParentTask: false,
        isSubTask: false,
        level: 0,
        displayText: task.text,
      });
    }
  });
  
  // 按分类和子分类组织任务
  const tasksByCategory = {};
  
  hierarchicalTasks.forEach(task => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = {
        withSubCategories: {},
        withoutSubCategories: []
      };
    }
    
    // 确定显示的分组
    const groupKey = task.isSubTask ? task.subCategory || '子任务' : (task.subCategory || '');
    
    if (task.subCategory) {
      if (!tasksByCategory[task.category].withSubCategories[task.subCategory]) {
        tasksByCategory[task.category].withSubCategories[task.subCategory] = [];
      }
      tasksByCategory[task.category].withSubCategories[task.subCategory].push(task);
    } else {
      tasksByCategory[task.category].withoutSubCategories.push(task);
    }
  });
  
  // 统计（使用母任务和子任务的完成状态）
  let totalCount = 0;
  let completedCount = 0;
  let abandonedCount = 0;
  
  hierarchicalTasks.forEach(task => {
    // 如果是母任务，不统计（因为子任务已经统计了）
    if (task.isParentTask) return;
    
    totalCount++;
    if (task.isCompleted) {
      completedCount++;
    }
    if (task.abandoned) {
      abandonedCount++;
    }
  });
  
  const totalTime = filteredTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
  const totalMinutes = Math.floor(totalTime / 60);
  
  const newStats = {
    completedTasks: completedCount,
    incompleteTasks: totalCount - completedCount - abandonedCount,
    abandonedTasks: abandonedCount,
    totalTasks: totalCount,
    completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    totalMinutes: totalMinutes,
    averagePerTask: completedCount > 0 ? Math.round(totalMinutes / completedCount) : 0,
    categories: Object.keys(tasksByCategory).length
  };
  
  return { tasksByCategory, newStats };
}, [tasksByDate, selectedDate]);


  const [currentContent, setCurrentContent] = useState(() => generateRealTimeContent());
  
useEffect(() => {
  const newContent = generateRealTimeContent();
  // 确保新内容有正确的结构
  if (newContent && newContent.tasksByCategory !== undefined) {
    setCurrentContent(newContent);
  }
}, [tasksByDate, selectedDate, generateRealTimeContent]);

// 在使用 currentContent 时添加安全检查
const { tasksByCategory, newStats } = currentContent || { tasksByCategory: {}, newStats: {} };
  
  // 获取表情
  const getRatingEmoji = () => {
    if (dailyRating === 1) return '😞';
    if (dailyRating === 2) return '😕';
    if (dailyRating === 3) return '😐';
    if (dailyRating === 4) return '😊';
    if (dailyRating === 5) return '🥳';
    return '❓';
  };
  

  
  const generateMarkdownContent = () => {
    let markdown = `# 学习任务\n\n`;
    
    if (dailyRating > 0 || dailyReflection) {
      markdown += "## 💭 今日总结\n\n";
      if (dailyRating > 0) {
        markdown += `- **今日状态**: ${getRatingEmoji()} }\n`;
      }
      if (dailyReflection) {
        markdown += `- **复盘**: ${dailyReflection}\n`;
      }
      markdown += "\n";
    }
    
    // 生成任务列表的 markdown
    Object.entries(tasksByCategory).forEach(([category, categoryData]) => {
      markdown += `## ${category}\n`;
      
      if (categoryData.withoutSubCategories.length > 0) {
        categoryData.withoutSubCategories.forEach((task) => {
          const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
          const timeText = minutes > 0 ? `【${minutes}m】` : "";
          
          if (task.isCompleted) {
            markdown += `- [x] ${task.text}${timeText}\n`;
          } else {
            markdown += `- [ ] ${task.text}${timeText}\n`;
          }
        });
      }
      
      if (categoryData.withoutSubCategories.length > 0 && Object.keys(categoryData.withSubCategories).length > 0) {
        markdown += '\n';
      }
      
      Object.entries(categoryData.withSubCategories).forEach(([subCategory, subTasks]) => {
        markdown += `### - ${subCategory}\n`;
        
        subTasks.forEach((task) => {
          const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
          const timeText = minutes > 0 ? `【${minutes}m】` : "";
          
          if (task.isCompleted) {
            markdown += `- [x] ${task.text}${timeText}\n`;
          } else {
            markdown += `- [ ] ${task.text}${timeText}\n`;
          }
        });
        
        if (Object.keys(categoryData.withSubCategories).length > 1) {
          markdown += '\n';
        }
      });
      
      markdown += '\n';
    });
    
    if (studyEndTime) {
      markdown += `## ⏰ 学习结束时间\n`;
      markdown += `- ${studyEndTime}\n\n`;
    }
    
    return markdown;
  };
  
  const markdownContent = generateMarkdownContent();
  
  const handleCopy = () => {
    onCopy(markdownContent);
  };
  
  // 获取结束时间显示
  const getEndTimeDisplay = () => {
    if (studyEndTime) {
      const [hour, minute] = studyEndTime.split(':').map(Number);
      const isLate = hour > 21 || (hour === 21 && minute > 0);
      return { time: studyEndTime, isLate };
    }
    return null;
  };
  
  const endTimeDisplay = getEndTimeDisplay();
  
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
          color: '#61A2Da',
          fontSize: '18px',
          flexShrink: 0
        }}>
          {selectedDate} 学习汇总
        </h3>
        
        {/* 统计卡片 - 4列，右侧加结束时间 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          marginBottom: 20
        }}>
          <div style={{ padding: '6px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>总任务</div>  
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a73e8' }}>
              {newStats.totalTasks}
            </div>  
          </div>
          <div style={{ padding: '6px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>已完成</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#4caf50' }}>
              {newStats.completedTasks}
            </div>
          </div>
          <div style={{ padding: '6px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>完成率</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff9800' }}>
              {newStats.completionRate}%
            </div>
          </div>
          <div style={{ padding: '6px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>学习时长</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#9c27b0' }}>
              {newStats.totalMinutes >= 60 
                ? `${(newStats.totalMinutes / 60).toFixed(1)}h` 
                : `${newStats.totalMinutes}分钟`}
            </div>
          </div>
          {/* 结束时间卡片 */}
          <div style={{ padding: '6px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>结束时间</div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: endTimeDisplay?.isLate ? '#f44336' : '#4caf50'
            }}>
              {endTimeDisplay?.time || '--:--'}
            </div>
          </div>
        </div>
        
        {/* 今日状态 - 只显示一行 */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: 12,
          borderRadius: 8,
          marginBottom: 15,
          textAlign: 'left'
        }}>
          
          <div style={{ fontSize: '13px', marginBottom: 4 }}>
  <span style={{ fontWeight: 'bold' }}>今日状态：</span>
  <span style={{ fontSize: '16px', marginLeft: '4px' }}>{getRatingEmoji()}</span>
</div>
          {dailyReflection && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: '12px' }}>复盘：</div>
              <div style={{ 
                backgroundColor: '#fff9c4', 
                padding: 8, 
                borderRadius: 4,
                border: '1px solid #ffd54f',
                fontSize: '12px',
                lineHeight: 1.4
              }}>
                {dailyReflection}
              </div>
            </div>
          )}
        </div>
        
        {/* 任务列表 */}
        
{/* 任务列表 */}
<div style={{
  backgroundColor: '#f8f9fa',
  padding: 15,
  borderRadius: 8,
  marginBottom: 15,
  fontSize: 12,
  lineHeight: 1.4,
  textAlign: 'left',
  flex: 1,
  minHeight: 'auto'
}}>
  {Object.entries(tasksByCategory).map(([category, categoryData]) => (
    <div key={category} style={{ marginBottom: '12px' }}>
      <div style={{ fontWeight: 'bold', color: '#1a73e8', marginBottom: '6px' }}>{category}</div>
      
      {/* 无子分类的任务 */}
      {categoryData.withoutSubCategories.map((task, idx) => {
        const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
        const timeText = minutes > 0 ? `【${minutes}m】` : "";
        
        // 判断是否是子任务（缩进显示）
        if (task.isSubTask) {
          return (
            <div key={task.id} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '6px', 
              marginBottom: '2px', 
              marginLeft: '32px',  // 缩进
              paddingLeft: '8px',
              borderLeft: '2px solid #e0e0e0'
            }}>
              <div style={{ flexShrink: 0, width: '14px', height: '14px', marginTop: '2px' }}>
                {task.isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                    <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, fontSize: '12px', color: task.isCompleted ? '#333' : '#999', lineHeight: '1.4' }}>
                {task.displayText || task.text}
                {task.note && <span style={{ fontSize: '10px', color: '#666', marginLeft: '4px' }}>（{task.note}）</span>}
              </div>
            </div>
          );
        }
        
        // 母任务和普通任务一样显示 ✅ 或 ❌
        return (
          <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px', marginLeft: '12px' }}>
            <div style={{ flexShrink: 0, width: '14px', height: '14px', marginTop: '2px' }}>
              {task.isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                  <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1, fontSize: '12px', color: task.isCompleted ? '#333' : '#999', lineHeight: '1.4' }}>
              {task.displayText || task.text}
              {task.isParentTask && (
                <span style={{ fontSize: '10px', color: '#999', marginLeft: '6px' }}>
                  ({task.completedSubCount || 0}/{task.subTaskCount || 0})
                </span>
              )}
              {timeText && <span style={{ fontSize: '10px', color: '#999', marginLeft: '6px' }}>{timeText}</span>}
            </div>
          </div>
        );
      })}
      
      {/* 有子分类的任务 */}
      {Object.entries(categoryData.withSubCategories).map(([subCategory, subTasks]) => (
        <div key={subCategory} style={{ marginLeft: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>- {subCategory}</div>
          {subTasks.map((task) => {
            const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
            const timeText = minutes > 0 ? `【${minutes}m】` : "";
            
            if (task.isSubTask) {
              return (
                <div key={task.id} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '6px', 
                  marginBottom: '2px', 
                  marginLeft: '36px',  // 子任务缩进
                  paddingLeft: '8px',
                  borderLeft: '2px solid #e0e0e0'
                }}>
                  <div style={{ flexShrink: 0, width: '14px', height: '14px', marginTop: '2px' }}>
                    {task.isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                        <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, fontSize: '12px', color: task.isCompleted ? '#333' : '#999', lineHeight: '1.4' }}>
                    {task.displayText || task.text}
                  </div>
                </div>
              );
            }
            
            // 母任务和普通任务一样显示 ✅ 或 ❌
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px', marginLeft: '16px' }}>
                <div style={{ flexShrink: 0, width: '14px', height: '14px', marginTop: '2px' }}>
                  {task.isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                      <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, fontSize: '12px', color: task.isCompleted ? '#333' : '#999', lineHeight: '1.4' }}>
                  {task.displayText || task.text}
                  {task.isParentTask && (
                    <span style={{ fontSize: '10px', color: '#999', marginLeft: '6px' }}>
                      ({task.completedSubCount || 0}/{task.subTaskCount || 0})
                    </span>
                  )}
                  {timeText && <span style={{ fontSize: '10px', color: '#999', marginLeft: '6px' }}>{timeText}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ))}
  
  {Object.keys(tasksByCategory).length === 0 && (
    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
      暂无学习任务
    </div>
  )}
</div>

        
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
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
   <div
  onClick={handleCopy}
  style={{
    flex: 1,
    padding: 12,
    backgroundColor: '#61A2Da',
    color: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'none',
    transform: 'none',
    scale: 1,
    boxShadow: 'none'
  }}
  // ⭐ 删除所有 onMouseEnter, onMouseLeave, onMouseDown 事件
>
  复制日志
</div>
        </div>
      </div>
    </div>
  );
};





// 重复设置模态框
const RepeatModal = ({ config, onSave, onClose }) => {
  const [frequency, setFrequency] = useState(config.frequency|| '');
  const [days, setDays] = useState(config.days ? [...config.days] : []);

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
// 在 TimeModal 组件内添加状态
const [studyEndHour, setStudyEndHour] = useState(config.studyEndHour || '');
const [studyEndMinute, setStudyEndMinute] = useState(config.studyEndMinute || '');
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
<div style={{ marginBottom: '16px' }}>
  <label style={{ 
    display: 'block', 
    marginBottom: '8px', 
    color: '#555', 
    fontSize: '13px',
    fontWeight: 'bold'
  }}>
    ⏰ 学习结束时间
  </label>
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <div style={{ flex: 1 }}>
      <input
        type="number"
        placeholder="时"
        value={studyEndHour}
        onChange={(e) => {
          let val = parseInt(e.target.value);
          if (isNaN(val)) val = '';
          if (val === '' || (val >= 0 && val <= 23)) setStudyEndHour(val);
        }}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: '14px',
          textAlign: 'center'
        }}
      />
    </div>
    <span style={{ fontSize: '16px', color: '#666' }}>:</span>
    <div style={{ flex: 1 }}>
      <input
        type="number"
        placeholder="分"
        value={studyEndMinute}
        onChange={(e) => {
          let val = parseInt(e.target.value);
          if (isNaN(val)) val = '';
          if (val === '' || (val >= 0 && val <= 59)) setStudyEndMinute(val);
        }}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: '14px',
          textAlign: 'center'
        }}
      />
    </div>
    <button
      onClick={() => {
        setStudyEndHour('');
        setStudyEndMinute('');
      }}
      style={{
        padding: '8px 12px',
        backgroundColor: '#f0f0f0',
        color: '#666',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      清除
    </button>
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


const WeekTaskModal = ({ onClose, onAdd, categories }) => {
  const [taskText, setTaskText] = useState('');
  const [targetCategory, setTargetCategory] = useState('健康');

  const handleAdd = () => {
    if (taskText.trim()) {
      onAdd(taskText.trim(), targetCategory);
      onClose();
    }
  };

  // 获取可用的分类（排除"本周任务"）
  const availableCategories = (categories || []).filter(c => 
    c.name !== "本周任务"
  );

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
        width: '90%',
        maxWidth: 350,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 20, 
          color: '#61A2Da',
          fontSize: 18
        }}>
          添加本周任务
        </h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontSize: 13, 
            fontWeight: 'bold',
            color: '#333'
          }}>
            任务内容
          </label>
          <textarea
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="输入本周任务内容..."
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'none',
              minHeight: '40px'
            }}
            rows="1"
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontSize: 13, 
            fontWeight: 'bold',
            color: '#333'
          }}>
            完成后移动到
          </label>
          <select
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: '#fff',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {availableCategories.map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#f0f0f0',
              color: '#333',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            取消
          </div>
          <div
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#61A2Da',
              color: '#fff',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            添加
          </div>
        </div>
      </div>
    </div>
  );
};

// 常规任务模态框组件 - 修改为支持类别选择
const RegularTaskModal = ({ onClose, onAdd, categories }) => {
  const [taskText, setTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('校内');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);  // 添加防重复状态

  const schoolCategory = categories?.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];

  const handleAdd = () => {
    if (!taskText.trim()) {
      alert('请输入任务内容');
      return;
    }
    
    // 防止重复添加
    if (isAdding) return;
    
    setIsAdding(true);
    onAdd(taskText.trim(), selectedCategory, selectedSubCategory);
    
    // 延迟关闭，避免快速连续点击
    setTimeout(() => {
      onClose();
      setIsAdding(false);
    }, 100);
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
        maxWidth: 350,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 20, 
          color: '#FF9800',
          fontSize: 18
        }}>
          📋 添加常规任务
        </h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontSize: 13, 
            fontWeight: 'bold',
            color: '#333'
          }}>
            任务内容
          </label>
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="输入常规任务内容..."
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontSize: 13, 
            fontWeight: 'bold',
            color: '#333'
          }}>
            完成后移动到
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory('');
            }}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: '#fff',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {categories.filter(c => c.name !== "常规任务" && c.name !== "本周任务").map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory === '校内' && (
          <div style={{ marginBottom: 15 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 5, 
              fontSize: 13, 
              fontWeight: 'bold',
              color: '#333'
            }}>
              子类别
            </label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: '#fff',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">无子类别</option>
              {schoolSubCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

       

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: isAdding ? '#ccc' : '#FF9800',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: isAdding ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            {isAdding ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
};


// 常规任务编辑模态框
// 常规任务编辑模态框
const RegularTaskEditModal = ({ task, onClose, onSave, categories }) => {
  const [editText, setEditText] = useState(task.text);
  const [selectedCategory, setSelectedCategory] = useState(task.targetCategory || task.category || '校内');
  const [selectedSubCategory, setSelectedSubCategory] = useState(task.targetSubCategory || task.subCategory || '');

  // 获取校内子分类 - 使用传入的 categories 或 baseCategories
  const schoolCategory = (categories || baseCategories).find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];

  const handleSave = () => {
    if (!editText.trim()) {
      alert('任务内容不能为空');
      return;
    }
    onSave(task.id, editText.trim(), selectedCategory, selectedSubCategory);
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
        maxWidth: 350,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 20, 
          color: '#FF9800',
          fontSize: 18
        }}>
          ✏️ 编辑常规任务
        </h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontSize: 13, 
            fontWeight: 'bold',
            color: '#333'
          }}>
            任务内容
          </label>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="输入任务内容..."
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontSize: 13, 
            fontWeight: 'bold',
            color: '#333'
          }}>
            完成后移动到
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory('');
            }}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: '#fff',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {(categories || baseCategories).filter(c => c.name !== "常规任务" && c.name !== "本周任务").map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 子分类选择 - 仅当选择"校内"时显示 */}
        {selectedCategory === '校内' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 5, 
              fontSize: 13, 
              fontWeight: 'bold',
              color: '#333'
            }}>
              子分类
            </label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ccc',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: '#fff',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">无子类别</option>
              {schoolSubCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{
          fontSize: 11,
          color: '#999',
          marginBottom: 15,
          padding: '8px',
          backgroundColor: '#fff3e0',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          💡 提示：完成任务后会自动移动到所选分类
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#FF9800',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};




const MonthTaskPage = ({ tasks, onClose, onAddTask, onUpdateProgress, onEditTask, onDeleteTask }) => {
  // ========== 所有状态定义 ==========
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('校内');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
 
  const [target, setTarget] = useState(100);
  const [initial, setInitial] = useState(0);  // 新增
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    text: '',
    category: '校内',
    subCategory: '',
  
    target: 100
  });

  const categories = ['校内', '语文', '数学', '英语', '通识', '综合', '运动', '生活', '心理'];
  const subCategories = ['数学', '语文', '英语', '运动'];

  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      alert('请输入任务内容');
      return;
    }

    const newTask = {
  id: Date.now().toString(),
  text: newTaskText.trim(),
  category: selectedCategory,
  subCategory: selectedSubCategory,
  progress: 0,
  timeSpent: 0,
  target: target,
  createdAt: new Date().toISOString()
};

    if (onAddTask) {
      onAddTask(newTask);
    }

    setNewTaskText('');
    setSelectedCategory('校内');
    setSelectedSubCategory('');
    
    setTarget(100);
   
    setShowAddForm(false);
  };

  const calculateMonthProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => {
      return sum + (task.progress / task.target);
    }, 0);
    return Math.round((totalProgress / tasks.length) * 100);
  };

  const monthProgress = calculateMonthProgress();

  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

 
  const saveEditTask = () => {
  if (!editFormData.text.trim()) {
    alert('任务内容不能为空');
    return;
  }

  const updatedTask = {
    ...editingTask,
    text: editFormData.text.trim(),
    category: editFormData.category,
    subCategory: editFormData.subCategory,
    initial: editFormData.initial,  // 新增
    target: editFormData.target,
    updatedAt: new Date().toISOString()  
  };

  if (onEditTask) {
    onEditTask(updatedTask);
  }
  setEditingTask(null);
};

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const handleDelete = (task) => {
    if (window.confirm(`确定要删除任务 "${task.text}" 吗？`)) {
      if (onDeleteTask) {
        onDeleteTask(task.id);
      }
    }
  };

 const handleProgressUpdate = (taskId, newProgress) => {
  // 找到对应的任务
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  
  // 获取初始值和目标值
  const initial = task.initial || 0;
  const target = task.target || 100;
  
  // 确保新进度在 [initial, target] 范围内
  const clampedProgress = Math.min(Math.max(initial, newProgress), target);
  
  if (onUpdateProgress) {
    onUpdateProgress(taskId, clampedProgress);
  }
};

  return (
    <>
      {/* 主模态框 */}
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
        padding: '10px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '15px',
          width: '95%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          {/* 关闭按钮 - 使用 div */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              zIndex: 10,
              transition: 'none',
              transform: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            ×
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#61A2Da', fontSize: '18px' }}>
            本月任务 ({tasks.length})
          </h2>

{/* 添加任务按钮 - 只在未显示表单时显示 */}
{!showAddForm && (
  <div
    onClick={() => setShowAddForm(true)}
    style={{
      width: '100%',
      padding: '14px',
      backgroundColor: '#61A2Da',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'none',
      transform: 'none',
      boxSizing: 'border-box'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#61A2Da';
      e.currentTarget.style.transform = 'none';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#61A2Da';
      e.currentTarget.style.transform = 'none';
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.transform = 'none';
    }}
  >
    + 添加本月任务
  </div>
)}

{/* 添加任务表单 - 只在显示表单时显示 */}
{showAddForm && (
  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
    <input
      type="text"
      placeholder="任务内容"
      value={newTaskText}
      onChange={(e) => setNewTaskText(e.target.value)}
      style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' }}
    />

    <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '12px', backgroundColor: '#fff' }}
    >
      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
    </select>

    {selectedCategory === '校内' && (
      <select
        value={selectedSubCategory}
        onChange={(e) => setSelectedSubCategory(e.target.value)}
        style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '12px', backgroundColor: '#fff' }}
      >
        <option value="">无子类别</option>
        {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
      </select>
    )}

    


{/* 初始值和目标值 */}
<div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
  <div style={{ flex: 1 }}>
    <input
      type="number"
      placeholder="初始值"
      value={initial}
      onChange={(e) => setInitial(Number(e.target.value))}
      style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
    />
  </div>
  <div style={{ flex: 1 }}>
    <input
      type="number"
      placeholder="目标值"
      value={target}
      onChange={(e) => setTarget(Number(e.target.value))}
      style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
    />
  </div>
</div>

    {/* 确认添加按钮 */}
    <div
      onClick={handleAddTask}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: '#61A2Da',
        color: '#fff',
        borderRadius: '6px',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'none',
        transform: 'none',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#61A2Da';
        e.currentTarget.style.transform = 'none';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#61A2Da';
        e.currentTarget.style.transform = 'none';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
    >
      确认添加
    </div>
  </div>
)}

          {/* 任务列表 */}
          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
              <div key={category} style={{ marginBottom: '15px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '8px', color: '#FF9800' }}>
                  {category} ({categoryTasks.length})
                </h3>
                
                {categoryTasks.map(task => (
                  <div key={task.id} style={{ padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{task.text}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        
                        {/* 编辑按钮 - 使用 div */}
                        <div
  onClick={() => {
    setEditingTask(task);
    setEditFormData({
      text: task.text,
      category: task.category,
      subCategory: task.subCategory || '',
      initial: task.initial || 0,
      target: task.target
    });
  }}
                          style={{
                            background: 'transparent',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'none',
                            transform: 'none'
                          }}
                          onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
                        >
                          ✏️
                        </div>
                        {/* 删除按钮 - 使用 div */}
                        <div
                          onClick={() => handleDelete(task)}
                          style={{
                            background: 'transparent',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'none',
                            transform: 'none'
                          }}
                          onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
                        >
                          🗑️
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                        <span>进度</span>
                        <span>{Math.round((task.progress / task.target) * 100)}% | {task.progress}/{task.target} {task.unit}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(task.progress / task.target) * 100}%`, height: '100%', backgroundColor: task.progress >= task.target ? '#4CAF50' : '#2196F3' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
           {/* -1 按钮 */}
<div
  onClick={() => handleProgressUpdate(task.id, task.progress - 1)}
  style={{
    padding: '8px 4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    textAlign: 'center',
    cursor: 'pointer'
  }}
>
  -1
</div>

{/* +1 按钮 */}
<div
  onClick={() => handleProgressUpdate(task.id, task.progress + 1)}
  style={{
    padding: '8px 4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    textAlign: 'center',
    cursor: 'pointer'
  }}
>
  +1
</div>

{/* 完成按钮 */}
<div
  onClick={() => handleProgressUpdate(task.id, task.target)}
  style={{
    padding: '8px 4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#e8f5e8',
    fontWeight: '500',
    textAlign: 'center',
    cursor: 'pointer'
  }}
>
  完成
</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              暂无本月任务，点击上方按钮添加
            </div>
          )}
        </div>
      </div>

      {/* 编辑任务模态框 */}
      {editingTask && (
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
          zIndex: 1100,
          padding: '10px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            width: '95%',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#FF9800' }}>编辑任务</h3>

            <input
              type="text"
              placeholder="任务内容"
              value={editFormData.text}
              onChange={(e) => setEditFormData({...editFormData, text: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />

            <select
              value={editFormData.category}
              onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {editFormData.category === '校内' && (
              <select
                value={editFormData.subCategory}
                onChange={(e) => setEditFormData({...editFormData, subCategory: e.target.value})}
                style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
              >
                <option value="">无子类别</option>
                {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            )}

            

            {/* 初始值和目标值 */}
{/* 初始值和目标值 */}
<div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
  <div style={{ flex: 1 }}>
    <input
      type="number"
      placeholder="初始值"
      value={editFormData.initial}
      onChange={(e) => setEditFormData({...editFormData, initial: Number(e.target.value)})}
      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
    />
  </div>
  <div style={{ flex: 1 }}>
    <input
      type="number"
      placeholder="目标值"
      value={editFormData.target}
      onChange={(e) => setEditFormData({...editFormData, target: Number(e.target.value)})}
      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
    />
  </div>
</div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* 取消按钮 - 使用 div */}
              <div
                onClick={cancelEdit}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ccc',
                  borderRadius: '4px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'none',
                  transform: 'none'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ccc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ccc'; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                取消
              </div>
              {/* 保存按钮 - 使用 div */}
              <div
                onClick={saveEditTask}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#FF9800',
                  color: '#fff',
                  borderRadius: '4px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'none',
                  transform: 'none'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FF9800'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FF9800'; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                保存
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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

  // 日期圆点组件 - 修改后版本（文字颜色跟随圆点变化）
// 日期圆点组件 - 修改后只显示完成的任务（排除常规任务）
// 日期圆点组件 - 显示完成、未完成、放弃三种状态
// 日期圆点组件 - 修改后只显示完成的任务（排除常规任务）
// 日期圆点组件 - 显示完成、未完成、放弃三种状态
const DateDot = ({ date, tasksByDate }) => {
  if (!tasksByDate) return null;

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayTasks = tasksByDate[dateStr] || [];
  
  // ========== 修改：跨日期任务只要任意一天完成就算完成 ==========
  let completedCount = 0;
  let abandonedCount = 0;
  let totalCount = 0;
  
  // 记录已经统计过的跨日期任务ID
  const countedCrossDateIds = new Set();
  
  dayTasks.forEach(task => {
    if (task.category === "本周任务") return;
    if (task.isRegularTask && !task.done) return;
    
    // 放弃的任务
    if (task.abandoned) {
      abandonedCount++;
      totalCount++;
      return;
    }
    
    // ✅ 跨日期任务：检查是否有任意一天完成
    if (task.crossDateId) {
      totalCount++;
      
      // 如果这个跨日期任务ID还没统计过
      if (!countedCrossDateIds.has(task.crossDateId)) {
        countedCrossDateIds.add(task.crossDateId);
        
        // 查找这个跨日期任务的所有实例，看是否有任何一天完成了
        let isAnyDateCompleted = false;
        
        // 遍历所有日期，查找相同 crossDateId 的任务
        Object.keys(tasksByDate).forEach(dateKey => {
          const tasksOnDate = tasksByDate[dateKey] || [];
          const hasCompleted = tasksOnDate.some(t => 
            t.crossDateId === task.crossDateId && 
            t.done === true &&
            t.abandoned !== true
          );
          if (hasCompleted) {
            isAnyDateCompleted = true;
          }
        });
        
        if (isAnyDateCompleted) {
          completedCount++;
        }
      }
      return;
    }
    
    // 普通任务
    totalCount++;
    if (task.done === true) {
      completedCount++;
    }
  });
  
  // 未完成数量 = 总数 - 已完成 - 放弃
  const incompleteCount = totalCount - completedCount - abandonedCount;
  
  // 设置颜色
  let numberColor = "#666";
  let dotColor = "#666";
  
  if (totalCount === 0) {
    numberColor = "transparent";
    dotColor = "transparent";
  } else if (incompleteCount > 0) {
    // 有未完成的任务 → 红色
    numberColor = "#f44336";
    dotColor = "#f44336";
  } else if (completedCount === totalCount) {
    // 全部完成 → 绿色
    numberColor = "#4caf50";
    dotColor = "#4caf50";
  } else {
    // 没有未完成，但有放弃（部分完成 + 部分放弃）→ 灰色
    numberColor = "#999";
    dotColor = "#999";
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3px',
      marginTop: '2px',
      fontSize: '9px'
    }}>
      {/* 绿色点 + 完成数量 */}
      {completedCount > 0 && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#4caf50',
          }} />
          <span style={{
            fontSize: '9px',
            color: '#4caf50',
            fontWeight: 'bold'
          }}>
            {completedCount}
          </span>
        </span>
      )}
      
      {/* 红色点 + 未完成数量 */}
      {incompleteCount > 0 && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#f44336',
          }} />
          <span style={{
            fontSize: '9px',
            color: '#f44336',
            fontWeight: 'bold'
          }}>
            {incompleteCount}
          </span>
        </span>
      )}
      
      {/* 灰色点 + 放弃数量 */}
      {abandonedCount > 0 && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#999',
          }} />
          <span style={{
            fontSize: '9px',
            color: '#999',
            fontWeight: 'bold'
          }}>
            {abandonedCount}
          </span>
        </span>
      )}
    </div>
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
                  const selectedDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    day,
    12, // 设置为中午12点，避免时区偏移
    0,
    0
  );
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

       <div
  onClick={onClose}
  style={{
    width: '100%',
    padding: '10px',
    background: softColors.primary,
    color: '#FFFFFF',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center'
  }}
>
  关闭
</div>
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
// TaskEditModal 组件 - 紧凑版样式修改
const TaskEditModal = ({ task, categories, setShowCrossDateModal, setShowMoveTaskModal, onClose, onSave, onTogglePinned, onImageUpload, setShowDeleteModal, setCategories, onCancelAbandoned,  onMarkAbandoned }) => {
  const [editData, setEditData] = useState({
    text: task.text || '',
    
    category: task.category || categories[0]?.name || '校内',
    subCategory: task.subCategory || '',
    note: task.note || '',
    reflection: task.reflection || '',
    tags: task.tags || [],
    scheduledTime: task.scheduledTime || '',
    expValue: task.expValue || 2, 
    reminderYear: task.reminderTime?.year?.toString() || new Date().getFullYear().toString(),
    reminderMonth: task.reminderTime?.month?.toString() || '',
    reminderDay: task.reminderTime?.day?.toString() || '',
    reminderHour: task.reminderTime?.hour?.toString() || '',
    reminderMinute: task.reminderTime?.minute?.toString() || '',
     isCountTask: task.isCountTask || false,
  count: task.count || 0,
    repeatFrequency: task.repeatFrequency || '',
    repeatDays: task.repeatDays || [false, false, false, false, false, false, false],
    subTasks: task.subTasks || [],
    
    targetCategory: task.targetCategory || '',
    targetSubCategory: task.targetSubCategory || '',
    isRegularTask: task.isRegularTask || false,
    
    startHour: task.scheduledTime ? 
      (() => {
        const startPart = task.scheduledTime.split('-')[0];
        return startPart ? startPart.split(':')[0] || '' : '';
      })() : '',
    
    startMinute: task.scheduledTime ? 
      (() => {
        const startPart = task.scheduledTime.split('-')[0];
        return startPart ? startPart.split(':')[1] || '' : '';
      })() : '',
    
    endHour: task.scheduledTime ? 
      (() => {
        const endPart = task.scheduledTime.split('-')[1];
        return endPart ? endPart.split(':')[0] || '' : '';
      })() : '',
    
    endMinute: task.scheduledTime ? 
      (() => {
        const endPart = task.scheduledTime.split('-')[1];
        return endPart ? endPart.split(':')[1] || '' : '';
      })() : '',
    
    progress: task.progress || {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    pinned: task.pinned || false,
    newTagName: '',
    newTagColor: '#e0e0e0',
    newSubTask: ''
  });

const [taskCustomTags, setTaskCustomTags] = useState(() => {
    const saved = localStorage.getItem('task_custom_tags');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 保存任务自定义标签到 localStorage
  useEffect(() => {
    localStorage.setItem('task_custom_tags', JSON.stringify(taskCustomTags));
  }, [taskCustomTags]);

const [showAbandonReason, setShowAbandonReason] = useState(false);
const [abandonReason, setAbandonReason] = useState('');
const [abandonNote, setAbandonNote] = useState('');

const abandonReasons = [
  { value: '不愿做', label: '不愿做', color: '#f44336' },
  { value: '没时间', label: '没时间', color: '#ff9800' },
  { value: '不重要', label: '不重要', color: '#9e9e9e' },
  { value: '等待资料', label: '等待资料', color: '#ffc107' },
  { value: '身体不适', label: '身体不适', color: '#e91e63' },
  { value: '其他', label: '其他', color: '#607d8b' }
];

  const [showMoreConfig, setShowMoreConfig] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (editData.text.trim() === '') {
      alert('任务内容不能为空！');
      return;
    }

    const updatedTask = {
      ...editData,
      scheduledTime: editData.startHour && editData.startMinute && editData.endHour && editData.endMinute
        ? `${editData.startHour.padStart(2, '0')}:${editData.startMinute.padStart(2, '0')}-${editData.endHour.padStart(2, '0')}:${editData.endMinute.padStart(2, '0')}`
        : editData.scheduledTime || '',
      
      reminderTime: (editData.reminderYear && editData.reminderMonth && editData.reminderDay)
        ? {
            year: parseInt(editData.reminderYear),
            month: parseInt(editData.reminderMonth),
            day: parseInt(editData.reminderDay),
            hour: parseInt(editData.reminderHour) || 0,
            minute: parseInt(editData.reminderMinute) || 0
          }
        : null,
      
      progress: editData.progress || {
        initial: 0,
        current: 0,
        target: 0,
        unit: "%"
      }
    };
    onSave(task, editData);
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
    { name: '考试', color: '#f44336', textColor: '#fff' },
    { name: '背诵', color: '#795548', textColor: '#fff' },
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

      <style>{`
      button.clear-reminder-btn,
      button.clear-reminder-btn:hover,
      button.clear-reminder-btn:active,
      button.clear-reminder-btn:focus,
      button.clear-reminder-btn:focus-visible,
      button.clear-reminder-btn:visited,
      button.clear-reminder-btn:link {
        background-color: #f0f0f0 !important;
        color: #666 !important;
        border: 1px solid #ccc !important;
        transform: none !important;
        scale: 1 !important;
        box-shadow: none !important;
        outline: none !important;
        opacity: 1 !important;
        filter: none !important;
        transition: none !important;
        animation: none !important;
        text-decoration: none !important;
        background-image: none !important;
      }
    `}</style>
      
      {/* 紧凑版模态框 - 减小内边距，缩小间距 */}
      <div style={{
  backgroundColor: 'white',
  padding: '12px 12px',
  borderRadius: 16,
  width: '98%',
  maxWidth: 450,
  maxHeight: '90vh',           // ✅ 添加最大高度
  overflow: 'auto',            // ✅ 允许滚动
  overflowY: 'auto',           // ✅ 垂直滚动
  WebkitOverflowScrolling: 'touch',  // ✅ iOS 平滑滚动
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  border: '1px solid #e0e0e0',
  position: 'relative'
}}>

        {/* 标题栏 - 紧凑版，靠近横线 */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: '6px',      // 改小，靠近横线
  paddingBottom: '4px',     // 改小，靠近横线
  borderBottom: "1px solid #f0f0f0"
}}>
  
  <div style={{ 
    display: "flex", 
    gap: "2px",
    alignItems: "center",
    flexShrink: 0,
    flexWrap: "nowrap",
    marginLeft: "auto"
  }}>
    {/* ===== 如果任务已放弃，显示取消放弃按钮 ===== */}
    {/* ===== 根据任务状态显示不同按钮 ===== */}
  {task.abandoned ? (
    // 已放弃 → 显示"取消放弃"（红色叉）
    <button
      onClick={() => {
        if (window.confirm('确定要取消放弃这个任务吗？\n\n取消后任务将恢复为未完成状态，并加回经验值。')) {
          onCancelAbandoned(task);
          onClose();
        }
      }}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="取消放弃"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="round"/>
        <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </button>
  ) : (
    // 未放弃 → 显示"放弃"（圆圈叉）
    <button
      onClick={() => {
        setShowAbandonReason(true);
      }}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="标记为做不完"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="#61A2Da" strokeWidth="2" fill="none"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  )}

    {/* 2. 跨日期按钮 */}
    <button
      onClick={() => {
        onClose();
        setTimeout(() => {
          setShowCrossDateModal(task);
        }, 100);
      }}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="跨日期显示"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="15" r="1.5" fill="#61A2Da"/>
        <circle cx="16" cy="15" r="1.5" fill="#61A2Da"/>
        <circle cx="8" cy="15" r="1.5" fill="#61A2Da"/>
      </svg>
    </button>

    {/* 3. 迁移任务按钮 */}
    <button
      onClick={() => {
        onClose();
        setTimeout(() => {
          setShowMoveTaskModal(task);
        }, 100);
      }}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="迁移任务"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H21V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V6Z" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <path d="M8 3H16L18 6H6L8 3Z" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <path d="M12 10V16" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M9 13L12 16L15 13" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>

    {/* 4. 置顶按钮 */}
    <button
      onClick={() => {
        onTogglePinned(task);
        setEditData({ ...editData, pinned: !editData.pinned });
      }}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title={editData.pinned ? "取消置顶" : "置顶任务"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L12 16" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round"/>
        <path d="M5 9L12 2L19 9" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <text x="12" y="22" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#61A2Da">TOP</text>
      </svg>
    </button>

    {/* 5. 删除按钮 */}
    <button
      onClick={handleDelete}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="删除任务"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7H20" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 11V16" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M14 11V16" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M6 7L8 21H16L18 7" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <path d="M9 7L10 3H14L15 7" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
      </svg>
    </button>

    {/* 6. 添加图片按钮 */}
    <button
      onClick={handleImageClick}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="添加图片"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <circle cx="8.5" cy="9.5" r="1.5" fill="#61A2Da"/>
        <path d="M7 16L11 12L15 16L20 11" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </button>

    {/* 7. 保存按钮 */}
    <button
      onClick={handleSave}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="保存"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="#61A2Da" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      </svg>
    </button>

    {/* 8. 关闭按钮 */}
    <button
      onClick={onClose}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        flexShrink: 0
      }}
      title="关闭"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="6" y2="18" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  </div>
</div>

        {/* 表单内容 - 紧凑版，减小所有间距 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8  // 从 16px 减小到 8px
        }}>
         
          {/* 任务内容 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 4,  // 从 8px 减小到 4px
              fontWeight: '600',
              color: '#333',
              fontSize: 12  // 从 14px 减小到 12px
            }}>
              任务
            </label>
            <textarea
  value={editData.text}
  onChange={(e) => {
    setEditData({ ...editData, text: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }}
  // 👇 添加这个 onFocus 来实现点击自动展开
  onFocus={(e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    e.target.style.borderColor = '#1a73e8';
    e.target.style.backgroundColor = '#fff';
  }}
  onBlur={(e) => {
    e.target.style.borderColor = '#e0e0e0';
    e.target.style.backgroundColor = '#fafafa';
  }}
  placeholder="请输入任务内容..."
  style={{
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: '#fafafa',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'none',
    outline: 'none',
    lineHeight: '1.4',
    overflow: 'hidden'
  }}
  rows="1"
/>
          </div>

          {/* 备注 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 4,
              fontWeight: '600',
              color: '#333',
              fontSize: 12
            }}>
              备注
            </label>
            <textarea
  value={editData.note}
  onChange={(e) => {
    setEditData({ ...editData, note: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }}
  // 👇 添加这个 onFocus
  onFocus={(e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    e.target.style.borderColor = '#1a73e8';
    e.target.style.backgroundColor = '#fff';
  }}
  onBlur={(e) => {
    e.target.style.borderColor = '#e0e0e0';
    e.target.style.backgroundColor = '#fafafa';
  }}
  placeholder=""
  style={{
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: '#fafafa',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'none',
    outline: 'none',
    lineHeight: '1.4',
    overflow: 'hidden'
  }}
  rows="1"
/>
          </div>

          {/* 感想 */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 4,
              fontWeight: '600',
              color: '#333',
              fontSize: 12
            }}>
              感想
            </label>
            <textarea
  value={editData.reflection}
  onChange={(e) => {
    setEditData({ ...editData, reflection: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }}
  // 👇 添加这个 onFocus
  onFocus={(e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    e.target.style.borderColor = '#1a73e8';
    e.target.style.backgroundColor = '#fff';
  }}
  onBlur={(e) => {
    e.target.style.borderColor = '#e0e0e0';
    e.target.style.backgroundColor = '#fafafa';
  }}
  placeholder=""
  style={{
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 13,
    backgroundColor: '#fafafa',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'none',
    outline: 'none',
    lineHeight: '1.4',
    overflow: 'hidden'
  }}
  rows="1"
/>
          </div>

          {/* 类别和子类别在同一行 - 紧凑版 */}
          {/* 类别 + 标签 - 各占一半 */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  alignItems: 'start',
  marginBottom: 8
}}>
  {/* ===== 左侧：类别 ===== */}
  <div>
    <label style={{
      display: 'block',
      marginBottom: 4,
      fontWeight: '600',
      color: '#333',
      fontSize: 12
    }}>
      类别
    </label>
    <select
      value={editData.category}
      onChange={(e) =>
        setEditData({
          ...editData,
          category: e.target.value,
        })
      }
      style={{
        width: '100%',
        height: 32,
        padding: '0 8px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 13,
        backgroundColor: '#fff',
        cursor: 'pointer',
        boxSizing: 'border-box'
      }}
    >
      {categories.map((cat) => (
        <option key={cat.name} value={cat.name}>
          {cat.name}
        </option>
      ))}
    </select>
  </div>

  {/* ===== 右侧：标签 ===== */}
  <div>
    <label style={{
      display: 'block',
      marginBottom: 4,
      fontWeight: '600',
      color: '#333',
      fontSize: 12
    }}>
      标签
    </label>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      alignItems: 'center',
      width: '100%'
    }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <input
          type="text"
          placeholder="输入标签"
          value={editData.newTagName || ''}
          onChange={(e) => setEditData({ ...editData, newTagName: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && editData.newTagName?.trim()) {
              const tagName = editData.newTagName.trim();
              if (!editData.tags?.includes(tagName)) {
                setEditData({
                  ...editData,
                  tags: [...(editData.tags || []), tagName],
                  newTagName: ''
                });
              }
              e.preventDefault();
            }
          }}
          style={{
            flex: 1,
            minWidth: '50px',
            height: '28px',
            padding: '0 6px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: '12px',
            backgroundColor: '#fff',
            boxSizing: 'border-box'
          }}
        />
        <div
          onClick={() => {
            if (editData.newTagName?.trim()) {
              const tagName = editData.newTagName.trim();
              if (!editData.tags?.includes(tagName)) {
                setEditData({
                  ...editData,
                  tags: [...(editData.tags || []), tagName],
                  newTagName: ''
                });
              }
            }
          }}
          style={{
            height: '28px',
            padding: '0 10px',
            backgroundColor: '#61A2Da',
            color: '#fff',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          添加
        </div>
      </div>
      
      {editData.tags && editData.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {editData.tags.map((tag, idx) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            return (
              <span key={idx} style={{
                fontSize: '10px',
                padding: '1px 8px',
                backgroundColor: '#61A2Da',
                color: '#fff',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                height: '22px'
              }}>
                {tagName}
                <span
                  onClick={() => {
                    const newTags = editData.tags.filter((_, i) => i !== idx);
                    setEditData({ ...editData, tags: newTags });
                  }}
                  style={{ cursor: 'pointer', fontSize: '10px', lineHeight: '1' }}
                >
                  ×
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  </div>
</div>


{/* ===== ✅ 任务类型选择 ===== */}
{/* ===== ✅ 任务类型选择 ===== */}
<div style={{ marginBottom: 8 }}>
  <label style={{
    display: 'block',
    marginBottom: 4,
    fontWeight: '600',
    color: '#333',
    fontSize: 12
  }}>
    任务类型
  </label>
  <div style={{ display: 'flex', gap: '12px' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
      <input
        type="radio"
        checked={!editData.isCountTask}
        onChange={() => setEditData({ ...editData, isCountTask: false })}
      />
      一次性
    </label>
    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
      <input
        type="radio"
        checked={editData.isCountTask}
        onChange={() => setEditData({ ...editData, isCountTask: true })}
      />
      多次任务
    </label>
  </div>
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
    进度
  </label>

  <div
    style={{
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    }}
  >
    {/* 当前值 */}
    <div style={{ 
      flex: 1,
      minWidth: 0,  // 允许内容收缩
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          fontSize: 12,
          color: '#666',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          当前值
        </span>
        <input
  type="number"
  value={editData.progress?.current ?? ''}
  onChange={(e) => {
    const value = e.target.value;
    if (value === '') {
      setEditData({
        ...editData,
        progress: {
          ...editData.progress,
          current: 0,
        },
      });
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      const target = editData.progress?.target || 0;
      const finalValue = target > 0 ? Math.min(numValue, target) : numValue;
      setEditData({
        ...editData,
        progress: {
          ...editData.progress,
          current: finalValue,
        },
      });
    }
  }}
  onFocus={(e) => {
    e.target.select();
  }}
  min="0"
  step="1"
  style={{
    flex: 1,
    minWidth: 0,
    height: 32,
    padding: '0 6px',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: 13,
    textAlign: 'left',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  }}
/>
      </div>
    </div>

    {/* 目标值 */}
    <div style={{ 
      flex: 1,
      minWidth: 0,  // 允许内容收缩
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          fontSize: 12,
          color: '#666',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          目标值
        </span>
        <input
          type="number"
          value={editData.progress?.target || ''}
          onChange={(e) =>
            setEditData({
              ...editData,
              progress: {
                ...editData.progress,
                target: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
              },
            })
          }
          style={{
            flex: 1,
            minWidth: 0,  // 允许输入框收缩
            height: 32,
            padding: '0 6px',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 13,
            textAlign: 'left',
            backgroundColor: '#fff',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  </div>
</div>



          <div>
            {/* 标签 - 紧凑版 */}


            {/* 提醒时间 - 紧凑版 */}
            <div style={{ marginTop: 8 }}> 
              <label style={{
                display: 'block',
                marginTop: 4,
                marginBottom: 4,
                fontWeight: 600,
                color: '#333',
                fontSize: 12
              }}>
                时间
              </label>
              <div style={{
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                flexWrap: 'nowrap',
                width: '100%'
              }}>
                <input type="number" min="2024" max="2030" placeholder="年" value={editData.reminderYear || ''} onChange={(e) => setEditData({ ...editData, reminderYear: e.target.value })} style={{ flex: 1.2, minWidth: '45px', height: 30, padding: '0 3px', border: '1px solid #ccc', borderRadius: 5, fontSize: 12, textAlign: 'center', backgroundColor: '#fff' }} />
                <span style={{ color: '#666', fontSize: 12 }}>/</span>
                <input type="number" min="1" max="12" placeholder="月" value={editData.reminderMonth || ''} onChange={(e) => setEditData({ ...editData, reminderMonth: e.target.value })} style={{ flex: 1, minWidth: '40px', height: 30, padding: '0 3px', border: '1px solid #ccc', borderRadius: 5, fontSize: 12, textAlign: 'center', backgroundColor: '#fff' }} />
                <span style={{ color: '#666', fontSize: 12 }}>/</span>
                <input type="number" min="1" max="31" placeholder="日" value={editData.reminderDay || ''} onChange={(e) => setEditData({ ...editData, reminderDay: e.target.value })} style={{ flex: 1, minWidth: '40px', height: 30, padding: '0 3px', border: '1px solid #ccc', borderRadius: 5, fontSize: 12, textAlign: 'center', backgroundColor: '#fff' }} />
                <input type="number" min="0" max="23" placeholder="时" value={editData.reminderHour || ''} onChange={(e) => setEditData({ ...editData, reminderHour: e.target.value })} style={{ flex: 1, minWidth: '40px', height: 30, padding: '0 3px', border: '1px solid #ccc', borderRadius: 5, fontSize: 12, textAlign: 'center', backgroundColor: '#fff' }} />
                <span style={{ color: '#666', fontSize: 12 }}>:</span>
                <input type="number" min="0" max="59" placeholder="分" value={editData.reminderMinute || ''} onChange={(e) => setEditData({ ...editData, reminderMinute: e.target.value })} style={{ flex: 1, minWidth: '40px', height: 30, padding: '0 3px', border: '1px solid #ccc', borderRadius: 5, fontSize: 12, textAlign: 'center', backgroundColor: '#fff' }} />
              </div>
            </div>

            {/* 子任务 - 紧凑版 */}
            <div style={{ marginTop: 8 }}> 
              <label style={{
                display: 'block',
                marginTop: 4,
                marginBottom: 4,
                fontWeight: 600,
                color: '#333',
                fontSize: 12
              }}>
                子任务
              </label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <input type="text" placeholder="输入子任务内容" value={editData.newSubTask || ''} onChange={(e) => setEditData({ ...editData, newSubTask: e.target.value })} style={{ flex: 1, height: 30, padding: '0 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: 12, backgroundColor: '#fff' }} />
                <button onClick={() => { if (editData.newSubTask?.trim()) { setEditData({ ...editData, subTasks: [...(editData.subTasks || []), { text: editData.newSubTask.trim(), done: false }], newSubTask: '' }); } }} style={{ height: 30, width: 30, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>+</button>
              </div>
              {editData.subTasks?.length > 0 && (
                <div>
                  {editData.subTasks.map((subTask, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <input type="checkbox" checked={subTask.done || false} onChange={(e) => { const newSubTasks = [...editData.subTasks]; newSubTasks[index] = { ...newSubTasks[index], done: e.target.checked }; setEditData({ ...editData, subTasks: newSubTasks }); }} style={{ transform: 'scale(1.1)', cursor: 'pointer' }} />
                      <input type="text" value={subTask.text || ''} onChange={(e) => { const newSubTasks = [...editData.subTasks]; newSubTasks[index] = { ...newSubTasks[index], text: e.target.value }; setEditData({ ...editData, subTasks: newSubTasks }); }} placeholder="子任务内容" style={{ flex: 1, height: 30, padding: '0 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: 12, backgroundColor: '#fff' }} />
                      <button onClick={() => { const newSubTasks = editData.subTasks.filter((_, i) => i !== index); setEditData({ ...editData, subTasks: newSubTasks }); }} style={{ height: 30, width: 42, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

      {/* 放弃原因弹窗保持不变 */}
      {showAbandonReason && (
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
          zIndex: 10000,
          padding: '10px'
        }} onClick={() => setShowAbandonReason(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '350px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#61A2Da',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>🚫 放弃任务</h3>
            </div>
            
            <div style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#333' }}>
                任务：<strong>{task.text}</strong>
              </p>
              
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {abandonReasons.map(reason => (
                  <div
                    key={reason.value}
                    onClick={() => setAbandonReason(reason.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '18px',
                      backgroundColor: abandonReason === reason.value ? reason.color : '#f0f0f0',
                      color: abandonReason === reason.value ? '#fff' : '#333',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'none',
                      border: `1px solid ${abandonReason === reason.value ? reason.color : '#e0e0e0'}`
                    }}
                  >
                    {reason.label}
                  </div>
                ))}
              </div>
              
              <input
                type="text"
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
                placeholder="或直接输入放弃原因..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  marginBottom: '12px'
                }}
              />
              
              <div style={{ display: 'flex', gap: '8px' }}>
               {/* 取消按钮 - 使用 div */}
<div
  onClick={() => {
    setShowAbandonReason(false);
    setAbandonReason('');
    setAbandonNote('');
  }}
  style={{
    flex: 1,
    padding: '8px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'center',
    userSelect: 'none',
    transition: 'none',
    transform: 'none'
  }}
>
  取消
</div>

{/* 确认放弃按钮 - 使用 div */}
<div
  onClick={() => {
    if (!abandonReason.trim()) {
      alert('请选择或输入放弃原因');
      return;
    }
    const abandonInfo = {
      reason: abandonReason.trim(),
      note: abandonNote,
      timestamp: new Date().toISOString()
    };
    if (onMarkAbandoned) {
      onMarkAbandoned(task, abandonInfo);
    }
    setShowAbandonReason(false);
    setAbandonReason('');
    setAbandonNote('');
    onClose();
  }}
  style={{
    flex: 1,
    padding: '8px',
    backgroundColor: '#f44336',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'center',
    userSelect: 'none',
    transition: 'none',
    transform: 'none'
  }}
>
  确认放弃
</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// 任务编辑模态框



const TaskItem = ({
  task,
  onEditTime,
  tasksByDate = {} ,
  onEditNote,
  onEditReflection,
  onOpenEditModal,
  onShowImageModal,
  showCategoryTag = false,
  formatTimeNoSeconds,
  toggleDone,
  selectedDate, 
  formatTimeWithSeconds,
  onMoveTask,
  getTaskCompletionType,
  categories,
  setShowMoveModal,
  onToggleSubTask,
  onUpdateProgress,
  onDeleteTask, 
  onDeleteImage,
  
  onUpdateAbandonInfo,
  onUpdateExpValue, 
  
  onEditSubTask = () => {},
  isSortingMode = false,
  onIncrementCount,
}) => {
  const [editingSubTaskIndex, setEditingSubTaskIndex] = useState(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [showProgressControls, setShowProgressControls] = useState(false);
  const [editingSubTaskNoteIndex, setEditingSubTaskNoteIndex] = useState(null);
// 在 TaskItem 组件内部，其他 useState 旁边添加（约在第 3880 行附近）
const [showCrossDateDetail, setShowCrossDateDetail] = useState(false);
const [localDateStatus, setLocalDateStatus] = useState({});
const [showExpModal, setShowExpModal] = useState(false);
  const [expInputValue, setExpInputValue] = useState(task.expValue || 2);
// 初始化本地完成状态
useEffect(() => {
  if (task.crossDateId && tasksByDate) {
    const allDates = task.crossDates || [];
    const statusMap = {};
    allDates.forEach(date => {
      const dayTasks = tasksByDate[date] || [];
      const taskOnDate = dayTasks.find(t => t.crossDateId === task.crossDateId);
      statusMap[date] = taskOnDate?.done || false;
    });
    setLocalDateStatus(statusMap);
  }
}, [task.crossDateId, tasksByDate, task.crossDates]);

// 切换单个日期的完成状态
const toggleDateCompletion = (date, isChecked) => {
  // 更新本地状态
  setLocalDateStatus(prev => ({ ...prev, [date]: isChecked }));
  
  // 找到该日期的任务并更新完成状态
  const dayTasks = tasksByDate[date] || [];
  const taskOnDate = dayTasks.find(t => t.crossDateId === task.crossDateId);
  
  if (taskOnDate) {
    // 调用 toggleDone 来更新任务状态
    toggleDone(taskOnDate);
  }
};
// 处理进度调整
const handleProgressAdjust = (increment) => {
  const currentValue = Number(task.progress?.current) || 0;
  const targetValue = Number(task.progress?.target) || 100;
  // ✅ 修复：最小值是0，最大值是目标值
  const newCurrent = Math.min(Math.max(0, currentValue + increment), targetValue);
  
  if (onUpdateProgress) {
    onUpdateProgress(task, newCurrent);
  }
};

  // 计算进度百分比
  const getProgressPercent = () => {
    const current = Number(task.progress?.current) || 0;
    const target = Number(task.progress?.target) || 0;
    if (target === 0) return 0;
    const percent = ((current) / (target)) * 100;
    return Math.min(Math.max(0, percent), 100);
  };

  const progressPercent = getProgressPercent();
  const hasProgress = task.progress && task.progress.target > 0;

  // 开始编辑子任务
  const startEditSubTask = (index, currentText) => {
    setEditingSubTaskIndex(index);
    setEditSubTaskText(currentText);
  };

  // 保存子任务
  const saveEditSubTask = () => {
    if (editSubTaskText.trim() && editingSubTaskIndex !== null) {
      const currentSubTask = task.subTasks[editingSubTaskIndex];
      const currentNote = currentSubTask?.note || '';
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

  return (
    <li
      className="task-item"
      style={{
        position: "relative",
        background: "transparent",
        borderRadius: 6,
        marginBottom: 4,
        padding: "6px 8px",
        border: "0.5px solid #e0e0e0",
        boxSizing: "border-box"
      }}
    >
      {/* 主要内容行 - 任务文字和右侧时间/排序按钮在同一行 */}
     <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: "28px" }}>
  {/* 主复选框 - 判断是否有任何一天完成 */}
 


{/* 复选框 - 放弃的任务显示叉号，跨日期任务正常显示 */}
{/* 复选框 */}
{task.abandoned ? (
  // 放弃的任务：显示红色叉
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "14px",
      height: "14px",
      margin: 0,
      flexShrink: 0,
      border: "1.5px solid #f44336",
      borderRadius: "2px",
      backgroundColor: "#fff5f5",
      cursor: "default"
    }}
  >
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="round"/>
      <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </span>
) : task.crossDateId ? (
  // 跨日期任务（未放弃）的正常复选框
  <input
    type="checkbox"
    checked={task.done}
    onChange={(e) => {
      e.stopPropagation();
      if (typeof toggleDone === 'function') {
        toggleDone(task, selectedDate);
      }
    }}
    style={{ 
      margin: 0, 
      cursor: "pointer", 
      flexShrink: 0, 
      width: "14px", 
      height: "14px"
    }}
  />
) : (
  // 普通任务
  <input
    type="checkbox"
    checked={task.done}
    onChange={(e) => {
      e.stopPropagation();
      if (typeof toggleDone === 'function') {
        toggleDone(task);
      }
    }}
    style={{ 
      margin: 0, 
      cursor: "pointer", 
      flexShrink: 0, 
      width: "14px", 
      height: "14px"
    }}
  />
)}





  {/* 任务文字 + 📅 图标 */}



{/* 任务文字 */}
{/* 任务文字 */}
<div
  onClick={(e) => {
    e.stopPropagation();
    onOpenEditModal(task);
  }}
  style={{
    wordBreak: "break-word",
    cursor: "pointer",
    color: task.abandoned 
      ? "#999"
      : (task.done ? "#999" : "#000"),
    fontWeight: task.pinned ? "bold" : "normal",
    fontSize: "13px",
    lineHeight: "1.5",
    flex: 1,
    minWidth: "50px",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflowWrap: "break-word"
  }}
>
  {task.text}
  
  {/* ✅ 显示技能标签 */}
  {task.tags && task.tags.length > 0 && (
    <span style={{ marginLeft: '6px' }}>
      {task.tags.map((tag, idx) => {
        // 技能标签颜色配置
        const skillColors = {
          '健身': { bg: '#E8F5E9', color: '#2E7D32' },
          '阅读': { bg: '#E3F2FD', color: '#0D47A1' },
          '英语': { bg: '#FCE4EC', color: '#880E4F' },
          '冥想': { bg: '#F3E5F5', color: '#4A148C' },
          '理财': { bg: '#FFF8E1', color: '#E65100' },
          '烹饪': { bg: '#FFF3E0', color: '#BF360C' },
          '写作': { bg: '#E8EAF6', color: '#1A237E' },
          '编程': { bg: '#E8F5E9', color: '#1B5E20' },
          '设计': { bg: '#FCE4EC', color: '#880E4F' },
          '音乐': { bg: '#F3E5F5', color: '#4A148C' },
          '摄影': { bg: '#E1F5FE', color: '#01579B' },
          '育儿': { bg: '#FCE4EC', color: '#880E4F' },
          '运动': { bg: '#E8F5E9', color: '#2E7D32' }
        };
        
        const colors = skillColors[tag] || { bg: '#f0f0f0', color: '#666' };
        
        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              fontSize: '9px',
              padding: '1px 6px',
              backgroundColor: colors.bg,
              color: colors.color,
              borderRadius: '10px',
              marginLeft: '2px',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            #{tag}
          </span>
        );
      })}
    </span>
  )}
  
  {task.hasImage && (
    <span style={{ color: task.done ? '#999' : '#ff4444', fontSize: '11px' }}>
      &nbsp; [图片]
    </span>
  )}

  {/* ===== ✅ 在这里添加多次任务 + 按钮 ===== */}
{/* ===== 多次任务 + 按钮 ===== */}
{/* ===== 多次任务 + 按钮 ===== */}
{task.isCountTask && (
  <span
    onClick={(e) => {
      e.stopPropagation();
      onIncrementCount(task);
    }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',  // 👈 改成 gap: '2px'
      marginLeft: '6px',
      padding: '0 6px',
      height: '18px',
      backgroundColor: '#61A2Da',
      color: '#fff',
      borderRadius: '10px',
      fontSize: '11px',
      cursor: 'pointer',
      fontWeight: 'bold',
      userSelect: 'none',
      flexShrink: 0,
      lineHeight: 1,
      verticalAlign: 'middle',
      boxSizing: 'border-box',
      paddingBottom: '0px' 
    }}
  >
    + {task.count || 0} 
  </span>
)}
  
  {/* 跨日期图标 */}
  {task.crossDateId && task.crossDates && task.crossDates.length > 0 && (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setShowCrossDateDetail(!showCrossDateDetail);
      }}
      style={{
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "4px",
        opacity: showCrossDateDetail ? 0.7 : 1,
        verticalAlign: "middle",
        lineHeight: 1,
        position: "relative",
        top: "-2px"
      }}
      title={showCrossDateDetail ? "收起详情" : "查看跨日期详情"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="15" r="1.5" fill="#61A2Da"/>
        <circle cx="16" cy="15" r="1.5" fill="#61A2Da"/>
        <circle cx="8" cy="15" r="1.5" fill="#61A2Da"/>
      </svg>
    </span>
  )}
</div>





{/* 时间显示 */}
{/* 时间显示 */}
<div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
  <span
    onClick={(e) => {
      e.stopPropagation();
      if (!isSortingMode) onEditTime(task);
    }}
    style={{
      fontSize: "11px",
      color: isSortingMode ? "transparent" : 
             ((task.timeSpent && task.timeSpent > 0) ? "#4caf50" : 
              (task.plannedTime && task.plannedTime > 0) ? "#f44336" : "#666"),
      cursor: isSortingMode ? "default" : "pointer",
      minWidth: "30px",
      textAlign: "right",
      lineHeight: "28px",
      fontWeight: "normal"
    }}
  >
    {(() => {
      const actualMinutes = Math.floor((task.timeSpent || 0) / 60);
      if (actualMinutes > 0) {
        return `${actualMinutes}m`;
      }
      if (task.plannedTime && task.plannedTime > 0) {
        return `${task.plannedTime}m`;
      }
      return `0m`;
    })()}
  </span>
  
  {/* ⭐ 经验值小方块 */}
  <span
    onClick={(e) => {
      e.stopPropagation();
      if (isSortingMode) return;
      setExpInputValue(task.expValue || 2);
      setShowExpModal(true);
    }}
    style={{
      fontSize: "10px",
      color: "#FF9800",
      cursor: isSortingMode ? "default" : "pointer",
      backgroundColor: "#fff3e0",
      padding: "0 6px",
      borderRadius: "10px",
      minWidth: "20px",
      textAlign: "center",
      lineHeight: "18px",
      fontWeight: "bold",
      border: "1px solid #FFE0B2",
      flexShrink: 0,
      display: isSortingMode ? "none" : "inline-block",
      marginLeft: "4px"  // ← 新增这行
    }}
    title={isSortingMode ? "" : "点击设置经验值"}
  >
    {task.expValue || 2}
  </span>
</div>
</div>



{/* 进度条区域 - 点击进度条出现 +/- 按钮 */}
{task.progress && task.progress.target > 0 && (
  <div style={{ marginTop: 4, marginLeft: 20 }}>
    {/* 进度条 - 点击后显示/隐藏 +/- 按钮 */}
    <div
      onClick={(e) => {
        e.stopPropagation();
        setShowProgressControls(!showProgressControls);
      }}
      style={{
        width: '100%',
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: `${(task.progress.current / task.progress.target) * 100}%`,
        height: '100%',
        backgroundColor: '#4caf50'
      }} />
    </div>
    
    {/* 下方：固定宽度布局，避免点击后变化 */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '24px'
    }}>
      {/* 左边：百分比和数值 - 固定宽度 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: '#666',
        minWidth: '70px'
      }}>
        <span>{Math.round((task.progress.current / task.progress.target) * 100)}%</span>
        <span>|</span>
        <span>{task.progress.current}/{task.progress.target}</span>
      </div>
      
      {/* 右边：+/- 按钮 - 固定宽度，保持占位 */}
      <div style={{
        minWidth: '50px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        {showProgressControls && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                const newValue = Math.max(0, (task.progress.current || 0) - 1);
                if (onUpdateProgress) onUpdateProgress(task, newValue);
              }}
              style={{
                cursor: 'pointer',
                fontSize: 16,
                color: '#666',
                padding: '0 4px'
              }}
            >
              −
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                const newValue = Math.min(task.progress.target, (task.progress.current || 0) + 1);
                if (onUpdateProgress) onUpdateProgress(task, newValue);
              }}
              style={{
                cursor: 'pointer',
                fontSize: 16,
                color: '#666',
                padding: '0 4px'
              }}
            >
              +
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* 跨日期任务详情 - 展开区域 */}
{showCrossDateDetail && task.crossDateId && task.crossDates && task.crossDates.length > 0 && (
  <div style={{
    marginTop: 4,
    marginLeft: "28px",
    padding: "4px 0",
    fontSize: "11px",
    borderTop: "1px solid #f0f0f0",
    borderBottom: "1px solid #f0f0f0",
    borderRadius: "4px"
  }}>
    {task.crossDates.slice().sort().map(date => {
      const dayTasks = tasksByDate[date] || [];
      const taskOnDate = dayTasks.find(t => t.crossDateId === task.crossDateId);
      
      // ✅ 关键修改：只有 actualCompletedDate 等于这个日期时才显示勾选
      const isCompletedOnThisDate = taskOnDate?.actualCompletedDate === date;
      
      const dateStr = date.slice(5);
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = new Date(date).getDay();
      const isToday = date === selectedDate;
      
      return (
        <div
          key={date}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: "2px 8px",
            backgroundColor: isToday ? '#e8f0fe' : 'transparent',
            borderRadius: '4px'
          }}
        >
          {/* ✅ 根据 actualCompletedDate 显示打钩 */}
          <span style={{ width: '16px', fontSize: '12px' }}>
            {isCompletedOnThisDate ? '✅' : '⬜'}
          </span>
          <span style={{ 
            color: isToday ? '#1a73e8' : '#666',
            fontWeight: isToday ? 'bold' : 'normal'
          }}>
            {dateStr}
          </span>
          <span style={{ color: '#999', fontSize: '10px' }}>
            ({weekdays[weekday]})
          </span>
          {isToday && <span style={{ fontSize: '10px', color: '#1a73e8' }}>当日</span>}
        </div>
      );
    })}
  </div>
)}

{/* 放弃信息显示 - 放在备注和感想之前 */}
{/* 放弃信息显示 */}
{/* 放弃信息显示 */}
{/* 放弃信息显示 */}
{task.abandoned && task.abandonInfo && (
  <div style={{ marginLeft: "20px", marginTop: -2, marginBottom: 4, position: "relative"}}>
    <div
      onClick={(e) => {
        e.stopPropagation();
        const newReason = window.prompt("修改放弃原因", task.abandonInfo.reason);
        if (newReason && newReason.trim()) {
          const updatedAbandonInfo = {
            ...task.abandonInfo,
            reason: newReason.trim()
          };
          if (onUpdateAbandonInfo) {
            onUpdateAbandonInfo(task, updatedAbandonInfo);
          }
        }
      }}
      style={{
        fontSize: 12,
        color: "#f44336",
        backgroundColor: "transparent",
        padding: "4px 8px",
        borderRadius: 4,
        whiteSpace: "pre-wrap",
        lineHeight: "1.4",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px"
      }}
    >
      {/* 👇 删除红色圆圈叉号 SVG，只保留文字 */}
      <span>{task.abandonInfo.reason}</span>
      
      {/* 备注（如果有） */}
      {task.abandonInfo.note && (
        <span style={{ fontSize: 11, opacity: 0.8, marginLeft: "4px" }}>
          （{task.abandonInfo.note}）
        </span>
      )}
    </div>
  </div>
)}

{/* 第二行：备注和感想 */}
{(task.note || task.reflection) && (
  <div style={{ marginLeft: "20px", marginTop: 4, position: "relative" }}>
    {/* 原来的备注和感想代码保持不变 */}
  </div>
)}

      {/* 第二行：备注和感想 */}
      {(task.note || task.reflection) && (
        <div style={{ 
          marginLeft: "20px", 
          marginTop: 4,
          position: "relative"
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
                color: "#555",
                cursor: "pointer",
                backgroundColor: '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '4px',
                lineHeight: "1.3",
                whiteSpace: "pre-wrap",
                border: '1px solid #ddd',
                marginBottom: "4px",
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
              }}
            >
              {task.reflection}
            </div>
          )}

          {/* 时间信息行 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
            gap: 8,
            flexWrap: "wrap"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flex: 1,
              minWidth: 0,
              flexWrap: "wrap"
            }}>
              {task.scheduledTime && (
                <span style={{
                  fontSize: 11,
                  color: "#666",
                  backgroundColor: "#f0f0f0",
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid #e0e0e0",
                  whiteSpace: "nowrap"
                }}>
                  ⏰ {task.scheduledTime}
                </span>
              )}

              {task.reminderTime && (
                <span style={{
                  fontSize: 11,
                  color: "#666",
                  backgroundColor: "#fff0f0",
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid #ffcccc",
                  whiteSpace: "nowrap"
                }}>
                  🔔 {task.reminderTime.month}/{task.reminderTime.day}
                </span>
              )}

              {task.tags && task.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {task.tags.map((tag, idx) => (
                    <span key={idx} style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      backgroundColor: tag.color,
                      color: '#fff',
                      borderRadius: 10
                    }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {task.isRepeating && (
              <span style={{ fontSize: "12px" }} title="重复任务">🔄</span>
            )}
          </div>
        </div>
      )}

      {/* 子任务区域 */}
      <div style={{ marginLeft: "20px", marginTop: 4 }}>
        {task.subTasks && task.subTasks.length > 0 && (
          <div style={{ 
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
                color: task.done ? '#999' : '#666'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                        padding: '2px 6px',
                        border: '1px solid #1a73e8',
                        borderRadius: '3px',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <span 
                      onClick={() => startEditSubTask(index, subTask.text)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        const newNote = window.prompt("添加备注", subTask.note || "");
                        if (newNote !== null) {
                          onEditSubTask(task, index, subTask.text, newNote);
                        }
                      }}
                      style={{ 
                        cursor: 'pointer',
                        flex: 1,
                        padding: '2px 4px'
                      }}
                    >
                      {subTask.text}
                    </span>
                  )}
                </div>
                
                {subTask.note && editingSubTaskIndex !== index && (
                  <div style={{ marginLeft: '20px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#333',
                      padding: '2px 6px',
                      backgroundColor: '#fff9c4',
                      borderRadius: '3px',
                      border: '1px solid #ffd54f'
                    }}>
                      ❗️ {subTask.note}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 图片显示 */}
      {task.image && (
        <div style={{ marginTop: 4, marginBottom: 4, position: 'relative', display: 'inline-block' }}>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('确定要删除这张图片吗？')) {
                if (onDeleteImage) {
                  onDeleteImage(task);
                }
              }
            }}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#ff4444'
            }}
          >
            ×
          </button>
        </div>
      )}

{/* 经验值设置弹窗 */}
{showExpModal && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '10px'
    }}
    onClick={() => setShowExpModal(false)}
  >
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        width: '90%',
        maxWidth: '320px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{
        textAlign: 'center',
        marginBottom: '12px',
        color: '#61A2Da',
        fontSize: '16px'
      }}>
        经验值
      </h3>
      
      <p style={{
        textAlign: 'center',
        fontSize: '13px',
        color: '#666',
        marginBottom: '12px'
      }}>
        <strong>{task.text}</strong>
      </p>
      
<div style={{ marginBottom: '16px' }}>
  <label style={{
    display: 'block',
    fontSize: '13px',
    color: '#333',
    marginBottom: '6px'
  }}>
    经验值
  </label>
  
  {/* 输入区域：- 按钮 + 输入框 + + 按钮 */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center'
  }}>
    {/* - 按钮 */}
    <div
      onClick={() => {
        const current = parseInt(expInputValue) || 0;
        setExpInputValue(current - 1);
      }}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        color: '#f44336',
        border: '1px solid #e0e0e0'
      }}
    >
      −
    </div>
    
    {/* 输入框 */}
    <input
      type="number"
      step="1"
      value={expInputValue}
      onChange={(e) => {
        const val = parseInt(e.target.value) || 0;
        setExpInputValue(val);
      }}
      style={{
        width: '80px',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '18px',
        textAlign: 'center',
        boxSizing: 'border-box',
        fontWeight: 'bold'
      }}
      autoFocus
      onFocus={(e) => e.target.select()}
    />
    
    {/* + 按钮 */}
    <div
      onClick={() => {
        const current = parseInt(expInputValue) || 0;
        setExpInputValue(current + 1);
      }}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        color: '#4caf50',
        border: '1px solid #e0e0e0'
      }}
    >
      +
    </div>
  </div>
</div>
      
      <div style={{
        display: 'flex',
        gap: '10px'
      }}>
        <div
          onClick={() => setShowExpModal(false)}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          取消
        </div>
       <div
  onClick={() => {
    const finalExp = parseInt(expInputValue) || 0;
    // ✅ 不限制正负，直接传
    onUpdateExpValue?.(task, finalExp);
    setShowExpModal(false);
  }}
  style={{
    flex: 1,
    padding: '10px',
    backgroundColor: '#61A2Da',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center'
  }}
>
  确认
</div>
      </div>
    </div>
  </div>
)}

    </li>
  );
};



// SortableTaskList 组件 - 支持手机端触摸拖拽
const SortableTaskList = ({ 
  tasks, 
  category, 
  subCategory,
  tasksByDate = {},
  isSortingMode, 
  onSortingEnd,
  onDeleteTask,
  onUpdateAbandonInfo,
  onEditTime,
  onDeleteImage,
  onEditNote,
  onEditReflection,
  selectedDate,  
  onOpenEditModal,
  onShowImageModal,
  toggleDone,
  getTaskCompletionType,
  formatTimeNoSeconds,
  formatTimeWithSeconds,
  onMoveTask,
  categories,
   onUpdateExpValue,  
  setShowMoveModal,
  onUpdateProgress,
  onEditSubTask,
  onIncrementCount, 
  onToggleSubTask
}) => {
  const [taskList, setTaskList] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const draggedElementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 初始化任务列表
  useEffect(() => {
    const orderKey = subCategory 
      ? `tasks_order_${category}_${subCategory}`
      : `tasks_order_${category}`;
    const savedOrder = localStorage.getItem(orderKey);
    const taskMap = new Map();
    
    tasks.forEach(task => {
      taskMap.set(task.id, task);
    });
    
    if (savedOrder && tasks.length > 0) {
      const orderIds = JSON.parse(savedOrder);
      const ordered = [];
      
      orderIds.forEach(id => {
        if (taskMap.has(id)) {
          ordered.push(taskMap.get(id));
          taskMap.delete(id);
        }
      });
      
      ordered.push(...taskMap.values());
      setTaskList(ordered);
    } else {
      const sorted = [...tasks].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
      setTaskList(sorted);
    }
  }, [tasks, category, subCategory]);
  
  // 保存顺序到 localStorage
  const saveOrder = useCallback((newList) => {
    const orderKey = subCategory 
      ? `tasks_order_${category}_${subCategory}`
      : `tasks_order_${category}`;
    const orderIds = newList.map(t => t.id);
    localStorage.setItem(orderKey, JSON.stringify(orderIds));
    if (onSortingEnd) {
      onSortingEnd(orderIds);
    }
  }, [category, subCategory, onSortingEnd]);
  
  if (taskList.length === 0) {
    return null;
  }
  
 
  // ========== 触摸拖拽事件处理（带阈值） ==========
const DRAG_THRESHOLD = 15; // 拖动阈值（像素），超过这个值才开始拖拽

// 开始拖拽
const handleTouchStart = (e, index) => {
  if (!isSortingMode) return;
  e.preventDefault();
  e.stopPropagation();
  
  const touch = e.touches[0];
  setDraggedIndex(index);
  touchStartY.current = touch.clientY;
  touchStartX.current = touch.clientX;
  setIsDragging(false); // 初始不是拖动状态
  
  // 保存被拖拽元素的引用
  draggedElementRef.current = e.currentTarget;
};

// 拖拽移动中
const handleTouchMove = (e, index) => {
  if (!isSortingMode || draggedIndex === null) return;
  e.preventDefault();
  e.stopPropagation();
  
  const touch = e.touches[0];
  const currentY = touch.clientY;
  const currentX = touch.clientX;
  
  // 计算移动距离
  const deltaY = Math.abs(currentY - touchStartY.current);
  const deltaX = Math.abs(currentX - touchStartX.current);
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // 如果移动距离小于阈值，不触发排序
  if (distance < DRAG_THRESHOLD) {
    return;
  }
  
  // 标记为正在拖动
  setIsDragging(true);
  
  // 添加拖拽样式
  if (draggedElementRef.current) {
    draggedElementRef.current.style.opacity = '0.5';
    draggedElementRef.current.style.transition = 'opacity 0.2s';
    draggedElementRef.current.style.transform = 'scale(0.95)';
  }
  
  // 获取所有任务元素
  const taskElements = document.querySelectorAll(`[data-task-idx]`);
  let targetIndex = draggedIndex;
  
  // 根据触摸位置计算目标索引
  for (let i = 0; i < taskElements.length; i++) {
    const rect = taskElements[i].getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    if (currentY > centerY) {
      targetIndex = i;
    }
  }
  
  // 如果目标索引变化，重新排序
  if (targetIndex !== draggedIndex && targetIndex !== dragOverIndex) {
    setDragOverIndex(targetIndex);
    
    setTaskList(prevList => {
      const newList = [...prevList];
      const [draggedItem] = newList.splice(draggedIndex, 1);
      newList.splice(targetIndex, 0, draggedItem);
      
      // 更新拖拽索引
      setDraggedIndex(targetIndex);
      touchStartY.current = currentY;
      
      return newList;
    });
  }
};

// 结束拖拽
const handleTouchEnd = (e) => {
  if (!isSortingMode || draggedIndex === null) return;
  e.preventDefault();
  e.stopPropagation();
  
  // 恢复样式
  if (draggedElementRef.current) {
    draggedElementRef.current.style.opacity = '';
    draggedElementRef.current.style.transition = '';
    draggedElementRef.current.style.transform = '';
  }
  
  // 只有真正拖动过才保存顺序
  if (isDragging) {
    saveOrder(taskList);
  }
  
  // 重置状态
  setDraggedIndex(null);
  setDragOverIndex(null);
  setIsDragging(false);
  draggedElementRef.current = null;
};
  // ========== 鼠标拖拽事件处理（用于调试） ==========
  // ========== 鼠标拖拽事件处理（带阈值和防误触） ==========
const MOUSE_DRAG_THRESHOLD = 15; // 鼠标拖动阈值 30 像素

const handleMouseDown = (e, index) => {
  if (!isSortingMode) return;
  e.preventDefault();
  
  setDraggedIndex(index);
  touchStartY.current = e.clientY;
  touchStartX.current = e.clientX;
  setIsDragging(false);
  draggedElementRef.current = e.currentTarget;
  
  // 添加按下样式（视觉反馈）
  if (draggedElementRef.current) {
    draggedElementRef.current.style.opacity = '0.7';
    draggedElementRef.current.style.transition = 'opacity 0.1s';
    draggedElementRef.current.style.cursor = 'grabbing';
  }
  
  const handleMouseMove = (moveEvent) => {
    moveEvent.preventDefault();
    
    const currentY = moveEvent.clientY;
    const currentX = moveEvent.clientX;
    
    // 计算移动距离
    const deltaY = Math.abs(currentY - touchStartY.current);
    const deltaX = Math.abs(currentX - touchStartX.current);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 如果移动距离小于阈值，不触发排序
    if (distance < MOUSE_DRAG_THRESHOLD) {
      return;
    }
    
    // 标记为正在拖动
    if (!isDragging) {
      setIsDragging(true);
      if (draggedElementRef.current) {
        draggedElementRef.current.style.opacity = '0.4';
        draggedElementRef.current.style.transform = 'scale(0.95)';
        draggedElementRef.current.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }
    }
    
    const taskElements = document.querySelectorAll(`[data-task-idx]`);
    let targetIndex = draggedIndex;
    
    for (let i = 0; i < taskElements.length; i++) {
      const rect = taskElements[i].getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      // 增加 10px 缓冲，防止在边缘抖动
      if (currentY > centerY + 10) {
        targetIndex = i;
      }
    }
    
    if (targetIndex !== draggedIndex && targetIndex !== dragOverIndex) {
      setDragOverIndex(targetIndex);
      
      setTaskList(prevList => {
        const newList = [...prevList];
        const [draggedItem] = newList.splice(draggedIndex, 1);
        newList.splice(targetIndex, 0, draggedItem);
        setDraggedIndex(targetIndex);
        touchStartY.current = currentY;
        return newList;
      });
    }
  };
  
  const handleMouseUp = () => {
    // 恢复样式
    if (draggedElementRef.current) {
      draggedElementRef.current.style.opacity = '';
      draggedElementRef.current.style.transition = '';
      draggedElementRef.current.style.transform = '';
      draggedElementRef.current.style.boxShadow = '';
      draggedElementRef.current.style.cursor = '';
    }
    
    // 只有真正拖动过才保存顺序
    if (isDragging) {
      saveOrder(taskList);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    draggedElementRef.current = null;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
  
  if (taskList.length === 0) return null;
  
  return (
    <ul
      style={{
        listStyle: "none",
        padding: subCategory ? "0 0 0 8px" : 0,
        margin: 0,
        borderLeft: subCategory ? "2px solid #e0e0e0" : "none"
      }}
    >
      {taskList.map((task, idx) => (
        <div
          key={task.id}
          data-task-idx={idx}
          style={{
            cursor: isSortingMode ? 'grab' : 'default',
            marginBottom: '4px',
            opacity: draggedIndex === idx ? 0.5 : 1,
            transition: 'opacity 0.2s',
            position: 'relative',
            touchAction: isSortingMode ? 'none' : 'auto'  // 关键：触摸时禁用滚动
          }}
          onTouchStart={(e) => handleTouchStart(e, idx)}
          onTouchMove={(e) => handleTouchMove(e, idx)}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => handleMouseDown(e, idx)}
        >
          {/* 排序模式下的删除和拖拽按钮 */}
          {/* 排序模式下的删除和拖拽按钮 */}
{isSortingMode && (
  <>
    {/* 删除按钮 */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.confirm(`确定要删除任务 "${task.text}" 吗？`)) {
          if (onDeleteTask) {
            onDeleteTask(task, 'today');
          }
        }
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
      style={{
        position: 'absolute',
        right: '28px',  // ← 从 40px 改成 28px
        top: '6px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}
      title="删除任务"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18" stroke="#999" strokeWidth="2" strokeLinecap="square"/>
        <path d="M6 6L18 18" stroke="#999" strokeWidth="2" strokeLinecap="square"/>
      </svg>
    </button>
    
    {/* 拖拽手柄 */}
    <div
      style={{
        position: 'absolute',
        right: '0px',
        top: '6px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5
      }}
      title="长按拖拽调整顺序"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="5" y1="6" x2="19" y2="6" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
        <line x1="5" y1="18" x2="19" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  </>
)}

          <TaskItem
            task={task}
            selectedDate={selectedDate}
            isSortingMode={isSortingMode}
            getTaskCompletionType={getTaskCompletionType}
            onEditTime={onEditTime}
            onDeleteImage={onDeleteImage}
            onEditNote={onEditNote}
            onUpdateExpValue={onUpdateExpValue} 
            onEditReflection={onEditReflection}
            onOpenEditModal={onOpenEditModal} 
            onShowImageModal={onShowImageModal}
            tasksByDate={tasksByDate}  
            toggleDone={toggleDone}
            formatTimeNoSeconds={formatTimeNoSeconds}
            formatTimeWithSeconds={formatTimeWithSeconds}
            onMoveTask={onMoveTask}
            categories={categories}
            onUpdateAbandonInfo={onUpdateAbandonInfo}
            
            setShowMoveModal={setShowMoveModal}
            onUpdateProgress={onUpdateProgress}
            onEditSubTask={onEditSubTask}
            onToggleSubTask={onToggleSubTask}
            onIncrementCount={onIncrementCount}
          />
        </div>
      ))}
    </ul>
  );
};

const StatsPage = ({ onClose, dailyStudyData, categoryData, subCategoryData, dailyTasksData, avgCompletion, avgDailyTime, studyEndTimes, dailyReflections, dailyRatings, onDeleteReflection, onClearReflections, selectedDate, tasksByDate, categories }) => {
  const chartHeight = window.innerWidth <= 768 ? 200 : 300;
  const fontSize = window.innerWidth <= 768 ? 10 : 12;
  const [activeTab, setActiveTab] = useState('time');
  
  // 时间筛选状态
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
// 👇👇👇 放在这里！所有 useState 之后，其他函数之前 👇👇👇
  useEffect(() => {
    // 切换到结束时间或复盘记录时，默认显示本周
    if (activeTab === 'endTime' || activeTab === 'review') {
      setDateRange('week');
    }
  }, [activeTab]);
  // 获取当前日期范围 - 移到最前面定义
 // 获取当前日期范围 - 使用 selectedDate 作为基准
const getDateRangeFilter = useCallback(() => {
  // 使用 selectedDate 而不是今天
  const baseDate = new Date(selectedDate);
  baseDate.setHours(0, 0, 0, 0);
  let startDate = new Date(baseDate);
  let endDate = new Date(baseDate);
  endDate.setHours(23, 59, 59, 999);
  
  switch (dateRange) {
    case 'today':
      startDate = new Date(baseDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(baseDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = baseDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(baseDate);
      startDate.setDate(baseDate.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate = new Date(baseDate.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(baseDate.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (customStartDate && customEndDate) {
        return {
          start: new Date(customStartDate),
          end: new Date(customEndDate)
        };
      }
      return null;
    default:
      break;
  }
  
  return { start: startDate, end: endDate };
}, [dateRange, customStartDate, customEndDate, selectedDate]);  // 添加 selectedDate 依赖

  // 获取选中日期的任务数据
  const getSelectedDateTasks = useCallback(() => {
    if (!selectedDate || !tasksByDate) return [];
    return tasksByDate[selectedDate] || [];
  }, [selectedDate, tasksByDate]);

  // 修复：重新计算饼图数据 - 基于筛选后的日期
  const getPieChartData = useCallback(() => {
    const range = getDateRangeFilter();
    if (!range) return [];
    
    // 收集筛选范围内所有日期的任务
    const allTasks = [];
    Object.entries(tasksByDate || {}).forEach(([date, tasks]) => {
      const dateObj = new Date(date);
      if (dateObj >= range.start && dateObj <= range.end) {
        allTasks.push(...tasks);
      }
    });
    
    // 排除本周任务和未完成的常规任务
    const learningTasks = allTasks.filter(task => {
      if (task.category === "本周任务") return false;
      if (task.isRegularTask && !task.done) return false;
      return true;
    });
    
    // 按分类统计时间
    const categoryTimeMap = new Map();
    const schoolSubCategoryTimeMap = new Map();
    
    learningTasks.forEach(task => {
      const timeMinutes = Math.floor((task.timeSpent || 0) / 60);
      if (timeMinutes === 0) return;
      
      if (task.category === '校内') {
        const subCat = task.subCategory || '未分类';
        const current = schoolSubCategoryTimeMap.get(subCat) || 0;
        schoolSubCategoryTimeMap.set(subCat, current + timeMinutes);
      } else {
        const current = categoryTimeMap.get(task.category) || 0;
        categoryTimeMap.set(task.category, current + timeMinutes);
      }
    });
    
    // 构建饼图数据数组
    const pieData = [];
    
    schoolSubCategoryTimeMap.forEach((time, subCat) => {
      pieData.push({
        name: `校内-${subCat}`,
        time: time,
        type: 'school_sub'
      });
    });
    
    categoryTimeMap.forEach((time, catName) => {
      pieData.push({
        name: catName,
        time: time,
        type: 'other'
      });
    });
    
    pieData.sort((a, b) => b.time - a.time);
    return pieData;
  }, [tasksByDate, getDateRangeFilter]);

// 按科目统计饼图数据（校内子分类：数学、语文、英语、运动）
// 按科目统计饼图数据（合并校内子分类和大类别）
const getSubjectPieChartData = useCallback(() => {
  const range = getDateRangeFilter();
  if (!range) return [];
  
  // 收集筛选范围内所有日期的任务
  const allTasks = [];
  Object.entries(tasksByDate || {}).forEach(([date, tasks]) => {
    const dateObj = new Date(date);
    if (dateObj >= range.start && dateObj <= range.end) {
      allTasks.push(...tasks);
    }
  });
  
  // 排除本周任务和未完成的常规任务
  const learningTasks = allTasks.filter(task => {
    if (task.category === "本周任务") return false;
    if (task.isRegularTask && !task.done) return false;
    return true;
  });
  
  // 按科目统计时间（合并校内子分类和大类别）
  const subjectTimeMap = new Map();
  
  // 科目列表
  const subjects = ['数学', '语文', '英语', '运动'];
  
  learningTasks.forEach(task => {
    const timeMinutes = Math.floor((task.timeSpent || 0) / 60);
    if (timeMinutes === 0) return;
    
    let subject = null;
    
    // 如果是校内分类且有子分类，使用子分类名称
    if (task.category === '校内' && task.subCategory) {
      if (subjects.includes(task.subCategory)) {
        subject = task.subCategory;
      }
    } 
    // 如果是大类别（数学、语文、英语、运动）
    else if (subjects.includes(task.category)) {
      subject = task.category;
    }
    
    // 只有匹配到科目才统计
    if (subject) {
      const current = subjectTimeMap.get(subject) || 0;
      subjectTimeMap.set(subject, current + timeMinutes);
    }
  });
  
  // 构建饼图数据数组
  const subjectData = [];
  subjectTimeMap.forEach((time, subject) => {
    subjectData.push({
      name: subject,
      time: time,
      type: 'subject'
    });
  });
  
  subjectData.sort((a, b) => b.time - a.time);
  return subjectData;
}, [tasksByDate, getDateRangeFilter]);

  // 修复：重新计算总时间
  const getTotalTime = useCallback(() => {
    const pieData = getPieChartData();
    return pieData.reduce((sum, item) => sum + item.time, 0);
  }, [getPieChartData]);

  // 修复：重新计算任务统计
  const getTaskStats = useCallback(() => {
    const range = getDateRangeFilter();
    if (!range) return { totalTasks: 0, completedTasks: 0 };
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    Object.entries(tasksByDate || {}).forEach(([date, tasks]) => {
      const dateObj = new Date(date);
      if (dateObj >= range.start && dateObj <= range.end) {
        const learningTasks = tasks.filter(task => {
          if (task.category === "本周任务") return false;
          if (task.isRegularTask && !task.done) return false;
          return true;
        });
        totalTasks += learningTasks.length;
        completedTasks += learningTasks.filter(t => t.done).length;
      }
    });
    
    return { totalTasks, completedTasks };
  }, [tasksByDate, getDateRangeFilter]);


// 获取科目总时间
const getSubjectTotalTime = useCallback(() => {
  const data = getSubjectPieChartData();
  return data.reduce((sum, item) => sum + item.time, 0);
}, [getSubjectPieChartData]);

  // 筛选结束时间数据
  const filteredEndTimeList = useMemo(() => {
    if (!studyEndTimes) return [];
    const range = getDateRangeFilter();
    if (!range) return [];
    
    return Object.entries(studyEndTimes)
      .filter(([date]) => {
        const dateObj = new Date(date);
        return dateObj >= range.start && dateObj <= range.end;
      })
      .map(([date, time]) => ({ date, time }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [studyEndTimes, getDateRangeFilter]);

  // 筛选复盘数据
  const filteredReviewList = useMemo(() => {
    if (!dailyReflections) return [];
    const range = getDateRangeFilter();
    if (!range) return [];
    
    return Object.entries(dailyReflections)
      .filter(([date, reflection]) => {
        const dateObj = new Date(date);
        return reflection && reflection.trim() && dateObj >= range.start && dateObj <= range.end;
      })
      .map(([date, reflection]) => ({ date, reflection }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyReflections, getDateRangeFilter]);

  const pieData = getPieChartData();
  const totalTime = getTotalTime();
  const taskStats = getTaskStats();
  const subjectPieData = getSubjectPieChartData();
const subjectTotalTime = getSubjectTotalTime();

  // 获取饼图颜色
  const getPieColor = (name, type) => {
    if (type === 'school_sub') {
      const subCategoryColors = {
        '数学': '#E8F5E9',
        '语文': 'FFF9C4',
        '英语': '#FCE4EC',
        '运动': '#E3F2FD',
        '未分类': '#F5F5F5'
      };
      const subCatName = name.replace('校内-', '');
      return subCategoryColors[subCatName] || '#E8F0FE';
    } else {
      const categoryColors = {
        '语文': '#FFFCE8',
        '数学': '#E8F5E9',
        '英语': '#FCE4EC',
        '通识': '#E1F5FE',
        '运动': '#E3F2FD',
        '校内': '#61A2Da'
      };
      return categoryColors[name] || '#f0f0f0';
    }
  };

  // 检查时间是否 >= 21:00
  const isLateEndTime = (timeStr) => {
    if (!timeStr) return false;
    const [hour] = timeStr.split(':').map(Number);
    return hour >= 21;
  };

  // 获取日期范围显示文本
 // 获取日期范围显示文本
const getDateRangeText = () => {
  const range = getDateRangeFilter();
  if (!range) return '';
  const startStr = `${range.start.getMonth() + 1}/${range.start.getDate()}`;
  const endStr = `${range.end.getMonth() + 1}/${range.end.getDate()}`;
  if (startStr === endStr) return startStr;
  return `${startStr} - ${endStr}`;
};

  const DateFilterButtons = () => {
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');

  // 根据当前选项卡决定是否显示"今日"按钮
  const shouldShowToday = activeTab === 'time';  // 只在时间统计选项卡显示今日按钮

 const handleCustomConfirm = () => {
  if (localStartDate && localEndDate) {
    console.log('设置自定义日期:', localStartDate, '至', localEndDate);
    setCustomStartDate(localStartDate);
    setCustomEndDate(localEndDate);
    setDateRange('custom');
    setShowCustomPicker(false);
    setLocalStartDate('');
    setLocalEndDate('');
    
    // 强制刷新视图
    setTimeout(() => {
      console.log('当前 dateRange:', dateRange);
    }, 100);
  } else {
    alert('请选择开始和结束日期');
  }
};

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: showCustomPicker ? '8px' : 0
      }}>
        {shouldShowToday && (
          <div
            onClick={() => {
              setDateRange('today');
              setShowCustomPicker(false);
            }}
            style={{
              padding: '4px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: dateRange === 'today' ? '#61A2Da' : '#f0f0f0',
              color: dateRange === 'today' ? '#fff' : '#333',
              borderRadius: '16px',
              whiteSpace: 'nowrap'
            }}
          >
            今日
          </div>
        )}
        <div
          onClick={() => {
            setDateRange('week');
            setShowCustomPicker(false);
          }}
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: dateRange === 'week' ? '#61A2Da' : '#f0f0f0',
            color: dateRange === 'week' ? '#fff' : '#333',
            borderRadius: '16px',
            whiteSpace: 'nowrap'
          }}
        >
          本周
        </div>
        <div
          onClick={() => {
            setDateRange('month');
            setShowCustomPicker(false);
          }}
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: dateRange === 'month' ? '#61A2Da' : '#f0f0f0',
            color: dateRange === 'month' ? '#fff' : '#333',
            borderRadius: '16px',
            whiteSpace: 'nowrap'
          }}
        >
          本月
        </div>
        <div
          onClick={() => {
            setDateRange('year');
            setShowCustomPicker(false);
          }}
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: dateRange === 'year' ? '#61A2Da' : '#f0f0f0',
            color: dateRange === 'year' ? '#fff' : '#333',
            borderRadius: '16px',
            whiteSpace: 'nowrap'
          }}
        >
          本年
        </div>
        <div
  onClick={() => {
    setDateRange('custom');  // ✅ 先设置 dateRange 为 custom
     setShowCustomPicker(true);  // 只展开，不收缩
  }}
  style={{
    padding: '4px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: dateRange === 'custom' ? '#61A2Da' : '#f0f0f0',
    color: dateRange === 'custom' ? '#fff' : '#333',
    borderRadius: '16px',
    whiteSpace: 'nowrap'
  }}
>
  自选 {dateRange === 'custom' && customStartDate && customEndDate && '✓'}
</div>
      </div>
      
      {showCustomPicker && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          marginTop: '0px !important', 
          padding: '5px',
        
          borderRadius: '8px'
        }}>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            style={{
              padding: '6px 8px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              flex: '1',
              minWidth: '120px'
            }}
          />
          <span style={{ fontSize: '13px', color: '#666' }}>至</span>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            style={{
              padding: '6px 8px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              flex: '1',
              minWidth: '120px'
            }}
          />
          <div
            onClick={handleCustomConfirm}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: '#61A2Da',
              color: '#fff',
              borderRadius: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            确定
          </div>
        </div>
      )}
    </div>
  );
};

  // 简易饼图组件
 
const SimplePieChart = ({ data, total, completionStatus = {} }) => {
  if (data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无时间数据</div>;
  }
  
  // 获取饼图颜色
  const getPieColor = (name, type) => {
    if (type === 'school_sub') {
      const subCatName = name.replace('校内-', '');
      // 如果该子分类全部完成，返回灰色
      if (completionStatus[subCatName]?.isComplete) {
        return '#d0d0d0';
      }
      
      const subCategoryColors = {
        '数学': '#E8F5E9',
        '语文': '#FFFCE8',
        '英语': '#FCE4EC',
        '运动': '#E3F2FD',
        '未分类': '#F5F5F5'
      };
      return subCategoryColors[subCatName] || '#E8F0FE';
    } else {
      const categoryColors = {
        '语文': '#FFFCE8',
        '数学': '#E8F5E9',
        '英语': '#FCE4EC',
        '通识': '#E1F5FE',
        '运动': '#E3F2FD',
        '校内': '#61A2Da'
      };
      return categoryColors[name] || '#f0f0f0';
    }
  };
  
  let currentAngle = 0;
  const slices = [];
  let schoolTotalAngle = 0;
  
  data.forEach(item => {
    const angle = (item.time / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    // 计算文字位置（扇形的中间角度）
    const midAngle = startAngle + angle / 2;
    const midRad = (midAngle - 90) * Math.PI / 180;
    const labelRadius = 55; // 文字距离圆心的距离（在扇形内部）
    const labelX = 100 + labelRadius * Math.cos(midRad);
    const labelY = 100 + labelRadius * Math.sin(midRad);
    
    // 获取显示名称（校内子类别去掉前缀）
    const displayName = item.type === 'school_sub' ? item.name.replace('校内-', '') : item.name;
    const percentage = ((item.time / total) * 100).toFixed(1);
    
    slices.push({
      ...item,
      pathData,
      color: getPieColor(item.name, item.type),
      percentage,
      startAngle,
      endAngle,
      angle,
      labelX,
      labelY,
      displayName
    });
    
    if (item.type === 'school_sub') {
      schoolTotalAngle += angle;
    }
  });
  
  // 计算校内总时长的外层圆弧（保持不变）
  let schoolStartAngle = 0;
  let schoolEndAngle = 0;
  let foundFirst = false;
  
  slices.forEach(slice => {
    if (slice.type === 'school_sub') {
      if (!foundFirst) {
        schoolStartAngle = slice.startAngle;
        foundFirst = true;
      }
      schoolEndAngle = slice.endAngle;
    }
  });
  
  const getOuterArcPath = () => {
    if (schoolTotalAngle === 0) return null;
    const radius = 92;
    const startRad = (schoolStartAngle - 90) * Math.PI / 180;
    const endRad = (schoolEndAngle - 90) * Math.PI / 180;
    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);
    const largeArc = schoolTotalAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };
  
  const outerArcPath = getOuterArcPath();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="240" height="240" viewBox="0 0 200 200">
        {/* 饼图扇形 */}
        {slices.map((slice, idx) => (
          <path key={idx} d={slice.pathData} fill={slice.color} stroke="#fff" strokeWidth="1.5" />
        ))}
        
        {/* 校内总计外层圆弧 */}
        {outerArcPath && (
          <path d={outerArcPath} fill="none" stroke="#61A2Da" strokeWidth="4" strokeLinecap="round" />
        )}
        
        {/* 色块内部的文字标签 */}
        {slices.map((slice, idx) => {
          if (parseFloat(slice.percentage) < 5) return null;
          
          const timeMinutes = slice.time;
          const timeDisplay = timeMinutes >= 60 
            ? `${(timeMinutes / 60).toFixed(1)}h` 
            : `${timeMinutes}m`;
          
          const textColor = '#333';
          
          return (
            <g key={idx}>
              <text
                x={slice.labelX}
                y={slice.labelY - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="bold"
                fill={textColor}
              >
                {slice.displayName}
              </text>
              <text
                x={slice.labelX}
                y={slice.labelY + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill={textColor}
                opacity="0.8"
              >
                {timeDisplay}
              </text>
            </g>
          );
        })}
        
        {/* 中心圆 */}
        {/* 中心圆 */}
<circle cx="100" cy="100" r="28" fill="#fff" stroke="#fff" strokeWidth="0" />
        <text 
          x="100" 
          y="100" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize="11" 
          fontWeight="bold" 
          fill="#333"
        >
          {Math.floor(total)}m
        </text>
      </svg>
      
      {/* 饼图下方的图例 - 校内子分类显示为"校内-数学" */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '16px'
      }}>
        {/* 1. 校内总计放在最前面 */}
        {schoolTotalAngle > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '4px', backgroundColor: '#61A2Da', borderRadius: '2px' }} />
            <span style={{ fontSize: '11px', color: '#61A2Da', fontWeight: 'bold' }}>
              校内总计 ({(schoolTotalAngle / 360 * 100).toFixed(1)}%)
            </span>
          </div>
        )}
        
        {/* 2. 校内子分类 */}
        {slices.filter(s => s.type === 'school_sub').map((slice, idx) => {
          const displayName = `校内-${slice.name.replace('校内-', '')}`;
          return (
            <div key={`school_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: slice.color,
                borderRadius: '2px',
                border: '1px solid #ddd'
              }} />
              <span style={{ fontSize: '11px', color: '#333' }}>
                {displayName} ({slice.percentage}%)
              </span>
            </div>
          );
        })}
        
        {/* 3. 其他类别 */}
        {slices.filter(s => s.type !== 'school_sub').map((slice, idx) => {
          return (
            <div key={`other_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: slice.color,
                borderRadius: '2px',
                border: '1px solid #ddd'
              }} />
              <span style={{ fontSize: '11px', color: '#333' }}>
                {slice.name} ({slice.percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 👇👇👇 在这里添加第二个饼图组件 👇👇👇
  const SimpleSubjectPieChart = ({ data, total }) => {
    if (data.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无时间数据</div>;
    }
    
// 科目颜色映射（校内子分类）
// 科目颜色映射
const getSubjectColor = (subject) => {
  const colors = {
    '数学': '#E8F5E9',
    '语文': '#FFFCE8',
    '英语': '#FCE4EC',
    '运动': '#E3F2FD'
  };
  return colors[subject] || '#f0f0f0';
};
    
    let currentAngle = 0;
    const slices = [];
    
    data.forEach(item => {
      const angle = (item.time / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      const x1 = 100 + 80 * Math.cos(startRad);
      const y1 = 100 + 80 * Math.sin(startRad);
      const x2 = 100 + 80 * Math.cos(endRad);
      const y2 = 100 + 80 * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      const midAngle = startAngle + angle / 2;
      const midRad = (midAngle - 90) * Math.PI / 180;
      const labelRadius = 55;
      const labelX = 100 + labelRadius * Math.cos(midRad);
      const labelY = 100 + labelRadius * Math.sin(midRad);
      
      const percentage = ((item.time / total) * 100).toFixed(1);
      const timeDisplay = item.time >= 60 ? `${(item.time / 60).toFixed(1)}h` : `${item.time}m`;
      
      slices.push({
        ...item,
        pathData,
        color: getSubjectColor(item.name),
        percentage,
        labelX,
        labelY,
        timeDisplay
      });
    });
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="240" height="240" viewBox="0 0 200 200">
          {slices.map((slice, idx) => (
            <path key={idx} d={slice.pathData} fill={slice.color} stroke="#fff" strokeWidth="1.5" />
          ))}
          
          {/* 色块内部文字 */}
          {slices.map((slice, idx) => {
            if (parseFloat(slice.percentage) < 5) return null;
            return (
              <g key={idx}>
                <text x={slice.labelX} y={slice.labelY - 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">
                  {slice.name}
                </text>
                <text x={slice.labelX} y={slice.labelY + 6} textAnchor="middle" fontSize="8" fill="#333" opacity="0.8">
                  {slice.timeDisplay}
                </text>
              </g>
            );
          })}
          
          {/* 中心圆 */}
        {/* 中心圆 */}
<circle cx="100" cy="100" r="28" fill="#fff" stroke="#fff" strokeWidth="0" />
<text 
  x="100" 
  y="100" 
  textAnchor="middle" 
  dominantBaseline="middle"
  fontSize="11" 
  fontWeight="bold" 
  fill="#333"
>
  {Math.floor(total)}m
</text>
        </svg>
        
        {/* 图例 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
          {slices.map((slice, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: slice.color, borderRadius: '2px', border: '1px solid #ddd' }} />
              <span style={{ fontSize: '11px', color: '#333' }}>{slice.name} ({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };




  return (
    <div style={{
  maxWidth: 600,
  margin: "0 auto",
  padding: 15,
  fontFamily: "sans-serif",
  backgroundColor: "#f5faff",
  height: '100vh',
  overflow: 'auto',
  position: 'relative'   // 添加这个
}}>
  {/* 头部 */}
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#f5faff",
    padding: "0 0 10px 0"
  }}>
    <h1 style={{
      textAlign: "center",
      color: "#61A2Da",
      fontSize: 20,
      margin: 0
    }}>
      统计汇总
    </h1>
    
    {/* 关闭按钮 - 相对于这个容器定位 */}
    <button
      onClick={onClose}
      style={{
        position: 'absolute',
        top: '8px',
        right: '15px',   // 调整这个值，让按钮和内容区域右对齐
        background: 'transparent',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#999',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        zIndex: 10
      }}
    >
      ×
    </button>
  </div>
      
 <div style={{
  display: 'flex',
  gap: '2px',
  marginBottom: 15,
  borderBottom: '1px solid #e0e0e0',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  fontFamily: '微软雅黑, "Microsoft YaHei", sans-serif'
}}>
  <div
    onClick={() => setActiveTab('time')}
    style={{
      padding: '4px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      backgroundColor: activeTab === 'time' ? '#61A2Da' : '#f0f0f0',
      color: activeTab === 'time' ? '#fff' : '#666',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottom: activeTab === 'time' ? '2px solid #61A2Da' : 'none',
      fontWeight: activeTab === 'time' ? 'bold' : 'normal',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    时间统计
  </div>
  <div
    onClick={() => setActiveTab('endTime')}
    style={{
      padding: '4px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      backgroundColor: activeTab === 'endTime' ? '#61A2Da' : '#f0f0f0',
      color: activeTab === 'endTime' ? '#fff' : '#666',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottom: activeTab === 'endTime' ? '2px solid #61A2Da' : 'none',
      fontWeight: activeTab === 'endTime' ? 'bold' : 'normal',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    结束时间
  </div>
  <div
    onClick={() => setActiveTab('review')}
    style={{
      padding: '4px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      backgroundColor: activeTab === 'review' ? '#61A2Da' : '#f0f0f0',
      color: activeTab === 'review' ? '#fff' : '#666',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottom: activeTab === 'review' ? '2px solid #61A2Da' : 'none',
      fontWeight: activeTab === 'review' ? 'bold' : 'normal',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    复盘记录
  </div>
  <div
    onClick={() => setActiveTab('abandon')}
    style={{
      padding: '4px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      backgroundColor: activeTab === 'abandon' ? '#61A2Da' : '#f0f0f0',
      color: activeTab === 'abandon' ? '#fff' : '#666',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottom: activeTab === 'abandon' ? '2px solid #61A2Da' : 'none',
      fontWeight: activeTab === 'abandon' ? 'bold' : 'normal',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    放弃原因
  </div>
</div>
      
     <DateFilterButtons />
      
      {/* 显示当前选中的日期范围 */}
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
        padding: '8px',
        backgroundColor: '#e8f0fe',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#61A2Da',
        fontWeight: 'bold'
      }}>
         {getDateRangeText()}
      </div>

      {activeTab === 'time' && (
        <>
          {/* 统计卡片 */}
         <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',  // 从 8px 改为 6px，更紧凑
  marginBottom: 20
}}>
  <div style={{
    padding: '6px',  // 从 8px 改为 6px
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>总任务</div>  
    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a73e8' }}>{taskStats.totalTasks}</div>  
  </div>
  <div style={{
    padding: '6px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>已完成</div>
    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4caf50' }}>{taskStats.completedTasks}</div>
  </div>
  <div style={{
    padding: '6px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>完成率</div>
    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff9800' }}>
      {taskStats.totalTasks === 0 ? 0 : Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)}%
    </div>
  </div>
  <div style={{
    padding: '6px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>学习总时长</div>
    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9c27b0' }}>
      {totalTime >= 60 ? `${(totalTime / 60).toFixed(1)}h` : `${totalTime}分钟`}
    </div>
  </div>
</div>

          {/* 饼图区域 */}
          <div style={{
            marginBottom: 20,
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{
              marginBottom: 15,
              fontSize: '14px',
              textAlign: 'center',
              color: '#333'
            }}>
              分类时间
            </h3>
            <SimplePieChart data={pieData} total={totalTime} />
          </div>

{/* 新增：按科目饼图 */}
<div style={{
  marginBottom: 20,
  padding: '15px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #e0e0e0'
}}>
  <h3 style={{
    marginBottom: 15,
    fontSize: '14px',
    textAlign: 'center',
    color: '#333'
  }}>
    科目时间
  </h3>
  <SimpleSubjectPieChart data={subjectPieData} total={subjectTotalTime} />
</div>


        </>
      )}

{activeTab === 'endTime' && (
  <div style={{
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e0e0e0'
  }}>
    
    {filteredEndTimeList.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        暂无结束时间记录
      </div>
    ) : (
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        {filteredEndTimeList
  .filter(item => item.time && item.time !== '0' && item.time !== '00:00')
  .map((item, idx) => {
    const [hour] = item.time.split(':').map(Number);
    const isLate = hour >= 21;
    return (
            <div
              key={item.date}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                borderBottom: idx < filteredEndTimeList.length - 1 ? '1px solid #eee' : 'none',
                backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
              }}
            >
              <span style={{ fontSize: '13px', color: '#333' }}>{item.date.slice(5)}</span>
              {/* 时间居中 */}
              <span style={{
  fontSize: '13px',
  fontWeight: 'normal',  // 或者直接删除这行
  color: isLate ? '#f44336' : '#4caf50',
  textAlign: 'center',
  flex: 1
}}>
  {item.time}
</span>
              {/* 勾/叉靠右 */}
              <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                {isLate ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                    <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
      {activeTab === 'review' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          
          {filteredReviewList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无复盘记录
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredReviewList.map((item, idx) => (
                <div
                  key={item.date}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    borderBottom: idx < filteredReviewList.length - 1 ? '1px solid #eee' : 'none',
                    backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#61A2Da' }}>
                       {item.date.slice(5)}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {dailyRatings?.[item.date] > 0 && (
  <span style={{ fontSize: '14px' }}>
    {dailyRatings[item.date] === 1 && '😞'}
    {dailyRatings[item.date] === 2 && '😕'}
    {dailyRatings[item.date] === 3 && '😐'}
    {dailyRatings[item.date] === 4 && '😊'}
    {dailyRatings[item.date] === 5 && '🥳'}
  </span>
)}
                      <div
  onClick={() => {
    if (window.confirm(`确定要删除 ${item.date} 的复盘记录吗？`)) {
      onDeleteReflection?.(item.date);
    }
  }}
  style={{
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    color: '#999',
    fontSize: '16px'
  }}
  title="删除"
>
  ×
</div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#333',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {item.reflection}
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      )}

{activeTab === 'abandon' && (
  <div style={{
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e0e0e0'
  }}>
    {(() => {
      // 收集当前界面中所有放弃的任务，按日期分组
      const abandonByDate = {};
      Object.entries(tasksByDate || {}).forEach(([date, tasks]) => {
        tasks.forEach(task => {
          if (task.abandoned && task.abandonInfo) {
            if (!abandonByDate[date]) {
              abandonByDate[date] = [];
            }
            abandonByDate[date].push({
              taskText: task.text,
              reason: task.abandonInfo.reason,
              note: task.abandonInfo.note,
              category: task.category,
              subCategory: task.subCategory
            });
          }
        });
      });
      
      // 按日期倒序排序
      const sortedDates = Object.keys(abandonByDate).sort((a, b) => b.localeCompare(a));
      
      if (sortedDates.length === 0) {
        return (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无放弃记录
          </div>
        );
      }
      
      return (
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {sortedDates.map((date, dateIdx) => (
            <div
              key={date}
              style={{
                marginBottom: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* 日期标题 */}
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '8px 12px',
                fontWeight: 'bold',
                color: '#61A2Da',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {date.slice(5)} ({abandonByDate[date].length}个任务)
              </div>
              
              {/* 该日期下的所有放弃任务 */}
              {abandonByDate[date].map((item, idx) => (
                <div
                  key={`${date}_${idx}`}
                  style={{
                    padding: '12px',
                    borderBottom: idx < abandonByDate[date].length - 1 ? '1px solid #eee' : 'none',
                    backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                  }}
                >
                  {/* 第一排：任务名 + 类别 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {item.taskText}
                    </span>
                    {item.category && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#fff', 
                        backgroundColor: item.category === '校内' && item.subCategory ? '#4caf50' : '#1a73e8',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        {item.subCategory ? `${item.category}-${item.subCategory}` : item.category}
                      </span>
                    )}
                  </div>
                  
                  {/* 第二排：放弃原因 */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#c62828',
                    backgroundColor: '#ffebee',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    lineHeight: '1.4'
                  }}>
                    <span style={{ fontWeight: 'bold' }}></span>
                    {item.reason}
                    {item.note && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        {item.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    })()}
  </div>
)}


    </div>
  );
};

const CategoryManagerModal = ({ 
  categories, 
  onSave, 
  onClose, 
  subCategoryColors = {},
  categoryColors = {},
  onSaveCategoryColor,
  onSaveSubCategoryColor
}) => {
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const handleDeleteCategory = (catIndex) => {
    if (localCategories[catIndex].name === '校内') {
      alert('不能删除"校内"类别！');
      return;
    }
    
    const categoryName = localCategories[catIndex].name;
    if (window.confirm(`确定要删除分类 "${categoryName}" 吗？\n\n删除后，该分类下的所有任务将变为"未分类"状态。`)) {
      const newCategories = localCategories.filter((_, i) => i !== catIndex);
      setLocalCategories(newCategories);
    }
  };

  const handleAddCategory = () => {
    const newName = window.prompt('请输入新类别名称：');
    if (newName && newName.trim()) {
      const trimmedName = newName.trim();
      if (localCategories.find(cat => cat.name === trimmedName)) {
        alert('该类别名称已存在！');
        return;
      }
      const newCategory = {
        name: trimmedName,
        color: '#1a73e8',
        subCategories: []
      };
      setLocalCategories([...localCategories, newCategory]);
    }
  };

  const handleAddSubCategory = () => {
    const schoolCategory = localCategories.find(cat => cat.name === '校内');
    if (!schoolCategory) {
      alert('校内类别不存在！');
      return;
    }
    
    const newName = window.prompt('请输入新子类别名称：');
    if (newName && newName.trim()) {
      const trimmedName = newName.trim();
      if (schoolCategory.subCategories.includes(trimmedName)) {
        alert('该子类别名称已存在！');
        return;
      }
      
      const newCategories = [...localCategories];
      const schoolIndex = newCategories.findIndex(cat => cat.name === '校内');
      newCategories[schoolIndex].subCategories = [...newCategories[schoolIndex].subCategories, trimmedName];
      setLocalCategories(newCategories);
    }
  };

  const handleEditSubCategory = (catIndex, subCategoryIndex, newName) => {
    if (!newName || !newName.trim()) return;
    
    const trimmedNew = newName.trim();
    const newCategories = [...localCategories];
    const category = newCategories[catIndex];
    
    if (category.subCategories.includes(trimmedNew) && trimmedNew !== category.subCategories[subCategoryIndex]) {
      alert('该子类别名称已存在！');
      return;
    }
    
    category.subCategories[subCategoryIndex] = trimmedNew;
    setLocalCategories(newCategories);
    setEditingSubCategory(null);
  };

  const handleDeleteSubCategory = (catIndex, subCategoryIndex) => {
    const newCategories = [...localCategories];
    const category = newCategories[catIndex];
    
    if (window.confirm(`确定要删除子类别 "${category.subCategories[subCategoryIndex]}" 吗？`)) {
      category.subCategories.splice(subCategoryIndex, 1);
      setLocalCategories(newCategories);
    }
  };

  const startEditCategoryName = (catIndex, name) => {
    if (name === '校内') return;
    setEditingCategoryName({ index: catIndex, name });
  };

  const saveCategoryName = (catIndex, newName) => {
    if (!newName.trim()) {
      setEditingCategoryName(null);
      return;
    }
    
    const trimmedNew = newName.trim();
    const isDuplicate = localCategories.some((cat, i) => 
      i !== catIndex && cat.name === trimmedNew
    );
    
    if (isDuplicate) {
      alert('类别名称已存在，请使用其他名称');
      setEditingCategoryName(null);
      return;
    }
    
    const newCategories = [...localCategories];
    newCategories[catIndex].name = trimmedNew;
    setLocalCategories(newCategories);
    setEditingCategoryName(null);
  };

  const toggleCollapse = (categoryName) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
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
        padding: '16px',
        borderRadius: 10,
        width: '90%',
        maxWidth: 480,
        maxHeight: '85vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* 标题和右上角按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: 0, color: '#61A2Da', fontSize: '16px' }}>
            管理类别
          </h3>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              onClick={() => {
                onSave(localCategories);
                onClose();
              }}
              style={{
                padding: '4px 12px',
                backgroundColor: '#61A2Da',
                color: '#fff',
                borderRadius: 4,
                fontSize: 13,
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              保存
            </div>
            
            <div
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ×
            </div>
          </div>
        </div>

        {/* 两个添加按钮 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div
            onClick={handleAddCategory}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#61A2Da',
              color: '#fff',
              borderRadius: 6,
              fontSize: 13,
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            添加类别
          </div>
          <div
            onClick={handleAddSubCategory}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#61A2Da',
              color: '#fff',
              borderRadius: 6,
              fontSize: 13,
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            添加子类别
          </div>
        </div>

        {/* 类别列表 */}
        <div>
          {localCategories.map((category, catIndex) => {
            const isCollapsed = collapsedCategories[category.name];
            const isSchool = category.name === '校内';
            
            return (
              <div
                key={category.name}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  marginBottom: 8,
                  backgroundColor: '#fff',
                  overflow: 'hidden'
                }}
              >
                {/* 类别头部 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: '#fff',
                  borderBottom: isCollapsed ? 'none' : '1px solid #f0f0f0'
                }}>
                  {/* 左侧：色块 + 类别名称 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    flex: 1
                  }}>
                    {/* 色块 - 可点击选择颜色 */}

{/* 隐藏的原生 color input */}
<input
  type="color"
  value={categoryColors[category.name] || category.color}
  onChange={(e) => {
    const newColor = e.target.value;
    const newCategories = [...localCategories];
    newCategories[catIndex].color = newColor;
    setLocalCategories(newCategories);
    if (onSaveCategoryColor) {
      onSaveCategoryColor(category.name, newColor);
    }
  }}
  style={{
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    padding: 0,
    background: categoryColors[category.name] || category.color
  }}
  onClick={(e) => e.stopPropagation()}
/>
{/* 显示用的色块 div */}

                    
                    {/* 类别名称 */}
                    {editingCategoryName?.index === catIndex ? (
                      <input
                        type="text"
                        defaultValue={category.name}
                        autoFocus
                        onBlur={(e) => saveCategoryName(catIndex, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveCategoryName(catIndex, e.target.value);
                          }
                        }}
                        style={{
                          border: '1px solid #1a73e8',
                          borderRadius: 3,
                          padding: '2px 6px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          width: '100px',
                          height: '26px'
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditCategoryName(catIndex, category.name)}
                        style={{
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: category.name === '校内' ? 'default' : 'pointer',
                          padding: '2px 2px'
                        }}
                      >
                        {category.name}
                      </span>
                    )}
                    
                    <span style={{ fontSize: '11px', color: '#999' }}>
                      ({category.subCategories?.length || 0})
                    </span>
                  </div>
                  
                  {/* 右侧：展开按钮（校内） + 删除按钮 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isSchool && (
                      <div
                        onClick={() => toggleCollapse(category.name)}
                        style={{
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {isCollapsed ? '▶' : '▼'}
                      </div>
                    )}
                    
                    {!isSchool && (
                      <div
                        onClick={() => handleDeleteCategory(catIndex)}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          cursor: 'pointer',
                          color: '#999'
                        }}
                      >
                        ×
                      </div>
                    )}
                  </div>
                </div>

                {/* 子类别区域 */}
                {!isCollapsed && isSchool && (
                  <div style={{ padding: '8px', backgroundColor: '#fafafa' }}>
                    {/* 子类别列表 */}
                    <div>
                      {category.subCategories?.length > 0 ? (
                        category.subCategories.map((subCat, subIndex) => {
                          return (
                            <div
                              key={subIndex}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 6px',
                                borderBottom: subIndex < category.subCategories.length - 1 ? '1px solid #eee' : 'none',
                                backgroundColor: '#fff'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                {/* 子类别色块 - 可点击选择颜色 */}
                                <input
  type="color"
  value={subCategoryColors[subCat] || '#f5f5f5'}
  onChange={(e) => {
    if (onSaveSubCategoryColor) {
      onSaveSubCategoryColor(subCat, e.target.value);
    }
  }}
  style={{
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    padding: 0,
    background: subCategoryColors[subCat] || '#f5f5f5'
  }}
  onClick={(e) => e.stopPropagation()}
/>
                                
                                {editingSubCategory && editingSubCategory[0] === catIndex && editingSubCategory[1] === subIndex ? (
                                  <input
                                    type="text"
                                    defaultValue={subCat}
                                    autoFocus
                                    onBlur={(e) => {
                                      handleEditSubCategory(catIndex, subIndex, e.target.value);
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditSubCategory(catIndex, subIndex, e.target.value);
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '2px 6px',
                                      border: '1px solid #1a73e8',
                                      borderRadius: 3,
                                      fontSize: '12px',
                                      height: '24px'
                                    }}
                                  />
                                ) : (
                                  <span
                                    onClick={() => setEditingSubCategory([catIndex, subIndex])}
                                    style={{
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      padding: '2px 2px'
                                    }}
                                  >
                                    {subCat}
                                  </span>
                                )}
                              </div>
                              
                              <div
                                onClick={() => handleDeleteSubCategory(catIndex, subIndex)}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  color: '#999'
                                }}
                              >
                                ×
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ 
                          padding: '8px', 
                          textAlign: 'center', 
                          color: '#999',
                          fontSize: '11px',
                          backgroundColor: '#fff',
                          borderRadius: 3
                        }}>
                          暂无子类别
                        </div>
                      )}
                    </div>
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

// 方方正正的对勾组件 - 默认颜色改为灰色
const SquareCheckMark = ({ show, size = 14, color = "#bbb" }) => {
  if (!show) return null;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${size}px`,
      height: `${size}px`,
      marginLeft: '4px',
      position: 'relative',
      top: '1px'
    }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path 
          d="M20 6L9 17L4 12" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
      </svg>
    </span>
  );
};

const MilestoneModal = ({ onClose, totalCompletedTasks }) => {
  // 每100个任务升一级，1级需要100个任务
  const currentLevel = Math.floor(totalCompletedTasks / 100);
  // 当前等级区间的起始值（0, 100, 200, 300...）
  const levelStart = currentLevel * 100;
  // 当前等级区间的结束值
  const levelEnd = levelStart + 100;
  // 当前等级区间内的进度（0-100）
  const levelProgress = totalCompletedTasks - levelStart;
  // 进度百分比
  const progressPercent = (levelProgress / 100) * 100;

  // 等级称号
  const getLevelTitle = (level) => {
    if (level === 0) return "学习萌新";
    if (level === 1) return "1级学者";
    if (level === 2) return "2级学者";
    if (level === 3) return "3级学者";
    if (level === 4) return "4级学者";
    if (level === 5) return "5级学者";
    if (level === 6) return "6级学者";
    if (level === 7) return "7级学者";
    if (level === 8) return "8级学者";
    if (level === 9) return "9级学者";
    if (level >= 10) return `${level}级学者`;
    return `${level}级学者`;
  };

  // 等级颜色
  const getLevelColor = (level) => {
    if (level === 0) return "#9E9E9E";
    if (level === 1) return "#CD7F32"; // 青铜
    if (level === 2) return "#C0C0C0"; // 白银
    if (level === 3) return "#FFD700"; // 黄金
    if (level === 4) return "#00BCD4"; // 钻石
    if (level === 5) return "#9C27B0"; // 铂金
    if (level === 6) return "#FF5722"; // 橙金
    if (level === 7) return "#E91E63"; // 粉金
    if (level === 8) return "#3F51B5"; // 蓝金
    if (level === 9) return "#009688"; // 翠金
    if (level >= 10) return "#FFD700"; // 黄金
    return "#4CAF50";
  };

  // 下一等级需要的任务数
  const tasksToNextLevel = levelEnd - totalCompletedTasks;

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
      padding: '10px'
    }} onClick={onClose}>
      <style>{`
        .milestone-close-btn,
        .milestone-close-btn:hover,
        .milestone-close-btn:active,
        .milestone-close-btn:focus {
          color: #999 !important;
          background-color: transparent !important;
        }
      `}</style>
      
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',  // ← 从 320px 改成 420px，加宽
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* 右上角关闭按钮 */}
        <button
          className="milestone-close-btn"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            backgroundColor: 'transparent',
            color: '#999',
            border: 'none',
            borderRadius: '50%',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          ×
        </button>

        {/* 头部 - 等级徽章 */}
        <div style={{
          padding: '24px 20px 16px 20px',
          textAlign: 'center',
          background: `linear-gradient(135deg, ${getLevelColor(currentLevel)}20 0%, #f5f5f5 100%)`
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '8px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🏆
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: getLevelColor(currentLevel),
            marginBottom: '4px'
          }}>
            {getLevelTitle(currentLevel)}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#666'
          }}>
            已完成 {totalCompletedTasks} 个任务
          </div>
        </div>

        {/* 等级进度条 */}
        <div style={{ padding: '16px 20px' }}>
          {/* 等级区间显示 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#999',
            marginBottom: '6px'
          }}>
            <span>{levelStart}</span>
            <span style={{ fontWeight: 'bold', color: getLevelColor(currentLevel) }}>
              Lv.{currentLevel}
            </span>
            <span>{levelEnd}</span>
          </div>
          
     {/* 进度条 */}
{/* 进度条 */}
<div style={{
  width: '100%',
  height: '10px',
  backgroundColor: '#f0f0f0',
  borderRadius: '5px',
  overflow: 'hidden',
  marginBottom: '8px'
}}>
  <div style={{
    width: `${progressPercent}%`,
    height: '100%',
    backgroundColor: getLevelColor(currentLevel),
    borderRadius: '5px',
    transition: 'width 0.3s ease'
  }} />
</div>
          
          {/* 进度数字 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#666',
            marginBottom: '8px'
          }}>
            <span>📊 当前进度</span>
            <span>{levelProgress}/100</span>
          </div>

          {/* 下一级提示 */}
          {tasksToNextLevel > 0 && (
            <div style={{
              fontSize: '11px',
              color: '#888',
              textAlign: 'center',
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              💪 再完成 {tasksToNextLevel} 个任务，升至 {getLevelTitle(currentLevel + 1)}
            </div>
          )}
        </div>

        {/* 勋章列表 - 显示已解锁的等级徽章 */}
       {/* 勋章列表 - 显示已解锁的等级徽章 */}
<div style={{ padding: '0 16px 20px 16px' }}>
  <div style={{ 
    fontSize: '12px', 
    color: '#999', 
    marginBottom: '12px',
    textAlign: 'center',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '12px'
  }}>
    已解锁等级徽章
  </div>
  
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(level => {
      const isUnlocked = totalCompletedTasks >= (level * 100);
      const levelColor = getLevelColor(level);
      
      return (
        <div
          key={level}
          style={{
            width: '65px',           // ← 从 55px 加宽到 65px
            padding: '8px 4px',      // ← 增加上下内边距
            textAlign: 'center',
            backgroundColor: isUnlocked ? `${levelColor}15` : '#f5f5f5',
            borderRadius: '10px',    // ← 稍微增大圆角
            opacity: isUnlocked ? 1 : 0.5,
            border: isUnlocked ? `1px solid ${levelColor}30` : '1px solid #eee'
          }}
        >
          <div style={{ 
            fontSize: '22px',        // ← 图标稍微加大
            marginBottom: '4px',
            filter: isUnlocked ? 'none' : 'grayscale(1)'
          }}>
            {isUnlocked ? '🏅' : '🔒'}
          </div>
          <div style={{ 
            fontSize: '11px',        // ← 字号稍微加大
            fontWeight: isUnlocked ? 'bold' : 'normal',
            color: isUnlocked ? levelColor : '#999'
          }}>
            {level === 0 ? '萌新' : `${level}级`}
          </div>
          <div style={{ fontSize: '9px', color: '#aaa' }}>{level * 100}</div>
        </div>
      );
    })}
  </div>
</div>
      </div>
    </div>
  );
};
// 在 App 组件外添加这个组件
const CustomConfirmModal = ({ message, onConfirm, onCancel, onClose }) => {
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
      zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        width: '280px',
        textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        <p style={{ marginBottom: 20, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { onCancel?.(); onClose(); }}
            style={{
              flex: 1,
              padding: 8,
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            取消
          </button>
          <button
            onClick={() => { onConfirm?.(); onClose(); }}
            style={{
              flex: 1,
              padding: 8,
              backgroundColor: '#61A2Da',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

const MAX_EXP = 1000;

// 经验等级配置
const EXP_PER_LEVEL = 50;

// 经验获得弹窗组件 - 简洁大屏版
const ExpPopup = ({ expData, onClose }) => {
  const [totalProgress, setTotalProgress] = useState(0);
  const [dimProgress, setDimProgress] = useState(0);
  const [healthProgress, setHealthProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  
  const earnedExp = expData.totalExp || 0;
  const grandTotal = expData.grandTotal || 0;
  const beforeTotal = Math.max(0, grandTotal - earnedExp);
  
  const expEntries = Object.entries(expData.exp || {});
  const firstDim = expEntries.length > 0 ? expEntries[0] : null;
  const dimKey = firstDim ? firstDim[0] : null;
  const dimValue = firstDim ? firstDim[1] : 0;
  
  const getDimTotalFromStorage = (dimKey) => {
    try {
      const saved = localStorage.getItem('exp_data_v2');
      if (saved) {
        const data = JSON.parse(saved);
        const total = data.total || {};
        return total[dimKey] || 0;
      }
    } catch (e) {
      console.error('读取维度经验失败:', e);
    }
    return 0;
  };
  
 
  
  const dimGrandTotal = dimKey ? getDimTotalFromStorage(dimKey) : 0;
  const dimBeforeTotal = Math.max(0, dimGrandTotal - dimValue);
  
  
  
  const expPerLevel = EXP_PER_LEVEL;
  
  const beforeTotalPercent = expPerLevel > 0 ? Math.min((beforeTotal % expPerLevel) / expPerLevel * 100, 100) : 0;
  const afterTotalPercent = expPerLevel > 0 ? Math.min((grandTotal % expPerLevel) / expPerLevel * 100, 100) : 0;
  const beforeDimPercent = expPerLevel > 0 ? Math.min((dimBeforeTotal % expPerLevel) / expPerLevel * 100, 100) : 0;
  const afterDimPercent = expPerLevel > 0 ? Math.min((dimGrandTotal % expPerLevel) / expPerLevel * 100, 100) : 0;
  
  const currentLevel = Math.floor(grandTotal / expPerLevel) + 1;
  const expInLevel = grandTotal % expPerLevel;
  const targetExp = expPerLevel;
  
  const dimLevel = dimKey ? Math.floor(dimGrandTotal / expPerLevel) + 1 : 0;
  const dimExpInLevel = dimKey ? dimGrandTotal % expPerLevel : 0;
  
  const dimNames = {
  tipuo: '健康',
  xiuye: '智慧',
  xinshen: '心神',
  shouhu: '家庭',
  caiye: '财富',
  yiqu: '悦己'
};

   // ✅ 语库定义在组件内部
const encouragementMessages = [
  // 🏆 成就感
  "🏆 又拿下一城！你太强了！",
  "💎 每天进步1%，一年强大37倍！",
  "🔥 这就是传说中的执行力吗？",
  "⚡ 你的效率让任务瑟瑟发抖！",
  "🚀 离梦想又近了一步！",
  
  // 😄 幽默风趣
  "💪 任务：已阵亡，请补刀！",
  "🎯 百发百中，你就是神射手！",
  "😎 简单任务，轻松拿捏！",
  "🐮 牛啊！今天状态拉满！",
  "🏃 任务追不上你的速度！",
  
  // 🌱 成长型
  "🌱 种子在发芽，你在成长！",
  "📈 今天的积累，明天的爆发！",
  "🧱 一块砖一块砖，大厦将成！",
  "⏳ 时间会证明你的坚持！",
  "💡 每一次完成都是智慧的闪光！",
  
  // 🎯 目标导向
  "🎯 目标锁定，精准命中！",
  "⛰️ 山再高，一步步也能登顶！",
  "🏁 终点就在前方，继续冲！",
  "🌟 你的光芒，谁也挡不住！",
  "🎪 每天都是你的主场！",
  
  // 💪 动力型
  "💪 你的潜力，超乎你想象！",
  "🔥 燃烧吧，小宇宙！",
  "⚡ 充能完毕，继续战斗！",
  "🌟 你比自己想象的更优秀！",
  "🏆 冠军的心态，冠军的表现！",
  
  // 🤗 温暖鼓励
  "💖 今天也很努力呢！真棒！",
  "🌈 你的坚持，终将美好！",
  "☀️ 今天的阳光，因你而灿烂！",
  "🌸 努力的人，运气都不会太差！",
  "🌊 平静的力量，也能掀起巨浪！"
];

  // ✅ 随机抽取一条（只抽一次，固定在弹窗中）
  const randomMessageRef = useRef(
    encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]
  );

  useEffect(() => {
    const duration = 1200;
    const interval = 16;
    const steps = duration / interval;
    let currentStep = 0;
    
    const totalDiff = afterTotalPercent - beforeTotalPercent;
    const dimDiff = afterDimPercent - beforeDimPercent;
    
    if (totalDiff === 0 && dimDiff === 0 && healthDiff === 0) {
      setTotalProgress(afterTotalPercent);
      setDimProgress(afterDimPercent);
      
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 400);
      }, 1000);
      return;
    }
    
    const timer = setInterval(() => {
      currentStep++;
      const t = Math.min(currentStep / steps, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      
      setTotalProgress(Math.min(beforeTotalPercent + totalDiff * eased, 100));
      setDimProgress(Math.min(beforeDimPercent + dimDiff * eased, 100));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 400);
        }, 1200);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [beforeTotalPercent, afterTotalPercent, beforeDimPercent, afterDimPercent, onClose]);
  
  if (!isVisible) return null;
  
  const hasSkills = expData.skills && expData.skills.length > 0;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px 28px 28px',
        minWidth: '280px',
        maxWidth: '340px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid #e8e8e8',
        animation: 'slideUp 0.3s ease'
      }}>

         <div style={{
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#FF6B6B',
          marginBottom: '30px'
        }}>
            {randomMessageRef.current}
        </div>

    
        
        {/* ========== 第1条：总经验 ========== */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#333'
            }}>
              总经验 {earnedExp > 0 ? `+${earnedExp}` : earnedExp}
            </span>
            <span style={{
              fontSize: '11px',
              color: '#666'
            }}>
              Lv.{currentLevel}  {grandTotal % EXP_PER_LEVEL}/{EXP_PER_LEVEL}
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#f0f0f0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${totalProgress}%`,
              height: '100%',
              borderRadius: '3px',
              background: totalProgress >= 100 
                ? 'linear-gradient(90deg, #FFD700, #FF6B00)' 
                : 'linear-gradient(90deg, #61A2Da, #4CAF50)',
              transition: 'width 0.02s linear'
            }} />
          </div>
        </div>
        
        {/* ========== 第2条：体魄 ========== */}
        {dimKey && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#333'
              }}>
                {dimNames[dimKey]} +{dimValue}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#666'
              }}>
                Lv.{dimLevel}  {dimExpInLevel}/{targetExp}
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#f0f0f0',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${dimProgress}%`,
                height: '100%',
                borderRadius: '3px',
                background: dimProgress >= 100 
                  ? 'linear-gradient(90deg, #FFD700, #FF6B00)' 
                  : 'linear-gradient(90deg, #FF9800, #FF5722)',
                transition: 'width 0.02s linear'
              }} />
            </div>
          </div>
        )}
        
       
        
        {/* 技能标签 */}
        {hasSkills && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            justifyContent: 'center',
            paddingTop: '8px'
          }}>
            {expData.skills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  padding: '2px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#555',
                  border: '1px solid #e8e8e8'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        
        {/* 等级提升 */}
        {expData.levelUp && (
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            padding: '6px 12px',
            backgroundColor: '#FFF8E1',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#F57C00'
          }}>
            Lv.{expData.levelUp} 达成！
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
const [isCountTask, setIsCountTask] = useState(false);
const [expTaskDetail, setExpTaskDetail] = useState(null);  // 维度详情
const [expSkillDetail, setExpSkillDetail] = useState(null);  // 技能详情
const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 500);
const [showExpPopup, setShowExpPopup] = useState(null);
const [newDailyTaskExpValue, setNewDailyTaskExpValue] = useState(2);
const [silentSyncEnabled, setSilentSyncEnabled] = useState(false);
const syncDebounceTimerRef = useRef(null);
const [selectedSkills, setSelectedSkills] = useState([]);
const [isRestoring, setIsRestoring] = useState(false); // ← 添加
const [selectedCategoryTab, setSelectedCategoryTab] = useState('全部');
const [showSubjectTodoModal, setShowSubjectTodoModal] = useState(false);
const [showCustomConfirm, setShowCustomConfirm] = useState(null);
const [newTaskProgressCurrent, setNewTaskProgressCurrent] = useState(0);
const [newTaskTargetProgress, setNewTaskTargetProgress] = useState(100);
const [enableProgress, setEnableProgress] = useState(false);
const [showSearchModal, setShowSearchModal] = useState(false);
const [showExpDetail, setShowExpDetail] = useState(false);
const expDetailRef = useRef(null);

 const [forceUpdate, setForceUpdate] = useState(0);

// 在 App 组件中，找到其他 useState 的位置（大约在 4800 行附近），添加：

// ===== 今日消费 =====
const [todayExpense, setTodayExpense] = useState(() => {
  const saved = localStorage.getItem('today_expense');
  const date = localStorage.getItem('expense_date');
  const today = new Date().toISOString().split('T')[0];
  
  // 如果日期变了，重置消费为 0
  if (date !== today) {
    localStorage.setItem('expense_date', today);
    localStorage.setItem('today_expense', '0');
    return 0;
  }
  return saved ? parseFloat(saved) : 0;
});

const [monthlyBudget, setMonthlyBudget] = useState(() => {
  const saved = localStorage.getItem('monthly_budget');
  return saved ? parseFloat(saved) : 3000; // 默认每月预算 3000 元
});

const [showExpenseModal, setShowExpenseModal] = useState(false);

// ===== 本月消费计算 =====



const [expenseInput, setExpenseInput] = useState('');
const [expenseNote, setExpenseNote] = useState('');



 const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  // 2. 然后定义关注任务相关



const [expenseRecords, setExpenseRecords] = useState(() => {
  const saved = localStorage.getItem('expense_records');
  return saved ? JSON.parse(saved) : [];
});

// ===== 计算选定日期的消费 =====  // ✅ 移到 selectedDate 定义之后
const dateExpense = useMemo(() => {
  const records = expenseRecords?.filter(r => r.date === selectedDate) || [];
  return records.reduce((sum, r) => sum + r.amount, 0);
}, [expenseRecords, selectedDate]);

const monthExpense = useMemo(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return expenseRecords
    .filter(record => {
      const d = new Date(record.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, record) => sum + record.amount, 0);
}, [expenseRecords]);




// ===== 本月剩余天数 =====
const daysLeftInMonth = useMemo(() => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}, []);
// 添加消费记录
const addExpense = (amount, note = '') => {
  const newTotal = todayExpense + amount;
  setTodayExpense(newTotal);
  localStorage.setItem('today_expense', String(newTotal));
  
  const newRecord = {
    id: Date.now().toString(),
    amount: amount,
    note: note || '',
    time: new Date().toISOString(),
    date: selectedDate  // ✅ 使用当前选中的日期
  };
  
  const newRecords = [...expenseRecords, newRecord];
  setExpenseRecords(newRecords);
  localStorage.setItem('expense_records', JSON.stringify(newRecords));
};

// 删除消费记录
const deleteExpenseRecord = (recordId) => {
  const record = expenseRecords.find(r => r.id === recordId);
  if (record) {
    const newTotal = todayExpense - record.amount;
    setTodayExpense(newTotal);
    localStorage.setItem('today_expense', String(newTotal));
  }
  const newRecords = expenseRecords.filter(r => r.id !== recordId);
  setExpenseRecords(newRecords);
  localStorage.setItem('expense_records', JSON.stringify(newRecords));
};

// 重置今日消费
const resetTodayExpense = () => {
  if (window.confirm('确定要重置今日消费吗？')) {
    setTodayExpense(0);
    localStorage.setItem('today_expense', '0');
    setExpenseRecords([]);
    localStorage.setItem('expense_records', '[]');
  }
};

// 获取今日消费明细
const getTodayExpenseRecords = () => {
  const today = new Date().toISOString().split('T')[0];
  return expenseRecords.filter(r => r.date === today);
};

 
  
  // ========== 所有 useEffect 放在 useState 后面 ==========
  // 响应式布局
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 500);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // ✅ 在这里添加跑马灯窗口resize的 useEffect（和其他 useEffect 放在一起）
  useEffect(() => {
    const handleResize = () => {
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
const [dailyTaskTemplates, setDailyTaskTemplates] = useState(() => {
  const saved = localStorage.getItem('daily_task_templates');
  if (saved) {
    return JSON.parse(saved);
  }
  return [];
});

const [showDailyTaskManager, setShowDailyTaskManager] = useState(false);
const [newDailyTaskText, setNewDailyTaskText] = useState('');





  const [lastSyncHash, setLastSyncHash] = useState(() => {
    return localStorage.getItem('last_sync_hash') || '';
  });

const [showCategoryDetailModal, setShowCategoryDetailModal] = useState(null); 


const [showMoreMenu, setShowMoreMenu] = useState(false);
const [semesterEndDate, setSemesterEndDate] = useState(() => {
  const saved = localStorage.getItem('semester_end_date');
  return saved || '2026-07-05'; // 默认暑假开始日期
});




const [showTimeEditModal, setShowTimeEditModal] = useState(null);
const [showTemplateList, setShowTemplateList] = useState(false);
// 在 App 组件中，其他 useState 附近添加

const [showTimeRecordModal, setShowTimeRecordModal] = useState(false);
  // 在 App 组件开头，其他 useState 附近添加

  // 在 App 组件中，找到其他 useRef 定义的位置，添加：
const isUserTogglingRef = useRef(false);
  // 添加这个状态定义
  const [lastSyncStatus, setLastSyncStatus] = useState({
    success: false,
    time: null,
    message: ''
  });
// 关注任务管理弹窗状态
const [showFocusModal, setShowFocusModal] = useState(false);
const [newTaskName, setNewTaskName] = useState('');


   const loadDataWithFallback = async (key, fallback) => {
    try {
      const data = await loadMainData(key);
      return data !== null ? data : fallback;
    } catch (error) {
      console.error(`加载 ${key} 失败:`, error);
      return fallback;
    }
  };
const [bulkDateRange, setBulkDateRange] = useState('today');
const [bulkDateRangeStart, setBulkDateRangeStart] = useState(() => {
  return new Date().toISOString().split('T')[0];
});
const [bulkDateRangeEnd, setBulkDateRangeEnd] = useState(() => {
  return new Date().toISOString().split('T')[0];
});

const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
const [showAddTaskModal, setShowAddTaskModal] = useState(false);  // 添加任务弹窗
const [showBulkImportModal, setShowBulkImportModal] = useState(false);  // 批量导入弹窗
const [subCategoryTaskOrder, setSubCategoryTaskOrder] = useState({}); // 存储每个子分类的任务顺序
// 在 App 组件中，找到其他 useState 定义的位置，添加：
const [sortingSubCategory, setSortingSubCategory] = useState(null); // { category: '校内', subCategory: '数学' }
const [draggedSubTaskIndex, setDraggedSubTaskIndex] = useState(null);
const [isDraggingSubCategory, setIsDraggingSubCategory] = useState(false);
useEffect(() => {
  const savedOrder = localStorage.getItem('subcategory_task_order');
  if (savedOrder) {
    setSubCategoryTaskOrder(JSON.parse(savedOrder));
  }
}, []);
// 在 App 组件中，其他 useState 附近添加（约在第 5300 行）
useEffect(() => {
  const handleResize = () => {
    setIsDesktop(window.innerWidth >= 500);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
// 保存排序顺序
const saveSubCategoryOrder = (subCategory, orderedTaskIds) => {
  const newOrder = {
    ...subCategoryTaskOrder,
    [subCategory]: orderedTaskIds
  };
  setSubCategoryTaskOrder(newOrder);
  localStorage.setItem('subcategory_task_order', JSON.stringify(newOrder));
};

// 获取排序后的任务列表
const getSortedSubCategoryTasks = (subCategory, tasks) => {
  const savedOrder = subCategoryTaskOrder[subCategory];
  if (!savedOrder || savedOrder.length === 0) return tasks;
  
  const taskMap = new Map();
  tasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  const ordered = [];
  savedOrder.forEach(id => {
    if (taskMap.has(id)) {
      ordered.push(taskMap.get(id));
      taskMap.delete(id);
    }
  });
  
  // 添加新任务（不在保存顺序中的）
  ordered.push(...taskMap.values());
  return ordered;
};

// 开始排序子分类
const startSortingSubCategory = (subCategory) => {
  setSortingSubCategory(subCategory);
};

// 结束排序并保存
const endSortingSubCategory = (subCategory, orderedTasks) => {
  const orderedIds = orderedTasks.map(task => task.id);
  saveSubCategoryOrder(subCategory, orderedIds);
  setSortingSubCategory(null);
};

// 在 App 组件中，找到其他 useRef 的位置，添加：

// 取消放弃任务
const cancelAbandoned = (task) => {
  console.log('✅ 取消放弃任务:', task.text);
  
  // ========== 1. 取消放弃：加回经验值 ==========
  const rewards = getTaskRewards(task);
  if (rewards && Object.keys(rewards).length > 0) {
    const currentDate = selectedDate || new Date().toISOString().split('T')[0];
    addExp(currentDate, rewards);
    console.log('🎯 取消放弃，加回经验值:', rewards);
  }
  
  // ========== 2. 恢复任务 ==========
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? { ...t, abandoned: false, done: false }
            : t
        );
      });
    } else if (task.crossDateId) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId
            ? { ...t, abandoned: false, done: false }
            : t
        );
      });
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? { ...t, abandoned: false, done: false } : t
      );
    }
    
    return newTasksByDate;
  });
  
  console.log('✅ 任务已恢复正常:', task.text);
};

const markTaskAsAbandoned = (task, abandonInfo = null) => {
  console.log('🚫 标记任务为放弃:', task.text, abandonInfo);
  
  // ========== 1. 放弃未完成的任务：扣除经验值 ==========
  // 不管任务是否完成，放弃时都扣分（表示计划失败）
  const rewards = getTaskRewards(task);
  if (rewards && Object.keys(rewards).length > 0) {
    // 取反：变成负数扣除
    const negativeRewards = {};
    Object.entries(rewards).forEach(([dim, value]) => {
      negativeRewards[dim] = -Number(value);
    });
    
    const currentDate = selectedDate || new Date().toISOString().split('T')[0];
    addExp(currentDate, negativeRewards);
    console.log('🎯 放弃任务，扣除经验值:', negativeRewards);
  }
  
  // ========== 2. 标记任务为放弃 ==========
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? { ...t, abandoned: true, done: false, abandonInfo: abandonInfo }
            : t
        );
      });
    } else if (task.crossDateId) {
      const currentDate = selectedDate;
      newTasksByDate[currentDate] = (newTasksByDate[currentDate] || []).map(t => {
        if (t.id === task.id || (t.crossDateId === task.crossDateId && t.id === task.id)) {
          return { ...t, abandoned: true, done: false, abandonInfo: abandonInfo };
        }
        return t;
      });
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? { ...t, abandoned: true, done: false, abandonInfo: abandonInfo } : t
      );
    }
    
    return newTasksByDate;
  });
};
// 更新放弃信息
const updateAbandonInfo = (task, newAbandonInfo) => {
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    const updateTask = (t) => ({
      ...t,
      abandonInfo: newAbandonInfo
    });
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? updateTask(t)
            : t
        );
      });
    } else if (task.crossDateId) {
      const currentDate = selectedDate;
      newTasksByDate[currentDate] = (newTasksByDate[currentDate] || []).map(t =>
        t.crossDateId === task.crossDateId ? updateTask(t) : t
      );
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? updateTask(t) : t
      );
    }
    
    return newTasksByDate;
  });
};
const [chartView, setChartView] = useState('month');
const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);


  const [tasksByDate, setTasksByDate] = useState({});
  // ============================================================
// 在 tasksByDate 定义之后，添加以下所有代码
// ============================================================

// ===== 1. getTodayStats（依赖 tasksByDate） =====
const getTodayStats = useCallback((date) => {
  const tasks = tasksByDate[date] || [];
  let done = 0;
  let total = 0;
  
  tasks.forEach(task => {
    if (CATEGORY_TO_DIM[task.category]) {
      total++;
      if (task.done && !task.abandoned) done++;
    }
  });
  
  return { done, total };
}, [tasksByDate]);



// ============================================================
// ===== 2. 经验系统完整定义 =====
// ============================================================

// 修改后
const DIMENSIONS = {
  tipuo: { name: "健康", emoji: "💪", color: "#9ADBC5" },
  caiye: { name: "财富", emoji: "💼", color: "#FCC351" },
  xiuye: { name: "智慧", emoji: "📚", color: "#FD8D6E" },
  shouhu: { name: "家庭", emoji: "👨‍👩‍👧", color: "#FA86A9" },
  xinshen: { name: "心神", emoji: "🧠", color: "#A1DEE0" },
  yiqu: { name: "悦己", emoji: "⛰️", color: "#DFDE6C" }
};

const CATEGORY_TO_DIM = {
  "健康": "tipuo",
  "财富": "caiye",
  "智慧": "xiuye",
  "家庭": "shouhu",
  "心神": "xinshen",
  "悦己": "yiqu"
};

const BASE_EXP = {
  "健康": 2,
  "智慧": 2,
  "心神": 2,
  "家庭": 2,
  "财富": 2,
  "悦己": 2
};

// 2.4 经验等级配置


// 2.5 经验数据状态
const [expData, setExpData] = useState(() => {
  const saved = localStorage.getItem('exp_data_v2');
  return saved ? JSON.parse(saved) : { daily: {}, total: {} };
});

// ===== 获取任务奖励（支持校内子分类） =====
// ===== 获取任务奖励 =====
// ===== 获取任务奖励 =====
const getTaskRewards = useCallback((task) => {
  // ✅ 安全检查
  if (!task) {
    console.warn('⚠️ getTaskRewards: task is undefined');
    return {};
  }
  
  const rewards = {};
  const category = task.category;
  const subCategory = task.subCategory || '';
  const expValue = task.expValue || 2;
  
  // 维度映射
  const dimMap = {
    '健康': 'tipuo',
    '智慧': 'xiuye',
    '心神': 'xinshen',
    '家庭': 'shouhu',
    '财富': 'caiye',
    '悦己': 'yiqu'
  };
  
  let dimKey = dimMap[category];
  
  // 校内分类特殊处理
  if (category === '校内' && subCategory) {
    const subDimMap = {
      '数学': 'xiuye',
      '语文': 'xiuye',
      '英语': 'xiuye',
      '运动': 'tipuo'
    };
    dimKey = subDimMap[subCategory] || dimKey;
  }
  
  // ✅ 如果找不到维度，默认到智慧
  if (!dimKey) {
    console.warn('⚠️ 未找到维度，使用默认:', category);
    dimKey = 'xiuye';
  }
  
  // ✅ 确保返回对象
  rewards[dimKey] = expValue;
  return rewards;
}, []);

// 在 App 组件顶部添加（useRef 附近）
const addExpCache = new Map();

const addExp = useCallback((date, rewards) => {
  console.group('🔍 addExp 被调用');
  console.log('日期:', date);
  console.log('奖励:', rewards);
  console.trace('📍 调用堆栈:');
  console.groupEnd();
  if (!date || !rewards || Object.keys(rewards).length === 0) {
    return;
  }
  
  // ✅ 防重复：同一任务同一秒内只执行一次
  const cacheKey = `${date}_${JSON.stringify(rewards)}`;
  const now = Date.now();
  const lastCall = addExpCache.get(cacheKey) || 0;
  
  if (now - lastCall < 1000) {
    console.warn('⏭️ addExp 重复调用被阻止 (1秒内)');
    return;
  }
  addExpCache.set(cacheKey, now);
  
  console.log('📊 addExp 执行:', date, rewards);
  
  setExpData(prev => {
    const newDaily = { ...prev.daily };
    const newTotal = { ...prev.total };
    
    if (!newDaily[date]) newDaily[date] = {};
    
    Object.entries(rewards).forEach(([dim, value]) => {
      // ✅ 改成 !== 0，允许负数
      if (value !== 0) {
        newDaily[date][dim] = (newDaily[date][dim] || 0) + value;
        newTotal[dim] = (newTotal[dim] || 0) + value;
        console.log(`  📈 ${dim}: ${value > 0 ? '+' : ''}${value} (累计: ${newTotal[dim]})`);
      }
    });
    
    const newData = { daily: newDaily, total: newTotal };
    localStorage.setItem('exp_data_v2', JSON.stringify(newData));
    return newData;
  });
}, []);

// 2.8 任务完成时加分
const handleTaskComplete = useCallback((task, date) => {
  // ✅ 多次任务跳过
  if (task?.isCountTask === true) {
    console.log('⏭️ 多次任务跳过 handleTaskComplete:', task.text);
    return null;
  }
  
  const rewards = getTaskRewards(task);
  if (Object.keys(rewards).length > 0) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    addExp(targetDate, rewards);
    const dimKey = Object.keys(rewards)[0];
    return { 
      dimName: DIMENSIONS[dimKey]?.name || '', 
      expValue: Object.values(rewards)[0] 
    };
  }
  return null;
}, [getTaskRewards, addExp]);

// 2.9 获取今日经验
const getTodayExp = useCallback((date) => {
  return expData.daily[date] || {};
}, [expData]);

// 2.10 获取总经验
const getTotalExp = useCallback(() => {
  return expData.total || {};
}, [expData]);

// 2.11 获取总经验值
// ========== 获取总经验值（不含气血） ==========
const grandTotal = useMemo(() => {
  const dimensions = ['tipuo', 'xiuye', 'xinshen', 'shouhu', 'caiye', 'yiqu'];
  let total = 0;
  dimensions.forEach(dim => {
    total += (expData.total[dim] || 0);
  });
  return total;
}, [expData]);

// 2.12 获取今日总经验
const getTodayTotal = useCallback((date) => {
  const today = expData.daily[date] || {};
  return Object.values(today).reduce((sum, val) => sum + val, 0);
}, [expData]);

// 2.13 计算等级
const calculateLevel = useCallback((exp) => {
  return Math.floor(exp / EXP_PER_LEVEL) + 1;
}, []);


const ExpPanel = ({ 
  selectedDate, 
  isOpen = false, 
  onToggle, 
  tasksByDate = {}, 
  dailyRatings = {}, 
  isDesktop = false,
  onShowTaskDetail,
  onShowSkillDetail,
   expenseRecords = [],
     dateExpense = 0,      // ✅ 接收
  monthExpense = 0  
}) => {
  console.log('📅 ExpPanel 收到的 selectedDate:', selectedDate);
  const [showDetail, setShowDetail] = useState(isOpen);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);
   console.log('📊 ExpPanel expenseRecords:', expenseRecords); // ✅ 加这行
  console.log('📅 selectedDate:', selectedDate); // ✅ 加这行
  const [showSkills, setShowSkills] = useState(() => {
    return window.innerWidth >= 768;
  });
  const panelRef = useRef(null);

  useEffect(() => {
    setShowDetail(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowDetail(false);
        setShowSkills(false);
        if (onToggle) onToggle(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onToggle]);

  // ========== 获取今日评分 ==========
  const getTodayRating = () => {
    const rating = dailyRatings[selectedDate] || 0;
    return rating;
  };

  const getRatingEmoji = () => {
    const rating = getTodayRating();
    if (rating === 1) return '😞';
    if (rating === 2) return '😕';
    if (rating === 3) return '😐';
    if (rating === 4) return '😊';
    if (rating === 5) return '🥳';
    return '🙂';
  };


  // ========== 核心数据定义 ==========
  const todayExp = expData.daily[selectedDate] || {};
  const totalExp = expData.total || {};
  const todayTotal = Object.values(todayExp)
  .reduce((sum, val) => sum + val, 0);  // 👈 包含正数和负数

  const grandTotal = useMemo(() => {
    const dimensions = ['tipuo', 'xiuye', 'xinshen', 'shouhu', 'caiye', 'yiqu'];
    let total = 0;
    dimensions.forEach(dim => {
      total += (totalExp[dim] || 0);
    });
    return total;
  }, [totalExp]);

  // 总积分等级：0-50 是 Lv.1，51-100 是 Lv.2
const level = grandTotal <= 50 ? 1 : Math.floor((grandTotal - 1) / EXP_PER_LEVEL) + 1;

  // ========== 今日任务统计 ==========
  const todayTasks = tasksByDate[selectedDate] || [];
  let done = 0;
  let total = 0;
  todayTasks.forEach(task => {
  if (task.category !== "本周任务" && task.category !== "常规任务") {
    // 👇 如果任务经验值为负数，不计入统计
    if (task.expValue && task.expValue < 0) return;
    
    total++;
    if (task.done && !task.abandoned) done++;
  }
});

  // ========== 辅助函数 ==========
  const getExpColor = (exp) => {
    if (exp === 0) return '#e5e7eb';
    if (exp < 10) return '#fbbf24';
    if (exp < 25) return '#f59e0b';
    if (exp < 50) return '#34c759';
    return '#10b981';
  };

 // 1. 修改 getExpInLevel - 返回当前等级内的进度 (0-50)
const getExpInLevel = (exp) => {
  return exp % EXP_PER_LEVEL;
};

// 2. 修改 getProgress - 当前等级内进度百分比
const getProgress = (exp) => {
  const expInLevel = exp % EXP_PER_LEVEL;
  return (expInLevel / EXP_PER_LEVEL) * 100;
};

// 3. 修改等级计算 - 0-50 是 Lv.1，51-100 是 Lv.2
const getLevel = (exp) => {
  if (exp <= 50) return 1;
  return Math.floor((exp - 1) / EXP_PER_LEVEL) + 1;
};

  const getDimColor = (key, opacity = 0.35) => {
    const colors = {
      tipuo: `rgba(154, 219, 197, ${opacity})`,
      xiuye: `rgba(253, 141, 110, ${opacity})`,
      xinshen: `rgba(161, 222, 224, ${opacity})`,
      shouhu: `rgba(250, 134, 169, ${opacity})`,
      caiye: `rgba(252, 195, 81, ${opacity})`,
      yiqu: `rgba(223, 222, 108, ${opacity})`
    };
    return colors[key] || `rgba(200, 200, 200, ${opacity})`;
  };

  const getDimName = (key) => {
    const names = {
      tipuo: '健康',
      caiye: '财富',
      xiuye: '智慧',
      shouhu: '家庭',
      xinshen: '心神',
      yiqu: '悦己'
    };
    return names[key] || key;
  };

  const getDimEmoji = (key) => {
    const emojis = {
      tipuo: '💪',
      xiuye: '📚',
      xinshen: '🧠',
      shouhu: '👨‍👩‍👧',
      caiye: '💰',
      yiqu: '⛰️'
    };
    return emojis[key] || '📌';
  };

  // ========== 获取今日技能 ==========
  const getTodaySkills = useCallback(() => {
    const todayTasks = tasksByDate?.[selectedDate] || [];
    const skillMap = {};

    const skillConfigs = {
      '健身': { icon: '💪', color: '#4CAF50' },
      '阅读': { icon: '📖', color: '#2196F3' },
      '英语': { icon: '🔤', color: '#E91E63' },
      '冥想': { icon: '🧘', color: '#9C27B0' },
      '理财': { icon: '💰', color: '#FFC107' },
      '烹饪': { icon: '🍳', color: '#FF9800' },
      '写作': { icon: '✍️', color: '#3F51B5' },
      '运动': { icon: '🏃', color: '#4CAF50' },
      '育儿': { icon: '👶', color: '#E91E63' },
      '摄影': { icon: '📷', color: '#03A9F4' },
      '音乐': { icon: '🎵', color: '#9C27B0' },
      '设计': { icon: '🎨', color: '#E91E63' },
      '编程': { icon: '💻', color: '#4CAF50' }
    };

    todayTasks.forEach(task => {
      if (task.done === true && task.abandoned !== true && task.tags) {
        task.tags.forEach(tag => {
          if (skillConfigs[tag]) {
            if (!skillMap[tag]) {
              skillMap[tag] = { count: 0, ...skillConfigs[tag] };
            }
            skillMap[tag].count += 1;
          }
        });
      }
    });

    return skillMap;
  }, [tasksByDate, selectedDate]);

  const todaySkills = getTodaySkills();
  const skillKeys = Object.keys(todaySkills);

  // ========== 主渲染 ==========
  return (
    <div ref={panelRef} style={{
      display: 'block',
      width: '100%',
      marginBottom: '2px'
    }}>
      {/* ===== 顶部统计行 ===== */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '2px 0',
        marginBottom: '4px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer'
      }}
      onClick={() => {
        setShowSkills(!showSkills);
        if (onToggle) onToggle(!showSkills);
      }}>
        
        {/* 第一行：今日 + 积分 + 打卡统计 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          flexDirection: isDesktop ? 'row' : 'row',
          flexWrap: isDesktop ? 'nowrap' : 'wrap',
          gap: isDesktop ? '0' : '4px'
        }}>
          {/* 左侧：今日 + 积分 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: isDesktop ? '12px' : '12px', fontWeight: 'bold', color: '#333' }}>
              今日
            </span>
            <span style={{ 
  fontSize: isDesktop ? '14px' : '14px', 
  fontWeight: 'bold', 
  color: todayTotal > 0 ? '#4caf50' : (todayTotal < 0 ? '#f44336' : '#999')
}}>
  {todayTotal > 0 ? `+${todayTotal}` : todayTotal}
</span>
            <span style={{ fontSize: isDesktop ? '11px' : '11px', color: '#999' }}>
              ({done}/{total})
            </span>
          </div>
          
          {/* 中间：打卡统计 - 仅手机端显示 */}
          {!isDesktop && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ 
                fontSize: '9px', 
                color: '#bbb'
              }}>
                已打卡 {
                  Object.keys(tasksByDate).filter(date => {
                    const tasks = tasksByDate[date] || [];
                    return tasks.some(t => t.done === true && t.abandoned !== true);
                  }).length
                } 天 · 累计 {
                  Object.values(tasksByDate).reduce((sum, tasks) => 
                    sum + tasks.filter(t => t.done === true && t.abandoned !== true).length, 0
                  )
                } 个
              </span>
            </div>
          )}
          
          {/* 右侧：总积分 + 等级 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: isDesktop ? '10px' : '10px', color: '#999' }}>总积分</span>
            <span style={{ 
              fontSize: isDesktop ? '13px' : '13px', 
              fontWeight: 'bold', 
              color: '#1a73e8'
            }}>
              {grandTotal}
            </span>
            <span style={{ 
              fontSize: isDesktop ? '9px' : '9px', 
              color: '#61A2Da',
              backgroundColor: '#e8f0fe',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              Lv.{level}
            </span>
          </div>
        </div>
      </div>

      {/* ===== 6个属性卡片 - 手机端一行6个 ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr' : 'repeat(6, 1fr)',  // 👈 手机端6列
        gap: isDesktop ? '8px' : '3px'  // 👈 手机端间距缩小
      }}>
        {Object.keys(DIMENSIONS).map((key) => {
  const dim = DIMENSIONS[key];
  const today = todayExp[key] || 0;
  const total = totalExp[key] || 0;
  
  // ===== ✅ 修复：等级计算（0-50是Lv.1，51-100是Lv.2） =====
  const dimLevel = total <= 50 ? 1 : Math.floor((total - 1) / EXP_PER_LEVEL) + 1;
  
  // ===== ✅ 修复：当前等级内进度（0-50显示total/50，51-100显示(total-50)/50） =====
  const expInLevel = total <= 50 ? total : total % EXP_PER_LEVEL;
  
  // ===== ✅ 修复：进度条百分比 =====
  const progress = (expInLevel / 50) * 100;
  
  // 等级上限（用于显示左下角）
  const maxExpForLevel = dimLevel * EXP_PER_LEVEL;
  
  const hasExp = today > 0; 
  
  const bgColor = getDimColor(key, 0.1);
  const dimName = dim.name;
  const color = categoryColors[dimName] || '#10b981';
  const tasksForDim = getTasksForDimension(key);
  const taskCount = tasksForDim.length;

  return (
    <div
      key={key}
      style={{
        padding: isDesktop ? '4px 10px' : '2px 3px',
        borderRadius: '6px',
        backgroundColor: today > 0 ? bgColor : 'transparent',
        border: total < 0 ? '1px solid #f44336' : '1px solid #e8e8e8',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onShowTaskDetail) {
          onShowTaskDetail(key);
        }
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onShowTaskDetail) {
          onShowTaskDetail(key);
        }
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: isDesktop ? '6px' : '2px',
          fontSize: isDesktop ? '13px' : '8px'
        }}>
          <span style={{
            color: '#333',
            fontSize: isDesktop ? '13px' : '8px',
            fontWeight: isDesktop ? '500' : '500'
          }}>
            {dimName}
          </span>
          {taskCount > 0 && (
            <span style={{
              fontSize: isDesktop ? '10px' : '6px',
              color: '#4caf50',
              backgroundColor: '#e8f5e9',
              padding: isDesktop ? '1px 6px' : '1px 3px',
              borderRadius: '8px',
              marginLeft: '2px'
            }}>
              {taskCount}
            </span>
          )}
        </span>
        <span style={{
          fontSize: isDesktop ? '12px' : '8px',
          fontWeight: 'bold',
          color: today > 0 ? '#4caf50' : (today < 0 ? '#f44336' : '#999')
        }}>
          {today > 0 ? `+${today}` : (today < 0 ? today : '')}
        </span>
      </div>

      {/* ===== ✅ 进度条：使用修复后的 progress ===== */}
      <div style={{
        height: isDesktop ? '3px' : '2px',
        backgroundColor: '#eee',
        borderRadius: '2px',
        marginTop: isDesktop ? '3px' : '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: color,
          borderRadius: '2px'
        }} />
      </div>

      {/* ===== ✅ 底部：显示 total/等级上限，Lv.等级 ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: isDesktop ? '9px' : '6px',
        color: '#999',
        marginTop: isDesktop ? '2px' : '1px'
      }}>
        <span>{total}/{maxExpForLevel}</span>
        <span>Lv.{dimLevel}</span>
      </div>
    </div>
  );
})}
      </div>

      {/* ===== 技能卡片区域（保持原样） ===== */}
      {/* ===== 技能卡片区域 - 有技能才显示 ===== */}
{/* ===== 技能卡片区域 - 有技能直接展开 ===== */}
{skillKeys.length > 0 && (
  <div style={{
    display: 'grid',
    gridTemplateColumns: isDesktop ? '1fr' : 'repeat(3, 1fr)',
    gap: '4px',
    marginTop: '6px'
  }}>
    {skillKeys.map((skill) => {
      const data = todaySkills[skill];
      const skillExp = data.count * 2;
      const progress = Math.min((skillExp / EXP_PER_LEVEL) * 100, 100);
      const expInLevel = skillExp % EXP_PER_LEVEL;
      const skillLevel = Math.floor(skillExp / EXP_PER_LEVEL) + 1;
      const color = data.color || '#999';
      const bgColor = color + '15';

      return (
        <div
          key={skill}
          style={{
            padding: isDesktop ? '4px 10px' : '2px 6px',
            borderRadius: '6px',
            backgroundColor: bgColor,
            border: `1px solid ${color}30`,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onShowSkillDetail) {
              onShowSkillDetail(skill);
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onShowSkillDetail) {
              onShowSkillDetail(skill);
            }
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: isDesktop ? '6px' : '3px',
              fontSize: isDesktop ? '13px' : '11px'
            }}>
              <span style={{
                color: '#333',
                fontSize: isDesktop ? '13px' : '8px',
                fontWeight: isDesktop ? '500' : '500'
              }}>
                {skill}
              </span>
              <span style={{
                fontSize: isDesktop ? '10px' : '6px',
                color: '#4caf50',
                backgroundColor: '#e8f5e9',
                padding: isDesktop ? '1px 6px' : '1px 3px',
                borderRadius: '8px',
                marginLeft: '2px'
              }}>
                {data.count}
              </span>
            </span>
            <span style={{
              fontSize: isDesktop ? '12px' : '9px',
              fontWeight: 'bold',
              color: skillExp > 0 ? '#4caf50' : '#999'
            }}>
              {skillExp > 0 ? `+${skillExp}` : ''}
            </span>
          </div>

          <div style={{
            height: isDesktop ? '3px' : '2px',
            backgroundColor: '#eee',
            borderRadius: '2px',
            marginTop: isDesktop ? '3px' : '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: color,
              borderRadius: '2px'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: isDesktop ? '9px' : '6px',
            color: '#999',
            marginTop: isDesktop ? '2px' : '1px'
          }}>
            <span>{expInLevel}/{EXP_PER_LEVEL}</span>
            <span>Lv.{skillLevel}</span>
          </div>
        </div>
      );
    })}
  </div>
)}

{/* ===== 消费统计卡片（仅手机端显示） ===== */}
{!isDesktop && (
  <div style={{ marginTop: '6px' }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '4px'
    }}>
      {/* 今日消费 */}
<div
  onClick={() => setShowExpenseModal(true)}
  style={{
    padding: '4px 6px',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e8e8e8',
    cursor: 'pointer',
    textAlign: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  }}
>
  <span style={{ fontSize: '8px', color: '#999' }}>今日消费</span>
  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f44336' }}>
    ¥{dateExpense.toFixed(1)}
  </span>
</div>

      {/* 本月消费 */}
      <div
        onClick={() => setShowExpenseModal(true)}
        style={{
          padding: '4px 6px',
          borderRadius: '6px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e8e8e8',
          cursor: 'pointer',
          textAlign: 'center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        <span style={{ fontSize: '8px', color: '#999' }}>本月消费</span>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f44336' }}>
          ¥{monthExpense.toFixed(1)}
        </span>
      </div>

      {/* 本月剩余 */}
      <div
        onClick={() => setShowExpenseModal(true)}
        style={{
          padding: '4px 6px',
          borderRadius: '6px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e8e8e8',
          cursor: 'pointer',
          textAlign: 'center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        <span style={{ fontSize: '8px', color: '#999' }}>本月剩余</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: (monthlyBudget - monthExpense) >= 0 ? '#4caf50' : '#f44336'
        }}>
          ¥{(monthlyBudget - monthExpense).toFixed(1)}
        </span>
      </div>
    </div>
  </div>
)}



    </div>
  );
};




  // 获取跨日期任务在指定日期的完成类型
const getTaskCompletionType = useCallback((task, date) => {
  // 检查这个任务是否在该日期被实际完成过
  const dayTasks = tasksByDate[date] || [];
  
  // 查找是否有同文本的任务是被实际完成的
  const actualCompletedTask = dayTasks.find(t => 
    t.text === task.text && 
    t.actualCompletedDate === date  // 标记实际完成的日期
  );
  
  if (actualCompletedTask && actualCompletedTask.actualCompletedDate === date) {
    return { completed: true, type: 'actual' };
  }
  
  // 否则返回同步完成状态
  return { completed: task.done, type: task.done ? 'synced' : 'none' };
}, [tasksByDate]);

  const [showGitHubSyncModal, setShowGitHubSyncModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  
  const hasAttemptedRestore = useRef(false);  // 添加这一行
  // 在现有状态定义区域添加
  // 在现有的状态定义区域添加
const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [confettiParts, setConfettiParts] = useState([]);
const lastCompletionStatus = useRef({});
const isFirstLoad = useRef(true);  // 👈 添加
const prevCompletionState = useRef({});



const [categoryColors, setCategoryColors] = useState(() => {
  const saved = localStorage.getItem('category_colors');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    '健康': '#9ADBC5',
    '智慧': '#FD8D6E',
    '心神': '#A1DEE0',
    '家庭': '#FA86A9',
    '财富': '#FCC351',
    '悦己': '#DFDE6C'
  };
});
// 保存大类别颜色的函数
const saveCategoryColor = useCallback((catName, color) => {
  setCategoryColors(prev => {
    const newColors = { ...prev, [catName]: color };
    localStorage.setItem('category_colors', JSON.stringify(newColors));
    return newColors;
  });
}, []);

// 保存子类别颜色的函数
const saveSubCategoryColor = useCallback((subCatName, color) => {
  setSubCategoryColors(prev => {
    const newColors = { ...prev, [subCatName]: color };
    localStorage.setItem('subcategory_colors', JSON.stringify(newColors));
    return newColors;
  });
}, []);


// 👇 在这里添加
const [subCategoryColors, setSubCategoryColors] = useState(() => {
  const saved = localStorage.getItem('subcategory_colors');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    '数学': '#E8F5E9',
    '语文': '#FFFCE8',
    '英语': '#FCE4EC',
    '运动': '#E3F2FD'
  };
});

 






// 2. 每个日期的完成状态
const [focusTaskStatus, setFocusTaskStatus] = useState(() => {
  const saved = localStorage.getItem('focus_task_status');
  return saved ? JSON.parse(saved) : {};
});







  
  // 学习结束时间 - 按日期存储
const [studyEndTimes, setStudyEndTimes] = useState(() => {
  const saved = localStorage.getItem('daily_study_end_times');
  return saved ? JSON.parse(saved) : {};
});

// 获取当前日期的结束时间
const getCurrentStudyEndTime = useCallback(() => {
  return studyEndTimes[selectedDate] || '';
}, [studyEndTimes, selectedDate]);

// 设置当前日期的结束时间
const setCurrentStudyEndTime = useCallback((timeStr) => {
  // ✅ 如果 timeStr 无效，删除记录
  if (!timeStr || timeStr.trim() === '') {
    setStudyEndTimes(prev => {
      const newTimes = { ...prev };
      delete newTimes[selectedDate];
      localStorage.setItem('daily_study_end_times', JSON.stringify(newTimes));
      return newTimes;
    });
    return;
  }
  
  // ✅ 有效时间才保存
  setStudyEndTimes(prev => {
    const newTimes = { ...prev, [selectedDate]: timeStr };
    localStorage.setItem('daily_study_end_times', JSON.stringify(newTimes));
    return newTimes;
  });
}, [selectedDate]);

// 当前日期的时分（用于弹窗输入）
const [studyEndHour, setStudyEndHour] = useState('');
const [studyEndMinute, setStudyEndMinute] = useState('');

// 当切换日期时，更新弹窗的时分显示
useEffect(() => {
  const currentTime = getCurrentStudyEndTime();
  const parts = currentTime.split(':');
  setStudyEndHour(parts[0] || '');
  setStudyEndMinute(parts[1] || '');
}, [selectedDate, getCurrentStudyEndTime]);
  
  const [newTaskText, setNewTaskText] = useState("");
 
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
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
  const [newTaskExpValue, setNewTaskExpValue] = useState(2); 
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  
  
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(null);
  // 在现有的状态定义区域添加
const [showWeekTaskModal, setShowWeekTaskModal] = useState(false);
const [showMonthTaskModal, setShowMonthTaskModal] = useState(false);
const [monthTasks, setMonthTasks] = useState([]); // 本月任务
const [newMonthTask, setNewMonthTask] = useState({
  text: '',
  category: '校内',
  subCategory: '',
  deadline: '',
  progress: 0,
  target: 100,
  unit: '%',
  important: false,
  note: ''
});
  const reflectionTextareaRef = useRef(null);
  const addInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  // 临时保留旧变量避免错误

// 替换为：
// 获取当前日期的任务列表（用于显示）
const todayTasks = useMemo(() => {
  const dateTasks = tasksByDate[selectedDate] || [];
  
  // 常规任务只显示未完成的（因为完成后会从常规任务区域移除）
  // 其他分类的任务正常显示
  return dateTasks.map(task => {
    // 如果是已完成的常规任务，不显示在常规任务区域（它已经在其他分类了）
    return task;
  });
}, [tasksByDate, selectedDate]);


const getFilteredTasks = useCallback((categoryName) => {
  if (categoryName === '全部') {
    return todayTasks.filter(t => 
      t.category !== "本周任务" && !t.isRegularTask
    );
  }
  return todayTasks.filter(t => 
    t.category === categoryName && 
    t.category !== "本周任务" && 
    !t.isRegularTask
  );
}, [todayTasks]);


const handleSaveCategories = (updatedCategories) => {
  setCategories(updatedCategories);
  saveMainData('categories', updatedCategories);
};
const [isInitialized, setIsInitialized] = useState(false);
const [editingCategory, setEditingCategory] = useState(null); // 新增：正在编辑的类别
const [collapsedSubCategories, setCollapsedSubCategories] = useState({});





// ✅ 修改为优先使用 localStorage，如果没有则用完整的 baseCategories
const [categories, setCategories] = useState(() => {
  // ✅ 强制使用新的 baseCategories，不读取旧数据
  return baseCategories.map(cat => ({ 
    ...cat, 
    subCategories: cat.subCategories || [] 
  }));
});
const categoryTabs = useMemo(() => {
  const allTabs = [];
  
  // "全部"标签
  let allTasks = todayTasks.filter(t => 
    t.category !== "本周任务" && 
    !t.isRegularTask
  );
  if (showOnlyCompleted) {
    allTasks = allTasks.filter(t => t.done === true && t.abandoned !== true);
  }
  allTabs.push({
    name: '全部',
    label: `全部 ${allTasks.length}`,
    count: allTasks.length
  });
  
  // 各分类标签
  const categoryTabs = categories
    .filter(c => c.name !== "常规任务" && c.name !== "本周任务")
    .map(c => {
      let tasks = todayTasks.filter(t => 
        t.category === c.name && 
        t.category !== "本周任务" && 
        !t.isRegularTask
      );
      if (showOnlyCompleted) {
        tasks = tasks.filter(t => t.done === true && t.abandoned !== true);
      }
      return {
        name: c.name,
        label: `${c.name} ${tasks.length}`,
        count: tasks.length
      };
    });
  
  return [...allTabs, ...categoryTabs];
}, [categories, todayTasks, showOnlyCompleted]);

// 添加这个状态 - 用于控制各个分类的折叠/展开
const [collapsedCategories, setCollapsedCategories] = useState({
  "本周任务": true,
  "语文": false,
  "数学": false,
  "英语": false,
  "通识": false,
  "运动": false,
  "校内": false,
  "生活": true
});









const isAddingTask = useRef(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statsMode, setStatsMode] = useState("week");
  const [showImageModal, setShowImageModal] = useState(null);
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showMoveTaskModal, setShowMoveTaskModal] = useState(null);
  const [showDailyLogModal, setShowDailyLogModal] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dailyRatings, setDailyRatings] = useState(() => {
  




    const saved = localStorage.getItem(`${STORAGE_KEY}_dailyRatings`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      console.log('📖 加载评分数据:', parsed);
      return parsed;
    } catch (e) {
      console.error('解析评分数据失败:', e);
      return {};
    }
  }
  return {};
});
  const [dailyReflections, setDailyReflections] = useState(() => {
  const saved = localStorage.getItem(`${STORAGE_KEY}_dailyReflections`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('解析复盘数据失败:', e);
      return {};
    }
  }
  return {};
});
  const [showCrossDateModal, setShowCrossDateModal] = useState(null);
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




const [reminderText, setReminderText] = useState(() => {
  return localStorage.getItem(`${STORAGE_KEY}_daily_reminder`) || '';
});

const handleReminderChange = (text) => {
  setReminderText(text);
  localStorage.setItem(`${STORAGE_KEY}_daily_reminder`, text);
};

// 保存学期结束日期
const saveSemesterEndDate = (date) => {
  setSemesterEndDate(date);
  localStorage.setItem('semester_end_date', date);
};
// 添加编辑和删除函数
const handleEditMonthTask = (updatedTask) => {
  setMonthTasks(prev => prev.map(task => 
    task.id === updatedTask.id ? updatedTask : task
  ));
};

const handleDeleteMonthTask = (taskId) => {
  setMonthTasks(prev => prev.filter(task => task.id !== taskId));
};



// 🔽 在这里添加获取Gist列表的函数 🔽
  const getLatestStudyTrackerGist = async (token) => {
    try {
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('无法获取Gist列表');
      
      const gists = await response.json();
      
      // 过滤出学习跟踪器的gist，按更新时间排序
      const studyGists = gists
        .filter(gist => {
  const files = Object.values(gist.files);
  return files.some(file => 
    file.filename.includes('life-os') || 
    file.filename.includes('json')
  );
})
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      return studyGists[0]; // 返回最新的一个
    } catch (error) {
      console.error('获取Gist列表失败:', error);
      return null;
    }
  };


  
const restoreFromGitHub = useCallback(async () => {
  console.log('🔍 开始恢复流程');
  
  const token = localStorage.getItem('github_token');
  let gistId = localStorage.getItem(PAGE_ID + '_github_gist_id');
  
  console.log('Token:', token ? '已设置' : '未设置');
  console.log('Gist ID:', gistId || '未设置');
  
  if (!token) {
    alert('请先设置 GitHub Token');
    setShowGitHubSyncModal(true);
    return;
  }

  // 如果没有 Gist ID，让用户输入
  if (!gistId) {
    gistId = window.prompt('请输入 Gist ID（在之前浏览器的同步设置中可以找到）');
    console.log('用户输入的 Gist ID:', gistId);
    if (!gistId) return;
  }

  try {
    console.log('📡 开始请求 Gist 数据...');
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }

    const gist = await response.json();
    console.log('Gist 获取成功:', gist);
    
const content = gist.files['life-os-data.json'].content;    const backupData = JSON.parse(content);
    console.log('备份数据:', backupData);

    if (window.confirm(`确定要恢复 ${new Date(backupData.syncTime).toLocaleString()} 的备份数据吗？这将覆盖当前所有数据！`)) {
      console.log('用户确认恢复，开始设置状态...');
      
      // 立即保存到 localStorage
      await saveMainData('tasks', backupData.tasksByDate || {});
  
    
      
      console.log('数据已保存到 localStorage');
      
      // 然后设置状态
      setTasksByDate(backupData.tasksByDate || {});
     
  
      
      // 保存 Gist ID
      localStorage.setItem('github_gist_id', gistId);
      
      console.log('状态设置完成，准备重新加载...');
      
      alert('数据恢复成功！页面将重新加载。');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败: ' + error.message);
  }
}, []);





const [syncConfig, setSyncConfig] = useState({
  token: localStorage.getItem(PAGE_ID + '_github_token') || '',
   gistId: localStorage.getItem(PAGE_ID + '_github_gist_id') || '978de7cead4b35c6c0784051f5cc7405',
 autoSync: false,  // ✅ 改成 false，关闭自动同步
  lastSync: localStorage.getItem(PAGE_ID + '_github_last_sync') || ''
});






// 获取当前日期的心情和评价

const getCurrentDailyRating = useCallback(() => {
  const rating = dailyRatings[selectedDate] || 0;
  
  return rating;
}, [dailyRatings, selectedDate]);


// 在 App 组件的函数区域添加
const handleDeleteImage = (task) => {
  if (task.isWeekTask) {
    // 本周任务需要更新所有日期
    const updatedTasksByDate = { ...tasksByDate };
    Object.keys(updatedTasksByDate).forEach(date => {
      updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
        t.isWeekTask && t.text === task.text ? { ...t, image: null } : t
      );
    });
    setTasksByDate(updatedTasksByDate);
  } else {
    // 普通任务只更新当前日期
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? { ...t, image: null } : t
      )
    }));
  }
};


// 设置当前日期的评价

// 设置当前日期的评价
const setCurrentDailyRating = (rating) => {
  setDailyRatings(prev => {
    const newRatings = {
      ...prev,
      [selectedDate]: rating
    };
    // ✅ 立即保存到 localStorage
    localStorage.setItem(`${STORAGE_KEY}_dailyRatings`, JSON.stringify(newRatings));
    console.log('💾 保存评分:', selectedDate, rating);
    return newRatings;
  });
};

const dailyRating = getCurrentDailyRating();
// 获取当前选中日期的复盘内容
const getCurrentDailyReflection = () => {
  return dailyReflections[selectedDate] || '';
};

// 设置当前选中日期的复盘内容
// 设置当前选中日期的复盘内容
const setCurrentDailyReflection = (reflection) => {
  setDailyReflections(prev => {
    const newReflections = {
      ...prev,
      [selectedDate]: reflection
    };
    // 👇 保存到 localStorage
    localStorage.setItem(`${STORAGE_KEY}_dailyReflections`, JSON.stringify(newReflections));
    console.log('💾 保存复盘:', selectedDate, reflection);
    return newReflections;
  });
  
  // 同时保存到 daily_ 文件（兼容旧格式）
  const dailyData = {
    date: selectedDate,
    rating: dailyRatings[selectedDate] || 0,
    reflection: reflection,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(`${STORAGE_KEY}_daily_${selectedDate}`, JSON.stringify(dailyData));
};

// 保存每日数据（包括评分、复盘）
const saveDailyData = useCallback(async (date = selectedDate) => {
  const dailyData = {
    rating: dailyRatings[date] || 0,
    reflection: dailyReflections[date] || '',
    date: date
  };
  
  await saveMainData(`daily_${date}`, dailyData);
  console.log(`💾 已保存 ${date} 的每日数据:`, dailyData);
}, [dailyRatings, dailyReflections, selectedDate]);





const handleRestoreData = useCallback(async (backupData, mode = 'overwrite') => {
  try {
    console.log('🔄 开始恢复数据...', mode);
    
    // ========== 只保留覆盖模式 ==========
    if (mode !== 'overwrite') {
      console.log('⚠️ 只支持覆盖模式，自动切换为覆盖模式');
    }
    
    // 1. 恢复任务数据
    if (backupData.tasksByDate) {
      setTasksByDate(backupData.tasksByDate);
      await saveMainData('tasks', backupData.tasksByDate);
      console.log('✅ 恢复任务数据:', Object.keys(backupData.tasksByDate).length, '天');
    }
    
    // 2. 恢复每日评分
    if (backupData.dailyRatings) {
      setDailyRatings(backupData.dailyRatings);
      localStorage.setItem(`${STORAGE_KEY}_dailyRatings`, JSON.stringify(backupData.dailyRatings));
      console.log('✅ 恢复每日评分:', Object.keys(backupData.dailyRatings).length, '天');
    }
    
    // 3. 恢复每日复盘
    if (backupData.dailyReflections) {
      setDailyReflections(backupData.dailyReflections);
      localStorage.setItem(`${STORAGE_KEY}_dailyReflections`, JSON.stringify(backupData.dailyReflections));
      console.log('✅ 恢复每日复盘:', Object.keys(backupData.dailyReflections).length, '天');
    }
    
    // 4. 恢复学习结束时间
    if (backupData.studyEndTimes) {
      setStudyEndTimes(backupData.studyEndTimes);
      localStorage.setItem('daily_study_end_times', JSON.stringify(backupData.studyEndTimes));
      console.log('✅ 恢复学习结束时间');
    }
    
    // 5. 恢复本月任务
    if (backupData.monthTasks) {
      setMonthTasks(backupData.monthTasks);
      await saveMainData('monthTasks', backupData.monthTasks);
      console.log('✅ 恢复本月任务:', backupData.monthTasks.length, '个');
    }
    
    // 6. 恢复分类数据
    if (backupData.categories) {
      setCategories(backupData.categories);
      await saveMainData('categories', backupData.categories);
      console.log('✅ 恢复分类数据');
    }
    
    // 7. 恢复经验数据
    if (backupData.expData) {
      setExpData(backupData.expData);
      localStorage.setItem('exp_data_v2', JSON.stringify(backupData.expData));
      console.log('✅ 恢复经验数据:', backupData.expData);
    }
    
    // 8. 恢复每日提醒
    if (backupData.reminderText !== undefined) {
      setReminderText(backupData.reminderText);
      localStorage.setItem(`${STORAGE_KEY}_daily_reminder`, backupData.reminderText);
      console.log('✅ 恢复每日提醒');
    }
    
    // 9. 恢复学期结束日期
    if (backupData.semesterEndDate) {
      setSemesterEndDate(backupData.semesterEndDate);
      localStorage.setItem('semester_end_date', backupData.semesterEndDate);
      console.log('✅ 恢复学期结束日期:', backupData.semesterEndDate);
    }
    
    // 10. 恢复任务排序顺序
    if (backupData.taskOrders) {
      Object.entries(backupData.taskOrders).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      console.log('✅ 恢复任务排序顺序');
    }
    
    // 11. 恢复子分类排序顺序
    if (backupData.subCategoryOrders) {
      Object.entries(backupData.subCategoryOrders).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      console.log('✅ 恢复子分类排序顺序');
    }
    
    // 12. 恢复科目待办
    if (backupData.subjectTodoEntries) {
      localStorage.setItem('subject_todo_entries_v2', JSON.stringify(backupData.subjectTodoEntries));
      console.log('✅ 恢复科目待办');
    }
    
    // 13. 恢复每日任务模板
    if (backupData.dailyTaskTemplates) {
      setDailyTaskTemplates(backupData.dailyTaskTemplates);
      localStorage.setItem('daily_task_templates', JSON.stringify(backupData.dailyTaskTemplates));
      console.log('✅ 恢复每日任务模板:', backupData.dailyTaskTemplates.length, '个');
    }
    
    // 14. 恢复子分类颜色
    if (backupData.subCategoryColors) {
      localStorage.setItem('subcategory_colors', JSON.stringify(backupData.subCategoryColors));
      console.log('✅ 恢复子分类颜色');
    }
    
    // 15. 恢复类别颜色
    if (backupData.categoryColors) {
      localStorage.setItem('category_colors', JSON.stringify(backupData.categoryColors));
      console.log('✅ 恢复类别颜色');
    }
    
    // ===== 16. 恢复消费数据 =====
    if (backupData.expenseRecords) {
      setExpenseRecords(backupData.expenseRecords);
      localStorage.setItem('expense_records', JSON.stringify(backupData.expenseRecords));
      console.log('✅ 恢复消费记录:', backupData.expenseRecords.length, '条');
    }
    
    if (backupData.todayExpense !== undefined) {
      setTodayExpense(backupData.todayExpense);
      localStorage.setItem('today_expense', String(backupData.todayExpense));
      console.log('✅ 恢复今日消费:', backupData.todayExpense);
    }
    
    if (backupData.monthlyBudget) {
  setMonthlyBudget(backupData.monthlyBudget);
  localStorage.setItem('monthly_budget', String(backupData.monthlyBudget));
  console.log('✅ 恢复每月预算:', backupData.monthlyBudget);
}
    
    if (backupData.expenseDate) {
      localStorage.setItem('expense_date', backupData.expenseDate);
      console.log('✅ 恢复消费日期:', backupData.expenseDate);
    }
    
    console.log('✅ 覆盖恢复完成！');
    alert('数据已覆盖恢复！页面将重新加载。');
    setTimeout(() => window.location.reload(), 500);
    
  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败: ' + error.message);
  }
}, [
  setTasksByDate,
  setDailyRatings,
  setDailyReflections,
  setStudyEndTimes,
  setMonthTasks,
  setExpData,
  setCategories,
  setReminderText,
  setSemesterEndDate,
  setDailyTaskTemplates,
  setExpenseRecords,
  setTodayExpense,
  setMonthlyBudget,
  saveMainData
]);


const getDataHash = useCallback(() => {
  const taskHash = [];
  Object.entries(tasksByDate).forEach(([date, tasks]) => {
    tasks.forEach(task => {
      taskHash.push({
        id: task.id,
        text: task.text,
        done: task.done,
        timeSpent: task.timeSpent,
        updatedAt: task.updatedAt || task.createdAt
      });
    });
  });
  
  const reflectionHash = Object.entries(dailyReflections).map(([date, content]) => ({
    date,
    content: typeof content === 'string' ? content : content?.content || ''
  }));
  
  return JSON.stringify({
    tasks: taskHash,
    reflections: reflectionHash,
    monthTasksCount: monthTasks.length,
  
    
    timestamp: Date.now()
  });
}, [tasksByDate, dailyReflections, monthTasks]);
// 



const syncToGitHub = useCallback(async (silent = false) => {
  const token = localStorage.getItem('github_token');
  if (!token) {
    if (!silent) {
      setShowGitHubSyncModal(true);
      alert('请先设置 GitHub Token');
    }
    return false;
  }

  // ✅ 手动同步时（silent=false）强制同步，不检查哈希
  // ✅ 静默同步时（silent=true）才检查是否有数据变化
  if (silent) {
    const currentHash = getDataHash();
    if (currentHash === lastSyncHash) {
      console.log('⏭️ 数据无变化，跳过静默同步');
      return false;
    }
  }
  console.log('📤 开始同步...');

  setIsSyncing(true);
  
  // 添加超时控制（30秒）
  const syncTimeout = setTimeout(() => {
    if (isSyncing) {
      console.log('⏰ 同步超时，取消');
      setIsSyncing(false);
      if (!silent) {
        alert('同步超时，请检查网络后重试');
      }
    }
  }, 30000);

  try {
    await saveDailyData(selectedDate);
    
    // 收集数据
    const allDailyRatings = {};
    const allDailyReflections = {};
    const allKeys = Object.keys(localStorage);
    const dailyKeys = allKeys.filter(key => key.startsWith(`${STORAGE_KEY}_daily_`));
    
    dailyKeys.forEach(key => {
      try {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          if (data && data.date) {
            allDailyRatings[data.date] = data.rating || 0;
            allDailyReflections[data.date] = data.reflection || '';
          }
        }
      } catch (e) {}
    });
    
    Object.assign(allDailyRatings, dailyRatings);
    Object.assign(allDailyReflections, dailyReflections);
    
    // 收集排序数据
    const allTaskOrders = {};
    const allSubCategoryOrders = {};
    
    allKeys.forEach(key => {
      if (key.startsWith('tasks_order_')) {
        try {
          allTaskOrders[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
      if (key.startsWith('subcategory_order_')) {
        try {
          allSubCategoryOrders[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
    });
    
    // 压缩数据
    const compressedTasks = {};
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      compressedTasks[date] = tasks.map(task => ({
        id: task.id,
        text: task.text,
        category: task.category,
        subCategory: task.subCategory,
        done: task.done,
        timeSpent: task.timeSpent,
        note: task.note,
        reflection: task.reflection,
        updatedAt: task.updatedAt,
        createdAt: task.createdAt,
        timeRecords: task.timeRecords?.slice(-5),
        subTasks: task.subTasks?.length > 0 ? task.subTasks : undefined,
        pinned: task.pinned,
        tags: task.tags,
        progress: task.progress,
        scheduledTime: task.scheduledTime,
        reminderTime: task.reminderTime,
        crossDateId: task.crossDateId,
        isCrossDate: task.isCrossDate,
        crossDates: task.crossDates,
        actualCompletedDate: task.actualCompletedDate,
        isWeekTask: task.isWeekTask,
        weekStart: task.weekStart,
        targetCategory: task.targetCategory,
        targetSubCategory: task.targetSubCategory,
        abandoned: task.abandoned,
        abandonInfo: task.abandonInfo
      }));
    });
    
   const syncData = {
  tasksByDate: compressedTasks,
  dailyRatings: allDailyRatings,
  dailyReflections: allDailyReflections,
  studyEndTimes,
  monthTasks: monthTasks.map(t => ({
    id: t.id,
    text: t.text,
    category: t.category,
    subCategory: t.subCategory,
    progress: t.progress,
    target: t.target,
    updatedAt: t.updatedAt
  })),
  categories,
  reminderText,
  semesterEndDate,
  expData: expData,  // ✅ 添加这一行：同步经验数据
  taskOrders: allTaskOrders,
  subCategoryOrders: allSubCategoryOrders,
  syncTime: new Date().toISOString(),
  version: '2.4',
   expenseRecords: expenseRecords,
  todayExpense: todayExpense,
  dailyBudget: dailyBudget,
  expenseDate: new Date().toISOString().split('T')[0],
  lastSelectedDate: selectedDate,
  lastCurrentMonday: currentMonday.toISOString()
};

    const jsonString = JSON.stringify(syncData);
    console.log(`📦 同步数据大小: ${(jsonString.length / 1024).toFixed(2)} KB`);

    // 获取或创建 Gist
    let gistId = localStorage.getItem('github_gist_id');
    let method = 'POST';
    let url = 'https://api.github.com/gists';
    
    if (gistId) {
      method = 'PATCH';
      url = `https://api.github.com/gists/${gistId}`;
    }

    const gistData = {
  description: 'Life OS Backup - 人生操作系统备份',
  public: false,
  files: {
    'life-os-data.json': {
      content: jsonString
    }
  }
};

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gistData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`同步失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!gistId && result.id) {
      localStorage.setItem(PAGE_ID + '_github_gist_id', result.id);
      localStorage.setItem('github_gist_id', result.id);
      console.log('✅ 新 Gist ID 已保存:', result.id);
    }

    // 保存同步哈希和时间
    if (silent) {
      // 静默同步成功后才更新哈希
      const newHash = getDataHash();
      setLastSyncHash(newHash);
      localStorage.setItem('last_sync_hash', newHash);
    }
    localStorage.setItem(PAGE_ID + '_github_last_sync', new Date().toISOString());
    
    const syncTime = new Date().toLocaleString();
    
    if (!silent) {
  alert(`✅ 同步成功！\n时间：${syncTime}`);
} else {
  setLastSyncStatus({
    success: true,
    time: new Date(),
    message: `同步成功 (${new Date().toLocaleTimeString()})`
  });
  setTimeout(() => {
    setLastSyncStatus(prev => ({ ...prev, message: '' }));
  }, 2000);
}

// ✅ 添加这两行：无论手动还是静默，都保存同步时间
const now = new Date().toISOString();
localStorage.setItem('github_last_sync', now);
localStorage.setItem('PAGE_A_github_last_sync', now);

return true;

  } catch (error) {
    console.error('同步失败:', error);
    
    if (!silent) {
      let errorMessage = '同步失败：';
      if (error.message.includes('401')) {
        errorMessage += 'Token 无效或已过期';
      } else if (error.message.includes('403')) {
        errorMessage += '权限不足';
      } else if (error.message.includes('404')) {
        errorMessage += 'Gist 不存在';
        localStorage.removeItem('github_gist_id');
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } else {
      setLastSyncStatus({
        success: false,
        time: new Date(),
        message: `❌ 同步失败`
      });
      setTimeout(() => {
        setLastSyncStatus(prev => ({ ...prev, message: '' }));
      }, 3000);
    }
    
    return false;
  } finally {
    clearTimeout(syncTimeout);
    setIsSyncing(false);
  }
}, [tasksByDate, dailyRatings, dailyReflections, studyEndTimes, monthTasks, categories, reminderText, semesterEndDate, selectedDate, currentMonday, saveDailyData, getDataHash, lastSyncHash, setLastSyncHash]);



const debouncedSync = useCallback(() => {
  // ✅ 完全禁用自动同步
  console.log('⏭️ 自动同步已禁用');
  return;
  
  
}, []);







// 显示选择弹窗的自动恢复函数 - 不检查 token，直接显示弹窗
const showRestoreChoiceModal = useCallback(() => {
  const today = new Date().toISOString().split('T')[0];
  const lastRestoreDate = localStorage.getItem('last_cloud_restore_date');
  
  // 如果今天已经处理过，不再提示
  if (lastRestoreDate === today) {
    console.log('📅 今天已经处理过，跳过提示');
    return;
  }
  
  // ❌ 删除 token 检查，直接显示弹窗
  
  // 创建选择弹窗
  const modalDiv = document.createElement('div');
  modalDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
    padding: 20px;
  `;
  
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    background: white;
    border-radius: 20px;
    width: 100%;
    max-width: 320px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  `;
  
  contentDiv.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 12px;">☁️</div>
      <h3 style="margin: 0 0 8px 0; color: #61A2Da; font-size: 18px;">云端数据同步</h3>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 13px; line-height: 1.4;">
        是否同步云端数据？
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
        <button id="restore-btn" style="
          width: 100%;
          padding: 12px;
          background: #61A2Da;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        ">
          📥 恢复云端数据
        </button>
        
        <button id="upload-btn" style="
          width: 100%;
          padding: 12px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        ">
          📤 上传本地数据到云端
        </button>
        
        <button id="skip-btn" style="
          width: 100%;
          padding: 10px;
          background: transparent;
          color: #999;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          cursor: pointer;
        ">
          🔘 今天不再提醒
        </button>
      </div>
      
      <div style="font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px;">
        提示：选择后今天不会再次提示
      </div>
    </div>
  `;
  
  modalDiv.appendChild(contentDiv);
  document.body.appendChild(modalDiv);
  
  // ========== 恢复云端数据 ==========
  const restoreBtn = contentDiv.querySelector('#restore-btn');
  restoreBtn.onclick = async () => {
    document.body.removeChild(modalDiv);
    localStorage.setItem('last_cloud_restore_date', today);
    setSilentSyncEnabled(true);
    
    // 检查是否有 token
    const token = localStorage.getItem('github_token') || localStorage.getItem('PAGE_A_github_token');
    if (!token) {
      // 没有 token，先弹出设置弹窗
      alert('请先设置 GitHub Token');
      setShowGitHubSyncModal(true);
      return;
    }
    
    // 有 token，执行恢复
    await performCloudRestore();
  };
  
  // ========== 上传本地数据到云端 ==========
  const uploadBtn = contentDiv.querySelector('#upload-btn');
  uploadBtn.onclick = async () => {
    document.body.removeChild(modalDiv);
    localStorage.setItem('last_cloud_restore_date', today);
    setSilentSyncEnabled(true);
    
    // 检查是否有 token
    const token = localStorage.getItem('github_token') || localStorage.getItem('PAGE_A_github_token');
    if (!token) {
      // 没有 token，先弹出设置弹窗
      alert('请先设置 GitHub Token');
      setShowGitHubSyncModal(true);
      return;
    }
    
    // 有 token，执行上传
    const loadingToast = document.createElement('div');
    loadingToast.textContent = '⏳ 正在上传到云端...';
    loadingToast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #61A2Da;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 20000;
    `;
    document.body.appendChild(loadingToast);
    
    try {
      await syncToGitHub(false);
      loadingToast.textContent = '✅ 上传成功！';
      setTimeout(() => loadingToast.remove(), 2000);
    } catch (error) {
      loadingToast.textContent = '❌ 上传失败';
      setTimeout(() => loadingToast.remove(), 2000);
    }
  };
  
  // ========== 今天不再提醒 ==========
  const skipBtn = contentDiv.querySelector('#skip-btn');
  skipBtn.onclick = () => {
    document.body.removeChild(modalDiv);
    localStorage.setItem('last_cloud_restore_date', today);
    setSilentSyncEnabled(true);
    console.log('🔕 用户选择今天不再提醒');
  };
  
  modalDiv.onclick = (e) => {
    if (e.target === modalDiv) {
      document.body.removeChild(modalDiv);
    }
  };
}, [syncToGitHub]);

// ✅ 在这里添加初始化检查的 useEffect
useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const lastRestoreDate = localStorage.getItem('last_cloud_restore_date');
  
  if (lastRestoreDate === today) {
    setSilentSyncEnabled(true);
  }
}, []);

// 调试函数
window.showRestoreChoice = showRestoreChoiceModal;
window.manualSync = () => syncToGitHub(false);

// 执行云端恢复的函数 - 改为覆盖模式
const performCloudRestore = useCallback(async () => {
  try {
    const token = localStorage.getItem('github_token') || localStorage.getItem('PAGE_A_github_token');
    if (!token) {
      alert('请先设置 GitHub Token');
      setShowGitHubSyncModal(true);
      return;
    }
    
    let targetGistId = localStorage.getItem('github_gist_id') || localStorage.getItem('PAGE_A_github_gist_id');
    
    if (!targetGistId) {
      targetGistId = '978de7cead4b35c6c0784051f5cc7405';
    }
    
    console.log('📁 开始获取 Gist 数据:', targetGistId);
    
    const response = await fetch(`https://api.github.com/gists/${targetGistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`获取失败: ${response.status}`);
    }
    
    const gist = await response.json();
    
    if (!content) {
      throw new Error('未找到数据文件');
    }
    
    const backupData = JSON.parse(content);
    
    // ✅ 改为覆盖模式
    await handleRestoreData(backupData, 'overwrite');
    
  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败: ' + error.message);
  }
}, [handleRestoreData, setShowGitHubSyncModal]);

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
// 在 App 组件中添加调试函数
useEffect(() => {
  // 调试函数：查看所有备份
  window.checkBackups = () => {
    console.log('=== 备份检查 ===');
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => key.includes(AUTO_BACKUP_CONFIG.backupPrefix));
    
    if (backupKeys.length === 0) {
      console.log('❌ 没有找到任何备份文件');
      return;
    }
    
    console.log(`找到 ${backupKeys.length} 个备份文件:`);
    backupKeys.sort().reverse().forEach((key, index) => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`${index + 1}. ${key}`);
        console.log(`   备份时间: ${data?.backupTime ? new Date(data.backupTime).toLocaleString() : '未知'}`);
        console.log(`   任务天数: ${Object.keys(data?.tasks || {}).length}`);
    
        console.log(`   复盘天数: ${Object.keys(data?.dailyReflections || {}).length}`);
      } catch (e) {
        console.log(`   ${key}: ❌ 损坏的备份`);
      }
    });
  };
  
  // 手动触发备份
  window.forceBackup = () => {
    console.log('手动触发备份...');
    window.__manualBackup = true;
    autoBackup();
  };
}, [tasksByDate,  categories, monthTasks, dailyRatings, dailyReflections]);


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













useEffect(() => {
  console.log('🔥 检查是否显示云端选择弹窗');
  
  const timer = setTimeout(() => {
    showRestoreChoiceModal();
  }, 2000);
  
  return () => clearTimeout(timer);
}, []);

// 👇 在这里添加新的 useEffect
useEffect(() => {
  const validatedMonday = getMonday(new Date(selectedDate));
  if (validatedMonday.getTime() !== currentMonday.getTime()) {
    setCurrentMonday(validatedMonday);
  }
}, [selectedDate, currentMonday]);












// 在 handleColorChange 函数旁边添加：
const handleRenameCategory = (index, newName) => {
  if (newName.trim() && !localCategories.find((cat, i) => i !== index && cat.name === newName.trim())) {
    const newCategories = [...localCategories];
    newCategories[index].name = newName.trim();
    setLocalCategories(newCategories);
  }
};




// 跨日期任务模态框
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

  // ✅ 修复：正确的跨日期保存函数
  const handleSave = () => {
    // 获取选中的日期
    const targetDates = getDateOptions()
      .filter(option => selectedDays.includes(option.day))
      .map(option => option.value);
    
    if (targetDates.length === 0) {
      alert('请至少选择一天！');
      return;
    }
    
    // 调用父组件传入的 onSave 函数
    if (onSave) {
      onSave(task, targetDates);
    }
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
  if (!task) return;
  
  // 生成一个唯一的跨日期ID
  const crossDateId = task.crossDateId || `cross_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  
  console.log('📅 创建跨日期任务:', {
    任务: task.text,
    跨日期ID: crossDateId,
    目标日期: targetDates
  });
  
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    // 1. 先删除这个任务所有已存在的版本
    Object.keys(newTasksByDate).forEach(date => {
      if (task.crossDateId) {
        // 已有跨日期ID：删除所有相同ID的任务
        newTasksByDate[date] = newTasksByDate[date].filter(t => 
          t.crossDateId !== crossDateId
        );
      } else {
        // 新任务：只删除当前日期的这个任务
        if (date === selectedDate) {
          newTasksByDate[date] = newTasksByDate[date].filter(t => 
            t.id !== task.id
          );
        }
      }
      // 清理空数组
      if (newTasksByDate[date] && newTasksByDate[date].length === 0) {
        delete newTasksByDate[date];
      }
    });
    
    // 2. 在所有目标日期创建新任务（共享同一个 crossDateId）
    targetDates.forEach(date => {
      if (!newTasksByDate[date]) {
        newTasksByDate[date] = [];
      }
      
      // 检查是否已存在
      const exists = newTasksByDate[date].some(t => t.crossDateId === crossDateId);
      if (!exists) {
        const newTask = {
          ...task,
          id: `${crossDateId}_${date}`,
          crossDateId: crossDateId,
          isCrossDate: true,
          crossDates: [...targetDates],  // 保存所有关联日期
          done: false,
          actualCompletedDate: null,
          createdAt: new Date().toISOString()
        };
        
        // 删除原任务的 id 避免冲突
        delete newTask.originalId;
        
        newTasksByDate[date].push(newTask);
        console.log(`✅ 在 ${date} 创建跨日期任务:`, newTask.text);
      }
    });
    
    // 强制刷新视图
    return { ...newTasksByDate };
  });
  
  alert(`✅ 已设置跨日期任务！\n\n任务将在 ${targetDates.length} 个日期显示，任意一天完成，所有日期同步完成。`);
};



const updateTaskExpValue = useCallback((task, newExpValue) => {
  console.log('📝 更新经验值:', task.text, '→', newExpValue);
  
  const finalValue = Number(newExpValue);
  const oldExpValue = task.expValue || 2;
  const diff = finalValue - oldExpValue;
  
  // ✅ 只有任务已完成时，修改经验值才会影响积分
  const isTaskDone = task.done === true && task.abandoned !== true;
  
  if (diff !== 0 && isTaskDone) {
    // 获取任务对应的维度
    const category = task.category;
    const subCategory = task.subCategory || '';
    let dimKey = null;
    
    const catMap = {
      '健康': 'tipuo',
      '智慧': 'xiuye',
      '心神': 'xinshen',
      '家庭': 'shouhu',
      '财富': 'caiye',
      '悦己': 'yiqu'
    };
    dimKey = catMap[category];
    
    if (category === '校内' && subCategory) {
      const subMap = {
        '数学': 'xiuye',
        '语文': 'xiuye',
        '英语': 'xiuye',
        '运动': 'tipuo'
      };
      dimKey = subMap[subCategory] || dimKey;
    }
    
    if (!dimKey) {
      dimKey = 'xiuye';
    }
    
    setExpData(prev => {
      const newTotal = { ...prev.total };
      const newDaily = { ...prev.daily };
      const today = selectedDate || new Date().toISOString().split('T')[0];
      
      newTotal[dimKey] = (newTotal[dimKey] || 0) + diff;
      if (!newDaily[today]) newDaily[today] = {};
      newDaily[today][dimKey] = (newDaily[today][dimKey] || 0) + diff;
      
      const newData = {
        daily: newDaily,
        total: newTotal
      };
      localStorage.setItem('exp_data_v2', JSON.stringify(newData));
      console.log(`✅ ${dimKey}: ${oldExpValue} → ${finalValue} (${diff > 0 ? '+' : ''}${diff})`);
      return newData;
    });
  } else if (diff !== 0 && !isTaskDone) {
    console.log('⏭️ 任务未完成，修改经验值不影响积分');
  }
  
  // ========== 更新任务的 expValue（总是更新） ==========
  const updateTask = (t) => ({
    ...t,
    expValue: finalValue
  });
  
  if (task.isWeekTask) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? updateTask(t)
            : t
        );
      });
      return newTasksByDate;
    });
  } else if (task.crossDateId) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId ? updateTask(t) : t
        );
      });
      return newTasksByDate;
    });
  } else {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(t =>
        t.id === task.id ? updateTask(t) : t
      )
    }));
  }
}, [selectedDate]);



// 在 App 组件顶部添加（在 useState 附近）
const processingLocks = new Map();

const toggleDone = (task, currentDateFromTask = null) => {
  // ✅ 安全检查
  if (!task) {
    console.warn('⚠️ toggleDone: task is undefined');
    return;
  }
  
  // ✅ 如果任务已被放弃，不允许切换
  if (task.abandoned) {
    console.log('⏭️ 任务已放弃，不允许切换:', task.text);
    return;
  }
  
  // ✅ 使用 task.id 作为锁的 key
  const lockKey = task.id || task.text;
  if (processingLocks.get(lockKey)) {
    console.log('⏭️ 任务正在处理中，跳过:', task.text);
    return;
  }
  
  // ✅ 设置锁
  processingLocks.set(lockKey, true);
  
  const currentDate = currentDateFromTask || selectedDate || new Date().toISOString().split('T')[0];
  const newDoneState = !task.done;
  
  console.log('📊 toggleDone:', task.text, task.done, '→', newDoneState);
  
  // ========== 更新任务状态 ==========
  setTasksByDate(prev => {
    if (!prev) return {};
    
    const newTasksByDate = { ...prev };
    const dateToUpdate = currentDate;
    
    if (!newTasksByDate[dateToUpdate]) {
      newTasksByDate[dateToUpdate] = [];
    }
    
    // 查找并更新任务
    let taskFound = false;
    newTasksByDate[dateToUpdate] = newTasksByDate[dateToUpdate].map(t => {
      if (t.id === task.id) {
        taskFound = true;
        return {
          ...t,
          done: newDoneState,
          actualCompletedDate: newDoneState ? dateToUpdate : null,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    
    // 如果任务未找到，尝试在其他日期查找
    if (!taskFound) {
      Object.keys(newTasksByDate).forEach(date => {
        if (taskFound) return;
        newTasksByDate[date] = newTasksByDate[date].map(t => {
          if (t.id === task.id) {
            taskFound = true;
            return {
              ...t,
              done: newDoneState,
              actualCompletedDate: newDoneState ? dateToUpdate : null,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });
      });
    }
    
    if (!taskFound) {
      console.warn('⚠️ 任务未找到，添加到当前日期:', task.text);
      newTasksByDate[dateToUpdate].push({
        ...task,
        done: newDoneState,
        actualCompletedDate: newDoneState ? dateToUpdate : null,
        updatedAt: new Date().toISOString()
      });
    }
    
    return newTasksByDate;
  });
  
  // ========== 处理经验值 ==========
  // 在 toggleDone 中，处理经验值的部分
// 在 toggleDone 中处理经验值的部分
setTimeout(() => {
  try {
    if (newDoneState === true) {
      // ✅ 完成任务：直接加 rewards（可能是负数）
      const rewards = getTaskRewards(task);
      if (rewards && Object.keys(rewards).length > 0) {
        addExp(currentDate, rewards);
        console.log('🎯 完成任务加分:', rewards);
      }
    } else {
      // ✅ 取消完成：减去 rewards（如果是负数，减负数 = 加回来）
      const rewards = getTaskRewards(task);
      if (rewards && Object.keys(rewards).length > 0) {
        const negativeRewards = {};
        Object.entries(rewards).forEach(([dim, value]) => {
          // 取反：如果 rewards 是 -1，取反后变成 +1（加回来）
          negativeRewards[dim] = -Number(value);
        });
        addExp(currentDate, negativeRewards);
        console.log('🎯 取消完成扣分:', negativeRewards);
      }
    }
  } catch (error) {
    console.error('❌ 经验值处理失败:', error);
  } finally {
    processingLocks.delete(lockKey);
    console.log('✅ 锁已释放:', task.text);
  }
}, 150);
};

// ===== 更新任务经验值 =====
// ===== 多次任务 +1 =====
const handleIncrementCount = (task) => {
  if (!task || task.isCountTask !== true) return;
  
  // 防抖
  const now = Date.now();
  const lastClick = task._lastClickTime || 0;
  if (now - lastClick < 100) return;
  task._lastClickTime = now;
  
  const oldCount = task.count || 0;
  const newCount = oldCount + 1;
  
  // ✅ 创建计数记录
  const countRecord = {
    time: new Date().toISOString(),
    count: newCount,
    note: `第 ${newCount} 次完成`
  };
  
  // 更新任务计数 + 自动完成 + 记录历史
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    const dateToUpdate = selectedDate;
    if (!newTasksByDate[dateToUpdate]) newTasksByDate[dateToUpdate] = [];
    newTasksByDate[dateToUpdate] = newTasksByDate[dateToUpdate].map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          count: newCount,
          done: true,  // ✅ 自动完成
          actualCompletedDate: selectedDate,
          countRecords: [...(t.countRecords || []), countRecord],  // ✅ 记录历史
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    return newTasksByDate;
  });
  
  // 直接操作 localStorage 加分
  const expData = JSON.parse(localStorage.getItem('exp_data_v2') || '{"daily":{},"total":{}}');
  const today = selectedDate;
  
  if (!expData.daily[today]) expData.daily[today] = {};
  
  const expValue = task.expValue || 2;
  const dimMap = {
    '健康': 'tipuo',
    '智慧': 'xiuye',
    '心神': 'xinshen',
    '家庭': 'shouhu',
    '财富': 'caiye',
    '悦己': 'yiqu'
  };
  const dimKey = dimMap[task.category] || 'tipuo';
  
  expData.daily[today][dimKey] = (expData.daily[today][dimKey] || 0) + expValue;
  
  expData.total = {};
  Object.values(expData.daily).forEach(dayExp => {
    Object.entries(dayExp).forEach(([dim, value]) => {
      expData.total[dim] = (expData.total[dim] || 0) + value;
    });
  });
  
  localStorage.setItem('exp_data_v2', JSON.stringify(expData));
  setExpData(expData);
  
  console.log(`🎯 +${expValue} 分 (${dimKey})，当前 ${expData.daily[today][dimKey]} 分`);
  console.log('📊 +1:', task.text, oldCount, '→', newCount, '✅ 已自动完成');
};

// 检测撒花函数 - 接收当前日期的所有任务
// 修复撒花检测函数
const checkConfettiWithTasks = useCallback((currentTasks) => {
  console.log('🎯 开始检测撒花，任务列表:', currentTasks.map(t => ({ 
    text: t.text, 
    category: t.category,
    subCategory: t.subCategory,
    done: t.done,
    pinned: t.pinned 
  })));
  
// 1. 检测主分类完成（排除置顶任务和放弃的任务）
categories.forEach(cat => {
  // 获取该分类下所有非置顶、未放弃的任务
  const catTasks = currentTasks.filter(t => 
    t.category === cat.name && 
    t.pinned !== true &&
    t.abandoned !== true   // ✅ 排除放弃的任务
  );
  
  if (catTasks.length === 0) {
    return;
  }
  
  const completedCount = catTasks.filter(t => t.done === true).length;
  const isNowComplete = completedCount === catTasks.length;
  
  // ✅ 使用正确的 key 格式，包含日期
  const key = `complete_${cat.name}_${selectedDate}`;
  const savedValue = localStorage.getItem(key);
  const wasComplete = savedValue === 'true';
  
  console.log(`📊 ${cat.name}: 有效任务=${catTasks.length}, 已完成=${completedCount}, wasComplete=${wasComplete}, isNowComplete=${isNowComplete}`);
  
  // 只有从 false 变成 true 时才撒花
  if (wasComplete === false && isNowComplete === true) {
    console.log(`🎉🎉🎉 恭喜！${cat.name} 全部完成！撒花！🎉🎉🎉`);
    triggerConfetti(cat.name);
  }
  localStorage.setItem(key, isNowComplete);
});
  
  // 2. 检测校内子分类完成
  const schoolCategory = categories.find(c => c.name === '校内');
  if (schoolCategory) {
    schoolCategory.subCategories.forEach(subCat => {
      // 获取校内下该子分类的所有非置顶任务
      const subCatTasks = currentTasks.filter(t => 
        t.category === '校内' && 
        t.subCategory === subCat &&
        t.pinned !== true
      );
      
      if (subCatTasks.length === 0) {
        return;
      }
      
      const completedCount = subCatTasks.filter(t => t.done === true).length;
      const isNowComplete = completedCount === subCatTasks.length;
      
      // ✅ 修复：使用正确的 key 格式
      const key = `complete_校内_${subCat}_${selectedDate}`;
      const savedValue = localStorage.getItem(key);
      const wasComplete = savedValue === 'true';
      
      console.log(`📊 校内-${subCat}: 总任务=${subCatTasks.length}, 已完成=${completedCount}, wasComplete=${wasComplete}, isNowComplete=${isNowComplete}`);
      
      // 只有从 false 变成 true 时才撒花
      if (wasComplete === false && isNowComplete === true) {
        console.log(`🎉🎉🎉 恭喜！校内 - ${subCat} 全部完成！撒花！🎉🎉🎉`);
        triggerConfetti(`校内 - ${subCat}`);
      }
      localStorage.setItem(key, isNowComplete);
    });
  }
}, [categories, selectedDate]);
const triggerConfetti = (categoryName) => {
  console.log(`🎉 恭喜！${categoryName} 全部完成！`);
  
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  const parts = [];
  
  // 使用大拇指图片，但保持撒花的动画效果
  parts.push({
    id: Date.now(),
    imageUrl: 'https://raw.githubusercontent.com/Linnea0123/life-os/main/public/confetti.png',
    startX: centerX,
    startY: centerY,
    width: 50,
    height: 50,
    delay: 0
  });
  
  setConfettiParts(parts);
  
  setTimeout(() => {
    setConfettiParts([]);
  }, 2000);
};
// 添加撒花检测函数
// 添加撒花检测函数
// 添加撒花检测函数
// 添加撒花检测函数 - 移除 isUserTogglingRef 判断


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
      // 在 toggleDone 函数中，处理普通任务的部分

      // 修复 editSubTask 函数中的这部分
setTasksByDate(prev => ({
  ...prev,
  [selectedDate]: (prev[selectedDate] || []).map(t =>
    t.id === task.id 
      ? { 
          ...t, 
          // 删除这行，editSubTask 不应该修改 done 状态
          subTasks: t.subTasks ? t.subTasks.map(st => 
            st.index === subTaskIndex ? { ...st, text: newText.trim(), note: newNote } : st
          ) : t.subTasks
        } 
      : t
  )
}));
    }
  }
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













 

  
useEffect(() => {
  window.appInstance = {
    saveAllData: () => {
      saveMainData('tasks', tasksByDate);
    },
    getState: () => ({
      tasksByDate,        // 已经存在
      isInitialized,
      selectedDate,
      todayTasks: tasksByDate[selectedDate] || []
    }),
    triggerConfetti: triggerConfetti,
    setConfettiParts: setConfettiParts,
    // ✅ 添加这一行，直接暴露 tasksByDate
    getTasksByDate: () => tasksByDate
  };
  
  return () => {
    delete window.appInstance;
  };
}, [tasksByDate, isInitialized, selectedDate, triggerConfetti]);









  



 
useEffect(() => {
  const checkReminders = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      let hasChanges = false;

      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(task => {
          // 只有在有月和日、未完成、且未置顶时才检查提醒
          if (task.reminderTime && task.reminderTime.month && task.reminderTime.day && !task.pinned && !task.done) {
            const { year, month, day } = task.reminderTime;
            const checkYear = year || currentYear;
            
            if (checkYear === currentYear && 
                month === currentMonth && 
                day === currentDay) {
              console.log('🎯 触发提醒并置顶任务:', task.text, '原分类:', task.category);
              hasChanges = true;
              return {
                ...task,
                pinned: true
              };
            }
          }
          return task;
        });
      });

      if (hasChanges) {
        console.log('✅ 更新任务状态，置顶到期任务');
        return newTasksByDate;
      }
      return prev;
    });
  };

  const intervalId = setInterval(checkReminders, 60000);
  checkReminders();
  return () => clearInterval(intervalId);
}, [tasksByDate, selectedDate]); 
  // 进度更新函数
// 进度更新函数 - 同时更新对应模板的进度


// 进度更新函数 - 同时更新对应模板的进度
// 进度更新函数
// 进度更新函数 - 同时更新对应模板的进度
const handleUpdateProgress = (task, newCurrent) => {
  console.log('更新进度:', task.text, '新进度:', newCurrent);
  
  // 先更新任务本身的进度
  if (task.isWeekTask) {
    setTasksByDate(prev => {
      const updatedTasksByDate = { ...prev };
      let hasChanges = false;
      
      Object.keys(updatedTasksByDate).forEach(date => {
        updatedTasksByDate[date] = updatedTasksByDate[date].map(t => {
          if (t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart) {
            hasChanges = true;
            const target = t.progress?.target || 100;
            return {
              ...t,
              progress: {
                ...t.progress,
                current: Math.min(Math.max(0, newCurrent), target)
              }
            };
          }
          return t;
        });
      });
      
      if (hasChanges) {
        setTimeout(() => {
          saveMainData('tasks', updatedTasksByDate);
        }, 0);
      }
      return updatedTasksByDate;
    });
  } else {
    setTasksByDate(prev => {
      const target = task.progress?.target || 100;
      const newTasksByDate = {
        ...prev,
        [selectedDate]: (prev[selectedDate] || []).map(t =>
          t.id === task.id ? {
            ...t,
            progress: {
              ...t.progress,
              current: Math.min(Math.max(0, newCurrent), target)
            }
          } : t
        )
      };
      
      setTimeout(() => {
        saveMainData('tasks', newTasksByDate);
      }, 0);
      
      return newTasksByDate;
    });
  }
  
  // ========== 新增：同步更新关注任务模板的进度 ==========
  // 检查这个任务是否来自关注任务（通过 templateId 或文本匹配）
  
};
  
  

// 更新任务时间记录
const handleUpdateTaskTime = useCallback((task, newTimeSpent, date, timeRecord) => {
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    const tasks = newTasksByDate[date] || [];
    
    newTasksByDate[date] = tasks.map(t => {
      if (t.id === task.id) {
        const existingRecords = t.timeRecords || [];
        return { 
          ...t, 
          timeSpent: newTimeSpent,
          timeRecords: [...existingRecords, timeRecord]
        };
      }
      return t;
    });
    
    return newTasksByDate;
  });
}, []);
  


// 添加全局调试函数
useEffect(() => {
  

  // 强制修复提醒函数
  window.forceFixReminders = () => {
    console.log('🛠️ 强制修复提醒任务...');
    
    const now = new Date();
    const updatedTasksByDate = { ...tasksByDate };
    let fixedCount = 0;

    Object.keys(updatedTasksByDate).forEach(date => {
      updatedTasksByDate[date] = updatedTasksByDate[date].map(task => {
        if (task.reminderTime && !task.pinned) {
          const rt = task.reminderTime;
          
          // 检查是否应该置顶
          const shouldPin = (rt.year || now.getFullYear()) === now.getFullYear() &&
                           (rt.month || now.getMonth() + 1) === (now.getMonth() + 1) &&
                           (rt.day || now.getDate()) === now.getDate() &&
                           (now.getHours() > (rt.hour || 0) || 
                            (now.getHours() === (rt.hour || 0) && 
                             now.getMinutes() >= (rt.minute || 0)));

          if (shouldPin) {
            console.log('🎯 强制置顶任务:', task.text);
            fixedCount++;
            return { ...task, pinned: true };
          }
        }
        return task;
      });
    });

    if (fixedCount > 0) {
      console.log(`✅ 强制置顶了 ${fixedCount} 个任务`);
      setTasksByDate(updatedTasksByDate);
      // 保存到本地存储
      localStorage.setItem('tasks', JSON.stringify(updatedTasksByDate));
    } else {
      console.log('ℹ️ 没有需要置顶的任务');
    }
  };

  // 手动检查提醒函数
  window.checkReminders = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    
    const updatedTasksByDate = { ...tasksByDate };
    let hasChanges = false;

    Object.keys(updatedTasksByDate).forEach(date => {
      updatedTasksByDate[date] = updatedTasksByDate[date].map(task => {
        if (task.reminderTime && !task.pinned) {
          const rt = task.reminderTime;
          const year = rt.year || currentYear;
          const month = rt.month || currentMonth;
          const day = rt.day || currentDay;
          const hour = rt.hour || 0;
          const minute = rt.minute || 0;

          console.log('📋 检查任务:', task.text, {
            设置时间: `${year}-${month}-${day} ${hour}:${minute}`,
            是否匹配: year === currentYear && month === currentMonth && day === currentDay &&
                    (currentHour > hour || (currentHour === hour && currentMinute >= minute))
          });

          if (year === currentYear && 
              month === currentMonth && 
              day === currentDay &&
              (currentHour > hour || (currentHour === hour && currentMinute >= minute))) {
            console.log('🎯 触发提醒:', task.text);
            hasChanges = true;
            return { ...task, pinned: true };
          }
        }
        return task;
      });
    });

    if (hasChanges) {
      setTasksByDate(updatedTasksByDate);
      localStorage.setItem('tasks', JSON.stringify(updatedTasksByDate));
      console.log('✅ 已更新任务状态');
    }
  };

}, [tasksByDate]);





  // 在全局调试函数中添加提醒检查
useEffect(() => {
  window.debugReminders = () => {
    const now = new Date();
    console.log('=== 提醒任务调试 ===');
    console.log('当前时间:', now.toLocaleString());
    
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      tasks.forEach(task => {
        if (task.reminderTime) {
          const rt = task.reminderTime;
          const reminderDate = new Date(rt.year, rt.month - 1, rt.day, rt.hour || 0, rt.minute || 0);
          const isPast = reminderDate < now;
          const isToday = reminderDate.toDateString() === now.toDateString();
          
          console.log(`任务: "${task.text}"`, {
            提醒时间: `${rt.year}-${rt.month}-${rt.day} ${rt.hour || 0}:${rt.minute || 0}`,
            是否今天: isToday,
            是否已过时: isPast,
            是否置顶: task.pinned,
            提醒时间对象: rt
          });
        }
      });
    });
  };
}, [tasksByDate]);








// 修改 - 统一修改时间显示格式
const formatTimeNoSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

// 修改 - 添加新的时间格式化函数，显示分钟和秒数
const formatTimeWithSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

// 新增：分类标题专用时间格式（去掉0s）
const formatCategoryTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

// ✅ 添加这个缺失的函数 - 格式化时间为小时
const formatTimeInHours = (seconds) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = (totalMinutes / 60).toFixed(1);
  return `${hours}h`;
};

const getCategoryColor = (category, subCategory) => {
  const categoryColors = {
    '健康': '#9ADBC5',
    '智慧': '#FD8D6E',
    '心神': '#A1DEE0',
    '家庭': '#FA86A9',
    '财富': '#FCC351',
    '悦己': '#DFDE6C'
  };
  return categoryColors[category] || '#f0f0f0';
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

// ✅ 修复后 - 使用 useRef 防止循环
const isSavingRef = useRef(false);
const saveTimeoutRef = useRef(null);

useEffect(() => {
  // 清除之前的定时器
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  
  saveTimeoutRef.current = setTimeout(async () => {
    // 防止重复保存
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    
    try {
      await saveMainData('tasks', tasksByDate);
      console.log('任务数据自动保存:', Object.keys(tasksByDate).length, '天的数据');
    } catch (error) {
      console.error('任务数据保存失败:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, 2000); // 增加到 2 秒防抖
  
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [tasksByDate]); // 保留依赖，但通过防抖和标志位避免循环

// 修复其他数据的保存






useEffect(() => {
  const initializeApp = async () => {
    // 先迁移旧数据
    
    
    try {
 





// 加载任务数据
const savedTasks = await loadDataWithFallback('tasks', {});

  // 👇 在这里添加：加载每日复盘
    const savedReflections = localStorage.getItem(`${STORAGE_KEY}_dailyReflections`);
    if (savedReflections) {
      try {
        setDailyReflections(JSON.parse(savedReflections));
        console.log('✅ 加载复盘数据成功');
      } catch (e) {
        console.error('加载复盘失败:', e);
      }
    }

    // 👇 在这里添加：加载每日评分
    const savedRatings = localStorage.getItem(`${STORAGE_KEY}_dailyRatings`);
    if (savedRatings) {
      try {
        setDailyRatings(JSON.parse(savedRatings));
        console.log('✅ 加载评分数据成功');
      } catch (e) {
        console.error('加载评分失败:', e);
      }
    }

if (savedTasks) {
  setTasksByDate(savedTasks);


console.log('✅ 任务数据设置成功，天数:', Object.keys(savedTasks).length);

// ===== 确保每个日期都有独立的常规任务 =====
if (savedTasks && Object.keys(savedTasks).length > 0) {
  // 收集所有常规任务模板（从所有日期中获取，去重）
  const regularTemplates = [];
  const seenTexts = new Set();
  
  // 从已有数据中收集常规任务模板
  Object.values(savedTasks).forEach(tasks => {
    tasks.forEach(task => {
      if (task.isRegularTask && !seenTexts.has(task.text)) {
        seenTexts.add(task.text);
        regularTemplates.push({
          text: task.text,
          targetCategory: task.targetCategory,
          targetSubCategory: task.targetSubCategory || '',
          note: task.note || "",
          tags: task.tags || []
        });
      }
    });
  });
  
  // 如果有常规任务模板，确保每个日期都有这些任务（独立副本）
  if (regularTemplates.length > 0) {
    const allDates = Object.keys(savedTasks);
    let needsUpdate = false;
    
    allDates.forEach(date => {
      const dateTasks = savedTasks[date] || [];
      
      // 获取这个日期已有的常规任务文本
      const existingRegularTexts = new Set(
        dateTasks.filter(t => t.isRegularTask).map(t => t.text)
      );
      
      // 找出这个日期缺失的常规任务
      const missingTemplates = regularTemplates.filter(
        template => !existingRegularTexts.has(template.text)
      );
      
      if (missingTemplates.length > 0) {
        needsUpdate = true;
        const newRegularTasks = missingTemplates.map(template => ({
          id: `regular_${Date.now()}_${Math.random().toString(36).substr(2, 8)}_${date}`,
          text: template.text,
          targetCategory: template.targetCategory,
          targetSubCategory: template.targetSubCategory,
          category: "常规任务",
          done: false,
          timeSpent: 0,
          subTasks: [],
          note: template.note,
          reflection: "",
          image: null,
          scheduledTime: "",
          pinned: false,
          tags: template.tags || [],
          isRegularTask: true,
          progress: {
            initial: 0,
            current: 0,
            target: 0,
            unit: "%"
          }
        }));
        
        savedTasks[date] = [...dateTasks, ...newRegularTasks];
      }
    });
    
    if (needsUpdate) {
      console.log('✅ 已为所有日期添加缺失的常规任务（独立副本）');
      // 更新状态
      setTasksByDate(savedTasks);
    }
  }
}
}

else {
  console.log('ℹ️ 没有任务数据，使用空对象');
  setTasksByDate({});
}



const savedMonthTasks = await loadDataWithFallback('monthTasks', []);
if (savedMonthTasks) {
  setMonthTasks(savedMonthTasks);
  console.log('✅ 加载本月任务数据:', savedMonthTasks.length);
} else {
  console.log('ℹ️ 本月任务数据为空，使用空数组');
  setMonthTasks([]);
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
  
  // ✅ 检查是否有"生活"分类，如果没有则添加
  const hasLife = updatedCategories.some(c => c.name === '生活');
  if (!hasLife) {
    // 从 baseCategories 中找出"生活"分类
    const lifeCategory = baseCategories.find(c => c.name === '生活');
    if (lifeCategory) {
      updatedCategories.push({ ...lifeCategory });
      console.log('✅ 自动添加"生活"分类');
    }
  }
  
  setCategories(updatedCategories);
  await saveMainData('categories', updatedCategories);
  console.log('✅ 分类加载完成:', updatedCategories.map(c => c.name));
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
      localStorage.setItem('life-os-PAGE_A-v2_isInitialized', 'true');
      
      setIsInitialized(true);
      
// 👇 在这里添加
setTimeout(() => {
  isFirstLoad.current = false;
}, 500);




    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  initializeApp();
}, []);
// ===== 每天第一次打开页面自动备份一次 =====
// ✅ 修复后 - 使用 useRef 保证只执行一次
const hasBackedUpTodayRef = useRef(false);

useEffect(() => {
  if (!isInitialized) return;
  if (hasBackedUpTodayRef.current) return;
  
  const lastBackupDate = localStorage.getItem('last_auto_backup_date');
  const today = new Date().toISOString().split('T')[0];
  
  if (lastBackupDate !== today) {
    hasBackedUpTodayRef.current = true;
    
    const timer = setTimeout(() => {
      autoBackup();
      localStorage.setItem('last_auto_backup_date', today);
      hasBackedUpTodayRef.current = false;
    }, 5000);
    
    return () => clearTimeout(timer);
  }
}, [isInitialized]); // 只依赖 isInitialized
 


// 添加这个 useEffect 在下面
useEffect(() => {
  // 当当前选中日期变化时，更新批量导入的默认日期范围
  if (selectedDate) {
    setBulkDateRangeStart(selectedDate);
    setBulkDateRangeEnd(selectedDate);
  }
}, [selectedDate]);





// 自动保存任务数据
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    
    saveMainData('tasks', tasksByDate);
  }
}, [tasksByDate, isInitialized]);


 // ✅ 在这里添加：确保每天都有"生活"任务
// ✅ 确保每天都有"生活"任务（包括过去和未来的日期）


// 保存每日评分到 localStorage
useEffect(() => {
  if (isInitialized) {
    localStorage.setItem(`${STORAGE_KEY}_dailyRatings`, JSON.stringify(dailyRatings));
    console.log('💾 自动保存评分:', dailyRatings);
  }
}, [dailyRatings, isInitialized]);

// 👇 放在这后面
useEffect(() => {
  localStorage.setItem('daily_task_templates', JSON.stringify(dailyTaskTemplates));
}, [dailyTaskTemplates]);


// ✅ 每日任务按需生成（切换到日期时生成）

// 👇 在这里添加清理空日期的 useEffect
useEffect(() => {
  if (isInitialized) {
    setTasksByDate(prev => {
      const cleaned = {};
      let cleanedCount = 0;
      
      Object.entries(prev).forEach(([date, tasks]) => {
        if (tasks && tasks.length > 0) {
          cleaned[date] = tasks;
        } else {
          cleanedCount++;
          console.log(`🧹 清理空日期: ${date}`);
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`✅ 清理了 ${cleanedCount} 个空日期`);
      }
      return cleaned;
    });
  }
}, [isInitialized]); // 只在初始化时执行一次







// 自动保存本月任务数据
// ✅ 修复后
const isSavingMonthTasksRef = useRef(false);
const saveMonthTasksTimeoutRef = useRef(null);

useEffect(() => {
  if (!isInitialized) return;
  
  if (saveMonthTasksTimeoutRef.current) {
    clearTimeout(saveMonthTasksTimeoutRef.current);
  }
  
  saveMonthTasksTimeoutRef.current = setTimeout(async () => {
    if (isSavingMonthTasksRef.current) return;
    isSavingMonthTasksRef.current = true;
    
    try {
      await saveMainData('monthTasks', monthTasks);
    } catch (error) {
      console.error('本月任务保存失败:', error);
    } finally {
      isSavingMonthTasksRef.current = false;
    }
  }, 1000);
  
  return () => {
    if (saveMonthTasksTimeoutRef.current) {
      clearTimeout(saveMonthTasksTimeoutRef.current);
    }
  };
}, [monthTasks, isInitialized]);


// 切换日期时保存当前日期的数据
useEffect(() => {
  if (isInitialized) {
    saveDailyData(selectedDate);
  }
}, [selectedDate, isInitialized, saveDailyData]);





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

    
    
    // 如果有数据缺失，尝试修复
    if (!integrityReport.tasks.exists) {
      
      await saveMainData('tasks', {});
    }
    
    if (!integrityReport.customAchievements.exists) {
      
      await saveMainData('customAchievements', []);
    }
    
    if (!integrityReport.unlockedAchievements.exists) {
      
      await saveMainData('unlockedAchievements', []);
    }

  } catch (error) {
    
  }
};

// 在初始化时调用数据完整性检查
useEffect(() => {
  if (isInitialized) {
    checkDataIntegrity();
  }
}, [isInitialized]);

  



// 替换原来的 handleClickOutside 函数
useEffect(() => {
  const handleClickOutside = (event) => {
    // ⭐ 新增：检测是否是复制快捷键 (Ctrl+C 或 Cmd+C)
    if (event.ctrlKey && event.key === 'c') {
      return; // 不关闭输入框
    }
    
    // ⭐ 新增：检测是否正在进行文本选择（全选/拖拽选中）
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // 如果有选中的文本，不关闭输入框
      return;
    }
    
    // 检查是否点击了重复设置或计划时间的按钮
    const isRepeatButton = event.target.closest('button')?.textContent?.includes('重复');
    const isTimeButton = event.target.closest('button')?.textContent?.includes('计划时间');
    const isTemplateButton = event.target.closest('button')?.textContent?.includes('模板');
    
    // 检查是否点击了分类选择按钮
    const isCategorySelectButton = event.target.closest('button')?.textContent?.includes('分类');
    
    // 检查是否点击了模态框
    const isModalClick = event.target.closest('[style*="position: fixed"]') ||
      event.target.closest('[style*="z-index: 1000"]');

    // 如果点击了这些功能按钮或模态框，不关闭输入框
    if (isRepeatButton || isTimeButton || isTemplateButton || isModalClick || isCategorySelectButton) {
      return;
    }

    // 检查是否点击了批量导入区域内的任何元素
    const isBulkInputClick = bulkInputRef.current && bulkInputRef.current.contains(event.target);
    const isAddInputClick = addInputRef.current && addInputRef.current.contains(event.target);
    
    // 如果点击的是批量导入区域或添加任务区域，不关闭
    if (isBulkInputClick || isAddInputClick) {
      return;
    }

    // 关闭添加任务输入框
    if (addInputRef.current && !addInputRef.current.contains(event.target)) {
      const isModalClick = event.target.closest('[style*="position: fixed"]') ||
        event.target.closest('[style*="z-index: 1000"]');

      if (!isModalClick) {
        setShowAddInput(false);
      }
    }

    // 关闭批量导入输入框
    if (bulkInputRef.current && !bulkInputRef.current.contains(event.target)) {
      const isModalClick = event.target.closest('[style*="position: fixed"]') ||
        event.target.closest('[style*="z-index: 1000"]');

      if (!isModalClick) {
        setShowBulkInput(false);
      }
    }
  };

  // ⭐ 添加鼠标事件监听，检测拖拽选中
  let isDragging = false;
  
  const handleMouseDown = (event) => {
    // 检查是否在批量导入或添加任务区域内
    const isInBulkInput = bulkInputRef.current && bulkInputRef.current.contains(event.target);
    const isInAddInput = addInputRef.current && addInputRef.current.contains(event.target);
    
    if (isInBulkInput || isInAddInput) {
      isDragging = true;
    }
  };
  
  const handleMouseUp = () => {
    // 延迟重置，避免与 click 事件冲突
    setTimeout(() => {
      isDragging = false;
    }, 100);
  };
  
  // ⭐ 添加键盘事件监听
  const handleKeyDown = (event) => {
    // 如果按下 Ctrl+C 或 Cmd+C，不做任何处理（不关闭输入框）
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      return;
    }
  };

  document.addEventListener('click', handleClickOutside);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);


const getWeekTasks = () => {
  const monday = new Date(currentMonday);
  monday.setHours(0, 0, 0, 0);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    weekDates.push(dateStr);
  }
  
  // 当前周标识
  const currentWeekStart = monday.toISOString().split('T')[0];
  
 
  const allWeekTasks = [];
  const seenIds = new Set();  // ✅ 改用 id 去重，而不是 text
  
  Object.entries(tasksByDate).forEach(([date, tasks]) => {
    tasks.forEach(task => {
      if (task.isWeekTask === true) {
        // 检查是否应该包含
        let shouldInclude = false;
        
        // 如果 task.weekStart 存在
        if (task.weekStart) {
          const taskWeekStart = task.weekStart.split('T')[0];
          if (taskWeekStart === currentWeekStart) {
            shouldInclude = true;
          }
        }
        
        // 如果任务在当前周的日期中（兼容没有 weekStart 的情况）
        if (!shouldInclude && weekDates.includes(date)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          const key = task.id;  // ✅ 使用 id 去重
          if (!seenIds.has(key)) {
            seenIds.add(key);
            allWeekTasks.push(task);
          }
        }
      }
    });
  });
  
  return allWeekTasks;
};
 


  const weekTasks = getWeekTasks();
  const isWeekComplete = weekTasks.length > 0 && weekTasks.every(task => task.done);  
  const pinnedTasks = useMemo(() => {
  return todayTasks.filter(task => task.pinned === true);
}, [todayTasks]);
  const weekDates = getWeekDates(currentMonday);



// 计算今日统计数据（排除未完成的常规任务）
const calculateTodayStats = () => {
  // 排除本周任务和未完成的常规任务
  const learningTasks = todayTasks.filter(t => {
    if (t.category === "本周任务") return false; // 排除本周任务
    if (t.isRegularTask && !t.done) return false; // 排除未完成的常规任务
    return true; // 包含其他所有任务
  });
  
  const learningTime = learningTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  
  const sportTime = todayTasks
    .filter(t => t.category === "运动")
    .reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  
  const totalLearningTasks = learningTasks.length;
  const completedLearningTasks = learningTasks.filter(t => t.done).length;
  const completionRate = totalLearningTasks === 0 ? 0 :
    Math.round((completedLearningTasks / totalLearningTasks) * 100);

  return {
    learningTime,
    sportTime,
    totalLearningTasks,
    completedLearningTasks,
    completionRate
  };
};

// 在 App 组件中添加这个函数（在 calculateTodayStats 之后）
// 在 StatsPage 组件中，修改 generateStatsData 函数（在 App 组件中）

// 找到 App 组件中的 generateStatsData 函数，大约在 3500 行左右
// 修改为只显示有记录的日期

const generateStatsData = () => {
  // 获取本周的日期范围
  const weekDates = getWeekDates(currentMonday);
  const dailyStudyData = [];
  const dailyTasksData = [];
  
  // 按分类统计时间
  const categoryTime = {};
  const subCategoryTime = {};
  
  weekDates.forEach(day => {
    const dayTasks = tasksByDate[day.date] || [];
    

const learningTasks = dayTasks.filter(task => {
  if (task.category === "本周任务") return false;
  if (task.isRegularTask && !task.done) return false;
  return true;
});

// ✅ 调试日志
learningTasks.forEach(task => {
});

// ✅ 新的统计逻辑：有子任务的统计子任务，没子任务的统计母任务
let totalCount = 0;
let completedCount = 0;
let abandonedCount = 0;

learningTasks.forEach(task => {
  const hasSubTasks = task.subTasks && Array.isArray(task.subTasks) && task.subTasks.length > 0;
  
  if (hasSubTasks) {
    // 有子任务：统计子任务（母任务本身不计入）
    task.subTasks.forEach(subTask => {
      totalCount++;
      if (subTask.done) {
        completedCount++;
      }
    });
  } else {
    // 没有子任务：统计母任务本身
    totalCount++;
    if (task.done === true && task.abandoned !== true) {
      completedCount++;
    }
    if (task.abandoned) {
      abandonedCount++;
    }
  }
});


// 根据完成情况设置颜色
let numberColor = "#666";
let dotColor = "#666";

if (totalCount === 0) {
  numberColor = "transparent";
  dotColor = "transparent";
} else if (completedCount === totalCount) {
  numberColor = "#4caf50";  // 绿色 - 全部完成
  dotColor = "#4caf50";
} else if (completedCount > 0) {
  numberColor = "#ff9800";  // 橙色 - 部分完成
  dotColor = "#ff9800";
} else {
  numberColor = "#f44336";  // 红色 - 未完成
  dotColor = "#f44336";
}

    
    let dayTotalTime = 0;
    let dayCompletedTasks = 0;
    
    learningTasks.forEach(task => {
      const timeMinutes = Math.floor((task.timeSpent || 0) / 60);
      dayTotalTime += timeMinutes;
      
      // 分类统计
      if (!categoryTime[task.category]) {
        categoryTime[task.category] = 0;
      }
      categoryTime[task.category] += timeMinutes;
      
      // 校内子分类统计
      if (task.category === '校内' && task.subCategory) {
        if (!subCategoryTime[task.subCategory]) {
          subCategoryTime[task.subCategory] = 0;
        }
        subCategoryTime[task.subCategory] += timeMinutes;
      }
      
      if (task.done) dayCompletedTasks++;
    });
    
    // ⭐ 关键修改：只添加有学习时间或完成任务的日期
    if (dayTotalTime > 0 || dayCompletedTasks > 0) {
      dailyStudyData.push({
        name: `${new Date(day.date).getDate()}日`,
        time: dayTotalTime,
        date: day.date.slice(5)
      });
      
      dailyTasksData.push({
        name: `${new Date(day.date).getDate()}日`,
        tasks: dayCompletedTasks,
        date: day.date.slice(5)
      });
    }
  });
  
  // 转换分类数据为图表格式
  const categoryData = Object.entries(categoryTime).map(([name, time]) => ({
    name,
    time,
    color: categories.find(c => c.name === name)?.color || '#1a73e8'
  }));
  
  // 只显示有时间记录的校内子分类
  const subCategoryData = Object.entries(subCategoryTime)
    .filter(([_, time]) => time > 0)  // ⭐ 只显示有时间记录的
    .map(([name, time]) => ({
      name,
      time,
      color: '#1a73e8'
    }));
  
  // 计算平均完成率和平均每日时间（只计算有记录的日期）
  const validDaysCount = dailyStudyData.length;
  const avgCompletion = validDaysCount > 0 
    ? Math.round(dailyTasksData.reduce((sum, d) => sum + d.tasks, 0) / validDaysCount / 5 * 100)
    : 0;
  const avgDailyTime = validDaysCount > 0
    ? Math.round(dailyStudyData.reduce((sum, d) => sum + d.time, 0) / validDaysCount)
    : 0;
  
  return { dailyStudyData, categoryData, subCategoryData, dailyTasksData, avgCompletion, avgDailyTime };
};

const { dailyStudyData, categoryData, subCategoryData, dailyTasksData, avgCompletion, avgDailyTime } = generateStatsData();
  
  // 判断分类是否全部完成
  const isCategoryComplete = (catName) => {
    const catTasks = getCategoryTasks(catName);
    if (catTasks.length === 0) return false;
    return catTasks.every(task => task.done);
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




        





// 添加任务函数
const handleAddTask = () => {
  if (!newTaskText.trim()) {
    alert('请输入任务内容');
    return;
  }

  // 构建计划时间
  let scheduledTime = '';
  if (repeatConfig.startHour && repeatConfig.startMinute && 
      repeatConfig.endHour && repeatConfig.endMinute) {
    scheduledTime = `${repeatConfig.startHour.padStart(2, '0')}:${repeatConfig.startMinute.padStart(2, '0')}-${repeatConfig.endHour.padStart(2, '0')}:${repeatConfig.endMinute.padStart(2, '0')}`;
  }

  // 构建提醒时间
  let reminderTime = null;
  if (repeatConfig.reminderMonth && repeatConfig.reminderDay) {
    reminderTime = {
      year: repeatConfig.reminderYear ? parseInt(repeatConfig.reminderYear) : new Date().getFullYear(),
      month: parseInt(repeatConfig.reminderMonth),
      day: parseInt(repeatConfig.reminderDay),
      hour: parseInt(repeatConfig.reminderHour) || 0,
      minute: parseInt(repeatConfig.reminderMinute) || 0
    };
  }


  const newTask = {
    id: Date.now().toString(),
    text: newTaskText.trim(),
    category: newTaskCategory,
    subCategory: newTaskSubCategory || '',
    done: false,
    timeSpent: 0,
    timeRecords: [],
    subTasks: [],
    note: "",
    reflection: "",
    image: null,
    expValue: newTaskExpValue || 2,
    scheduledTime: scheduledTime,
    pinned: false,
    tags: [...selectedSkills, ...(bulkTags || [])],
    progress: {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    reminderTime: reminderTime,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
     isCountTask: isCountTask,
  count: 0,
  countRecords: [], 
    repeatFrequency: repeatConfig.frequency || '',
    repeatDays: repeatConfig.days || [false, false, false, false, false, false, false],
    isRepeating: !!(repeatConfig.frequency)
  };



  // 添加到当前日期
  setTasksByDate(prev => ({
    ...prev,
    [selectedDate]: [...(prev[selectedDate] || []), newTask]
  }));

  // 清空输入
  setNewTaskText('');
  setNewTaskSubCategory('');
   setSelectedSkills([]);
    setIsCountTask(false);  
  setRepeatConfig({
    frequency: "",
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
  setShowAddInput(false);
  
  console.log('✅ 任务添加成功:', newTask);
};

// 在 handleAddTask 函数后面添加这个函数
const startEditTask = (task) => {
  setEditingTask(task);
  setEditFormData({
    text: task.text,
    category: task.category,
    subCategory: task.subCategory || '',
    initial: task.initial || 0,
    target: task.target
  });
};



// 在 handleAddWeekTask 函数中（约第 4070 行）
// 添加本周任务 - 只添加1个
const handleAddWeekTask = (text, targetCategory = '健康') => {
  if (!text.trim()) return;

  const weekStart = currentMonday.toISOString();
  const taskId = Date.now().toString();

  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    const today = new Date().toISOString().split('T')[0];
    
    // 只添加到今天
    if (!newTasksByDate[today]) {
      newTasksByDate[today] = [];
    }

    // 检查是否已存在相同的本周任务
    const existingTask = newTasksByDate[today].find(
      task => task.isWeekTask && 
             task.text === text.trim() && 
             task.weekStart === weekStart
    );

    if (!existingTask) {
      const newTask = {
        id: `${taskId}_${today}`,
        text: text.trim(),
        category: "本周任务",
        done: false,
        timeSpent: 0,
        timeRecords: [],
        subTasks: [],
        note: "",
        reflection: "",
        image: null,
        scheduledTime: "",
        pinned: false,
        tags: [],
        progress: {
          initial: 0,
          current: 0,
          target: 0,
          unit: "%"
        },
        reminderTime: null,
        isWeekTask: true,
        weekStart: weekStart,
        targetCategory: targetCategory,
      };
      
      newTasksByDate[today].push(newTask);
      
      setTimeout(() => {
        const toast = document.createElement('div');
        toast.textContent = `✅ 已添加本周任务: ${text.trim()}`;
        toast.style.cssText = `
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #28a745;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 2000;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }, 50);
    } else {
      alert('该任务已存在！');
    }

    return newTasksByDate;
  });
};

// 添加常规任务
// 添加常规任务 - 修改为添加到所有日期


 // 拖拽开始
  const handleDragStart = (index) => {
    setDraggedTaskIndex(index);
  };
  
  // 拖拽经过
  const handleDragOver = (index) => {
    if (draggedTaskIndex === null || draggedTaskIndex === index) return;
    
    const newOrder = [...regularTasksOrder];
    const draggedItem = newOrder[draggedTaskIndex];
    newOrder.splice(draggedTaskIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setRegularTasksOrder(newOrder);
    setDraggedTaskIndex(index);
  };

 // 拖拽结束
  const handleDragEnd = () => {
    setDraggedTaskIndex(null);
  };


  // 解析批量文本并生成预览
// 解析批量文本并生成预览
// 解析批量文本并生成预览
const parseBulkTextToPreview = useCallback(() => {
  if (!bulkText.trim()) return [];
  
  const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  
  // 第一行是类别/子分类
  const firstLine = lines[0];
  let category = "校内";
  let subCategory = "";
  
  const schoolCategory = categories.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];
  
  const availableCategories = categories.filter(c => 
    c.name !== "常规任务" && c.name !== "本周任务"
  );
  
  let matchedCategory = availableCategories.find(c => 
    firstLine.includes(c.name) || c.name.includes(firstLine)
  );
  
  if (matchedCategory) {
    category = matchedCategory.name;
    subCategory = "";
    if (category === '校内') {
      for (const subCat of schoolSubCategories) {
        if (firstLine.includes(subCat)) {
          subCategory = subCat;
          break;
        }
      }
    }
  } else {
    for (const subCat of schoolSubCategories) {
      if (firstLine.includes(subCat)) {
        category = "校内";
        subCategory = subCat;
        break;
      }
    }
  }
  
  const getDefaultDateRange = () => {
    const todayDate = new Date();
    switch (bulkDateRange) {
      case 'today': {
        return {
          startMonth: todayDate.getMonth() + 1,
          startDay: todayDate.getDate(),
          endMonth: todayDate.getMonth() + 1,
          endDay: todayDate.getDate(),
          rangeText: `@${todayDate.getMonth() + 1}.${todayDate.getDate()}`
        };
      }
      case 'next3': {
        const endDate = new Date(todayDate);
        endDate.setDate(todayDate.getDate() + 2);
        return {
          startMonth: todayDate.getMonth() + 1,
          startDay: todayDate.getDate(),
          endMonth: endDate.getMonth() + 1,
          endDay: endDate.getDate(),
          rangeText: `@${todayDate.getMonth() + 1}.${todayDate.getDate()}-${endDate.getMonth() + 1}.${endDate.getDate()}`
        };
      }
      case 'next4': {
        const endDate = new Date(todayDate);
        endDate.setDate(todayDate.getDate() + 3);
        return {
          startMonth: todayDate.getMonth() + 1,
          startDay: todayDate.getDate(),
          endMonth: endDate.getMonth() + 1,
          endDay: endDate.getDate(),
          rangeText: `@${todayDate.getMonth() + 1}.${todayDate.getDate()}-${endDate.getMonth() + 1}.${endDate.getDate()}`
        };
      }
      case 'custom': {
        if (bulkDateRangeStart && bulkDateRangeEnd) {
          const start = new Date(bulkDateRangeStart);
          const end = new Date(bulkDateRangeEnd);
          return {
            startMonth: start.getMonth() + 1,
            startDay: start.getDate(),
            endMonth: end.getMonth() + 1,
            endDay: end.getDate(),
            rangeText: `@${start.getMonth() + 1}.${start.getDate()}-${end.getMonth() + 1}.${end.getDate()}`
          };
        }
        return null;
      }
      default:
        return null;
    }
  };
  
  const defaultRange = getDefaultDateRange();
  const tasks = [];
  
  // ✅ 修改：遍历所有行，先收集任务和图片标记
  // 第一行是分类，从第2行开始处理
  // 图片标记 [图片] 作用于它上面的任务（上一个任务）
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    
    // 跳过图片标记行，但要记录下一个任务应该有图片
    if (line === '[图片]' || line === '【图片】') {
      // 标记上一个任务有图片
      if (tasks.length > 0) {
        tasks[tasks.length - 1].hasImage = true;
        console.log(`📷 图片标记应用于任务: "${tasks[tasks.length - 1].text}"`);
      }
      continue;
    }
    
    // 解析任务行
    let dateRange = null;
    let taskLine = line;
    
    // 检查是否有内置日期范围
    const rangePattern = /@(\d{1,2})[./月](\d{1,2})[日]?\s*-\s*(\d{1,2})[./月](\d{1,2})[日]?/;
    const rangeMatch = line.match(rangePattern);
    
    if (rangeMatch) {
      dateRange = {
        startMonth: parseInt(rangeMatch[1]),
        startDay: parseInt(rangeMatch[2]),
        endMonth: parseInt(rangeMatch[3]),
        endDay: parseInt(rangeMatch[4]),
        rangeText: rangeMatch[0]
      };
      taskLine = line.replace(rangeMatch[0], '').trim();
    } else if (defaultRange) {
      dateRange = { ...defaultRange };
    }
    
    // 解析任务文本和备注
    let taskText = taskLine;
    let note = "";
    const parts = taskLine.split("|").map(s => s.trim());
    if (parts.length >= 2) {
      taskText = parts[0];
      note = parts[1];
    }
    
    // 清理
    taskText = taskText.replace(/@(?:所有)?家长[，,、.\s]*/g, '').trim();
    
    tasks.push({
      text: taskText,
      note: note,
      category: category,
      subCategory: subCategory,
      dateRange: dateRange,
      hasImage: false,  // 初始 false，如果后面有 [图片] 标记会被设为 true
      dateRangeText: dateRange?.rangeText || '',
      duration: null
    });
    
    console.log(`📝 解析任务: "${taskText}", 类别: ${category}, 子分类: ${subCategory || '无'}`);
  }
  
  return tasks;
}, [bulkText, bulkDateRange, bulkDateRangeStart, bulkDateRangeEnd, categories, bulkTags]);


// 修复批量导入中的图片识别功能 - 图片标记作用于上一个任务（标记行在上，任务在下）
// 修复批量导入中的图片识别功能 - 图片标记作用于上面的任务（标记行在下，任务在上）

// 修改函数定义，接收 currentSelectedDate 参数


const handleImportTasksWithDuration = (currentSelectedDate) => {
  console.log('🎯 === 开始批量导入 ===');
  
  // 获取基准日期
  let baseYear, baseMonth, baseDay;
  
  if (currentSelectedDate) {
    const parts = currentSelectedDate.split('-');
    baseYear = parseInt(parts[0]);
    baseMonth = parseInt(parts[1]) - 1;
    baseDay = parseInt(parts[2]);
  } else {
    const parts = selectedDate.split('-');
    baseYear = parseInt(parts[0]);
    baseMonth = parseInt(parts[1]) - 1;
    baseDay = parseInt(parts[2]);
  }
  
  console.log('基准日期年月日:', baseYear, baseMonth + 1, baseDay);
  
  if (!bulkText.trim()) {
    alert('请输入要导入的计划内容');
    return;
  }

  const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 2) {
    alert('请至少输入一行分类和一行计划内容');
    return;
  }

  // 定义解析日期范围的函数
  const parseDateRangeFromText = (text) => {
    const rangePattern = /@(\d{1,2})[./月](\d{1,2})[日]?\s*-\s*(\d{1,2})[./月](\d{1,2})[日]?/;
    const match = text.match(rangePattern);
    
    if (match) {
      const startMonth = parseInt(match[1]);
      const startDay = parseInt(match[2]);
      const endMonth = parseInt(match[3]);
      const endDay = parseInt(match[4]);
      const currentYear = new Date().getFullYear();
      
      const startDate = new Date(currentYear, startMonth - 1, startDay);
      const endDate = new Date(currentYear, endMonth - 1, endDay);
      
      const dates = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }
    
    return null;
  };

  // 定义6大分类
  const validCategories = ['健康', '智慧', '心神', '家庭', '财富', '悦己'];
  
  // 存储当前正在处理的分类
  let currentCategory = '健康';
  let subCategory = '';
  
  // 收集所有任务信息
  const allTasksByDate = {};
  const taskInfos = [];
  
  // 获取默认日期的函数
  const getDefaultDates = () => {
    const dates = [];
    
    const addDays = (days) => {
      const date = new Date(baseYear, baseMonth, baseDay + days);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    switch (bulkDateRange) {
      case 'today': {
        dates.push(addDays(0));
        break;
      }
      case 'next3': {
        for (let i = 0; i < 3; i++) {
          dates.push(addDays(i));
        }
        break;
      }
      case 'next4': {
        for (let i = 0; i < 4; i++) {
          dates.push(addDays(i));
        }
        break;
      }
      case 'custom': {
        if (bulkDateRangeStart && bulkDateRangeEnd) {
          const start = new Date(bulkDateRangeStart);
          const end = new Date(bulkDateRangeEnd);
          const current = new Date(start);
          while (current <= end) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            current.setDate(current.getDate() + 1);
          }
        } else {
          dates.push(addDays(0));
        }
        break;
      }
      default:
        dates.push(addDays(0));
    }
    return dates;
  };

  // ========== 遍历每一行，识别分类和任务 ==========
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查是否是分类行（匹配6大分类）
    let matchedCategory = null;
    for (const cat of validCategories) {
      if (line === cat || line.includes(cat)) {
        matchedCategory = cat;
        break;
      }
    }
    
    if (matchedCategory) {
      currentCategory = matchedCategory;
      console.log(`📂 切换到分类: ${currentCategory}`);
      continue;
    }
    
    // 如果是空行或只有分类名，跳过
    if (!line || line === '' || validCategories.includes(line)) {
      continue;
    }
    
    // 处理任务行
    let taskLine = line;
    let taskDates = parseDateRangeFromText(taskLine);
    let cleanTaskLine = taskLine;
    
    if (taskDates) {
      const rangePattern = /@\d{1,2}[./月]\d{1,2}[日]?\s*-\s*\d{1,2}[./月]\d{1,2}[日]?/g;
      cleanTaskLine = taskLine.replace(rangePattern, '').trim();
    } else {
      taskDates = getDefaultDates();
    }
    
    // 解析任务文本和备注
    let taskText = cleanTaskLine;
    let note = "";
    const parts = cleanTaskLine.split("|").map(s => s.trim());
    if (parts.length >= 2) {
      taskText = parts[0];
      note = parts[1];
    }
    
    // 清理任务文本
    taskText = taskText.replace(/@所有家长[，,、.\s]*/g, '');
    taskText = taskText.replace(/^[-*]\s*/, '');
    taskText = taskText.trim();
    
    if (!taskText) {
      continue;
    }
    
    // 提取标签（#标签）
    const tags = [];
    const tagRegex = /#([^\s#]+)/g;
    let match;
    while ((match = tagRegex.exec(taskText)) !== null) {
      tags.push(match[1]);
    }
    const cleanText = taskText.replace(/#[^\s#]+/g, '').trim();
    
    // 提取经验值（::后面的数字）
    let expValue = 2;
    const expRegex = /::\s*(\d+)/;
    const expMatch = taskText.match(expRegex);
    if (expMatch) {
      expValue = parseInt(expMatch[1]);
    }
    const finalText = cleanText.replace(/::\s*\d+/g, '').trim();
    
    console.log(`📝 任务: "${finalText}", 分类: ${currentCategory}, 标签: ${tags}, 分值: ${expValue}`);
    
    taskInfos.push({
      text: finalText || taskText,
      note: note,
      dates: taskDates,
      hasImage: false,
      category: currentCategory,
      tags: tags,
      expValue: expValue
    });
  }

  // ========== 创建任务 ==========
  taskInfos.forEach((taskInfo, idx) => {
    const { text: taskText, note, dates: taskDates, hasImage, category, tags, expValue } = taskInfo;
    
    taskDates.forEach(date => {
      if (!allTasksByDate[date]) {
        allTasksByDate[date] = [];
      }
      
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}_${date}_${idx}`;
      
      const newTask = {
        id: uniqueId,
        text: taskText,
        category: category,
        subCategory: '',
        done: false,
        timeSpent: 0,
        timeRecords: [],
        note: note,
        image: null,
        hasImage: hasImage,
        scheduledTime: "",
        pinned: false,
        reflection: "",
        tags: [...tags, ...(bulkTags || [])],
        expValue: expValue || 2,
        subTasks: [],
        progress: {
          initial: 0,
          current: 0,
          target: 0,
          unit: "%"
        },
        createdAt: new Date().toISOString()
      };
      
      allTasksByDate[date].push(newTask);
      console.log(`  ✅ 在 ${date} 创建任务: "${taskText}" (${category})`);
    });
  });
  
  const totalTasksCount = Object.values(allTasksByDate).reduce((sum, tasks) => sum + tasks.length, 0);
  
  if (totalTasksCount === 0) {
    alert('没有创建任何计划');
    return;
  }
  
  // ========== ✅ 关键修复：更新状态并立即保存到 localStorage ==========
  setTasksByDate(prev => {
    const updated = { ...prev };
    Object.entries(allTasksByDate).forEach(([date, newTasks]) => {
      if (!updated[date]) {
        updated[date] = [];
      }
      updated[date] = [...updated[date], ...newTasks];
    });
    
    // ✅ 立即保存到 localStorage（绕过防抖）
    const STORAGE_KEY = 'life-os-PAGE_A-v2';
    localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(updated));
    console.log(`✅ 批量导入：已保存 ${totalTasksCount} 个任务到 localStorage`);
    
    return updated;
  });
  
  // ✅ 清空输入
  setBulkText("");
  setBulkTags([]);
  setBulkDateRange("today");
  setBulkDateRangeStart(new Date().toISOString().split('T')[0]);
  setBulkDateRangeEnd(new Date().toISOString().split('T')[0]);
  setShowBulkImportModal(false);
  
  alert(`✅ 导入成功！\n\n📝 计划：${taskInfos.length} 个\n📅 实例：${totalTasksCount} 个`);
};
const handleImportTasks = () => {
  console.log('🎯 === 开始批量导入 ===');
  
  if (!bulkText.trim()) {
    alert('请输入要导入的任务内容');
    return;
  }

  const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 2) {
    alert('请至少输入一行分类和一行任务内容');
    return;
  }

  // 从第一行识别子分类
  const firstLine = lines[0];
  const category = "校内";
  let subCategory = "未分类";
  
  const schoolSubCategories = categories
    .find(c => c.name === '校内')
    ?.subCategories || ['语文', '数学', '英语', '运动'];
  
  for (const subCat of schoolSubCategories) {
    if (firstLine.includes(subCat)) {
      subCategory = subCat;
      break;
    }
  }

  // 处理任务的主循环
  const allProcessedTasks = [];
  let lastTaskHasImage = false;  // ✅ 新增：标记上一个任务是否有图片
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    
    
    // 处理任务行
    let taskText = line;
    let note = "";
    
    const parts = line.split("|").map(s => s.trim());
    if (parts.length >= 2) {
      taskText = parts[0];
      note = parts[1];
    }
    
    // 清理任务文本
    taskText = taskText.replace(/@所有家长[，,、.\s]*/g, '');
    taskText = taskText.replace(/@\d{1,2}[./月]\d{1,2}[日]?-\d{1,2}[./月]\d{1,2}[日]?/g, '');
    taskText = taskText.replace(/@周末/g, '');
    taskText = taskText.trim();
    
    if (!taskText) {
      taskText = `导入任务${i}`;
    }
    
    const taskId = `import_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ 创建任务时带上 hasImage 标记
    allProcessedTasks.push({
      id: taskId,
      text: taskText,
      category: category,
      subCategory: subCategory,
      done: false,
      timeSpent: 0,
      note: note,
      image: null,
      hasImage: lastTaskHasImage,  // ✅ 使用标记
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
      },
      dateRange: null,
      createdAt: new Date().toISOString()
    });
    
    console.log(`✅ 添加任务: "${taskText}", hasImage: ${lastTaskHasImage}`);
    lastTaskHasImage = false;  // ✅ 重置标记
  }

  // ... 后续添加任务的代码保持不变
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

  

// 编辑任务时间 - 只支持分钟
// 编辑任务时间


const editTaskTime = (task) => {
  // 打开自定义弹窗，而不是 prompt
  setShowTimeEditModal(task);
};

const handleTimeEditSave = (task, addedMinutes, note) => {
  const currentTotal = task.timeSpent || 0;
  const currentMinutes = Math.floor(currentTotal / 60);
  const newMinutes = currentMinutes + addedMinutes;
  const newSeconds = newMinutes * 60;
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  
  const timeRecord = {
    time: timeStr,
    change: addedMinutes,
    previousTotal: currentMinutes,
    newTotal: newMinutes,
    note: note || '',
    timestamp: new Date().toISOString()
  };
  
  const updateTask = (t) => {
    return { 
      ...t, 
      timeSpent: newSeconds,
      timeRecords: [...(t.timeRecords || []), timeRecord]
    };
  };
  
  // 更新任务时间
  if (task.isWeekTask) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? updateTask(t)
            : t
        );
      });
      return newTasksByDate;
    });
  } else if (task.crossDateId) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId ? updateTask(t) : t
        );
      });
      return newTasksByDate;
    });
  } else {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(t =>
        t.id === task.id ? updateTask(t) : t
      )
    }));
  }
  
  // ✅ 新增：自动完成该任务（如果尚未完成）
  if (task.done !== true) {
    // 延迟一点点确保时间先更新，再更新完成状态
    setTimeout(() => {
      toggleDone(task);
    }, 50);
  }
  
  setShowTimeEditModal(null);
};


// 保存计划时间
const handleSavePlannedTime = (task, plannedMinutes) => {
  const updateTask = (t) => {
    if (plannedMinutes === null || plannedMinutes === 0) {
      // 清空计划时间
      const { plannedTime, ...rest } = t;
      return rest;
    }
    return { ...t, plannedTime: plannedMinutes };
  };

  if (task.isWeekTask) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? updateTask(t)
            : t
        );
      });
      return newTasksByDate;
    });
  } else if (task.crossDateId) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId ? updateTask(t) : t
        );
      });
      return newTasksByDate;
    });
  } else {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(t =>
        t.id === task.id ? updateTask(t) : t
      )
    }));
  }
};

// 编辑时间记录
// 编辑时间记录 - 支持两种调用方式
const handleEditTimeRecord = (task, recordOrIndex, newMinutesOrNote, optionalNote) => {
  // 判断调用方式：如果第二个参数是数字，则是索引方式（来自 TimeEditModal）
  // 如果第二个参数是对象，则是 record 对象方式（来自 TimeRecordModal）
  let recordIndex, newMinutes, newNote;
  
  if (typeof recordOrIndex === 'number') {
    // TimeEditModal 调用方式: (task, index, newMinutes, note)
    recordIndex = recordOrIndex;
    newMinutes = newMinutesOrNote;
    newNote = optionalNote;
  } else {
    // TimeRecordModal 调用方式: (task, record, index) 需要找索引
    const record = recordOrIndex;
    newMinutes = newMinutesOrNote; // 这里实际是用户输入的新分钟数
    newNote = optionalNote;
    
    // 查找索引
    const records = task.timeRecords || [];
    recordIndex = records.findIndex(r => r.time === record.time && r.change === record.change);
    if (recordIndex === -1) recordIndex = 0;
  }
  
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    const updateTaskRecords = (t) => {
      const records = [...(t.timeRecords || [])];
      if (records[recordIndex]) {
        const oldRecord = records[recordIndex];
        const oldChange = oldRecord.change;
        const timeDiff = newMinutes - oldChange;
        
        records[recordIndex] = {
          ...oldRecord,
          change: newMinutes,
          note: newNote !== undefined ? newNote : oldRecord.note,
          editedAt: new Date().toISOString()
        };
        
        const newTotalSeconds = (t.timeSpent || 0) + (timeDiff * 60);
        return { ...t, timeSpent: Math.max(0, newTotalSeconds), timeRecords: records };
      }
      return t;
    };
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? updateTaskRecords(t)
            : t
        );
      });
    } else if (task.crossDateId) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId ? updateTaskRecords(t) : t
        );
      });
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? updateTaskRecords(t) : t
      );
    }
    
    return newTasksByDate;
  });
};

const handleDeleteTimeRecord = (task, recordIndex) => {
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    const deleteRecord = (t) => {
      const records = [...(t.timeRecords || [])];
      if (records[recordIndex]) {
        const removedChange = records[recordIndex].change;
        records.splice(recordIndex, 1);
        const newTotalSeconds = Math.max(0, (t.timeSpent || 0) - (removedChange * 60));
        return { ...t, timeSpent: newTotalSeconds, timeRecords: records };
      }
      return t;
    };
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? deleteRecord(t)
            : t
        );
      });
    } else if (task.crossDateId) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId ? deleteRecord(t) : t
        );
      });
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? deleteRecord(t) : t
      );
    }
    
    return newTasksByDate;
  });
};
  // 修复置顶功能
  // 置顶/取消置顶任务
const togglePinned = (task) => {
  if (task.isWeekTask) {
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && 
          t.text === task.text && 
          t.weekStart === task.weekStart // 只更新同一周的任务
            ? { ...t, pinned: !t.pinned } 
            : t
        );
      });
      return newTasksByDate;
    });
  } else {
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? { ...t, pinned: !t.pinned } : t
      )
    }));
  }
};

const deleteTask = (task, deleteOption = 'today') => {
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    // ✅ 如果是本周任务
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].filter(t => 
          !(t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart)
        );
        if (newTasksByDate[date].length === 0) {
          delete newTasksByDate[date];
        }
      });
      return newTasksByDate;
    }
    
    // ✅ 如果是每日任务（isDailyTask）
    if (task.isDailyTask && task.templateId) {
      if (deleteOption === 'today') {
        // 仅删除今天
        if (newTasksByDate[selectedDate]) {
          newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(t => 
            !(t.isDailyTask && t.templateId === task.templateId && t.id === task.id)
          );
          if (newTasksByDate[selectedDate].length === 0) {
            delete newTasksByDate[selectedDate];
          }
        }
      } else if (deleteOption === 'future') {
        // 删除今日及以后
        const today = new Date(selectedDate);
        today.setHours(0, 0, 0, 0);
        Object.keys(newTasksByDate).forEach(date => {
          const currentDate = new Date(date);
          currentDate.setHours(0, 0, 0, 0);
          if (currentDate >= today) {
            newTasksByDate[date] = newTasksByDate[date].filter(t => 
              !(t.isDailyTask && t.templateId === task.templateId)
            );
            if (newTasksByDate[date].length === 0) {
              delete newTasksByDate[date];
            }
          }
        });
      } else if (deleteOption === 'all') {
        // ✅ 删除所有日期（过去、现在、未来）
        Object.keys(newTasksByDate).forEach(date => {
          newTasksByDate[date] = newTasksByDate[date].filter(t => 
            !(t.isDailyTask && t.templateId === task.templateId)
          );
          if (newTasksByDate[date].length === 0) {
            delete newTasksByDate[date];
          }
        });
        // ✅ 同时从模板中删除（可选）
        setDailyTaskTemplates(prev => prev.filter(t => t.id !== task.templateId));
      }
      return newTasksByDate;
    }
    
    // ✅ 如果是跨日期任务
    if (task.crossDateId) {
      if (deleteOption === 'today') {
        if (newTasksByDate[selectedDate]) {
          newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(t => 
            t.id !== task.id
          );
          if (newTasksByDate[selectedDate].length === 0) {
            delete newTasksByDate[selectedDate];
          }
        }
      } else if (deleteOption === 'future') {
        const today = new Date(selectedDate);
        today.setHours(0, 0, 0, 0);
        Object.keys(newTasksByDate).forEach(date => {
          const currentDate = new Date(date);
          currentDate.setHours(0, 0, 0, 0);
          if (currentDate >= today) {
            newTasksByDate[date] = newTasksByDate[date].filter(t => 
              t.crossDateId !== task.crossDateId
            );
            if (newTasksByDate[date].length === 0) {
              delete newTasksByDate[date];
            }
          }
        });
      } else if (deleteOption === 'all') {
        Object.keys(newTasksByDate).forEach(date => {
          newTasksByDate[date] = newTasksByDate[date].filter(t => 
            t.crossDateId !== task.crossDateId
          );
          if (newTasksByDate[date].length === 0) {
            delete newTasksByDate[date];
          }
        });
      }
      return newTasksByDate;
    }
    
    // ✅ 普通任务
    if (deleteOption === 'today') {
      if (newTasksByDate[selectedDate]) {
        newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(t => t.id !== task.id);
        if (newTasksByDate[selectedDate].length === 0) {
          delete newTasksByDate[selectedDate];
        }
      }
    } else if (deleteOption === 'future') {
      const today = new Date(selectedDate);
      today.setHours(0, 0, 0, 0);
      Object.keys(newTasksByDate).forEach(date => {
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);
        if (currentDate >= today) {
          newTasksByDate[date] = newTasksByDate[date].filter(t => t.id !== task.id);
          if (newTasksByDate[date].length === 0) {
            delete newTasksByDate[date];
          }
        }
      });
    } else if (deleteOption === 'all') {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].filter(t => t.id !== task.id);
        if (newTasksByDate[date].length === 0) {
          delete newTasksByDate[date];
        }
      });
    }
    
    return newTasksByDate;
  });
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
  console.log('saveTaskEdit 被调用:', editData);
  
  // 构建提醒时间对象 - 只有在有月和日时才保存
  let reminderTime = null;
  if (editData.reminderMonth && editData.reminderDay) {
    reminderTime = {};
    if (editData.reminderYear) reminderTime.year = parseInt(editData.reminderYear);
    reminderTime.month = parseInt(editData.reminderMonth);
    reminderTime.day = parseInt(editData.reminderDay);
    if (editData.reminderHour !== '') reminderTime.hour = parseInt(editData.reminderHour) || 0;
    if (editData.reminderMinute !== '') reminderTime.minute = parseInt(editData.reminderMinute) || 0;
  }

  // 更新任务
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    // ✅ 如果是本周任务
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart ? {
            ...t,
            text: editData.text,
            note: editData.note || "",
            reflection: editData.reflection || "",
            category: editData.category,
            subCategory: editData.subCategory || '',
            scheduledTime: editData.scheduledTime || "",
            tags: editData.tags || [],
           
            subTasks: editData.subTasks || [],
            progress: editData.progress || t.progress,
            reminderTime: reminderTime,
            isCountTask: editData.isCountTask || false,
          count: editData.count || 0,
              // 保留模板ID
            expValue: editData.expValue || 2,
          } : t
        );
      });
      return newTasksByDate;
    }
    
    // ✅ 如果是跨日期任务 - 同步更新所有关联日期
    if (task.crossDateId) {
      console.log('🔄 跨日期任务编辑，同步更新所有关联日期:', task.crossDateId);
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t => {
          if (t.crossDateId === task.crossDateId) {
            // 保持原有的重要属性不变
            return {
              ...t,
              text: editData.text,
              note: editData.note || "",
              reflection: editData.reflection || "",
              category: editData.category,
              subCategory: editData.subCategory || '',
              scheduledTime: editData.scheduledTime || "",
              tags: editData.tags || [],
              subTasks: editData.subTasks || [],
              progress: editData.progress || t.progress,
               isCountTask: editData.isCountTask || false,
    count: editData.count || 0,
              reminderTime: reminderTime,
              // 保留跨日期相关属性
              crossDates: t.crossDates,  // 保持原有的日期列表
              dateRange: t.dateRange,
              // 保留原有的完成状态（不要覆盖）
              done: t.done,
              actualCompletedDate: t.actualCompletedDate
            };
          }
          return t;
        });
      });
      return newTasksByDate;
    }
    
    // ✅ 普通任务
    newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
      t.id === task.id ? {
        ...t,
        text: editData.text,
        note: editData.note || "",
        reflection: editData.reflection || "",
        category: editData.category,
        isCountTask: editData.isCountTask || false,
    count: editData.count || 0,
        subCategory: editData.subCategory || '',
        scheduledTime: editData.scheduledTime || "",
        tags: editData.tags || [],
        subTasks: editData.subTasks || [],
        reminderTime: reminderTime,
        progress: editData.progress || t.progress
        
      } : t
    );
    
    return newTasksByDate;
  });
  
  console.log('✅ 任务已保存');
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
    if (task.isWeekTask) {
      // 本周任务需要更新所有日期
      setTasksByDate(prev => {
        const newTasksByDate = { ...prev };
        Object.keys(newTasksByDate).forEach(date => {
          newTasksByDate[date] = newTasksByDate[date].map(t =>
            t.isWeekTask && t.text === task.text ? { ...t, image: event.target.result } : t
          );
        });
        return newTasksByDate;
      });
    } else if (task.isCrossDate && task.crossDateId) {
      // 跨日期任务需要更新所有关联日期
      setTasksByDate(prev => {
        const newTasksByDate = { ...prev };
        Object.keys(newTasksByDate).forEach(date => {
          newTasksByDate[date] = newTasksByDate[date].map(t =>
            t.crossDateId === task.crossDateId ? { ...t, image: event.target.result } : t
          );
        });
        return newTasksByDate;
      });
    } else {
      // 普通任务只更新当前日期
      setTasksByDate(prev => {
        const updatedTasks = {
          ...prev,
          [selectedDate]: prev[selectedDate].map(t =>
            t.id === task.id ? { ...t, image: event.target.result } : t
          )
        };
        
        // 立即保存到localStorage
        setTimeout(() => {
          saveMainData('tasks', updatedTasks);
        }, 0);
        
        return updatedTasks;
      });
    }
  };
  reader.readAsDataURL(file);
};

// 修改分类总时间 - 只支持分钟
// 修改分类总时间 - 支持分钟
const editCategoryTime = (catName) => {
  const currentTime = totalTime(catName);
  const currentMinutes = Math.floor(currentTime / 60);
  
  const newTimeStr = window.prompt(
    `修改 ${catName} 的总时间（单位：分钟，输入0可删除所有时间）`,
    currentMinutes.toString()
  );

  if (newTimeStr !== null) {
    const minutes = parseInt(newTimeStr) || 0;
    const newSeconds = minutes * 60;
    
    if (newSeconds >= 0) {
      const timeDifference = newSeconds - currentTime;

      if (timeDifference !== 0) {
        setTasksByDate(prev => {
          const newTasksByDate = { ...prev };
          const todayTasks = newTasksByDate[selectedDate] || [];

          const catTasks = todayTasks.filter(t => t.category === catName);
          if (catTasks.length > 0) {
            // 平均分配到该分类的所有任务
            const timePerTask = Math.floor(timeDifference / catTasks.length);
            
            newTasksByDate[selectedDate] = todayTasks.map(t =>
              t.category === catName 
                ? { ...t, timeSpent: Math.max(0, (t.timeSpent || 0) + timePerTask) }
                : t
            );
          } else {
            // 如果没有任务，创建一个时间记录任务
            if (!newTasksByDate[selectedDate]) {
              newTasksByDate[selectedDate] = [];
            }
            newTasksByDate[selectedDate].push({
              id: `time_${catName}_${Date.now()}`,
              text: `${catName}时间记录`,
              category: catName,
              done: true,
              timeSpent: newSeconds,
              note: "时间记录",
              image: null,
              scheduledTime: "",
              pinned: false,
              subTasks: [],
              tags: [],
              progress: {
                initial: 0,
                current: 0,
                target: 0,
                unit: "%"
              }
            });
          }

          return newTasksByDate;
        });
      }
    }
  }
};



const getTasksBySubCategory = (catName) => {
  const catTasks = todayTasks.filter(t => 
    t.category === catName && 
    (t.pinned === false || t.pinned === undefined || t.pinned === null)
  );
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

// ========== 大拇指动画函数 ==========
// ========== 撒花动画函数 - 大号 🎉 从中心绽放 ==========

// ============================================

  const displayCategories = baseCategories;

const getCategoryTasks = useCallback((catName) => {
  const dateTasks = tasksByDate[selectedDate] || [];
  
  // 如果是"全部"，先获取所有任务
  let result = dateTasks.filter(t => 
    t.category !== "本周任务" && 
    !t.isRegularTask
  );
  
  // 如果不是"全部"，再按分类筛选
  if (catName !== '全部') {
    result = result.filter(t => t.category === catName);
  }
  
  // 👇 如果开启了"只显示已完成"
  if (showOnlyCompleted && selectedCategoryTab === catName) {
    result = result.filter(t => t.done === true && t.abandoned !== true);
  }
  
  return result;
}, [tasksByDate, selectedDate, showOnlyCompleted, selectedCategoryTab]);
  // 计算分类总时间
  const totalTime = (catName) =>
    getCategoryTasks(catName).reduce((sum, t) => sum + (t.timeSpent || 0), 0);


const prevWeek = () => {
  const monday = new Date(currentMonday);
  monday.setDate(monday.getDate() - 7);
  
  setCurrentMonday(monday);
  
  // 使用北京时间获取日期字符串
  const beijingTime = new Date(monday.getTime() + (8 * 60 * 60 * 1000));
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const newSelectedDate = `${year}-${month}-${day}`;
  
  setSelectedDate(newSelectedDate);
};

const nextWeek = () => {
  try {
    const newMonday = new Date(currentMonday);
    newMonday.setDate(newMonday.getDate() + 7);
    
    setCurrentMonday(newMonday);
    
    // 使用北京时间获取日期字符串
    const beijingTime = new Date(newMonday.getTime() + (8 * 60 * 60 * 1000));
    const year = beijingTime.getUTCFullYear();
    const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getUTCDate()).padStart(2, '0');
    const newSelectedDate = `${year}-${month}-${day}`;
    
    setSelectedDate(newSelectedDate);
  } catch (error) {
    console.error('切换下一周时出错:', error);
  }
};

const handleDateSelect = (selectedDate) => {
  // 使用北京时间
  const beijingDate = new Date(selectedDate.getTime() + (8 * 60 * 60 * 1000));
  const year = beijingDate.getUTCFullYear();
  const month = beijingDate.getUTCMonth();
  const day = beijingDate.getUTCDate();
  
  const localSelectedDate = new Date(year, month, day);
  const selectedMonday = getMonday(localSelectedDate);
  
  const newSelectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  setCurrentMonday(selectedMonday);
  setSelectedDate(newSelectedDate);
  setShowDatePickerModal(false);
};


// 清空所有数据
const clearAllData = async () => {
  if (window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
    // 清空任务数据
    setTasksByDate({});
    setExpData({ daily: {}, total: {} });
    localStorage.removeItem('exp_data_v2');
    console.log('🗑️ 积分数据已清空');
    
    // 清空本月任务
    setMonthTasks([]);
     setTodayExpense(0);
    setExpenseRecords([]);
   setMonthlyBudget(3000);
localStorage.removeItem('monthly_budget');
    localStorage.removeItem('expense_date');
    localStorage.removeItem('expense_records');
    localStorage.removeItem('daily_budget');
    console.log('🗑️ 消费数据已清空');

      // ✅ 15. 清空处理锁（新增）
    if (processingLocks) {
      processingLocks.clear();
      console.log('🗑️ 处理锁已清空');
    }
    
    // 清空每日复盘和评分
    setDailyRatings({});
    setDailyReflections({});
    
    // 清空学习结束时间
    setStudyEndTimes({});
    
    // 清空每日提醒
    setReminderText('');
localStorage.setItem(`${STORAGE_KEY}_daily_reminder`, '');
    
    // 清空所有存储
    await saveMainData('tasks', {});
    await saveMainData('templates', []);
    await saveMainData('monthTasks', []);
    
    // 清空所有每日数据
    const allKeys = Object.keys(localStorage);
    const dailyKeys = allKeys.filter(key => key.includes(`${STORAGE_KEY}_daily_`));
    dailyKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // 清空初始化状态
    localStorage.removeItem('life-os-PAGE_A-v2_isInitialized');
    
    // 重新初始化每日数据（清空今天的）
    const today = new Date().toISOString().split("T")[0];
    await saveMainData(`daily_${today}`, {
      rating: 0,
      reflection: '',
      date: today
    });
    
    alert('所有数据已清空！页面将重新加载。');
    window.location.reload();
  }
};



// 生成每日日志
const generateDailyLog = () => {
  setShowDailyLogModal(true);
};





const handleExportData = async () => {
  try {
    // 获取所有数据
    const tasks = JSON.parse(localStorage.getItem('life-os-PAGE_A-v2_tasks') || '{}');
    const dailyRatings = JSON.parse(localStorage.getItem('life-os-PAGE_A-v2_dailyRatings') || '{}');
    const monthTasks = JSON.parse(localStorage.getItem('life-os-PAGE_A-v2_monthTasks') || '[]');
    
    // 创建一个包含所有数据的对象
    const exportData = {
      tasks: tasks,
      dailyRatings: dailyRatings,
      monthTasks: monthTasks,
      exportTime: new Date().toISOString(),
      version: '2.0'
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `life-os-backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✅ 数据导出成功！');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};


// 辅助函数：清理问题数据
function cleanProblematicData(data) {
  try {
    // 深拷贝并清理
    const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
      // 跳过可能导致问题的字段
      if (key === 'parent' || key === 'children' || key === '$$typeof') {
        return undefined;
      }
      // 检查循环引用
      if (typeof value === 'object' && value !== null) {
        return value;
      }
      return value;
    }));
    return cleaned;
  } catch (e) {
    console.warn('清理数据时出错，使用原始数据');
    return data;
  }
}
  








  // 计算今日统计数据


const todayStats = calculateTodayStats();


      
    
    

   


  

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
    onClose={() => setShowStats(false)}
    dailyStudyData={dailyStudyData}
    categoryData={categoryData}
    selectedDate={selectedDate}        // 新增
    tasksByDate={tasksByDate}          // 新增
    categories={categories}  
    subCategoryData={subCategoryData}
    dailyTasksData={dailyTasksData}
    avgCompletion={avgCompletion}
    avgDailyTime={avgDailyTime}
    dailyRatings={dailyRatings} 
    studyEndTimes={studyEndTimes}
    dailyReflections={dailyReflections}
    onDeleteReflection={(date) => {
      // 删除单条复盘记录
      setDailyReflections(prev => {
        const newReflections = { ...prev };
        delete newReflections[date];
        // 同时删除评分
        setDailyRatings(ratingsPrev => {
          const newRatings = { ...ratingsPrev };
          delete newRatings[date];
          // 保存到 localStorage
          localStorage.removeItem(`${STORAGE_KEY}_daily_${date}`);
          return newRatings;
        });
        return newReflections;
      });
    }}
    onClearReflections={(dates) => {
      // 批量删除复盘记录
      setDailyReflections(prev => {
        const newReflections = { ...prev };
        setDailyRatings(ratingsPrev => {
          const newRatings = { ...ratingsPrev };
          dates.forEach(date => {
            delete newReflections[date];
            delete newRatings[date];
            localStorage.removeItem(`${STORAGE_KEY}_daily_${date}`);
          });
          return newRatings;
        });
        return newReflections;
      });
    }}
  />
  );
}






// 如果任务数据为空，显示警告
if (isInitialized && Object.keys(tasksByDate).length === 0) {
  console.warn('⚠️ 警告: 已初始化但任务数据为空');
}





// 在 App 组件中，return 之前添加
<style>{`
  @keyframes rightToLeft {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`}</style>

// 1. 先定义 getDimName
const getDimName = (key) => {
  const names = {
    tipuo: '健康',
    xiuye: '智慧',
    xinshen: '心神',
    shouhu: '家庭',
    caiye: '财富',
    yiqu: '悦己'
  };
  return names[key] || key;
};

// 2. 然后定义 getTasksForDimension（它使用了 getDimName）
const getTasksForDimension = (dimKey) => {
  const dimName = getDimName(dimKey);
  const todayTasks = tasksByDate[selectedDate] || [];

  // ✅ 包含已完成和放弃的任务
  const result = todayTasks.filter(task =>
    (task.done === true || task.abandoned === true) &&
    task.category !== "本周任务" &&
    task.category !== "常规任务"
  );

  const subToMainMap = {
    '数学': '数学',
    '语文': '语文',
    '英语': '英语',
    '科学': '通识',
    '运动': '运动'
  };

  const matchingTasks = result.filter(task => {
    if (task.category === dimName) return true;

    if (task.category === '校内' && task.subCategory) {
      const mainCategory = subToMainMap[task.subCategory];
      if (mainCategory === dimName) return true;
    }

    return false;
  });

  return matchingTasks;
};

// 3. 最后定义 getTasksForSkill
const getTasksForSkill = (skillName) => {
  const todayTasks = tasksByDate[selectedDate] || [];

  return todayTasks.filter(task =>
    task.done === true &&
    task.abandoned !== true &&
    task.tags &&
    task.tags.some(tag =>
      tag.toLowerCase().includes(skillName.toLowerCase()) ||
      tag === skillName
    )
  );
};

  return (
  <div style={{
    maxWidth: 1000, 
    margin: "0 auto",
    padding: isDesktop ? "0" : "15px",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 15px)",
    paddingLeft: "calc(env(safe-area-inset-left) + 15px)",
    paddingRight: "calc(env(safe-area-inset-right) + 15px)",
    fontFamily: "sans-serif",
    backgroundColor: "#fcfdff",
    overflowX: "hidden",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "100vh",
    scrollbarGutter: 'stable',
    display: isDesktop ? 'flex' : 'block',
    gap: isDesktop ? '20px' : 0,
    alignItems: isDesktop ? 'flex-start' : 'stretch',
    justifyContent: isDesktop ? 'center' : 'flex-start',
  }}>

    {/* ===== 电脑端左侧边栏 ===== */}
   {/* ===== 电脑端左侧边栏 ===== */}
{isDesktop && (
  <div style={{
    width: '220px',
    minWidth: '220px',
    maxWidth: '220px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
    padding: '20px 16px',
    backgroundColor: '#fcfdff',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box'
  }}>
    <div style={{ flexShrink: 0 }}>
      <ExpPanel 
        selectedDate={selectedDate}
        dailyRatings={dailyRatings}
        tasksByDate={tasksByDate}
        isOpen={showExpDetail}
        onToggle={(isOpen) => setShowExpDetail(isOpen)}
        isDesktop={isDesktop}
        onShowTaskDetail={setExpTaskDetail}     // ✅ 新增
        onShowSkillDetail={setExpSkillDetail} 
        expenseRecords={expenseRecords}  
           dateExpense={dateExpense}        // ✅ 添加这行
        monthExpense={monthExpense}  // ✅ 新增
      />
    </div>
  </div>
)}

    {/* ===== 右侧主内容区 ===== */}
   {/* ===== 右侧主内容区 ===== */}

{/* ===== 右侧主内容区 ===== */}
<div style={{
  flex: isDesktop ? 1 : 'none',
  maxWidth: isDesktop ? '800px' : '100%',
  padding: isDesktop ? '20px 24px 40px 24px' : '0',
  width: isDesktop ? 'auto' : '100%',
  boxSizing: 'border-box',
  margin: isDesktop ? '0 auto' : '0'
}}>

{/* ===== 跑马灯 - 慢速双副本滚动 ===== */}
<div style={{
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: 6
}}>
  <div
    onClick={() => {
      const modalDiv = document.createElement('div');
      modalDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 16px;
        width: 85%;
        max-width: 350px;
        text-align: center;
      `;
      contentDiv.innerHTML = `
        <h3 style="margin: 0 0 12px 0; color: #61A2Da; font-size: 16px;">编辑提醒内容</h3>
        <textarea id="reminder-textarea" placeholder="输入每日提醒内容..." style="
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
          resize: none;
          overflow: hidden;
          margin-bottom: 16px;
          line-height: 1.5;
        ">${(reminderText || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        <div style="display: flex; gap: 10px;">
          <button id="cancel-btn" style="
            flex: 1;
            padding: 10px;
            background: #f0f0f0;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          ">取消</button>
          <button id="confirm-btn" style="
            flex: 1;
            padding: 10px;
            background: #61A2Da;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          ">保存</button>
        </div>
      `;
      modalDiv.appendChild(contentDiv);
      document.body.appendChild(modalDiv);
      
      const textarea = contentDiv.querySelector('#reminder-textarea');
      textarea.focus();
      
      const confirmBtn = contentDiv.querySelector('#confirm-btn');
      confirmBtn.onclick = () => {
        const newText = textarea.value;
        handleReminderChange(newText);
        document.body.removeChild(modalDiv);
        setForceUpdate(prev => prev + 1);
      };
      
      const cancelBtn = contentDiv.querySelector('#cancel-btn');
      cancelBtn.onclick = () => {
        document.body.removeChild(modalDiv);
      };
      
      modalDiv.onclick = (e) => {
        if (e.target === modalDiv) {
          document.body.removeChild(modalDiv);
        }
      };
    }}
    style={{
      flex: 1,
      padding: '0 12px',
      backgroundColor: '#ffebee',
      borderRadius: 8,
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(244, 67, 54, 0.1)',
      cursor: 'pointer'
    }}
  >
    <div style={{
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
      height: '100%'
    }}>
      {reminderText ? (
        <div
          key={reminderText + forceUpdate}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            color: '#c62828',
            fontWeight: '500',
            lineHeight: '28px',
            position: 'absolute',
            left: 0,
            top: 0,
            // ✅ 速度：根据文本长度计算，但整体放慢
            // 短文本：12秒，长文本：20秒
            animation: `marquee-slow ${Math.max(12, reminderText.length * 0.15)}s linear infinite`,
            paddingLeft: '100%',
            minWidth: '100%'
          }}
        >
          {/* ✅ 两个副本，中间用 80px 间距 */}
          <span>{reminderText}</span>
          <span style={{ paddingLeft: '80px' }}>{reminderText}</span>
        </div>
      ) : (
        <div style={{
          fontSize: '12px',
          color: '#ef5350',
          fontStyle: 'italic',
          lineHeight: '28px',
          textAlign: 'center'
        }}>
          点击添加每日提醒...
        </div>
      )}
    </div>
  </div>
</div>
{/* ===== 💰 今日消费卡片 ===== */}

{/* ===== 💰 消费统计卡片（电脑端） ===== */}
{isDesktop && (
  <div style={{ marginBottom: 10 }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px'
    }}>
      {/* 今日消费 */}
      <div
        onClick={() => setShowExpenseModal(true)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e8e8e8',
          cursor: 'pointer',
          textAlign: 'center',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '11px', color: '#999' }}>今日消费</span>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f44336' }}>
           ¥{dateExpense.toFixed(1)}
        </span>
      </div>

      {/* 本月消费 */}
      <div
        onClick={() => setShowExpenseModal(true)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e8e8e8',
          cursor: 'pointer',
          textAlign: 'center',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '11px', color: '#999' }}>本月消费</span>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f44336' }}>
          ¥{monthExpense.toFixed(1)}
        </span>
      </div>

      {/* 本月剩余 */}
      <div
        onClick={() => setShowExpenseModal(true)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e8e8e8',
          cursor: 'pointer',
          textAlign: 'center',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '11px', color: '#999' }}>本月剩余</span>
        <span style={{
          fontSize: '15px',
          fontWeight: 'bold',
          color: (monthlyBudget - monthExpense) >= 0 ? '#4caf50' : '#f44336'
        }}>
          ¥{(monthlyBudget - monthExpense).toFixed(1)}
        </span>
      </div>
    </div>
  </div>
)}
{/* ===== CSS 动画定义 - 慢速 ===== */}
<style>{`
  @keyframes marquee-slow {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`}</style>




 
  {/* ===== ExpPanel - 手机端显示，电脑端隐藏 ===== */}
  {!isDesktop && (
    <div style={{ marginBottom: 6, padding: "0 2px" }}>
      <ExpPanel 
        selectedDate={selectedDate}
        dailyRatings={dailyRatings}
        tasksByDate={tasksByDate}
        isOpen={showExpDetail}
        onToggle={(isOpen) => setShowExpDetail(isOpen)}
        onShowTaskDetail={setExpTaskDetail}     // ✅ 必须有
      onShowSkillDetail={setExpSkillDetail}  
       expenseRecords={expenseRecords}  
       dateExpense={dateExpense}        // ✅ 添加这行
      monthExpense={monthExpense}  
      />
    </div>
  )}

{/* ===== 本周切换 + 本月剩余 + 消费 + 三点按钮 ===== */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
  padding: "0 4px",
  gap: "8px",
  flexWrap: "nowrap",
  width: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden'
}}>
  
  {/* 左侧：上一周 + 日期 + 下一周 */}
  <div style={{ 
    display: "flex", 
    alignItems: "center",
    flexShrink: 0
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
        padding: "0",
        margin: "0",
        fontSize: "14px",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#61A2Da"
      }}
      title="上一周"
    >
      ◀
    </button>
    
    <span 
      onClick={() => setShowDatePickerModal(true)}
      style={{
        fontWeight: "bold",
        margin: "0 4px",
        fontSize: "13px",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "6px",
        display: "inline-block",
        lineHeight: "16px",
        verticalAlign: "middle",
        color: "#61A2Da",
        whiteSpace: "nowrap"
      }}
      title="点击选择日期"
    >
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
        padding: "0",
        margin: "0",
        fontSize: "14px",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#61A2Da"
      }}
      title="下一周"
    >
      ▶
    </button>
  </div>

  {/* 右侧：本月剩余 + 消费金额 + 三点按钮 */}
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 1,  // 👈 允许收缩
    minWidth: 0,    // 👈 允许缩小到0
    overflow: 'hidden'
  }}>
    {/* 本月剩余 - 手机端自动缩短 */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: '28px',
      padding: '0 4px',
      fontWeight: 600,
      fontSize: '11px',
      color: '#61A2Da',
      whiteSpace: 'nowrap',
      flexShrink: 1,  // 👈 允许收缩
      minWidth: 0,    // 👈 允许缩小到0
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      <span style={{ display: 'inline' }}>本月剩余</span>
      <strong style={{ marginLeft: 2, color: '#61A2Da', flexShrink: 0 }}>{daysLeftInMonth}</strong>
      <span style={{ display: 'inline', flexShrink: 0 }}>天</span>
    </div>

    

    {/* 三点按钮 - 固定不收缩 */}
   <div
  onClick={(e) => {
    e.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
  }}
  style={{
    padding: "2px 4px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    textAlign: "center",
    height: "28px",  // 👈 改成和金额一样高
    lineHeight: "28px",  // 👈 和高度一致
    display: "flex",  // 👈 改为 flex
    alignItems: "center",  // 👈 垂直居中
    justifyContent: "center",
    whiteSpace: 'nowrap',
    minWidth: "20px",
    flexShrink: 0,
    userSelect: 'none',
    transition: 'none',
    transform: 'none',
    color: "#61A2Da",
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: "-2px" 
  }}
>
  ⋮
</div>
  </div>
</div>

{/* ===== ⭐ 更多菜单 - 点击三点按钮展开/收起 ===== */}
{/* ===== ⭐ 更多菜单 - 5个按钮居中排列 ===== */}
{showMoreMenu && (
  <div style={{
    display: "flex",
    justifyContent: "center",  // 👈 居中排列
    alignItems: "center",
    gap: "6px",  // 👈 按钮之间间距
    marginTop: 4,
    marginBottom: 8,
    padding: "6px 8px",
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
    flexWrap: "wrap",
    width: '100%',
    boxSizing: 'border-box'
  }}>
    <div
      onClick={() => {
        setShowStats(true);
        setShowMoreMenu(false);
      }}
      style={{
        padding: "2px 10px",
        backgroundColor: "#61A2Da",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        textAlign: "center",
        whiteSpace: 'nowrap'
      }}
    >
      汇总
    </div>
    
    <div
      onClick={() => {
        setShowSubjectTodoModal(true);
        setShowMoreMenu(false);
      }}
      style={{
        padding: "2px 10px",
        backgroundColor: "#61A2Da",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        textAlign: "center",
        whiteSpace: 'nowrap'
      }}
    >
      待办
    </div>
    
    <div
      onClick={() => {
        setShowWeekTaskModal(true);
        setShowMoreMenu(false);
      }}
      style={{
        padding: "2px 10px",
        backgroundColor: "#61A2Da",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        textAlign: "center",
        whiteSpace: 'nowrap'
      }}
    >
      本周
    </div>
    
    <div
      onClick={() => {
        setShowMonthTaskModal(true);
        setShowMoreMenu(false);
      }}
      style={{
        padding: "2px 10px",
        backgroundColor: "#61A2Da",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        textAlign: "center",
        whiteSpace: 'nowrap'
      }}
    >
      本月
    </div>
    
    <div
      onClick={() => {
        setShowSearchModal(true);
        setShowMoreMenu(false);
      }}
      style={{
        padding: "2px 10px",
        backgroundColor: "#61A2Da",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "11px",
        textAlign: "center",
        whiteSpace: 'nowrap'
      }}
    >
      搜索
    </div>
  </div>
)}




  {/* ===== 日期行（电脑端和手机端都显示） ===== */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: "2px"
  }}>
{weekDates.map((d) => {
  const dateStr = d.date;
  const isSelected = dateStr === selectedDate;
  const isToday = dateStr === new Date().toISOString().split('T')[0];
  const dayTasks = tasksByDate[dateStr] || [];
  const hasCrossDateTask = dayTasks.some(task => task.crossDateId || task.dateRange);
  const dailyRating = dailyRatings[dateStr] || 0;
  
  const getRatingColor = (rating) => {
    switch(rating) {
      case 5: return '#4CAF50';
      case 4: return '#8BC34A';
      case 3: return '#FFC107';
      case 2: return '#FF9800';
      case 1: return '#F44336';
      default: return 'transparent';
    }
  };
  
  const learningTasks = dayTasks.filter(task => {
    if (task.category === "本周任务") return false;
    if (task.isRegularTask && !task.done) return false;
    return true;
  });

  let totalCount = 0;
  let completedCount = 0;
  let abandonedCount = 0;

  learningTasks.forEach(task => {
    const hasSubTasks = task.subTasks && Array.isArray(task.subTasks) && task.subTasks.length > 0;
    
    if (hasSubTasks) {
      task.subTasks.forEach(subTask => {
        totalCount++;
        if (subTask.done) {
          completedCount++;
        }
      });
    } else {
      totalCount++;
      if (task.done === true && task.abandoned !== true) {
        completedCount++;
      }
      if (task.abandoned) {
        abandonedCount++;
      }
    }
  });

  const incompleteCount = totalCount - completedCount - abandonedCount;

  let numberColor = "#666";
  let dotColor = "#666";

  if (totalCount === 0) {
    numberColor = "transparent";
    dotColor = "transparent";
  } else if (incompleteCount > 0) {
    numberColor = "#f44336";
    dotColor = "#f44336";
  } else if (completedCount === totalCount) {
    numberColor = "#4caf50";
    dotColor = "#4caf50";
  } else {
    numberColor = "#999";
    dotColor = "#999";
  }
  
  return (
    <div
      key={dateStr}
      onClick={() => setSelectedDate(dateStr)}
      style={{
        padding: "2px 4px",
        textAlign: "center",
        flex: 1,
        minWidth: 0,
        margin: "0 1px",
        fontSize: 11,
        cursor: "pointer",
        backgroundColor: isSelected ? "#fff9c4" : (isToday ? "#e8f0fe" : "transparent"),
        color: isToday ? "#61A2Da" : "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "16px",
        background: dailyRating > 0 
          ? `linear-gradient(to bottom, ${isSelected ? '#fff9c4' : (isToday ? '#e8f0fe' : 'transparent')} 0%, ${isSelected ? '#fff9c4' : (isToday ? '#e8f0fe' : 'transparent')} 50%, ${getRatingColor(dailyRating)}20 100%)`
          : isSelected ? '#fff9c4' : (isToday ? '#e8f0fe' : 'transparent'),
        position: "relative",
        borderRadius: isToday ? "4px" : "0px",
        border: isToday ? "1px solid #61A2Da" : "none"
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontSize: 10,
        fontWeight: isSelected ? "bold" : (isToday ? "bold" : "normal"),
        width: "100%",
        position: "relative"
      }}>
        <span>{d.label}</span>
        
        {completedCount > 0 && (
          <span style={{
            position: "absolute",
            right: "2px",
            fontSize: "8px",
            color: "#4caf50",
            fontWeight: "bold"
          }}>
            {completedCount}
          </span>
        )}
        
        {hasCrossDateTask && (
          <span style={{
            position: "absolute",
            right: completedCount > 0 ? "22px" : "2px",
            fontSize: "6px",
            color: "#f44336"
          }}>
            休
          </span>
        )}
      </div>
      
      <div style={{ 
        fontSize: 9,
        fontFamily: "sans-serif",
        fontWeight: isSelected ? "bold" : (isToday ? "bold" : "normal"),
        color: isToday ? "#61A2Da" : "#666"
      }}>
        {d.date.slice(5)}
      </div>
    </div>
  );
})}
  </div>

  {/* ===== 分类标签 ===== */}
  {categoryTabs.length > 1 && (
    <div style={{
      display: 'flex',
      gap: '6px',
      marginBottom: '12px',
      paddingBottom: '4px',
      WebkitOverflowScrolling: 'touch',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flex: 1,
        WebkitOverflowScrolling: 'touch'
      }}>
        {categoryTabs.map(tab => {
          if (tab === '全部') {
            return (
<div
  key={tab}
  onClick={() => {
    if (selectedCategoryTab === tab) {
      setShowOnlyCompleted(!showOnlyCompleted);
    } else {
      setSelectedCategoryTab(tab);
      setShowOnlyCompleted(false);
    }
  }}
  style={{
    padding: '4px 10px',
    borderRadius: '16px',
    backgroundColor: selectedCategoryTab === tab ? '#61A2Da' : '#f0f0f0',
    color: selectedCategoryTab === tab ? '#fff' : '#666',
    fontSize: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontWeight: selectedCategoryTab === tab ? 'bold' : 'normal',
    userSelect: 'none'
  }}
>
  全部
</div>
            );
          }
          return (
<div
  key={tab.name}
  onClick={() => {
    if (selectedCategoryTab === tab.name) {
      setShowOnlyCompleted(!showOnlyCompleted);
    } else {
      setSelectedCategoryTab(tab.name);
      setShowOnlyCompleted(false);
    }
  }}
  style={{
    padding: '4px 10px',
    borderRadius: '16px',
    backgroundColor: selectedCategoryTab === tab.name ? '#61A2Da' : '#f0f0f0',
    color: selectedCategoryTab === tab.name ? '#fff' : '#666',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontWeight: selectedCategoryTab === tab.name ? 'bold' : 'normal',
    userSelect: 'none'
  }}
>
  {tab.label}
</div>
          );
        })}
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        flexShrink: 0,
        paddingLeft: '8px',
        marginLeft: '4px',
        borderLeft: '1px solid #e0e0e0'
      }}>
        <div
          onClick={() => setShowAddTaskModal(true)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#61A2Da",
            color: "#fff",
            borderRadius: "14px",
            cursor: "pointer",
            fontSize: "10px",
            textAlign: "center",
            height: "22px",
            lineHeight: "14px",
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: 'nowrap'
          }}
        >
          添加
        </div>
        <div
          onClick={() => {
            if (!bulkText) {
              setBulkText(`健康
运动30分钟 #健身
手机时间＜6h
饭后站立10分钟
喝水2杯
步数＞6000
早睡22:30前

智慧
阅读30分钟 #阅读
英语听力30分钟 #英语
英语阅读30分钟 #英语
增长新知识

心神
写日记
冥想10分钟 #冥想

家庭
陪娃阅读30分钟
陪娃学习
陪娃玩

财富
记账 #理财
学习理财知识30分钟 #理财
定投/储蓄 #理财
复盘本周开支 #理财

悦己
做一道新菜 #烹饪
看一部新电影/纪录片
听一首新歌`);
            }
            setShowBulkImportModal(true);
            setShowMoreMenu(false);
          }}
          style={{
            padding: "4px 8px",
            backgroundColor: "#FF9800",
            color: "#fff",
            borderRadius: "14px",
            cursor: "pointer",
            fontSize: "10px",
            textAlign: "center",
            height: "22px",
            lineHeight: "14px",
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: 'nowrap'
          }}
        >
          计划
        </div>
      </div>
    </div>
  )}

  {/* ===== 本周任务 ===== */}
  {weekTasks.length > 0 && (
    <div style={{ 
      marginBottom: 8, 
      borderRadius: 10, 
      overflow: "hidden", 
      border: `2px solid ${isWeekComplete ? "#f5f5f5" : "#66BB6A"}`,
      backgroundColor: "#fff" 
    }}>
      <div 
        onClick={() => setCollapsedCategories(prev => ({ ...prev, "本周任务": !prev["本周任务"] }))}
        style={{ 
          backgroundColor: isWeekComplete ? "#f5f5f5" : "#66BB6A",
          color: isWeekComplete ? "#bbb" : "#fff",
          fontFamily: 'Calibri, "微软雅黑", sans-serif',
          padding: "3px 12px",
          fontWeight: isWeekComplete ? "normal" : "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontSize: "13px",
          minHeight: "24px"
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>
            本周任务 ({weekTasks.filter(t => t.done).length}/{weekTasks.length})
            {isWeekComplete && <SquareCheckMark show={true} size={12} color="#bbb" />}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (sortingSubCategory?.category === "本周任务" && !sortingSubCategory?.subCategory) {
              } else {
                setSortingSubCategory({ category: "本周任务", subCategory: null });
              }
            }}
            style={{
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              userSelect: "none"
            }}
          >
            {sortingSubCategory?.category === "本周任务" && !sortingSubCategory?.subCategory ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke={isWeekComplete ? "#bbb" : "#fff"} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <line x1="4" y1="6" x2="20" y2="6" stroke={isWeekComplete ? "#bbb" : "#fff"} strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="4" y1="12" x2="20" y2="12" stroke={isWeekComplete ? "#bbb" : "#fff"} strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="4" y1="18" x2="20" y2="18" stroke={isWeekComplete ? "#bbb" : "#fff"} strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {!collapsedCategories["本周任务"] && (
        <div style={{ padding: "8px" }}>
          <SortableTaskList
            tasks={weekTasks}
            category="本周任务"
            subCategory={null}
            onUpdateAbandonInfo={updateAbandonInfo}
            selectedDate={selectedDate} 
            tasksByDate={tasksByDate} 
            isSortingMode={sortingSubCategory?.category === "本周任务" && !sortingSubCategory?.subCategory}
            onSortingEnd={(newOrder) => {
              const orderKey = `tasks_order_本周任务`;
              localStorage.setItem(orderKey, JSON.stringify(newOrder));
              setTasksByDate(prev => ({ ...prev }));
            }}
            onDeleteTask={deleteTask}
            onEditTime={editTaskTime}
            onDeleteImage={handleDeleteImage}
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
            onEditSubTask={editSubTask}
            onUpdateExpValue={updateTaskExpValue}
            onToggleSubTask={toggleSubTask}
            getTaskCompletionType={getTaskCompletionType}
             onIncrementCount={handleIncrementCount} 
          />
        </div>
      )}
    </div>
  )}

  {/* ===== 6大分类 ===== */}
  {displayCategories.map((c) => {
  // 如果选了具体分类，只显示该分类
  if (selectedCategoryTab !== '全部' && selectedCategoryTab !== c.name) {
    return null;
  }
  
  // 获取该分类的任务
  let catTasks = todayTasks.filter(t => 
    t.category === c.name && 
    t.category !== "本周任务" && 
    !t.isRegularTask
  );
  
  // 如果开启了"只显示已完成"
  if (showOnlyCompleted) {
    catTasks = catTasks.filter(t => t.done === true && t.abandoned !== true);
  }
  
  // 如果是"全部"分类，但选了具体分类，上面已经过滤了
  if (catTasks.length === 0 && selectedCategoryTab !== '全部') return null;
  
  const isComplete = catTasks.length > 0 && catTasks.every(task => task.done === true && task.abandoned !== true);
  const isCollapsed = collapsedCategories[c.name];
  const isSortingMode = sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory;
  
  return (
    <div
      key={c.name}
      style={{
        marginBottom: 8,
        borderRadius: 10,
        overflow: "hidden",
         border: `2px solid ${categoryColors[c.name] ? `${categoryColors[c.name]}70` : '#e0e0e0'}`,
      }}
    >
      <div
        onClick={() => setCollapsedCategories(prev => ({ ...prev, [c.name]: !prev[c.name] }))}
        style={{
          backgroundColor: categoryColors[c.name] ? `${categoryColors[c.name]}70` : '#f0f0f0',
          color: isComplete ? "#bbb" : "#333",
          fontFamily: 'Calibri, "微软雅黑", sans-serif',
          padding: "3px 12px",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontSize: "11px",
          minHeight: "24px"
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {c.name} ({catTasks.filter(t => t.done === true && t.abandoned !== true).length}/{catTasks.length})
            {isComplete && <SquareCheckMark show={true} size={12} color="#bbb" />}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory) {
                setSortingSubCategory(null);
              } else {
                setSortingSubCategory({ category: c.name, subCategory: null });
              }
            }}
            style={{
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              marginRight: "8px",
              userSelect: "none"
            }}
          >
            {sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#999" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <line x1="4" y1="6" x2="20" y2="6" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="4" y1="18" x2="20" y2="18" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (catTasks.length === 0) {
                alert(`${c.name} 类别暂无任务`);
                return;
              }
              setShowCategoryDetailModal({
                category: c.name,
                tasks: catTasks,
                totalTime: catTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
              });
            }}
            style={{
              fontSize: '11px',
              color: '#333',
              fontFamily: 'Calibri, "微软雅黑", sans-serif',
              cursor: "pointer",
              minWidth: "32px",
              width: "32px",
              textAlign: "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flexShrink: 0,
              background: "transparent",
              border: "none",
              marginRight: "5px",
              marginLeft: "-18px", 
              fontWeight: "normal",
              display: "inline-block"
            }}
            title="点击查看详细时间"
          >
            {formatCategoryTime(catTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0))}
          </span>
        </div>
      </div>

      {!collapsedCategories[c.name] && (
        <div style={{ padding: 8 }}>
          <SortableTaskList
            tasks={catTasks}
            category={c.name}
            subCategory={null}
            selectedDate={selectedDate}
            tasksByDate={tasksByDate} 
            isSortingMode={isSortingMode}
            onSortingEnd={(newOrder) => {
              const orderKey = `tasks_order_${c.name}`;
              localStorage.setItem(orderKey, JSON.stringify(newOrder));
              setTasksByDate(prev => ({ ...prev }));
            }}
            onDeleteTask={deleteTask}
            onEditTime={editTaskTime}
            onDeleteImage={handleDeleteImage}
            onEditNote={editTaskNote}
            onEditReflection={editTaskReflection}
            onOpenEditModal={openTaskEditModal}
            onShowImageModal={setShowImageModal}
            toggleDone={toggleDone}
            formatTimeNoSeconds={formatTimeNoSeconds}
            formatTimeWithSeconds={formatTimeWithSeconds}
            onMoveTask={moveTask}
            categories={categories}
            onIncrementCount={handleIncrementCount} 
            setShowMoveModal={setShowMoveModal}
            onUpdateProgress={handleUpdateProgress}
            onEditSubTask={editSubTask}
            onToggleSubTask={toggleSubTask}
            onUpdateExpValue={updateTaskExpValue} 
          />
        </div>
      )}
    </div>
  );
})}
  {/* ===== 复盘区域 ===== */}
  <div style={{ marginBottom: 8 }}>
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 6,
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        minWidth: '32px',
        lineHeight: '28px',
        flexShrink: 0
      }}>
        复盘
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={() => setShowReflectionModal(true)}
          style={{
            width: '100%',
            minHeight: '28px',
            maxHeight: '200px',
            padding: '4px 12px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            lineHeight: '20px',
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {getCurrentDailyReflection() || <span style={{ color: '#999' }}>点击添加复盘...</span>}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0
      }}>
        {(() => {
          const rating = getCurrentDailyRating();
          let emoji = '';
          if (rating === 1) emoji = '😞';
          else if (rating === 2) emoji = '😕';
          else if (rating === 3) emoji = '😐';
          else if (rating === 4) emoji = '😊';
          else if (rating === 5) emoji = '🥳';
          return emoji ? (
            <span style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>
              {emoji}
            </span>
          ) : null;
        })()}
      </div>
    </div>
  </div>

  {/* ===== 底部统计 ===== */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    marginTop: 20,
    padding: "8px 0",
    backgroundColor: "#e8f0fe",
    borderRadius: 10,
    maxWidth: "100%",
    overflow: "hidden"
  }}>
    {[
      { label: "学习时间", value: formatTimeInHours(todayStats.learningTime), title: `学习时间: ${Math.floor(todayStats.learningTime / 60)}分钟` },
      { label: "运动时间", value: formatTimeInHours(todayStats.sportTime), title: `运动时间: ${Math.floor(todayStats.sportTime / 60)}分钟` },
      { label: "任务数量", value: `${todayStats.completedLearningTasks}/${todayStats.totalLearningTasks}`, title: `完成: ${todayStats.completedLearningTasks} / 总计: ${todayStats.totalLearningTasks}` },
      { label: "完成进度", value: `${todayStats.completionRate}%`, title: `完成率: ${todayStats.completionRate}%` },
    ].map((item, idx) => (
      <div
        key={idx}
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 12,
          borderRight: idx < 3 ? "1px solid #cce0ff" : "none",
          padding: "4px 0",
          cursor: "default"
        }}
        title={item.title}
      >
        <div>{item.label}</div>
        <div style={{ fontWeight: "bold", marginTop: 2, display: "flex", justifyContent: "center" }}>
          {item.value || ""}
        </div>
      </div>
    ))}
  </div>

  {/* ===== 底部按钮（手机端显示） ===== */}
  {/* ===== 底部按钮（手机端和电脑端都显示） ===== */}
<div style={{
  display: "flex",
  justifyContent: "center",
  gap: 6,
  marginTop: 16,
  marginBottom: 16,
  flexWrap: "nowrap",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch"
}}>
  {/* 每日日志 */}
  <div
    onClick={(e) => {
      e.preventDefault();
      generateDailyLog();
    }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 6px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      fontSize: 11,
      borderRadius: 6,
      minWidth: "60px",
      height: "28px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0
    }}
  >
    每日日志
  </div>

  {/* 时间记录 */}
  <div
    onClick={(e) => {
      e.preventDefault();
      setShowTimeRecordModal(true);
    }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 6px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      fontSize: 11,
      borderRadius: 6,
      minWidth: "60px",
      height: "28px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0
    }}
  >
    时间记录
  </div>

  {/* 立即同步 */}
  <div
    onClick={(e) => {
      e.preventDefault();
      if (isSyncing) {
        alert('正在同步中，请稍候...');
        return;
      }
      syncToGitHub();
    }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 6px",
      backgroundColor: isSyncing ? "#ccc" : "#61A2Da",
      color: "#fff",
      fontSize: 11,
      borderRadius: 6,
      minWidth: "60px",
      height: "28px",
      cursor: isSyncing ? "not-allowed" : "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      opacity: isSyncing ? 0.7 : 1,
      flexShrink: 0
    }}
  >
    {isSyncing ? "同步中..." : "立即同步"}
  </div>

  {/* 恢复云端 */}
  <div
    onClick={(e) => {
      e.preventDefault();
      const token = localStorage.getItem(PAGE_ID + '_github_token');
      if (!token) {
        alert('请先设置 GitHub Token');
        setShowGitHubSyncModal(true);
        return;
      }
      if (window.confirm('⚠️ 确定要从云端覆盖本地数据吗？\n\n此操作将：\n• 用云端数据完全替换本地数据\n• 丢失所有本地未同步的更改\n• 不可撤销！')) {
        setIsRestoring(true);
        const forceRestoreFromCloud = async () => {
          try {
            const token = localStorage.getItem('github_token') || localStorage.getItem('PAGE_A_github_token');
            let targetGistId = localStorage.getItem('github_gist_id') || localStorage.getItem('PAGE_A_github_gist_id');
            if (!targetGistId) {
              const latestGist = await getLatestStudyTrackerGist(token);
              if (latestGist) {
                targetGistId = latestGist.id;
                localStorage.setItem('github_gist_id', targetGistId);
              } else {
                throw new Error('未找到云端备份数据');
              }
            }
            const response = await fetch(`https://api.github.com/gists/${targetGistId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (!response.ok) throw new Error(`获取失败: ${response.status}`);
            const gist = await response.json();
            const content = gist.files['life-os-data.json']?.content;
            const backupData = JSON.parse(content);
            await handleRestoreData(backupData, 'overwrite');
          } catch (error) {
            console.error('覆盖失败:', error);
            alert('覆盖失败: ' + error.message);
          } finally {
            setIsRestoring(false);
          }
        };
        forceRestoreFromCloud();
      }
    }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 6px",
      backgroundColor: isRestoring ? "#ccc" : "#61A2Da",
      color: isRestoring ? "#999" : "#fff",
      fontSize: 11,
      borderRadius: 6,
      minWidth: "60px",
      height: "28px",
      cursor: isRestoring ? "not-allowed" : "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0,
      opacity: isRestoring ? 0.6 : 1
    }}
  >
    {isRestoring ? "恢复中..." : "恢复云端"}
  </div>

  {/* 其他设置 */}
  <div
    onClick={(e) => {
      e.preventDefault();
      setShowSettingsMenu(!showSettingsMenu);
    }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 6px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      fontSize: 11,
      borderRadius: 6,
      minWidth: "60px",
      height: "28px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0
    }}
  >
    其他设置
  </div>
</div>

</div>




    {/* ✅ 维度详情弹窗 */}
    {expTaskDetail && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        padding: '10px',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }} onClick={() => setExpTaskDetail(null)}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '70vh',
          overflow: 'auto',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1000000,
          pointerEvents: 'auto',
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '12px'
          }}>
            <div>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>
                {(() => {
                  const emojis = {
                    tipuo: '💪',
                    xiuye: '📚',
                    xinshen: '🧠',
                    shouhu: '👨‍👩‍👧',
                    caiye: '💰',
                    yiqu: '⛰️'
                  };
                  return emojis[expTaskDetail] || '📌';
                })()}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                {(() => {
                  const names = {
                    tipuo: '健康',
                    xiuye: '智慧',
                    xinshen: '心神',
                    shouhu: '家庭',
                    caiye: '财富',
                    yiqu: '悦己'
                  };
                  return names[expTaskDetail] || expTaskDetail;
                })()}
              </span>
              {(() => {
  const todayExpValue = (expData.daily[selectedDate] || {})[expTaskDetail] || 0;
  return (
    <span style={{ 
      fontSize: '13px', 
      color: todayExpValue > 0 ? '#4caf50' : (todayExpValue < 0 ? '#f44336' : '#999'),
      marginLeft: '8px'
    }}>
      {todayExpValue > 0 ? `+${todayExpValue}` : (todayExpValue < 0 ? todayExpValue : '')} 分
    </span>
  );
})()}
            </div>
            <div
              onClick={() => setExpTaskDetail(null)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666'
              }}
            >
              ×
            </div>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
            今日完成 ({getTasksForDimension(expTaskDetail).length} 个)
          </div>

          {getTasksForDimension(expTaskDetail).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              color: '#999',
              fontSize: '13px'
            }}>
              今日暂无记录
            </div>
          ) : (
            <div>
{getTasksForDimension(expTaskDetail).map((task, idx) => {
  const minutes = Math.floor((task.timeSpent || 0) / 60);
  const expValue = task.expValue || 2;
  const isAbandoned = task.abandoned === true;
  
  return (
    <div
      key={task.id}
      style={{
        padding: '8px 12px',
        borderBottom: idx < getTasksForDimension(expTaskDetail).length - 1 ? '1px solid #f0f0f0' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isAbandoned ? '#fff5f5' : (idx % 2 === 0 ? '#fafafa' : 'transparent'),
        borderRadius: '6px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        {/* 状态图标 */}
        <span style={{ flexShrink: 0 }}>
          {isAbandoned ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f44336" strokeWidth="2" fill="none"/>
              <line x1="8" y1="8" x2="16" y2="16" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="8" x2="8" y2="16" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
            </svg>
          )}
        </span>
        <span style={{
          fontSize: '13px',
          color: isAbandoned ? '#999' : '#333',
          wordBreak: 'break-word',
          flex: 1,
          textDecoration: isAbandoned ? 'line-through' : 'none'
        }}>
          {task.text}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        marginLeft: '8px'
      }}>
        {isAbandoned && (
          <span style={{
            fontSize: '10px',
            color: '#f44336',
            backgroundColor: '#ffebee',
            padding: '1px 6px',
            borderRadius: '10px'
          }}>
            已放弃
          </span>
        )}
        <span style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: isAbandoned ? '#999' : '#FF9800',
          padding: '1px 8px',
          borderRadius: '10px',
          minWidth: '20px',
          textAlign: 'center'
        }}>
          {expValue}分
        </span>
        {minutes > 0 && (
          <span style={{
            fontSize: '11px',
            color: '#999',
            minWidth: '30px',
            textAlign: 'right'
          }}>
            {minutes}m
          </span>
        )}
      </div>
    </div>
  );
})}
            </div>
          )}

          <div
            onClick={() => setExpTaskDetail(null)}
            style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: '#61A2Da',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            关闭
          </div>
        </div>
      </div>
    )}

    {/* ✅ 技能详情弹窗 */}
    {expSkillDetail && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        padding: '10px',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }} onClick={() => setExpSkillDetail(null)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '70vh',
          overflow: 'auto',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1000000,
          pointerEvents: 'auto',
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '12px'
          }}>
            <div>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>
                {(() => {
                  const icons = {
                    '健身': '💪',
                    '阅读': '📖',
                    '英语': '🔤',
                    '冥想': '🧘',
                    '理财': '💰',
                    '烹饪': '🍳',
                    '写作': '✍️',
                    '运动': '🏃',
                    '育儿': '👶',
                    '摄影': '📷',
                    '音乐': '🎵',
                    '设计': '🎨',
                    '编程': '💻'
                  };
                  return icons[expSkillDetail] || '🏷️';
                })()}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                {expSkillDetail}
              </span>
              <span style={{ fontSize: '13px', color: '#999', marginLeft: '8px' }}>
                +{getTasksForSkill(expSkillDetail).reduce((sum, t) => sum + (t.expValue || 2), 0)} 分
              </span>
            </div>
            <div
              onClick={() => setExpSkillDetail(null)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666'
              }}
            >
              ×
            </div>
          </div>

          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
            今日完成 ({getTasksForSkill(expSkillDetail).length} 个)
          </div>

          {getTasksForSkill(expSkillDetail).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              color: '#999',
              fontSize: '13px'
            }}>
              今日暂无记录
            </div>
          ) : (
            <div>
              {getTasksForSkill(expSkillDetail).map((task, idx) => {
                const minutes = Math.floor((task.timeSpent || 0) / 60);
                const expValue = task.expValue || 2;

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '8px 12px',
                      borderBottom: idx < getTasksForSkill(expSkillDetail).length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: idx % 2 === 0 ? '#fafafa' : 'transparent',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                        </svg>
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: '#333',
                        wordBreak: 'break-word',
                        flex: 1
                      }}>
                        {task.text}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#FF9800',
                        padding: '1px 8px',
                        borderRadius: '10px',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {expValue}分
                      </span>
                      {minutes > 0 && (
                        <span style={{
                          fontSize: '11px',
                          color: '#999',
                          minWidth: '30px',
                          textAlign: 'right'
                        }}>
                          {minutes}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            onClick={() => setExpSkillDetail(null)}
            style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: '#61A2Da',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            关闭
          </div>
        </div>
      </div>
    )}

 

    {/* ===== 所有模态框（保持不变） ===== */}
    {showImageModal && (
      <ImageModal imageUrl={showImageModal} onClose={() => setShowImageModal(null)} />
    )}

    {showMoveTaskModal && (
      <TaskMoveModal
        task={showMoveTaskModal}
        onClose={() => setShowMoveTaskModal(null)}
        onMove={moveTaskToDate}
        categories={categories}
        tasksByDate={tasksByDate}
      />
    )}

    {showCustomConfirm && (
      <CustomConfirmModal
        message={showCustomConfirm.message}
        onConfirm={showCustomConfirm.onConfirm}
        onCancel={showCustomConfirm.onCancel}
        onClose={() => setShowCustomConfirm(null)}
      />
    )}

    {editingCategory && (
      <SubCategoryModal
        category={editingCategory}
        onSave={handleSaveSubCategories}
        onClose={() => setEditingCategory(null)}
      />
    )}

    {showSubjectTodoModal && (
      <SubjectTodoModal
        key={showSubjectTodoModal ? Date.now() : 'closed'}
        onClose={() => setShowSubjectTodoModal(false)}
        isVisible={showSubjectTodoModal}
        tasksByDate={tasksByDate}
      />
    )}

    {showMonthTaskModal && (
      <MonthTaskPage
        tasks={monthTasks}
        onClose={() => setShowMonthTaskModal(false)}
        onAddTask={(task) => {
          setMonthTasks(prev => [...prev, task]);
        }}
        onUpdateProgress={(taskId, newProgress) => {
          setMonthTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, progress: newProgress } : task
          ));
        }}
        onEditTask={handleEditMonthTask}
        onDeleteTask={handleDeleteMonthTask}
      />
    )}

    {showSearchModal && (
      <SearchTaskModal tasksByDate={tasksByDate} onClose={() => setShowSearchModal(false)} />
    )}

    {showTimeModal && (
      <TimeModal
        config={repeatConfig}
        onSave={(newConfig) => setRepeatConfig(newConfig)}
        onClose={() => setShowTimeModal(false)}
      />
    )}

    {showRepeatModal && (
      <RepeatModal
        config={repeatConfig}
        onSave={(newConfig) => {
          setRepeatConfig(newConfig);
          setShowRepeatModal(false);
        }}
        onClose={() => setShowRepeatModal(false)}
      />
    )}

    {showGitHubSyncModal && (
      <GitHubSyncModal
        config={syncConfig}
        onSave={(newConfig) => {
          localStorage.setItem(PAGE_ID + '_github_token', newConfig.token);
          localStorage.setItem('github_token', newConfig.token);
          localStorage.setItem(PAGE_ID + '_github_auto_sync', newConfig.autoSync.toString());
          localStorage.setItem('github_auto_sync', newConfig.autoSync.toString());
          localStorage.setItem(PAGE_ID + '_github_gist_id', newConfig.gistId);
          localStorage.setItem('github_gist_id', newConfig.gistId);
          setSyncConfig({ ...syncConfig, ...newConfig });
          setShowGitHubSyncModal(false);
        }}
        onClose={() => setShowGitHubSyncModal(false)}
      />
    )}

    {showRestoreModal && (
      <RestoreDataModal
        onClose={() => setShowRestoreModal(false)}
        onRestore={handleRestoreData}
      />
    )}

    {showCategoryManager && (
      <CategoryManagerModal
        categories={categories}
        onSave={(updatedCategories) => {
          setCategories(updatedCategories);
          saveMainData('categories', updatedCategories);
          setShowCategoryManager(false);
        }}
        onClose={() => setShowCategoryManager(false)}
        subCategoryColors={subCategoryColors}
        categoryColors={categoryColors}
        onSaveCategoryColor={saveCategoryColor}
        onSaveSubCategoryColor={saveSubCategoryColor}
      />
    )}

    {showReminderModal && (
      <ReminderModal
        config={repeatConfig}
        onSave={(newConfig) => setRepeatConfig(newConfig)}
        onClose={() => setShowReminderModal(false)}
      />
    )}

    {showCrossDateModal && (
      <CrossDateModal
        task={showCrossDateModal}
        onClose={() => setShowCrossDateModal(null)}
        onSave={handleCrossDateTask}
        selectedDate={selectedDate}
      />
    )}

    {showDatePickerModal && (
      <DatePickerModal
        onClose={() => setShowDatePickerModal(false)}
        onSelectDate={handleDateSelect}
        tasksByDate={tasksByDate}
      />
    )}

    {showTaskEditModal && (
      <TaskEditModal
        task={showTaskEditModal}
        categories={categories}
        onClose={() => setShowTaskEditModal(null)}
        onSave={(task, editData) => {
          saveTaskEdit(task, editData);
        }}
        onTogglePinned={togglePinned}
        onImageUpload={handleImageUpload}
        setCategories={setCategories}
        setShowDeleteModal={setShowDeleteModal}
        onMarkAbandoned={markTaskAsAbandoned}
        onCancelAbandoned={cancelAbandoned}
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

    {showBackupModal && (
      <BackupManagerModal onClose={() => setShowBackupModal(false)} />
    )}

    {showDailyLogModal && (
      <DailyLogModal
        logData={showDailyLogModal}
        tasksByDate={tasksByDate}
        selectedDate={selectedDate}
        dailyRating={dailyRating}
        studyEndTime={studyEndTimes[selectedDate]}
        dailyReflection={getCurrentDailyReflection()}
        onClose={() => setShowDailyLogModal(null)}
        onCopy={(text) => {
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text);
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
            } catch (err) {
              console.error('复制失败:', err);
            } finally {
              document.body.removeChild(textArea);
            }
          }
          alert('日志已复制到剪贴板！');
        }}
      />
    )}

    {showTimeEditModal && (
      <TimeEditModal
        task={showTimeEditModal}
        onClose={() => setShowTimeEditModal(null)}
        onSave={handleTimeEditSave}
        onEditRecord={handleEditTimeRecord}
        onDeleteRecord={handleDeleteTimeRecord}
        toggleDone={toggleDone}
        onSavePlannedTime={handleSavePlannedTime}
      />
    )}

    {showTimeRecordModal && (
      <TimeRecordModal
        onClose={() => setShowTimeRecordModal(false)}
        tasksByDate={tasksByDate}
        categories={categories}
        selectedDate={selectedDate}
        onEditRecord={handleEditTimeRecord}
        onDeleteRecord={handleDeleteTimeRecord}
      />
    )}

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
        zIndex: 1000,
        padding: '10px'
      }}>
        <ReflectionModalContent
          initialRating={getCurrentDailyRating()}
          initialReflection={getCurrentDailyReflection()}
          onSave={(rating, reflection) => {
            setCurrentDailyRating(rating);
            setCurrentDailyReflection(reflection);
            saveDailyData(selectedDate);
            setShowReflectionModal(false);
          }}
          onClose={() => setShowReflectionModal(false)}
        />
      </div>
    )}

    {showAddTaskModal && (
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
        padding: '10px'
      }} onClick={() => setShowAddTaskModal(false)}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflow: 'auto'
        }} onClick={e => e.stopPropagation()}>
          <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#61A2Da' }}>添加计划</h3>
          
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="输入计划内容"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: '14px',
              marginBottom: 12,
              boxSizing: 'border-box'
            }}
          />



          
          {/* 技能标签选择 */}
          <div style={{
            marginBottom: 12,
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: 8
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              技能标签
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {[
                '健身', '阅读', '英语', '冥想', '理财', 
                '烹饪', '写作', '运动', '育儿', '摄影', 
                '音乐', '设计', '编程'
              ].map(skill => {
                const isSelected = selectedSkills.includes(skill);
                const skillColors = {
                  '健身': '#E8F5E9', '阅读': '#E3F2FD', '英语': '#FCE4EC',
                  '冥想': '#F3E5F5', '理财': '#FFF8E1', '烹饪': '#FFF3E0',
                  '写作': '#E8EAF6', '运动': '#E8F5E9', '育儿': '#FCE4EC',
                  '摄影': '#E1F5FE', '音乐': '#F3E5F5', '设计': '#FCE4EC',
                  '编程': '#E8F5E9'
                };
                const color = skillColors[skill] || '#f0f0f0';
                
                return (
                  <span
                    key={skill}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSkills(selectedSkills.filter(s => s !== skill));
                      } else {
                        setSelectedSkills([...selectedSkills, skill]);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 12px',
                      backgroundColor: isSelected ? color : '#f0f0f0',
                      color: isSelected ? '#333' : '#999',
                      borderRadius: '14px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #61A2Da' : '1px solid #e0e0e0',
                      minWidth: '44px',
                      height: '28px',
                      transition: 'none',
                      fontWeight: isSelected ? '500' : 'normal'
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
            {selectedSkills.length > 0 && (
              <div style={{
                fontSize: '10px',
                color: '#999',
                marginTop: '6px',
                textAlign: 'right'
              }}>
                已选 {selectedSkills.length} 个
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>分类：</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <div
                  key={c.name}
                  onClick={() => {
                    setNewTaskCategory(c.name);
                    setNewTaskSubCategory('');
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    backgroundColor: newTaskCategory === c.name ? '#61A2Da' : '#f0f0f0',
                    color: newTaskCategory === c.name ? '#fff' : '#333',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          </div>

  {/* ===== ✅ 在这里插入：任务类型选择 ===== */}
      {/* 👇👇👇 插入位置 👇👇👇 */}
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>任务类型：</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={!isCountTask}
              onChange={() => setIsCountTask(false)}
            />
            一次性
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={isCountTask}
              onChange={() => setIsCountTask(true)}
            />
            多次任务
          </label>
        </div>
      </div>

          
         <div style={{ 
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  padding: '4px 8px',
  backgroundColor: '#f8f9fa',
  borderRadius: 6
}}>
  <span style={{
    fontSize: '12px',
    color: '#666',
    fontWeight: '500'
  }}>
    分值
  </span>
  
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}>
    {/* - 按钮 */}
    <div
      onClick={() => {
        const current = parseInt(newTaskExpValue) || 0;
        setNewTaskExpValue(current - 1);
      }}
      style={{
        width: '26px',
        height: '26px',
        borderRadius: '4px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        color: '#f44336',
        border: '1px solid #e0e0e0'
      }}
    >
      −
    </div>
    
    {/* 输入框 */}
    <input
      type="number"
      step="1"
      value={newTaskExpValue}
      onChange={(e) => {
        const val = parseInt(e.target.value) || 0;
        setNewTaskExpValue(val);
      }}
      style={{
        width: '50px',
        padding: '4px 2px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        textAlign: 'center',
        boxSizing: 'border-box',
        fontWeight: 'bold'
      }}
    />
    
    {/* + 按钮 */}
    <div
      onClick={() => {
        const current = parseInt(newTaskExpValue) || 0;
        setNewTaskExpValue(current + 1);
      }}
      style={{
        width: '26px',
        height: '26px',
        borderRadius: '4px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        color: '#4caf50',
        border: '1px solid #e0e0e0'
      }}
    >
      +
    </div>
  </div>
</div>
          
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div
              onClick={() => setShowAddTaskModal(false)}
              style={{
                flex: 1,
                padding: 10,
                backgroundColor: '#ccc',
                color: '#333',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              取消
            </div>
            <div
              onClick={() => {
                handleAddTask();
                setShowAddTaskModal(false);
              }}
              style={{
                flex: 1,
                padding: 10,
                backgroundColor: '#61A2Da',
                color: '#fff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              确认添加
            </div>
          </div>
        </div>
      </div>
    )}

    {showWeekTaskModal && (
      <WeekTaskModal
        onClose={() => setShowWeekTaskModal(false)}
        onAdd={handleAddWeekTask}
        categories={categories}
      />
    )}

    {showBulkImportModal && (
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
        padding: '10px',
        overflow: 'hidden'
      }} onClick={() => setShowBulkImportModal(false)}>
        <div style={{
          backgroundColor: 'white',
          padding: '14px 16px 14px 16px',
          borderRadius: '16px',
          width: '92%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }} onClick={e => e.stopPropagation()}>
          
          <h3 style={{ 
            textAlign: 'center', 
            marginBottom: 10, 
            color: '#61A2Da',
            fontSize: '16px'
          }}>
            📋 每日计划
          </h3>
          
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`第一行：子分类（如：数学、语文、英语、运动）
第二行起：任务内容`}
            style={{
              width: '100%',
              height: '250px',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: '12px',
              fontFamily: 'monospace',
              resize: 'none',
              boxSizing: 'border-box',
              marginBottom: 10
            }}
          />
          
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>日期范围</div>
            <select
              value={bulkDateRange}
              onChange={(e) => {
                setBulkDateRange(e.target.value);
                if (e.target.value === 'custom') {
                  setBulkDateRangeStart(selectedDate);
                  setBulkDateRangeEnd(selectedDate);
                }
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: '12px',
                backgroundColor: '#fff'
              }}
            >
              <option value="today">仅当天</option>
              <option value="next3">未来3天</option>
              <option value="next4">未来4天</option>
              <option value="custom">自定义</option>
            </select>
            
            {bulkDateRange === 'custom' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  type="date"
                  value={bulkDateRangeStart}
                  onChange={(e) => setBulkDateRangeStart(e.target.value)}
                  style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: '12px' }}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>至</span>
                <input
                  type="date"
                  value={bulkDateRangeEnd}
                  onChange={(e) => setBulkDateRangeEnd(e.target.value)}
                  style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid #ccc', fontSize: '12px' }}
                />
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              onClick={() => setShowBulkImportModal(false)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                borderRadius: 8,
                fontSize: '13px',
                fontWeight: 'bold',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              取消
            </div>
            <div
              onClick={() => {
                handleImportTasksWithDuration(selectedDate);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#61A2Da',
                color: '#fff',
                borderRadius: 8,
                fontSize: '13px',
                fontWeight: 'bold',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              确认导入
            </div>
          </div>
        </div>
      </div>
    )}

    {showCategoryDetailModal && (
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
        zIndex: 2000,
        padding: '10px'
      }} onClick={() => setShowCategoryDetailModal(null)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '350px',
          maxHeight: '70vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }} onClick={e => e.stopPropagation()}>
          
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#61A2Da',
            color: 'white',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {showCategoryDetailModal.category}
            </span>
            <div
              onClick={() => setShowCategoryDetailModal(null)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            display: 'flex',
            gap: '12px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px',
              backgroundColor: '#e8f0fe',
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '11px', color: '#666' }}>总时长</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#61A2Da' }}>
                {Math.floor(showCategoryDetailModal.totalTime / 60)}分钟
              </div>
            </div>
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px',
              backgroundColor: '#e8f5e9',
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '11px', color: '#666' }}>任务进度</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>
                {showCategoryDetailModal.tasks.filter(t => t.done === true && t.abandoned !== true).length}/{showCategoryDetailModal.tasks.length}
              </div>
            </div>
          </div>
          
          <div style={{ padding: '12px' }}>
            {(() => {
              const renderTaskItem = (task, idx, totalLength) => {
                const minutes = Math.floor((task.timeSpent || 0) / 60);
                const isCompleted = task.done === true && task.abandoned !== true;
                
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: idx < totalLength - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        flexShrink: 0
                      }}>
                        {isCompleted ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="#61A2Da" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                          </svg>
                        ) : task.abandoned ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="4" y1="4" x2="20" y2="20" stroke="#999" strokeWidth="3" strokeLinecap="round"/>
                            <line x1="20" y1="4" x2="4" y2="20" stroke="#999" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="#999" strokeWidth="1.8" fill="none"/>
                          </svg>
                        )}
                      </span>
                      
                      <span style={{
                        fontSize: '13px',
                        color: isCompleted ? '#999' : (task.abandoned ? '#ccc' : '#333'),
                        flex: 1,
                        wordBreak: 'break-word'
                      }}>
                        {task.text}
                      </span>
                    </div>
                    
                    <span style={{
                      fontSize: '12px',
                      color: '#999',
                      minWidth: '45px',
                      textAlign: 'right'
                    }}>
                      {minutes > 0 ? `${minutes}分钟` : '0分钟'}
                    </span>
                  </div>
                );
              };
              
              const tasks = showCategoryDetailModal.tasks;
              const tasksWithSubCategory = tasks.filter(t => t.subCategory);
              const tasksWithoutSubCategory = tasks.filter(t => !t.subCategory);
              
              const groupedBySubCategory = {};
              tasksWithSubCategory.forEach(task => {
                const subCat = task.subCategory;
                if (!groupedBySubCategory[subCat]) {
                  groupedBySubCategory[subCat] = [];
                }
                groupedBySubCategory[subCat].push(task);
              });
              
              return (
                <div>
                  {tasksWithoutSubCategory.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#61A2Da',
                        marginBottom: '8px',
                        paddingBottom: '4px',
                        borderBottom: '1px solid #e0e0e0'
                      }}>
                        📋 全部
                      </div>
                      {tasksWithoutSubCategory.map((task, idx) => renderTaskItem(task, idx, tasksWithoutSubCategory.length))}
                    </div>
                  )}
                  
                  {Object.entries(groupedBySubCategory).map(([subCategory, subTasks]) => (
                    <div key={subCategory} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#61A2Da',
                        marginBottom: '8px',
                        paddingBottom: '4px',
                        borderBottom: '1px solid #e0e0e0'
                      }}>
                        {subCategory}
                      </div>
                      {subTasks.map((task, idx) => renderTaskItem(task, idx, subTasks.length))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
            <div
              onClick={() => setShowCategoryDetailModal(null)}
              style={{
                padding: '10px',
                backgroundColor: '#61A2Da',
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              关闭
            </div>
          </div>
        </div>
      </div>
    )}

    {showSettingsMenu && (
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
        zIndex: 2000,
        padding: '10px'
      }} onClick={() => setShowSettingsMenu(false)}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '300px',
          padding: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }} onClick={e => e.stopPropagation()}>
          
          <h3 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
            设置
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: '#666',
              borderBottom: '1px solid #eee',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📅 最近同步:</span>
              <span style={{ 
                fontWeight: 'bold',
                color: lastSyncStatus?.success === false ? '#f44336' : '#4caf50'
              }}>
                {(() => {
                  const lastSyncTime = localStorage.getItem('PAGE_A_github_last_sync');
                  if (lastSyncTime) {
                    return new Date(lastSyncTime).toLocaleString();
                  }
                  if (lastSyncStatus?.time) {
                    return new Date(lastSyncStatus.time).toLocaleString();
                  }
                  return '从未同步';
                })()}
              </span>
            </div>

            {lastSyncStatus?.success === false && lastSyncStatus?.message && (
              <div style={{
                padding: '6px 10px',
                fontSize: '11px',
                color: '#f44336',
                backgroundColor: '#ffebee',
                borderRadius: '6px',
                marginBottom: '4px'
              }}>
                ⚠️ {lastSyncStatus.message}
              </div>
            )}
           
            <div
              onClick={() => {
                handleExportData();
                setShowSettingsMenu(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>📤</span>
              导出数据
            </div>

            <div
              onClick={() => {
                document.getElementById('import-file').click();
                setShowSettingsMenu(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>📥</span>
              导入数据
            </div>

            <div
              onClick={() => {
                setShowBackupModal(true);
                setShowSettingsMenu(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>📦</span>
              备份管理
            </div>

            <div
              onClick={() => {
                setShowGitHubSyncModal(true);
                setShowSettingsMenu(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>⚙️</span>
              同步设置
            </div>

            <div
              onClick={() => {
                setShowCategoryManager(true);
                setShowSettingsMenu(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>📁</span>
              管理类别
            </div>

            <div
              onClick={() => {
                clearAllData();
                setShowSettingsMenu(false);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#d32f2f'
              }}
            >
              <span style={{ fontSize: '18px', color: '#d32f2f' }}>🗑️</span>
              清空数据
            </div>

          </div>

          <div
            onClick={() => setShowSettingsMenu(false)}
            style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: '#e0e0e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            关闭
          </div>

        </div>
      </div>
    )}

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
            if (!importedData.tasks || !importedData.version) {
              throw new Error('无效的数据文件格式');
            }

            const importStats = {
              任务天数: Object.keys(importedData.tasks || {}).length,
              模板数量: (importedData.templates || []).length,
              成就数量: (importedData.customAchievements || []).length,
              版本: importedData.version || '未知',
              每日提醒: importedData.reminderText ? '有' : '无'
            };
            
            const confirmMessage = `确定要导入以下数据吗？\n` +
              `• 任务天数: ${importStats.任务天数}\n` +
              `• 模板数量: ${importStats.模板数量}\n` +
              `• 成就数量: ${importStats.成就数量}\n` +
              `• 每日提醒: ${importStats.每日提醒}\n` +
              `• 数据版本: ${importStats.版本}\n\n` +
              `这将覆盖当前所有数据！`;

            if (window.confirm(confirmMessage)) {
              await saveMainData('tasks', importedData.tasks || {});
              await saveMainData('templates', importedData.templates || []);
              await saveMainData('customAchievements', importedData.customAchievements || []);
              await saveMainData('unlockedAchievements', importedData.unlockedAchievements || []);
              await saveMainData('categories', importedData.categories || baseCategories);
              
             if (importedData.reminderText !== undefined) {
  setReminderText(importedData.reminderText);
  localStorage.setItem(`${STORAGE_KEY}_daily_reminder`, importedData.reminderText);
}
              
              setTasksByDate(importedData.tasks || {});
              setTemplates(importedData.templates || []);
              setCategories(importedData.categories || baseCategories);
              
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

    {showExpPopup && (
      <ExpPopup
        expData={showExpPopup}
        onClose={() => setShowExpPopup(null)}
      />
    )}
{/* ===== 💰 消费记录弹窗 ===== */}
{showExpenseModal && (
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
    zIndex: 10000,
    padding: '10px'
  }} onClick={() => setShowExpenseModal(false)}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }} onClick={e => e.stopPropagation()}>
      
      {/* 标题栏 */}
      {/* 标题栏 */}
<div style={{
  padding: '16px 20px',
  backgroundColor: '#61A2Da',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
}}>
  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
    💰 {selectedDate === new Date().toISOString().split('T')[0] ? '今日消费' : `${selectedDate} 消费`}
  </span>
        <div
          onClick={() => setShowExpenseModal(false)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ×
        </div>
      </div>
      
      {/* 统计摘要 */}
      <div style={{
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#999' }}>今日消费</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>
            ¥{dateExpense.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
  <div style={{ fontSize: '11px', color: '#999' }}>月预算</div>
  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#61A2Da' }}>
    ¥{monthlyBudget.toFixed(0)}
  </div>
</div>
<div style={{ textAlign: 'center' }}>
  <div style={{ fontSize: '11px', color: '#999' }}>本月剩余</div>
  <div style={{ 
    fontSize: '18px', 
    fontWeight: 'bold', 
    color: (monthlyBudget - monthExpense) >= 0 ? '#4caf50' : '#f44336'
  }}>
    ¥{(monthlyBudget - monthExpense).toFixed(2)}
  </div>
</div>
      </div>
      
      {/* 添加消费表单 */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="金额"
            value={expenseInput}
            onChange={(e) => setExpenseInput(e.target.value)}
            style={{
              width: '80px',
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: 'center'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const amount = parseFloat(expenseInput);
                if (!isNaN(amount) && amount > 0) {
                  addExpense(amount, expenseNote);
                  setExpenseInput('');
                  setExpenseNote('');
                }
              }
            }}
          />
          <input
            type="text"
            placeholder="备注（可选）"
            value={expenseNote}
            onChange={(e) => setExpenseNote(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
              minWidth: '80px'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const amount = parseFloat(expenseInput);
                if (!isNaN(amount) && amount > 0) {
                  addExpense(amount, expenseNote);
                  setExpenseInput('');
                  setExpenseNote('');
                }
              }
            }}
          />
          <div
            onClick={() => {
              const amount = parseFloat(expenseInput);
              if (!isNaN(amount) && amount > 0) {
                addExpense(amount, expenseNote);
                setExpenseInput('');
                setExpenseNote('');
              } else {
                alert('请输入有效金额');
              }
            }}
            style={{
              padding: '6px 14px',
              backgroundColor: '#61A2Da',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            添加
          </div>
        </div>
      </div>
      
      {/* 消费记录列表 */}
    {/* 消费记录列表 */}
<div style={{
  flex: 1,
  overflowY: 'auto',
  padding: '12px 20px'
}}>
  {(() => {
    // 获取当前选中日期的消费记录
    const currentDateRecords = expenseRecords.filter(r => r.date === selectedDate);
    
    if (currentDateRecords.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '30px 0',
          color: '#999',
          fontSize: '13px'
        }}>
          {selectedDate === new Date().toISOString().split('T')[0] ? '今日' : selectedDate} 暂无消费记录
        </div>
      );
    }
    
    return currentDateRecords.map((record, idx) => (
      <div
        key={record.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: idx < currentDateRecords.length - 1 ? '1px solid #f5f5f5' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#f44336',
            minWidth: '60px'
          }}>
            -¥{record.amount.toFixed(2)}
          </span>
          {record.note && (
            <span style={{
              fontSize: '13px',
              color: '#666',
              flex: 1
            }}>
              {record.note}
            </span>
          )}
          <span style={{
            fontSize: '11px',
            color: '#999'
          }}>
            {new Date(record.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          onClick={() => deleteExpenseRecord(record.id)}
          style={{
            cursor: 'pointer',
            color: '#ccc',
            fontSize: '14px',
            padding: '0 4px'
          }}
        >
          ×
        </div>
      </div>
    ));
  })()}
</div>
      
      {/* 底部操作按钮 */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        gap: '10px',
        flexShrink: 0
      }}>
        <div
  onClick={() => {
    const newBudget = window.prompt('设置每月预算（元）：', monthlyBudget.toString());
    if (newBudget !== null) {
      const val = parseFloat(newBudget);
      if (!isNaN(val) && val > 0) {
        setMonthlyBudget(val);
        localStorage.setItem('monthly_budget', String(val));
      }
    }
  }}
  style={{
    flex: 1,
    padding: '8px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    borderRadius: '6px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '13px'
  }}
>
  设置预算
</div>
        <div
          onClick={resetTodayExpense}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#f5f5f5',
            color: '#f44336',
            borderRadius: '6px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          重置当日
        </div>
      </div>
      
    </div>
  </div>
)}
    {/* ===== 撒花动画 ===== */}
    {confettiParts.map(part => (
      <div
        key={part.id}
        style={{
          position: 'fixed',
          left: part.startX,
          top: part.startY,
          pointerEvents: 'none',
          zIndex: 9999,
          animation: `confettiPop 1.5s ease-out forwards`,
          animationDelay: `${part.delay}s`,
        }}
      >
        <img 
          src={part.imageUrl} 
          alt="congrats"
          style={{
            width: '100px',
            height: '100px',
            objectFit: 'contain',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
    ))}

    {/* ===== 同步状态提示 ===== */}
    {lastSyncStatus.message && (
      <div style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: lastSyncStatus.success === true ? '#28a745' : 
                         lastSyncStatus.success === false ? '#dc3545' : '#ffc107',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        zIndex: 2000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        fontFamily: 'sans-serif'
      }}>
        {lastSyncStatus.message}
      </div>
    )}

  </div>
);
}




  
  
  export default App
