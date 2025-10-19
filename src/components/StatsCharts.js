// src/components/StatsCharts.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatsCharts = ({ weekStats, categories }) => {
  // 处理每日学习时间数据
  const dailyStudyData = Object.entries(weekStats.byDay).map(([date, time]) => ({
    name: `${new Date(date).getDate()}日`, // 只显示"X日"
    time: time / 60, // 转换为分钟
    date: date.slice(5) // 完整日期用于tooltip
  }));

  // 处理类别学习时间数据
  const categoryData = categories.map(cat => ({
    name: cat.name,
    time: (weekStats.byCategory[cat.name] || 0) / 60, // 转换为分钟
    color: cat.color
  }));

  // 处理每日完成任务数
  const dailyTasksData = Object.entries(weekStats.tasksByDay).map(([date, count]) => ({
    name: `${new Date(date).getDate()}日`,
    tasks: count,
    date: date.slice(5)
  }));

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '30px',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {/* 1. 每日学习时间柱状图 */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>
          📅 每日学习时间（分钟）
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyStudyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '分钟', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => [`${value} 分钟`, '学习时间']}
              labelFormatter={(name, payload) => payload[0]?.payload.date}
            />
            <Legend />
            <Bar 
              dataKey="time" 
              name="学习时间" 
              fill="#1a73e8" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2. 各科目学习时间柱状图 */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>
          📚 各科目学习时间（分钟）
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '分钟', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} 分钟`, '学习时间']} />
            <Legend />
            <Bar 
              dataKey="time" 
              name="学习时间" 
              fill="#4a90e2"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. 每日完成任务数柱状图 */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>
          ✅ 每日完成任务数
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyTasksData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '任务数', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => [`${value} 个`, '完成任务']}
              labelFormatter={(name, payload) => payload[0]?.payload.date}
            />
            <Legend />
            <Bar 
              dataKey="tasks" 
              name="完成任务" 
              fill="#00a854" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsCharts;