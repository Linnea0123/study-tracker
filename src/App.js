
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

/* eslint-disable react-hooks/exhaustive-deps */  // 添加这一行
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';




const GradeModal = ({ onClose, isVisible }) => {
  const [expandedId, setExpandedId] = useState(null);
  const STORAGE_KEY = 'study-tracker-PAGE_A-v2';
  const [grades, setGrades] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('数学');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSubCategoryManager, setShowSubCategoryManager] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [isSortingSubCategories, setIsSortingSubCategories] = useState(false);
  const [tempSubCategories, setTempSubCategories] = useState([]);
  const dragSubCategoryIndex = useRef(null);
  const dragStartY = useRef(null);
  const touchStartIndex = useRef(null);
  const touchMoveIndex = useRef(null);

  const mainSubjects = ['数学', '语文', '英语'];
  
  const [subjectSubCategories, setSubjectSubCategories] = useState(() => {
    const saved = localStorage.getItem('grade_subcategories');
    return saved ? JSON.parse(saved) : {};
  });




  const [newGrade, setNewGrade] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '数学',
    subCategory: '',
    testContent: '',
    score: '',
    scoreType: '100分制',
    fullScore: '100',
    wrongQuestions: '',
    analysis: ''
  });

  const scoreTypes = [
    { value: '100分制', label: '100分制', maxScore: 100 },
    { value: '5星制', label: '5星制', maxScore: 5 },
    { value: '6星制', label: '6星制', maxScore: 6 },
    { value: '自定义', label: '自定义', maxScore: null }
  ];

  // 触摸拖拽开始
  const handleTouchStart = (e, index) => {
    if (!isSortingSubCategories) return;
    e.preventDefault();
    dragSubCategoryIndex.current = index;
    dragStartY.current = e.touches[0].clientY;
    e.currentTarget.style.opacity = '0.5';
  };

  // 触摸拖拽移动
  const handleTouchMove = (e, index) => {
    if (!isSortingSubCategories) return;
    if (dragSubCategoryIndex.current === null) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const startY = dragStartY.current;
    
    if (startY === null) return;

    const elements = document.querySelectorAll('[data-drag-index]');
    let targetIndex = dragSubCategoryIndex.current;
    
    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      if (currentY > centerY) {
        targetIndex = i;
      }
    }
    
    if (targetIndex !== dragSubCategoryIndex.current) {
      const newList = [...tempSubCategories];
      const draggedItem = newList[dragSubCategoryIndex.current];
      newList.splice(dragSubCategoryIndex.current, 1);
      newList.splice(targetIndex, 0, draggedItem);
      
      setTempSubCategories(newList);
      dragSubCategoryIndex.current = targetIndex;
      dragStartY.current = currentY;
    }
  };

  // 触摸拖拽结束
  const handleTouchEnd = (e) => {
    if (!isSortingSubCategories) return;
    e.preventDefault();
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '';
    }
    dragSubCategoryIndex.current = null;
    dragStartY.current = null;
  };

  // 开始排序
  const handleStartSorting = () => {
    const currentList = subjectSubCategories[selectedSubject] || [];
    setTempSubCategories([...currentList]);
    setIsSortingSubCategories(true);
  };

  // 完成排序并保存
  const handleFinishSorting = () => {
    setSubjectSubCategories(prev => ({
      ...prev,
      [selectedSubject]: [...tempSubCategories]
    }));
    setIsSortingSubCategories(false);
  };

  // 子分类拖拽开始
  const handleSubCategoryDragStart = (e, index) => {
    if (!isSortingSubCategories) {
      e.preventDefault();
      return false;
    }
    dragSubCategoryIndex.current = index;
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    e.currentTarget.style.opacity = '0.5';
    return true;
  };

  // 子分类拖拽结束
  const handleSubCategoryDragEnd = (e) => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '';
    }
    dragSubCategoryIndex.current = null;
  };

  // 子分类拖拽经过
  const handleSubCategoryDragOver = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (!isSortingSubCategories) return;
    if (dragSubCategoryIndex.current === null) return;
    if (dragSubCategoryIndex.current === targetIndex) return;
    
    const newList = [...tempSubCategories];
    const draggedItem = newList[dragSubCategoryIndex.current];
    newList.splice(dragSubCategoryIndex.current, 1);
    newList.splice(targetIndex, 0, draggedItem);
    
    setTempSubCategories(newList);
    dragSubCategoryIndex.current = targetIndex;
  };

  // 子分类拖拽放置
  const handleSubCategoryDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragSubCategoryIndex.current = null;
  };

  // 保存子分类到localStorage
  useEffect(() => {
    localStorage.setItem('grade_subcategories', JSON.stringify(subjectSubCategories));
  }, [subjectSubCategories]);

  // 初始化加载成绩数据
  useEffect(() => {
    const loadGrades = () => {
      try {
        const storageKey = `${STORAGE_KEY}_grades`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const savedGrades = JSON.parse(saved);
          const normalizedGrades = savedGrades.map(grade => ({
            ...grade,
            scoreType: grade.scoreType || '100分制',
            subCategory: grade.subCategory || ''
          }));
          setGrades(normalizedGrades);
        }
      } catch (error) {
        console.error('加载成绩数据失败:', error);
      }
    };
    
    if (isVisible) {
      loadGrades();
    }
  }, [isVisible]);

  // 保存成绩数据
  const saveGrades = (updatedGrades) => {
    setGrades(updatedGrades);
    try {
      const storageKey = `${STORAGE_KEY}_grades`;
      localStorage.setItem(storageKey, JSON.stringify(updatedGrades));
    } catch (error) {
      console.error('保存成绩数据失败:', error);
    }
  };

  // 重置表单
  const resetNewGradeForm = () => {
    setNewGrade({
      date: new Date().toISOString().split('T')[0],
      subject: selectedSubject,
      subCategory: '',
      testContent: '',
      score: '',
      scoreType: '100分制',
      fullScore: '100',
      wrongQuestions: '',
      analysis: ''
    });
  };

  // 添加新成绩记录
  const handleAddGrade = () => {
    if (!newGrade.testContent || !newGrade.score) {
      alert('请填写测试内容和得分');
      return;
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const updatedGrades = [...grades, {
      id: uniqueId,
      ...newGrade,
      subCategory: newGrade.subCategory || '未分类',
      isFullMark: parseInt(newGrade.score) === parseInt(newGrade.fullScore)
    }];
    
    saveGrades(updatedGrades);
    resetNewGradeForm();
    setShowAddForm(false);
    setEditingGrade(null);
  };

  // 开始编辑成绩
  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setSelectedSubject(grade.subject);
    setNewGrade({
      date: grade.date,
      subject: grade.subject,
      subCategory: grade.subCategory || '',
      testContent: grade.testContent,
      score: grade.score,
      scoreType: grade.scoreType || '100分制',
      fullScore: grade.fullScore || '100',
      wrongQuestions: grade.wrongQuestions || '',
      analysis: grade.analysis || ''
    });
    setShowAddForm(true);
  };

  // 保存编辑后的成绩
  const handleSaveEditGrade = () => {
    if (!newGrade.testContent || !newGrade.score) {
      alert('请填写测试内容和得分');
      return;
    }

    const updatedGrades = grades.map(grade => 
      grade.id === editingGrade.id ? {
        ...grade,
        ...newGrade,
        subCategory: newGrade.subCategory || '未分类',
        isFullMark: parseInt(newGrade.score) === parseInt(newGrade.fullScore)
      } : grade
    );
    
    saveGrades(updatedGrades);
    resetNewGradeForm();
    setShowAddForm(false);
    setEditingGrade(null);
  };

  // 删除成绩记录
  const handleDeleteGrade = (id) => {
    if (window.confirm('确定要删除这条成绩记录吗？')) {
      const updatedGrades = grades.filter(grade => grade.id !== id);
      saveGrades(updatedGrades);
    }
  };

  // 获取百分比分数
  const getPercentageScore = (grade) => {
    const score = parseInt(grade.score || 0);
    const fullScore = parseInt(grade.fullScore || 100);
    return Math.round((score / fullScore) * 100);
  };

  // 获取分数显示格式
  const getScoreDisplay = (grade) => {
    const score = parseInt(grade.score || 0);
    const fullScore = parseInt(grade.fullScore || 100);
    
    if (grade.scoreType && grade.scoreType.includes('星制')) {
      return `${score}星`;
    }
    return `${score}/${fullScore}`;
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setSelectedSubCategory(null);
  };

  const handleSubCategoryClick = (subCat) => {
    setSelectedSubCategory(subCat);
  };

  // 获取当前科目下的所有子分类
  const getCurrentSubCategories = () => {
    return subjectSubCategories[selectedSubject] || [];
  };

  // 获取筛选后的成绩
  const getFilteredGrades = () => {
    let filtered = grades.filter(grade => grade.subject === selectedSubject);
    
    if (selectedSubCategory) {
      filtered = filtered.filter(grade => grade.subCategory === selectedSubCategory);
    }
    
    return filtered;
  };

  // 生成图表数据
  const getChartData = () => {
    const filtered = getFilteredGrades();
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    
    return sorted.map(grade => ({
      id: grade.id,
      date: grade.date,
      label: grade.date.slice(5),
      score: getPercentageScore(grade),
      isFullMark: grade.isFullMark,
      testContent: grade.testContent,
      subCategory: grade.subCategory
    }));
  };

  // 统计信息
  const getStats = () => {
    const filtered = getFilteredGrades();
    if (filtered.length === 0) return { count: 0, avgScore: 0, fullMarks: 0 };
    
    const avgScore = filtered.reduce((sum, g) => sum + getPercentageScore(g), 0) / filtered.length;
    const fullMarks = filtered.filter(g => g.isFullMark).length;
    
    return {
      count: filtered.length,
      avgScore: Math.round(avgScore),
      fullMarks: fullMarks
    };
  };

  const stats = getStats();
  const chartData = getChartData();
  const currentSubCategories = getCurrentSubCategories();

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
      overflow: 'hidden'
    }}>
      <style>{`

/* 确保所有按钮都没有悬浮效果 */
button,
button:hover,
button:active,
button:focus,
div[onClick],
div[onClick]:hover,
div[onClick]:active {
  transition: none !important;
  transform: none !important;
  scale: 1 !important;
  background-color: #61A2Da !important;  /* 保持原色 */
  box-shadow: none !important;
  outline: none !important;
}



/* 禁用编辑模态框所有按钮的悬浮效果 */
.task-edit-modal button,
.task-edit-modal button:hover,
.task-edit-modal button:active,
.task-edit-modal button:focus {
  transform: none !important;
  scale: 1 !important;
  box-shadow: none !important;
  outline: none !important;
  transition: none !important;
}

/* 保存按钮单独保持背景色不变 */
.task-edit-modal .save-btn,
.task-edit-modal .save-btn:hover,
.task-edit-modal .save-btn:active {
  background-color: #61A2Da !important;
}

/* 禁用所有按钮的悬停效果 */
button,
button:hover,
button:active,
button:focus,
button:focus-visible {
  transition: none !important;
  transform: none !important;
  filter: none !important;
  box-shadow: none !important;
  outline: none !important;
}
  /* 👇 在这里添加新的 CSS */
.reflection-rating-btn,
.reflection-rating-btn:hover,
.reflection-rating-btn:active,
.reflection-rating-btn:focus {
  background-color: #f1f3f4 !important;
}

.reflection-rating-btn-active,
.reflection-rating-btn-active:hover,
.reflection-rating-btn-active:active,
.reflection-rating-btn-active:focus {
  background-color: #FFD700 !important;
}

      .grade-modal button.icon-btn,
.grade-modal button.icon-btn:hover,
.grade-modal button.icon-btn:active {
  background-color: transparent !important;
  background: transparent !important;
}

  /* 强制禁用所有按钮的动画和悬浮效果 - 只禁用效果，保留背景色和文字色 */
  .grade-modal button,
  .grade-modal button *,
  .grade-modal button:hover,
  .grade-modal button:active,
  .grade-modal button:focus,
  .grade-modal button:active:hover,
  .grade-modal button:focus:hover,
  .grade-modal button:focus-visible {
    opacity: 1 !important;
    transform: none !important;
    scale: 1 !important;
    box-shadow: none !important;
    outline: none !important;
    transition: none !important;
    animation: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  
  /* 添加新成绩按钮 */
  .grade-modal button.add-grade-btn,
  .grade-modal button.add-grade-btn:hover,
  .grade-modal button.add-grade-btn:active,
  .grade-modal button.add-grade-btn:focus {
    background-color: transparent !important;
   color: #999 !important;
  }
  
  /* 管理子分类按钮 */
  .grade-modal button.manage-subcat-btn,
  .grade-modal button.manage-subcat-btn:hover,
  .grade-modal button.manage-subcat-btn:active,
  .grade-modal button.manage-subcat-btn:focus {
    background-color: #61A2Da !important;
    color: white !important;
  }
  
  /* 科目按钮 - 选中状态 */
  .grade-modal button.subject-btn-selected,
  .grade-modal button.subject-btn-selected:hover,
  .grade-modal button.subject-btn-selected:active,
  .grade-modal button.subject-btn-selected:focus {
    background-color: #61A2Da !important;
    color: white !important;
  }
  
  /* 科目按钮 - 未选中状态 */
  .grade-modal button.subject-btn-unselected,
  .grade-modal button.subject-btn-unselected:hover,
  .grade-modal button.subject-btn-unselected:active,
  .grade-modal button.subject-btn-unselected:focus {
    background-color: #f0f0f0 !important;
    color: #333 !important;
  }
  
  /* 子分类按钮 - 选中状态 */
  .grade-modal button.subcat-btn-selected,
  .grade-modal button.subcat-btn-selected:hover,
  .grade-modal button.subcat-btn-selected:active,
  .grade-modal button.subcat-btn-selected:focus {
    background-color: #61A2Da !important;
    color: white !important;
  }
  
  /* 子分类按钮 - 未选中状态 */
  .grade-modal button.subcat-btn-unselected,
  .grade-modal button.subcat-btn-unselected:hover,
  .grade-modal button.subcat-btn-unselected:active,
  .grade-modal button.subcat-btn-unselected:focus {
    background-color: #f0f0f0 !important;
    color: #333 !important;
  }
  
  /* 添加子分类按钮 - 始终绿色 */
  .grade-modal button.add-subcat-btn,
  .grade-modal button.add-subcat-btn:hover,
  .grade-modal button.add-subcat-btn:active,
  .grade-modal button.add-subcat-btn:focus {
    background-color: #61A2Da !important;
    color: white !important;
  }
  
 .grade-modal button.sort-btn,
  .grade-modal button.sort-btn:hover,
  .grade-modal button.sort-btn:active,
  .grade-modal button.sort-btn:focus,
  .grade-modal button.sort-btn:active:hover,
  .grade-modal button.sort-btn:focus:hover,
  .grade-modal button.sort-btn:focus-visible {
    background-color: #61A2Da !important;
    color: #ffffff !important;
    border: none !important;
    transform: none !important;
    box-shadow: none !important;
    outline: none !important;
    opacity: 1 !important;
  }

  /* 排序按钮 - 排序中状态（蓝色） */
  .grade-modal button.sorting-active-btn,
  .grade-modal button.sorting-active-btn:hover,
  .grade-modal button.sorting-active-btn:active,
  .grade-modal button.sorting-active-btn:focus {
    background-color: #61A2Da !important;
    color: white !important;
  }

  
`}</style>
      
      <div className="grade-modal" style={{
  backgroundColor: '#f5faff',
  padding: '15px',
  borderRadius: 0,
  width: '100%',
  maxWidth: '600px',
  height: '100%',
  maxHeight: '100%',
  overflow: 'auto',
  WebkitOverflowScrolling: 'touch',
  margin: '0 auto',
  position: 'relative',
  overscrollBehavior: 'contain'
}}>
  {/* 标题栏 - 图标在标题右侧、关闭按钮左侧 */}
  <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px'
}}>
  {/* 左侧占位 - 宽度与右侧按钮组相同，保持标题居中 */}
  <div style={{ width: '100px' }}></div>
    <h2 style={{ 
      textAlign: 'center', 
      margin: 0,
      color: '#61A2Da',
      fontSize: '20px'
    }}>
      成绩记录
    </h2>
    
    {/* 图标按钮组 - 放在标题右侧 */}
  {/* 右侧按钮组 - 统一尺寸，中心对齐 */}
<div style={{
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  height: '28px'
}}>
  {/* 添加新成绩 - 加号图标（灰色） */}
  <button
    className="add-grade-btn icon-btn"
    onClick={() => {
      setShowAddForm(!showAddForm);
      if (!showAddForm) {
        resetNewGradeForm();
        setEditingGrade(null);
      }
    }}
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
    title={showAddForm ? '取消添加' : '添加新成绩'}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="4" x2="12" y2="20" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </button>

  {/* 管理子分类 - 铅笔图标（灰色） */}
  <button
    className="add-grade-btn icon-btn"
    onClick={() => setShowSubCategoryManager(!showSubCategoryManager)}
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
    title={showSubCategoryManager ? '关闭管理' : '管理子分类'}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M17 3L21 7L7 21H3L3 17L17 3Z" 
        stroke="#999" 
        strokeWidth="1.8" 
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path 
        d="M15 5L19 9" 
        stroke="#999" 
        strokeWidth="1.8" 
        strokeLinecap="round"
      />
    </svg>
  </button>

  {/* 关闭按钮 - 悬浮变色（灰色变深灰） */}
  <button
   className="add-grade-btn icon-btn"
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
    onMouseEnter={(e) => e.currentTarget.style.color = '#999'}
    onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
    title="关闭"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </button>
