/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

/* eslint-disable react-hooks/exhaustive-deps */  // 添加这一行
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';



const GradeModal = ({ onClose, isVisible }) => {
  const STORAGE_KEY = 'study-tracker-PAGE_A-v2';
  const [grades, setGrades] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('数学');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSubCategoryManager, setShowSubCategoryManager] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  



  
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
  console.log('点击科目:', subject);
  setSelectedSubject(subject);
  setSelectedSubCategory(null);
  // 不需要强制重新渲染，状态改变会自动触发
};

const handleSubCategoryClick = (subCat) => {
  setSelectedSubCategory(subCat);
};

  // 获取当前科目下的所有子分类
  const getCurrentSubCategories = () => {
    return subjectSubCategories[selectedSubject] || [];
  };

  // 获取筛选后的成绩（根据选中的科目和子分类）
  const getFilteredGrades = () => {
    let filtered = grades.filter(grade => grade.subject === selectedSubject);
    
    if (selectedSubCategory) {
      filtered = filtered.filter(grade => grade.subCategory === selectedSubCategory);
    }
    
    return filtered;
  };

  // 生成图表数据（按日期排序）
  // 生成图表数据（按日期倒序排序 - 最新的在前面）
const getChartData = () => {
  const filtered = getFilteredGrades();
  
  // 按日期倒序排序（从新到旧）
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
    {/* 👇 把 style 标签放在这里 */}
<style>{`
  /* 完全禁用所有按钮的 hover 效果 */
  .grade-modal button:hover,
  .grade-modal button:active,
  .grade-modal button:focus,
  .grade-modal button:active:hover,
  .grade-modal button:focus:hover {
    background-color: inherit !important;
    opacity: 1 !important;
    transform: none !important;
    box-shadow: none !important;
    outline: none !important;
  }
  
  /* 添加新成绩按钮 - 始终保持蓝色 */
  .grade-modal button.add-grade-btn,
  .grade-modal button.add-grade-btn:hover,
  .grade-modal button.add-grade-btn:active,
  .grade-modal button.add-grade-btn:focus {
    background-color: #1a73e8 !important;
    color: white !important;
  }
  
  /* 管理子分类按钮 - 始终保持紫色 */
  .grade-modal button.manage-subcat-btn,
  .grade-modal button.manage-subcat-btn:hover,
  .grade-modal button.manage-subcat-btn:active,
  .grade-modal button.manage-subcat-btn:focus {
    background-color: #9C27B0 !important;
    color: white !important;
  }
  
  /* 科目按钮 - 选中状态保持蓝色 */
  .grade-modal button.subject-btn-selected,
  .grade-modal button.subject-btn-selected:hover,
  .grade-modal button.subject-btn-selected:active,
  .grade-modal button.subject-btn-selected:focus {
    background-color: #1a73e8 !important;
    color: white !important;
  }
  
  /* 科目按钮 - 未选中状态保持灰色 */
  .grade-modal button.subject-btn-unselected,
  .grade-modal button.subject-btn-unselected:hover,
  .grade-modal button.subject-btn-unselected:active,
  .grade-modal button.subject-btn-unselected:focus {
    background-color: #f0f0f0 !important;
    color: #333 !important;
  }
  
  /* 子分类按钮 - 选中状态保持蓝色 */
  .grade-modal button.subcat-btn-selected,
  .grade-modal button.subcat-btn-selected:hover,
  .grade-modal button.subcat-btn-selected:active,
  .grade-modal button.subcat-btn-selected:focus {
    background-color: #1a73e8 !important;
    color: white !important;
  }
  
  /* 子分类按钮 - 未选中状态保持灰色 */
  .grade-modal button.subcat-btn-unselected,
  .grade-modal button.subcat-btn-unselected:hover,
  .grade-modal button.subcat-btn-unselected:active,
  .grade-modal button.subcat-btn-unselected:focus {
    background-color: #f0f0f0 !important;
    color: #333 !important;
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


        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 10,
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#1a73e8',
          fontSize: '20px',
          padding: '0 40px',
          marginTop: '10px'
        }}>
          成绩记录
        </h2>

        {/* 顶部按钮区域 */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px'
        }}>
  {/* 添加新成绩按钮 */}
<button
  className="add-grade-btn"
  onClick={() => {
    setShowAddForm(!showAddForm);
    if (!showAddForm) {
      resetNewGradeForm();
      setEditingGrade(null);
    }
  }}
  style={{
    flex: 1,
    padding: '10px 12px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  }}
>
  {showAddForm ? '取消添加' : '+ 添加新成绩'}
</button>

{/* 管理子分类按钮 */}
<button
  className="manage-subcat-btn"
  onClick={() => setShowSubCategoryManager(!showSubCategoryManager)}
  style={{
    flex: 1,
    padding: '10px 12px',
    backgroundColor: '#9C27B0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  }}
>
  {showSubCategoryManager ? '关闭管理' : '管理子分类'}
</button>
        </div>

      
<div style={{
  display: 'flex',
  gap: '12px',
  marginBottom: '20px',
  justifyContent: 'center'
}}>
  {mainSubjects.map(subject => (
    <button
      key={subject}
      className={selectedSubject === subject ? 'subject-btn-selected' : 'subject-btn-unselected'}
      onClick={() => handleSubjectClick(subject)}
      style={{
        flex: 1,
        padding: '8px 12px',
        backgroundColor: selectedSubject === subject ? '#1a73e8' : '#f0f0f0',
        color: selectedSubject === subject ? 'white' : '#333',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {subject}
    </button>
  ))}
</div>


{currentSubCategories.length > 0 && (
  <div style={{
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }}>
    <button
      className={selectedSubCategory === null ? 'subcat-btn-selected' : 'subcat-btn-unselected'}
      onClick={() => handleSubCategoryClick(null)}
      style={{
        padding: '6px 14px',
        backgroundColor: selectedSubCategory === null ? '#1a73e8' : '#f0f0f0',
        color: selectedSubCategory === null ? 'white' : '#333',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '13px',
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
          padding: '6px 14px',
          backgroundColor: selectedSubCategory === subCat ? '#1a73e8' : '#f0f0f0',
          color: selectedSubCategory === subCat ? 'white' : '#333',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '13px',
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
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>测试次数</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a73e8' }}>{stats.count}</div>
          </div>
          
          <div style={{
  padding: '12px',
  backgroundColor: 'white',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  textAlign: 'center'
}}>
  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>平均分</div>
  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.avgScore}</div>
</div>
          
          <div style={{
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>满分次数</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{stats.fullMarks}</div>
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
              {chartData.map((item, index) => {
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
                    {/* 左侧标签区域 */}
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
                    
                    {/* 柱状图区域 */}
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

            {/* 图例说明 */}
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

        {/* 成绩记录列表 */}
        <div>
          <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>
            成绩记录列表
            {selectedSubCategory && (
              <span style={{ 
                fontSize: '12px', 
                color: '#666', 
                fontWeight: 'normal',
                marginLeft: '8px'
              }}>
                ({selectedSubject} - {selectedSubCategory})
              </span>
            )}
          </h3>

          {getFilteredGrades().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              暂无成绩记录
            </div>
          ) : (
            <div style={{
              maxHeight: '400px',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              {[...getFilteredGrades()]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((grade) => (
                  <div
                    key={grade.id}
                    style={{
                      padding: '15px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      backgroundColor: grade.isFullMark ? '#f6fbf6' : '#fff'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
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
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexShrink: 0
                      }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: grade.isFullMark ? '#4caf50' : '#1a73e8'
                        }}>
                          {getScoreDisplay(grade)}
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
                      </div>
                    </div>

                    <div style={{
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#666',
                      paddingLeft: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {grade.testContent}
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginLeft: '12px'
                      }}>
                        <button
                          onClick={() => handleEditGrade(grade)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0',
                            lineHeight: '1'
                          }}
                          title="编辑"
                        >
                          ✎
                        </button>

                        <button
                          onClick={() => handleDeleteGrade(grade.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#bbb',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '0',
                            lineHeight: '1'
                          }}
                          title="删除"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {grade.wrongQuestions && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginBottom: '5px'
                        }}>
                          错题分析:
                        </div>
                        <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                          {grade.wrongQuestions}
                        </div>
                      </div>
                    )}

                    {grade.analysis && (
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginBottom: '5px'
                        }}>
                          总结改进:
                        </div>
                        <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                          {grade.analysis}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 添加/编辑成绩表单弹窗 - 保持原有代码不变 */}
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
                color: '#1a73e8',
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
                {/* 日期 */}
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
               
                {/* 科目和子分类 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 12
                }}>
                  {/* 科目 */}
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

                  {/* 子分类 */}
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

                {/* 测试内容 */}
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

                {/* 分数类型、得分、满分 */}
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

                
                {/* 错题分析 */}
<div>
  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
    错题分析
  </label>
  <textarea
    value={newGrade.wrongQuestions}
    onChange={(e) => {
      setNewGrade({...newGrade, wrongQuestions: e.target.value});
      // 自动调整高度
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    placeholder="记录错题内容和原因分析"
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

              {/* 总结与改进 */}
<div>
  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
    总结与改进
  </label>
  <textarea
    value={newGrade.analysis}
    onChange={(e) => {
      setNewGrade({...newGrade, analysis: e.target.value});
      // 自动调整高度
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    placeholder="总结经验教训和改进计划"
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
                      backgroundColor: '#1a73e8',
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

        {/* 子分类管理弹窗 - 保持原有代码不变 */}
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
                color: '#9C27B0',
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
                  onChange={(e) => setSelectedSubject(e.target.value)}
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
                  <div style={{ marginBottom: '20px' }}>
                    <button
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
                      {(subjectSubCategories[selectedSubject] || []).length === 0 ? (
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
                        (subjectSubCategories[selectedSubject] || []).map(subCat => (
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
                              <button
                                onClick={() => {
                                  const newSubCat = window.prompt(`编辑子分类 "${subCat}" 的新名称:`, subCat);
                                  if (newSubCat && newSubCat.trim() && newSubCat.trim() !== subCat) {
                                    const trimmedNew = newSubCat.trim();
                                    if (subjectSubCategories[selectedSubject].includes(trimmedNew)) {
                                      alert('该子分类名称已存在！');
                                      return;
                                    }
                                    setSubjectSubCategories(prev => ({
                                      ...prev,
                                      [selectedSubject]: prev[selectedSubject].map(s => 
                                        s === subCat ? trimmedNew : s
                                      )
                                    }));
                                    
                                    // 更新该子分类下的所有成绩记录
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
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`确定要删除子分类 "${subCat}" 吗？`)) {
                                    setSubjectSubCategories(prev => ({
                                      ...prev,
                                      [selectedSubject]: prev[selectedSubject].filter(s => s !== subCat)
                                    }));
                                    
                                    // 删除该子分类下的所有成绩记录
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
      </div>
    </div>
  );
};





// 重命名文件顶部的 categories 为 baseCategories
// 修改 baseCategories 的颜色
const baseCategories = [
  { 
    name: "校内", 
    color: "#1a73e8",  // 保持蓝色不变
    subCategories: ["数学", "语文", "英语", "运动"]
  },
  { name: "语文", color: "#FFFDE7", textColor: "#333" },
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
    console.log(`数据保存成功: ${key}`, data ? '有数据' : '无数据');
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
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
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
    
    console.log('📊 备份数据统计:', {
      任务天数: Object.keys(currentTasks).length,
      模板数量: currentTemplates.length,
      本月任务: currentMonthTasks.length,
      复盘天数: Object.keys(allDailyReflections).length
    });
    
    const backupData = {
      tasks: currentTasks,
      templates: currentTemplates,
      categories: currentCategories,
      monthTasks: currentMonthTasks,
      grades: currentGrades,
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

// ========== 在这里添加 DailyLogModal 组件 ==========
const DailyLogModal = ({ onClose, onCopy, dailyRating, dailyReflection, tasksByDate, selectedDate }) => {
  // 实时从 tasksByDate 和 selectedDate 生成日志内容
  const generateRealTimeContent = useCallback(() => {
    const dayTasks = (tasksByDate && tasksByDate[selectedDate]) || [];
    
    // 只显示已完成的任务（包括从常规任务完成的）
    const completedTasks = dayTasks.filter(task => {
      if (task.isRegularTask && !task.done) return false;
      if (task.category === "本周任务") return false;
      return task.done === true;
    });
    
    // 未完成的任务只显示校内分类的
    const incompleteTasks = dayTasks.filter(task => {
      if (task.isRegularTask) return false;
      if (task.category === "本周任务") return false;
      return !task.done && task.category === "校内";
    });
    
    // 按分类和子分类组织任务
    const tasksByCategory = {};
    
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
    
    let logContent = ``;
    let markdownContent = `# 学习任务\n\n`;
    
    Object.entries(tasksByCategory).forEach(([category, categoryData]) => {
      logContent += `${category}\n`;
      markdownContent += `## ${category}\n`;
      
      if (categoryData.withoutSubCategories.length > 0) {
        categoryData.withoutSubCategories.forEach((task) => {
          const minutes = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
          const timeText = minutes > 0 ? `【${minutes}m】` : "";
          
          if (task.isCompleted) {
            logContent += `  ✔️ ${task.text}${timeText}\n`;
            markdownContent += `- [x] ${task.text}${timeText}\n`;
          } else {
            logContent += `  ❌ ${task.text}${timeText}\n`;
            markdownContent += `- [ ] ${task.text}${timeText}\n`;
          }
        });
      }
      
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
            logContent += `    ✔️ ${task.text}${timeText}\n`;
            markdownContent += `- [x] ${task.text}${timeText}\n`;
          } else {
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
    
    const totalTasksCount = completedTasks.length + incompleteTasks.length;
    
    markdownContent += `# 学习统计\n`;
    markdownContent += `- 完成任务: ${completedTasks.length} 个\n`;
    markdownContent += `- 未完成任务: ${incompleteTasks.length} 个\n`;
    markdownContent += `- 总任务数: ${totalTasksCount} 个\n`;
    markdownContent += `- 完成率: ${totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0}%\n`;
    markdownContent += `- 学习时长: ${totalMinutes} 分钟\n`;
    markdownContent += `- 平均每项: ${completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0} 分钟`;
    
    const newStats = {
      completedTasks: completedTasks.length,
      incompleteTasks: incompleteTasks.length,
      totalTasks: totalTasksCount,
      completionRate: totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0,
      totalMinutes: totalMinutes,
      averagePerTask: completedTasks.length > 0 ? Math.round(totalMinutes / completedTasks.length) : 0,
      categories: Object.keys(tasksByCategory).length
    };
    
    return { logContent, markdownContent, newStats };
  }, [tasksByDate, selectedDate]);
  
  const [currentContent, setCurrentContent] = useState(() => generateRealTimeContent());
  
  useEffect(() => {
    setCurrentContent(generateRealTimeContent());
  }, [tasksByDate, selectedDate, generateRealTimeContent]);
  
  const totalHours = (currentContent.newStats.totalMinutes / 60).toFixed(1);
  
  const generateMarkdownContent = () => {
    let markdown = `# 学习任务\n\n`;
    
    if (dailyRating > 0 || dailyReflection) {
      markdown += "## 💭 今日总结\n\n";
      if (dailyRating > 0) {
        markdown += `- **评分**: ${'⭐'.repeat(dailyRating)} (${dailyRating}/5)\n`;
      }
      if (dailyReflection) {
        markdown += `- **复盘**: ${dailyReflection}\n`;
      }
      markdown += "\n";
    }
    
    markdown += currentContent.markdownContent.replace('# 学习任务\n\n', '');
    return markdown;
  };
  
  const markdownContent = generateMarkdownContent();
  
  const handleCopy = () => {
    onCopy(markdownContent);
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
          📅 {selectedDate} 学习汇总
        </h3>
        
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
              {currentContent.newStats.completedTasks} 个
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
              {currentContent.newStats.totalTasks} 个
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
              {currentContent.newStats.completionRate}%
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
          {(dailyRating > 0 || dailyReflection) && (
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
              
              {dailyRating > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 'bold' }}>评分: </span>
                  {'⭐'.repeat(dailyRating)} ({dailyRating}/5)
                </div>
              )}
              
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
          
          {currentContent.logContent.split('\n').map((line, index) => {
            const isIncompleteTask = line.includes('❌');
            return (
              <div
                key={index}
                style={{
                  color: isIncompleteTask ? '#999' : '#000',
                  filter: isIncompleteTask ? 'grayscale(100%) opacity(0.6)' : 'none',
                  backgroundColor: 'transparent',
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
        
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, color: '#555', textAlign: 'left' }}>评价：</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: 'none',
                    borderRadius: 6,
                    backgroundColor: (dailyRating || 0) >= star ? '#ffe066' : '#f1f3f4',
                    fontSize: 18,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
// ========== DailyLogModal 组件结束 ==========







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
  const [showMoreConfig, setShowMoreConfig] = useState(false);
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
            color: "#1a73e8",
            fontSize: 18,
            fontWeight: "600"
          }}>
            {editingTemplateIndex !== null ? '编辑模板' : '新建模板'}
          </h3>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
                fontWeight: "600"
              }}
            >
              {editingTemplateIndex !== null ? '更新' : '保存'}
            </button>

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
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
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
                height: '44px',
                minHeight: '44px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.4'
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
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                height: '44px',
                minHeight: '44px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.4'
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
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>初始值</div>
                <input
                  type="number"
                  value={formData.progress?.initial || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    progress: { ...formData.progress, initial: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }
                  })}
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
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>当前值</div>
                <input
                  type="number"
                  value={formData.progress?.current || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    progress: { ...formData.progress, current: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }
                  })}
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
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>目标值</div>
                <input
                  type="number"
                  value={formData.progress?.target || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    progress: { ...formData.progress, target: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }
                  })}
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
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'center' }}>单位</div>
                <select
                  value={formData.progress?.unit || '%'}
                  onChange={(e) => setFormData({
                    ...formData,
                    progress: { ...formData.progress, unit: e.target.value }
                  })}
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

          {/* 更多配置按钮 */}
          <div
            onClick={() => setShowMoreConfig(!showMoreConfig)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: 8,
              cursor: 'pointer',
              marginTop: 8,
              userSelect: 'none'
            }}
          >
            <span style={{ fontSize: 14, color: '#333' }}>
              {showMoreConfig ? '▼ 收起更多配置' : '▶ 更多配置'}
            </span>
          </div>

          {/* 更多配置内容 */}
          {showMoreConfig && (
            <div>
              {/* 标签编辑 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#333', fontSize: 13 }}>
                      添加标签
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="标签名称"
                        value={formData.newTagName}
                        onChange={(e) => setFormData({ ...formData, newTagName: e.target.value })}
                        style={{
                          flex: 1,
                          height: 32,
                          padding: '0 8px',
                          border: '1px solid #ccc',
                          borderRadius: 6,
                          fontSize: 13,
                          backgroundColor: '#fff',
                          boxSizing: 'border-box',
                        }}
                      />
                      <input
                        type="color"
                        value={formData.newTagColor}
                        onChange={(e) => setFormData({ ...formData, newTagColor: e.target.value })}
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
                          if (formData.newTagName?.trim()) {
                            const newTag = {
                              name: formData.newTagName.trim(),
                              color: formData.newTagColor,
                              textColor: '#fff',
                            };
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, newTag],
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

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#333', fontSize: 13 }}>
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
                    }}>
                      {formData.tags.map((tag, index) => (
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
                          }}
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = [...formData.tags];
                              newTags.splice(index, 1);
                              setFormData({ ...formData, tags: newTags });
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
                      {formData.tags.length === 0 && (
                        <span style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>暂无标签</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 常用标签 */}
              <div style={{ marginBottom: 15 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>常用标签:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {commonTags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const isAlreadyAdded = formData.tags.some(t => t.name === tag.name);
                        if (!isAlreadyAdded) {
                          setFormData({ ...formData, tags: [...formData.tags, tag] });
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
                <label style={{ display: 'block', marginTop: 8, marginBottom: 8, fontWeight: '600', color: '#333', fontSize: 14 }}>
                  🔄 重复设置
                </label>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: formData.repeatFrequency === 'daily' ? '#1a73e8' : '#f0f0f0',
                        color: formData.repeatFrequency === 'daily' ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                      onClick={() => setFormData({ ...formData, repeatFrequency: 'daily' })}
                    >
                      每天
                    </button>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: formData.repeatFrequency === 'weekly' ? '#1a73e8' : '#f0f0f0',
                        color: formData.repeatFrequency === 'weekly' ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                      onClick={() => setFormData({ ...formData, repeatFrequency: 'weekly' })}
                    >
                      每周
                    </button>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: !formData.repeatFrequency ? '#1a73e8' : '#f0f0f0',
                        color: !formData.repeatFrequency ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                      onClick={() => setFormData({ ...formData, repeatFrequency: '' })}
                    >
                      不重复
                    </button>
                  </div>
                </div>

                {formData.repeatFrequency === 'weekly' && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ marginBottom: 6, fontWeight: '500', fontSize: 13 }}>选择星期:</div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      gap: 4,
                      justifyContent: 'space-between',
                    }}>
                      {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: formData.repeatDays[index] ? '#1a73e8' : '#f0f0f0',
                            color: formData.repeatDays[index] ? '#fff' : '#000',
                            border: formData.repeatDays[index] ? '2px solid #0b52b0' : '1px solid #e0e0e0',
                            fontSize: 12,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          onClick={() => {
                            const newRepeatDays = [...formData.repeatDays];
                            newRepeatDays[index] = !newRepeatDays[index];
                            setFormData({ ...formData, repeatDays: newRepeatDays });
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.repeatFrequency && (
                  <div style={{
                    fontSize: 11,
                    color: '#666',
                    textAlign: 'center',
                    padding: '6px 8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4
                  }}>
                    {formData.repeatFrequency === 'daily' 
                      ? '任务将在未来7天重复创建' 
                      : formData.repeatFrequency === 'weekly' && formData.repeatDays.some(day => day)
                        ? `已选择：${formData.repeatDays.map((selected, idx) => selected ? `周${['一','二','三','四','五','六','日'][idx]}` : '').filter(Boolean).join('、')}`
                        : '请选择重复的星期'
                    }
                  </div>
                )}
              </div>

              {/* 计划时间 */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#333', fontSize: 14 }}>
                  ⏰ 计划时间
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="时"
                      value={formData.startHour}
                      onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
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
                      value={formData.startMinute}
                      onChange={(e) => setFormData({ ...formData, startMinute: e.target.value })}
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
                  <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="时"
                      value={formData.endHour}
                      onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
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
                      value={formData.endMinute}
                      onChange={(e) => setFormData({ ...formData, endMinute: e.target.value })}
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
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        startHour: '',
                        startMinute: '',
                        endHour: '',
                        endMinute: '',
                        scheduledTime: ''
                      });
                    }}
                    style={{
                      height: 36,
                      padding: '0 12px',
                      backgroundColor: '#f0f0f0',
                      color: '#666',
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    取消
                  </button>
                </div>
                {formData.startHour && formData.startMinute && formData.endHour && formData.endMinute && (
                  <div style={{
                    fontSize: 12,
                    color: '#28a745',
                    textAlign: 'center',
                    marginTop: 6,
                    padding: 4,
                    backgroundColor: '#e8f5e8',
                    borderRadius: 4
                  }}>
                    计划时间: {formData.startHour}:{formData.startMinute} - {formData.endHour}:{formData.endMinute}
                  </div>
                )}
              </div>

              {/* 提醒时间 */}
              <div>
                <label style={{ display: 'block', marginTop: 8, marginBottom: 8, fontWeight: '600', color: '#333', fontSize: 14 }}>
                  🔔 提醒时间
                </label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap', width: '100%' }}>
                  <input
                    type="number"
                    min="2024"
                    max="2030"
                    placeholder="年"
                    value={formData.reminderYear}
                    onChange={(e) => setFormData({ ...formData, reminderYear: e.target.value })}
                    style={{ flex: 1.2, minWidth: '60px', height: 36, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, textAlign: 'center', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  />
                  <span style={{ color: '#666', fontSize: 14, flexShrink: 0 }}>/</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="月"
                    value={formData.reminderMonth}
                    onChange={(e) => setFormData({ ...formData, reminderMonth: e.target.value })}
                    style={{ flex: 1, minWidth: '45px', height: 36, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, textAlign: 'center', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  />
                  <span style={{ color: '#666', fontSize: 14, flexShrink: 0 }}>/</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="日"
                    value={formData.reminderDay}
                    onChange={(e) => setFormData({ ...formData, reminderDay: e.target.value })}
                    style={{ flex: 1, minWidth: '45px', height: 36, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, textAlign: 'center', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="23"
                    placeholder="时"
                    value={formData.reminderHour}
                    onChange={(e) => setFormData({ ...formData, reminderHour: e.target.value })}
                    style={{ flex: 1, minWidth: '45px', height: 36, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, textAlign: 'center', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  />
                  <span style={{ color: '#666', fontSize: 14, flexShrink: 0 }}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="分"
                    value={formData.reminderMinute}
                    onChange={(e) => setFormData({ ...formData, reminderMinute: e.target.value })}
                    style={{ flex: 1, minWidth: '45px', height: 36, padding: '0 4px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, textAlign: 'center', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        reminderYear: '',
                        reminderMonth: '',
                        reminderDay: '',
                        reminderHour: '',
                        reminderMinute: ''
                      });
                    }}
                    style={{
                      height: 36,
                      padding: '0 12px',
                      backgroundColor: '#f0f0f0',
                      color: '#666',
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>

              {/* 子任务 */}
              <div>
                <label style={{ display: 'block', marginTop: 8, marginBottom: 8, fontWeight: '600', color: '#333', fontSize: 14 }}>
                  📋 子任务
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="输入子任务内容"
                    value={formData.newSubTask}
                    onChange={(e) => setFormData({ ...formData, newSubTask: e.target.value })}
                    style={{ flex: 1, height: 36, padding: '0 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={() => {
                      if (formData.newSubTask?.trim()) {
                        setFormData({
                          ...formData,
                          subTasks: [...formData.subTasks, { text: formData.newSubTask.trim(), done: false }],
                          newSubTask: ''
                        });
                      }
                    }}
                    style={{ height: 36, width: 36, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
                {formData.subTasks.length > 0 && (
                  <div>
                    {formData.subTasks.map((subTask, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <input type="checkbox" checked={subTask.done} onChange={(e) => {
                          const newSubTasks = [...formData.subTasks];
                          newSubTasks[index] = { ...newSubTasks[index], done: e.target.checked };
                          setFormData({ ...formData, subTasks: newSubTasks });
                        }} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                        <input
                          type="text"
                          value={subTask.text}
                          onChange={(e) => {
                            const newSubTasks = [...formData.subTasks];
                            newSubTasks[index] = { ...newSubTasks[index], text: e.target.value };
                            setFormData({ ...formData, subTasks: newSubTasks });
                          }}
                          style={{ flex: 1, height: 36, padding: '0 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' }}
                        />
                        <button onClick={() => {
                          setFormData({ ...formData, subTasks: formData.subTasks.filter((_, i) => i !== index) });
                        }} style={{ height: 36, width: 48, backgroundColor: '#f9f9f9', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
  <span style={{ fontWeight: '600', fontSize: '13px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            {templates.length > 0 && (
              <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'center', padding: '4px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                💡 点击模板可编辑内容
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


// 本周任务添加模态框
const WeekTaskModal = ({ onClose, onAdd, categories }) => {
  const [taskText, setTaskText] = useState('');
  const [targetCategory, setTargetCategory] = useState('校内');
  const [targetSubCategory, setTargetSubCategory] = useState('');

  const handleAdd = () => {
    if (taskText.trim()) {
      onAdd(taskText.trim(), targetCategory, targetSubCategory);
      onClose();
    }
  };

  // 获取校内子分类
  const schoolCategory = categories?.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];

  // 过滤掉常规任务和本周任务本身
  const availableCategories = (categories || []).filter(c => 
    c.name !== "常规任务" && c.name !== "本周任务"
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
          color: '#87CEEB',
          fontSize: 18
        }}>
          📅 添加本周任务
        </h3>
        
        {/* 任务内容输入 */}
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

        {/* 分类选择 */}
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

        {/* 子分类选择 - 仅当选择"校内"时显示 */}
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

       

        {/* 按钮区域 */}
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
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#87CEEB',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
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

  // 在 MonthTaskPage 组件内部，找到其他函数定义的位置，添加这个函数
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

  // 重置表单
  setNewTaskText('');
  setSelectedCategory('校内');
  setSelectedSubCategory('');
  setDeadline('');
  setTarget(100);
  setUnit('%');
  setShowAddForm(false);
};

  const categories = ['校内', '语文', '数学', '英语', '科学', '运动', '其他'];
  const subCategories = ['数学', '语文', '英语', '运动'];



  

  // ========== 计算函数 ==========
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

  // ========== 事件处理函数 ==========

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

  // ========== JSX 渲染 ==========
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

          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#FF9800', fontSize: '18px' }}>
            📅 本月任务 ({tasks.length})
          </h2>

          {/* 进度条 */}
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '10px', height: '20px', marginBottom: '20px', overflow: 'hidden' }}>
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

          {/* 添加任务表单 */}
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
                  <option value="%">%</option>
                  <option value="页">页</option>
                  <option value="章">章</option>
                  <option value="题">题</option>
                </select>
              </div>

              <button
                onClick={handleAddTask}
                style={{ width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                确认添加
              </button>
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
                        <button onClick={() => startEditTask(task)} style={{ background: 'transparent', border: 'none', color: '#FF9800', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => handleDelete(task)} style={{ background: 'transparent', border: 'none', color: '#f44336', cursor: 'pointer' }}>🗑️</button>
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
                      <button onClick={() => handleProgressUpdate(task.id, Math.max(0, task.progress - 1))} style={{ padding: '8px 4px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }}>-1</button>
                      <button onClick={() => handleProgressUpdate(task.id, Math.min(task.target, task.progress + 1))} style={{ padding: '8px 4px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }}>+1</button>
                      <button onClick={() => handleProgressUpdate(task.id, task.target)} style={{ padding: '8px 4px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#e8f5e8', cursor: 'pointer', color: '#4CAF50', fontWeight: '500' }}>完成</button>
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

      {/* 编辑任务模态框 - 关键修复点：这里必须使用 editFormData.category，不能使用 selectedCategory */}
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

            {/* ⚠️ 重要：这里必须使用 editFormData.category，不能使用 selectedCategory */}
            <select
              value={editFormData.category}
              onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* ⚠️ 重要：这里必须使用 editFormData.category，不能使用 selectedCategory */}
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
                <option value="%">%</option>
                <option value="页">页</option>
                <option value="章">章</option>
                <option value="题">题</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={cancelEdit} style={{ flex: 1, padding: '10px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
              <button onClick={saveEditTask} style={{ flex: 1, padding: '10px', backgroundColor: '#FF9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
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
const TaskEditModal = ({ task, categories, setShowCrossDateModal, setShowMoveTaskModal, onClose, onSave, onTogglePinned, onImageUpload, setShowDeleteModal, setCategories }) => {
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
                width: '32px',
                height: '32px',
                padding: 0,
                backgroundColor: editData.pinned ? '#ffcc00' : '#f8f9fa',
                color: editData.pinned ? '#000' : '#666',
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "16px",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title={editData.pinned ? "取消置顶" : "置顶任务"}
            >
              {editData.pinned ? '🔝' : '📌'}
            </button>

            <button
              onClick={handleDelete}
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
              title="删除任务"
            >
              ❌
            </button>

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
                fontSize: "18px",
                cursor: "pointer",
                color: "#666",
                width: "24px",
                height: "24px",
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
         
          {/* 任务内容 */}
{/* 在 TaskEditModal 组件中，找到备注字段的位置，在它之前添加： */}

{/* 任务内容 - 添加这个字段 */}
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
      height: '44px',
      minHeight: '44px',
      resize: 'vertical',
      outline: 'none',
      lineHeight: '1.4'
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

{/* 备注字段保持原样放在后面 */}


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
      height: '44px',
      minHeight: '44px',
      resize: 'vertical',
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
      if (editData.note.split('\n').length <= 1) {
        e.target.style.height = '44px';
      }
    }}
    onInput={(e) => {
      const newText = e.target.value;
      const lineCount = newText.split('\n').length;
      if (lineCount > 1) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      } else {
        e.target.style.height = '44px';
      }
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
      height: '44px',
      minHeight: '44px',
      resize: 'vertical',
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
      e.target.style.backgroundColor = '#fff9c4';
      if (editData.reflection.split('\n').length <= 1) {
        e.target.style.height = '44px';
      }
    }}
    onInput={(e) => {
      const newText = e.target.value;
      const lineCount = newText.split('\n').length;
      if (lineCount > 1) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      } else {
        e.target.style.height = '44px';
      }
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
          {(categories.find((c) => c.name === '校内')?.subCategories || []).map((subCat) => (
            <option key={subCat} value={subCat}>
              {subCat}
            </option>
          ))}
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
              
              setCategories(updatedCategories);
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

          {/* 更多配置按钮 */}
          <div
            onClick={() => setShowMoreConfig(!showMoreConfig)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: 8,
              cursor: 'pointer',
              marginTop: 8,
              userSelect: 'none'
            }}
          >
            <span style={{ fontSize: 14, color: '#333' }}>
              {showMoreConfig ? '▼ 收起更多配置' : '▶ 更多配置'}
            </span>
          </div>

          {/* 更多配置内容 - 点击后展开 */}
          {showMoreConfig && (
            <div>
              {/* 编辑任务界面 - 标签编辑 - 合并成一排 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 12,
              }}>
                <div style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  width: '100%'
                }}>
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
                      maxHeight: 40,
                      overflow: 'hidden',
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
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  }}>
    🔄 重复设置
  </label>
  
  {/* 重复频率按钮 - 删除了"重复频率"标签 */}
  <div style={{ marginBottom: 10 }}>
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

  {/* 星期选择 */}
  {editData.repeatFrequency === 'weekly' && (
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
              background: editData.repeatDays?.[index] ? '#1a73e8' : '#f0f0f0',
              color: editData.repeatDays?.[index] ? '#fff' : '#000',
              border: editData.repeatDays?.[index] ? '2px solid #0b52b0' : '1px solid #e0e0e0',
              fontSize: 12,
              cursor: 'pointer',
              flexShrink: 0
            }}
            onClick={() => {
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
            {day}
          </button>
        ))}
      </div>
    </div>
  )}

  {/* 说明文字 */}
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

    {/* 👇 添加取消计划时间按钮 */}
    <button
      type="button"
      onClick={() => {
        setEditData({
          ...editData,
          startHour: '',
          startMinute: '',
          endHour: '',
          endMinute: '',
          scheduledTime: ''
        });
      }}
      style={{
        height: 36,
        padding: '0 12px',
        backgroundColor: '#f0f0f0',
        color: '#666',
        border: '1px solid #ccc',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
      title="取消计划时间"
    >
      取消
    </button>
  </div>

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
      marginTop: 8,
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
      gap: 4,
      alignItems: 'center',
      flexWrap: 'nowrap',
      width: '100%',
    }}
  >
    {/* 年份 */}
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
        flex: 1.2,
        minWidth: '60px',
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

    <span style={{ color: '#666', fontSize: 14, flexShrink: 0 }}>/</span>

    {/* 月份 */}
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
        minWidth: '45px',
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

    <span style={{ color: '#666', fontSize: 14, flexShrink: 0 }}>/</span>

    {/* 日 */}
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
        minWidth: '45px',
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

    <span style={{ color: '#666', marginLeft: '2px', flexShrink: 0 }}> </span>

    {/* 时 */}
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
        minWidth: '45px',
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

    <span style={{ color: '#666', fontSize: 14, flexShrink: 0 }}>:</span>

    {/* 分 */}
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
        minWidth: '45px',
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

    {/* 👇 添加取消提醒时间按钮 */}
   <button
  type="button"
  onClick={() => {
    setEditData({
      ...editData,
      reminderYear: '',
      reminderMonth: '',
      reminderDay: '',
      reminderHour: '',
      reminderMinute: ''
    });
  }}
  style={{
    height: 36,
    padding: '0 12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: '1px solid #ccc',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap',
    flexShrink: 0
  }}
  title="取消提醒时间"
>
  取消
</button>
  </div>
</div>

              {/* 📋 子任务编辑 */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginTop: 8,
                    marginBottom: 8,
                    fontWeight: 600,
                    color: '#333',
                    fontSize: 14,
                  }}
                >
                  📋 子任务
                </label>

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
            </div>
          )}

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
  onEditNote,
  onEditReflection,
  onOpenEditModal,
  onShowImageModal,
  showCategoryTag = false,
  formatTimeNoSeconds,
  toggleDone,
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
  isSortingMode = false  // 新增参数：排序模式下隐藏删除按钮
}) => {
  const [editingSubTaskIndex, setEditingSubTaskIndex] = useState(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [showProgressControls, setShowProgressControls] = useState(false);
  const [editingSubTaskNoteIndex, setEditingSubTaskNoteIndex] = useState(null);

  // 处理进度调整
  const handleProgressAdjust = (increment) => {
    const currentValue = Number(task.progress?.current) || 0;
    const targetValue = Number(task.progress?.target) || 100;
    const newCurrent = Math.min(Math.max(0, currentValue + increment), targetValue);
    
    if (onUpdateProgress) {
      onUpdateProgress(task, newCurrent);
    }
  };

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


    // TaskItem 组件 - 修复高度中心对齐
<li
  className="task-item"
  style={{
    position: "relative",
      background: "transparent",        // 透明背景
    borderRadius: 6,
    marginBottom: 4,
    padding: "2px 8px",
    border: "0.5px solid #e0e0e0",
    boxSizing: "border-box"
  }}
>
  {/* 主要内容行 */}
  <div style={{ 
    display: "flex", 
    alignItems: "center",  // 保持居中
    gap: 6,
    minHeight: "28px"      // 稍微增加一点高度
  }}>
    
    {/* 复选框 */}
    <input
      type="checkbox"
      checked={task.done}
      onChange={(e) => {
        e.stopPropagation();
        if (typeof toggleDone === 'function') {
          toggleDone(task);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      style={{ 
        margin: 0,
        cursor: "pointer", 
        flexShrink: 0,
        width: "14px",
        height: "14px",
        verticalAlign: "middle"
      }}
    />

    {/* 任务文字区域 */}
    <div style={{ 
      display: "flex", 
      alignItems: "center",  // 保持居中
      flex: 1, 
      flexWrap: "wrap", 
      gap: "6px",
      minWidth: 0
    }}>  



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
    fontSize: "13px",
    lineHeight: "1.5",
    flex: "1",
    minWidth: "50px",
    // 移除 display: flex 和 align-items，让内容自然流动
  }}
>
  {/* 文字和图片标识放在同一个内联容器中 */}
  <span>
    {task.text}
    {task.hasImage && (
      <span
        style={{
          fontSize: "12px",
          color: "#ff4444",
          fontWeight: "bold",
          marginLeft: "4px",
          whiteSpace: "nowrap"
        }}
        title="需要添加图片"
      >
        【图片】
      </span>
    )}
  </span>
</div>

      {/* 右侧时间显示 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexShrink: 0,
        height: "28px"  // 固定高度，确保内部元素垂直居中
      }}>
        {(() => {
          const minutes = Math.floor((task.timeSpent || 0) / 60);
          return (
           <span
  onClick={(e) => {
    e.stopPropagation();
    if (!isSortingMode) {
      onEditTime(task);
    }
  }}
  style={{
    fontSize: "11px",
    color: isSortingMode ? "transparent" : "#666",
    cursor: isSortingMode ? "default" : "pointer",
    minWidth: "30px",        // 统一宽度
    width: "30px",
    textAlign: "right",      // 右对齐
    pointerEvents: isSortingMode ? "none" : "auto",
    lineHeight: "28px",
    display: "inline-block",
    fontFamily: 'Calibri, "微软雅黑", sans-serif'
  }}
>
  {minutes}m
</span>
          );
        })()}
      </div>
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
              {task.note.split('**[图片]**').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span style={{ color: '#ff4444' }}>[图片]</span>
                  )}
                </span>
              ))}
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

          {/* 时间信息行 - 计划时间、提醒时间、标签 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
            gap: 8,
            flexWrap: "wrap"
          }}>
            {/* 左侧：计划时间、提醒时间、标签 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flex: 1,
              minWidth: 0,
              flexWrap: "wrap"
            }}>
              {/* 计划时间 */}
              {task.scheduledTime && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#666",
                    marginTop: 8,
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

              {/* 标签 */}
              {task.tags && task.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: 3,
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        backgroundColor: tag.color,
                        color: '#fff',
                        borderRadius: 10,
                        border: 'none',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1.2'
                      }}
                      title={tag.name}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 右侧：循环图标 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0
            }}>
              {task.isRepeating && (
                <span style={{ fontSize: "12px" }} title="重复任务">🔄</span>
              )}
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
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            minWidth: 0
          }}>
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

            {task.reminderTime && task.reminderTime.month && task.reminderTime.day && (
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
                title={`提醒时间: ${task.reminderTime.year || ''}年${task.reminderTime.month}月${task.reminderTime.day}日${task.reminderTime.hour ? ` ${task.reminderTime.hour}:${String(task.reminderTime.minute || 0).padStart(2, '0')}` : ''}`}
              >
                🔔 {task.reminderTime.month}/{task.reminderTime.day}
                {task.reminderTime.hour !== undefined && task.reminderTime.hour !== '' && task.reminderTime.hour !== 0 && (
                  <> {String(task.reminderTime.hour).padStart(2, '0')}:{String(task.reminderTime.minute || 0).padStart(2, '0')}</>
                )}
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <div style={{
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      backgroundColor: tag.color,
                      color: '#fff',
                      borderRadius: 10,
                      border: 'none',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1.2'
                    }}
                    title={tag.name}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {task.isRepeating && (
              <span style={{ fontSize: "12px" }} title="重复任务">🔄</span>
            )}
          </div>
        </div>
      )}

      {/* 进度条 */}
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

      {/* 跨日期任务的子任务列表 */}
      {task.dateRange && task.dateRange.allDates && task.dateRange.allDates.length > 0 && (
        <div 
          className="date-range-subtasks"
          style={{ 
            marginLeft: "20px", 
            marginTop: "6px",
            marginBottom: "6px",
            display: "none",
            borderLeft: "2px solid #1a73e8",
            paddingLeft: "8px"
          }}
        >
          <div style={{ 
            fontSize: "11px", 
            color: "#666", 
            marginBottom: "4px",
            fontWeight: "bold"
          }}>
            📅 各天完成情况：
          </div>
          {task.dateRange.allDates.map((date, idx) => {
            let isCompleted = task.done;
            let completionType = 'synced';
            
            if (getTaskCompletionType) {
              const result = getTaskCompletionType(task, date);
              isCompleted = result.completed;
              completionType = result.type;
            }
            
            const dateObj = new Date(date);
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            
            return (
              <div 
                key={date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  padding: "2px 0",
                  color: isCompleted ? "#4CAF50" : "#999"
                }}
              >
                <span style={{ minWidth: "70px" }}>
                  {date.slice(5)} (周{weekDays[dateObj.getDay()]})
                </span>
                <span>
                  {isCompleted ? (
                    completionType === 'actual' ? "✓ 已完成" : "✓ 同步完成"
                  ) : (
                    "○ 未完成"
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 子任务区域 */}
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
                          ❗️ {subTask.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span 
                      onClick={() => startEditSubTask(index, subTask.text)}
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
                
                {/* 非编辑模式下备注显示 */}
                {editingSubTaskIndex !== index && subTask.note && (
                  <div style={{ marginLeft: '20px' }}>
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
                        ❗️ {subTask.note}
                      </div>
                    )}
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




// SortableTaskList 组件 - 删除提示信息后的版本
// SortableTaskList 组件 - 添加删除按钮
// SortableTaskList 组件 - 修复删除功能
// SortableTaskList 组件 - 修复删除功能
const SortableTaskList = ({ 
  tasks, 
  category, 
  subCategory,
  isSortingMode, 
  onSortingEnd,
  onDeleteTask,  // 这是从 App 传入的 deleteTask 函数
  onEditTime,
  onDeleteImage,
  onEditNote,
  onEditReflection,
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
  
  const handleDragStart = (e, index) => {
    if (!isSortingMode) return;
    dragItemIndex.current = index;
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    dragItemIndex.current = null;
  };
  
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

  // 删除任务 - 修复：正确调用 onDeleteTask
  const handleDeleteTask = (task, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('SortableTaskList 删除任务:', task.text);
    
    if (window.confirm(`确定要删除任务 "${task.text}" 吗？`)) {
      // 调用父组件的删除函数
      if (onDeleteTask && typeof onDeleteTask === 'function') {
        onDeleteTask(task, 'today');
      }
      // 立即从本地列表中移除
      setTaskList(prev => prev.filter(t => t.id !== task.id));
    }
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
          {/* 排序模式显示拖拽手柄和删除按钮 */}
       




{isSortingMode && (
  <div
    style={{
      position: 'absolute',
      right: '4px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '-5px',
      zIndex: 10,
      background: 'transparent',
      padding: '2px 4px'
    }}
  >
    {/* 删除按钮 - SVG 版本 */}
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
        width: '18px',
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
        style={{ display: 'block' }}
      >
        <path 
          d="M18 6L6 18" 
          stroke="#999" 
          strokeWidth="2" 
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path 
          d="M6 6L18 18" 
          stroke="#999" 
          strokeWidth="2" 
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </button>
    
  
  {/* 拖拽手柄 - 三条横线版本（间距加大） */}
<div
  style={{
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'right',
    width: '18px',      // 与复选框宽度一致
    height: '18px'      // 与复选框高度一致
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
            isSortingMode={isSortingMode}
            getTaskCompletionType={getTaskCompletionType}
            onDeleteTask={onDeleteTask}
            onEditTime={onEditTime}
            onDeleteImage={onDeleteImage}
            onEditNote={onEditNote}
            onEditReflection={onEditReflection}
            onOpenEditModal={onOpenEditModal}
            onShowImageModal={onShowImageModal}
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

  // 编辑子类别
  const handleEditSubCategory = (categoryIndex, subCategoryIndex, newName) => {
    if (!newName || !newName.trim()) return;
    
    const trimmedNew = newName.trim();
    const newCategories = [...localCategories];
    const category = newCategories[categoryIndex];
    const oldName = category.subCategories[subCategoryIndex];
    
    // 检查新名称是否已存在
    if (category.subCategories.includes(trimmedNew) && trimmedNew !== oldName) {
      alert('该子类别名称已存在！');
      return;
    }
    
    // 更新子类别列表
    category.subCategories[subCategoryIndex] = trimmedNew;
    setLocalCategories(newCategories);
    setEditingSubCategory(null);
  };

  // 删除子类别 - 只有校内类别可以删除
  const handleDeleteSubCategory = (categoryIndex, subCategoryIndex) => {
    const newCategories = [...localCategories];
    const category = newCategories[categoryIndex];
    
    if (category.name !== '校内') {
      alert('只有"校内"类别可以管理子类别！');
      return;
    }
    
    if (window.confirm(`确定要删除子类别 "${category.subCategories[subCategoryIndex]}" 吗？`)) {
      category.subCategories.splice(subCategoryIndex, 1);
      setLocalCategories(newCategories);
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
            flexWrap: 'nowrap'
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
                minWidth: 0
              }}
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid #ccc',
                borderRadius: 6,
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0
              }}
            />
            <button
              onClick={handleAddCategory}
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                backgroundColor: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
              {/* 类别头部 */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#fff',
                color: '#333',
                borderBottom: '1px solid #f0f0f0',
                gap: '8px'
              }}>
                {/* 左侧：颜色圆点 + 类别名称 */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  flex: 1,
                  minWidth: 0
                }}>
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
                      flex: 1,
                      minWidth: '150px',
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
                      width: '32px',
                      height: '32px',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  />

                  {category.name !== '校内' && (
                    <button
                      onClick={() => handleDeleteCategory(index)}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
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
                              onBlur={(e) => {
                                handleEditSubCategory(index, subIndex, e.target.value);
                              }}
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



// 方方正正的对勾组件 - 使用 SVG 绘制
// 方方正正的对勾组件 - 支持自定义颜色
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


function App() {
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
// 加载保存的排序顺序
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
  
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
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





const syncToGitHub = useCallback(async () => {
  const token = localStorage.getItem('github_token');
  if (!token) {
    setShowGitHubSyncModal(true);
    alert('请先设置 GitHub Token');
    return;
  }

  setIsSyncing(true);
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // 先保存当前日期的数据
    await saveDailyData(selectedDate);
    
    // ✅ 在这里添加收集排序数据的代码（不要删除上面的 saveDailyData）
    
  // ✅ 正确代码
const allTaskOrders = {};
const allSubCategoryOrders = {};  // 先定义
const allKeys = Object.keys(localStorage);

allKeys.forEach(key => {
  if (key.startsWith('tasks_order_')) {
    allTaskOrders[key] = JSON.parse(localStorage.getItem(key));
  }
  if (key.startsWith('subcategory_order_')) {
    allSubCategoryOrders[key] = JSON.parse(localStorage.getItem(key));
  }
});
    

    

    // 收集所有需要同步的数据
    const syncData = {
      // 核心数据
      tasksByDate,
      templates,
      
      // 每日数据（确保包含所有复盘）
      dailyRatings,
      dailyReflections,
      
      // 本月任务
      monthTasks,
      
      // 类别配置
      categories,
      
      // 成绩记录
      grades: await loadMainData('grades') || [],
      
      // 每日提醒文本 - 新增
      reminderText: reminderText,  // 添加这行

       taskOrders: allTaskOrders,
  subCategoryOrders: allSubCategoryOrders,
  
      
      // 元数据
      syncTime: new Date().toISOString(),
      version: '2.2',  // 更新版本号
      lastSelectedDate: selectedDate,
      lastCurrentMonday: currentMonday.toISOString()
    };

    console.log('📤 准备同步数据:', {
      任务天数: Object.keys(tasksByDate).length,
      模板数量: templates.length,
      有复盘的日期: Object.keys(dailyReflections).length,
      本月任务: monthTasks.length,
      每日提醒: reminderText ? '有' : '无'  // 添加日志
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
    const taskCount = Object.keys(tasksByDate).length;
    const reflectionCount = Object.keys(dailyReflections).length;
    
    alert(`✅ 同步成功！\n\n同步时间：${syncTime}\n同步内容：\n• 任务天数：${taskCount} 天\n• 模板数量：${templates.length} 个\n• 复盘记录：${reflectionCount} 天\n• 本月任务：${monthTasks.length} 个\n• 每日提醒：${reminderText ? '已同步' : '无'}`);

  } catch (error) {
    console.error('同步失败:', error);
    
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
  } finally {
    setIsSyncing(false);
  }
}, [tasksByDate, templates, dailyRatings, dailyReflections, categories, selectedDate, currentMonday, saveDailyData, monthTasks, reminderText]); // 添加 reminderText 依赖




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
    // 获取选中的日期对应的日期字符串
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

const toggleDone = (task) => {
  const wasDone = task.done;
  console.log('=== toggleDone 开始 ===');
  console.log('任务:', task.text);
  console.log('是否是跨日期任务:', !!task.crossDateId);
  console.log('是否有日期范围:', !!task.dateRange);

  // 如果是跨日期任务，同步所有日期的状态
  if (task.crossDateId || (task.dateRange && task.dateRange.allDates)) {
    const crossDateId = task.crossDateId;
    const actualCompletedDate = selectedDate;
    
    console.log('🔄 跨日期任务联动，ID:', crossDateId);
    
    setTasksByDate(prev => {
      const newTasksByDate = { ...prev };
      
      // 遍历所有日期，找到同一个 crossDateId 的任务
      Object.keys(newTasksByDate).forEach(date => {
        newTasksByDate[date] = newTasksByDate[date].map(t => {
          // 匹配同一个跨日期组的所有任务
          if (t.crossDateId === crossDateId) {
            console.log(`同步任务 ${date}: ${t.text}`, !wasDone);
            return {
              ...t,
              done: !wasDone,
              pinned: !wasDone ? false : t.pinned,
              subTasks: t.subTasks ? t.subTasks.map(st => ({ ...st, done: !wasDone })) : t.subTasks,
              actualCompletedDate: !wasDone ? actualCompletedDate : undefined
            };
          }
          return t;
        });
      });
      
      return newTasksByDate;
    });
    return;
  }
  
  // 处理普通任务
  console.log('📝 处理普通任务:', task.text);
  
  setTasksByDate(prev => {
    const currentDateTasks = prev[selectedDate] || [];
    const updatedTasks = currentDateTasks.map(t => {
      if (t.id === task.id) {
        console.log('找到匹配任务，切换完成状态:', !wasDone);
        return { 
          ...t, 
          done: !wasDone,
          pinned: !wasDone ? false : t.pinned,
          subTasks: t.subTasks ? t.subTasks.map(st => ({ ...st, done: !wasDone })) : t.subTasks
        };
      }
      return t;
    });
    
    return {
      ...prev,
      [selectedDate]: updatedTasks
    };
  });
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
const handleUpdateProgress = (task, newCurrent) => {
  console.log('更新进度:', task.text, '新进度:', newCurrent);
  
  if (task.isWeekTask) {
    // 本周任务：更新所有日期的同一任务
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
        console.log('✅ 本周任务进度已更新');
      }
      return updatedTasksByDate;
    });
  } else {
    // 普通任务：只更新当前日期
    setTasksByDate(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(t =>
        t.id === task.id ? {
          ...t,
          progress: {
            ...t.progress,
            current: Math.min(Math.max(0, newCurrent), t.progress.target || 100)
          }
        } : t
      )
    }));
  }
};
  
  
  


 

  


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
console.log('✅ 加载的任务数据:', savedTasks);
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
      console.log('✅ 初始化状态已保存到存储');
      setIsInitialized(true);
      console.log('✅ isInitialized 设置为 true');





    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  initializeApp();
}, []);

// ===== 修复：将备份定时器移出 initializeApp =====
useEffect(() => {
  let backupTimer;
  
  if (isInitialized) {
    console.log('⏰ 初始化完成，启动自动备份...');
    
    // 设置定时备份
    backupTimer = setInterval(() => {
      console.log('⏰ 执行自动备份...', new Date().toLocaleString());
      autoBackup();
    }, AUTO_BACKUP_CONFIG.backupInterval);
    
    console.log('✅ 自动备份已启动，间隔:', AUTO_BACKUP_CONFIG.backupInterval / 1000 / 60 + '分钟');
    
    // 立即执行第一次备份（延迟5秒确保数据完全加载）
    setTimeout(() => {
      console.log('💾 执行首次自动备份...');
      autoBackup();
    }, 5000);
  }
  
  // 清理函数
  return () => {
    if (backupTimer) {
      clearInterval(backupTimer);
      console.log('🛑 自动备份已停止');
    }
  };
}, [isInitialized]); // 只在 isInitialized 变化时执行
      

 








// 自动保存任务数据
useEffect(() => {
  if (isInitialized) { // 这里必须使用 isInitialized
    console.log('💾 自动保存任务数据...');
    saveMainData('tasks', tasksByDate);
  }
}, [tasksByDate, isInitialized]);

// 自动保存任务数据
useEffect(() => {
  if (isInitialized) {
    console.log('💾 自动保存任务数据...');
    saveMainData('tasks', tasksByDate);
  }
}, [tasksByDate, isInitialized]);

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
  const pinnedTasks = useMemo(() => {
  return todayTasks.filter(task => task.pinned === true);
}, [todayTasks]);
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

// 在 App 组件中添加这个函数（在 calculateTodayStats 之后）
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
  });
  
  // 转换分类数据为图表格式
  const categoryData = Object.entries(categoryTime).map(([name, time]) => ({
    name,
    time,
    color: categories.find(c => c.name === name)?.color || '#1a73e8'
  }));
  
  const subCategoryData = Object.entries(subCategoryTime).map(([name, time]) => ({
    name,
    time,
    color: '#1a73e8'
  }));
  
  // 计算平均完成率和平均每日时间
  const avgCompletion = dailyTasksData.length > 0 
    ? Math.round(dailyTasksData.reduce((sum, d) => sum + d.tasks, 0) / dailyTasksData.length / 5 * 100)
    : 0;
  const avgDailyTime = dailyStudyData.length > 0
    ? Math.round(dailyStudyData.reduce((sum, d) => sum + d.time, 0) / dailyStudyData.length)
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
const handleAddTemplate = (templateData) => {
  const newTemplate = {
    id: Date.now(),
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
const handleUseTemplate = (template) => {
  const newTask = {
    id: Date.now().toString(),
    text: template.text || template.content || '',
    category: template.category || '校内',
    subCategory: template.subCategory || '',
    done: false,
    timeSpent: 0,
    subTasks: [],
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
    createdAt: new Date().toISOString()
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
};

// 添加本周任务
const handleAddWeekTask = (text, targetCategory = '校内', targetSubCategory = '') => {
  if (!text.trim()) return;

  const weekDates = getWeekDates(currentMonday);
  const taskId = Date.now().toString();
  const weekStart = currentMonday.toISOString();
  
  const newTask = {
    id: taskId,
    text: text.trim(),
    category: "本周任务",
    targetCategory: targetCategory,      // 完成后移动到的分类
    targetSubCategory: targetSubCategory, // 完成后移动到的子分类
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
    weekStart: weekStart,
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

    weekDates.forEach(dateObj => {
      if (!newTasksByDate[dateObj.date]) {
        newTasksByDate[dateObj.date] = [];
      }

      const existingTask = newTasksByDate[dateObj.date].find(
        task => task.isWeekTask && 
               task.text === text.trim() && 
               task.weekStart === weekStart
      );

      if (!existingTask) {
        newTasksByDate[dateObj.date].push({ 
          ...newTask, 
          id: `${taskId}_${dateObj.date}`
        });
      }
    });

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
  
  // 获取校内子分类列表
  const schoolCategory = categories.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || ['数学', '语文', '英语', '运动'];
  
  // 获取所有可用的类别（排除常规任务和本周任务）
  const availableCategories = categories.filter(c => 
    c.name !== "常规任务" && c.name !== "本周任务"
  );
  
  // 策略1：检查第一行是否匹配某个主类别
  let matchedCategory = availableCategories.find(c => 
    firstLine.includes(c.name) || c.name.includes(firstLine)
  );
  
  if (matchedCategory) {
    category = matchedCategory.name;
    subCategory = "";
    
    // 如果是校内类别，尝试提取子分类
    if (category === '校内') {
      for (const subCat of schoolSubCategories) {
        if (firstLine.includes(subCat)) {
          subCategory = subCat;
          break;
        }
      }
    }
  } 
  // 策略2：检查是否是校内子分类（没有主类别名称的情况）
  else {
    for (const subCat of schoolSubCategories) {
      if (firstLine.includes(subCat)) {
        category = "校内";
        subCategory = subCat;
        break;
      }
    }
  }
  
  console.log('📌 识别的类别:', category, '子分类:', subCategory || '无');
  
  // 解析日期范围的函数
  const parseDateRangeFromText = (text) => {
    const rangePattern = /@(\d{1,2})[./月](\d{1,2})[日]?\s*-\s*(\d{1,2})[./月](\d{1,2})[日]?/;
    const match = text.match(rangePattern);
    
    if (match) {
      return {
        startMonth: parseInt(match[1]),
        startDay: parseInt(match[2]),
        endMonth: parseInt(match[3]),
        endDay: parseInt(match[4]),
        rangeText: match[0]
      };
    }
    
    if (text.includes('@周末')) {
      return { type: 'weekend', rangeText: '@周末' };
    }
    
    return null;
  };
  
  // 获取默认日期范围
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
  let lastLineHasImage = false;
  
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];

    // 检测图片标记
    if (line === '[图片]' || line.includes('[图片]')) {
      lastLineHasImage = true;
      console.log('📷 检测到图片标记，下一个任务将有图片标志');
      continue;
    }
    
    // 检查是否有内置日期范围
    let dateRange = parseDateRangeFromText(line);
    let taskLine = line;
    
    if (dateRange) {
      taskLine = line.replace(dateRange.rangeText, '').trim();
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
      hasImage: lastLineHasImage,
      dateRangeText: dateRange?.rangeText || '',
      duration: null
    });
    
    console.log(`📝 解析任务: "${taskText}", 类别: ${category}, 子分类: ${subCategory || '无'}, hasImage: ${lastLineHasImage}`);
    
    // 重置图片标记，只影响下一个任务
    lastLineHasImage = false;
  }
  
  return tasks;
}, [bulkText, bulkDateRange, bulkDateRangeStart, bulkDateRangeEnd, categories]);



// 修复批量导入中的图片识别功能 - 图片标记作用于上一个任务（标记行在上，任务在下）
// 修复批量导入中的图片识别功能 - 图片标记作用于上面的任务（标记行在下，任务在上）
const handleImportTasksWithDuration = () => {
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

  // 第一行是子分类标识
  const firstLine = lines[0];
  
  // 固定类别为"校内"
  const category = "校内";
  let subCategory = "";
  
  // 获取校内子分类列表
  const schoolCategory = categories.find(c => c.name === '校内');
  const schoolSubCategories = schoolCategory?.subCategories || [];
  const defaultSubCategories = ['数学', '语文', '英语', '运动'];
  const allSubCategories = [...new Set([...schoolSubCategories, ...defaultSubCategories])];
  
  // 匹配子分类
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
  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let crossDateGroupIndex = 0;
  
  const getDefaultDates = () => {
    const dates = [];
    const todayDate = new Date();
    
    switch (bulkDateRange) {
      case 'today': {
        const dateStr = todayDate.toISOString().split('T')[0];
        dates.push(dateStr);
        break;
      }
      case 'next3': {
        for (let i = 0; i < 3; i++) {
          const date = new Date(todayDate);
          date.setDate(todayDate.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
      }
      case 'next4': {
        for (let i = 0; i < 4; i++) {
          const date = new Date(todayDate);
          date.setDate(todayDate.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
      }
      case 'custom': {
        if (bulkDateRangeStart && bulkDateRangeEnd) {
          const start = new Date(bulkDateRangeStart);
          const end = new Date(bulkDateRangeEnd);
          const current = new Date(start);
          while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        } else {
          dates.push(todayDate.toISOString().split('T')[0]);
        }
        break;
      }
      default:
        dates.push(todayDate.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const defaultDates = getDefaultDates();
  
  const parseDateRangeFromText = (text) => {
    const rangePattern = /@(\d{1,2})[./月](\d{1,2})[日]?\s*-\s*(\d{1,2})[./月](\d{1,2})[日]?/;
    const match = text.match(rangePattern);
    
    if (match) {
      const startMonth = parseInt(match[1]);
      const startDay = parseInt(match[2]);
      const endMonth = parseInt(match[3]);
      const endDay = parseInt(match[4]);
      
      const startDate = new Date(currentYear, startMonth - 1, startDay);
      const endDate = new Date(currentYear, endMonth - 1, endDay);
      
      const dates = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }
    
    if (text.includes('@周末')) {
      const dayOfWeek = today.getDay();
      const daysToFriday = (5 - dayOfWeek + 7) % 7;
      const friday = new Date(today);
      friday.setDate(today.getDate() + daysToFriday);
      
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(friday);
        date.setDate(friday.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    }
    
    return null;
  };
  
  // ========== 关键修复：图片标记作用于上面的任务 ==========
  // 格式：
  // 任务1
  // 【图片】
  // 任务2   ← 图片标记属于任务1（上面的任务）
  
  const taskInfos = [];
  let pendingImageForPreviousTask = false;  // 上一个任务是否需要图片
  
  let i = 1;
  while (i < lines.length) {
    let line = lines[i];
    
    // 检查是否是图片标记行（单独的 [图片] 或 【图片】）
    if (line === '[图片]' || line === '【图片】') {
      // 图片标记：标记上一个任务需要图片
      // 如果还没有任何任务，则跳过（标记无效）
      if (taskInfos.length > 0) {
        const lastTask = taskInfos[taskInfos.length - 1];
        lastTask.hasImage = true;
        console.log(`📷 图片标记应用于上一个任务: "${lastTask.text}"`);
      } else {
        console.log('⚠️ 图片标记无效：没有上一个任务');
      }
      i++;
      continue;
    }
    
    // 处理任务行
    let taskLine = line;
    let taskDates = parseDateRangeFromText(taskLine);
    let cleanTaskLine = taskLine;
    
    if (taskDates) {
      const rangePattern = /@\d{1,2}[./月]\d{1,2}[日]?\s*-\s*\d{1,2}[./月]\d{1,2}[日]?|@周末/g;
      cleanTaskLine = taskLine.replace(rangePattern, '').trim();
    } else {
      taskDates = [...defaultDates];
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
        hasImage: false  // 初始没有图片
      });
      
      console.log(`📝 添加任务: "${taskText}"`);
    }
    
    i++;
  }
  
  const dailyTaskKeywords = ['课外阅读', '每天', '每日', '运动', '背单词', '练字', '阅读', '听英语', '口算'];
  
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
        hasImage: hasImage,  // 保存图片标记
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
        createdAt: new Date().toISOString()
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
  const tasksWithImage = Object.values(allTasksByDate).flat().filter(t => t.hasImage).length;
  
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
  
  alert(`✅ 导入成功！\n\n📌 导入位置：${category} / ${subCategory}\n📝 任务数量：${taskInfos.length} 个\n📅 任务实例：${totalTasksCount} 个\n🖼️ 带图片标记的任务：${tasksWithImage} 个`);
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
      tags: [...bulkTags],
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
const getCategoryTasks = (catName) => {
  // 只从当前日期获取任务
  const result = todayTasks.filter(t => 
    t.category === catName && 
    t.pinned !== true
  );
  
 
  
  if (catName === '运动') {
    console.log('过滤后的结果数量:', result.length);
    console.log('========================');
  }
  
  return result;
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
    onSave={(task, editData) => {
      console.log('🔴🔴🔴 App中的onSave被调用！');
      saveTaskEdit(task, editData);
    }}
    onTogglePinned={togglePinned}
    onImageUpload={handleImageUpload}
    setCategories={setCategories} 
    setShowDeleteModal={setShowDeleteModal}
 
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
  title="成绩111记录"
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
    宝贝学习记录
  </h1>
</div>

      
      <div style={{
        textAlign: "center",
        fontSize: 13,
        marginTop: "-5px",      // 确保为0
        marginBottom: 10
      }}>
        
宝贝已打卡 {
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
  marginBottom: 10
}}>
  {/* 左侧：周次显示 */}
  <div style={{ display: "flex", alignItems: "center" }}>
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
        padding: "6px",
        fontSize: "14px"
      }}
      title="上一周"
    >
      ⬅️
    </button>

    {/* 修改这里：把日期文字变成可点击的 */}
    <span 
      onClick={() => setShowDatePickerModal(true)}  // ✅ 添加点击事件
      style={{
        fontWeight: "bold",
        margin: "0 4px",
        fontSize: "13px",
        cursor: "pointer",  // ✅ 添加手型光标
        padding: "4px 8px",  // ✅ 增加点击区域
        borderRadius: "6px",  // ✅ 圆角
        transition: "background-color 0.2s",  // ✅ 过渡效果
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8f0fe"}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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
        padding: "6px",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title="下一周"
    >
      ➡️
    </button>

    {/* ✅ 删除原来的月历按钮 */}
  </div>

  {/* 右侧：四个小按钮（保持不变） */}
  <div style={{ display: "flex", gap: "6px" }}>
    <div
      onClick={() => setShowWeekTaskModal(true)}
      style={{
        padding: "4px 4px",
        backgroundColor: "#1a73e8",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        textAlign: "center"
      }}
    >
      本周
    </div>
    <div
      onClick={() => setShowMonthTaskModal(true)}
      style={{
        padding: "4px 4px",
        backgroundColor: "#1a73e8",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        textAlign: "center"
      }}
    >
      本月
    </div>
    <div
      onClick={() => setShowAddTaskModal(true)}
      style={{
        padding: "4px 4px",
        backgroundColor: "#1a73e8",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        textAlign: "center"
      }}
    >
      添加
    </div>
    <div
      onClick={() => setShowBulkImportModal(true)}
      style={{
        padding: "4px 4px",
        backgroundColor: "#1a73e8",
        color: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        textAlign: "center"
      }}
    >
      批量
    </div>
  </div>
</div>


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
    
    const filteredTasks = dayTasks.filter(task => {
      if (task.category === "本周任务") return false;
      if (task.isRegularTask && !task.done) return false;
      return true;
    });
    
    const totalCount = filteredTasks.length;
    const completedCount = filteredTasks.filter(task => task.done).length;
    const allDone = totalCount > 0 && completedCount === totalCount;
    const hasIncomplete = totalCount > 0 && completedCount < totalCount;
    
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
          background: dailyRating > 0 
            ? `linear-gradient(to bottom, ${isSelected ? '#fff9c4' : 'transparent'} 0%, ${isSelected ? '#fff9c4' : 'transparent'} 50%, ${getRatingColor(dailyRating)}20 100%)`
            : isSelected ? '#fff9c4' : 'transparent'
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <span>{d.label}</span>
          {hasCrossDateTask && (
            <span style={{
              position: "absolute",
              top: "50%",
              right: "-16px",
              transform: "translateY(-50%)",
              fontSize: "10px",
              color: "#ff9800"
            }}>⚡</span>
          )}
        </div>
        <div style={{ fontSize: 10 }}>{d.date.slice(5)}</div>
        
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
        
        {totalCount > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            marginTop: dailyRating > 0 ? "0px" : "4px"
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: allDone ? "#4CAF50" : hasIncomplete ? "#f44336" : "#666"
            }} />
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


      {(() => {
         const validatedMonday = getMonday(new Date(selectedDate));
  if (validatedMonday.getTime() !== currentMonday.getTime()) {
    setCurrentMonday(validatedMonday);
  }
  return null;
      })()}




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
      <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>添加任务</h3>
      
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
                backgroundColor: newTaskCategory === c.name ? '#1a73e8' : '#f0f0f0',
                color: newTaskCategory === c.name ? '#fff' : '#333',
                fontSize: '12px',
                cursor: 'pointer'
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
            {['数学', '语文', '英语', '运动'].map(sub => (
              <div
                key={sub}
                onClick={() => setNewTaskSubCategory(sub)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 16,
                  backgroundColor: newTaskSubCategory === sub ? '#1a73e8' : '#f0f0f0',
                  color: newTaskSubCategory === sub ? '#fff' : '#333',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {sub}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 按钮 */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={() => setShowAddTaskModal(false)}
          style={{ flex: 1, padding: 10, backgroundColor: '#ccc', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          取消
        </button>
        <button
          onClick={() => {
            handleAddTask();
            setShowAddTaskModal(false);
          }}
          style={{ flex: 1, padding: 10, backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          确认添加
        </button>
      </div>
    </div>
  </div>
)}


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
      <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#1a73e8' }}>批量导入任务</h3>
      
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
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              setBulkDateRangeStart(todayStr);
              setBulkDateRangeEnd(todayStr);
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
          <option value="today">仅今天（默认）</option>
          <option value="next3">未来3天（含今天）</option>
          <option value="next4">未来4天（含今天）</option>
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
      
      {/* 按钮 */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setShowBulkImportModal(false)}
          style={{ flex: 1, padding: 10, backgroundColor: '#ccc', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          取消
        </button>
        <button
          onClick={() => {
            handleImportTasksWithDuration();
          }}
          style={{ flex: 1, padding: 10, backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          确认导入
        </button>
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




{/* 本周任务区域 */}
{weekTasks.length > 0 && (
  <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", border: "2px solid #87CEEB", backgroundColor: "#fff" }}>
    <div onClick={() => setCollapsedCategories(prev => ({ ...prev, "本周任务": !prev["本周任务"] }))}
      style={{ backgroundColor: "#87CEEB", color: "#fff", padding: "3px 8px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
      <span>本周任务 ({weekTasks.filter(t => t.done).length}/{weekTasks.length})</span>
      <button onClick={(e) => { e.stopPropagation(); setShowWeekTaskModal(true); }}
        style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>
        ➕
      </button>
    </div>
    {!collapsedCategories["本周任务"] && (
      <ul style={{ listStyle: "none", padding: 8, margin: 0 }}>
        {weekTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onDeleteTask={deleteTask}
            onEditTime={editTaskTime}
            getTaskCompletionType={getTaskCompletionType}  // 
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
            onUpdateProgress={handleUpdateProgress}  // 确保传递这个
            onEditSubTask={editSubTask}
            onToggleSubTask={toggleSubTask}
          />
        ))}
      </ul>
    )}
  </div>
)}





{categories.map((c) => {
  const catTasks = getCategoryTasks(c.name);
  if (catTasks.length === 0) return null;
  const isComplete = isCategoryComplete(c.name);
  const isCollapsed = collapsedCategories[c.name];
  const isSortingMode = sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory;

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
  style={{
    backgroundColor: isComplete ? "#f5f5f5" : (() => {
      switch(c.name) {
        case '语文': return '#FFFDE7';
        case '数学': return '#E8F5E9';
        case '英语': return '#FCE4EC';
        case '科学': return '#E1F5FE';
        case '运动': return '#E3F2FD';
        case '校内': return '#1a73e8';
        default: return '#f0f0f0';
      }
    })(),
    color: isComplete ? "#bbb" : (c.name === "校内" ? "#fff" : "#333"),
    fontFamily: 'Calibri, "微软雅黑", sans-serif',
    padding: "3px 12px",
    fontWeight: isComplete ? "normal" : "bold",
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
    <span
      onClick={() => setCollapsedCategories(prev => ({ ...prev, [c.name]: !prev[c.name] }))}
      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
    >
      {c.name} ({getCategoryTasks(c.name).filter(t => t.done).length}/{getCategoryTasks(c.name).length})
      {isComplete && <SquareCheckMark show={true} size={12} color="#bbb" />}
    </span>
  </div>

  {/* 右侧：排序按钮 + 时间显示 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {/* 排序按钮 - 校内类别不显示排序按钮 */}

{/* 排序按钮 - 校内类别不显示排序按钮 */}
{/* 分类标题右侧的排序按钮 - 修改这里 */}
{/* 分类标题右侧的排序按钮 - 激活状态显示黑色对勾 */}
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
      userSelect: "none"
    }}
  >
    {sortingSubCategory?.category === c.name && !sortingSubCategory?.subCategory ? (
      // 已激活排序模式 - 显示黑色对勾
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
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
        style={{ display: 'block' }}
      >
        <line x1="4" y1="6" x2="20" y2="6" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="4" y1="18" x2="20" y2="18" stroke="#999" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    )}
  </div>
)}

    {/* 时间显示 */}
 {/* 主分类标题时间显示 - 黑色，右对齐 */}
{/* 主分类标题时间显示 - 校内白色，其他黑色 */}
{/* 校内大分类时间显示 - 未完成白色，完成后黑色 */}
<span
  onClick={(e) => {
    e.stopPropagation();
    editCategoryTime(c.name);
  }}
  style={{
    fontSize: '11px',
    color: c.name === '校内' 
      ? (isComplete ? '#333' : '#fff')  // 校内：完成时黑色，未完成白色
      : '#333',                          // 其他分类：始终黑色
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
    backgroundColor: allDone ? "#f5f5f5" : (() => {
      switch(subCat) {
        case '数学': return '#E8F5E9';
        case '语文': return '#FFFDE7';
        case '英语': return '#FCE4EC';
        case '运动': return '#E3F2FD';
        default: return '#F5F5F5';
      }
    })(),
    color: allDone ? '#bbb' : '#333',
    padding: '4px 8px',
    fontWeight: allDone ? "normal" : "bold",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '4px',
    border: 'none',  // ✅ 去掉边框，避免高度变化
    // 固定高度
    height: '32px',  // ✅ 固定高度
    minHeight: '32px',  // ✅ 最小高度
    maxHeight: '32px',  // ✅ 最大高度
    lineHeight: '24px',  // ✅ 行高固定
    boxSizing: 'border-box',  // ✅ 确保高度计算包含内边距
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
              subCategory={subCat}
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



   


{/* 底部按钮区域 - 只保留四个主按钮 */}
{/* 底部按钮区域 - 全部用div模拟 */}
<div style={{
  display: "flex",
  justifyContent: "center",
  gap: 10,
  marginTop: 20,
  marginBottom: 20,
  flexWrap: "wrap"
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
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box"
    }}
  >
    每日日志
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
    padding: "6px 10px",
    backgroundColor: isSyncing ? "#ccc" : "#1a73e8",
    color: "#fff",
    fontSize: 12,
    borderRadius: 6,
    width: "70px",
    height: "30px",
    cursor: isSyncing ? "not-allowed" : "pointer",
    userSelect: "none",
    boxSizing: "border-box",
    opacity: isSyncing ? 0.7 : 1
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
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box"
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
      padding: "6px 10px",
      backgroundColor: "#1a73e8",
      color: "#fff",
      fontSize: 12,
      borderRadius: 6,
      width: "70px",
      height: "30px",
      cursor: "pointer",
      userSelect: "none",
      boxSizing: "border-box"
    }}
  >
    其他设置
  </div>
</div>

{/* 其他设置下拉菜单 */}


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

    
