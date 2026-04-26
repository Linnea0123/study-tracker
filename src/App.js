/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

/* eslint-disable react-hooks/exhaustive-deps */  // 添加这一行
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';




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

// ========== 时间记录模态框组件 ==========
// ========== 时间记录模态框组件（只显示，不添加） ==========
const TimeRecordModal = ({ onClose, tasksByDate, categories, selectedDate }) => {
  const [selectedFilterDate, setSelectedFilterDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [dateOptions, setDateOptions] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);

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
      case '语文': return '#FFFDE7';
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
      return task.timeRecords.reduce((sum, r) => sum + (r.minutes || 0), 0);
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
        
        {/* 标题栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#61A2Da', fontSize: '18px' }}>⏱ 时间记录汇总</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {/* 日期选择器 - 只保留这个，删除备注输入框 */}
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

        {/* 时间记录列表 */}
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
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>添加记录</div>
                    {timeRecords.map((record, idx) => (
                      <div key={idx} style={{ padding: '6px 0', borderBottom: idx < timeRecords.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ backgroundColor: '#e8f0fe', padding: '2px 8px', borderRadius: '16px', fontSize: '11px', color: '#61A2Da' }}>{record.time || '--:--'}</span>
                          <span style={{ fontWeight: 'bold', color: record.change > 0 ? '#4caf50' : '#f44336' }}>{record.change > 0 ? `+${record.change}` : record.change}分钟</span>
                        </div>
                        {record.note && <div style={{ fontSize: '11px', color: '#666', marginLeft: '8px', paddingLeft: '8px', borderLeft: '2px solid #61A2Da', marginTop: '4px' }}>📝 {record.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '16px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          💡 提示：点击任务右侧的 0m 添加时间记录，这里会自动显示
        </div>
      </div>
    </div>
  );
};

// ========== 时间编辑弹窗（带历史记录） ==========
// ========== 时间编辑弹窗（带历史记录） ==========
const TimeEditModal = ({ task, onClose, onSave }) => {
  const [addMinutes, setAddMinutes] = useState('');
  const [note, setNote] = useState('');
  const timeRecords = task.timeRecords || [];

  const handleSave = () => {
    const minutes = parseInt(addMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      alert('请输入有效的分钟数（大于0）');
      return;
    }
    onSave(task, minutes, note);
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
          ⏱ 增加学习时间
        </h3>
        
        {/* 1. 本次学习时长 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>
            📚 本次学习时长（分钟）
          </label>
          <input
            type="number"
            placeholder="例如：20"
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
        
        {/* 2. 备注 - 单行，输入多行时自动增高 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>
            📝 备注（可选）
          </label>
          <textarea
            placeholder="记录学习内容、收获等..."
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
        
        {/* 3. 当前总时间显示 */}
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
        
        {/* 4. 历史记录 */}
        {timeRecords.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              📋 历史记录
            </div>
            <div style={{ 
              maxHeight: '150px', 
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
             {timeRecords.map((record, idx) => (
  <div key={idx} style={{ 
    fontSize: '13px', 
    color: '#333',
    padding: '6px 0',
    borderBottom: idx < timeRecords.length - 1 ? '1px solid #f0f0f0' : 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ 
        backgroundColor: '#e8f0fe', 
        padding: '2px 8px', 
        borderRadius: '16px',
        fontSize: '11px',
        color: '#61A2Da'
      }}>
        {record.time || '--:--'}
      </span>
      <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
        {record.change > 0 ? `+${record.change}` : record.change}分钟
      </span>
    </div>
    {record.note && (
      <div style={{ 
        fontSize: '11px', 
        color: '#666', 
        marginLeft: '8px',
        paddingLeft: '8px',
        borderLeft: '2px solid #61A2Da'
      }}>
        📝 {record.note}
      </div>
    )}
  </div>
))}
            </div>
          </div>
        )}
        
        {/* 5. 按钮 */}
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
              cursor: 'pointer',
              transition: 'none',
              transform: 'none',
              scale: 1,
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.scale = 1;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
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
        <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '13px', fontWeight: 'bold' }}>今日心情</label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {[
            { value: 1, emoji: '😞', label: '难过' },
            { value: 2, emoji: '😕', label: '一般' },
            { value: 3, emoji: '😐', label: '平静' },
            { value: 4, emoji: '😊', label: '开心' },
            { value: 5, emoji: '🥳', label: '超棒' }
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
  
