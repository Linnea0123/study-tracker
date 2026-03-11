/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useEffect, useRef, useCallback} from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';




const GradeModal = ({ onClose, isVisible }) => {
  const [grades, setGrades] = useState([]);
  const [filterSubject, setFilterSubject] = useState('全部');
  const [filterSubCategory, setFilterSubCategory] = useState('全部');
  const [chartView, setChartView] = useState('month');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSubCategoryManager, setShowSubCategoryManager] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  // 子分类管理
  const [subjectSubCategories, setSubjectSubCategories] = useState(() => {
    const saved = localStorage.getItem('grade_subcategories');
    return saved ? JSON.parse(saved) : {
      '数学': ['计算练习', '单元练习', '综合测试'],
      '语文': ['基础知识', '阅读理解', '作文'],
      '英语': ['单词', '语法', '听力', '阅读'],
      '物理': ['力学', '电学', '实验'],
      '化学': ['方程式', '实验', '计算'],
      '生物': ['概念', '实验'],
      '历史': ['知识点', '材料分析'],
      '地理': ['自然地理', '人文地理'],
      '政治': ['选择题', '材料题']
    };
  });

  const [newGrade, setNewGrade] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '语文',
    subCategory: '',
    testContent: '',
    score: '',
    scoreType: '100分制',
    fullScore: '100',
    wrongQuestions: '',
    analysis: ''
  });

  // 定义scoreTypes常量
  const scoreTypes = [
    { value: '100分制', label: '100分制', maxScore: 100 },
    { value: '5星制', label: '5星制', maxScore: 5 },
    { value: '6星制', label: '6星制', maxScore: 6 },
    { value: '自定义', label: '自定义', maxScore: null }
  ];

  const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '其他'];

  // 保存子分类到localStorage
  useEffect(() => {
    localStorage.setItem('grade_subcategories', JSON.stringify(subjectSubCategories));
  }, [subjectSubCategories]);

  // 处理分数类型变化
  const handleScoreTypeChange = (e) => {
    if (!e || !e.target) return;
    
    const selectedType = scoreTypes.find(type => type.value === e.target.value);
    setNewGrade({
      ...newGrade,
      scoreType: e.target.value,
      fullScore: selectedType?.maxScore ? selectedType.maxScore.toString() : newGrade.fullScore,
      score: ''
    });
  };

  // 获取分数显示格式