</div>
  </div>
  {/* 科目按钮 */}
  <div style={{
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    justifyContent: 'center'
  }}>
    {mainSubjects.map(subject => (
      <button
        key={subject}
        className={selectedSubject === subject ? 'subject-btn-selected' : 'subject-btn-unselected'}
        onClick={() => handleSubjectClick(subject)}
        style={{
          flex: 1,
          padding: '5px 8px',
          backgroundColor: selectedSubject === subject ? '#61A2Da' : '#f0f0f0',
          color: selectedSubject === subject ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {subject}
      </button>
    ))}
  </div>

  {/* 子分类按钮 */}
  {currentSubCategories.length > 0 && (
    <div style={{
      display: 'flex',
      gap: '6px',
      marginBottom: '12px',
      flexWrap: 'wrap',
      justifyContent: 'left'
    }}>
      <button
        className={selectedSubCategory === null ? 'subcat-btn-selected' : 'subcat-btn-unselected'}
        onClick={() => handleSubCategoryClick(null)}
        style={{
          padding: '4px 10px',
          backgroundColor: selectedSubCategory === null ? '#61A2Da' : '#f0f0f0',
          color: selectedSubCategory === null ? 'white' : '#333',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '11px',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        全部
      </button>
      {currentSubCategories.map(subCat => (
        <button
          key={subCat}
          className={selectedSubCategory === subCat ? 'subcat-btn-selected' : 'subcat-btn-unselected'}
          onClick={() => handleSubCategoryClick(subCat)}
          style={{
            padding: '4px 10px',
            backgroundColor: selectedSubCategory === subCat ? '#61A2Da' : '#f0f0f0',
            color: selectedSubCategory === subCat ? 'white' : '#333',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '11px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {subCat}
        </button>
      ))}
    </div>
  )}

  {/* 统计卡片 */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px'
  }}>
    <div style={{
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>测试次数</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a73e8' }}>{stats.count}</div>
    </div>
    
    <div style={{
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>平均分</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.avgScore}</div>
    </div>
    
    <div style={{
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>满分次数</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{stats.fullMarks}</div>
    </div>
  </div>

  {/* 成绩趋势图表 */}
  {chartData.length > 0 ? (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ 
        marginBottom: '15px', 
        fontSize: '14px', 
        textAlign: 'center', 
        color: '#333'
      }}>
        {selectedSubCategory 
          ? `${selectedSubject} - ${selectedSubCategory} 成绩趋势`
          : `${selectedSubject} 成绩趋势`
        }
      </h3>
      
      <div style={{ minWidth: '300px' }}>
        {chartData.map((item) => {
          const percentage = item.score;
          const getBarColor = (score) => {
            if (item.isFullMark) return '#4caf50';
            if (score >= 90) return '#1a73e8';
            if (score >= 75) return '#4285f4';
            if (score >= 60) return '#669df6';
            return '#a0c4ff';
          };
          const barColor = getBarColor(percentage);
          const originalGrade = grades.find(g => g.id === item.id);
          
          return (
            <div
              key={item.id}
              style={{
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                width: '100%',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (originalGrade) {
                  handleEditGrade(originalGrade);
                }
              }}
            >
              <div style={{
                width: '100px',
                flexShrink: 0,
                fontSize: '11px',
                color: '#555'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  gap: '4px',
                  flexWrap: 'wrap',
                  marginBottom: '2px'
                }}>
                  <span style={{ fontWeight: 'bold', color: barColor }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  color: '#999',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: '1.3'
                }}>
                  {item.testContent}
                </div>
              </div>
              
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '100%',
                  height: '28px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '14px',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px',
                    color: percentage > 40 ? 'white' : '#333',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {percentage}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '16px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '10px', backgroundColor: '#1a73e8', borderRadius: '5px' }}></div>
          <span>普通成绩</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '10px', backgroundColor: '#4caf50', borderRadius: '5px' }}></div>
          <span>满分成绩</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>共 {chartData.length} 条</span>
        </div>
      </div>
    </div>
  ) : (
    <div style={{
      marginBottom: '20px',
      padding: '40px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      textAlign: 'center',
      color: '#666'
    }}>
      📊 暂无成绩数据
      <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
        {selectedSubCategory 
          ? `暂无 ${selectedSubject} - ${selectedSubCategory} 的成绩记录`
          : `暂无 ${selectedSubject} 的成绩记录`
        }
      </div>
    </div>
  )}

  {/* 复盘记录 */}
  {(() => {
    const reviewRecords = getFilteredGrades()
      .filter(grade => grade.analysis && grade.analysis.trim())
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (reviewRecords.length === 0) return null;
    
    return (
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          fontSize: '14px', 
          marginBottom: '12px', 
          color: '#4caf50',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>📝</span> 复盘记录 ({reviewRecords.length})
        </h3>
        
        {reviewRecords.map((grade, idx) => (
          <div 
            key={grade.id} 
            onClick={() => handleEditGrade(grade)}
            style={{
              padding: '12px',
              borderBottom: idx < reviewRecords.length - 1 ? '1px solid #eee' : 'none',
              backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white',
              borderRadius: idx === 0 ? '8px 8px 0 0' : idx === reviewRecords.length - 1 ? '0 0 8px 8px' : '0',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e3f2fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fafafa' : 'white';
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {grade.testContent}
                </span>
                {grade.subCategory && (
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#fff', 
                    backgroundColor: '#1a73e8',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {grade.subCategory}
                  </span>
                )}
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#1a73e8'
                }}>
                  {getScoreDisplay(grade)}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#999' }}>
                📅 {grade.date}
              </span>
            </div>
            
            <div style={{ 
              fontSize: '13px', 
              color: '#333',
              lineHeight: '1.5',
              backgroundColor: '#e8f5e9',
              padding: '10px',
              borderRadius: '8px',
              borderLeft: '3px solid #4caf50',
              marginTop: '6px'
            }}>
              💡 {grade.analysis}
            </div>
          </div>
        ))}
      </div>
    );
  })()}

  {/* 添加/编辑成绩表单弹窗 */}
  {showAddForm && (
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
    }} onClick={(e) => {
      if (e.target === e.currentTarget) {
        setShowAddForm(false);
        setEditingGrade(null);
        resetNewGradeForm();
      }
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px 16px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }} onClick={e => e.stopPropagation()}>
        
        <button
          onClick={() => {
            setShowAddForm(false);
            setEditingGrade(null);
            resetNewGradeForm();
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'transparent',
            border: 'none',
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
            zIndex: 10
          }}
        >
          ×
        </button>

        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#61A2Da',
          fontSize: '16px',
          padding: '0 24px'
        }}>
          {editingGrade ? '编辑成绩记录' : '添加新成绩记录'}
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: '500' }}>
              日期
            </label>
            <input
              type="date"
              value={newGrade.date}
              onChange={(e) => setNewGrade({...newGrade, date: e.target.value})}
              style={{
                width: '100%',
                height: 40,
                padding: '0 10px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
                backgroundColor: 'white',
                WebkitAppearance: 'none',
                appearance: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
         
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: '500' }}>
                科目
              </label>
              <select
                value={newGrade.subject}
                onChange={(e) => {
                  setNewGrade({
                    ...newGrade,
                    subject: e.target.value,
                    subCategory: ''
                  });
                }}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                {mainSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: '500' }}>
                子分类
                <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>
                  (可选)
                </span>
              </label>
              <select
                value={newGrade.subCategory}
                onChange={(e) => {
                  setNewGrade({...newGrade, subCategory: e.target.value});
                }}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'menulist',
                  appearance: 'menulist'
                }}
              >
                <option value="">选择子分类</option>
                {(subjectSubCategories[newGrade.subject] || []).map(subCat => (
                  <option key={subCat} value={subCat}>{subCat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
              测试内容
            </label>
            <input
              type="text"
              value={newGrade.testContent}
              onChange={(e) => setNewGrade({...newGrade, testContent: e.target.value})}
              placeholder="如：单元测试、期中考试等"
              style={{
                width: '100%',
                height: '40px',
                padding: '0 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                分数类型
              </label>
              <select
                value={newGrade.scoreType}
                onChange={(e) => {
                  const selectedType = scoreTypes.find(type => type.value === e.target.value);
                  setNewGrade({
                    ...newGrade,
                    scoreType: e.target.value,
                    fullScore: selectedType?.maxScore ? selectedType.maxScore.toString() : newGrade.fullScore,
                    score: ''
                  });
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                {scoreTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                  {newGrade.scoreType.includes('星制') ? '星级' : '得分'}
                </label>
                <input
                  type="number"
                  value={newGrade.score}
                  onChange={(e) => setNewGrade({...newGrade, score: e.target.value})}
                  min="0"
                  max={newGrade.fullScore}
                  step="1"
                  placeholder={`0-${newGrade.fullScore}`}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                  {newGrade.scoreType.includes('星制') ? '总星级' : '满分'}
                </label>
                {newGrade.scoreType === '自定义' ? (
                  <input
                    type="number"
                    value={newGrade.fullScore}
                    onChange={(e) => setNewGrade({...newGrade, fullScore: e.target.value})}
                    placeholder="输入满分值"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                ) : (
                  <input
                    type="number"
                    value={newGrade.fullScore}
                    readOnly
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
              📝 复盘
            </label>
            <textarea
              value={newGrade.analysis}
              onChange={(e) => {
                setNewGrade({...newGrade, analysis: e.target.value});
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="记录学习总结、经验教训和改进计划..."
              rows="1"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                overflow: 'hidden',
                minHeight: '40px'
              }}
              onFocus={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 8
          }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (editingGrade) {
                  handleSaveEditGrade();
                } else {
                  handleAddGrade();
                }
              }}
              style={{
                flex: 1,
                padding: 14,
                backgroundColor: '#61A2Da',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: '500'
              }}
            >
              {editingGrade ? '保存修改' : '添加记录'}
            </button>

            {editingGrade && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteGrade(editingGrade.id);
                  setShowAddForm(false);
                  setEditingGrade(null);
                  resetNewGradeForm();
                }}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: '500'
                }}
              >
                删除记录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  {/* 子分类管理弹窗 */}
  {showSubCategoryManager && (
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
    }} onClick={() => {
      setShowSubCategoryManager(false);
      setIsSortingSubCategories(false);
      setTempSubCategories([]);
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px 16px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }} onClick={e => e.stopPropagation()}>
        
        <button
          onClick={() => setShowSubCategoryManager(false)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'transparent',
            border: 'none',
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
            zIndex: 10
          }}
        >
          ×
        </button>

        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#61A2Da',
          fontSize: '18px'
        }}>
          管理子分类
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '500' 
          }}>
            选择科目
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setIsSortingSubCategories(false);
              setTempSubCategories([]);
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            {mainSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                className="add-subcat-btn"
                onClick={() => {
                  const newSubCat = window.prompt(`为 ${selectedSubject} 添加新子分类名称:`);
                  if (newSubCat && newSubCat.trim()) {
                    setSubjectSubCategories(prev => ({
                      ...prev,
                      [selectedSubject]: [...(prev[selectedSubject] || []), newSubCat.trim()]
                    }));
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#61A2Da',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                添加新子分类
              </button>

              <button
                className={isSortingSubCategories ? 'sorting-active-btn' : 'sort-btn'}
                onClick={isSortingSubCategories ? handleFinishSorting : handleStartSorting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: isSortingSubCategories ? '#61A2Da' : '#f0f0f0',
                  color: isSortingSubCategories ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isSortingSubCategories ? '✓ 完成排序' : '排序'}
              </button>
            </div>
            <div>
              <div style={{ 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#666'
              }}>
                现有子分类 ({subjectSubCategories[selectedSubject]?.length || 0})
              </div>
              
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {(isSortingSubCategories ? tempSubCategories : (subjectSubCategories[selectedSubject] || [])).length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '30px', 
                    color: '#999',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    暂无子分类，点击上方按钮添加
                  </div>
                ) : (
                  (isSortingSubCategories ? tempSubCategories : (subjectSubCategories[selectedSubject] || [])).map((subCat, index) => (
                    <div
                      key={`${subCat}_${index}`}
                      data-drag-index={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#fff',
                        cursor: isSortingSubCategories ? 'grab' : 'default',
                        userSelect: isSortingSubCategories ? 'none' : 'auto',
                        touchAction: isSortingSubCategories ? 'none' : 'auto',
                        transition: 'none'
                      }}
                      onTouchStart={(e) => {
                        if (!isSortingSubCategories) return;
                        e.preventDefault();
                        const touch = e.touches[0];
                        dragSubCategoryIndex.current = index;
                        dragStartY.current = touch.clientY;
                      }}
                      onTouchMove={(e) => {
                        if (!isSortingSubCategories) return;
                        if (dragSubCategoryIndex.current === null) return;
                        e.preventDefault();
                        
                        const touch = e.touches[0];
                        const currentY = touch.clientY;
                        const startY = dragStartY.current;
                        
                        if (startY === null) return;
                        
                        const elements = document.querySelectorAll('[data-drag-index]');
                        let targetIndex = dragSubCategoryIndex.current;
                        
                        for (let i = 0; i < elements.length; i++) {
                          const rect = elements[i].getBoundingClientRect();
                          const centerY = rect.top + rect.height / 2;
                          if (currentY > centerY) {
                            targetIndex = i;
                          }
                        }
                        
                        if (targetIndex !== dragSubCategoryIndex.current) {
                          const newList = [...tempSubCategories];
                          const draggedItem = newList[dragSubCategoryIndex.current];
                          newList.splice(dragSubCategoryIndex.current, 1);
                          newList.splice(targetIndex, 0, draggedItem);
                          
                          setTempSubCategories(newList);
                          dragSubCategoryIndex.current = targetIndex;
                          dragStartY.current = currentY;
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (!isSortingSubCategories) return;
                        e.preventDefault();
                        dragSubCategoryIndex.current = null;
                        dragStartY.current = null;
                      }}
                      draggable={isSortingSubCategories}
                      onDragStart={(e) => {
                        if (!isSortingSubCategories) {
                          e.preventDefault();
                          return false;
                        }
                        dragSubCategoryIndex.current = index;
                        e.dataTransfer.setData('text/plain', index.toString());
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setDragImage(new Image(), 0, 0);
                        return true;
                      }}
                      onDragEnd={(e) => {
                        dragSubCategoryIndex.current = null;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!isSortingSubCategories) return;
                        if (dragSubCategoryIndex.current === null) return;
                        if (dragSubCategoryIndex.current === index) return;
                        
                        const newList = [...tempSubCategories];
                        const draggedItem = newList[dragSubCategoryIndex.current];
                        newList.splice(dragSubCategoryIndex.current, 1);
                        newList.splice(index, 0, draggedItem);
                        
                        setTempSubCategories(newList);
                        dragSubCategoryIndex.current = index;
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        dragSubCategoryIndex.current = null;
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{subCat}</span>
                      
                      {isSortingSubCategories ? (
                        <div
                          style={{
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px'
                          }}
                          title="拖拽调整顺序"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="5" y1="6" x2="19" y2="6" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="5" y1="12" x2="19" y2="12" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="5" y1="18" x2="19" y2="18" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSortingSubCategories) return;
                              const newSubCat = window.prompt(`编辑子分类 "${subCat}" 的新名称:`, subCat);
                              if (newSubCat && newSubCat.trim() && newSubCat.trim() !== subCat) {
                                const trimmedNew = newSubCat.trim();
                                const currentList = subjectSubCategories[selectedSubject] || [];
                                
                                if (currentList.includes(trimmedNew)) {
                                  alert('该子分类名称已存在！');
                                  return;
                                }
                                
                                setSubjectSubCategories(prev => {
                                  const updatedList = prev[selectedSubject].map(s => 
                                    s === subCat ? trimmedNew : s
                                  );
                                  return {
                                    ...prev,
                                    [selectedSubject]: updatedList
                                  };
                                });
                                
                                const updatedGrades = grades.map(grade => {
                                  if (grade.subject === selectedSubject && grade.subCategory === subCat) {
                                    return { ...grade, subCategory: trimmedNew };
                                  }
                                  return grade;
                                });
                                saveGrades(updatedGrades);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#FFC107',
                              color: '#333',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isSortingSubCategories ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              opacity: isSortingSubCategories ? 0.5 : 1
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSortingSubCategories) return;
                              if (window.confirm(`确定要删除子分类 "${subCat}" 吗？\n\n删除后，该分类下的所有成绩记录也会被删除！`)) {
                                setSubjectSubCategories(prev => ({
                                  ...prev,
                                  [selectedSubject]: prev[selectedSubject].filter(s => s !== subCat)
                                }));
                                
                                const updatedGrades = grades.filter(g => 
                                  !(g.subject === selectedSubject && g.subCategory === subCat)
                                );
                                saveGrades(updatedGrades);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isSortingSubCategories ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              opacity: isSortingSubCategories ? 0.5 : 1
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )}
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

  const getCategoryColor = (catName) => {
    switch(catName) {
      case '语文': return '#FFFCE8';
      case '数学': return '#E8F5E9';
      case '英语': return '#FCE4EC';
      case '科学': return '#E1F5FE';
      case '运动': return '#E3F2FD';
      case '校内': return '#61A2Da';
      default: return '#f0f0f0';
    }
  };

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
                            📝 {record.note}
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

const TimeEditModal = ({ task, onClose, onSave, onEditRecord, onDeleteRecord, toggleDone }) => {
  const [addMinutes, setAddMinutes] = useState('');
  const [note, setNote] = useState('');
  const [editingHistoryRecord, setEditingHistoryRecord] = useState(null);
  const [editHistoryMinutes, setEditHistoryMinutes] = useState('');
  const timeRecords = task.timeRecords || [];

 const handleSave = () => {
  const minutes = parseInt(addMinutes);
  if (isNaN(minutes) || minutes <= 0) {
    alert('请输入有效的分钟数（大于0）');
    return;
  }
  
  // ✅ 关键修改：保存时间后，自动将任务标记为完成
  if (onSave) {
    onSave(task, minutes, note);
  }
  
  // ✅ 新增：自动勾选任务完成（如果尚未完成）
  if (task.done !== true && typeof toggleDone === 'function') {
    toggleDone(task);
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
        overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#61A2Da' }}>
          增加学习时间
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>
            本次学习时长（分钟）
          </label>
          <input
            type="number"
            placeholder=""
            value={addMinutes}
            onChange={(e) => setAddMinutes(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>
            备注
          </label>
          <textarea
            placeholder=""
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
              fontSize: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              boxSizing: 'border-box',
              resize: 'none',
              fontFamily: 'inherit',
              minHeight: '40px',
              overflow: 'hidden'
            }}
          />
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          backgroundColor: '#e8f0fe', 
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '13px', color: '#666' }}>当前总时间：</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#61A2Da' }}>
            {Math.floor((task.timeSpent || 0) / 60)}
          </span>
          <span style={{ fontSize: '13px', color: '#666' }}> 分钟</span>
        </div>
        
        {timeRecords.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              历史记录
            </div>
            <div style={{ 
              maxHeight: '150px', 
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              {timeRecords.map((record, idx) => (
                <div key={idx} style={{ padding: '6px 0', borderBottom: idx < timeRecords.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: '#e8f0fe', padding: '2px 8px', borderRadius: '16px', fontSize: '11px', color: '#61A2Da' }}>
                        {record.time || '--:--'}
                      </span>
                      
                      {editingHistoryRecord?.recordIndex === idx ? (
                        <input
                          type="number"
                          value={editHistoryMinutes}
                          onChange={(e) => setEditHistoryMinutes(e.target.value)}
                          onBlur={() => {
                            const newMinutes = parseInt(editHistoryMinutes);
                            if (!isNaN(newMinutes) && newMinutes > 0) {
                              onEditRecord?.(task, idx, newMinutes);
                            }
                            setEditingHistoryRecord(null);
                            setEditHistoryMinutes('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newMinutes = parseInt(editHistoryMinutes);
                              if (!isNaN(newMinutes) && newMinutes > 0) {
                                onEditRecord?.(task, idx, newMinutes);
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
                            setEditingHistoryRecord({ recordIndex: idx });
                            setEditHistoryMinutes(record.change.toString());
                          }}
                          style={{ 
                            fontWeight: 'bold', 
                            color: '#4caf50',
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
                      📝 {record.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <div
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            取消
          </div>
          <div
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#61A2Da',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            确认增加
          </div>
        </div>
      </div>
    </div>
  );
};



const ReflectionModalContent = ({ initialRating, initialReflection, studyEndHour, studyEndMinute, onSave, onClose }) => {
  const [rating, setRating] = useState(initialRating);
  const [reflection, setReflection] = useState(initialReflection);
  const [localEndHour, setLocalEndHour] = useState(studyEndHour);
  const [localEndMinute, setLocalEndMinute] = useState(studyEndMinute);

  // 调试：打印当前 rating
  console.log('当前选中的评分:', rating);

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
      
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="记录今日的学习收获、反思和改进点..."
        style={{
          width: '100%',
          minHeight: '100px',
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

{/* 结束时间 */}
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '13px', fontWeight: 'bold' }}>
    ⏰ 学习结束时间
  </label>
  <div style={{ 
    display: 'flex', 
    gap: '8px', 
    alignItems: 'center',
    flexWrap: 'wrap'  // 允许换行
  }}>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1', minWidth: '120px' }}>
      <input 
        type="number" 
        placeholder="时" 
        value={localEndHour} 
        onChange={(e) => setLocalEndHour(e.target.value)} 
        style={{ 
          flex: 1, 
          padding: '8px', 
          border: '1px solid #ccc', 
          borderRadius: 4, 
          textAlign: 'center',
          minWidth: '50px'
        }} 
      />
      <span>:</span>
      <input 
        type="number" 
        placeholder="分" 
        value={localEndMinute} 
        onChange={(e) => setLocalEndMinute(e.target.value)} 
        style={{ 
          flex: 1, 
          padding: '8px', 
          border: '1px solid #ccc', 
          borderRadius: 4, 
          textAlign: 'center',
          minWidth: '50px'
        }} 
      />
    </div>
    <button 
      onClick={() => { setLocalEndHour(''); setLocalEndMinute(''); }} 
      style={{ 
        padding: '8px 16px', 
        backgroundColor: '#f0f0f0', 
        border: 'none', 
        borderRadius: 4, 
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      清除
    </button>
  </div>
</div>

      {/* 评分选择 - 使用 div 避开全局 CSS */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '13px', fontWeight: 'bold' }}>今日状态</label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {[
            { value: 1, emoji: '😞' },
            { value: 2, emoji: '😕'},
            { value: 3, emoji: '😐' },
            { value: 4, emoji: '😊' },
            { value: 5, emoji: '🥳' }
          ].map((item) => (
            <div
              key={item.value}
              onClick={() => {
                console.log('点击评分:', item.value);
                setRating(item.value);
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                backgroundColor: rating === item.value ? '#FFD700' : '#f1f3f4',
                fontSize: 24,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>{item.emoji}</span>
              <span style={{ fontSize: 10, color: '#666' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 按钮区域 */}
      <div style={{ display: 'flex', gap: '8px' }}>
  {/* 取消按钮 - 无悬浮效果 */}
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
      cursor: 'pointer',
      transition: 'none',
      transform: 'none',
      boxShadow: 'none'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f0f0f0';
      e.currentTarget.style.transform = 'none';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#f0f0f0';
      e.currentTarget.style.transform = 'none';
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.transform = 'none';
    }}
  >
    取消
  </div>
  
  {/* 保存按钮 - 蓝色与本月按钮一致 (#61A2Da)，无悬浮效果 */}
  <div
    onClick={() => onSave(rating, reflection, localEndHour, localEndMinute)}
    style={{
      flex: 1,
      padding: '8px',
      backgroundColor: '#61A2Da',
      color: '#fff',
      borderRadius: 6,
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'none',
      transform: 'none',
      boxShadow: 'none'
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
    保存
  </div>
</div>

    </div>
  );
};



// 修改 baseCategories 的颜色
const baseCategories = [
  { 
    name: "校内", 
    color: "#61A2Da",  // 保持蓝色不变
    subCategories: ["数学", "语文", "英语", "运动"]
  },
  { name: "语文", color: "#FFFCE8", textColor: "#333" },
  { name: "数学", color: "#E8F5E9", textColor: "#333" },
  { name: "英语", color: "#FCE4EC", textColor: "#333" },
  { name: "科学", color: "#E1F5FE", textColor: "#333" },
  { name: "运动", color: "#E3F2FD", textColor: "#333" }
];
// 保持这样就行
const PAGE_ID = 'PAGE_A'; 
const STORAGE_KEY = `study-tracker-${PAGE_ID}-v2`;



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
  const [autoSync, setAutoSync] = useState(config.autoSync !== undefined ? config.autoSync : true); // 确保默认为 true
  const [gistId, setGistId] = useState(config.gistId || '');

  const handleSave = () => {
    if (!token.trim()) {
      alert('请输入 GitHub Token');
      return;
    }
    onSave({ token, autoSync, gistId });
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
          ☁️ GitHub 同步设置
        </h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            GitHub Personal Access Token:
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入 GitHub Token"
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14
            }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            需要 gist 权限。获取地址：<br/>
            https://github.com/settings/tokens
          </div>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Gist ID (可选):
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
              fontSize: 14
            }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            如果已有备份，输入 Gist ID 继续使用
          </div>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            <span>自动同步（每30分钟）</span>
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
            file.filename.includes('study-tracker') || 
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
      file.filename.includes('study-tracker') || 
      file.filename.includes('json') ||
      file.filename.includes('backup') ||
      file.filename === 'study-tracker-data.json'
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
    
    // 移除格式验证，让 GitHub API 自己处理
    console.log('尝试获取 Gist ID:', gistId);
    
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

      if (window.confirm('确定要恢复这个备份吗？当前数据将被覆盖！')) {
        onRestore(data);
        onClose();
      }
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
    const currentGrades = await loadMainData('grades') || [];
    
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
      grades: currentGrades,
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
        gradesCount: (data?.grades || []).length,
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
      await saveMainData('grades', backupData.grades || []);  // 恢复成绩记录
      
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
    const keys = ['tasks', 'templates', 'categories'];
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
      const keys = ['tasks', 'templates',  'categories'];
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
      
      const keys = ['tasks', 'templates'];
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



const getMonday = (date) => {
  // 修复：使用本地日期而不是UTC
  const d = new Date(date);
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const day = localDate.getDay();
  
  // 计算到本周一的差值
  const diff = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
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
  
  // 获取所有日期的任务，用于检查跨日期任务是否在其他日期完成
  const allTasksByDate = tasksByDate || {};
  const allDates = Object.keys(allTasksByDate);
  
  // 辅助函数：检查跨日期任务是否已在任何日期完成
  const isCrossDateTaskCompletedAnywhere = (crossDateId, currentDate) => {
    if (!crossDateId) return false;
    for (const date of allDates) {
      // 跳过当前日期本身
      if (date === currentDate) continue;
      const tasksOnDate = allTasksByDate[date] || [];
      const taskOnDate = tasksOnDate.find(t => t.crossDateId === crossDateId);
      if (taskOnDate?.done === true) {
        return true;
      }
    }
    return false;
  };
  
  // 获取跨日期任务在其他日期的完成日期（用于显示）
  const getCompletedDate = (crossDateId) => {
    if (!crossDateId) return null;
    for (const date of allDates) {
      const tasksOnDate = allTasksByDate[date] || [];
      const taskOnDate = tasksOnDate.find(t => t.crossDateId === crossDateId);
      if (taskOnDate?.done === true) {
        return date;
      }
    }
    return null;
  };
  
  // 辅助函数：判断任务是否应该在当前日期显示
  const shouldShowTaskOnCurrentDate = (task, currentDate) => {
    // 放弃的任务始终显示
    if (task.abandoned) return true;
    
    // 如果是跨日期任务
    if (task.crossDateId) {
      // ✅ 关键修改：检查这个任务是否已经在其他日期完成了
      const completedElsewhere = isCrossDateTaskCompletedAnywhere(task.crossDateId, currentDate);
      
      if (completedElsewhere) {
        // 已经在其他日期完成，不在当前日期显示
        return false;
      }
      
      // 如果当前日期本身已经完成，显示
      if (task.done === true) {
        return true;
      }
      
      // 未完成的任务，显示
      return true;
    }
    // 普通任务总是显示
    return true;
  };
  
  // 辅助函数：获取任务的完成状态
  const getTaskCompletedStatus = (task, currentDate) => {
    if (task.abandoned) return false;
    
    if (task.crossDateId) {
      // ✅ 检查是否在任何日期完成
      const completedAnywhere = isCrossDateTaskCompletedAnywhere(task.crossDateId, currentDate);
      // 或者当前日期本身已完成
      return completedAnywhere || task.done === true;
    }
    return task.done === true;
  };
  
  // 筛选当前日期应该显示的任务
  let filteredTasks = dayTasks.filter(task => {
    // 排除常规任务（常规任务单独处理）
    if (task.isRegularTask) return false;
    // 排除本周任务
    if (task.category === "本周任务") return false;
    // 判断是否应该显示
    if (!shouldShowTaskOnCurrentDate(task, selectedDate)) return false;
    return true;
  });
  
  // 常规任务：只显示未完成的
  const regularTasks = dayTasks.filter(task => {
    if (task.isRegularTask && !task.done && task.category !== "本周任务") {
      return true;
    }
    return false;
  });
  
  // 合并常规任务
  filteredTasks = [...filteredTasks, ...regularTasks];
  
  // 按分类和子分类组织任务
  const tasksByCategory = {};
  
  filteredTasks.forEach(task => {
    const isCompleted = getTaskCompletedStatus(task, selectedDate);
    
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = {
        withSubCategories: {},
        withoutSubCategories: []
      };
    }
    
    const taskWithStatus = { ...task, isCompleted };
    
    if (task.subCategory) {
      if (!tasksByCategory[task.category].withSubCategories[task.subCategory]) {
        tasksByCategory[task.category].withSubCategories[task.subCategory] = [];
      }
      tasksByCategory[task.category].withSubCategories[task.subCategory].push(taskWithStatus);
    } else {
      tasksByCategory[task.category].withoutSubCategories.push(taskWithStatus);
    }
  });
  
  // 统计当前日期实际显示的任务
  const totalTasksCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => getTaskCompletedStatus(t, selectedDate)).length;
  
  const totalTime = filteredTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
  const totalMinutes = Math.floor(totalTime / 60);
  
  const newStats = {
    completedTasks: completedCount,
    incompleteTasks: totalTasksCount - completedCount,
    abandonedTasks: filteredTasks.filter(t => t.abandoned).length,
    totalTasks: totalTasksCount,
    completionRate: totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0,
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
                
                return task.isCompleted ? (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginLeft: '12px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                    </svg>
                    <span style={{ fontSize: '12px', color: '#333' }}>{task.text}</span>
                    {timeText && <span style={{ fontSize: '10px', color: '#999' }}>{timeText}</span>}
                  </div>
                ) : (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginLeft: '12px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                      <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                    </svg>
                    <span style={{ fontSize: '12px', color: '#999' }}>{task.text}</span>
                    {timeText && <span style={{ fontSize: '10px', color: '#999' }}>{timeText}</span>}
                  </div>
                );
              })}
              
              {/* 有子分类的任务 */}
              {Object.entries(categoryData.withSubCategories).map(([subCategory, subTasks]) => (
                <div key={subCategory} style={{ marginLeft: '12px', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>- {subCategory}</div>
                  {subTasks.map((task, idx) => {
                    const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
                    const timeText = minutes > 0 ? `【${minutes}m】` : "";
                    
                    return task.isCompleted ? (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginLeft: '16px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 12 L10 18 L20 6" stroke="#4caf50" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
                        </svg>
                        <span style={{ fontSize: '12px', color: '#333' }}>{task.text}</span>
                        {timeText && <span style={{ fontSize: '10px', color: '#999' }}>{timeText}</span>}
                      </div>
                    ) : (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginLeft: '16px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="4" y1="4" x2="20" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                          <line x1="20" y1="4" x2="4" y2="20" stroke="#f44336" strokeWidth="3" strokeLinecap="square"/>
                        </svg>
                        <span style={{ fontSize: '12px', color: '#999' }}>{task.text}</span>
                        {timeText && <span style={{ fontSize: '10px', color: '#999' }}>{timeText}</span>}
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



const TemplateModal = ({ templates, onSave, onClose, onDelete, categories = baseCategories, setCategories }) => {
  // 表单数据 - 与 TaskEditModal 保持一致
  const [formData, setFormData] = useState({
    text: '',
    category: '校内',
    subCategory: '',
    note: '',
    
    tags: [],
    scheduledTime: '',
    reminderYear: '',
    reminderMonth: '',
    reminderDay: '',
    reminderHour: '',
    reminderMinute: '',
    repeatFrequency: '',
    repeatDays: [false, false, false, false, false, false, false],
    subTasks: [],
    targetCategory: '',
    targetSubCategory: '',
    startHour: '',
    startMinute: '',
    endHour: '',
    endMinute: '',
    progress: {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    image: null,
    newTagName: '',
    newTagColor: '#e0e0e0',
    newSubTask: ''
  });
  const formTopRef = useRef(null);
  
  const [editingTemplateIndex, setEditingTemplateIndex] = useState(null);
  const fileInputRef = useRef(null);

  // 重置表单
  const resetForm = () => {
    setFormData({
      text: '',
      category: '校内',
      subCategory: '',
      note: '',
      
      tags: [],
      scheduledTime: '',
      reminderYear: '',
      reminderMonth: '',
      reminderDay: '',
      reminderHour: '',
      reminderMinute: '',
      repeatFrequency: '',
      repeatDays: [false, false, false, false, false, false, false],
      subTasks: [],
      targetCategory: '',
      targetSubCategory: '',
      startHour: '',
      startMinute: '',
      endHour: '',
      endMinute: '',
      progress: {
        initial: 0,
        current: 0,
        target: 0,
        unit: "%"
      },
      image: null,
      newTagName: '',
      newTagColor: '#e0e0e0',
      newSubTask: ''
    });
    setEditingTemplateIndex(null);
    setShowMoreConfig(false);
  };

  // 编辑模板 - 加载数据到表单
 // 编辑模板 - 加载数据到表单
// 编辑模板 - 加载数据到表单
const handleEditTemplate = (index, template) => {
  // 解析计划时间
  let startHour = '', startMinute = '', endHour = '', endMinute = '';
  if (template.scheduledTime) {
    const parts = template.scheduledTime.split('-');
    if (parts.length === 2) {
      const start = parts[0].split(':');
      const end = parts[1].split(':');
      startHour = start[0] || '';
      startMinute = start[1] || '';
      endHour = end[0] || '';
      endMinute = end[1] || '';
    }
  }

  // 解析提醒时间
  let reminderYear = '', reminderMonth = '', reminderDay = '', reminderHour = '', reminderMinute = '';
  if (template.reminderTime) {
    reminderYear = template.reminderTime.year?.toString() || '';
    reminderMonth = template.reminderTime.month?.toString() || '';
    reminderDay = template.reminderTime.day?.toString() || '';
    reminderHour = template.reminderTime.hour?.toString() || '';
    reminderMinute = template.reminderTime.minute?.toString() || '';
  }

  setFormData({
    text: template.text || '',
    category: template.category || '校内',
    subCategory: template.subCategory || '',
    note: template.note || '',
    tags: template.tags || [],
    scheduledTime: template.scheduledTime || '',
    reminderYear,
    reminderMonth,
    reminderDay,
    reminderHour,
    reminderMinute,
    repeatFrequency: template.repeatFrequency || '',
    repeatDays: template.repeatDays || [false, false, false, false, false, false, false],
    subTasks: template.subTasks || [],
    targetCategory: template.targetCategory || '',
    targetSubCategory: template.targetSubCategory || '',
    startHour,
    startMinute,
    endHour,
    endMinute,
    progress: template.progress || {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    image: template.image || null,
    newTagName: '',
    newTagColor: '#e0e0e0',
    newSubTask: ''
  });
  
  setEditingTemplateIndex(index);
  
  // 滚动到表单顶部
   // 滚动到容器顶部
  setTimeout(() => {
    if (formTopRef.current) {
      formTopRef.current.scrollTop = 0;  // ← 设置 scrollTop 为 0
    }
  }, 100);
};

  // 保存模板
  const handleSave = () => {
    if (!formData.text.trim()) {
      alert('任务内容不能为空！');
      return;
    }

    // 构建计划时间
    let scheduledTime = '';
    if (formData.startHour && formData.startMinute && formData.endHour && formData.endMinute) {
      scheduledTime = `${formData.startHour.padStart(2, '0')}:${formData.startMinute.padStart(2, '0')}-${formData.endHour.padStart(2, '0')}:${formData.endMinute.padStart(2, '0')}`;
    }

    // 构建提醒时间
    let reminderTime = null;
    if (formData.reminderMonth && formData.reminderDay) {
      reminderTime = {
        year: formData.reminderYear ? parseInt(formData.reminderYear) : new Date().getFullYear(),
        month: parseInt(formData.reminderMonth),
        day: parseInt(formData.reminderDay),
        hour: parseInt(formData.reminderHour) || 0,
        minute: parseInt(formData.reminderMinute) || 0
      };
    }

    const templateData = {
      id: editingTemplateIndex !== null ? templates[editingTemplateIndex].id : `template_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, 
      name: formData.text.slice(0, 20),
      text: formData.text,
      category: formData.category,
      subCategory: formData.subCategory,
      note: formData.note,
      reflection: formData.reflection,
      tags: formData.tags,
      scheduledTime: scheduledTime,
      reminderTime: reminderTime,
      repeatFrequency: formData.repeatFrequency,
      repeatDays: formData.repeatDays,
      subTasks: formData.subTasks,
      targetCategory: formData.targetCategory,
      targetSubCategory: formData.targetSubCategory,
      progress: formData.progress,
      image: formData.image
    };

    if (editingTemplateIndex !== null) {
      // 更新现有模板
      const updatedTemplates = [...templates];
      updatedTemplates[editingTemplateIndex] = templateData;
      onSave(updatedTemplates);
    } else {
      // 添加新模板
      onSave(templateData);
    }
    
    resetForm();
    onClose();
  };

  const handleDelete = (index) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      onDelete(index);
      if (editingTemplateIndex === index) {
        resetForm();
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, image: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = () => {
    setFormData({ ...formData, image: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
     {/* ✅ 在这里添加 style 标签 */}
   {/* ✅ 添加这个 style 标签，覆盖所有按钮样式 */}
 
<div
  ref={formTopRef}   // ← ref 放在 style 之前
  style={{
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
  }}
>
 
 
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
    color: "#61A2Da",
    fontSize: 18,
    fontWeight: "600"
  }}>
    {editingTemplateIndex !== null ? '编辑模板' : '新建模板'}
  </h3>

  {/* ✅ 按钮容器 - 紧凑靠右，不换行 */}
  <div style={{ 
    display: "flex", 
    gap: "2px",
    alignItems: "center",
    flexShrink: 0,
    flexWrap: "nowrap"
  }}>
    {/* 🖼️ 添加图片按钮 */}
    <button
      onClick={handleImageClick}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="添加图片"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
        <circle cx="8.5" cy="9.5" r="1.5" fill="#61A2Da"/>
        <path d="M7 16L11 12L15 16L20 11" stroke="#61A2Da" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </button>

    {/* 保存按钮 */}
    <button
      onClick={handleSave}
      style={{
        width: '28px',
        height: '28px',
        padding: 0,
        backgroundColor: 'transparent',
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      title="保存"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="#61A2Da" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      </svg>
    </button>

    {/* 关闭按钮 */}
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="6" y2="18" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  </div>
</div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>

          {/* 模板图片预览 */}
          {formData.image && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>
                模板图片预览
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={formData.image}
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
    value={formData.text}
    onChange={(e) => {
      setFormData({ ...formData, text: e.target.value });
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    placeholder="请输入任务内容..."
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '2px solid #e0e0e0',
      borderRadius: 8,
      fontSize: 14,
      backgroundColor: '#fafafa',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      resize: 'none',
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
    rows="1"
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
    value={formData.note}
    onChange={(e) => {
      setFormData({ ...formData, note: e.target.value });
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    placeholder=""
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '2px solid #e0e0e0',
      borderRadius: 8,
      fontSize: 14,
      backgroundColor: '#fafafa',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      resize: 'none',
      outline: 'none',
      lineHeight: '1.4',
      overflow: 'hidden'
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#1a73e8';
      e.target.style.backgroundColor = '#fff';
      // ✅ 聚焦时不调整高度，保持原样
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#e0e0e0';
      e.target.style.backgroundColor = '#fafafa';
      // ✅ 失焦时不调整高度，保持内容撑开的高度
    }}
    rows="1"
  />
</div>

        

          {/* 类别和子类别 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            alignItems: 'start'
          }}>
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
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.category === '校内' && (
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
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 10px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">选择子类别</option>
                  {(categories.find((c) => c.name === '校内')?.subCategories || []).map((subCat) => (
                    <option key={subCat} value={subCat}>
                      {subCat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 📊 进度跟踪 */}
         {/* 📊 进度跟踪 */}
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
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
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
        value={formData.progress?.initial || ''}
        placeholder="0"
        onChange={(e) =>
          setFormData({
            ...formData,
            progress: {
              ...formData.progress,
              initial: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
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
        value={formData.progress?.current || ''}
        onChange={(e) =>
          setFormData({
            ...formData,
            progress: {
              ...formData.progress,
              current: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
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
        value={formData.progress?.target || ''}
        onChange={(e) =>
          setFormData({
            ...formData,
            progress: {
              ...formData.progress,
              target: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
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
  </div>
</div>



            <div>
              {/* 标签编辑 */}
{/* 标签 - 简洁版 */}
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
  
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center'
  }}>
    {/* 预设标签 */}
    {[
      { name: '重要', color: '#ff4444' },
      { name: '紧急', color: '#ff9800' },
      { name: '复习', color: '#4caf50' },
      { name: '预习', color: '#2196f3' },
      { name: '考试', color: '#f44336' }
    ].map(tag => {
      const isSelected = formData.tags?.some(t => t.name === tag.name);
      return (
        <span
          key={tag.name}
          onClick={() => {
            if (isSelected) {
              const newTags = formData.tags.filter(t => t.name !== tag.name);
              setFormData({ ...formData, tags: newTags });
            } else {
              setFormData({
                ...formData,
                tags: [...(formData.tags || []), { name: tag.name, color: tag.color, textColor: '#fff' }]
              });
            }
          }}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            backgroundColor: isSelected ? tag.color : '#f0f0f0',
            color: isSelected ? '#fff' : '#999',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'none',
            border: `1px solid ${isSelected ? tag.color : '#e0e0e0'}`,
            minWidth: '42px',
            textAlign: 'center'
          }}
        >
          {tag.name}
        </span>
      );
    })}
    
    {/* 自定义标签列表 */}
    {formData.tags?.filter(tag => !['重要', '紧急', '复习', '预习', '考试', '背诵'].includes(tag.name)).map((tag, index) => (
      <span
        key={index}
        style={{
          fontSize: '12px',
          padding: '4px 10px',
          backgroundColor: tag.color || '#61A2Da',
          color: '#fff',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          border: `1px solid ${tag.color || '#61A2Da'}`,
          minWidth: '42px'
        }}
        onClick={() => {
          const newTags = formData.tags.filter((_, i) => i !== index);
          setFormData({ ...formData, tags: newTags });
        }}
      >
        {tag.name}
        <span style={{ fontSize: '12px', opacity: 0.7 }}>×</span>
      </span>
    ))}
    
    {/* 添加自定义标签的小加号按钮 */}
  {/* 添加自定义标签的小加号按钮 - 高度对齐 */}
<span
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
      width: 280px;
      text-align: center;
    `;
    
    contentDiv.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #61A2Da; font-size: 16px;">添加新标签</h3>
      <input id="new-tag-name" type="text" placeholder="标签名称" style="
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 14px;
        margin-bottom: 12px;
        box-sizing: border-box;
      ">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <span style="font-size: 13px; color: #666;">标签颜色：</span>
        <input id="new-tag-color" type="color" value="#61A2Da" style="
          width: 40px;
          height: 40px;
          border: 1px solid #ccc;
          border-radius: 8px;
          cursor: pointer;
        ">
      </div>
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
        ">确认</button>
      </div>
    `;
    
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
    
    const nameInput = contentDiv.querySelector('#new-tag-name');
    const colorInput = contentDiv.querySelector('#new-tag-color');
    
    const confirmBtn = contentDiv.querySelector('#confirm-btn');
    confirmBtn.onclick = () => {
      const tagName = nameInput.value.trim();
      if (tagName) {
        if (!formData.tags?.some(t => t.name === tagName)) {
          setFormData({
            ...formData,
            tags: [...(formData.tags || []), { 
              name: tagName, 
              color: colorInput.value,
              textColor: '#fff'
            }]
          });
        } else {
          alert('标签已存在');
        }
      }
      document.body.removeChild(modalDiv);
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
    
    setTimeout(() => nameInput.focus(), 50);
  }}
  style={{
    height: '28px',           // 改成 28px，与标签高度一致
    padding: '0 10px',       // 改为水平内边距，让加号按钮变成胶囊形状
    borderRadius: '16px',    // 改成 16px，与标签圆角一致
    
    color: '#999',
   
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'none',
    lineHeight: 1
  }}
  title="添加自定义标签"
>
  +
</span>
  </div>
</div>
         

{/* 提醒时间 */}
<div style={{ marginTop: 16 }}>
  <label style={{
    display: 'block',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 600,
    color: '#333',
    fontSize: 14
  }}>
    🔔 提醒时间
  </label>
  <div style={{
    display: 'flex',
    gap: 4,
    
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%'
  }}>
    {/* 改成 formData */}
    <input type="number" min="2024" max="2030" placeholder="年" value={formData.reminderYear || ''} onChange={(e) => setFormData({ ...formData, reminderYear: e.target.value })} style={{ flex: 1.2, minWidth: '50px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
    <span style={{ color: '#666' }}>/</span>
    <input type="number" min="1" max="12" placeholder="月" value={formData.reminderMonth || ''} onChange={(e) => setFormData({ ...formData, reminderMonth: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
    <span style={{ color: '#666' }}>/</span>
    <input type="number" min="1" max="31" placeholder="日" value={formData.reminderDay || ''} onChange={(e) => setFormData({ ...formData, reminderDay: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
    <input type="number" min="0" max="23" placeholder="时" value={formData.reminderHour || ''} onChange={(e) => setFormData({ ...formData, reminderHour: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
    <span style={{ color: '#666' }}>:</span>
    <input type="number" min="0" max="59" placeholder="分" value={formData.reminderMinute || ''} onChange={(e) => setFormData({ ...formData, reminderMinute: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
  </div>
</div>

{/* 子任务 */}
<div style={{ marginTop: 16 }}>
  <label style={{
    display: 'block',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 600,
    color: '#333',
    fontSize: 14
  }}>
    📋 子任务
  </label>
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
    {/* 改成 formData */}
    <input type="text" placeholder="输入子任务内容" value={formData.newSubTask || ''} onChange={(e) => setFormData({ ...formData, newSubTask: e.target.value })} style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, backgroundColor: '#fff' }} />
    <button onClick={() => { if (formData.newSubTask?.trim()) { setFormData({ ...formData, subTasks: [...(formData.subTasks || []), { text: formData.newSubTask.trim(), done: false }], newSubTask: '' }); } }} style={{ height: 32, width: 32, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>+</button>
  </div>
  {formData.subTasks?.length > 0 && (
    <div>
      {formData.subTasks.map((subTask, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <input type="checkbox" checked={subTask.done || false} onChange={(e) => { const newSubTasks = [...formData.subTasks]; newSubTasks[index] = { ...newSubTasks[index], done: e.target.checked }; setFormData({ ...formData, subTasks: newSubTasks }); }} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
          <input type="text" value={subTask.text || ''} onChange={(e) => { const newSubTasks = [...formData.subTasks]; newSubTasks[index] = { ...newSubTasks[index], text: e.target.value }; setFormData({ ...formData, subTasks: newSubTasks }); }} placeholder="子任务内容" style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, backgroundColor: '#fff' }} />
          <button onClick={() => { const newSubTasks = formData.subTasks.filter((_, i) => i !== index); setFormData({ ...formData, subTasks: newSubTasks }); }} style={{ height: 32, width: 48, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>×</button>
        </div>
      ))}
    </div>
  )}
</div>
            </div>
        

          {/* 现有模板列表 */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              现有模板 ({templates.length})
            </h4>

            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', padding: '32px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                暂无模板
              </div>
            ) : (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {templates.map((template, index) => (
                  <div
                    key={index}
                    onClick={() => handleEditTemplate(index, template)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      border: editingTemplateIndex === index ? '2px solid #1a73e8' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      backgroundColor: editingTemplateIndex === index ? '#e8f0fe' : '#f8f9fa',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
 <span style={{
  fontWeight: '600',
  fontSize: '12px',
  padding: '0 3px',      // 减小左右内边距
  margin: '0',
  color: '#333',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}}>
  {template.name || template.text?.slice(0, 15) || `模板${index + 1}`}
</span>
  <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#1a73e8', color: '#fff', borderRadius: '4px', whiteSpace: 'nowrap' }}>
    {template.category}
  </span>
</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(index);
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}
                    >
                      🗑️
                    </button>
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
  const [targetCategory, setTargetCategory] = useState('校内');
  const [targetSubCategory, setTargetSubCategory] = useState('');

  // 全局样式 - 强制禁用所有按钮的悬浮和点击效果
  const globalStyle = `
    button, 
    button:hover, 
    button:active, 
    button:focus, 
    button:focus-visible,
    button:visited,
    button:link,
    button:any-link,
    .cancel-btn,
    .cancel-btn:hover,
    .cancel-btn:active,
    .cancel-btn:focus,
    .add-btn,
    .add-btn:hover,
    .add-btn:active,
    .add-btn:focus {
      background-image: none !important;
      background: initial !important;
      background-color: #61A2Da !important;  // ← 改成 
      color: initial !important;
      border: initial !important;
      border-color: initial !important;
      transform: none !important;
      scale: 1 !important;
      box-shadow: none !important;
      outline: none !important;
      opacity: 1 !important;
      transition: none !important;
      animation: none !important;
      backdrop-filter: none !important;
      filter: none !important;
      text-decoration: none !important;
      cursor: pointer !important;
      -webkit-tap-highlight-color: transparent !important;
      pointer-events: auto !important;
    }
    
    .cancel-btn,
    .cancel-btn:hover,
    .cancel-btn:active,
    .cancel-btn:focus {
      background-color: #f0f0f0 !important;
      background-image: none !important;
      color: #333 !important;
      border: none !important;
      box-shadow: none !important;
      transform: none !important;
    }
    
    .add-btn,
    .add-btn:hover,
    .add-btn:active,
    .add-btn:focus {
      background-color: #61A2Da !important;
      background-image: none !important;
      color: #fff !important;
      border: none !important;
      box-shadow: none !important;
      transform: none !important;
    }
  `;

  const handleAdd = () => {
    if (taskText.trim()) {
      onAdd(taskText.trim(), targetCategory, targetSubCategory);
      onClose();
    }
  };

  const schoolCategory = categories?.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];
  const availableCategories = (categories || []).filter(c => 
    c.name !== "常规任务" && c.name !== "本周任务"
  );

  return (
    <>
      <style>{globalStyle}</style>
      
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
            color: '#61A2Da',
            fontSize: 18
          }}>
            📅 添加本周任务
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
              placeholder="输入本周任务内容..."
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
              value={targetCategory}
              onChange={(e) => {
                setTargetCategory(e.target.value);
                setTargetSubCategory('');
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
              {availableCategories.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {targetCategory === '校内' && (
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
                value={targetSubCategory}
                onChange={(e) => setTargetSubCategory(e.target.value)}
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
            <div
              className="cancel-btn"
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
              className="add-btn"
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
    </>
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
  const [deadline, setDeadline] = useState('');
  const [target, setTarget] = useState(100);
  const [unit, setUnit] = useState('%');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    text: '',
    category: '校内',
    subCategory: '',
    deadline: '',
    target: 100,
    unit: '%'
  });

  const categories = ['校内', '语文', '数学', '英语', '科学', '运动', '其他'];
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
      deadline: deadline,
      progress: 0,
      timeSpent: 0,
      target: target,
      unit: unit,
      createdAt: new Date().toISOString()
    };

    if (onAddTask) {
      onAddTask(newTask);
    }

    setNewTaskText('');
    setSelectedCategory('校内');
    setSelectedSubCategory('');
    setDeadline('');
    setTarget(100);
    setUnit('%');
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

  const startEditTask = (task) => {
    setEditingTask(task);
    setEditFormData({
      text: task.text,
      category: task.category,
      subCategory: task.subCategory || '',
      deadline: task.deadline || '',
      target: task.target,
      unit: task.unit
    });
  };

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
      deadline: editFormData.deadline,
      target: editFormData.target,
      unit: editFormData.unit
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
    if (onUpdateProgress) {
      onUpdateProgress(taskId, newProgress);
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
        backgroundColor: 'rgba(0,0,0,0.8)',
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
            📅 本月任务 ({tasks.length})
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

    <input
      type="date"
      value={deadline}
      onChange={(e) => setDeadline(e.target.value)}
      style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' }}
    />

    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
      <input
        type="number"
        placeholder="目标值"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        style={{ flex: 2, height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px' }}
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        style={{ flex: 1, height: '40px', padding: '0 10px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff' }}
      >
        
      </select>
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
                        {task.deadline && <div style={{ fontSize: '11px', color: '#666' }}>{task.deadline}</div>}
                        {/* 编辑按钮 - 使用 div */}
                        <div
                          onClick={() => startEditTask(task)}
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
                        onClick={() => handleProgressUpdate(task.id, Math.max(0, task.progress - 1))}
                        style={{
                          padding: '8px 4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'none',
                          transform: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
                      >
                        -1
                      </div>
                      {/* +1 按钮 */}
                      <div
                        onClick={() => handleProgressUpdate(task.id, Math.min(task.target, task.progress + 1))}
                        style={{
                          padding: '8px 4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'none',
                          transform: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
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
                          cursor: 'pointer',
                          transition: 'none',
                          transform: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f5e8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8f5e8'; }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'none'; }}
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

            <input
              type="date"
              value={editFormData.deadline}
              onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="目标值"
                value={editFormData.target}
                onChange={(e) => setEditFormData({...editFormData, target: Number(e.target.value)})}
                style={{ flex: 2, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <select
                value={editFormData.unit}
                onChange={(e) => setEditFormData({...editFormData, unit: e.target.value})}
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
              >
               
              </select>
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
const DateDot = ({ date, tasksByDate }) => {
  if (!tasksByDate) {
    return null;
  }

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayTasks = tasksByDate[dateStr] || [];
  
  // 只筛选已完成的且不是常规任务的任务
  const completedNonRegularTasks = dayTasks.filter(task => {
    // 排除常规任务
    if (task.isRegularTask) return false;
    // 只保留已完成的非常规任务
    return task.done === true;
  });

  // 如果没有已完成的任务，不显示任何内容
  if (completedNonRegularTasks.length === 0) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(dateStr);
  taskDate.setHours(0, 0, 0, 0);
  
  const isFuture = taskDate > today;
  
  // 未来日期 - 橙色
  // 有完成任务的过去日期 - 绿色
  const dotColor = isFuture ? softColors.dotFuture : softColors.dotComplete;
  const textColor = isFuture ? '#F39C12' : '#2ECC71';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      marginTop: '2px'
    }}>
      {/* 圆点 */}
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: dotColor,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }} />
      
      {/* 完成任务数 - 只显示已完成的非常规任务数量 */}
      <span style={{
        fontSize: '9px',
        fontWeight: 'bold',
        color: textColor
      }}>
        {completedNonRegularTasks.length}
      </span>
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

// 任务编辑模态框
const TaskEditModal = ({ task, categories, setShowCrossDateModal, setShowMoveTaskModal, onClose, onSave, onTogglePinned, onImageUpload, setShowDeleteModal, setCategories, onCancelAbandoned,  onMarkAbandoned }) => {
  const [editData, setEditData] = useState({
    text: task.text || '',
    
    category: task.category || categories[0]?.name || '校内',
    subCategory: task.subCategory || '',
    note: task.note || '',
    reflection: task.reflection || '',
    tags: task.tags || [],
    scheduledTime: task.scheduledTime || '',
    
    reminderYear: task.reminderTime?.year?.toString() || new Date().getFullYear().toString(),
    reminderMonth: task.reminderTime?.month?.toString() || '',
    reminderDay: task.reminderTime?.day?.toString() || '',
    reminderHour: task.reminderTime?.hour?.toString() || '',
    reminderMinute: task.reminderTime?.minute?.toString() || '',
    
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

 {/* ✅ 在这里添加 style 标签 */}
   {/* ✅ 添加这个 style 标签，覆盖所有按钮样式 */}
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
{/* 标题栏 */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  paddingBottom: 15,
  borderBottom: "2px solid #f0f0f0"
}}>
  

  {/* ✅ 按钮容器 - 固定间距，靠右，不自动拉伸 */}
  <div style={{ 
  display: "flex", 
  gap: "4px",
  alignItems: "center",
  flexShrink: 0,
  flexWrap: "nowrap",
  marginLeft: "auto"  // ← 添加这行，把自己推到右边
}}>
  
{/* 在 TaskEditModal 的标题栏按钮区域，放弃按钮旁边添加 */}
{task.abandoned && (
  <button
    onClick={() => {
      if (window.confirm('确定要取消"做不完"标记吗？任务将恢复正常状态。')) {
        // 调用取消放弃的函数
        onCancelAbandoned(task);
      }
      onClose();
    }}
    style={{
      width: '32px',
      height: '32px',
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
    title="取消放弃，恢复正常"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#61A2Da" strokeWidth="2" fill="none"/>
      <path d="M8 12 L11 15 L16 9" stroke="#61A2Da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  </button>
)}


  {/* 🚫 放弃按钮 - 蓝色禁止符号 */}
<button
  onClick={() => {
    if (window.confirm('确定标记这个任务为"做不完"吗？\n\n标记后任务会变灰色，不参与统计。')) {
      if (onMarkAbandoned) {
        onMarkAbandoned(task);
      }
      onClose();
    }
  }}
  style={{
    width: '32px',
    height: '32px',
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

    {/* 📅 跨日期按钮 */}
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

    {/* 📤 迁移任务按钮 */}
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

    {/* 🔝 置顶按钮 */}
    <button
      onClick={() => {
        onTogglePinned(task);
        setEditData({ ...editData, pinned: !editData.pinned });
      }}
      style={{
        width: '32px',
        height: '32px',
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

    {/* 🗑️ 删除按钮 */}
    <button
      onClick={handleDelete}
      style={{
        width: '32px',
        height: '32px',
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

    {/* 🖼️ 添加图片按钮 */}
    <button
      onClick={handleImageClick}
      style={{
        width: '32px',
        height: '32px',
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

    {/* 保存按钮 */}
    <button
      onClick={handleSave}
      style={{
        width: '32px',
        height: '32px',
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

    {/* 关闭按钮 */}
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

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
         
          {/* 任务内容 */}
{/* 在 TaskEditModal 组件中，找到备注字段的位置，在它之前添加： */}

{/* 任务内容 - 添加这个字段 */}
{/* 任务内容 */}

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
    onChange={(e) => {
      setEditData({ ...editData, text: e.target.value });
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    placeholder="请输入任务内容..."
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '2px solid #e0e0e0',
      borderRadius: 8,
      fontSize: 14,
      backgroundColor: '#fafafa',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      resize: 'none',
      outline: 'none',
      lineHeight: '1.4',
      overflow: 'hidden'
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
    }}
    rows="1"
  />
</div>

{/* 备注字段保持原样放在后面 */}


{/* 备注 */}
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
  onChange={(e) => {
    setEditData({ ...editData, note: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }}
  placeholder=""
  style={{
    width: '100%',
    padding: '8px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 14,
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
  {/* 感想 */}
<textarea
  value={editData.reflection}
  onChange={(e) => {
    setEditData({ ...editData, reflection: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }}
  placeholder=""
  style={{
    width: '100%',
    padding: '8px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 14,
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

         {/* 类别和子类别在同一行 */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    alignItems: 'start',
    marginBottom: 8,
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
            subCategory: '',
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
        {categories.map((cat) => (
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
            const exists = categories.find(cat => cat.name === newCategory.trim());
            if (exists) {
              alert('该类别已存在！');
              return;
            }
            const newCat = {
              name: newCategory.trim(),
              color: '#1a73e8',
              subCategories: []
            };
            const updatedCategories = [...categories, newCat];
            setCategories(updatedCategories);
            saveMainData('categories', updatedCategories);
            setEditData({ ...editData, category: newCategory.trim() });
            alert(`新类别 "${newCategory}" 添加成功！`);
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

  {/* 子类别选择 - 仅校内类别显示 */}
  {/* 子类别选择 - 仅校内类别显示 */}
{(editData.isRegularTask ? editData.targetCategory === '校内' : editData.category === '校内') && (
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

    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        value={editData.isRegularTask ? (editData.targetSubCategory || '') : (editData.subCategory || '')}
        onChange={(e) => {
          if (editData.isRegularTask) {
            setEditData({ ...editData, targetSubCategory: e.target.value });
          } else {
            setEditData({ ...editData, subCategory: e.target.value });
          }
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
        <option value="">选择</option>
        {(() => {
          // 从 props 传入的 categories 中获取校内子分类
          const schoolCategory = categories.find(c => c.name === '校内');
          const subCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];
          return subCategories.map(subCat => (
            <option key={subCat} value={subCat}>
              {subCat}
            </option>
          ));
        })()}
      </select>

      {/* 添加子类别按钮 */}
      <button
        type="button"
        onClick={() => {
          const newSubCategory = window.prompt('输入新子类别名称:');
          if (newSubCategory && newSubCategory.trim()) {
            const schoolCategory = categories.find(c => c.name === '校内');
            if (schoolCategory && schoolCategory.subCategories.includes(newSubCategory.trim())) {
              alert('该子类别已存在！');
              return;
            }
            
            const updatedCategories = categories.map(cat => {
              if (cat.name === '校内') {
                return {
                  ...cat,
                  subCategories: [...(cat.subCategories || []), newSubCategory.trim()]
                };
              }
              return cat;
            });
            
            // 更新 categories 状态
            setCategories(updatedCategories);
            // 保存到本地存储
            saveMainData('categories', updatedCategories);
            
            // 自动选中新添加的子类别
            if (editData.isRegularTask) {
              setEditData({ ...editData, targetSubCategory: newSubCategory.trim() });
            } else {
              setEditData({ ...editData, subCategory: newSubCategory.trim() });
            }
            
            alert(`新子类别 "${newSubCategory}" 添加成功！`);
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
        title="添加新子类别"
      >
        +
      </button>
    </div>
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
    进度
  </label>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',  // 改为 3 列
      gap: 12,
      alignItems: 'end',
    }}
  >
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
        placeholder="0"
        onChange={(e) =>
          setEditData({
            ...editData,
            progress: {
              ...editData.progress,
              initial: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
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
              current: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
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
              target: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
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
  </div>
</div>

     

  <div>
    {/* 标签 - 简化版 */}
    
{/* 标签 - 简洁版 */}
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
  
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center'
  }}>
    {/* 预设标签 */}
    {[
      { name: '重要', color: '#ff4444' },
      { name: '紧急', color: '#ff9800' },
      { name: '复习', color: '#4caf50' },
      { name: '预习', color: '#2196f3' },
      { name: '考试', color: '#f44336' }
    ].map(tag => {
      const isSelected = editData.tags?.some(t => t.name === tag.name);
      return (
        <span
          key={tag.name}
          onClick={() => {
            if (isSelected) {
              const newTags = editData.tags.filter(t => t.name !== tag.name);
              setEditData({ ...editData, tags: newTags });
            } else {
              setEditData({
                ...editData,
                tags: [...(editData.tags || []), { name: tag.name, color: tag.color, textColor: '#fff' }]
              });
            }
          }}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            backgroundColor: isSelected ? tag.color : '#f0f0f0',
            color: isSelected ? '#fff' : '#999',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'none',
            border: `1px solid ${isSelected ? tag.color : '#e0e0e0'}`,
            minWidth: '42px',
            textAlign: 'center'
          }}
        >
          {tag.name}
        </span>
      );
    })}
    
    {/* 自定义标签列表 */}
    {editData.tags?.filter(tag => !['重要', '紧急', '复习', '预习', '考试', '背诵'].includes(tag.name)).map((tag, index) => (
      <span
        key={index}
        style={{
          fontSize: '12px',
          padding: '4px 10px',
          backgroundColor: tag.color || '#61A2Da',
          color: '#fff',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          border: `1px solid ${tag.color || '#61A2Da'}`,
          minWidth: '42px'
        }}
        onClick={() => {
          const newTags = editData.tags.filter((_, i) => i !== index);
          setEditData({ ...editData, tags: newTags });
        }}
      >
        {tag.name}
        <span style={{ fontSize: '12px', opacity: 0.7 }}>×</span>
      </span>
    ))}
    
    {/* 添加自定义标签的小加号按钮 */}
{/* 添加自定义标签的小加号按钮 - 高度对齐 */}
<span
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
      width: 280px;
      text-align: center;
    `;
    
    contentDiv.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #61A2Da; font-size: 16px;">添加新标签</h3>
      <input id="new-tag-name" type="text" placeholder="标签名称" style="
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 14px;
        margin-bottom: 12px;
        box-sizing: border-box;
      ">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <span style="font-size: 13px; color: #666;">标签颜色：</span>
        <input id="new-tag-color" type="color" value="#61A2Da" style="
          width: 40px;
          height: 40px;
          border: 1px solid #ccc;
          border-radius: 8px;
          cursor: pointer;
        ">
      </div>
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
        ">确认</button>
      </div>
    `;
    
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
    
    const nameInput = contentDiv.querySelector('#new-tag-name');
    const colorInput = contentDiv.querySelector('#new-tag-color');
    
    const confirmBtn = contentDiv.querySelector('#confirm-btn');
    confirmBtn.onclick = () => {
      const tagName = nameInput.value.trim();
      if (tagName) {
        if (!editData.tags?.some(t => t.name === tagName)) {
          setEditData({
            ...editData,
            tags: [...(editData.tags || []), { 
              name: tagName, 
              color: colorInput.value,
              textColor: '#fff'
            }]
          });
        } else {
          alert('标签已存在');
        }
      }
      document.body.removeChild(modalDiv);
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
    
    setTimeout(() => nameInput.focus(), 50);
  }}
  style={{
    height: '28px',
    padding: '0 10px',
    borderRadius: '16px',
    
    color: '#999',
   
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'none',
    lineHeight: 1
  }}
  title="添加自定义标签"
>
  +
</span>



  </div>
</div>



    {/* 提醒时间 - 保持不变 */}
    <div style={{ marginTop: 16 }}> 
      <label style={{
        display: 'block',
        marginTop: 8,
        marginBottom: 8,
        fontWeight: 600,
        color: '#333',
        fontSize: 14
      }}>
        时间
      </label>
      <div style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        flexWrap: 'nowrap',
        width: '100%'
      }}>
        <input type="number" min="2024" max="2030" placeholder="年" value={editData.reminderYear || ''} onChange={(e) => setEditData({ ...editData, reminderYear: e.target.value })} style={{ flex: 1.2, minWidth: '50px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
        <span style={{ color: '#666' }}>/</span>
        <input type="number" min="1" max="12" placeholder="月" value={editData.reminderMonth || ''} onChange={(e) => setEditData({ ...editData, reminderMonth: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
        <span style={{ color: '#666' }}>/</span>
        <input type="number" min="1" max="31" placeholder="日" value={editData.reminderDay || ''} onChange={(e) => setEditData({ ...editData, reminderDay: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
        <input type="number" min="0" max="23" placeholder="时" value={editData.reminderHour || ''} onChange={(e) => setEditData({ ...editData, reminderHour: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
        <span style={{ color: '#666' }}>:</span>
        <input type="number" min="0" max="59" placeholder="分" value={editData.reminderMinute || ''} onChange={(e) => setEditData({ ...editData, reminderMinute: e.target.value })} style={{ flex: 1, minWidth: '45px', height: 32, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, textAlign: 'center', backgroundColor: '#fff' }} />
        
      </div>
    </div>

    {/* 子任务 */}
    <div style={{ marginTop: 16 }}> 
      <label style={{
        display: 'block',
        marginTop: 8,
        marginBottom: 8,
        fontWeight: 600,
        color: '#333',
        fontSize: 14
      }}>
        子任务
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="text" placeholder="输入子任务内容" value={editData.newSubTask || ''} onChange={(e) => setEditData({ ...editData, newSubTask: e.target.value })} style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, backgroundColor: '#fff' }} />
        <button onClick={() => { if (editData.newSubTask?.trim()) { setEditData({ ...editData, subTasks: [...(editData.subTasks || []), { text: editData.newSubTask.trim(), done: false }], newSubTask: '' }); } }} style={{ height: 32, width: 32, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>+</button>
      </div>
      {editData.subTasks?.length > 0 && (
        <div>
          {editData.subTasks.map((subTask, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input type="checkbox" checked={subTask.done || false} onChange={(e) => { const newSubTasks = [...editData.subTasks]; newSubTasks[index] = { ...newSubTasks[index], done: e.target.checked }; setEditData({ ...editData, subTasks: newSubTasks }); }} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
              <input type="text" value={subTask.text || ''} onChange={(e) => { const newSubTasks = [...editData.subTasks]; newSubTasks[index] = { ...newSubTasks[index], text: e.target.value }; setEditData({ ...editData, subTasks: newSubTasks }); }} placeholder="子任务内容" style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, backgroundColor: '#fff' }} />
              <button onClick={() => { const newSubTasks = editData.subTasks.filter((_, i) => i !== index); setEditData({ ...editData, subTasks: newSubTasks }); }} style={{ height: 32, width: 48, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>×</button>
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
    </div>
  );
};


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
  onEditSubTask = () => {},
  isSortingMode = false
}) => {
  const [editingSubTaskIndex, setEditingSubTaskIndex] = useState(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [showProgressControls, setShowProgressControls] = useState(false);
  const [editingSubTaskNoteIndex, setEditingSubTaskNoteIndex] = useState(null);
// 在 TaskItem 组件内部，其他 useState 旁边添加（约在第 3880 行附近）
const [showCrossDateDetail, setShowCrossDateDetail] = useState(false);
const [localDateStatus, setLocalDateStatus] = useState({});

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
    const newCurrent = Math.min(Math.max(0, currentValue + increment), targetValue);
    
    if (onUpdateProgress) {
      onUpdateProgress(task, newCurrent);
    }
  };

  // 计算进度百分比
  const getProgressPercent = () => {
    const current = Number(task.progress?.current) || 0;
    const initial = Number(task.progress?.initial) || 0;
    const target = Number(task.progress?.target) || 0;
    if (target === 0) return 0;
    const percent = ((current - initial) / (target - initial)) * 100;
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
 
{/* 复选框 - 放弃的任务显示框内叉 */}
{task.abandoned ? (
  // 放弃的任务：显示带叉的复选框
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "14px",
      height: "14px",
      margin: 0,
      flexShrink: 0,
      border: "1px solid #999",
      borderRadius: "2px",
      backgroundColor: "#f5f5f5",
      cursor: "default"
    }}
  >
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="5" y1="5" x2="19" y2="19" stroke="#999" strokeWidth="3" strokeLinecap="round"/>
      <line x1="19" y1="5" x2="5" y2="19" stroke="#999" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </span>
) : (
  // 正常任务：使用原生复选框
  <input
    type="checkbox"
    checked={(() => {
      if (!task.crossDateId) return task.done;
      const allDates = task.crossDates || [];
      return allDates.some(date => {
        const dayTasks = tasksByDate[date] || [];
        const taskOnDate = dayTasks.find(t => t.crossDateId === task.crossDateId);
        return taskOnDate?.done === true;
      });
    })()}
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

<div
  onClick={(e) => {
    e.stopPropagation();
    onOpenEditModal(task);
  }}
  style={{
    wordBreak: "break-word",
    cursor: "pointer",
    color: task.abandoned ? "#f44336" : (task.done ? "#999" : "#000"),
    fontWeight: task.pinned ? "bold" : "normal",
    fontSize: "13px",
    lineHeight: "1.5",
    flex: 1,
    minWidth: "50px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px"
  }}
>
  {/* 任务文字和图片标记紧贴在一起 */}
  <span style={{ display: "inline", whiteSpace: "normal" }}>
    {task.text}
    {task.hasImage && (
      
      <span style={{ color: task.done ? '#999' : '#ff4444', fontSize: '11px' }}>
        &nbsp; &nbsp; [图片]
      </span>
    )}
  </span>
  
  {/* 📅 图标 */}
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
        marginLeft: "4px",
        opacity: showCrossDateDetail ? 0.7 : 1
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
  <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
    <span
      onClick={(e) => {
        e.stopPropagation();
        if (!isSortingMode) onEditTime(task);
      }}
      style={{
        fontSize: "11px",
        color: isSortingMode ? "transparent" : "#666",
        cursor: isSortingMode ? "default" : "pointer",
        minWidth: "30px",
        textAlign: "right",
        lineHeight: "28px"
      }}
    >
      {Math.floor((task.timeSpent || 0) / 60)}m
    </span>
  </div>
</div>

      {/* 进度条 - 独立一行，在任务文字下方 */}
     {/* 进度条 - 独立一行，在任务文字下方 */}
{/* 进度条 - 独立一行，在任务文字下方 */}
{/* 进度条 - 独立一行，在任务文字下方 */}
{/* 进度条 - 独立一行 */}

{/* 进度条 - 独立一行，在任务文字下方 */}
{hasProgress && (
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
        marginBottom: 4
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          // ✅ 修改：完成任务或放弃时变灰色，否则根据分类/子分类使用深色主题色
          backgroundColor: (task.done || task.abandoned) 
  ? '#d0d0d0'
  : (task.category === '校内' && task.subCategory)
    ? ({
        '数学': '#E8F5E9',
        '语文': '#FFFCE8',
        '英语': '#FCE4EC',
        '运动': '#E3F2FD'
      }[task.subCategory] || '#61A2Da')
    : ({
        '语文': '#FFFCE8',   // 浅黄色
        '数学': '#E8F5E9',   // 浅绿色
        '英语': '#FCE4EC',   // 浅粉色
        '科学': '#E1F5FE',   // 浅蓝色
        '运动': '#E3F2FD',   // 浅蓝色
        '校内': '#61A2Da'
      }[task.category] || '#1a73e8'),
          borderRadius: 5,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
    {/* 进度文字也变灰 */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        color: (task.done || task.abandoned) ? '#ccc' : '#666'
      }}>
        <span>{Math.round(progressPercent)}%</span>
        <span>|</span>
        <span>{task.progress?.current || 0}/{task.progress?.target || 0}</span>
      </div>
    </div>
  </div>
)}

{/* 跨日期任务详情 - 展开区域 */}
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
      
      // 只有 actualCompletedDate 等于这个日期时才显示勾选
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
            padding: "2px 8px",  // 从 4px 8px 改为 2px 8px，更紧凑
            backgroundColor: isToday ? '#e8f0fe' : 'transparent',
            borderRadius: '4px'
          }}
        >
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
          {isToday && <span style={{ fontSize: '10px', color: '#1a73e8' }}>今日</span>}
        </div>
      );
    })}
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
      color: "#666",
      cursor: "pointer",
      backgroundColor: 'transparent',
      lineHeight: "1.3",
      whiteSpace: "pre-wrap",
      marginBottom: task.reflection ? "2px" : "0",
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
              ❗️ {task.reflection}
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
    </li>
  );
};





// SortableTaskList 组件 - 修复删除功能
// SortableTaskList 组件 - 修复删除功能
// SortableTaskList 组件 - 修复删除按钮和拖拽手柄位置
const SortableTaskList = ({ 
  tasks, 
  category, 
  subCategory,
  tasksByDate = {} ,
  isSortingMode, 
  onSortingEnd,
  onDeleteTask,
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
  setShowMoveModal,
  onUpdateProgress,
  onEditSubTask,
  onToggleSubTask
}) => {
  const [taskList, setTaskList] = useState([]);
  const dragItemIndex = useRef(null);
  
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
  
  const saveOrder = (newList) => {
    const orderKey = subCategory 
      ? `tasks_order_${category}_${subCategory}`
      : `tasks_order_${category}`;
    const orderIds = newList.map(t => t.id);
    localStorage.setItem(orderKey, JSON.stringify(orderIds));
    if (onSortingEnd) {
      onSortingEnd(orderIds);
    }
  };
  
  if (taskList.length === 0) {
    return null;
  }
  
  // 拖拽开始
  const handleDragStart = (e, index) => {
    if (!isSortingMode) {
      e.preventDefault();
      return false;
    }
    dragItemIndex.current = index;
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    e.currentTarget.style.opacity = '0.5';
    return true;
  };

  // 拖拽结束
  const handleDragEnd = (e) => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '';
    }
    dragItemIndex.current = null;
  };

  // 拖拽经过
  const handleDragOver = (e, targetIndex) => {
    e.preventDefault();
    if (!isSortingMode) return;
    if (dragItemIndex.current === null) return;
    if (dragItemIndex.current === targetIndex) return;
    
    const newList = [...taskList];
    const draggedItem = newList[dragItemIndex.current];
    newList.splice(dragItemIndex.current, 1);
    newList.splice(targetIndex, 0, draggedItem);
    
    setTaskList(newList);
    dragItemIndex.current = targetIndex;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!isSortingMode) return;
    saveOrder(taskList);
    dragItemIndex.current = null;
  };
  
  return (
    <ul
      style={{
        listStyle: "none",
        padding: subCategory ? "0 0 0 8px" : 0,
        margin: 0,
        borderLeft: subCategory ? "2px solid #e0e0e0" : "none"
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {taskList.map((task, idx) => (
        <div
          key={task.id}
          draggable={isSortingMode}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, idx)}
          style={{
            cursor: isSortingMode ? 'grab' : 'default',
            marginBottom: '4px',
            opacity: dragItemIndex.current === idx ? 0.5 : 1,
            position: 'relative'
          }}
        >
          {/* ✅ 排序模式下的删除和拖拽按钮 - 放在任务内容外部，但不在绝对定位中 */}
          {isSortingMode && (
            <div
              style={{
                position: 'absolute',
                right: '0px',
                top: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 5,
      paddingRight: '4px' 
              }}
            >
              {/* 删除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (window.confirm(`确定要删除任务 "${task.text}" 吗？\n\n此操作不可撤销！`)) {
                    if (onDeleteTask && typeof onDeleteTask === 'function') {
                      onDeleteTask(task, 'today');
                    }
                  }
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
                  justifyContent: 'center'
                }}
                title="删除任务"
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 6L6 18" stroke="#999" strokeWidth="2" strokeLinecap="square"/>
                  <path d="M6 6L18 18" stroke="#999" strokeWidth="2" strokeLinecap="square"/>
                </svg>
              </button>
              
              {/* 拖拽手柄 */}
              <div
                style={{
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px'
                }}
                title="拖拽调整顺序"
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line x1="5" y1="6" x2="19" y2="6" stroke="#bbb" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke="#bbb" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="5" y1="18" x2="19" y2="18" stroke="#bbb" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          )}

          <TaskItem
            task={task}
            selectedDate={selectedDate}
            isSortingMode={isSortingMode}
            getTaskCompletionType={getTaskCompletionType}
            onDeleteTask={onDeleteTask}
            onEditTime={onEditTime}
            onDeleteImage={onDeleteImage}
            onEditNote={onEditNote}
            onEditReflection={onEditReflection}
            onOpenEditModal={onOpenEditModal} 
            onShowImageModal={onShowImageModal}
            tasksByDate={tasksByDate}  
            toggleDone={toggleDone}
            formatTimeNoSeconds={formatTimeNoSeconds}
            formatTimeWithSeconds={formatTimeWithSeconds}
            onMoveTask={onMoveTask}
            categories={categories}
            
            setShowMoveModal={setShowMoveModal}
            onUpdateProgress={onUpdateProgress}
            onEditSubTask={onEditSubTask}
            onToggleSubTask={onToggleSubTask}
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
        '科学': '#E1F5FE',
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
        '科学': '#E1F5FE',
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
        <circle cx="100" cy="100" r="28" fill="#fff" stroke="#e0e0e0" strokeWidth="1" />
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
        <circle cx="100" cy="100" r="28" fill="#fff" stroke="#e0e0e0" strokeWidth="1" />
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
      padding: '4px 12px',  // 从 8px 16px 改为 4px 12px
      fontSize: '13px',     // 从 14px 改为 13px
      cursor: 'pointer',
      backgroundColor: activeTab === 'time' ? '#fff' : '#f0f0f0',
      color: activeTab === 'time' ? '#61A2Da' : '#666',
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
      padding: '4px 12px',  // 从 8px 16px 改为 4px 12px
      fontSize: '13px',     // 从 14px 改为 13px
      cursor: 'pointer',
      backgroundColor: activeTab === 'endTime' ? '#fff' : '#f0f0f0',
      color: activeTab === 'endTime' ? '#61A2Da' : '#666',
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
      padding: '4px 12px',  // 从 8px 16px 改为 4px 12px
      fontSize: '13px',     // 从 14px 改为 13px
      cursor: 'pointer',
      backgroundColor: activeTab === 'review' ? '#fff' : '#f0f0f0',
      color: activeTab === 'review' ? '#61A2Da' : '#666',
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
        {filteredEndTimeList.map((item, idx) => {
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
                fontWeight: 'bold',
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
                      📅 {item.date.slice(5)}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {dailyRatings?.[item.date] && (
                        <span style={{ fontSize: '14px' }}>
                          {dailyRatings[item.date] === 1 && '😞'}
                          {dailyRatings[item.date] === 2 && '😕'}
                          {dailyRatings[item.date] === 3 && '😐'}
                          {dailyRatings[item.date] === 4 && '😊'}
                          {dailyRatings[item.date] === 5 && '🥳'}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`确定要删除 ${item.date} 的复盘记录吗？`)) {
                            onDeleteReflection?.(item.date);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: '#999',
                          padding: '0 4px'
                        }}
                      >
                        🗑️
                      </button>
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
          {filteredReviewList.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`确定要清空当前筛选范围内的所有复盘记录吗？`)) {
                  onClearReflections?.(filteredReviewList.map(item => item.date));
                }
              }}
              style={{
                width: '100%',
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              清空当前列表
            </button>
          )}
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

function App() {
const [showTimeEditModal, setShowTimeEditModal] = useState(null);
const [showTemplateList, setShowTemplateList] = useState(false);
// 在 App 组件中，其他 useState 附近添加
const [isHolidayMode, setIsHolidayMode] = useState(false); // 假期模式状态
const [showTimeRecordModal, setShowTimeRecordModal] = useState(false);
  // 在 App 组件开头，其他 useState 附近添加
const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  // 在 App 组件中，找到其他 useRef 定义的位置，添加：
const isUserTogglingRef = useRef(false);
  // 添加这个状态定义
  const [lastSyncStatus, setLastSyncStatus] = useState({
    success: false,
    time: null,
    message: ''
  });




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
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    if (task.isWeekTask) {
      // 本周任务需要更新所有日期
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? { ...t, abandoned: false, done: false }
            : t
        );
      });
    } else if (task.crossDateId) {
      // 跨日期任务需要更新所有关联日期
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.crossDateId === task.crossDateId
            ? { ...t, abandoned: false, done: false }
            : t
        );
      });
    } else {
      // 普通任务只更新当前日期
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? { ...t, abandoned: false, done: false } : t
      );
    }
    
    return newTasksByDate;
  });
  
  console.log('✅ 任务已恢复正常:', task.text);
};

const markTaskAsAbandoned = (task) => {
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart
            ? { ...t, abandoned: true, done: false }
            : t
        );
      });
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? { ...t, abandoned: true, done: false } : t
      );
    }
    
    return newTasksByDate;
  });
};

const [chartView, setChartView] = useState('month');
const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);
const [editingTemplate, setEditingTemplate] = useState(null);
const [templateFormData, setTemplateFormData] = useState({
  text: '',
  category: '校内',
  subCategory: ''
});
// 在 App 组件的状态定义区域添加

  const [tasksByDate, setTasksByDate] = useState({});
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
  const [showGradeModal, setShowGradeModal] = useState(false);
  const hasAttemptedRestore = useRef(false);  // 添加这一行
  // 在现有状态定义区域添加
  // 在现有的状态定义区域添加
const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [confettiParts, setConfettiParts] = useState([]);
const lastCompletionStatus = useRef({});
const isFirstLoad = useRef(true);  // 👈 添加
const prevCompletionState = useRef({});

// 大类别颜色状态
const [categoryColors, setCategoryColors] = useState(() => {
  const saved = localStorage.getItem('category_colors');
  if (saved) {
    return JSON.parse(saved);
  }
  // 默认颜色
  return {
    '语文': '#FFFCE8',
    '数学': '#E8F5E9',
    '英语': '#FCE4EC',
    '科学': '#E1F5FE',
    '运动': '#E3F2FD',
    '校内': '#61A2Da'
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

  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  
  
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
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
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
const handleSaveCategories = (updatedCategories) => {
  setCategories(updatedCategories);
  saveMainData('categories', updatedCategories);
};
const [isInitialized, setIsInitialized] = useState(false);
const [editingCategory, setEditingCategory] = useState(null); // 新增：正在编辑的类别
const [collapsedSubCategories, setCollapsedSubCategories] = useState({});

const [categories, setCategories] = useState(baseCategories.map(cat => ({
  ...cat,
  subCategories: []
})));

// 添加这个状态 - 用于控制各个分类的折叠/展开
const [collapsedCategories, setCollapsedCategories] = useState({
  "本周任务": false,
  "语文": false,
  "数学": false,
  "英语": false,
  "科学": false,
  "运动": false,
  "校内": false
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
  const [dailyRatings, setDailyRatings] = useState({});
  const [dailyReflections, setDailyReflections] = useState({});
  
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
  return localStorage.getItem('daily_reminder') || '';
});

// 添加保存提醒文本的函数
const handleReminderChange = (text) => {
  setReminderText(text);
  localStorage.setItem('daily_reminder', text);
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
            file.filename.includes('study-tracker') || 
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
  let gistId = localStorage.getItem('github_gist_id');
  
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
    
    const content = gist.files['study-tracker-data.json'].content;
    const backupData = JSON.parse(content);
    console.log('备份数据:', backupData);

    if (window.confirm(`确定要恢复 ${new Date(backupData.syncTime).toLocaleString()} 的备份数据吗？这将覆盖当前所有数据！`)) {
      console.log('用户确认恢复，开始设置状态...');
      
      // 立即保存到 localStorage
      await saveMainData('tasks', backupData.tasksByDate || {});
      await saveMainData('templates', backupData.templates || []);
    
      
      console.log('数据已保存到 localStorage');
      
      // 然后设置状态
      setTasksByDate(backupData.tasksByDate || {});
      setTemplates(backupData.templates || []);
  
      
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





// 在 App 组件的状态中找到 useState 部分，添加：
const [syncConfig, setSyncConfig] = useState({
  token: localStorage.getItem('github_token') || '',
  gistId: localStorage.getItem('github_gist_id') || '',
  autoSync: localStorage.getItem('github_auto_sync') === 'true',
  lastSync: localStorage.getItem('github_last_sync') || ''
});








// 获取当前日期的心情和评价

const getCurrentDailyRating = useCallback(() => {
  return dailyRatings[selectedDate] || 0;
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

const setCurrentDailyRating = (rating) => {
  setDailyRatings(prev => ({
    ...prev,
    [selectedDate]: rating
  }));
};

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






// 找到 handleRestoreData 函数，添加 reminderText 的恢复
const handleRestoreData = useCallback(async (backupData) => {
  try {
    console.log('🔄 开始恢复数据...', backupData);

     // ✅ 新增：恢复排序数据
    if (backupData.taskOrders) {
      Object.entries(backupData.taskOrders).forEach(([key, order]) => {
        localStorage.setItem(key, JSON.stringify(order));
      });
      console.log('✅ 恢复任务排序:', Object.keys(backupData.taskOrders).length);
    }
    
    if (backupData.subCategoryOrders) {
      Object.entries(backupData.subCategoryOrders).forEach(([key, order]) => {
        localStorage.setItem(key, JSON.stringify(order));
      });
      console.log('✅ 恢复子分类排序:', Object.keys(backupData.subCategoryOrders).length);
    }
    
  

    // 恢复核心数据
    if (backupData.tasksByDate) {
      setTasksByDate(backupData.tasksByDate);
      await saveMainData('tasks', backupData.tasksByDate);
    }
    
    if (backupData.templates) {
      setTemplates(backupData.templates);
      await saveMainData('templates', backupData.templates);
    }
    
    // 恢复本月任务
    if (backupData.monthTasks) {
      setMonthTasks(backupData.monthTasks);
      await saveMainData('monthTasks', backupData.monthTasks);
    }
    
    // 恢复每日数据
    if (backupData.dailyRatings) {
      setDailyRatings(backupData.dailyRatings);
    }
    
    if (backupData.dailyReflections) {
      console.log('📝 恢复复盘数据:', {
        天数: Object.keys(backupData.dailyReflections).length,
        示例: Object.entries(backupData.dailyReflections).slice(0, 2)
      });
      
      setDailyReflections(backupData.dailyReflections);
      
      // 保存每个日期的复盘到 localStorage
      Object.entries(backupData.dailyReflections).forEach(([date, reflection]) => {
        const dailyData = {
          rating: backupData.dailyRatings?.[date] || 0,
          reflection: reflection,
          date: date
        };
        saveMainData(`daily_${date}`, dailyData);
      });
    }
    
    // 恢复每日提醒文本 - 新增
    if (backupData.reminderText !== undefined) {
      setReminderText(backupData.reminderText);
      localStorage.setItem('daily_reminder', backupData.reminderText);
      console.log('📢 恢复每日提醒:', backupData.reminderText || '无');
    }
    
    // 恢复学习结束时间（按日期）
if (backupData.studyEndTimes) {
  setStudyEndTimes(backupData.studyEndTimes);
  localStorage.setItem('daily_study_end_times', JSON.stringify(backupData.studyEndTimes));
  console.log('⏰ 恢复学习结束时间:', Object.keys(backupData.studyEndTimes).length, '天');
}
    // 恢复类别配置
    if (backupData.categories) {
      setCategories(backupData.categories);
      await saveMainData('categories', backupData.categories);
    }
    
    // 恢复成绩记录
    if (backupData.grades) {
      await saveMainData('grades', backupData.grades);
    }
    
    // 恢复最后选中的日期
    if (backupData.lastSelectedDate) {
      setSelectedDate(backupData.lastSelectedDate);
    }
    
    if (backupData.lastCurrentMonday) {
      setCurrentMonday(new Date(backupData.lastCurrentMonday));
    }

    console.log('✅ 数据恢复完成，复盘天数:', Object.keys(backupData.dailyReflections || {}).length);
    
    alert(`✅ 数据恢复成功！\n恢复了 ${Object.keys(backupData.dailyReflections || {}).length} 天的复盘数据\n本月任务: ${(backupData.monthTasks || []).length} 个\n每日提醒: ${backupData.reminderText ? '已恢复' : '无'}`);

  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败: ' + error.message);
  }
}, []);
// 将 syncToGitHub 的 useCallback 定义移到所有 useEffect 之前
// eslint-disable-next-line no-unused-vars





const syncToGitHub = useCallback(async (silent = false) => {
  const token = localStorage.getItem('github_token');
  if (!token) {
    if (!silent) {
      setShowGitHubSyncModal(true);
      alert('请先设置 GitHub Token');
    } else {
      console.log('❌ 自动同步失败: 未设置 GitHub Token');
      setLastSyncStatus({
        success: false,
        time: new Date(),
        message: '未设置 GitHub Token'
      });
      setTimeout(() => {
        setLastSyncStatus(prev => ({ ...prev, message: '' }));
      }, 3000);
    }
    return;
  }

  setIsSyncing(true);
  
   // 静默模式也显示同步中状态（但不弹窗）
  
  
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // 先保存当前日期的数据
    await saveDailyData(selectedDate);
    
    // 收集排序数据
    const allTaskOrders = {};
    const allSubCategoryOrders = {};
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (key.startsWith('tasks_order_')) {
        try {
          allTaskOrders[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          console.error('解析任务排序失败:', key, e);
        }
      }
      if (key.startsWith('subcategory_order_')) {
        try {
          allSubCategoryOrders[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          console.error('解析子分类排序失败:', key, e);
        }
      }
    });

    // 收集所有需要同步的数据
    const syncData = {
      tasksByDate,
      templates,
      dailyRatings,
      dailyReflections,
      studyEndTimes: studyEndTimes, 
      monthTasks,
      categories,
      grades: await loadMainData('grades') || [],
      reminderText: reminderText,
      taskOrders: allTaskOrders,
      subCategoryOrders: allSubCategoryOrders,
      syncTime: new Date().toISOString(),
      version: '2.3',
      lastSelectedDate: selectedDate,
      lastCurrentMonday: currentMonday.toISOString()
    };

    console.log('📤 准备同步数据:', {
      任务天数: Object.keys(tasksByDate).length,
      模板数量: templates.length,
      有复盘的日期: Object.keys(dailyReflections).length,
      本月任务: monthTasks.length,
      每日提醒: reminderText ? '有' : '无'
    });

    // 获取或创建 Gist
    let gistId = localStorage.getItem('github_gist_id');
    let method = 'POST';
    let url = 'https://api.github.com/gists';
    
    if (gistId) {
      method = 'PATCH';
      url = `https://api.github.com/gists/${gistId}`;
    }

    const gistData = {
      description: 'Study Tracker Backup - 学习跟踪器备份',
      public: false,
      files: {
        'study-tracker-data.json': {
          content: JSON.stringify(syncData, null, 2)
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
      throw new Error(`同步失败: ${response.status} - ${errorData.message || '未知错误'}`);
    }

    const result = await response.json();
    
    if (!gistId && result.id) {
      localStorage.setItem('github_gist_id', result.id);
      console.log('✅ 新 Gist ID 已保存:', result.id);
    }

    localStorage.setItem('github_last_sync', new Date().toISOString());
    
    const syncTime = new Date().toLocaleString();
    // 计算有完成任务的天数（打卡天数）
const taskCount = Object.values(tasksByDate).filter(dailyTasks => 
  dailyTasks.some(task => task.done === true)
).length;
    const reflectionCount = Object.keys(dailyReflections).length;
    
    // 根据是否静默模式决定是否弹窗
    if (!silent) {
      alert(`✅ 同步成功！\n\n同步时间：${syncTime}\n同步内容：\n• 任务天数：${taskCount} 天\n• 模板数量：${templates.length} 个\n• 复盘记录：${reflectionCount} 天\n• 本月任务：${monthTasks.length} 个\n• 每日提醒：${reminderText ? '已同步' : '无'}`);
    } else {
      // 静默模式：显示短暂的成功提示（2秒后消失）
      console.log(`✅ 自动同步成功 - ${syncTime}`);
      setLastSyncStatus({
        success: true,
        time: new Date(),
        message: `✅ 同步成功 (${new Date().toLocaleTimeString()})`
      });
      setTimeout(() => {
        setLastSyncStatus(prev => ({ ...prev, message: '' }));
      }, 2000);
    }

  } catch (error) {
    console.error('同步失败:', error);
    
    if (!silent) {
      let errorMessage = '同步失败：';
      if (error.message.includes('401')) {
        errorMessage += 'Token 无效或已过期，请重新设置 GitHub Token';
      } else if (error.message.includes('403')) {
        errorMessage += '权限不足，请确保 Token 有 gist 权限';
      } else if (error.message.includes('404')) {
        errorMessage += 'Gist 不存在，将自动创建新的备份';
        localStorage.removeItem('github_gist_id');
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } else {
      // 静默模式：显示失败提示
      let friendlyMessage = '同步失败';
      if (error.message.includes('401')) {
        friendlyMessage = 'Token 已过期，请重新设置';
      } else if (error.message.includes('403')) {
        friendlyMessage = '权限不足，请检查 Token';
      } else if (error.message.includes('404')) {
        friendlyMessage = 'Gist 不存在，将自动创建';
        localStorage.removeItem('github_gist_id');
      } else {
        friendlyMessage = error.message.slice(0, 30);
      }
      
      setLastSyncStatus({
        success: false,
        time: new Date(),
        message: `❌ ${friendlyMessage}`
      });
      setTimeout(() => {
        setLastSyncStatus(prev => ({ ...prev, message: '' }));
      }, 3000);
    }
  } finally {
    setIsSyncing(false);
  }
}, [tasksByDate, templates, dailyRatings, dailyReflections, categories, selectedDate, currentMonday, saveDailyData, monthTasks, reminderText]);


// 找到 autoRestoreLatestData 函数，确保恢复每日提醒
const autoRestoreLatestData = useCallback(async () => {
  const token = localStorage.getItem('github_token');
  
  if (!token) {
    console.log('❌ 没有GitHub Token，跳过自动恢复');
    return;
  }

  console.log('🔍 开始自动恢复最新数据...');
  
  try {
    // 1. 先尝试使用保存的gistId
    const savedGistId = localStorage.getItem('github_gist_id');
    let targetGistId = savedGistId;
    
    if (!savedGistId) {
      console.log('🔍 搜索最新的学习跟踪器Gist...');
      const latestGist = await getLatestStudyTrackerGist(token);
      
      if (latestGist) {
        targetGistId = latestGist.id;
        console.log('✅ 找到最新Gist:', targetGistId);
      } else {
        console.log('❌ 未找到学习跟踪器数据');
        return;
      }
    }

    console.log('📁 尝试获取Gist数据:', targetGistId);
    const response = await fetch(`https://api.github.com/gists/${targetGistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }

    const gist = await response.json();
    const content = gist.files['study-tracker-data.json']?.content;
    
    if (!content) {
      throw new Error('未找到学习跟踪器数据文件');
    }

    const backupData = JSON.parse(content);
    console.log('✅ 获取到备份数据，更新时间:', gist.updated_at);
    
    // 检查备份数据是否包含每日提醒
    const hasReminder = backupData.reminderText !== undefined;
    console.log('📢 备份数据包含每日提醒:', hasReminder ? '是' : '否');
    
    const localDataCount = Object.keys(tasksByDate).length;
    const cloudDataCount = Object.keys(backupData.tasksByDate || {}).length;
    
    const confirmMessage = `发现云端备份数据，是否要恢复？\n\n` +
      `云端数据：\n` +
      `• 备份时间：${new Date(backupData.syncTime || gist.updated_at).toLocaleString()}\n` +
      `• 任务天数：${cloudDataCount}\n` +
      `• 模板数量：${(backupData.templates || []).length}\n` +
      `• 每日提醒：${backupData.reminderText ? '有' : '无'}\n\n` +
      `本地数据：\n` +
      `• 任务天数：${localDataCount}\n\n` +
      `恢复将覆盖当前所有本地数据！`;

    if (window.confirm(confirmMessage)) {
      console.log('用户确认恢复，开始设置状态...');
      
      if (!savedGistId) {
        localStorage.setItem('github_gist_id', targetGistId);
      }
      
      await handleRestoreData(backupData);
    } else {
      console.log('用户取消恢复');
    }
    
  } catch (error) {
    console.error('自动恢复失败:', error);
    
    let errorMessage = '恢复失败: ';
    if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage += 'Token 无效或权限不足，请检查同步设置';
    } else if (error.message.includes('404')) {
      errorMessage += '未找到备份数据，请检查 Gist ID 是否正确';
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
  }
}, [tasksByDate, handleRestoreData]);








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
        console.log(`   模板数量: ${data?.templates?.length || 0}`);
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
}, [tasksByDate, templates, categories, monthTasks, dailyRatings, dailyReflections]);


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











// 在现有的初始化 useEffect 后面添加：

useEffect(() => {
  if (isInitialized && Object.keys(tasksByDate).length === 0 && !hasAttemptedRestore.current) {
    console.log('🔄 初始化完成，检查是否需要恢复数据');
    hasAttemptedRestore.current = true;  // 标记已尝试恢复
    
    const timer = setTimeout(() => {
      autoRestoreLatestData();
    }, 3000);
    
    return () => clearTimeout(timer);
  }
}, [isInitialized, tasksByDate, autoRestoreLatestData]);  // 这里保留所有依赖


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

  // 保存函数 - 已移除多余的 {} 块
const handleSave = () => {
  const targetDates = getDateOptions()
    .filter(option => selectedDays.includes(option.day))
    .map(option => option.value);
  
  if (targetDates.length === 0) {
    alert('请至少选择一个日期');
    return;
  }
  
  onSave(task, targetDates);
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
  // 如果没有传入 task 对象，说明是从编辑模态框调用，需要获取当前任务
  if (!task) return;
  
  // 生成一个唯一的跨日期ID（如果任务已经有crossDateId，则使用现有的）
  const crossDateId = task.crossDateId || task.id || `cross_${Date.now()}`;
  
  console.log('创建/更新跨日期任务:', {
    任务: task.text,
    跨日期ID: crossDateId,
    目标日期: targetDates,
    原始任务: task
  });
  
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    // 1. 首先，删除这个任务所有日期的版本（如果它是跨日期任务）
    if (task.crossDateId) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].filter(t => 
          t.crossDateId !== task.crossDateId
        );
      });
    } else {
      // 如果不是跨日期任务，只删除当前日期的这个任务
      if (newTasksByDate[selectedDate]) {
        newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(t => 
          t.id !== task.id
        );
      }
    }
    
    // 2. 在选中的目标日期创建任务
    targetDates.forEach(date => {
      if (!newTasksByDate[date]) {
        newTasksByDate[date] = [];
      }
      
      // 创建新任务（保持原有的完成状态）
      const newTask = {
  ...task,
  id: `${crossDateId}_${date}`,
  crossDateId: crossDateId,
  isCrossDate: true,
  crossDates: targetDates,
  done: task.done || false,
  actualCompletedDate: null,  // ✅ 初始化时没有实际完成日期
};
      
      newTasksByDate[date].push(newTask);
      console.log(`创建任务在 ${date}:`, newTask);
    });
    
    return newTasksByDate;
  });
  
  alert(`任务已设置在 ${targetDates.length} 个日期显示`);
};


// 在 App 组件中，替换 toggleDone 函数：

// 在 App 组件中，替换 toggleDone 函数：

const toggleDone = (task) => {
  const newDoneState = !task.done;
  const currentDate = selectedDate;
  
  // 如果是跨日期任务
  if (task.crossDateId) {
    const crossDateId = task.crossDateId;
    
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      
      // 更新所有相关日期的任务完成状态（全局同步）
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t => {
          if (t.crossDateId === crossDateId) {
            // ✅ 关键：如果是勾选操作，记录实际完成日期
            // 如果是取消操作，清除实际完成日期
            const actualDate = newDoneState ? currentDate : null;
            return { 
              ...t, 
              done: newDoneState,
              actualCompletedDate: actualDate  // 记录实际完成的日期
            };
          }
          return t;
        });
      });
      
      setTimeout(() => {
        const updatedTasks = newTasksByDate[selectedDate] || [];
        checkConfettiWithTasks(updatedTasks);
      }, 50);
      
      return newTasksByDate;
    });
    return;
  }
  
  // 普通任务的处理
  setTasksByDate(prev => {
    const newTasksByDate = {
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(t =>
        t.id === task.id ? { ...t, done: newDoneState } : t
      )
    };
    
    setTimeout(() => {
      const updatedTasks = newTasksByDate[selectedDate] || [];
      checkConfettiWithTasks(updatedTasks);
    }, 50);
    

     // ✅ 使用保存的 currentDate 而不是 selectedDate
    const updatedTasks = newTasksByDate[currentDate] || [];
    
    // ✅ 使用 requestAnimationFrame 代替 setTimeout
    requestAnimationFrame(() => {
      checkConfettiWithTasks(updatedTasks);
    });
    

    return newTasksByDate;
  });
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
    imageUrl: 'https://raw.githubusercontent.com/Linnea0123/study-tracker/main/public/confetti.png',
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













 

  

// 暴露实例给全局调试
useEffect(() => {
  window.appInstance = {
    saveAllData: () => {
      saveMainData('tasks', tasksByDate);
      saveMainData('templates', templates);
    },
    getState: () => ({
      tasksByDate,
      templates,
      isInitialized,
      selectedDate,
      todayTasks: tasksByDate[selectedDate] || []
    }),
    // ✅ 添加这一行
    triggerConfetti: triggerConfetti,
    // 或者如果有 setState 方法，也加上
    setConfettiParts: setConfettiParts
  };
  
  return () => {
    delete window.appInstance;
  };
}, [tasksByDate, templates, isInitialized, selectedDate, triggerConfetti]);










  // ==== 新增：状态变化监听 ====
  useEffect(() => {
    
  }, [tasksByDate]);
  
  useEffect(() => {
    
  }, [templates]);
  

  



 
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
            return {
              ...t,
              progress: {
                ...t.progress,
                current: Math.min(Math.max(0, newCurrent), t.progress.target || 100)
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
      const newTasksByDate = {
        ...prev,
        [selectedDate]: (prev[selectedDate] || []).map(t =>
          t.id === task.id ? {
            ...t,
            progress: {
              ...t.progress,
              current: Math.min(Math.max(0, newCurrent), t.progress.target || 100)
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
  
  // ✅ 自动同步进度到对应的模板（静默同步，不显示提示）
  if (task.templateId && templates.length > 0) {
    console.log('🔄 检测到模板任务，尝试同步进度到模板:', task.templateId);
    
    const newCurrentValue = Math.min(Math.max(0, newCurrent), task.progress?.target || 100);
    
    let templateUpdated = false;
    const updatedTemplates = templates.map((template) => {
      if (template.id === task.templateId) {
        console.log(`✅ 找到匹配模板: ${template.name || template.text}`);
        templateUpdated = true;
        return {
          ...template,
          progress: {
            ...template.progress,
            current: newCurrentValue,
            target: task.progress?.target || template.progress?.target || 100,
            unit: task.progress?.unit || template.progress?.unit || "%"
          }
        };
      }
      return template;
    });
    
    if (templateUpdated) {
      setTemplates(updatedTemplates);
      saveMainData('templates', updatedTemplates);
      console.log(`✅ 模板进度已自动更新为: ${newCurrentValue}`);
      // ❌ 移除了 toast 提示，静默同步
    }
  }
};
  
  
// 更新任务时间（用于时间记录弹窗）
// 更新任务时间（用于时间记录弹窗）
// 更新任务时间（用于时间记录弹窗）
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
  const initializeApp = async () => {
    // 先迁移旧数据
    await migrateLegacyData();
    
    try {
 





// 加载任务数据
const savedTasks = await loadDataWithFallback('tasks', {});

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

// 加载模板数据
const savedTemplates = await loadDataWithFallback('templates', []);
if (savedTemplates) {
  setTemplates(savedTemplates);
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
useEffect(() => {
  let backupTimer;
  
  if (isInitialized) {
    // 检查今天是否已经备份过
    const lastBackupDate = localStorage.getItem('last_auto_backup_date');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastBackupDate !== today) {
      console.log('💾 今天首次打开，执行自动备份...');
      
      // 延迟5秒执行备份
      const timer = setTimeout(() => {
        autoBackup();
        localStorage.setItem('last_auto_backup_date', today);
        console.log('✅ 今日自动备份完成');
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('✅ 今天已经备份过，跳过自动备份');
    }
  }
  
  // 清理函数
  return () => {
    if (backupTimer) {
      clearInterval(backupTimer);
    }
  };
}, [isInitialized]);
 


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


// 每天第一次打开页面自动同步到云端
// 每天第一次打开页面自动同步到云端
// 每天第一次打开页面自动同步到云端
useEffect(() => {
  console.log('🔍 自动同步检查 - isInitialized:', isInitialized);
  
  if (!isInitialized) {
    console.log('🔍 等待初始化完成...');
    return;
  }
  
  const lastAutoSyncDate = localStorage.getItem('last_auto_sync_date');
  const today = new Date().toISOString().split('T')[0];
  
  console.log('🔍 同步检查:', { lastAutoSyncDate, today });
  
  if (lastAutoSyncDate !== today) {
    const token = localStorage.getItem('github_token');
    const autoSyncEnabled = localStorage.getItem('github_auto_sync') === 'true';
    
    console.log('🔍 同步条件:', { token: !!token, autoSyncEnabled });
    
    if (token && autoSyncEnabled) {
      console.log('☁️ 每天首次打开页面，自动同步到云端...', new Date().toLocaleString());
      
      const timer = setTimeout(() => {
        console.log('🚀 执行 syncToGitHub(true)');
        syncToGitHub(true);
        localStorage.setItem('last_auto_sync_date', today);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('⚠️ 条件不满足，跳过同步');
    }
  } else {
    console.log('✅ 今天已经同步过，跳过自动同步');
  }
}, [isInitialized]); // 依赖 isInitialized，当它变为 true 时会重新执行
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


// 自动保存模板数据
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    
    saveMainData('templates', templates);
  }
}, [templates, isInitialized]);

// 自动保存本月任务数据
useEffect(() => {
  if (isInitialized) {
    saveMainData('monthTasks', monthTasks);
  }
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



  // 获取本周任务
  // 获取本周任务
const getWeekTasks = () => {
  const allTasks = Object.values(tasksByDate).flat();
  const currentWeekStart = currentMonday.toISOString();
  
  // 只获取属于当前周的任务
  const weekTasks = allTasks.filter(task => 
    task.category === "本周任务" && 
    task.weekStart === currentWeekStart // 只显示当前周的任务
  );

  // 去重（同一个任务可能出现在多天）
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
  const isWeekComplete = weekTasks.length > 0 && weekTasks.every(task => task.done);  
  const pinnedTasks = useMemo(() => {
  return todayTasks.filter(task => task.pinned === true);
}, [todayTasks]);
  const weekDates = getWeekDates(currentMonday);

const calculateTotalCompletedTasks = useMemo(() => {
  let total = 0;
  Object.values(tasksByDate).forEach(dayTasks => {
    total += dayTasks.filter(task => task.done === true).length;
  });
  return total;
}, [tasksByDate]);

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
    
    // 排除本周任务和未完成的常规任务
    const learningTasks = dayTasks.filter(task => {
      if (task.category === "本周任务") return false;
      if (task.isRegularTask && !task.done) return false;
      return true;
    });
    
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




        




// 添加模板保存函数
// 添加模板保存函数
const handleAddTemplate = (templateData) => {
  const newTemplate = {
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, // ✅ 添加唯一ID
    ...templateData,
    createdAt: new Date().toISOString()
  };
  setTemplates(prev => [...prev, newTemplate]);
};

// 添加模板删除函数
const handleDeleteTemplate = (index) => {
  setTemplates(prev => prev.filter((_, i) => i !== index));
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

 // 在 handleAddTask 函数中（约在第 1620 行附近）
// 构建提醒时间 - 只有在有月和日时才创建
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
    timeRecords: [] , // 👈 添加这一行
    subTasks: [],
    note: "",
    reflection: "",
    image: null,
    scheduledTime: scheduledTime,
    pinned: false,
    tags: bulkTags || [],
    progress: {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    reminderTime: reminderTime,
    repeatFrequency: repeatConfig.frequency || '',
    repeatDays: repeatConfig.days || [false, false, false, false, false, false, false],
    isRepeating: !!(repeatConfig.frequency)
  };

  // 如果是重复任务，创建重复任务
  if (newTask.isRepeating) {
    const repeatId = `repeat_${Date.now()}`;
    newTask.repeatId = repeatId;
    
    const startDate = new Date(selectedDate);
    
    if (repeatConfig.frequency === 'daily') {
      // 每日重复 - 未来7天
      setTasksByDate(prev => {
        const newTasksByDate = { ...prev };
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          
          if (!newTasksByDate[dateStr]) {
            newTasksByDate[dateStr] = [];
          }
          
          const existingTask = newTasksByDate[dateStr].find(
            t => t.repeatId === repeatId
          );
          
          if (!existingTask) {
            newTasksByDate[dateStr].push({
              ...newTask,
              id: `${repeatId}_${dateStr}`,
              repeatId: repeatId
            });
          }
        }
        
        return newTasksByDate;
      });
    } else if (repeatConfig.frequency === 'weekly') {
      // 每周重复 - 未来4周
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (week * 7));
        const weekMonday = getMonday(weekStart);
        
        repeatConfig.days.forEach((isSelected, dayIndex) => {
          if (isSelected) {
            const taskDate = new Date(weekMonday);
            taskDate.setDate(weekMonday.getDate() + dayIndex);
            
            const dateStr = taskDate.toISOString().split("T")[0];
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
                  t => t.repeatId === repeatId
                );
                
                if (!existingTask) {
                  newTasksByDate[dateStr].push({
                    ...newTask,
                    id: `${repeatId}_${dateStr}`,
                    repeatId: repeatId
                  });
                }
                
                return newTasksByDate;
              });
            }
          }
        });
      }
    }
    
    // 同时添加今天的任务
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newTask]
    }));
    
  } else {
    // 普通任务：只添加到当前日期
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newTask]
    }));
  }

  // 清空输入
  setNewTaskText('');
  setNewTaskSubCategory('');
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

// 在 handleAddTask 函数附近添加这个函数
// 直接使用模板添加任务
// 直接使用模板添加任务（带提示）
// 直接使用模板添加任务（带模板ID标记）
const handleUseTemplate = (template, templateIndex) => {
  const newTask = {
    id: Date.now().toString(),
    text: template.text || template.content || '',
    category: template.category || '校内',
    subCategory: template.subCategory || '',
    done: false,
    timeSpent: 0,
    subTasks: template.subTasks || [],
    note: template.note || "",
    reflection: "",
    image: template.image || null,
    scheduledTime: template.scheduledTime || "",
    pinned: false,
    tags: template.tags || [],
    progress: template.progress || {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    reminderTime: null,
    createdAt: new Date().toISOString(),
    // ✅ 关键：添加模板ID标记，用于自动同步进度
    templateId: template.id || `template_${templateIndex}`,
    templateText: template.text  // 保存模板文字用于匹配
  };

  setTasksByDate(prev => ({
    ...prev,
    [selectedDate]: [...(prev[selectedDate] || []), newTask]
  }));

  // 显示短暂提示
  const toast = document.createElement('div');
  toast.textContent = `✅ 已添加: ${newTask.text.slice(0, 30)}`;
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
};

// 添加本周任务
// 在 handleAddWeekTask 函数中（约第 4070 行）
const handleAddWeekTask = (text, targetCategory = '校内', targetSubCategory = '') => {
  if (!text.trim()) return;

  const weekDates = getWeekDates(currentMonday);
  const taskId = Date.now().toString();
  const weekStart = currentMonday.toISOString();

  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    let hasChanges = false;

    weekDates.forEach(dateObj => {
      if (!newTasksByDate[dateObj.date]) {
        newTasksByDate[dateObj.date] = [];
      }

      // 检查是否已存在相同的本周任务
      const existingTask = newTasksByDate[dateObj.date].find(
        task => task.isWeekTask && 
               task.text === text.trim() && 
               task.weekStart === weekStart
      );

      if (!existingTask) {
        hasChanges = true;
        
        // ✅ 正确创建任务对象
        const newTask = {
          id: `${taskId}_${dateObj.date}`,
          text: text.trim(),
          category: "本周任务",
          subCategory: targetSubCategory || '',
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
          targetCategory: targetCategory,  // 完成后移动到的分类
          targetSubCategory: targetSubCategory
        };
        
        newTasksByDate[dateObj.date].push(newTask);
      }
    });

    // 显示成功提示
    if (hasChanges) {
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
    }

    return hasChanges ? newTasksByDate : prev;
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
    taskText = taskText.replace(/@所有家长[，,、.\s]*/g, '').trim();
    if (!taskText) continue;
    
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
  
  // ✅ 最简单的方法：直接解析 YYYY-MM-DD 格式的字符串
  let baseYear, baseMonth, baseDay;
  
  if (currentSelectedDate) {
    const parts = currentSelectedDate.split('-');
    baseYear = parseInt(parts[0]);
    baseMonth = parseInt(parts[1]) - 1; // 月份从0开始
    baseDay = parseInt(parts[2]);
  } else {
    const parts = selectedDate.split('-');
    baseYear = parseInt(parts[0]);
    baseMonth = parseInt(parts[1]) - 1;
    baseDay = parseInt(parts[2]);
  }
  
  console.log('基准日期年月日:', baseYear, baseMonth + 1, baseDay);
  
  if (!bulkText.trim()) {
    alert('请输入要导入的任务内容');
    return;
  }

  const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 2) {
    alert('请至少输入一行分类和一行任务内容');
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

  // 第一行是子分类标识
  const firstLine = lines[0];
  
  const category = "校内";
  let subCategory = "";
  
  const schoolCategory = categories.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || [];
  const defaultSubCategories = ['数学', '语文', '英语', '运动'];
  const allSubCategories = [...new Set([...schoolSubCategories, ...defaultSubCategories])];
  
  let matchedSubCategory = null;
  for (const subCat of allSubCategories) {
    if (firstLine.includes(subCat)) {
      matchedSubCategory = subCat;
      break;
    }
  }
  
  if (!matchedSubCategory) {
    const keywordMap = {
      '数学': ['数学', '数', 'math'],
      '语文': ['语文', '语', 'chinese'],
      '英语': ['英语', '英文', 'english'],
      '运动': ['运动', '体育', 'sport', '锻炼', '跑步', '跳绳']
    };
    
    for (const [subCat, keywords] of Object.entries(keywordMap)) {
      for (const keyword of keywords) {
        if (firstLine.toLowerCase().includes(keyword.toLowerCase())) {
          matchedSubCategory = subCat;
          break;
        }
      }
      if (matchedSubCategory) break;
    }
  }
  
  subCategory = matchedSubCategory || '未分类';
  
  const allTasksByDate = {};
  
  // ✅ 获取默认日期的函数 - 直接使用年月日，不用 Date 对象
  const getDefaultDates = () => {
    const dates = [];
    
    // 使用基准年月日
    let currentYear = baseYear;
    let currentMonth = baseMonth;
    let currentDay = baseDay;
    
    console.log('原始基准日期:', `${baseYear}-${baseMonth + 1}-${baseDay}`);
    
    const addDays = (days) => {
      const date = new Date(baseYear, baseMonth, baseDay + days);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    switch (bulkDateRange) {
      case 'today': {
        const dateStr = addDays(0);
        dates.push(dateStr);
        console.log('today 生成:', dateStr);
        break;
      }
      case 'next3': {
        for (let i = 0; i < 3; i++) {
          const dateStr = addDays(i);
          dates.push(dateStr);
          console.log(`next3 第${i + 1}天:`, dateStr);
        }
        break;
      }
      case 'next4': {
        for (let i = 0; i < 4; i++) {
          const dateStr = addDays(i);
          dates.push(dateStr);
          console.log(`next4 第${i + 1}天:`, dateStr);
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
  
  // 收集 taskInfos
  const taskInfos = [];
  let crossDateGroupIndex = 0;
  
  let i = 1;
  while (i < lines.length) {
    let line = lines[i];
    
    if (line === '[图片]' || line === '【图片】') {
      if (taskInfos.length > 0) {
        taskInfos[taskInfos.length - 1].hasImage = true;
      }
      i++;
      continue;
    }
    
    let taskLine = line;
    let taskDates = parseDateRangeFromText(taskLine);
    let cleanTaskLine = taskLine;
    
    if (taskDates) {
      const rangePattern = /@\d{1,2}[./月]\d{1,2}[日]?\s*-\s*\d{1,2}[./月]\d{1,2}[日]?/g;
      cleanTaskLine = taskLine.replace(rangePattern, '').trim();
    } else {
      taskDates = getDefaultDates();
    }
    
    let taskText = cleanTaskLine;
    let note = "";
    const parts = cleanTaskLine.split("|").map(s => s.trim());
    if (parts.length >= 2) {
      taskText = parts[0];
      note = parts[1];
    }
    
    taskText = taskText.replace(/@所有家长[，,、.\s]*/g, '').trim();
    
    if (taskText) {
      taskInfos.push({
        text: taskText,
        note: note,
        dates: taskDates,
        hasImage: false
      });
      console.log(`📝 任务: "${taskText}", 日期: ${taskDates.join(', ')}`);
    }
    
    i++;
  }
  
  const dailyTaskKeywords = ['课外阅读', '每天', '每日', '运动', '背单词', '练字', '写字', '阅读', '听英语', '口算'];
  
  taskInfos.forEach((taskInfo, idx) => {
    const { text: taskText, note, dates: taskDates, hasImage } = taskInfo;
    
    const isDailyTask = dailyTaskKeywords.some(keyword => taskText.includes(keyword));
    const crossDateId = (!isDailyTask && taskDates.length > 1) 
      ? `cross_${Date.now()}_${idx}_${crossDateGroupIndex++}` 
      : null;
    
    taskDates.forEach(date => {
      if (!allTasksByDate[date]) {
        allTasksByDate[date] = [];
      }
      
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}_${date}_${idx}`;
      
      const newTask = {
        id: uniqueId,
        text: taskText,
        category: category,
        subCategory: subCategory,
        done: false,
        timeSpent: 0,
        note: note,
        image: null,
        hasImage: hasImage,
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
        createdAt: new Date().toISOString(),
        isHoliday: isHolidayMode
      };
      
      if (crossDateId && taskDates.length > 1) {
        newTask.crossDateId = crossDateId;
        newTask.crossDates = [...taskDates];
        newTask.dateRange = {
          start: taskDates[0],
          end: taskDates[taskDates.length - 1],
          allDates: [...taskDates]
        };
      }
      
      allTasksByDate[date].push(newTask);
    });
  });
  
  const totalTasksCount = Object.values(allTasksByDate).reduce((sum, tasks) => sum + tasks.length, 0);
  
  if (totalTasksCount === 0) {
    alert('没有创建任何任务');
    return;
  }
  
  setTasksByDate(prev => {
    const updated = { ...prev };
    Object.entries(allTasksByDate).forEach(([date, newTasks]) => {
      if (!updated[date]) {
        updated[date] = [];
      }
      updated[date] = [...updated[date], ...newTasks];
    });
    return updated;
  });
  
  setBulkText("");
  setBulkTags([]);
  setBulkDateRange("today");
  setBulkDateRangeStart(new Date().toISOString().split('T')[0]);
  setBulkDateRangeEnd(new Date().toISOString().split('T')[0]);
  setShowBulkImportModal(false);
  
  alert(`✅ 导入成功！\n\n📌 位置：${category} / ${subCategory}\n📝 任务：${taskInfos.length} 个\n📅 实例：${totalTasksCount} 个`);
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

// 删除时间记录
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

// 删除任务
// 删除任务 - 确保能正确删除任务
// 在 App 组件中，找到 deleteTask 函数，确保它正确更新状态
const deleteTask = (task, deleteOption = 'today') => {
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    if (deleteOption === 'today') {
      if (newTasksByDate[selectedDate]) {
        newTasksByDate[selectedDate] = newTasksByDate[selectedDate].filter(t => t.id !== task.id);
        
        // ✅ 关键：如果这天没有任务了，删除这个日期键
        if (newTasksByDate[selectedDate].length === 0) {
          delete newTasksByDate[selectedDate];
          console.log(`🗑️ 删除空日期: ${selectedDate}`);
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
          
          // ✅ 关键：如果这天没有任务了，删除这个日期键
          if (newTasksByDate[date].length === 0) {
            delete newTasksByDate[date];
            console.log(`🗑️ 删除空日期: ${date}`);
          }
        }
      });
    } else if (deleteOption === 'all') {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].filter(t => t.id !== task.id);
        
        // ✅ 关键：如果这天没有任务了，删除这个日期键
        if (newTasksByDate[date].length === 0) {
          delete newTasksByDate[date];
          console.log(`🗑️ 删除空日期: ${date}`);
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
    
    if (task.isWeekTask) {
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t =>
          t.isWeekTask && t.text === task.text ? {
            ...t,
            text: editData.text,
            note: editData.note || "",
            reflection: editData.reflection || "",
            category: editData.category,
            subCategory: editData.subCategory || '',
            scheduledTime: editData.scheduledTime || "",
            tags: editData.tags || [],
            subTasks: editData.subTasks || [],
            progress: editData.progress || t.progress,  // ← 添加这行！
            reminderTime: reminderTime,
          } : t
        );
      });
    } else {
      newTasksByDate[selectedDate] = (newTasksByDate[selectedDate] || []).map(t =>
        t.id === task.id ? {
          ...t,
          text: editData.text,
          note: editData.note || "",
          reflection: editData.reflection || "",
          category: editData.category,
          subCategory: editData.subCategory || '',
          scheduledTime: editData.scheduledTime || "",
          tags: editData.tags || [],
          subTasks: editData.subTasks || [],
          reminderTime: reminderTime,
          progress: editData.progress || t.progress,
        } : t
      );
    }
    
    return newTasksByDate;
  });
  
  console.log('✅ 任务已保存，reminderTime:', reminderTime);
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



// 找到 getCategoryTasks 函数的定义，确保它是这样写的
const getCategoryTasks = useCallback((catName) => {
  const dateTasks = tasksByDate[selectedDate] || [];
  const result = dateTasks.filter(t => 
    t.category === catName && 
    t.pinned !== true
  );
  return result;
}, [tasksByDate, selectedDate]);
  // 计算分类总时间
  const totalTime = (catName) =>
    getCategoryTasks(catName).reduce((sum, t) => sum + (t.timeSpent || 0), 0);

// 不需要修改 toggleDone，用更简单的方式



// 替换原来的撒花检测 useEffect



// 切换到上一周
const prevWeek = () => {
  const monday = new Date(currentMonday);
  monday.setDate(monday.getDate() - 7);
  
  setCurrentMonday(monday);
  
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  const newSelectedDate = `${year}-${month}-${day}`;
  
  setSelectedDate(newSelectedDate);
  
  // 重置完成状态记录
  setTimeout(() => {
    categories.forEach(cat => {
      const catTasks = getCategoryTasks(cat.name);
      if (catTasks.length === 0) return;
      lastCompletionStatus.current[cat.name] = catTasks.every(task => task.done === true);
    });
  }, 100);
};

const nextWeek = () => {
  try {
    const newMonday = new Date(currentMonday);
    newMonday.setDate(newMonday.getDate() + 7);
    
    setCurrentMonday(newMonday);
    
    const year = newMonday.getFullYear();
    const month = String(newMonday.getMonth() + 1).padStart(2, '0');
    const day = String(newMonday.getDate()).padStart(2, '0');
    const newSelectedDate = `${year}-${month}-${day}`;
    
    setSelectedDate(newSelectedDate);
    
    // 重置完成状态记录
    setTimeout(() => {
      categories.forEach(cat => {
        const catTasks = getCategoryTasks(cat.name);
        if (catTasks.length === 0) return;
        lastCompletionStatus.current[cat.name] = catTasks.every(task => task.done === true);
      });
    }, 100);
  } catch (error) {
    console.error('切换下一周时出错:', error);
  }
};

const handleDateSelect = (selectedDate) => {
  const localSelectedDate = new Date(
    selectedDate.getFullYear(), 
    selectedDate.getMonth(), 
    selectedDate.getDate()
  );
  const selectedMonday = getMonday(localSelectedDate);
  
  const year = localSelectedDate.getFullYear();
  const month = String(localSelectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(localSelectedDate.getDate()).padStart(2, '0');
  const newSelectedDate = `${year}-${month}-${day}`;
  
  setCurrentMonday(selectedMonday);
  setSelectedDate(newSelectedDate);
  setShowDatePickerModal(false);
  
  // 🔑 切换日期时不清除任何状态，让新日期独立检测
  // 不需要调用 checkAndTriggerConfetti
};


// 清空所有数据
const clearAllData = async () => {
  if (window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
    // 清空任务数据
    setTasksByDate({});
    setTemplates([]);
    
    // 清空本月任务
    setMonthTasks([]);
    
    // 清空每日复盘和评分
    setDailyRatings({});
    setDailyReflections({});
    
    // 清空学习结束时间
    setStudyEndTimes({});
    
    // 清空每日提醒
    setReminderText('');
    localStorage.setItem('daily_reminder', '');
    
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
    localStorage.removeItem('study-tracker-PAGE_A-v2_isInitialized');
    
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




// 替换现有的 handleExportData 函数
// 替换现有的 handleExportData 函数
// 找到 handleExportData 函数，添加 reminderText
const handleExportData = async () => {
  try {
    const allData = {
      tasks: await loadDataWithFallback('tasks', {}),
      templates: await loadDataWithFallback('templates', []),
      categories: await loadDataWithFallback('categories', baseCategories),
      dailyRatings: dailyRatings || {},
      dailyReflections: dailyReflections || {},
      grades: await loadDataWithFallback('grades', []),
      monthTasks: monthTasks || [],
      reminderText: reminderText || '',  // 添加这行
      exportDate: new Date().toISOString(),
      version: '2.2'  // 更新版本号
    };
    
    const dataStats = {
      任务天数: Object.keys(allData.tasks || {}).length,
      模板数量: (allData.templates || []).length,
      有复盘的日期: Object.keys(allData.dailyReflections || {}).length,
      成绩记录: (allData.grades || []).length,
      本月任务: (allData.monthTasks || []).length,
      每日提醒: allData.reminderText ? '有' : '无'  // 添加统计
    };
    
    console.log('📊 导出数据统计:', dataStats);
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `study-tracker-backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert(`✅ 导出成功！\n\n导出内容：\n• 任务天数: ${dataStats.任务天数}\n• 模板数量: ${dataStats.模板数量}\n• 复盘天数: ${dataStats.有复盘的日期}\n• 成绩记录: ${dataStats.成绩记录}\n• 本月任务: ${dataStats.本月任务}\n• 每日提醒: ${dataStats.每日提醒}`);
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试: ' + error.message);
  }
};




  








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

if (isInitialized && todayTasks.length === 0) {
  console.warn('⚠️ 警告: 已初始化但今日任务为空');
}



  return (
    <div style={{
    maxWidth: 600,
    margin: "0 auto",
    padding: 15,
    fontFamily: "sans-serif",
    backgroundColor: "#fcfdff",
    overflowX: "hidden",
    width: "100%",
    boxSizing: "border-box",
    // 👇 添加这行：为滚动条预留空间
    scrollbarGutter: 'stable'
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





{/* 子类别管理模态框 */}
{editingCategory && (
  <SubCategoryModal
    category={editingCategory}
    onSave={handleSaveSubCategories}
    onClose={() => setEditingCategory(null)}
  />
)}



{/* 里程碑模态框 */}
{showMilestoneModal && (
  <MilestoneModal
    onClose={() => setShowMilestoneModal(false)}
    totalCompletedTasks={calculateTotalCompletedTasks}
  />
)}
 
   

    {showGradeModal && (
      <GradeModal 
      key={Date.now()}  // 👈 添加这行，每次打开都重新创建组件
        onClose={() => setShowGradeModal(false)} 
        isVisible={showGradeModal}
      />
    )}

{showWeekTaskModal && (
  <WeekTaskModal
    onClose={() => setShowWeekTaskModal(false)}
    onAdd={(text, targetCategory, targetSubCategory) => {
      handleAddWeekTask(text, targetCategory, targetSubCategory);
      setShowWeekTaskModal(false);
    }}
    categories={categories}  // 确保传递了 categories
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
        task.id === taskId
          ? { ...task, progress: newProgress }
          : task
      ));
    }}
    onEditTask={handleEditMonthTask}
    onDeleteTask={handleDeleteMonthTask}
  />
)}

      
  






      {showTimeModal && (
        <TimeModal
          config={repeatConfig}
          onSave={(newConfig) => setRepeatConfig(newConfig)}
          onClose={() => setShowTimeModal(false)}
        />
      )}




{/* 添加这行 */}
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








{showTemplateModal && (
  <TemplateModal
    templates={templates}
    onSave={(templateData) => {
      // 支持数组更新（编辑模板时传入整个数组）
      if (Array.isArray(templateData)) {
        setTemplates(templateData);
      } else {
        handleAddTemplate(templateData);
      }
    }}
    categories={categories}
    onClose={() => setShowTemplateModal(false)}
    onDelete={handleDeleteTemplate}
    setCategories={setCategories}
  />
)}


{showGitHubSyncModal && (
  <GitHubSyncModal
    config={syncConfig}
    onSave={(newConfig) => {
      localStorage.setItem('github_token', newConfig.token);
      localStorage.setItem('github_auto_sync', newConfig.autoSync.toString());
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
    onSave={(task, editData) => {
      console.log('🔴🔴🔴 App中的onSave被调用！');
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
      {/* 备份管理模态框 */}
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
      // 复制逻辑
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
    toggleDone={toggleDone}        // ✅ 新增这一行
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


<div style={{
  position: "relative",
  textAlign: "center",
  marginBottom: 15,
  padding: "0 40px"
}}>
 {/* 右上角成绩记录按钮 */}
{/* 右上角成绩记录按钮 - 柱状图图标 */}
<button
  onClick={() => setShowGradeModal(true)}
  style={{
    position: "absolute",
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    padding: 0
  }}
  title="成绩记录"
>
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 第一个柱子 */}
    <rect x="4" y="12" width="4" height="8" fill="#61A2Da" rx="0.5"/>
    {/* 第二个柱子 - 最高 */}
    <rect x="10" y="6" width="4" height="14" fill="#61A2Da" rx="0.5"/>
    {/* 第三个柱子 */}
    <rect x="16" y="9" width="4" height="11" fill="#61A2Da" rx="0.5"/>
    {/* 底部横线 */}
    <line x1="2" y1="20" x2="22" y2="20" stroke="#61A2Da" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
</button>
    {/* 🏆 左上角奖杯按钮 - 新增 */}
{/* 🏆 左上角奖杯按钮 - 改为简笔画奖牌 */}
<button
  onClick={() => setShowMilestoneModal(true)}
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: 36,
    height: 36,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    padding: 0
  }}
  title="里程碑"
>
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 奖牌主体圆形 */}
    <circle cx="12" cy="10" r="7" stroke="#61A2Da" strokeWidth="1.8" fill="none"/>
    {/* 中间五角星 */}
    <polygon 
      points="12,5.5 13.5,9 17,9 14.2,11.2 15.2,14.5 12,12.5 8.8,14.5 9.8,11.2 7,9 10.5,9" 
      fill="#61A2Da" 
      stroke="none"
    />
    {/* 绶带（左） */}
    <path d="M9 17 L7 22 L12 20 L17 22 L15 17" stroke="#61A2Da" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
  </svg>
</button>
  {/* 标题 */}
  <h1 style={{
    textAlign: "center",
    color: "#61A2Da",
    fontSize: "20px",
    margin: 0,
    padding: "10px 0", // 添加上下内边距来垂直居中
    lineHeight: "16px" // 恢复默认行高
  }}>
    学习记录
  </h1>
</div>

      
      <div style={{
        textAlign: "center",
        fontSize: 13,
        marginTop: "-5px",      // 确保为0
        marginBottom: 10
      }}>
        
已打卡 {
  Object.values(tasksByDate).filter(dailyTasks => 
    dailyTasks.some(task => task.done === true)
  ).length
} 天，累计完成 {Object.values(tasksByDate).flat().filter(t => t.done).length} 个学习任务
      </div>


{/* 第一行：周次（左） + 四个按钮（右） */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4
}}>
  {/* 左侧：周次显示 */}
 <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
 <button
  className="week-nav-btn"
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
    width: "24px",
    height: "24px",
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
      margin: "0",
      fontSize: "13px",
      cursor: "pointer",
      padding: "4px 6px",
      borderRadius: "6px",
      transition: "background-color 0.2s",
      display: "inline-block",
      lineHeight: "16px",
      verticalAlign: "middle",
      color: "#61A2Da"       // ← 添加文字颜色
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8f0fe"}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    title="点击选择日期"
  >
    {currentMonday.getFullYear()}年 第{getWeekNumber(currentMonday)}周
  </span>

<button
  className="week-nav-btn"
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
    width: "24px",
    height: "24px",
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


<div style={{ display: "flex", gap: "6px" }}>
  {/* 本周按钮 */}
  <div
    onClick={() => setShowWeekTaskModal(true)}
    style={{
      padding: "4px 8px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
      textAlign: "center"
    }}
  >
    本周
  </div>
  
  {/* 本月按钮 */}
  <div
    onClick={() => setShowMonthTaskModal(true)}
    style={{
      padding: "4px 8px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
      textAlign: "center"
    }}
  >
    本月
  </div>
  
  {/* 模板按钮 */}
  <div
    onClick={() => setShowTemplateList(!showTemplateList)}
    style={{
      padding: "4px 8px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
      textAlign: "center"
    }}
  >
    模板
  </div>
  
  {/* 添加按钮 */}
  <div
    onClick={() => setShowAddTaskModal(true)}
    style={{
      padding: "4px 8px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
      textAlign: "center"
    }}
  >
    添加
  </div>
  
  {/* 批量按钮 */}
  <div
    onClick={() => setShowBulkImportModal(true)}
    style={{
      padding: "4px 8px",
      backgroundColor: "#61A2Da",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
      textAlign: "center"
    }}
  >
    批量
  </div>
</div>
</div>



{/* 👇 模板列表 - 在这里展开（日期行上方） */}
{showTemplateList && (
  <div style={{
    marginBottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '6px 0'
  }}>
    {/* 左侧：现有模板（靠右，所以放在右边区域） */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      {templates.length === 0 ? (
        <span style={{ fontSize: '10px', color: '#999' }}>暂无模板</span>
      ) : (
        templates.map((template, index) => (
          <span
            key={template.id || index}
            onClick={() => {
              // 使用模板添加任务 - 带模板ID标记，支持进度自动同步
              const newTask = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: template.text || '',
                category: template.category || '校内',
                subCategory: template.subCategory || '',
                done: false,
                timeSpent: 0,timeRecords: [],  // 👈 添加
                subTasks: template.subTasks || [],
                note: template.note || "",
                reflection: "",
                image: template.image || null,
                scheduledTime: template.scheduledTime || "",
                pinned: false,
                tags: template.tags || [],
                progress: template.progress || {
                  initial: 0,
                  current: 0,
                  target: 0,
                  unit: "%"
                },
                reminderTime: null,
                createdAt: new Date().toISOString(),
                // ✅ 关键：添加模板ID标记，用于自动同步进度
                templateId: template.id,
                templateText: template.text
              };
              
              setTasksByDate(prev => ({
                ...prev,
                [selectedDate]: [...(prev[selectedDate] || []), newTask]
              }));
              
              // 显示短暂提示（2秒后消失）
              const toast = document.createElement('div');
              toast.textContent = `✅ 已添加: ${newTask.text.slice(0, 30)}`;
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
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              `;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 2000);
            }}
            style={{
              cursor: 'pointer',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#f0f0f0',
              color: '#333'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            title={template.progress?.current > 0 ? `当前进度: ${template.progress.current}/${template.progress.target} ${template.progress.unit}` : ''}
          >
            {template.name || template.text?.slice(0, 15) || `模板${index + 1}`}
          </span>
        ))
      )}
    </div>
    
    {/* 右侧：灰色的 + 按钮 */}
   {/* 右侧：灰色的 + 按钮 */}
<span
  onClick={() => setShowTemplateModal(true)}  // ✅ 检查这个
  style={{
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "normal",
    color: "#999",
    background: "transparent",
    padding: "0",
    width: "18px",
    height: "18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  }}
  title="添加新模板"
>
  +
</span>
  </div>
)}


{/* 第三行：日期（周一到周日） */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
}}>
  {weekDates.map((d) => {
    const dateStr = d.date;
    const isSelected = dateStr === selectedDate;
    const dayTasks = tasksByDate[dateStr] || [];
    
    const hasCrossDateTask = dayTasks.some(task => task.crossDateId || task.dateRange);
    
    // ✅ 检查当天是否有假期任务
    const hasHolidayTask = dayTasks.some(task => task.isHoliday === true);
    
    // 筛选有效任务
    const filteredTasks = dayTasks.filter(task => {
      if (task.category === "本周任务") return false;
      if (task.isRegularTask && !task.done) return false;
      return true;
    });
    
    // ========== 统计逻辑 ==========
    // 总任务数（包括放弃的任务）
    const totalCount = filteredTasks.length;
    
    // 未放弃的任务列表
    const notAbandonedTasks = filteredTasks.filter(task => !task.abandoned);
    
    // 未放弃的数量 ⭐ 添加这一行
    const notAbandonedCount = notAbandonedTasks.length;
    
    // 放弃的任务数
    const abandonedCount = filteredTasks.filter(task => task.abandoned).length;
    
    // 未放弃的任务中，已完成的数量
    const completedNotAbandonedCount = notAbandonedTasks.filter(task => {
      if (task.crossDateId) {
        const crossTaskDates = task.crossDates || [];
        return crossTaskDates.some(date => {
          const dateTasks = tasksByDate[date] || [];
          const taskOnDate = dateTasks.find(t => t.crossDateId === task.crossDateId);
          return taskOnDate?.done === true;
        });
      }
      return task.done;
    }).length;
    
    // 是否有未完成且未放弃的任务（待处理）
    const hasPendingNotAbandoned = notAbandonedTasks.some(task => {
      if (task.crossDateId) {
        const crossTaskDates = task.crossDates || [];
        return !crossTaskDates.some(date => {
          const dateTasks = tasksByDate[date] || [];
          const taskOnDate = dateTasks.find(t => t.crossDateId === task.crossDateId);
          return taskOnDate?.done === true;
        });
      }
      return !task.done;
    });
    
    // 判断显示状态
    let numberColor = "#666";  // 默认灰色
    let dotColor = "#666";
    
    if (totalCount === 0) {
      // 没有任务 → 不显示
      numberColor = "transparent";
      dotColor = "transparent";
    } else if (hasPendingNotAbandoned) {
      // 有待处理的未放弃任务 → 红色
      numberColor = "#f44336";
      dotColor = "#f44336";
    } else if (abandonedCount > 0 && completedNotAbandonedCount === notAbandonedCount) {
      // 有放弃的任务，且所有未放弃的任务都完成了 → 灰色
      numberColor = "#999";
      dotColor = "#999";
    } else if (completedNotAbandonedCount === totalCount && totalCount > 0) {
      // 所有任务都完成（没有放弃的任务） → 绿色
      numberColor = "#4caf50";
      dotColor = "#4caf50";
    }
    
    // 是否显示数字（有任务时都显示）
    const showNumber = totalCount > 0;
    
    const dailyRating = dailyRatings[dateStr] || 0;
    const studyEndTime = studyEndTimes[dateStr] || '';
    
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
    
    return (
  <div
  key={dateStr}
  onClick={() => setSelectedDate(dateStr)}
  style={{
    padding: "4px 6px",
    borderBottom: `2px solid ${isSelected ? "#0b52b0" : "#e0e0e0"}`,
    textAlign: "center",
    flex: 1,
    minWidth: 0,
    margin: "0 2px",
    fontSize: 12,
    cursor: "pointer",
    backgroundColor: isSelected ? "#fff9c4" : "transparent",
    color: isSelected ? "#000" : "#000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "20px",
    background: dailyRating > 0 
      ? `linear-gradient(to bottom, ${isSelected ? '#fff9c4' : 'transparent'} 0%, ${isSelected ? '#fff9c4' : 'transparent'} 50%, ${getRatingColor(dailyRating)}20 100%)`
      : isSelected ? '#fff9c4' : 'transparent'
  }}
>
  {/* 第一行：周几 + 休字（休字不占位，贴在右边） */}
  <div style={{ 
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
    <span>{d.label}</span>
    {hasHolidayTask && (
      <span style={{
        position: "absolute",
        left: "100%",
        marginLeft: "2px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "10px",
        height: "10px",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "2px",
        fontSize: "7px",
        color: "#f44336",
        boxSizing: "border-box",
        padding: 0,
        lineHeight: 1,
        textAlign: "center",
        whiteSpace: "nowrap"
      }}>
        休
      </span>
    )}
  </div>
  
  <div style={{ fontSize: 10 }}>{d.date.slice(5)}</div>
  
  {/* 任务数量显示 */}
  {showNumber && (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      marginTop: "2px"
    }}>
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: dotColor
      }} />
      <span style={{
        fontSize: "9px",
        fontWeight: "bold",
        color: numberColor
      }}>
        {completedNotAbandonedCount}/{totalCount}
      </span>
    </div>
  )}
  
  {/* 结束时间显示 */}
  {studyEndTime && (() => {
    const [hour, minute] = studyEndTime.split(':').map(Number);
    const isAfter9PM = hour > 21 || (hour === 21 && minute > 0);
    return (
      <div style={{
        fontSize: "8px",
        color: isAfter9PM ? "#f44336" : "#999",
        marginTop: "2px",
        whiteSpace: "nowrap"
      }}>
        {studyEndTime}
      </div>
    );
  })()}
</div>
);

  })}
</div>










{/* 跑马灯提醒 + 两个小按钮 */}
<div style={{
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: 10
}}>
  {/* 跑马灯提醒 - 点击可编辑 */}
  <div
    onClick={() => {
      const newText = window.prompt('编辑提醒内容：', reminderText);
      if (newText !== null) {
        handleReminderChange(newText);
      }
    }}
    style={{
      flex: 1,
      padding: '0 12px',
      backgroundColor: '#ffebee',
      borderRadius: 8,
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(244, 67, 54, 0.1)',
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
          style={{
            position: 'absolute',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            color: '#c62828',
            fontWeight: '500',
            lineHeight: '32px',
            animation: 'rightToLeft 30s linear infinite'
          }}
        >
          {reminderText}
        </div>
      ) : (
        <div style={{
          fontSize: '13px',
          color: '#ef5350',
          fontStyle: 'italic',
          lineHeight: '32px',
          textAlign: 'center'
        }}>
          点击添加每日提醒...
        </div>
      )}
    </div>
  </div>



 
</div>

{/* 跑马灯动画样式 */}
<style>{`
  @keyframes rightToLeft {
    0% {
      left: 100%;
      transform: translateX(0);
    }
    100% {
      left: 0%;
      transform: translateX(-100%);
    }
  }
  

  /* 🎉 撒花放大动画 */
@keyframes confettiPop {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  70% {
    transform: translate(-50%, -30px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -80px) scale(1.5);
    opacity: 0;
  }
}
 /* 👇 在这里添加周次箭头按钮的样式 */
  button.week-nav-btn,
  button.week-nav-btn:hover,
  button.week-nav-btn:active,
  button.week-nav-btn:focus,
  button.week-nav-btn:focus-visible,
  button.week-nav-btn:active:focus,
  button.week-nav-btn:active:hover {
    background-color: transparent !important;
    color: #61A2Da !important;
    transform: none !important;
    scale: 1 !important;
    opacity: 1 !important;
    outline: none !important;
    box-shadow: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
`}</style>


{/* 添加任务弹窗 */}
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
      <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#61A2Da' }}>添加任务</h3>
      
      {/* 任务输入框 */}
      <input
        type="text"
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        placeholder="输入任务内容"
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
      
      {/* 分类选择 */}
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
      
      {/* 子分类选择 */}
      {newTaskCategory === '校内' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>子分类：</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(() => {
              const schoolCategory = categories.find(c => c.name === '校内');
              const subCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];
              return subCategories.map(sub => (
                <div
                  key={sub}
                  onClick={() => setNewTaskSubCategory(sub)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    backgroundColor: newTaskSubCategory === sub ? '#1a73e8' : '#f0f0f0',
                    color: newTaskSubCategory === sub ? '#fff' : '#333',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                >
                  {sub}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
      
      {/* 按钮区域 - 使用 div 代替 button，彻底移除悬浮效果 */}
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
            cursor: 'pointer',
            transition: 'none',
            transform: 'none',
            scale: 1,
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ccc';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.scale = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ccc';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.scale = 1;
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.scale = 1;
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
            cursor: 'pointer',
            transition: 'none',
            transform: 'none',
            scale: 1,
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#61A2Da';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.scale = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#61A2Da';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.scale = 1;
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.scale = 1;
          }}
        >
          确认添加
        </div>
      </div>
    </div>
  </div>
)}

{/* 批量导入弹窗 */}
{/* 批量导入弹窗 */}
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
    padding: '10px'
  }} onClick={() => setShowBulkImportModal(false)}>
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '450px',
      maxHeight: '80vh',
      overflow: 'auto'
    }} onClick={e => e.stopPropagation()}>
      <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#61A2Da' }}>批量导入任务</h3>
      
      {/* 批量文本输入框 */}
      <textarea
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        placeholder={`第一行：子分类（如：数学、语文、英语、运动）
第二行起：任务内容`}
        style={{
          width: '100%',
          minHeight: 150,
          padding: 10,
          borderRadius: 8,
          border: '1px solid #ccc',
          fontSize: '13px',
          fontFamily: 'monospace',
          resize: 'vertical',
          boxSizing: 'border-box',
          marginBottom: 12
        }}
      />
      
      {/* 日期范围选择 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>日期范围：</div>
       
<select
  value={bulkDateRange}
  onChange={(e) => {
    setBulkDateRange(e.target.value);
    if (e.target.value === 'custom') {
      // ✅ 使用 selectedDate 作为默认日期
      setBulkDateRangeStart(selectedDate);
      setBulkDateRangeEnd(selectedDate);
    }
  }}
  style={{
    width: '100%',
    padding: '8px',
    borderRadius: 6,
    border: '1px solid #ccc',
    fontSize: '13px',
    backgroundColor: '#fff'
  }}
>
  <option value="today">仅当天</option>
  <option value="next3">未来3天（从选中日期开始）</option>
  <option value="next4">未来4天（从选中日期开始）</option>
  <option value="custom">自定义</option>
</select>
        
        {bulkDateRange === 'custom' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="date"
              value={bulkDateRangeStart}
              onChange={(e) => setBulkDateRangeStart(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: 4, border: '1px solid #ccc' }}
            />
            <span>至</span>
            <input
              type="date"
              value={bulkDateRangeEnd}
              onChange={(e) => setBulkDateRangeEnd(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
        )}
      </div>

      {/* 👇 新增：假期模式开关 */}
      <div style={{ 
        marginBottom: 16, 
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#333' }}>🏖️ 假期模式</span>
          
        </div>
        
        {/* 滑动开关 - 无悬浮效果 */}
        <div
          onClick={() => setIsHolidayMode(!isHolidayMode)}
          style={{
            width: '44px',
            height: '24px',
            backgroundColor: isHolidayMode ? '#f44336' : '#ccc',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'none',
            transform: 'none',
            scale: 1,
            position: 'relative',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isHolidayMode ? '#f44336' : '#ccc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isHolidayMode ? '#f44336' : '#ccc';
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#fff',
              borderRadius: '10px',
              position: 'absolute',
              top: '2px',
              left: isHolidayMode ? '22px' : '2px',
              transition: 'none',
              transform: 'none',
              scale: 1,
              boxShadow: 'none'
            }}
          />
        </div>
      </div>
      
      {/* 按钮区域 */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <div
          onClick={() => setShowBulkImportModal(false)}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: '#ccc',
            color: '#333',
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
        >
          取消
        </div>
        <div
          onClick={() => {
            
            handleImportTasksWithDuration(selectedDate);
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
            cursor: 'pointer',
            transition: 'none',
            transform: 'none',
            scale: 1,
            boxShadow: 'none'
          }}
        >
          确认导入
        </div>
      </div>
    </div>
  </div>
)}

{/* 添加动画样式 */}
<style>{`
  @keyframes rightToLeft {
    0% {
      left: 100%;
      transform: translateX(0);
    }
    100% {
      left: 0%;
      transform: translateX(-100%);
    }
  }
`}</style>


{/* 置顶任务区域 */}
{pinnedTasks.length > 0 && (
  <div style={{
    marginBottom: 8,
    borderRadius: 10,
    overflow: "hidden",
    border: "2px solid #ffcc00",
    backgroundColor: "#fff"
  }}>
    <div style={{
      backgroundColor: "#ffcc00",
      color: "#000",
      padding: "6px 10px",
      fontWeight: "bold",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <span>置顶 ({pinnedTasks.length})</span>
      <span>...</span>
    </div>
    <ul style={{
      listStyle: "none",
      padding: 8,
      margin: 0
    }}>
      {pinnedTasks
        .sort((a, b) => b.id - a.id)
        .map((task) => (
          <div 
            key={task.id} 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <TaskItem
              task={task}
              onEditTime={editTaskTime}
              tasksByDate={tasksByDate}  
              getTaskCompletionType={getTaskCompletionType}
              onEditNote={editTaskNote}
              onDeleteTask={deleteTask}
              onEditReflection={editTaskReflection}
              onOpenEditModal={openTaskEditModal}
              onShowImageModal={setShowImageModal}
              onDeleteImage={handleDeleteImage}
              toggleDone={toggleDone}
              formatTimeNoSeconds={formatTimeNoSeconds}
              formatTimeWithSeconds={formatTimeWithSeconds}
              onMoveTask={moveTask}
              categories={categories}
              selectedDate={selectedDate}
              setShowMoveModal={setShowMoveModal}
              onUpdateProgress={handleUpdateProgress}
              onToggleSubTask={toggleSubTask}
              onEditSubTask={editSubTask}
            />
          </div>
        ))}
    </ul>
  </div>
)}



{/* 本周复盘汇总 - 仅在周日显示 */}
{(() => {
  const today = new Date(selectedDate);
  const isSunday = today.getDay() === 0; // 0代表周日
  
  if (!isSunday) return null;
  
  // 获取本周所有日期的复盘内容
  const weekDates = getWeekDates(currentMonday);
  const weekReflections = weekDates
    .map(dateObj => {
      const reflection = dailyReflections[dateObj.date] || '';
      const rating = dailyRatings[dateObj.date] || 0;
      return {
        date: dateObj.date,
        label: dateObj.label,
        reflection: reflection,
        rating: rating
      };
    })
    .filter(item => item.reflection.trim() !== ''); // 只显示有复盘的日期
  
  const getRatingEmoji = (rating) => {
    if (rating === 5) return '🥳';
    if (rating === 4) return '😊';
    if (rating === 3) return '😐';
    if (rating === 2) return '😕';
    if (rating === 1) return '😞';
    return '';
  };
  
  const hasReflections = weekReflections.length > 0;
  
  return (
    <div style={{
      marginBottom: 8,
      borderRadius: 10,
      overflow: "hidden",
      border: "2px solid #9C27B0",
      backgroundColor: "#fff"
    }}>
      <div
        onClick={() => setCollapsedCategories(prev => ({
          ...prev,
          "weekReflections": !prev["weekReflections"]
        }))}
        style={{
          backgroundColor: "#9C27B0",
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
        <span>
          本周复盘汇总 ({weekReflections.length})
        </span>
      </div>

      {!collapsedCategories["weekReflections"] && hasReflections && (
        <div style={{ padding: 12 }}>
          {weekReflections.map((item, index) => (
            <div
              key={item.date}
              style={{
                marginBottom: index < weekReflections.length - 1 ? 12 : 0,
                paddingBottom: index < weekReflections.length - 1 ? 12 : 0,
                borderBottom: index < weekReflections.length - 1 ? "1px solid #f0f0f0" : "none"
              }}
            >
              <div style={{
                fontWeight: "bold",
                color: "#9C27B0",
                marginBottom: 6,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    ({item.date.slice(5)})
                  </span>
                </div>
                <div style={{ fontSize: '16px' }}>
                  {getRatingEmoji(item.rating)}
                </div>
              </div>
              <div style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#333",
                backgroundColor: "#f9f9f9",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid #e0e0e0",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word"
              }}>
                {item.reflection}
              </div>
            </div>
          ))}
        </div>
      )}

      {!collapsedCategories["weekReflections"] && !hasReflections && (
        <div style={{
          padding: 20,
          textAlign: "center",
          color: "#666",
          fontSize: 13,
          backgroundColor: "#f8f9fa"
        }}>
          本周暂无复盘内容
        </div>
      )}
    </div>
  );
})()}



{weekTasks.length > 0 && (
  <div style={{ 
    marginBottom: 8, 
    borderRadius: 10, 
    overflow: "hidden", 
    border: `2px solid ${isWeekComplete ? "#ccc" : "#FF9800"}`,
    backgroundColor: "#fff" 
  }}>
    <div 
      onClick={() => setCollapsedCategories(prev => ({ ...prev, "本周任务": !prev["本周任务"] }))}
      style={{ 
        backgroundColor: isWeekComplete ? "#f5f5f5" : "#FF9800",
        color: isWeekComplete ? "#bbb" : "#fff",
        fontFamily: 'Calibri, "微软雅黑", sans-serif',  // ← 添加字体
        padding: "3px 12px",                            // ← 改成 3px 12px
        fontWeight: isWeekComplete ? "normal" : "bold",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        fontSize: "13px",
        minHeight: "24px"
      }}
    >
      {/* 左侧：标题和完成状态 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          本周任务 ({weekTasks.filter(t => t.done).length}/{weekTasks.length})
          {isWeekComplete && <SquareCheckMark show={true} size={12} color="#bbb" />}
        </span>
      </div>
      
      {/* 右侧：排序按钮（没有 + 按钮） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (sortingSubCategory?.category === "本周任务" && !sortingSubCategory?.subCategory) {
              setSortingSubCategory(null);
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
              <path d="M20 6L9 17L4 12" stroke="#333" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="6" x2="20" y2="6" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="4" y1="18" x2="20" y2="18" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      </div>
    </div>

   {!collapsedCategories["本周任务"] && (
  <div style={{ padding: "8px" }}>  {/* ← 添加 padding */}
    <SortableTaskList
      tasks={weekTasks}
      category="本周任务"
      subCategory={null}
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
  onOpenEditModal={openTaskEditModal}     // ← 添加这一行！
  onShowImageModal={setShowImageModal}
  toggleDone={toggleDone}
  formatTimeNoSeconds={formatTimeNoSeconds}
  formatTimeWithSeconds={formatTimeWithSeconds}
  onMoveTask={moveTask}
  categories={categories}
  setShowMoveModal={setShowMoveModal}
  onUpdateProgress={handleUpdateProgress}
  onEditSubTask={editSubTask}
  onToggleSubTask={toggleSubTask}
  getTaskCompletionType={getTaskCompletionType}
    />
  </div>
)}
  </div>
)}



{categories.map((c) => {
  const catTasks = getCategoryTasks(c.name);
  if (catTasks.length === 0) return null;
  const isComplete = isCategoryComplete(c.name);
  const isCollapsed = collapsedCategories[c.name];
  const isSortingMode = sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory;
  
  // 获取类别背景色（用于边框）
const getCategoryBorderColor = () => {
  // ✅ 完成时边框变灰，未完成时边框保持原色
 
  
  switch(c.name) {
    case '语文': return '#FFFCE8';
    case '数学': return '#E8F5E9';
    case '英语': return '#FCE4EC';
    case '科学': return '#E1F5FE';
    case '运动': return '#E3F2FD';
    case '校内': return '#61A2Da';
    default: return categoryColors[c.name] || '#f0f0f0';
  }
};
  
  const borderColor = getCategoryBorderColor();

  return (
    <div
      key={c.name}
      style={{
        marginBottom: 8,
        borderRadius: 10,
        overflow: "hidden",
        border: `2px solid ${borderColor}`, 
      }}
    >
 


<div
  style={{
    backgroundColor: (() => {
      return categoryColors[c.name] || (() => {
        switch(c.name) {
          case '语文': return '#FFFCE8';
          case '数学': return '#E8F5E9';
          case '英语': return '#FCE4EC';
          case '科学': return '#E1F5FE';
          case '运动': return '#E3F2FD';
          case '校内': return '#61A2Da';
          default: return '#f0f0f0';
        }
      })();
    })(),
    // ✅ 永远保持正常颜色，不判断 isComplete
    color: isComplete ? "#333" : (c.name === "校内" ? "#fff" : "#333"),
    fontFamily: 'Calibri, "微软雅黑", sans-serif',
    padding: "3px 12px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "13px",
    minHeight: "24px"
  }}
>
  {/* 左侧：标题和完成状态 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span
      onClick={() => setCollapsedCategories(prev => ({ ...prev, [c.name]: !prev[c.name] }))}
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
    >
      {c.name} ({getCategoryTasks(c.name).filter(t => t.done).length}/{getCategoryTasks(c.name).length})
      {isComplete && <SquareCheckMark show={true} size={12} color="#bbb" />}
    </span>
  </div>

  {/* 右侧：统计汇总按钮 + 排序按钮 + 时间显示 */}
  {/* 右侧：统计汇总按钮 + 排序按钮 + 时间显示 */}
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  
{/* 统计汇总按钮 - 只在校内类别显示 */}
{/* 统计汇总按钮 - 只在校内类别显示 */}
{c.name === '校内' && (
  <div
    onClick={(e) => {
      e.stopPropagation();
      setShowStats(true);
    }}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      width: "18px",
      height: "18px",
      borderRadius: "4px",
      marginRight: "8px",
      backgroundColor: "transparent"
    }}
    title="统计汇总"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 根据类别是否完成，改变颜色 */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={isComplete ? "#333" : "#fff"} 
        strokeWidth="2" 
        fill="none"
      />
      <path 
        d="M12 12 L12 2 A10 10 0 0 1 19.07 7.07 Z" 
        fill={isComplete ? "#333" : "#fff"} 
        stroke="none"
      />
    </svg>
  </div>
)}
    

    {/* 排序按钮 - 校内类别不显示排序按钮 */}
    {c.name !== '校内' && (
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="#333" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="6" x2="20" y2="6" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="4" y1="18" x2="20" y2="18" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>
    )}

    {/* 时间显示 */}
    <span
      onClick={(e) => {
        e.stopPropagation();
        editCategoryTime(c.name);
      }}
      style={{
        fontSize: '11px',
        color: c.name === '校内' 
          ? (isComplete ? '#333' : '#fff')
          : '#333',
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
        marginRight: "5px"  ,
        marginLeft: "-18px"  , 
        fontWeight: "normal",
        display: "inline-block"
      }}
      title="点击修改总时间"
    >
      {formatCategoryTime(totalTime(c.name))}
    </span>
  </div>
</div>



{!collapsedCategories[c.name] && (
  <div style={{ padding: 8 }}>

{c.name === '校内' ? (
  // 校内类别：显示子类别分组
  (() => {
    const subCategoryTasks = getTasksBySubCategory(c.name);
    const subCategoryKeys = Object.keys(subCategoryTasks);
    
    // 获取保存的子类别排序顺序
    const getSubCategoryOrder = () => {
      const savedOrder = localStorage.getItem(`subcategory_order_${c.name}`);
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        const ordered = [];
        const remaining = [...subCategoryKeys];
        orderIds.forEach(id => {
          const index = remaining.indexOf(id);
          if (index !== -1) {
            ordered.push(remaining[index]);
            remaining.splice(index, 1);
          }
        });
        return [...ordered, ...remaining];
      }
      return subCategoryKeys;
    };
    
    const sortedSubCategoryKeys = getSubCategoryOrder();
    
    return sortedSubCategoryKeys.map((subCat) => {
      const subCatTasks = subCategoryTasks[subCat];
      const subCatKey = `${c.name}_${subCat}`;
      const allDone = subCatTasks.length > 0 && subCatTasks.every(task => task.done);
      const isSubCollapsed = collapsedSubCategories[subCatKey] || false;
      const isSortingMode = sortingSubCategory?.subCategory === subCat;
      
      const subCategoryTotalTime = subCatTasks.reduce((sum, task) => {
        return sum + (task.timeSpent || 0);
      }, 0);
      
      return (
        <div key={subCat} style={{ marginBottom: 8 }}>
         
<div
  style={{
    backgroundColor: (subCategoryColors[subCat] || (() => {
      switch(subCat) {
        case '数学': return '#E8F5E9';
        case '语文': return '#FFFCE8';
        case '英语': return '#FCE4EC';
        case '运动': return '#E3F2FD';
        default: return '#F5F5F5';
      }
    })()),
   color: allDone ? "#aaa" : '#333', // ✅ 永远黑色，不判断 allDone
    padding: '4px 8px',
    fontWeight: "bold",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '4px',
  }}
>

            {/* 左侧：标题（可点击折叠） */}
            <span
  onClick={() => setCollapsedSubCategories(prev => ({
    ...prev,
    [subCatKey]: !isSubCollapsed
  }))}
  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
>
  {subCat} ({subCatTasks.filter(t => t.done).length}/{subCatTasks.length})
  {allDone && <SquareCheckMark show={true} size={12} color="#bbb" />}
</span>
            
            {/* 右侧：排序按钮 + 时间显示 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>

{/* 校内子分类标题右侧的排序按钮 */}
<div
  onClick={(e) => {
    e.stopPropagation();
    if (sortingSubCategory?.subCategory === subCat) {
      setSortingSubCategory(null);
    } else {
      setSortingSubCategory({ category: c.name, subCategory: subCat });
    }
  }}
  style={{
    borderRadius: 4,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
   marginRight:"8px" ,
    userSelect: "none",
    transition: "none"
  }}
  title={sortingSubCategory?.subCategory === subCat ? "完成排序" : "调整顺序"}
>
 {sortingSubCategory?.subCategory === subCat ? (
  // 已激活排序模式 - 显示黑色对勾
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M20 6L9 17L4 12" 
      stroke="#333" 
      strokeWidth="3" 
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    />
  </svg>
) : (
  // 未激活 - 显示三条横线
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="4" y1="6" x2="20" y2="6" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="4" y1="18" x2="20" y2="18" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)}
</div>
              
              {/* 时间显示 */}
              
{/* 校内子分类标题右侧的时间显示 - 无背景无边框 */}
{/* 校内子分类时间显示 - 白色，右对齐 */}
<span
  onClick={(e) => {
    e.stopPropagation();
    const newTime = window.prompt(
      `修改 ${subCat} 子类别总时间（单位：分钟）`,
      Math.floor(subCategoryTotalTime / 60).toString()
    );
    
    if (newTime !== null) {
      const minutes = parseInt(newTime) || 0;
      const newSeconds = minutes * 60;
      
      if (newSeconds >= 0 && newSeconds !== subCategoryTotalTime) {
        const timeDifference = newSeconds - subCategoryTotalTime;
        
        if (timeDifference !== 0 && subCatTasks.length > 0) {
          const timePerTask = Math.floor(timeDifference / subCatTasks.length);
          
          setTasksByDate(prev => {
            const newTasksByDate = { ...prev };
            const todayTasks = newTasksByDate[selectedDate] || [];
            
            newTasksByDate[selectedDate] = todayTasks.map(t => 
              t.category === c.name && t.subCategory === subCat 
                ? { ...t, timeSpent: Math.max(0, (t.timeSpent || 0) + timePerTask) }
                : t
            );
            
            return newTasksByDate;
          });
        }
      }
    }
  }}
  style={{
    fontSize: '11px',
    color: '#333',           // 白色
    cursor: 'pointer',
    fontFamily: 'Calibri, "微软雅黑", sans-serif',
    minWidth: '15px',        // 统一宽度
    width: '30px',
    textAlign: 'right',      // 右对齐
    background: 'transparent',
    border: 'none',
    fontWeight: "normal",
    display: "inline-block"
  }}
  title="点击修改子类别总时间（单位：分钟）"
>
  {formatCategoryTime(subCategoryTotalTime)}
</span>
            </div>
          </div>
          
          {/* 任务列表 - 排序模式和非排序模式 */}
          {!isSubCollapsed && (
            <SortableTaskList
              tasks={subCatTasks}
              category={c.name}
              tasksByDate={tasksByDate} 
              subCategory={subCat}
              selectedDate={selectedDate}
              getTaskCompletionType={getTaskCompletionType} 
              isSortingMode={isSortingMode}
              onSortingEnd={(newOrder) => {
                const orderKey = `tasks_order_${c.name}_${subCat}`;
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
              categories={baseCategories}
              setShowMoveModal={setShowMoveModal}
              onUpdateProgress={handleUpdateProgress}
              onEditSubTask={editSubTask}
              onToggleSubTask={toggleSubTask}
            />
          )}
        </div>
      );


      
    });
  })()
) : (





    
// 非校内类别：使用 SortableTaskList 组件
<SortableTaskList
  tasks={getCategoryTasks(c.name)}
  category={c.name}
  subCategory={null}
  selectedDate={selectedDate}
  tasksByDate={tasksByDate} 
  isSortingMode={sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory}
  onSortingEnd={(newOrder) => {
    // 保存顺序到 localStorage
    const orderKey = `tasks_order_${c.name}`;
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    // 强制重新渲染以应用新顺序
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
  onToggleSubTask={toggleSubTask}
/>


    )}
  </div>
)}

         
        
      
     
      

</div>
);
})}



{/* 主界面的复盘框 - 只保留学习状态评价 */}
{/* 主界面的复盘框 - 只显示评分，不可选择 */}
{/* 学习结束时间 + 复盘区域 */}
<div style={{ marginBottom: 8 }}>
  
{/* 复盘框 */}
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
  
  {/* 复盘输入框 */}
  <div style={{ 
    flex: 1,
    minWidth: 0
  }}>
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

{/* 右侧：评分 */}
{/* 右侧：评分 - 显示表情 */}
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0
}}>
  <span style={{
    fontSize: '15px',
    whiteSpace: 'nowrap'
  }}>
    {getCurrentDailyRating() === 1 && '😞'}
    {getCurrentDailyRating() === 2 && '😕'}
    {getCurrentDailyRating() === 3 && '😐'}
    {getCurrentDailyRating() === 4 && '😊'}
    {getCurrentDailyRating() === 5 && '🥳'}
    {(!getCurrentDailyRating() || getCurrentDailyRating() === 0) && '❓'}
  </span>
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
    zIndex: 1000,
    padding: '10px'
  }}>
    {/* 在模态框内部创建一个独立的组件来使用本地状态 */}
    <ReflectionModalContent
      initialRating={getCurrentDailyRating()}
      initialReflection={getCurrentDailyReflection()}
      studyEndHour={studyEndHour}
      studyEndMinute={studyEndMinute}
      onSave={(rating, reflection, endHour, endMinute) => {
        setCurrentDailyRating(rating);
        setCurrentDailyReflection(reflection);
        if (endHour !== '' && endMinute !== '') {
          setCurrentStudyEndTime(`${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`);
        } else {
          setCurrentStudyEndTime('');
        }
        saveDailyData(selectedDate);
        setShowReflectionModal(false);
      }}
      onClose={() => setShowReflectionModal(false)}
    />
  </div>
)}









      {/* 添加任务输入框（展开时显示） */}


     
   
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
    { 
      label: "学习时间", 
      value: formatTimeInHours(todayStats.learningTime),
      title: `学习时间: ${Math.floor(todayStats.learningTime / 60)}分钟`
    },
    { 
      label: "运动时间", 
      value: formatTimeInHours(todayStats.sportTime),
      title: `运动时间: ${Math.floor(todayStats.sportTime / 60)}分钟`
    },
    { 
      label: "任务数量", 
      value: `${todayStats.completedLearningTasks}/${todayStats.totalLearningTasks}`,
      title: `完成: ${todayStats.completedLearningTasks} / 总计: ${todayStats.totalLearningTasks}`
    },
    { 
      label: "完成进度", 
      value: `${todayStats.completionRate}%`,
      title: `完成率: ${todayStats.completionRate}%`
    },
    
  
  ].map((item, idx) => (
    <div
      key={idx}
      onClick={item.onClick}
      style={{
        flex: 1,
        textAlign: "center",
        fontSize: 12,
        borderRight: idx < 5 ? "1px solid #cce0ff" : "none",
        padding: "4px 0",
        cursor: item.onClick ? "pointer" : "default"
      }}
      title={item.title}
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


   


{/* 底部按钮区域 - 只保留四个主按钮 */}
{/* 底部按钮区域 - 全部用div模拟 */}
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
  {/* 每日日志按钮 */}
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
      width: "60px",
      height: "28px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0
    }}
  >
    每日日志
  </div>

  {/* 时间记录按钮 */}
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
      width: "60px",
      height: "28px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0
    }}
  >
    时间记录
  </div>

  {/* 立即同步按钮 */}
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
      width: "60px",
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

  {/* 恢复云端按钮 */}
  <div
    onClick={(e) => {
      e.preventDefault();
      const token = localStorage.getItem('github_token');
      if (!token) {
        alert('请先设置 GitHub Token');
        setShowGitHubSyncModal(true);
        return;
      }
      
      if (window.confirm('确定要从云端恢复最新数据吗？这将覆盖当前所有本地数据！')) {
        const forceRestoreFromCloud = async () => {
          try {
            const token = localStorage.getItem('github_token');
            const gistId = localStorage.getItem('github_gist_id');
            
            let targetGistId = gistId;
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
            const content = gist.files['study-tracker-data.json']?.content;
            const backupData = JSON.parse(content);

            await handleRestoreData(backupData);
            
          } catch (error) {
            console.error('强制恢复失败:', error);
            alert('恢复失败: ' + error.message);
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
      backgroundColor: "#61A2Da",
      color: "#fff",
      fontSize: 11,
      borderRadius: 6,
      width: "60px",
      height: "28px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box",
      flexShrink: 0
    }}
  >
    恢复云端
  </div>

  {/* 其他设置按钮 */}
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
      width: "60px",
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

{/* 同步状态提示 - 短暂显示 */}
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

{/* 其他设置弹窗模态框 */}
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
      
      <h3 style={{ 
        textAlign: 'center', 
        margin: '0 0 16px 0', 
        fontSize: '16px',
        color: '#333'
      }}>
        设置
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
       
        {/* 👇 在这里添加最后同步时间的显示 */}
        <div style={{
          padding: '8px 12px',
          fontSize: '12px',
          color: '#666',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          marginBottom: '4px'
        }}>
          📅 最后同步: {localStorage.getItem('github_last_sync') 
            ? new Date(localStorage.getItem('github_last_sync')).toLocaleString() 
            : '从未同步'}
        </div>
       
        {/* 导出数据 */}
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

        {/* 导入数据 */}
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

        {/* 备份管理 */}
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

        {/* 同步设置 */}
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

        {/* 管理类别 */}
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

        {/* 清空数据 - 红色文字 */}
        <div
          onClick={() => {
            if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
              clearAllData();
            }
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

      {/* 关闭按钮 */}
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
          每日提醒: importedData.reminderText ? '有' : '无'  // 添加统计
        };
        
        const confirmMessage = `确定要导入以下数据吗？\n` +
          `• 任务天数: ${importStats.任务天数}\n` +
          `• 模板数量: ${importStats.模板数量}\n` +
          `• 成就数量: ${importStats.成就数量}\n` +
          `• 每日提醒: ${importStats.每日提醒}\n` +
          `• 数据版本: ${importStats.版本}\n\n` +
          `这将覆盖当前所有数据！`;

        if (window.confirm(confirmMessage)) {
          console.log('🔄 开始导入数据...', importStats);
          
          await saveMainData('tasks', importedData.tasks || {});
          await saveMainData('templates', importedData.templates || []);
          await saveMainData('customAchievements', importedData.customAchievements || []);
          await saveMainData('unlockedAchievements', importedData.unlockedAchievements || []);
          await saveMainData('categories', importedData.categories || baseCategories);
          
          // 恢复每日提醒
          if (importedData.reminderText !== undefined) {
            setReminderText(importedData.reminderText);
            localStorage.setItem('daily_reminder', importedData.reminderText);
          }
          
          setTasksByDate(importedData.tasks || {});
          setTemplates(importedData.templates || []);
          setCategories(importedData.categories || baseCategories);
          
          console.log('✅ 所有数据导入完成');
          
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


     
    </div>
  );
}


  
  
  export default App

    
