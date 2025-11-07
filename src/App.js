// 筛选和统计区域
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
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    <select
      value={filterSubject}
      onChange={(e) => setFilterSubject(e.target.value)}
      style={{
        padding: '10px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: 'white',
        minWidth: '200px', // 修改这里：增加最小宽度
        flex: 'none' // 修改这里：取消flex自动伸缩
      }}
    >
      {subjects.map(subject => (
        <option key={subject} value={subject}>{subject}</option>
      ))}
    </select>
  </div>

  {/* 统计信息行 - 修改这里：改为水平排列 */}
  <div style={{
    display: 'flex', // 改为flex水平排列
    gap: '10px',
    justifyContent: 'space-between', // 均匀分布
    alignItems: 'center'
  }}>
    <div style={{
      flex: 1, // 平均分配宽度
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
