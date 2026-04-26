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