// 获取分数显示格式 - 只显示分数，不显示单位
const getScoreDisplay = (grade) => {
  const score = parseInt(grade.score || 0);
  const fullScore = parseInt(grade.fullScore || 100);
  
  // 只显示分数，不显示满分和单位
  return `${score}`;
};

  // 获取百分比分数
  const getPercentageScore = (grade) => {
    const score = parseInt(grade.score || 0);
    const fullScore = parseInt(grade.fullScore || 100);
    return Math.round((score / fullScore) * 100);
  };

  // 初始化加载成绩数据
  useEffect(() => {
    const loadGrades = async () => {
      try {
        const savedGrades = await loadMainData('grades');
        if (savedGrades) {
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
  const saveGrades = async (updatedGrades) => {
    setGrades(updatedGrades);
    await saveMainData('grades', updatedGrades);
  };

  // 添加新成绩记录 - 手机版优化
  const handleAddGrade = () => {
    if (!newGrade.testContent || !newGrade.score) {
      alert('请填写测试内容和得分');
      return;
    }

    const updatedGrades = [...grades, {
      id: Date.now().toString(),
      ...newGrade,
      subCategory: newGrade.subCategory || '未分类',
      isFullMark: parseInt(newGrade.score) === parseInt(newGrade.fullScore)
    }];
    
    saveGrades(updatedGrades);
    setNewGrade({
      date: new Date().toISOString().split('T')[0],
      subject: '语文',
      subCategory: '',
      testContent: '',
      score: '',
      scoreType: '100分制',
      fullScore: '100',
      wrongQuestions: '',
      analysis: ''
    });
    setShowAddForm(false);
  };

  // 删除成绩记录
  const handleDeleteGrade = (id) => {
    if (window.confirm('确定要删除这条成绩记录吗？')) {
      const updatedGrades = grades.filter(grade => grade.id !== id);
      saveGrades(updatedGrades);
    }
  };




  // 编辑子分类
const handleEditSubCategory = (subject, oldSubCat) => {
  const newSubCat = window.prompt(`编辑子分类 "${oldSubCat}" 的新名称:`, oldSubCat);
  if (newSubCat && newSubCat.trim() && newSubCat.trim() !== oldSubCat) {
    const trimmedNew = newSubCat.trim();
    
    // 检查新名称是否已存在
    if (subjectSubCategories[subject].includes(trimmedNew)) {
      alert('该子分类名称已存在！');
      return;
    }
    
    // 更新子分类列表
    setSubjectSubCategories(prev => {
      const updated = {
        ...prev,
        [subject]: prev[subject].map(sub => 
          sub === oldSubCat ? trimmedNew : sub
        )
      };
      
      // 立即保存到 localStorage
      localStorage.setItem('grade_subcategories', JSON.stringify(updated));
      
      return updated;
    });
    
    // 同时更新该子分类下的所有成绩记录
    const updatedGrades = grades.map(grade => {
      if (grade.subject === subject && grade.subCategory === oldSubCat) {
        return { ...grade, subCategory: trimmedNew };
      }
      return grade;
    });
    saveGrades(updatedGrades);
  }
};

  // 添加子分类
  // 找到 handleAddSubCategory 函数，替换为：

const handleAddSubCategory = () => {
  if (!editingSubject) {
    alert('请先选择一个科目');
    return;
  }
  
  const newSubCat = window.prompt(`为 ${editingSubject} 添加新子分类名称:`);
  if (newSubCat && newSubCat.trim()) {
    // 更新状态
    setSubjectSubCategories(prev => {
      const updated = {
        ...prev,
        [editingSubject]: [...(prev[editingSubject] || []), newSubCat.trim()]
      };
      
      // 立即保存到 localStorage
      localStorage.setItem('grade_subcategories', JSON.stringify(updated));
      
      return updated;
    });
  }
};

// 找到 handleDeleteSubCategory 函数，替换为：

const handleDeleteSubCategory = (subject, subCat) => {
  if (window.confirm(`确定要删除子分类 "${subCat}" 吗？`)) {
    // 更新状态
    setSubjectSubCategories(prev => {
      const updated = {
        ...prev,
        [subject]: prev[subject].filter(s => s !== subCat)
      };
      
      // 立即保存到 localStorage
      localStorage.setItem('grade_subcategories', JSON.stringify(updated));
      
      return updated;
    });
    
    // 同时删除该子分类下的所有成绩记录
    const updatedGrades = grades.filter(g => 
      !(g.subject === subject && g.subCategory === subCat)
    );
    saveGrades(updatedGrades);
  }
};

  

  // 筛选后的成绩记录
  const filteredGrades = grades.filter(grade => {
    if (filterSubject !== '全部' && grade.subject !== filterSubject) return false;
    if (filterSubCategory !== '全部' && grade.subCategory !== filterSubCategory) return false;
    return true;
  });

  // 获取当前筛选科目的子分类列表
  const getCurrentSubCategories = () => {
    if (filterSubject === '全部') return ['全部'];
    return ['全部', ...(subjectSubCategories[filterSubject] || [])];
  };

  // 按子分类统计成绩
  const getSubCategoryStats = () => {
    const stats = {};
    
    filteredGrades.forEach(grade => {
      const subCat = grade.subCategory || '未分类';
      if (!stats[subCat]) {
        stats[subCat] = {
          count: 0,
          totalScore: 0,
          fullMarks: 0,
          scores: []
        };
      }
      stats[subCat].count++;
      stats[subCat].totalScore += getPercentageScore(grade);
      stats[subCat].scores.push(getPercentageScore(grade));
      if (grade.isFullMark) stats[subCat].fullMarks++;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      count: data.count,
      average: Math.round(data.totalScore / data.count),
      fullMarks: data.fullMarks,
      maxScore: Math.max(...data.scores),
      minScore: Math.min(...data.scores)
    }));
  };

  // 统计信息
  const stats = {
    totalTests: filteredGrades.length,
    fullMarkTests: filteredGrades.filter(g => g.isFullMark).length,
    averageScore: filteredGrades.length > 0 
      ? (filteredGrades.reduce((sum, g) => sum + getPercentageScore(g), 0) / filteredGrades.length).toFixed(1)
      : 0
  };

  // 子分类统计
  const subCategoryStats = getSubCategoryStats();

  // 生成图表数据
  const generateChartData = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch(chartView) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return [];
    }

    const filteredByDate = filteredGrades.filter(grade => {
      const gradeDate = new Date(grade.date);
      return gradeDate >= startDate && gradeDate <= endDate;
    });

    // 按子分类分组
    const groupedBySubCat = {};
    filteredByDate.forEach(grade => {
      const subCat = grade.subCategory || '未分类';
      if (!groupedBySubCat[subCat]) {
        groupedBySubCat[subCat] = [];
      }
      groupedBySubCat[subCat].push(grade);
    });

    // 生成每个子分类的趋势数据
    const chartData = [];
    Object.entries(groupedBySubCat).forEach(([subCat, subCatGrades]) => {
      // 按日期排序
      const sorted = subCatGrades.sort((a, b) => a.date.localeCompare(b.date));
      
      // 取最近5次成绩
      const recent = sorted.slice(-5);
      
      recent.forEach((grade, index) => {
        chartData.push({
          id: grade.id,
          subCategory: subCat,
          date: grade.date,
          label: `${subCat}-${grade.date.slice(5)}`,
          score: getPercentageScore(grade),
          isFullMark: grade.isFullMark,
          index: index,
          testContent: grade.testContent
        });
      });
    });

    return chartData;
  };

  const chartData = generateChartData();

  // 按子分类分组的图表数据
  const chartDataBySubCat = chartData.reduce((acc, item) => {
    if (!acc[item.subCategory]) {
      acc[item.subCategory] = [];
    }
    acc[item.subCategory].push(item);
    return acc;
  }, {});

  if (!isVisible) return null;

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
      padding: '10px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',    // 👈 从1200px改为600px（和主界面一样）
        maxHeight: '90vh',     // 👈 从95vh改为90vh
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        position: 'relative',
        WebkitOverflowScrolling: 'touch' // 优化移动端滚动
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 10,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)'
          }}
        >
          ×
        </button>

        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '16px', 
          color: '#1a73e8',
          fontSize: '18px',
          padding: '0 32px' // 为关闭按钮留出空间
        }}>
          成绩记录
        </h2>

        {/* 顶部按钮区域 - 手机版优化 */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '12px 16px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              width: window.innerWidth <= 480 ? '100%' : 'auto'
            }}
          >
            {showAddForm ? '取消添加' : '+ 添加新成绩'}
          </button>

          <button
            onClick={() => setShowSubCategoryManager(!showSubCategoryManager)}
            style={{
              padding: '12px 16px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              width: window.innerWidth <= 480 ? '100%' : 'auto'
            }}
          >
            {showSubCategoryManager ? '关闭管理' : '管理子分类'}
          </button>
        </div>

        {/* 添加新成绩表单弹窗 - 手机版优化 */}
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
          }} onClick={() => setShowAddForm(false)}>
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
              {/* 表单关闭按钮 */}
              <button
                onClick={() => setShowAddForm(false)}
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
                color: '#1a73e8',
                fontSize: '16px',
                padding: '0 24px'
              }}>
                添加新成绩记录
              </h3>

              {/* 表单内容 - 手机版优化 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* 日期 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    日期
                  </label>
                  <input
                    type="date"
                    value={newGrade.date}
                    onChange={(e) => setNewGrade({...newGrade, date: e.target.value})}
                    style={{
                      width: '100%',  // 使用100%宽度，跟随父容器
                      maxWidth: '100%', // 限制最大宽度
                      minWidth: '100%' ,  // 强制最小宽度
                      height: '40px',
                      padding: '0 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                {/* 科目和子分类 - 手机版竖排显示 */}
                <div style={{
                  display: 'flex',
                  flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                  gap: '12px'
                }}>
                  {/* 科目 */}
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '13px', 
                      fontWeight: '500' 
                    }}>
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
                        height: '40px',
                        padding: '0 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      {subjects.filter(s => s !== '全部').map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  {/* 子分类 */}
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '13px', 
                      fontWeight: '500' 
                    }}>
                      子分类
                      <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>
                        (可选)
                      </span>
                    </label>
                    <select
                      value={newGrade.subCategory}
                      onChange={(e) => setNewGrade({...newGrade, subCategory: e.target.value})}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">选择子分类</option>
                      {(subjectSubCategories[newGrade.subject] || []).map(subCat => (
                        <option key={subCat} value={subCat}>{subCat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 测试内容 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
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

                {/* 分数类型、得分、满分 - 手机版自适应 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '1fr 1fr 1fr',
                  gap: '12px'
                }}>
                  {/* 分数类型 */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '13px', 
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      分数类型
                    </label>
                    <select
                      value={newGrade.scoreType}
                      onChange={handleScoreTypeChange}
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
                  
                  {/* 得分 */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '13px', 
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
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
                  
                  {/* 满分 */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '13px', 
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
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

                {/* 错题分析 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    错题分析
                  </label>
                  <textarea
                    value={newGrade.wrongQuestions}
                    onChange={(e) => setNewGrade({...newGrade, wrongQuestions: e.target.value})}
                    placeholder="记录错题内容和原因分析"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* 总结与改进 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    总结与改进
                  </label>
                  <textarea
                    value={newGrade.analysis}
                    onChange={(e) => setNewGrade({...newGrade, analysis: e.target.value})}
                    placeholder="总结经验教训和改进计划"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <button
                  onClick={handleAddGrade}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#1a73e8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    marginTop: '8px'
                  }}
                >
                  添加记录
                </button>
              </div>
            
     


            </div>
          </div>
        )}

        {/* 筛选和统计信息 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          {/* 筛选行 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}>
            <select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterSubCategory('全部');
              }}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                flex: 1,
                minWidth: '150px'
              }}
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={filterSubCategory}
              onChange={(e) => setFilterSubCategory(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                flex: 1,
                minWidth: '150px'
              }}
            >
              {getCurrentSubCategories().map(subCat => (
                <option key={subCat} value={subCat}>{subCat}</option>
              ))}
            </select>
          </div>

          {/* 统计信息 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>总测试</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{stats.totalTests}</div>
            </div>
            
            <div style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>满分次数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{stats.fullMarkTests}</div>
            </div>
            
            <div style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>平均分</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.averageScore}%</div>
            </div>
          </div>
        </div>

        {/* 子分类统计卡片 */}
        {filterSubject !== '全部' && subCategoryStats.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>
              {filterSubject} 子分类统计
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {subCategoryStats.map(stat => (
  <div key={stat.name} style={{
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e0e0e0'
  }}>
    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1a73e8' }}>
      {stat.name}
    </div>
    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
      测试次数: {stat.count}
    </div>
    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
      平均分: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{stat.average}</span>
    </div>
    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
      最高分: {stat.maxScore}
    </div>
    <div style={{ fontSize: '12px' }}>
      最低分: {stat.minScore}
    </div>
    {stat.fullMarks > 0 && (
      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
        ⭐ 满分 {stat.fullMarks} 次
      </div>
    )}
  </div>
))}
            </div>
          </div>
        )}

        {/* 图表视图切换 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {[
            { value: 'month', label: '按月' },
            { value: 'quarter', label: '按季度' },
            { value: 'year', label: '按年' }
          ].map(view => (
            <button
              key={view.value}
              onClick={() => setChartView(view.value)}
              style={{
                padding: '8px 16px',
                backgroundColor: chartView === view.value ? '#1a73e8' : '#f0f0f0',
                color: chartView === view.value ? '#fff' : '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: chartView === view.value ? '500' : 'normal'
              }}
            >
              {view.label}
            </button>
          ))}
        </div>

      {/* 子分类成绩柱状图 */}
{chartData.length > 0 ? (
  <div style={{
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  }}>
    <h3 style={{ marginBottom: '20px', fontSize: '16px', textAlign: 'center' }}>
      各子分类成绩对比 - {
        chartView === 'month' ? '本月' : 
        chartView === 'quarter' ? '本季度' : '本年'
      }
    </h3>
    
    {/* 使用 Recharts 柱状图 */}
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 30, right: 30, left: 0, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="label" 
          angle={-45} 
          textAnchor="end" 
          height={60}
          interval={0}
          tick={{ fontSize: 10 }}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 10 }}
          label={{ value: '分数', angle: -90, position: 'insideLeft', fontSize: 10 }}
        />
        <Bar 
          dataKey="score" 
          fill="#1a73e8"
          radius={[4, 4, 0, 0]}
          label={{ 
            position: 'top', 
            fontSize: 9,
            formatter: (value) => `${value}`
          }}
        >
          {/* 根据是否满分设置不同颜色 */}
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.isFullMark ? '#4caf50' : '#1a73e8'} 
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>

    {/* 图例 */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '16px', height: '16px', backgroundColor: '#1a73e8', borderRadius: '4px' }}></div>
        <span style={{ fontSize: '12px' }}>普通成绩</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '16px', height: '16px', backgroundColor: '#4caf50', borderRadius: '4px' }}></div>
        <span style={{ fontSize: '12px' }}>满分成绩</span>
      </div>
    </div>
  </div>
) : (
  <div style={{
    marginBottom: '30px',
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666'
  }}>
    暂无成绩数据，点击上方"添加新成绩"按钮开始记录
  </div>
)}

        {/* 成绩记录列表 */}
        <div>

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
  }} onClick={() => setShowSubCategoryManager(false)}>
    <div style={{
      backgroundColor: 'white',
      padding: '20px 16px',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      position: 'relative'
    }} onClick={e => e.stopPropagation()}>
      
      {/* 弹窗关闭按钮 */}
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
        color: '#9C27B0',
        fontSize: '18px'
      }}>
        管理子分类
      </h3>

      {/* 科目选择 */}
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
          value={editingSubject || ''}
          onChange={(e) => setEditingSubject(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="">请选择科目</option>
          {subjects.filter(s => s !== '全部').map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {editingSubject && (
        <>
          {/* 添加新子分类 */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleAddSubCategory}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + 添加新子分类
            </button>
          </div>

       {/* 子分类列表 */}
<div>
  <div style={{ 
    marginBottom: '10px', 
    fontSize: '14px', 
    fontWeight: '500',
    color: '#666'
  }}>
    现有子分类 ({subjectSubCategories[editingSubject]?.length || 0})
  </div>
  
  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
    {(subjectSubCategories[editingSubject] || []).length === 0 ? (
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
      // 👇 这就是你要找的地方 - 子分类列表的循环
      (subjectSubCategories[editingSubject] || []).map(subCat => (
        <div
          key={subCat}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginBottom: '8px',
            backgroundColor: '#fff'
          }}
        >
          <span style={{ fontSize: '14px' }}>{subCat}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* 编辑按钮 */}
            <button
              onClick={() => handleEditSubCategory(editingSubject, subCat)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#FFC107',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              编辑
            </button>
            {/* 删除按钮 */}
            <button
              onClick={() => handleDeleteSubCategory(editingSubject, subCat)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              删除
            </button>
          </div>
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
          <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>成绩记录列表</h3>
          
          {filteredGrades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              暂无成绩记录
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {filteredGrades.sort((a, b) => b.date.localeCompare(a.date)).map(grade => (
                <div
                  key={grade.id}
                  style={{
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    backgroundColor: grade.isFullMark ? '#e8f5e8' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>
                        {grade.date} {grade.subject}
                      </span>
                      {grade.subCategory && (
                        <span style={{ 
                          marginLeft: '8px',
                          padding: '2px 6px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          {grade.subCategory}
                        </span>
                      )}
                      <span style={{ marginLeft: '8px', color: '#666' }}>
                        - {grade.testContent}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
  fontSize: '18px', 
  fontWeight: 'bold', 
  color: grade.isFullMark ? '#4caf50' : '#1a73e8' 
}}>
  {getScoreDisplay(grade)} {/* 现在只显示分数，如 98 */}
</span>
                      {grade.isFullMark && (
                        <span style={{ 
                          backgroundColor: '#4caf50', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          满分
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteGrade(grade.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f44336',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {grade.wrongQuestions && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>错题分析:</div>
                      <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{grade.wrongQuestions}</div>
                    </div>
                  )}
                  
                  {grade.analysis && (
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>总结改进:</div>
                      <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{grade.analysis}</div>
                    </div>
                  )}
                </div>




              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};





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
      {backups.map((backup, index) => {
        // 确保备份时间正确显示
        let displayTime;
        try {
          displayTime = new Date(backup.time).toLocaleString();
        } catch (e) {
          // 如果时间格式有问题，使用备份key中的时间
          const timeMatch = backup.key.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
          displayTime = timeMatch ? timeMatch[1].replace(/T/, ' ').replace(/-/g, ':') : '未知时间';
        }

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
                {displayTime}
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
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
  const [gistId, setGistId] = useState(config.gistId || '');

  const handleSave = () => {
    onSave({
      token: token.trim(),
      autoSync,
      gistId: gistId.trim()
    });
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
  maxBackups: 7,                    // 保留7个备份
  backupInterval: 10 * 60 * 1000,   // 10分钟（30 * 60 * 1000 毫秒）- 修改这里
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





// 替换现有的 autoBackup 函数
const autoBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${STORAGE_KEY}_${AUTO_BACKUP_CONFIG.backupPrefix}${timestamp}`;
    
    // ✅ 修复：包含所有关键数据
    const backupData = {
      tasks: await loadMainData('tasks') || {},
      templates: await loadMainData('templates') || [],
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
    
    console.log('📅 生成周日期:', weekDates.map(d => d.date));
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






// 重复设置模态框
const RepeatModal = ({ config, onSave, onClose }) => {
  const [frequency, setFrequency] = useState(config.frequency|| '');
  const [days, setDays] = useState(config.days ? [...config.days] : []);



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


const TemplateModal = ({ templates, onSave, onClose, onDelete, categories = baseCategories,
  setCategories }) => {
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

      <button
        type="button"
        onClick={() => {
          const newCategory = window.prompt('输入新类别名称:');
          if (newCategory && newCategory.trim()) {
            // 检查是否已存在
            const exists = categories.find(cat => cat.name === newCategory.trim());
            if (exists) {
              alert('该类别已存在！');
              return;
            }
            
            // 创建新类别
            const newCat = {
              name: newCategory.trim(),
              color: '#1a73e8',
              subCategories: []
            };
            
            // 更新类别状态
            const updatedCategories = [...categories, newCat];
            setCategories(updatedCategories);
            
            // 保存到存储
            saveMainData('categories', updatedCategories);
            
            // 自动选择新类别
            setTemplateCategory(newCategory.trim());
            
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
  {templateCategory === '校内' && (
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
          .find((c) => c.name === '校内')
          ?.subCategories?.map((subCat) => (
            <option key={subCat} value={subCat}>
              {subCat}
            </option>
          ))}
      </select>
    </div>
  )}
</div>



        

          

          {/* 标签编辑 - 合并成一排 */}
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 12,
}}>
  {/* 添加新标签和当前标签合并在一排 */}
  <div style={{
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    width: '100%'
  }}>
    {/* 添加新标签 - 左侧 */}
    <div style={{ flex: 1 }}>
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

    {/* 当前标签 - 右侧 */}
    <div style={{ flex: 1 }}>
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
        padding: '4px 8px',
        border: '1px solid #ccc',
        borderRadius: 6,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        boxSizing: 'border-box',
        maxHeight: 40, // 固定高度，避免滚动
        overflow: 'hidden', // 隐藏溢出内容
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
                  <option value="本">本</option>
                  <option value="篇">篇</option>
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

// 本周任务添加模态框
const WeekTaskModal = ({ onClose, onAdd }) => {
  const [taskText, setTaskText] = useState('');

  const handleAdd = () => {
    if (taskText.trim()) {
      onAdd(taskText.trim());
      onClose();
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
        maxWidth: 350
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#87CEEB' }}>
          📅 添加本周任务
        </h3>
        
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
            marginBottom: 15,
            boxSizing: 'border-box'
          }}
          autoFocus
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#f0f0f0',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#87CEEB',
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
    </div>
  );
};

// 本月任务页面组件
// 修改 MonthTaskPage 组件，添加编辑和删除功能
// 本月任务页面组件
const MonthTaskPage = ({ tasks, onClose, onAddTask, onUpdateProgress, onEditTask, onDeleteTask }) => {
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

  // 计算本月进度
  const calculateMonthProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => {
      return sum + (task.progress / task.target);
    }, 0);
    return Math.round((totalProgress / tasks.length) * 100);
  };

  const monthProgress = calculateMonthProgress();

  // 按分类统计任务
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      alert('请输入任务内容');
      return;
    }

    onAddTask({
      id: Date.now().toString(),
      text: newTaskText.trim(),
      category: selectedCategory,
      subCategory: selectedSubCategory,
      deadline: deadline,
      progress: 0,
      target: target,
      unit: unit,
      important: false,
      note: '',
      createdAt: new Date().toISOString()
    });

    setNewTaskText('');
    setSelectedSubCategory('');
    setDeadline('');
    setTarget(100);
    setUnit('%');
    setShowAddForm(false);
  };

  // 开始编辑任务
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

  // 保存编辑
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

    onEditTask(updatedTask);
    setEditingTask(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTask(null);
  };

  // 处理删除
  const handleDelete = (task) => {
    if (window.confirm(`确定要删除任务 "${task.text}" 吗？`)) {
      onDeleteTask(task.id);
    }
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
        padding: '20px',
        borderRadius: '15px',
        width: '95%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
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

        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#FF9800',
          fontSize: '18px',
          padding: '0 30px'
        }}>
          📅 本月任务 ({tasks.length})
        </h2>

        {/* 进度条 */}
        <div style={{
          backgroundColor: '#f0f0f0',
          borderRadius: '10px',
          height: '20px',
          marginBottom: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${monthProgress}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {monthProgress > 0 && `${monthProgress}%`}
          </div>
        </div>

        {/* 添加任务按钮 */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#FF9800',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}
        >
          {showAddForm ? '取消添加' : '+ 添加本月任务'}
        </button>

        {/* 添加任务表单 - 优化布局 */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {/* 任务内容 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '13px', 
                fontWeight: '500' 
              }}>
                任务内容
              </label>
              <input
                type="text"
                placeholder="输入任务内容"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 10px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 分类和子分类 - 手机版竖排 */}
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontSize: '13px', 
                  fontWeight: '500' 
                }}>
                  分类
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontSize: '13px', 
                  fontWeight: '500' 
                }}>
                  子分类
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">无子类别</option>
                  {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

           {/* 截止日期、目标值、单位 - 优化布局 */}
<div style={{
  display: 'grid',
  gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '2fr 1fr 1fr',
  gap: '12px',
  marginBottom: '12px'
}}>
  {/* 截止日期 - 调整宽度比例 */}
  <div style={{ 
    flex: window.innerWidth <= 480 ? '1' : '2'  // 在非手机端时占2份宽度
  }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '4px', 
      fontSize: '13px', 
      fontWeight: '500' 
    }}>
      截止日期
    </label>
    <input
      type="date"
      value={deadline}
      onChange={(e) => setDeadline(e.target.value)}
      style={{
        width: '100%',
        height: '40px',
        padding: '0 10px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontSize: '14px',
        boxSizing: 'border-box',
        minWidth: '100%',
        maxWidth: '100%'
      }}
    />
  </div>

  {/* 目标值 - 占1份宽度 */}
  <div style={{ flex: '1' }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '4px', 
      fontSize: '13px', 
      fontWeight: '500' 
    }}>
      目标值
    </label>
    <input
      type="number"
      placeholder="目标"
      value={target}
      onChange={(e) => setTarget(Number(e.target.value))}
      min="1"
      style={{
        width: '100%',
        height: '40px',
        padding: '0 10px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontSize: '14px',
        boxSizing: 'border-box'
      }}
    />
  </div>

  {/* 单位 - 占1份宽度 */}
  <div style={{ flex: '1' }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '4px', 
      fontSize: '13px', 
      fontWeight: '500' 
    }}>
      单位
    </label>
    <select
      value={unit}
      onChange={(e) => setUnit(e.target.value)}
      style={{
        width: '100%',
        height: '40px',
        padding: '0 10px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontSize: '14px',
        backgroundColor: '#fff',
        boxSizing: 'border-box'
      }}
    >
      <option value="%">%</option>
      <option value="页">页</option>
      <option value="章">章</option>
      <option value="题">题</option>
      <option value="本">本</option>
      <option value="篇">篇</option>
      <option value="单元">单元</option>
    </select>
  </div>
</div>

            <button
              onClick={handleAddTask}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginTop: '8px'
              }}
            >
              确认添加
            </button>
          </div>
        )}

        {/* 编辑任务模态框 - 优化布局 */}
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
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <h3 style={{ 
                textAlign: 'center', 
                marginBottom: '15px', 
                color: '#FF9800',
                fontSize: '16px',
                padding: '0 20px'
              }}>
                编辑任务
              </h3>

              {/* 任务内容 */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontSize: '13px', 
                  fontWeight: '500' 
                }}>
                  任务内容
                </label>
                <input
                  type="text"
                  placeholder="任务内容"
                  value={editFormData.text}
                  onChange={(e) => setEditFormData({...editFormData, text: e.target.value})}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 分类和子分类 - 手机版竖排 */}
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    分类
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    子分类
                  </label>
                  <select
                    value={editFormData.subCategory}
                    onChange={(e) => setEditFormData({...editFormData, subCategory: e.target.value})}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="">无子类别</option>
                    {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              {/* 截止日期、目标值、单位 - 优化布局 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '2fr 1fr 1fr',
                gap: '12px',
                marginBottom: '15px'
              }}>
                {/* 截止日期 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={editFormData.deadline}
                    onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 目标值 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    目标值
                  </label>
                  <input
                    type="number"
                    placeholder="目标"
                    value={editFormData.target}
                    onChange={(e) => setEditFormData({...editFormData, target: Number(e.target.value)})}
                    min="1"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 单位 */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '13px', 
                    fontWeight: '500' 
                  }}>
                    单位
                  </label>
                  <select
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({...editFormData, unit: e.target.value})}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="%">%</option>
      <option value="页">页</option>
      <option value="章">章</option>
      <option value="题">题</option>
      <option value="本">本</option>
      <option value="篇">篇</option>
      <option value="单元">单元</option>
                  </select>
                </div>
              </div>

              {/* 按钮区域 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={cancelEdit}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ccc',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={saveEditTask}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#FF9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 任务列表 - 优化手机端显示 */}
        <div style={{
          maxHeight: '50vh',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <div key={category} style={{ marginBottom: '15px' }}>
              <h3 style={{ 
                fontSize: '15px', 
                marginBottom: '8px', 
                color: '#FF9800',
                padding: '0 4px'
              }}>
                {category} ({categoryTasks.length})
              </h3>
              
              {categoryTasks.map(task => (
  <div
    key={task.id}
    style={{
      padding: '12px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      marginBottom: '8px',
      backgroundColor: task.important ? '#fff9e6' : '#fff',
      position: 'relative'
    }}
  >
    {/* 任务头部 */}
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      marginBottom: '8px',
      alignItems: 'center'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
        {task.text}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {task.deadline && (
          <div style={{ fontSize: '11px', color: '#666' }}>
            {task.deadline}
          </div>
        )}
        <button
          onClick={() => startEditTask(task)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FF9800',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px'
          }}
          title="编辑任务"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(task)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f44336',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px'
          }}
          title="删除任务"
        >
          🗑️
        </button>
      </div>
    </div>

    {/* 任务进度条 - 在这里添加百分比显示 */}
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        marginBottom: '2px'
      }}>
        <span>进度</span>
        <span>
          {/* 👇 在这里显示百分比 */}
          {Math.round((task.progress / task.target) * 100)}% | {task.progress}/{task.target} {task.unit}
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
          width: `${(task.progress / task.target) * 100}%`,
          height: '100%',
          backgroundColor: task.progress >= task.target ? '#4CAF50' : '#2196F3',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>

    {/* 进度控制按钮 */}
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '4px'
    }}>
      <button
        onClick={() => onUpdateProgress(task.id, Math.max(0, task.progress - 1))}
        style={{
          padding: '8px 4px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        -1
      </button>
      <button
        onClick={() => onUpdateProgress(task.id, Math.min(task.target, task.progress + 1))}
        style={{
          padding: '8px 4px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        +1
      </button>
      <button
        onClick={() => onUpdateProgress(task.id, task.target)}
        style={{
          padding: '8px 4px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#e8f5e8',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#4CAF50',
          fontWeight: '500'
        }}
      >
        完成
      </button>
    </div>
  </div>
))}
            </div>
          ))}
        </div>

        {/* 空状态提示 */}
        {tasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            暂无本月任务，点击上方按钮添加
          </div>
        )}
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

  // 日期圆点组件 - 修改后版本（文字颜色跟随圆点变化）
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
  const allDone = filteredTasks.every(task => task.done);
  const totalCount = filteredTasks.length;
  
  let dotColor = '';
  let textColor = '';
  
  if (isFuture) {
    dotColor = softColors.dotFuture;
    textColor = '#F39C12'; // 未来任务 - 橙色文字
  } else if (allDone) {
    dotColor = softColors.dotComplete;
    textColor = '#2ECC71'; // 全部完成 - 绿色文字
  } else {
    dotColor = softColors.dotIncomplete;
    textColor = '#E74C3C'; // 未完成 - 红色文字
  }
  
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
      
      {/* 任务总数 - 文字颜色跟随圆点状态 */}
      <span style={{
        fontSize: '9px',
        fontWeight: 'bold',
        color: textColor // 使用动态颜色
      }}>
        {totalCount}
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
const TaskEditModal = ({ task, categories, setShowCrossDateModal,setShowMoveTaskModal, onClose, onSave, onTogglePinned, onImageUpload, setShowDeleteModal,
  setCategories }) => {
const [editData, setEditData] = useState({
  text: task.text || '',
  category: task.category || categories[0].name,
  subCategory: task.subCategory || '',
  note: task.note || '',
  reflection: task.reflection || '',
  tags: task.tags || [],
  scheduledTime: task.scheduledTime || '',
  
  // 修复提醒时间字段
  reminderYear: task.reminderTime?.year?.toString() || '',
  reminderMonth: task.reminderTime?.month?.toString() || '',
  reminderDay: task.reminderTime?.day?.toString() || '',
  reminderHour: task.reminderTime?.hour?.toString() || '',
  reminderMinute: task.reminderTime?.minute?.toString() || '',
  
  repeatFrequency: task.repeatFrequency || '',
  repeatDays: task.repeatDays || [false, false, false, false, false, false, false],
  subTasks: task.subTasks || [],
  
  // 🔴 修复这里：正确初始化计划时间字段
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
    onClose(); // 关闭编辑模态框
    setTimeout(() => {
      setShowCrossDateModal(task); // 打开跨日期模态框，传递当前任务
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
          // 检查是否已存在
          const exists = categories.find(cat => cat.name === newCategory.trim());
          if (exists) {
            alert('该类别已存在！');
            return;
          }
          
          // 创建新类别
          const newCat = {
            name: newCategory.trim(),
            color: '#1a73e8', // 默认颜色
            subCategories: []
          };
          
          // 更新类别状态
          const updatedCategories = [...categories, newCat];
          setCategories(updatedCategories);
          
          // 保存到存储
          saveMainData('categories', updatedCategories);
          
          // 自动选择新类别
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
{editData.category === '校内' && (
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
      value={editData.subCategory || ''}
      onChange={(e) => setEditData({ ...editData, subCategory: e.target.value })}
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
        .find((c) => c.name === '校内')
        ?.subCategories?.map((subCat) => (
          <option key={subCat} value={subCat}>
            {subCat}
          </option>
        ))}
    </select>
  </div>
)}

</div>








{/* 编辑任务界面 - 标签编辑 - 合并成一排 */}
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 12,
}}>
  {/* 添加新标签和当前标签合并在一排 */}
  <div style={{
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    width: '100%'
  }}>
    {/* 添加新标签 - 左侧 */}
    <div style={{ flex: 1 }}>
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
            minWidth: 0,
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

    {/* 当前标签 - 右侧 */}
    <div style={{ flex: 1 }}>
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
        padding: '4px 8px',
        border: '1px solid #ccc',
        borderRadius: 6,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        boxSizing: 'border-box',
        maxHeight: 40, // 固定高度
        overflow: 'hidden', // 隐藏溢出内容
      }}>
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
  <label style={{
    display: 'block',
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  }}>
    ⏰ 计划时间
  </label>

  <div style={{
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  }}>
    {/* 开始时间 */}
    <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        type="number"
        min="0"
        max="23"
        placeholder="时"
        value={editData.startHour}
        onChange={(e) => setEditData({ ...editData, startHour: e.target.value })}
        style={{
          width: '100%',
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
        placeholder="分"
        value={editData.startMinute}
        onChange={(e) => setEditData({ ...editData, startMinute: e.target.value })}
        style={{
          width: '100%',
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

    <span style={{ color: '#666', fontSize: 12 }}>至</span>

    {/* 结束时间 */}
    <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        type="number"
        min="0"
        max="23"
        placeholder="时"
        value={editData.endHour}
        onChange={(e) => setEditData({ ...editData, endHour: e.target.value })}
        style={{
          width: '100%',
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
        placeholder="分"
        value={editData.endMinute}
        onChange={(e) => setEditData({ ...editData, endMinute: e.target.value })}
        style={{
          width: '100%',
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

  {/* 显示当前设置的计划时间 */}
  {editData.startHour && editData.startMinute && editData.endHour && editData.endMinute && (
    <div style={{
      fontSize: 12,
      color: '#28a745',
      textAlign: 'center',
      marginTop: 6,
      padding: 4,
      backgroundColor: '#e8f5e8',
      borderRadius: 4
    }}>
      计划时间: {editData.startHour}:{editData.startMinute} - {editData.endHour}:{editData.endMinute}
    </div>
  )}
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
      <option value="本">本</option>
      <option value="篇">篇</option>
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
  onUpdateProgress,
  onDeleteImage, // 添加这行
  onEditSubTask = () => {}
}) => {
  // 调试：显示任务的时间信息
  console.log('📊 TaskItem 渲染:', {
    任务: task.text,
    timeSpent: task.timeSpent,
    timeSegments: task.timeSegments
  });


  const [editingSubTaskIndex, setEditingSubTaskIndex] = useState(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [showProgressControls, setShowProgressControls] = useState(false);
  const [editingSubTaskNoteIndex, setEditingSubTaskNoteIndex] = useState(null);





  
// 常规任务添加模态框
const RegularTaskModal = ({ visible, onClose, onSave, categories }) => {
  const [taskText, setTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || '语文');

  const handleSave = () => {
    if (!taskText.trim()) {
      alert('请输入任务内容');
      return;
    }
    onSave(taskText.trim(), selectedCategory);
    setTaskText('');
    setSelectedCategory(categories[0]?.name || '语文');
    onClose();
  };

  if (!visible) return null;

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
        padding: '20px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '350px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{
          textAlign: 'center',
          marginBottom: '20px',
          color: '#FF9800',
          fontSize: '18px'
        }}>
          ➕ 添加常规任务
        </h3>

        {/* 任务内容输入 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#333'
          }}>
            任务内容
          </label>
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="输入任务内容..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        {/* 分类选择 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#333'
          }}>
            完成后的分类
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            {categories
              .filter(c => c.name !== "常规任务" && c.name !== "本周任务")
              .map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        {/* 按钮区域 */}
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#FF9800',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
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
    // 在 TaskItem 组件中找到任务项的外层 li 样式部分
// 替换原有的 style 部分

<li
  className="task-item"
  style={{
    position: "relative",
    background: (() => {
      // 如果有标签，使用第一个标签的浅色版本
      if (task.tags && task.tags.length > 0) {
        const tagColor = task.tags[0].color;
        // 将颜色转换为半透明版本 (20% 透明度)
        // 如果是 hex 格式 (#ff4444)，转换为 rgba
        const hexToRgba = (hex, alpha) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        // 检查是否是 hex 颜色格式
        if (tagColor && tagColor.startsWith('#')) {
          return hexToRgba(tagColor, 0.10); // 15% 透明度，非常浅
        }
        // 如果是其他格式，直接使用带透明度的颜色
        return tagColor ? tagColor.replace(')', ', 0.15)').replace('rgb', 'rgba') : (task.pinned ? "#fff9e6" : "#fff");
      }
      // 如果没有标签，使用原来的背景色
      return task.pinned ? "#fff9e6" : "#fff";
    })(),
    borderRadius: 6,
    minHeight: "24px",
    marginBottom: 4,
    padding: "8px",
    border: task.tags && task.tags.length > 0 
      ? `1px solid ${task.tags[0].color}`  // 边框使用标签原色
      : "0.5px solid #e0e0e0",
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
        
        {/* 任务文字和标签容器 */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, flexWrap: "wrap", gap: "4px" }}>
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
              whiteSpace: "pre-wrap",
              wordWrap: "break-word"
            }}
          >
            {task.text}
            {task.pinned && " 📌"}
            {task.isWeekTask && " 🌟"}
          </div>
          
          {/* 常规任务标签 - 字体大小与任务文字一致 */}
        {/* 常规任务标签 - 字体大小与任务文字一致 */}
{task.isRegularTask && task.targetCategory && (
  <span style={{
    color: (() => {
      // 如果是校内分类且有子分类，使用子分类的颜色逻辑
      if (task.targetCategory === "校内" && task.targetSubCategory) {
        // 可以给不同子分类不同颜色
        const subCategoryColors = {
          "数学": "#FF9800",
          "语文": "#F57C00",
          "英语": "#FFB74D",
          "运动": "#4CAF50"
        };
        return subCategoryColors[task.targetSubCategory] || "#FF9800";
      }
      
      // 其他分类的颜色
      switch(task.targetCategory) {
        case "语文": return "#FF9800";
        case "数学": return "#F57C00";
        case "英语": return "#FFB74D";
        case "物理": return "#E65100";
        case "化学": return "#FF7043";
        case "历史": return "#FB8C00";
        case "地理": return "#FFA726";
        case "生物": return "#FF6B35";
        case "政治": return "#FF8A65";
        default: return "#FF9800";
      }
    })(),
    fontSize: "14px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    lineHeight: 1.4
  }}>
    #{task.targetCategory === "校内" && task.targetSubCategory 
      ? `校内/${task.targetSubCategory}` 
      : task.targetCategory}
  </span>
)}
        </div>
      </div>


     

      {/* 第二行：备注和感想 */}
{(task.note || task.reflection) && (
  <div style={{ 
    marginLeft: "20px", 
    marginBottom: 4,
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
        💭 {task.reflection}
      </div>
    )}

    {/* 时间信息行 - 计划时间、提醒时间、计时器 */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
      gap: 8,
      flexWrap: "wrap"
    }}>
      {/* 左侧：计划时间和提醒时间 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flex: 1,
        minWidth: 0
      }}>
        {/* 计划时间 */}
        {task.scheduledTime && (
          <span
            style={{
              fontSize: 11,
              color: "#666",
              backgroundColor: "#f0f0f0",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #e0e0e0",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 2
            }}
            title="计划时间"
          >
            ⏰ {task.scheduledTime}
          </span>
        )}

        {/* 提醒时间 */}
        {task.reminderTime && (
          <span
            style={{
              fontSize: 11,
              color: "#666",
              backgroundColor: "#fff0f0",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #ffcccc",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 2
            }}
            title={`提醒时间: ${task.reminderTime.year || ''}年${task.reminderTime.month || ''}月${task.reminderTime.day || ''}日 ${task.reminderTime.hour || ''}:${task.reminderTime.minute || ''}`}
          >
            🔔 {task.reminderTime.year || ''}/{task.reminderTime.month || ''}/{task.reminderTime.day || ''} {task.reminderTime.hour || ''}:{task.reminderTime.minute || ''}
          </span>
        )}
      </div>

      {/* 右侧：计时器区域 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4
      }}>
        {/* 循环图标 */}
        {task.isRepeating && (
          <span style={{ fontSize: "12px" }} title="重复任务">🔄</span>
        )}

      

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
    fontFamily: 'Calibri, "微软雅黑", sans-serif',  // 添加这行
    textAlign: "center"
  }}
  title="点击修改时间"
>
 {formatTimeNoSeconds(task.timeSpent || 0)}  {/* 修复这里 */}
</span>
      </div>
    </div>
  </div>
)}

{/* 如果没有备注和感想，时间信息单独一行显示 */}
{!task.note && !task.reflection && (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginLeft: "20px",
    gap: 8,
    flexWrap: "wrap"
  }}>
    {/* 左侧：计划时间和提醒时间 */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      flex: 1,
      minWidth: 0
    }}>
      {/* 计划时间 */}
      {task.scheduledTime && (
        <span
          style={{
            fontSize: 11,
            color: "#666",
            backgroundColor: "#f0f0f0",
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid #e0e0e0",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 2
          }}
          title="计划时间"
        >
          ⏰ {task.scheduledTime}
        </span>
      )}

      {/* 提醒时间 */}
      {task.reminderTime && (
        <span
          style={{
            fontSize: 11,
            color: "#666",
            backgroundColor: "#fff0f0",
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid #ffcccc",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 2
          }}
          title={`提醒时间: ${task.reminderTime.year || ''}年${task.reminderTime.month || ''}月${task.reminderTime.day || ''}日 ${task.reminderTime.hour || ''}:${task.reminderTime.minute || ''}`}
        >
          🔔 {task.reminderTime.year || ''}/{task.reminderTime.month || ''}/{task.reminderTime.day || ''} {task.reminderTime.hour || ''}:{task.reminderTime.minute || ''}
        </span>
      )}
    </div>

    {/* 右侧：计时器区域 */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4
    }}>
      {/* 循环图标 */}
      {task.isRepeating && (
        <span style={{ fontSize: "12px" }} title="重复任务">🔄</span>
      )}

    

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
  {formatTimeNoSeconds(task.timeSpent || 0)}
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
    {/* 添加删除图片按钮 */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这张图片吗？')) {
          // 调用父组件传递的删除函数
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
        color: '#ff4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}
      title="删除图片"
    >
      ×
    </button>
  </div>
)}



</li>
);
};






function App() {
  const [tasksByDate, setTasksByDate] = useState({});
  const [showGitHubSyncModal, setShowGitHubSyncModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const hasAttemptedRestore = useRef(false);  // 添加这一行
  // 在现有状态定义区域添加
  const [showRegularModal, setShowRegularModal] = useState(false);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTaskText, setNewTaskText] = useState("");
  // 在 App 组件中找到状态定义区域，添加新的状态
  const [showRegularInput, setShowRegularInput] = useState(false); // 控制常规任务输入框
  const [newRegularTaskText, setNewRegularTaskText] = useState(""); // 常规任务文本
  const [newRegularTaskCategory, setNewRegularTaskCategory] = useState(baseCategories[0].name); // 常规任务分类
  const [showRegularCategorySelect, setShowRegularCategorySelect] = useState(false); // 控制分类选择显示
  const regularInputRef = useRef(null);
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

  const todayTasks = tasksByDate[selectedDate] || [];
 // 添加类别保存函数
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



  const [showSchedule, setShowSchedule] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statsMode, setStatsMode] = useState("week");
  const [collapsedCategories, setCollapsedCategories] = useState({
  "常规任务": true  // 这会让"常规任务"默认折叠
});
  const [showImageModal, setShowImageModal] = useState(null);
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showMoveTaskModal, setShowMoveTaskModal] = useState(null);
  const [showDailyLogModal, setShowDailyLogModal] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [dailyRatings, setDailyRatings] = useState({});
  const [dailyReflections, setDailyReflections] = useState({});
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);
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






// 从云端恢复数据
const handleRestoreData = useCallback(async (backupData) => {
  try {
    console.log('🔄 开始恢复数据...', backupData);

    // 恢复核心数据
    if (backupData.tasksByDate) {
      setTasksByDate(backupData.tasksByDate);
      await saveMainData('tasks', backupData.tasksByDate);
    }
    
    if (backupData.templates) {
      setTemplates(backupData.templates);
      await saveMainData('templates', backupData.templates);
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
    
    alert(`✅ 数据恢复成功！\n恢复了 ${Object.keys(backupData.dailyReflections || {}).length} 天的复盘数据`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('恢复失败:', error);
    alert('恢复失败: ' + error.message);
  }
}, []);

// 将 syncToGitHub 的 useCallback 定义移到所有 useEffect 之前
// eslint-disable-next-line no-unused-vars



// 完整的同步到 GitHub 函数（不包含成就系统）
// 完整的同步到 GitHub 函数
const syncToGitHub = useCallback(async () => {
  const token = localStorage.getItem('github_token');
  if (!token) {
    setShowGitHubSyncModal(true);
    alert('请先设置 GitHub Token');
    return;
  }

  try {
    // 先保存当前日期的数据
    await saveDailyData(selectedDate);
    
    // 收集所有需要同步的数据
    const syncData = {
      // 核心数据
      tasksByDate,
      templates,
      
      // 每日数据（确保包含所有复盘）
      dailyRatings,
      dailyReflections,
      
    
      
      // 类别配置
      categories,
      
      // 成绩记录
      grades: await loadMainData('grades') || [],
      
      // 元数据
      syncTime: new Date().toISOString(),
      version: '2.1',
      lastSelectedDate: selectedDate,
      lastCurrentMonday: currentMonday.toISOString()
    };

    console.log('📤 准备同步数据:', {
      任务天数: Object.keys(tasksByDate).length,
      模板数量: templates.length,
      有复盘的日期: Object.keys(dailyReflections).length,
      复盘示例: Object.entries(dailyReflections).slice(0, 2).map(([date, text]) => ({date, text: text?.substring(0, 20)}))
    });

    const gistId = localStorage.getItem('github_gist_id');
    const jsonData = JSON.stringify(syncData, null, 2);
    
    let response;
    
    if (gistId) {
      // 更新现有Gist
      response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: '学习跟踪器完整数据备份 - ' + new Date().toLocaleString(),
          files: {
            'study-tracker-data.json': {
              content: jsonData
            }
          }
        })
      });
    } else {
      // 创建新Gist
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: '学习跟踪器完整数据备份',
          public: false,
          files: {
            'study-tracker-data.json': {
              content: jsonData
            }
          }
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`同步失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result || !result.id) {
      throw new Error('GitHub 响应格式错误');
    }

    // 保存Gist ID
    localStorage.setItem('github_gist_id', result.id);
    localStorage.setItem('github_last_sync', new Date().toISOString());
    
    // 更新同步配置状态
    setSyncConfig(prev => ({
      ...prev,
      gistId: result.id,
      lastSync: new Date().toISOString()
    }));
    
    alert(`✅ 同步成功！\n\n同步了 ${Object.keys(dailyReflections).length} 天的复盘数据\nGist ID: ${result.id}`);
    
  } catch (error) {
    console.error('同步失败:', error);
    
    let errorMessage = '同步失败: ';
    if (error.message.includes('401')) {
      errorMessage += 'Token 无效或已过期，请重新设置 GitHub Token';
    } else if (error.message.includes('403')) {
      errorMessage += '权限不足，请检查 Token 是否有 gist 权限';
    } else if (error.message.includes('404')) {
      errorMessage += 'Gist 不存在，将创建新的备份';
      localStorage.removeItem('github_gist_id');
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
  }
}, [tasksByDate, templates, dailyRatings, dailyReflections, categories, selectedDate, currentMonday, saveDailyData]);

// 在现有的 useCallback 函数后面添加这个：





// 修复 autoRestoreLatestData 函数
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
    
    // 🔽 修复这里：总是询问用户是否要恢复，即使本地有数据
    const localDataCount = Object.keys(tasksByDate).length;
    const cloudDataCount = Object.keys(backupData.tasksByDate || {}).length;
    
    const confirmMessage = `发现云端备份数据，是否要恢复？\n\n` +
      `云端数据：\n` +
      `• 备份时间：${new Date(backupData.syncTime || gist.updated_at).toLocaleString()}\n` +
      `• 任务天数：${cloudDataCount}\n` +
      `• 模板数量：${(backupData.templates || []).length}\n\n` +
      `本地数据：\n` +
      `• 任务天数：${localDataCount}\n\n` +
      `恢复将覆盖当前所有本地数据！`;

    if (window.confirm(confirmMessage)) {
      console.log('用户确认恢复，开始设置状态...');
      
      // 保存这个gistId供以后使用
      if (!savedGistId) {
        localStorage.setItem('github_gist_id', targetGistId);
      }
      
      await handleRestoreData(backupData);
    } else {
      console.log('用户取消恢复');
    }
    
  } catch (error) {
    console.error('自动恢复失败:', error);
    
    // 提供更友好的错误信息
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













// 修改 CategoryManagerModal 组件中的子类别管理部分
const CategoryManagerModal = ({ categories, onSave, onClose }) => {
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#1a73e8');
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !localCategories.find(cat => cat.name === newCategoryName.trim())) {
      const newCategory = {
        name: newCategoryName.trim(),
        color: newCategoryColor,
        subCategories: []
      };
      setLocalCategories([...localCategories, newCategory]);
      setNewCategoryName('');
      setNewCategoryColor('#1a73e8');
    }
  };

  const handleDeleteCategory = (index) => {
    if (localCategories[index].name === '校内') {
      alert('不能删除"校内"类别！');
      return;
    }
    const newCategories = localCategories.filter((_, i) => i !== index);
    setLocalCategories(newCategories);
  };

  const handleColorChange = (index, newColor) => {
    const newCategories = [...localCategories];
    newCategories[index].color = newColor;
    setLocalCategories(newCategories);
  };

  // 添加子类别 - 只有校内类别可以添加
  const handleAddSubCategory = (categoryIndex, subCategoryName) => {
    if (!subCategoryName.trim()) return;
    
    const newCategories = [...localCategories];
    const category = newCategories[categoryIndex];
    
    // 检查是否是校内类别
    if (category.name !== '校内') {
      alert('只有"校内"类别可以添加子类别！');
      return;
    }
    
    // 检查子类别是否已存在
    if (category.subCategories.includes(subCategoryName.trim())) {
      alert('该子类别已存在！');
      return;
    }
    
    category.subCategories = [...category.subCategories, subCategoryName.trim()];
    setLocalCategories(newCategories);
  };

  // 删除子类别 - 只有校内类别可以删除
  const handleDeleteSubCategory = (categoryIndex, subCategoryIndex) => {
    const newCategories = [...localCategories];
    const category = newCategories[categoryIndex];
    
    if (category.name !== '校内') {
      alert('只有"校内"类别可以管理子类别！');
      return;
    }
    
    newCategories[categoryIndex].subCategories.splice(subCategoryIndex, 1);
    setLocalCategories(newCategories);
  };



  // 编辑子分类
const handleEditSubCategory = (subject, oldSubCat) => {
  const newSubCat = window.prompt(`编辑子分类 "${oldSubCat}" 的新名称:`, oldSubCat);
  if (newSubCat && newSubCat.trim() && newSubCat.trim() !== oldSubCat) {
    const trimmedNew = newSubCat.trim();
    
    // 检查新名称是否已存在
    if (subjectSubCategories[subject].includes(trimmedNew)) {
      alert('该子分类名称已存在！');
      return;
    }
    
    // 更新子分类列表
    setSubjectSubCategories(prev => {
      const updated = {
        ...prev,
        [subject]: prev[subject].map(sub => 
          sub === oldSubCat ? trimmedNew : sub
        )
      };
      
      // 立即保存到 localStorage
      localStorage.setItem('grade_subcategories', JSON.stringify(updated));
      
      return updated;
    });
    
    // 同时更新该子分类下的所有成绩记录
    const updatedGrades = grades.map(grade => {
      if (grade.subject === subject && grade.subCategory === oldSubCat) {
        return { ...grade, subCategory: trimmedNew };
      }
      return grade;
    });
    saveGrades(updatedGrades);
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
        <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#1a73e8' }}>
          管理类别和子类别
        </h3>

        


{/* 添加新类别 */}
<div style={{ marginBottom: 20, padding: 15, border: '1px solid #e0e0e0', borderRadius: 8 }}>
  <h4 style={{ marginBottom: 10 }}>添加新类别</h4>
  <div style={{ 
    display: 'flex', 
    gap: 8, 
    alignItems: 'center', 
    marginBottom: 10,
    flexWrap: 'nowrap' // 确保不换行
  }}>
    <input
      type="text"
      placeholder="类别名称"
      value={newCategoryName}
      onChange={(e) => setNewCategoryName(e.target.value)}
      style={{
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 14,
        minWidth: 0 // 防止在移动端溢出
      }}
    />
    <input
      type="color"
      value={newCategoryColor}
      onChange={(e) => setNewCategoryColor(e.target.value)}
      style={{
        width: '40px', // 固定宽度
        height: '40px', // 固定高度，确保正方形
        border: '1px solid #ccc',
        borderRadius: 6,
        cursor: 'pointer',
        padding: 0, // 移除内边距
        flexShrink: 0 // 防止被压缩
      }}
    />
    <button
      onClick={handleAddCategory}
      style={{
        width: '40px', // 固定宽度
        height: '40px', // 固定高度，与颜色选择框一致
        padding: 0, // 移除内边距
        backgroundColor: '#1a73e8',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: '16px', // 调整字体大小
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0 // 防止被压缩
      }}
    >
      添加
    </button>
  </div>
</div>

        {/* 类别列表 */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 10 }}>现有类别 ({localCategories.length})</h4>
          


{localCategories.map((category, index) => (
  <div
    key={category.name}
    style={{
      border: '1px solid #e0e0e0',
      borderRadius: 6,
      marginBottom: 12,
      backgroundColor: '#fff',
      overflow: 'hidden'
    }}
  >
    {/* 类别头部 - 调整布局 */}
    <div style={{
      display: 'flex',
      flexWrap: 'wrap', // ✅ 允许自动换行
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      backgroundColor: '#fff',
      color: '#333',
      borderBottom: '1px solid #f0f0f0',
      gap: '8px'
    }}>
      
      {/* 左侧：颜色圆点 + 类别名称输入框 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        flex: 1,
        minWidth: 0
      }}>
        {/* 颜色圆点 */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: category.color,
            border: '1px solid #ccc',
            flexShrink: 0
          }}
        />
        
        {/* 类别名称输入框 - 缩短宽度 */}
        <input
          type="text"
          value={category.name}
          onChange={(e) => {
            const newCategories = [...localCategories];
            newCategories[index].name = e.target.value;
            setLocalCategories(newCategories);
          }}
          disabled={category.name === '校内'}
          style={{
             border: category.name === '校内' ? 'none' : '1px solid #ccc',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: category.name === '校内' ? 'transparent' : '#fff',
    color: '#333',
    cursor: category.name === '校内' ? 'default' : 'text',
    // 移除宽度限制，让输入框自适应
    flex: 1,
    minWidth: '150px', // 设置一个合适的最小宽度
    boxSizing: 'border-box'
          }}
          onBlur={(e) => {
            if (!e.target.value.trim()) {
              const newCategories = [...localCategories];
              newCategories[index].name = category.name;
              setLocalCategories(newCategories);
              alert('类别名称不能为空');
              return;
            }
            
            const isDuplicate = localCategories.some((cat, i) => 
              i !== index && cat.name === e.target.value.trim()
            );
            
            if (isDuplicate) {
              const newCategories = [...localCategories];
              newCategories[index].name = category.name;
              setLocalCategories(newCategories);
              alert('类别名称已存在，请使用其他名称');
            }
          }}
        />
        
        
      </div>
      



<div style={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: 6,
  flexShrink: 0
}}>
  <input
    type="color"
    value={category.color}
    onChange={(e) => handleColorChange(index, e.target.value)}
    style={{
      width: '32px', // 固定宽度
      height: '32px', // 固定高度
      border: '1px solid #ccc',
      borderRadius: 4,
      cursor: 'pointer',
      padding: 0, // 移除内边距
      flexShrink: 0
    }}
  />

  {category.name !== '校内' && (
    <button
      onClick={() => handleDeleteCategory(index)}
      style={{
        width: '32px', // 固定宽度
        height: '32px', // 固定高度
        padding: 0, // 移除内边距
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      删除
    </button>
  )}
</div>

    </div>



              {/* 子类别管理 - 只有校内类别显示 */}
              {category.name === '校内' && (
                <div style={{ padding: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 8 
                  }}>
                    <h5 style={{ margin: 0, color: '#666' }}>
                      子类别 ({category.subCategories?.length || 0})
                    </h5>
                    <button
                      onClick={() => {
                        const newSubCategory = window.prompt('添加子类别名称');
                        if (newSubCategory) {
                          handleAddSubCategory(index, newSubCategory);
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      + 添加子类别
                    </button>
                  </div>

                  {/* 子类别列表 */}
                  <div style={{ 
                    maxHeight: 150, 
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    backgroundColor: '#fff'
                  }}>
                    {category.subCategories?.length > 0 ? (
                      category.subCategories.map((subCat, subIndex) => (
                        <div
                          key={subIndex}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderBottom: subIndex < category.subCategories.length - 1 ? '1px solid #f0f0f0' : 'none',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          {editingSubCategory && editingSubCategory[0] === index && editingSubCategory[1] === subIndex ? (
                            <input
                              type="text"
                              defaultValue={subCat}
                              onBlur={(e) => handleEditSubCategory(index, subIndex, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditSubCategory(index, subIndex, e.target.value);
                                }
                              }}
                              autoFocus
                              style={{
                                flex: 1,
                                padding: '4px 8px',
                                border: '1px solid #1a73e8',
                                borderRadius: 4,
                                fontSize: 12,
                                marginRight: 8
                              }}
                            />
                          ) : (
                            <span style={{ flex: 1, fontSize: 13 }}>{subCat}</span>
                          )}
                          
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => setEditingSubCategory([index, subIndex])}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#17a2b8',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 3,
                                cursor: 'pointer',
                                fontSize: 10
                              }}
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteSubCategory(index, subIndex)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 3,
                                cursor: 'pointer',
                                fontSize: 10
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        color: '#999',
                        fontSize: 12
                      }}>
                        暂无子类别
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              padding: 12,
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
              padding: 12,
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={() => {
              onSave(localCategories);
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



// 在 handleColorChange 函数旁边添加：
const handleRenameCategory = (index, newName) => {
  if (newName.trim() && !localCategories.find((cat, i) => i !== index && cat.name === newName.trim())) {
    const newCategories = [...localCategories];
    newCategories[index].name = newName.trim();
    setLocalCategories(newCategories);
  }
};


// 本周任务添加模态框
const WeekTaskModal = ({ onClose, onAdd }) => {
  const [taskText, setTaskText] = useState('');

  const handleAdd = () => {
    if (taskText.trim()) {
      onAdd(taskText.trim());
      onClose();
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
        maxWidth: 350
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#87CEEB' }}>
          📅 添加本周任务
        </h3>
        
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
            marginBottom: 15,
            boxSizing: 'border-box'
          }}
          autoFocus
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#f0f0f0',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#87CEEB',
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
    </div>
  );
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

const handleSave = () => {
  // 获取选中的日期
  const targetDates = getDateOptions()
    .filter(option => selectedDays.includes(option.day))
    .map(option => option.value);
  
  if (targetDates.length === 0) {
    alert('请至少选择一个日期');
    return;
  }
  
  onSave(task, targetDates); // 传递 task 和 targetDates
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
        id: `${crossDateId}_${date}`, // 每个日期的任务有唯一ID
        crossDateId: crossDateId,
        isCrossDate: true,
        crossDates: targetDates,
        done: task.done || false // 保持原有的完成状态
      };
      
      newTasksByDate[date].push(newTask);
      console.log(`创建任务在 ${date}:`, newTask);
    });
    
    return newTasksByDate;
  });
  
  alert(`任务已设置在 ${targetDates.length} 个日期显示`);
};


// 修改 toggleDone 函数，支持跨日期任务同步
// 修改 toggleDone 函数中处理本周任务的部分
const toggleDone = (task) => {
  const wasDone = task.done;

  // 如果是跨日期任务，同步所有日期的状态
  if (task.isCrossDate && task.crossDateId) {
    setTasksByDate(prevTasksByDate => {
      const newTasksByDate = { ...prevTasksByDate };

      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t => {
          if (t.crossDateId === task.crossDateId) {
            return {
              ...t,
              done: !wasDone,
              subTasks: t.subTasks ? t.subTasks.map(st => ({ ...st, done: !wasDone })) : t.subTasks
            };
          }
          return t;
        });
      });
      
      return newTasksByDate;
    });

  } else {
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
      setTasksByDate(prev => {
        const newTasksByDate = { ...prev };
        Object.keys(newTasksByDate).forEach(date => {
          newTasksByDate[date] = newTasksByDate[date].map(t =>
            t.isWeekTask && 
            t.text === task.text && 
            t.weekStart === task.weekStart // 只更新同一周的任务
              ? updateTaskWithDone(t, !wasDone) 
              : t
          );
        });
        return newTasksByDate;
      });
    } else {
      setTasksByDate(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].map(t =>
          t.id === task.id ? updateTaskWithDone(t, !wasDone) : t
        )
      }));
    }
  }
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




const generateDailyLog = () => {
  const completedTasks = todayTasks.filter(task => task.done && !task.isRegularTask);
  const incompleteTasks = todayTasks.filter(task => !task.done && task.category === "校内" && !task.isRegularTask);
  
 

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
          markdownContent += `- [x] ${task.text}${timeText}\n`;
        } else {
          // 未完成任务 - 只针对校内分类
          logContent += `  ❌ ${task.text}${timeText}\n`;
          markdownContent += `- [ ] ${task.text}${timeText}\n`;
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
          markdownContent += `- [x] ${task.text}${timeText}\n`;
        } else {
          // 未完成任务 - 只针对校内分类
          logContent += `    ❌ ${task.text}${timeText}\n`;
          markdownContent += `- [ ] ${task.text}${timeText}\n`;
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
  const totalTasksCount = completedTasks.length + incompleteTasks.length; // 不再包含常规任务

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
    // 添加setState方法
    setState: (newState) => {
      
    }
  };
  
  return () => {
    delete window.appInstance;
  };
}, [tasksByDate, templates, isInitialized, selectedDate]);
  










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
  

  



 

// 修复：检查提醒时间并置顶到期任务
useEffect(() => {
  const checkReminders = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  console.log('🔔🔔 检查提醒日期:', {
    当前日期: `${currentYear}-${currentMonth}-${currentDay}`
  });

  const updatedTasksByDate = { ...tasksByDate };
  let hasChanges = false;

  Object.keys(updatedTasksByDate).forEach(date => {
    updatedTasksByDate[date] = updatedTasksByDate[date].map(task => {
      if (task.reminderTime && !task.pinned) {
        const { year, month, day } = task.reminderTime;
        
        console.log('📋📋 检查任务提醒:', {
          任务: task.text,
          提醒日期: `${year}-${month}-${day}`,
          是否今天: year === currentYear && month === currentMonth && day === currentDay
        });

        // 只检查日期是否匹配
        if (year === currentYear && 
            month === currentMonth && 
            day === currentDay) {
          console.log('🎯🎯 触发提醒并置顶任务:', task.text);
          hasChanges = true;
          return { ...task, pinned: true };
        }
      }
      return task;
    });
  });

  if (hasChanges) {
    console.log('✅ 更新任务状态，置顶到期任务');
    setTasksByDate(updatedTasksByDate);
    localStorage.setItem('study-tracker-PAGE_A-v2_tasks', JSON.stringify(updatedTasksByDate));
  }
};




  // 每分钟检查一次提醒
  const intervalId = setInterval(checkReminders, 60000);
  
  // 立即检查2  是一次
  checkReminders();

  return () => clearInterval(intervalId);
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
  
  
  


 

  


// 添加全局调试函数
useEffect(() => {
  // 调试函数：查看所有提醒任务
  window.debugReminders = () => {
    const now = new Date();
    console.log('=== 提醒任务调试 ===');
    console.log('当前时间:', now.toLocaleString());
    
    Object.entries(tasksByDate).forEach(([date, tasks]) => {
      tasks.forEach(task => {
        if (task.reminderTime) {
          const rt = task.reminderTime;
          const reminderDate = new Date(
            rt.year || now.getFullYear(),
            (rt.month || now.getMonth() + 1) - 1,
            rt.day || now.getDate(),
            rt.hour || 0,
            rt.minute || 0
          );
          const isToday = reminderDate.toDateString() === now.toDateString();
          const isPast = reminderDate <= now;
          
          console.log(`任务: "${task.text}"`, {
            提醒时间: `${rt.year || 'undefined'}-${rt.month || 'undefined'}-${rt.day || 'undefined'} ${rt.hour || 0}:${rt.minute || 0}`,
            是否今天: isToday,
            是否已过时: isPast,
            是否置顶: task.pinned,
            提醒时间对象: rt
          });
        }
      });
    });
  };

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

    console.log('🔔 手动检查提醒时间:', `${currentYear}-${currentMonth}-${currentDay} ${currentHour}:${currentMinute}`);

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

// 格式化时间为小时（使用实际时间，不强制递增）
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

// 加载本月任务数据
const savedMonthTasks = await loadMainData('monthTasks');
if (savedMonthTasks) {
  setMonthTasks(savedMonthTasks);
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






      

    // 设置定时备份 - 添加这3行代码
    const backupTimer = setInterval(autoBackup, AUTO_BACKUP_CONFIG.backupInterval);
    console.log('✅ 自动备份已启动，间隔:', AUTO_BACKUP_CONFIG.backupInterval / 1000 / 60 + '分钟');
    setTimeout(autoBackup, 3000); // 3秒后执行第一次备份
      
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





// 加载所有日期的每日数据
useEffect(() => {
  const loadAllDailyData = async () => {
    if (!isInitialized) return;
    
    try {
      console.log('📥 开始加载所有每日数据...');
      
      const allMoods = {};
      const allRatings = {};
      const allReflections = {};
      
      // 获取所有 localStorage 键
      const allKeys = Object.keys(localStorage);
      const dailyKeys = allKeys.filter(key => key.startsWith(`${STORAGE_KEY}_daily_`));
      
      console.log(`找到 ${dailyKeys.length} 个每日数据记录`);
      
      for (const key of dailyKeys) {
        try {
          const dataStr = localStorage.getItem(key);
          if (!dataStr) continue;
          
          const data = JSON.parse(dataStr);
          if (data && data.date) {
            allMoods[data.date] = data.mood || 0;
            allRatings[data.date] = data.rating || 0;
            allReflections[data.date] = data.reflection || '';
            console.log(`✅ 加载 ${data.date} 的复盘:`, data.reflection?.substring(0, 30));
          }
        } catch (error) {
          console.error('解析每日数据失败:', key, error);
        }
      }
      
      setDailyRatings(allRatings);
      setDailyReflections(allReflections);
      
      console.log('✅ 每日数据加载完成:', {
        有心情的日期: Object.keys(allMoods).length,
        有评分的日期: Object.keys(allRatings).length,
        有复盘的日期: Object.keys(allReflections).length
      });
      
    } catch (error) {
      console.error('加载每日数据失败:', error);
    }
  };
  
  loadAllDailyData();
}, [isInitialized]);














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

  

  // 自动同步
useEffect(() => {
  const autoSyncEnabled = localStorage.getItem('github_auto_sync') === 'true';
  const token = localStorage.getItem('github_token');
  
  if (autoSyncEnabled && token && isInitialized) {
    console.log('⏰ 自动同步已启用，每30分钟执行一次');
    
    const autoSyncTimer = setInterval(() => {
      console.log('⏰ 执行自动同步...');
      syncToGitHub();
    }, 30 * 60 * 1000); // 30分钟
    
    return () => clearInterval(autoSyncTimer);
  }
}, [isInitialized, syncToGitHub]);


// 添加 useEffect 来处理新日期的常规任务复制
// 替换现有的 useEffect 来处理新日期的常规任务复制
useEffect(() => {
  // 当有新日期被创建时，自动复制常规任务，且状态为未完成
  const copyRegularTasksToNewDate = (newDate) => {
    setTasksByDate(prev => {
      // 如果这个日期已经有任务，不处理
      if (prev[newDate] && prev[newDate].length > 0) {
        return prev;
      }
      
      // 获取已有的常规任务模板（从其他日期）
      const existingRegularTasks = [];
      
      // 遍历所有日期，收集常规任务模板（去重）
      for (const date in prev) {
        const tasks = prev[date] || [];
        tasks.forEach(task => {
          if (task.isRegularTask && 
              !existingRegularTasks.some(t => t.text === task.text)) {
            existingRegularTasks.push({
              text: task.text,
              targetCategory: task.targetCategory,
              isRegularTask: true
            });
          }
        });
      }
      
      // 如果有常规任务模板，为新日期创建任务（状态为未完成）
      if (existingRegularTasks.length > 0) {
        const newTasks = existingRegularTasks.map(template => ({
          id: `regular_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${newDate}`,
          text: template.text,
          category: "常规任务",
          targetCategory: template.targetCategory,
          done: false, // 强制为未完成状态
          timeSpent: 0,
          subTasks: [],
          note: "",
          reflection: "",
          image: null,
          scheduledTime: "",
          pinned: false,
          isRegularTask: true,
          progress: {
            initial: 0,
            current: 0,
            target: 0,
            unit: "%"
          }
        }));
        
        return {
          ...prev,
          [newDate]: newTasks
        };
      }
      
      return prev;
    });
  };

  // 监听日期变化
  copyRegularTasksToNewDate(selectedDate);
  
}, [selectedDate]); // 当选中的日期变化时执行

  // 替换现有的 useEffect 点击外部处理逻辑
// 替换现有的 useEffect 点击外部处理逻辑
useEffect(() => {
  const handleClickOutside = (event) => {
    // 检查是否点击了重复设置或计划时间的按钮
    const isRepeatButton = event.target.closest('button')?.textContent?.includes('重复');
    const isTimeButton = event.target.closest('button')?.textContent?.includes('计划时间');
    const isTemplateButton = event.target.closest('button')?.textContent?.includes('模板');
    
    // 检查是否点击了常规任务输入框内的元素
    const isRegularInputElement = regularInputRef.current && regularInputRef.current.contains(event.target);
    
    // 检查是否点击了分类选择按钮
    const isCategorySelectButton = event.target.closest('button')?.textContent?.includes('分类');
    
    // 检查是否点击了模态框
    const isModalClick = event.target.closest('[style*="position: fixed"]') ||
      event.target.closest('[style*="z-index: 1000"]');

    // 如果点击了这些功能按钮或模态框，不关闭输入框
    if (isRepeatButton || isTimeButton || isTemplateButton || isModalClick || isCategorySelectButton) {
      return;
    }

    // 检查常规任务输入框的点击
    if (regularInputRef.current && !isRegularInputElement) {
      // 只有当确实点击了外部且不是分类选择按钮时才关闭
      if (!isCategorySelectButton) {
        setShowRegularInput(false);
        setShowRegularCategorySelect(false);
      }
    }

    if (addInputRef.current && !addInputRef.current.contains(event.target)) {
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
  const pinnedTasks = todayTasks.filter(task => task.pinned);
  const weekDates = getWeekDates(currentMonday);


  
// 计算今日统计数据（包含常规任务）
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

 // 在生成图表数据的函数中也要确保包含常规任务
// 在生成图表数据的函数中也要确保排除未完成的常规任务
const generateChartData = () => {
  let dateRange = [];
  if (statsMode === "week") {
    dateRange = getWeekDates(currentMonday).map(d => d.date);
  } else {
    dateRange = getWeekDates(currentMonday).map(d => d.date);
  }

  const stats = {
    totalTime: 0,
    byCategory: {},
    byDay: {},
    tasksByDay: {},
    completionRates: [],
    dailyTimes: [],
    bySubCategory: {}
  };

  dateRange.forEach(date => {
    const dayTasks = tasksByDate[date] || [];
    
    // 排除本周任务和未完成的常规任务
    const learningTasks = dayTasks.filter(task => {
      if (task.category === "本周任务") return false;
      if (task.isRegularTask && !task.done) return false;
      return true;
    });
    
    let dayTotal = 0;
    let completedTasks = 0;

    learningTasks.forEach(task => {
      stats.totalTime += task.timeSpent || 0;
      dayTotal += task.timeSpent || 0;

      if (!stats.byCategory[task.category]) {
        stats.byCategory[task.category] = 0;
      }
      stats.byCategory[task.category] += task.timeSpent || 0;

      // 校内子分类统计
      if (task.category === '校内') {
        const subCat = task.subCategory || '未分类';
        if (!stats.bySubCategory[subCat]) {
          stats.bySubCategory[subCat] = 0;
        }
        stats.bySubCategory[subCat] += task.timeSpent || 0;
      }

      if (task.done) completedTasks++;
    });

    stats.byDay[date] = dayTotal;
    stats.tasksByDay[date] = completedTasks;

    if (learningTasks.length > 0) {
      stats.completionRates.push((completedTasks / learningTasks.length) * 100);
    }

    stats.dailyTimes.push(dayTotal);
  });

  return {
    dailyStudyData: Object.entries(stats.byDay).map(([date, time]) => {
      const minutes = Math.round(time / 60);
      return {
        name: `${new Date(date).getDate()}日`,
        time: minutes,
        date: date.slice(5)
      };
    }),
    categoryData: categories
      .filter(cat => cat.name !== "运动" && cat.name !== "本周任务")
      .map(cat => ({
        name: cat.name,
        time: Math.round((stats.byCategory[cat.name] || 0) / 60),
        color: cat.color
      })),
    dailyTasksData: Object.entries(stats.tasksByDay).map(([date, count]) => ({
      name: `${new Date(date).getDate()}日`,
      tasks: count,
      date: date.slice(5)
    })),
    subCategoryData: Object.entries(stats.bySubCategory).map(([subCat, time]) => ({
      name: subCat,
      time: Math.round(time / 60),
      color: '#1a73e8'
    })),
    avgCompletion: stats.completionRates.length > 0 ?
      Math.round(stats.completionRates.reduce((a, b) => a + b, 0) / stats.completionRates.length) : 0,
    avgDailyTime: stats.dailyTimes.length > 0 ?
      Math.round(stats.dailyTimes.reduce((a, b) => a + b, 0) / stats.dailyTimes.length / 60) : 0
  };
};


  
  
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




        




const handleAddTask = (template = null) => {
  console.log('=== 开始添加任务 ===');
  console.log('template:', template);
  console.log('repeatConfig:', repeatConfig); // 添加这行来调试
  
  let text, category;

  if (template) {
    text = template.content;
    category = template.category;
  } else {
    text = newTaskText.trim();
    category = newTaskCategory;
    if (!text) {
      alert('请输入任务内容');
      return;
    }
  }

  // 构建计划时间字符串
  let scheduledTime = '';
  if (repeatConfig.startHour && repeatConfig.startMinute && repeatConfig.endHour && repeatConfig.endMinute) {
    const formatTime = (hour, minute) => {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };
    scheduledTime = `${formatTime(repeatConfig.startHour, repeatConfig.startMinute)}-${formatTime(repeatConfig.endHour, repeatConfig.endMinute)}`;
  }

  // 构建提醒时间对象
  const reminderTime = {};
  if (repeatConfig.reminderYear) reminderTime.year = parseInt(repeatConfig.reminderYear);
  if (repeatConfig.reminderMonth) reminderTime.month = parseInt(repeatConfig.reminderMonth);
  if (repeatConfig.reminderDay) reminderTime.day = parseInt(repeatConfig.reminderDay);
  if (repeatConfig.reminderHour) reminderTime.hour = parseInt(repeatConfig.reminderHour);
  if (repeatConfig.reminderMinute) reminderTime.minute = parseInt(repeatConfig.reminderMinute);

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
    scheduledTime: scheduledTime, // 添加计划时间
    pinned: false,
    progress: {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    // 添加重复设置和提醒时间
    reminderTime: Object.keys(reminderTime).length > 0 ? reminderTime : null,
    repeatFrequency: repeatConfig.frequency || '',
    repeatDays: repeatConfig.days || [false, false, false, false, false, false, false],
    isRepeating: !!repeatConfig.frequency
  };

  console.log('✅ 准备添加任务:', baseTask);

  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    
    if (!newTasksByDate[selectedDate]) {
      newTasksByDate[selectedDate] = [];
    }

    const existingTask = newTasksByDate[selectedDate].find(
      task => task.text === text && task.category === category
    );

    if (!existingTask) {
      newTasksByDate[selectedDate].push(baseTask);
      console.log(`✅ 任务已添加到 ${selectedDate}`, baseTask);
    } else {
      console.log('⚠️ 任务已存在，跳过添加');
    }

    return newTasksByDate;
  });

  if (!template) {
    setNewTaskText("");
    setShowAddInput(false);
    setNewTaskSubCategory('');
    
    // 重置重复配置
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
  }
};


// 修改 toggleRegularTaskDone 函数
// 修改 toggleRegularTaskDone 函数
const toggleRegularTaskDone = (task) => {
  const wasDone = task.done;
  
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    const todayStr = selectedDate;
    const todayTasks = [...(prev[todayStr] || [])];
    
    if (!wasDone) {
      // 任务从未完成变为完成
      
      // 1. 创建目标分类中的新任务
      const newCompletedTask = {
        id: `completed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        text: task.text,
        category: task.targetCategory,
        subCategory: task.targetSubCategory || '',
        done: true,
        timeSpent: 0,
        subTasks: [],
        note: task.note || "",
        reflection: task.reflection || "",
        image: task.image || null,
        scheduledTime: task.scheduledTime || "",
        pinned: false,
        progress: task.progress || {
          initial: 0,
          current: 0,
          target: 0,
          unit: "%"
        },
        tags: task.tags || [],
        reminderTime: task.reminderTime || null
      };
      
      // 2. 过滤掉原来的常规任务（删除原始任务）
      const updatedTodayTasks = todayTasks
        .filter(t => t.id !== task.id) // 删除原始任务
        .concat(newCompletedTask); // 添加新任务
      
      newTasksByDate[todayStr] = updatedTodayTasks;
      
    } else {
      // 任务从完成变为未完成
      
      // 1. 删除目标分类中的副本任务
      const updatedTodayTasks = todayTasks.filter(t => 
        !(t.category === task.targetCategory && t.text === task.text)
      );
      
      // 2. 重新创建常规任务（未完成状态）
      const restoredRegularTask = {
        id: `regular_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        text: task.text,
        targetCategory: task.targetCategory,
        targetSubCategory: task.targetSubCategory || '',
        category: "常规任务",
        done: false,
        timeSpent: 0,
        subTasks: task.subTasks || [],
        note: task.note || "",
        reflection: task.reflection || "",
        image: task.image || null,
        scheduledTime: task.scheduledTime || "",
        pinned: false,
        progress: task.progress || {
          initial: 0,
          current: 0,
          target: 0,
          unit: "%"
        },
        tags: task.tags || [],
        reminderTime: task.reminderTime || null,
        isRegularTask: true
      };
      
      updatedTodayTasks.push(restoredRegularTask);
      newTasksByDate[todayStr] = updatedTodayTasks;
    }
    
    return newTasksByDate;
  });
};


// 替换现有的 handleAddRegularTask 函数
const handleAddRegularTask = () => {
  if (!newRegularTaskText.trim()) {
    alert('请输入任务内容');
    return;
  }

  const baseTask = {
    text: newRegularTaskText.trim(),
    targetCategory: newRegularTaskCategory,
    targetSubCategory: newTaskSubCategory || '',
    isRegularTask: true,
    category: "常规任务",  // 永远属于常规任务分类
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

  // 为所有现有日期创建常规任务
  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };
    const allDates = Object.keys(prev);
    
    if (allDates.length === 0) {
      if (!newTasksByDate[selectedDate]) {
        newTasksByDate[selectedDate] = [];
      }
      newTasksByDate[selectedDate].push({
        ...baseTask,
        id: `regular_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${selectedDate}`
      });
    } else {
      allDates.forEach(date => {
        if (!newTasksByDate[date]) {
          newTasksByDate[date] = [];
        }
        
        const exists = newTasksByDate[date].some(
          t => t.isRegularTask && t.text === baseTask.text
        );
        
        if (!exists) {
          newTasksByDate[date].push({
            ...baseTask,
            id: `regular_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${date}`
          });
        }
      });
    }
    
    return newTasksByDate;
  });

  // 重置输入
  setNewRegularTaskText("");
  setNewTaskSubCategory("");
  setShowRegularInput(false);
  setShowRegularCategorySelect(false);
};


// 添加本周任务 - 修改版本
// 添加本周任务
const handleAddWeekTask = (text) => {
  if (!text.trim()) return;

  const weekDates = getWeekDates(currentMonday);
  const taskId = Date.now().toString();
  const weekStart = currentMonday.toISOString(); // 获取当前周的周一
  
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
    reflection: "",
    subTasks: [],
    tags: [],
    weekStart: weekStart, // 记录这是哪一周的任务
    progress: {
      initial: 0,
      current: 0,
      target: 0,
      unit: "%"
    },
    reminderTime: null
  };

  setTasksByDate(prev => {
    const newTasksByDate = { ...prev };

    // 只为本周的每一天添加任务
    weekDates.forEach(dateObj => {
      if (!newTasksByDate[dateObj.date]) {
        newTasksByDate[dateObj.date] = [];
      }

      // 检查该日期是否已有相同文本的任务（只检查当前周）
      const existingTask = newTasksByDate[dateObj.date].find(
        task => task.isWeekTask && 
               task.text === text.trim() && 
               task.weekStart === weekStart // 只检查当前周
      );

      if (!existingTask) {
        newTasksByDate[dateObj.date].push({ 
          ...newTask, 
          id: `${taskId}_${dateObj.date}` // 为不同日期创建不同ID
        });
      }
    });

    return newTasksByDate;
  });
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
  const currentTotal = task.timeSpent || 0;
  const currentMinutes = Math.floor(currentTotal / 60);
  
  const newTimeStr = window.prompt(
    "设置任务总时间（单位：分钟，例如 5 表示5分钟）", 
    currentMinutes.toString()
  );

  if (newTimeStr !== null) {
    const minutes = parseInt(newTimeStr) || 0;
    const newSeconds = minutes * 60;
    
    if (newSeconds >= 0) {
      if (task.isWeekTask) {
        setTasksByDate(prev => {
          const newTasksByDate = { ...prev };
          Object.keys(newTasksByDate).forEach(date => {
            newTasksByDate[date] = newTasksByDate[date].map(t =>
              t.isWeekTask && 
              t.text === task.text && 
              t.weekStart === task.weekStart // 只更新同一周的任务
                ? { ...t, timeSpent: newSeconds } 
                : t
            );
          });
          return newTasksByDate;
        });
      } else {
        setTasksByDate(prev => ({
          ...prev,
          [selectedDate]: prev[selectedDate].map(t =>
            t.id === task.id ? { ...t, timeSpent: newSeconds } : t
          )
        }));
      }
    }
  }
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

// 删除任务 - 调试版
// 删除任务
const deleteTask = (task, deleteOption = 'today') => {
  const updatedTasksByDate = { ...tasksByDate };
  
  if (deleteOption === 'future') {
    const allDates = Object.keys(updatedTasksByDate).sort();
    const futureDates = allDates.filter(date => date >= selectedDate);
    
    futureDates.forEach(date => {
      updatedTasksByDate[date] = (updatedTasksByDate[date] || []).filter(t => {
        if (task.isWeekTask) {
          // 只删除同一周的任务
          return !(t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart);
        } else if (task.crossDateId) {
          return t.crossDateId !== task.crossDateId;
        } else {
          return t.id !== task.id;
        }
      });
    });
    
  } else if (deleteOption === 'all') {
    Object.keys(updatedTasksByDate).forEach(date => {
      updatedTasksByDate[date] = (updatedTasksByDate[date] || []).filter(t => {
        if (task.isWeekTask) {
          // 只删除同一周的任务
          return !(t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart);
        } else if (task.crossDateId) {
          return t.crossDateId !== task.crossDateId;
        } else {
          return t.id !== task.id;
        }
      });
    });
    
  } else {
    updatedTasksByDate[selectedDate] = (updatedTasksByDate[selectedDate] || []).filter(t => {
      if (task.isWeekTask) {
        return !(t.isWeekTask && t.text === task.text && t.weekStart === task.weekStart);
      } else if (task.crossDateId) {
        return t.crossDateId !== task.crossDateId;
      } else {
        return t.id !== task.id;
      }
    });
  }
  
  setTasksByDate(updatedTasksByDate);
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
    console.log('saveTaskEdit 被调用:', editData.repeatFrequency);
    // 如果有重复设置，先删除原有的重复任务（如果是重复任务的话）



// 构建提醒时间对象 - 修复这部分
  const reminderTime = {};
  if (editData.reminderYear) reminderTime.year = parseInt(editData.reminderYear);
  if (editData.reminderMonth) reminderTime.month = parseInt(editData.reminderMonth);
  if (editData.reminderDay) reminderTime.day = parseInt(editData.reminderDay);
  if (editData.reminderHour !== '') reminderTime.hour = parseInt(editData.reminderHour) || 0;
  if (editData.reminderMinute !== '') reminderTime.minute = parseInt(editData.reminderMinute) || 0;

  console.log('📅 保存的提醒时间:', reminderTime);


    
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

 // 先更新当前任务
 if (task.isWeekTask) {
  const updatedTasksByDate = { ...tasksByDate };
  Object.keys(updatedTasksByDate).forEach(date => {
    updatedTasksByDate[date] = updatedTasksByDate[date].map(t =>
      t.isWeekTask && t.text === task.text ? {
        ...t,
        isRepeating: true,
        repeatFrequency: editData.repeatFrequency,
        repeatDays: editData.repeatDays,
        repeatId: task.repeatId || `repeat_${Date.now()}`
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
        isRepeating: true,
        repeatFrequency: editData.repeatFrequency,
        repeatDays: editData.repeatDays,
        repeatId: task.repeatId || `repeat_${Date.now()}`
      } : t
    )
  }));
}


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
  
          // 跳过今天，避免重复创建
          if (i === 0) continue;
  
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
  
          // 将 forEach 改为 for 循环
          for (let dayIndex = 0; dayIndex < editData.repeatDays.length; dayIndex++) {
            const isSelected = editData.repeatDays[dayIndex];
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
  
              // 跳过今天，避免重复创建
              if (taskDateClean.getTime() === today.getTime()) continue;
  
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
          }
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

// 修改分类总时间 - 只支持分钟
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
                ? { ...t, timeSpent: (t.timeSpent || 0) + timePerTask }
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
              pinned: false
            });
          }

          return newTasksByDate;
        });
      }
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
  
  console.log('prevWeek:', {
    原周一: currentMonday.toLocaleDateString(),
    新周一: monday.toLocaleDateString()
  });
  
  setCurrentMonday(monday);
  
  // 使用本地日期格式，避免时区问题
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  const newSelectedDate = `${year}-${month}-${day}`;
  
  setSelectedDate(newSelectedDate);
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


// 在 handleDateSelect 函数中修复
const handleDateSelect = (selectedDate) => {
  // 使用本地日期创建 selectedMonday
  const localSelectedDate = new Date(
    selectedDate.getFullYear(), 
    selectedDate.getMonth(), 
    selectedDate.getDate()
  );
  const selectedMonday = getMonday(localSelectedDate);
  
  // 修复日期格式，使用本地日期
  const year = localSelectedDate.getFullYear();
  const month = String(localSelectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(localSelectedDate.getDate()).padStart(2, '0');
  const newSelectedDate = `${year}-${month}-${day}`;
  
  setCurrentMonday(selectedMonday);
  setSelectedDate(newSelectedDate);
  setShowDatePickerModal(false);
};




// 清空所有数据
const clearAllData = async () => {
  if (window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
    setTasksByDate({});
    setTemplates([]);

    
    
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







// 在 handleExportData 函数之前添加这个辅助函数
const loadDataWithFallback = async (key, fallback) => {
  try {
    const data = await loadMainData(key);
    return data !== null ? data : fallback;
  } catch (error) {
    console.error(`加载 ${key} 失败:`, error);
    return fallback;
  }
};

// 替换现有的 handleExportData 函数
// 替换现有的 handleExportData 函数
const handleExportData = async () => {
  try {
    // 使用 loadDataWithFallback 函数安全加载数据
    const allData = {
      tasks: await loadDataWithFallback('tasks', {}),
      templates: await loadDataWithFallback('templates', []),
      categories: await loadDataWithFallback('categories', baseCategories),
      dailyRatings: dailyRatings || {},
      dailyReflections: dailyReflections || {},
      grades: await loadDataWithFallback('grades', []),
      exportDate: new Date().toISOString(),
      version: '2.1'
    };
    
    // 验证数据完整性
    const dataStats = {
      任务天数: Object.keys(allData.tasks || {}).length,
      模板数量: (allData.templates || []).length,
      有复盘的日期: Object.keys(allData.dailyReflections || {}).length,
      成绩记录: (allData.grades || []).length
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
    alert(`✅ 导出成功！\n\n导出内容：\n• 任务天数: ${dataStats.任务天数}\n• 模板数量: ${dataStats.模板数量}\n• 复盘天数: ${dataStats.有复盘的日期}\n• 成绩记录: ${dataStats.成绩记录}`);
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试: ' + error.message);
  }
};






  
  
const DailyLogModal = ({ logData, onClose, onCopy,  dailyRating, dailyReflection }) => {
  
  
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
  if (dailyRating > 0 || getCurrentDailyReflection) {
    markdown += "## 💭 今日总结\n\n";
    
    
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
    {( dailyRating > 0 || dailyReflection) && (
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

  

  // 计算今日统计数据


const todayStats = calculateTodayStats();
const { dailyStudyData, categoryData, subCategoryData,  dailyTasksData, avgCompletion, avgDailyTime } = generateChartData();

  

      
    
    

   


  
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
    每日学习时间（排除运动）
  </h3>
  <ResponsiveContainer width="100%" height="80%">
    <BarChart 
      data={dailyStudyData} 
      margin={{ top: 20, right: 10, left: -20, bottom: 5 }} // 增加顶部边距
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize }} />
      <YAxis 
        tick={{ fontSize }} 
        domain={[0, 'dataMax + 20']} // 给Y轴更多空间
      />
      <Bar
        dataKey="time"
        fill="#1a73e8"
        radius={[4, 4, 0, 0]}
        label={{ 
          position: "top", 
          fontSize: fontSize - 1, // 稍微减小字体
          formatter: (value) => `${value}分钟`,
          fill: "#333", // 确保标签颜色可见
          offset: 8 // 增加标签与柱子的距离
        }}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
       {/* 校内子分类学习时间 */}
<div style={{ height: chartHeight, marginBottom: 30 }}>
  <h3 style={{ textAlign: "center", marginBottom: 10, fontSize: fontSize + 2 }}>
    校内子分类学习时间
  </h3>
  
  {subCategoryData && subCategoryData.length > 0 ? (
    <>
      <div style={{
        backgroundColor: "#f8f9fa",
        padding: "8px",
        borderRadius: "6px",
        marginBottom: "10px",
        fontSize: "11px",
        textAlign: "center",
        color: "#666"
      }}>
        统计校内各科目的学习时间分布
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart 
          data={subCategoryData} 
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize }} />
          <YAxis 
            tick={{ fontSize }} 
            domain={[0, 'dataMax + 20']}
          />
          <Bar
            dataKey="time"
            fill="#1a73e8"
            radius={[4, 4, 0, 0]}
            label={{ 
              position: "top", 
              fontSize: fontSize - 1,
              formatter: (value) => `${value}分钟`,
              fill: "#333",
              offset: 8
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  ) : (
    <div style={{
      backgroundColor: "#f8f9fa",
      padding: "30px 20px",
      borderRadius: "8px",
      textAlign: "center",
      color: "#666",
      fontSize: "13px"
    }}>
      📚 暂无校内子分类学习时间数据
      <div style={{ fontSize: "11px", marginTop: "8px", lineHeight: "1.4" }}>
        请在"校内"分类的任务中设置子分类并记录时间<br/>
        支持的子分类：数学、语文、英语、运动等
      </div>
    </div>
  )}
</div>





        
        <div style={{ height: chartHeight, marginBottom: 30 }}>
  <h3 style={{ textAlign: "center", marginBottom: 10, fontSize: fontSize + 2 }}>
    各科目学习时间
  </h3>
  <ResponsiveContainer width="100%" height="80%">
    <BarChart 
      data={categoryData} 
      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" tick={{ fontSize }} />
      <YAxis 
        tick={{ fontSize }} 
        domain={[0, 'dataMax + 20']}
      />
      <Bar
        dataKey="time"
        fill="#4a90e2"
        radius={[4, 4, 0, 0]}
        label={{ 
          position: "top", 
          fontSize: fontSize - 1,
          formatter: (value) => `${value}分钟`,
          fill: "#333",
          offset: 8
        }}
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





{/* 子类别管理模态框 */}
{editingCategory && (
  <SubCategoryModal
    category={editingCategory}
    onSave={handleSaveSubCategories}
    onClose={() => setEditingCategory(null)}
  />
)}




 
   

    {showGradeModal && (
      <GradeModal 
        onClose={() => setShowGradeModal(false)} 
        isVisible={showGradeModal}
      />
    )}
 


     {showWeekTaskModal && (
  <WeekTaskModal
    onClose={() => setShowWeekTaskModal(false)}
    onAdd={(text) => {
      handleAddWeekTask(text);
      setShowWeekTaskModal(false);
    }}
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
        if ( dailyRating > 0 || getCurrentDailyReflection()) {
          content += "=== 今日总结 ===\n";
          
          
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
          onSave={handleAddTemplate}
          categories={categories}
          onClose={() => setShowTemplateModal(false)}
          onDelete={handleDeleteTemplate}
          setCategories={setCategories} // 添加这行
        />
      )}


{showGitHubSyncModal && (
  <GitHubSyncModal
    config={syncConfig}
    onSave={(newConfig) => {
      // 保存配置到 localStorage
      localStorage.setItem('github_token', newConfig.token);
      localStorage.setItem('github_auto_sync', newConfig.autoSync.toString());
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
    onSave={handleSaveCategories}
    onClose={() => setShowCategoryManager(false)}
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
    onSave={(editData) => saveTaskEdit(showTaskEditModal, editData)}
    onTogglePinned={togglePinned}
    onImageUpload={handleImageUpload}
    setShowDeleteModal={setShowDeleteModal}
    setCategories={setCategories} // 添加这行
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





<div style={{
  position: "relative",
  textAlign: "center",
  marginBottom: 15,
  padding: "0 40px"
}}>
 {/* 右上角成绩记录按钮 */}
<button
  onClick={() => setShowGradeModal(true)}
  style={{
    position: "absolute",
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: "transparent", // 改为透明
    border: "none", // 去掉边框
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    padding: 0 // 确保没有内边距
  }}
  title="成绩记录"
>
  📊
</button>
  
  {/* 标题 */}
  <h1 style={{
    textAlign: "center",
    color: "#1a73e8",
    fontSize: "20px",
    margin: 0,
    padding: "10px 0", // 添加上下内边距来垂直居中
    lineHeight: "16px" // 恢复默认行高
  }}>
    汤圆学习记录
  </h1>
</div>

      
      <div style={{
        textAlign: "center",
        fontSize: 13,
        marginTop: "-5px",      // 确保为0
        marginBottom: 10
      }}>
        你已经打卡 {Object.keys(tasksByDate).length} 天，已累计完成 {Object.values(tasksByDate).flat().filter(t => t.done).length} 个学习任务
      </div>

      {/* 日期行上方的新布局 */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10
}}>
  {/* 左侧按钮组 - 本周任务和本月任务 */}
  <div style={{ display: "flex", gap: 8 }}>
    <button
      onClick={() => setShowWeekTaskModal(true)}
      style={{
        padding: "4px 6px",
        backgroundColor: "#87CEEB",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        fontSize: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4
      }}
    >
      本周
    </button>
    <button
      onClick={() => setShowMonthTaskModal(true)}
      style={{
        padding: "4px 6px",
        backgroundColor: "#FF9800",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        fontSize: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4
      }}
    >
      本月
    </button>
  </div>

  {/* 中间的周次显示 - 原来的内容 */}
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
  className="no-hover-effect"
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
    justifyContent: "center",
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


{/* 修改上方的日期显示区域 */}
{/* 修改上方的日期显示区域 */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
}}>
  {weekDates.map((d) => {
    const dateStr = d.date;
    const isSelected = dateStr === selectedDate;
    const dayTasks = tasksByDate[dateStr] || [];
    
    // 排除本周任务和未完成的常规任务
    const filteredTasks = dayTasks.filter(task => {
      if (task.category === "本周任务") return false; // 排除本周任务
      if (task.isRegularTask && !task.done) return false; // 排除未完成的常规任务
      return true; // 包含其他所有任务（已完成的任务、已完成的常规任务、其他分类的任务）
    });
    
    const totalCount = filteredTasks.length;
    const completedCount = filteredTasks.filter(task => task.done).length;
    const allDone = totalCount > 0 && completedCount === totalCount;
    const hasIncomplete = totalCount > 0 && completedCount < totalCount;
    
    // 获取当天的学习状态评分
    const dailyRating = dailyRatings[dateStr] || 0;
    
    // 根据评分设置背景颜色
    const getRatingColor = (rating) => {
      switch(rating) {
        case 5: return '#4CAF50'; // 很好 - 绿色
        case 4: return '#8BC34A'; // 好 - 浅绿
        case 3: return '#FFC107'; // 一般 - 黄色
        case 2: return '#FF9800'; // 较差 - 橙色
        case 1: return '#F44336'; // 差 - 红色
        default: return 'transparent'; // 未评分
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
          margin: "0 2px",
          fontSize: 12,
          cursor: "pointer",
          backgroundColor: isSelected ? "#fff9c4" : "transparent",
          color: isSelected ? "#000" : "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "20px",
          // 添加评分背景色 - 如果当天有评分
          background: dailyRating > 0 
            ? `linear-gradient(to bottom, ${isSelected ? '#fff9c4' : 'transparent'} 0%, ${isSelected ? '#fff9c4' : 'transparent'} 50%, ${getRatingColor(dailyRating)}20 100%)`
            : isSelected ? '#fff9c4' : 'transparent'
        }}
      >
        <div>{d.label}</div>
        <div style={{ fontSize: 10 }}>{d.date.slice(5)}</div>
        
        {/* 显示学习状态星星（1-5星） */}
        {dailyRating > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            marginTop: "2px",
            fontSize: "8px",
            color: "#FFB800"
          }}>
            {'⭐'.repeat(dailyRating)}
          </div>
        )}
        
        {/* 任务数量显示 - 只显示已计入统计的任务 */}
        {totalCount > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            marginTop: dailyRating > 0 ? "0px" : "4px"
          }}>
            {/* 圆点 */}
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: allDone ? "#4CAF50" : hasIncomplete ? "#f44336" : "#666"
            }} />
            
            {/* 任务数 - 显示已完成/总数 */}
            <span style={{
              fontSize: "9px",
              fontWeight: "bold",
              color: allDone ? "#4CAF50" : hasIncomplete ? "#f44336" : "#666"
            }}>
              {completedCount}/{totalCount}
            </span>
          </div>
        )}
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
      return sum + (task.timeSpent || 0);
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
      onDeleteImage={handleDeleteImage} 
      toggleDone={toggleDone}
      formatTimeNoSeconds={formatTimeNoSeconds}
      formatTimeWithSeconds={formatTimeWithSeconds}
      onMoveTask={moveTask}
      categories={categories}
   
      setShowMoveModal={setShowMoveModal}
      onUpdateProgress={handleUpdateProgress}
     
      onToggleSubTask={toggleSubTask} // 添加这行
 
    
      onEditSubTask={editSubTask}  // 添加这行 - 这里缺少了
    />
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
      return {
        date: dateObj.date,
        label: dateObj.label,
        reflection: reflection
      };
    })
    .filter(item => item.reflection.trim() !== ''); // 只显示有复盘的日期
  
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          
        </div>
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
                gap: 4
              }}>
                <span>{item.label}</span>
                <span style={{ fontSize: 12, color: "#666" }}>
                  ({item.date.slice(5)})
                </span>
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



    {/* 本周任务区域 - 只在有任务时显示 */}
{weekTasks.length > 0 && (
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
      <span>本周任务 ({weekTasks.filter(t => t.done).length}/{weekTasks.length})</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowWeekTaskModal(true);
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

    {!collapsedCategories["本周任务"] && (
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
            onDeleteImage={handleDeleteImage} 
            categories={categories}
            setShowMoveModal={setShowMoveModal}
            onUpdateProgress={handleUpdateProgress}
            onEditSubTask={editSubTask}
            onToggleSubTask={toggleSubTask}
          />
        ))}
      </ul>
    )}
  </div>
)}


{/* 常规任务区域 - 橙色背景 */}
<div style={{
  marginBottom: 8,
  borderRadius: 10,
  overflow: "hidden",
  border: "2px solid #FF9800", // 橙色边框
  backgroundColor: "#fff"
}}>
  <div
    onClick={() => setCollapsedCategories(prev => ({
      ...prev,
      "常规任务": !prev["常规任务"]
    }))}
    style={{
      backgroundColor: "#FF9800", // 橙色背景
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
      常规任务 (
      {(() => {
        // 获取今天的常规任务数量统计
        const regularTasks = (tasksByDate[selectedDate] || [])
          .filter(task => task.isRegularTask);
        const completedCount = regularTasks.filter(task => task.done).length;
        const totalCount = regularTasks.length;
        return `${completedCount}/${totalCount}`;
      })()}
      )
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowRegularInput(!showRegularInput);
          setShowRegularCategorySelect(false);
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

  {/* 添加任务输入框 */}
 {/* 添加任务输入框 */}
{showRegularInput && (
  <div ref={regularInputRef} style={{ 
    padding: "8px", 
    borderBottom: "1px solid #f0f0f0",
    position: "relative" 
  }}>
    {/* 添加关闭按钮 */}
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowRegularInput(false);
        setShowRegularCategorySelect(false);
      }}
      style={{
        position: "absolute",
        top: "2px",
        right: "2px",
        background: "transparent",
        border: "none",
        fontSize: "16px",
        cursor: "pointer",
        color: "#666",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        zIndex: 10
      }}
      title="关闭"
    >
      ×
    </button>

    <div style={{
      display: "flex",
      gap: 6,
      marginBottom: 8,
      paddingRight: "24px" // 为关闭按钮留出空间
    }}>
      <input
        type="text"
        value={newRegularTaskText}
        onChange={(e) => setNewRegularTaskText(e.target.value)}
        placeholder="输入常规任务"
        style={{
          flex: 1,
          padding: 6,
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: "14px"
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // 点击分类按钮时切换显示状态
          setShowRegularCategorySelect(!showRegularCategorySelect);
        }}
        style={{
          padding: "6px 10px",
          backgroundColor: "#FF9800",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          transition: "none",
          outline: "none"
        }}
      >
        分类
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleAddRegularTask();
        }}
        style={{
          padding: "6px 10px",
          backgroundColor: "#FF9800",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          transition: "none",
          outline: "none"
        }}
      >
        确认
      </button>
    </div>

    {/* 分类选择 - 始终显示，不再根据 showRegularCategorySelect 控制 */}
    <div 
      style={{
        padding: "8px",
        backgroundColor: "#f5f5f5",
        borderRadius: 6,
        marginTop: 4,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        willChange: "transform"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>
        选择任务完成后的分类:
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {categories.filter(c => c.name !== "常规任务" && c.name !== "本周任务").map((c) => (
          <button
            key={c.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setNewRegularTaskCategory(prevCategory => {
                if (prevCategory === c.name) {
                  return prevCategory;
                }
                return c.name;
              });
            }}
            style={{
              padding: "4px 8px",
              backgroundColor: newRegularTaskCategory === c.name ? c.color : "#f0f0f0",
              color: newRegularTaskCategory === c.name ? "#fff" : "#000",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              transition: "none",
              outline: "none",
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      
      {/* 如果选中了校内分类，显示子类别选择 */}
      {newRegularTaskCategory === '校内' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ 
            marginBottom: 6, 
            fontSize: 12, 
            color: "#666",
            borderTop: "1px solid #ddd",
            paddingTop: 8
          }}>
            选择子类别（可选）:
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {/* 先显示"无子类别"选项 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setNewTaskSubCategory('');
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: !newTaskSubCategory ? '#1a73e8' : '#f0f0f0',
                color: !newTaskSubCategory ? '#fff' : '#000',
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 11,
                transition: "none",
                outline: "none"
              }}
            >
              无子类别
            </button>
            
            {/* 显示所有子类别 */}
            {categories.find(c => c.name === '校内')?.subCategories?.map(subCat => (
              <button
                key={subCat}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNewTaskSubCategory(prev => 
                    prev === subCat ? '' : subCat
                  );
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: newTaskSubCategory === subCat ? '#1a73e8' : '#f0f0f0',
                  color: newTaskSubCategory === subCat ? '#fff' : '#000',
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  transition: "none",
                  outline: "none"
                }}
              >
                {subCat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}




  {/* 任务列表 - 不折叠时显示 */}
{!collapsedCategories["常规任务"] && (
  (() => {
    // 获取今天的常规任务
    const regularTasks = (tasksByDate[selectedDate] || [])
      .filter(task => task.isRegularTask)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.id - a.id;
      });
    
    // 如果没有常规任务，不渲染任何内容
    if (regularTasks.length === 0) {
      return null;
    }

    return (
      <ul style={{
        listStyle: "none",
        padding: 8,
        margin: 0
      }}>
        {regularTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onEditTime={editTaskTime}
            onEditNote={editTaskNote}
            onEditReflection={editTaskReflection}
            onOpenEditModal={openTaskEditModal}
            onShowImageModal={setShowImageModal}
            onDeleteImage={handleDeleteImage}
            toggleDone={toggleRegularTaskDone}
            formatTimeNoSeconds={formatTimeNoSeconds}
            formatTimeWithSeconds={formatTimeWithSeconds}
            onMoveTask={moveTask}
            categories={categories}
            setShowMoveModal={setShowMoveModal}
            onUpdateProgress={handleUpdateProgress}
            onEditSubTask={editSubTask}
            onToggleSubTask={toggleSubTask}
          />
        ))}
      </ul>
    );
  })()
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
    fontFamily: 'Calibri, "微软雅黑", sans-serif',  // ← 添加
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
    
   

   {/* 子类别管理按钮 - 仅校内类别显示 */}
{c.name === '校内' && (
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
)}
  </div>

  {/* 将计时器和时间显示移到右边 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {/* 分类计时器按钮 */}
   



{/* 时间显示 */}
<span
  onClick={(e) => {
    e.stopPropagation();
    editCategoryTime(c.name);
  }}
  style={{
    fontSize: 11,
    color: isComplete ? "#888" : "#fff",
    fontStyle: 'Calibri, "微软雅黑", sans-serif',  // ← 添加
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "rgba(255,255,255,0.2)",
    minWidth: "50px",
    maxWidth: "70px",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flexShrink: 0
  }}
  title="点击修改总时间"
>
  {formatCategoryTime(totalTime(c.name))}
</span>
  </div>
</div>

{!isCollapsed && (
  <div style={{ padding: 8 }}>
    {c.name === '校内' ? (
      // 校内类别：显示子类别分组
      (() => {
        const subCategoryTasks = getTasksBySubCategory(c.name);
        const subCategoryKeys = Object.keys(subCategoryTasks);
        
        return subCategoryKeys.map((subCat) => {
          const subCatTasks = subCategoryTasks[subCat];
          const subCatKey = `${c.name}_${subCat}`;
          const allDone = subCatTasks.length > 0 && subCatTasks.every(task => task.done);
          const isSubCollapsed = collapsedSubCategories[subCatKey] || false;
          
          const subCategoryTotalTime = subCatTasks.reduce((sum, task) => {
  return sum + (task.timeSpent || 0);
}, 0);
          
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
                  

                  <span
  onClick={(e) => {
    e.stopPropagation();
    // 修改这段代码 - 只接受分钟输入
    const newTime = window.prompt(
      `修改 ${subCat} 子类别总时间（单位：分钟，例如 30 表示30分钟）`,
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
                ? { ...t, timeSpent: (t.timeSpent || 0) + timePerTask }
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
    color: '#666',
    cursor: 'pointer',
    fontFamily: 'Calibri, "微软雅黑", sans-serif',
    padding: '2px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
    whiteSpace: 'nowrap'
  }}
  title="点击修改子类别总时间（单位：分钟）"
>
  {formatCategoryTime(subCategoryTotalTime)}
</span>
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
                    ))}
                </ul>
              )}
            </div>
          );
        });
      })()
    ) : (
      // 非校内类别：直接显示任务列表，不分组
      <ul style={{
        listStyle: "none",
        padding: 0,
        margin: 0
      }}>
        {getCategoryTasks(c.name)
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
          ))}
      </ul>
    )}
  </div>
)}
</div>
);
})}



{/* 主界面的复盘框 - 只保留学习状态评价 */}
{/* 主界面的复盘框 - 只显示评分，不可选择 */}
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
    
    {/* 复盘输入框 - 使用flex:1自动占据剩余空间 */}
    <div style={{ 
      flex: 1,
      minWidth: 0 // 允许内容收缩
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
          height: (() => {
            const reflection = getCurrentDailyReflection();
            const lineCount = reflection ? reflection.split('\n').length : 1;
            const charCount = reflection ? reflection.length : 0;
            
            if (lineCount === 1 && charCount <= 40) {
              return '28px';
            }
            return 'auto';
          })(),
          display: 'flex',
          alignItems: 'center',
          transition: 'height 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {getCurrentDailyReflection() || <span style={{ color: '#999' }}>点击添加复盘...</span>}
      </div>
    </div>

    {/* 右侧：显示评分，数字用黑色，星星用金色 */}
    <div style={{
      minWidth: '20px',
      flexShrink: 0,

      textAlign: 'center'
    }}>
      <span style={{
        fontSize: '12px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap'
      }}>
        <span style={{ color: '#333' }}>
          {getCurrentDailyRating() > 0 ? getCurrentDailyRating() : '0'}
        </span>
        <span style={{ color: '#FFB800' }}>⭐</span>
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
    <div style={{
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: 8,
      width: '90%',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '12px', 
        fontSize: '15px', 
        color: '#1a73e8',
        flexShrink: 0
      }}>
        今日复盘
      </h3>
      
      {/* 复盘输入框 */}
      <textarea
        value={getCurrentDailyReflection()}
        onChange={(e) => setCurrentDailyReflection(e.target.value)}
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

     

      {/* 评分选择 - 新增在这里 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          color: '#555', 
          fontSize: '13px',
          fontWeight: 'bold'
        }}>
          今日评价
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          justifyContent: 'space-between'
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.preventDefault();
                setCurrentDailyRating(star);
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 6,
                backgroundColor: getCurrentDailyRating() >= star ? '#ffe066' : '#f1f3f4',
                fontSize: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: getCurrentDailyRating() >= star ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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

      {/* 按钮区域 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        flexShrink: 0
      }}>
        <button
          onClick={() => setShowReflectionModal(false)}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#f0f0f0',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer',
            boxSizing: 'border-box'
          }}
        >
          取消
        </button>
        <button
          onClick={() => {
            saveDailyData(selectedDate);
            setShowReflectionModal(false);
          }}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer',
            boxSizing: 'border-box'
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
                fontSize: "14px"
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





{/* 子类别选择 - 仅校内类别显示 */}
{newTaskCategory === '校内' && categories.find(c => c.name === '校内')?.subCategories?.length > 0 && (
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
      {categories.find(c => c.name === '校内')?.subCategories?.map(subCat => (
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
    {
      label: "统计汇总",
      value: "",
      onClick: () => setShowStats(true),
      title: "查看详细统计"
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



   


{/* 底部按钮区域 - 修改后，完全禁用悬停效果 */}
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
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
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
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
  >
    导出数据
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
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
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

          if (!importedData.tasks || !importedData.version) {
            throw new Error('无效的数据文件格式');
          }

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
            
            await saveMainData('tasks', importedData.tasks || {});
            await saveMainData('templates', importedData.templates || []);
            await saveMainData('customAchievements', importedData.customAchievements || []);
            await saveMainData('unlockedAchievements', importedData.unlockedAchievements || []);
            await saveMainData('categories', importedData.categories || baseCategories);
            
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

  <button
    onClick={clearAllData}
    style={{
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      border: "none",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
  >
    清空数据
  </button>

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
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
  >
    备份管理
  </button>

  <button
    onClick={() => setShowGitHubSyncModal(true)}
    style={{
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      border: "none",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
  >
    同步设置
  </button>

  <button
    onClick={syncToGitHub}
    style={{
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      border: "none",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
  >
    立即同步
  </button>

  <button
    onClick={() => {
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
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      border: "none",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
    title="强制从云端恢复数据（覆盖本地）"
  >
    恢复云端
  </button>

  <button
    onClick={() => setShowCategoryManager(true)}
    style={{
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      border: "none",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      outline: "none",
      transition: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "none"
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
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = "#1a73e8";
      e.target.style.color = "#fff";
    }}
  >
    管理类别
  </button>
</div>

     
    </div>
  );
}


  
  
  export default App
