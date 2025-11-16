import React, { useState, useCallback } from 'react';
import { Card, Typography } from 'antd';
import dayjs from 'dayjs';
import StatisticsTabs from './components/StatisticsTabs';
import useStatisticsData from './hooks/useStatisticsData';
import useResponsive from './hooks/useResponsive';
import { getDefaultDateRange } from './utils/dataFormatUtils';
import './styles.css';

const { Title, Text } = Typography;

/**
 * 统计分析页面主组件
 */
const StatisticsPage = () => {
  const { isMobile } = useResponsive();
  
  // 全局状态管理
  const [activeTab, setActiveTab] = useState('month');
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  
  // 各标签页的加载状态和错误信息
  const [loadingStates, setLoadingStates] = useState({
    month: false,
    category: false,
    year: false,
    daily: false
  });
  
  const [errors, setErrors] = useState({
    month: null,
    category: null,
    year: null,
    daily: null
  });
  
  // 使用自定义hook获取数据
  const {
    monthlyData,
    categoryData,
    yearlyData,
    dailyData,
    loading,
    error,
    fetchMonthlyStatistics,
    fetchCategoryStatistics,
    fetchYearlyStatistics,
    fetchDailyData
  } = useStatisticsData({
    activeTab,
    dateRange,
    selectedYear,
    selectedMonth
  });
  
  // 当全局loading和error变化时，更新对应的标签页状态
  React.useEffect(() => {
    if (loading) {
      setLoadingStates(prev => ({ ...prev, [activeTab]: true }));
      setErrors(prev => ({ ...prev, [activeTab]: null }));
    } else {
      setLoadingStates(prev => ({ ...prev, [activeTab]: false }));
      if (error) {
        setErrors(prev => ({ ...prev, [activeTab]: error }));
      }
    }
  }, [loading, error, activeTab]);
  
  // 标签页切换处理函数
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    // 切换标签页时清除对应错误信息
    setErrors(prev => ({ ...prev, [key]: null }));
  }, []);
  
  // 日期范围变化处理函数
  const handleDateRangeChange = useCallback((dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  }, []);
  
  // 年份变化处理函数
  const handleYearChange = useCallback((year) => {
    setSelectedYear(year);
  }, []);
  
  // 月份变化处理函数
  const handleMonthChange = useCallback((month) => {
    setSelectedMonth(month);
  }, []);
  
  // 刷新指定标签页数据
  const handleRefresh = useCallback((tabKey) => {
    // 清除对应标签页的错误信息
    setErrors(prev => ({ ...prev, [tabKey]: null }));
    
    // 根据标签页类型刷新数据
    switch (tabKey) {
      case 'month':
        fetchMonthlyStatistics();
        break;
      case 'category':
        fetchCategoryStatistics();
        break;
      case 'year':
        fetchYearlyStatistics();
        break;
      case 'daily':
        fetchDailyData();
        break;
      default:
        break;
    }
  }, [fetchMonthlyStatistics, fetchCategoryStatistics, fetchYearlyStatistics, fetchDailyData]);
  
  // 整合所有数据
  const data = {
    monthly: monthlyData,
    category: categoryData,
    yearly: yearlyData,
    daily: dailyData
  };
  
  return (
    <div className={`statistics-page ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 8 }}>统计分析</Title>
        <Text type="secondary">
          查看您的收支统计数据，包括月度趋势、分类分析、年度汇总和每日明细。
        </Text>
      </div>
      
      {/* 主要内容区域 */}
      <Card className="statistics-card" variant="outlined">
        <StatisticsTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          data={data}
          loadingStates={loadingStates}
          errors={errors}
          onRefresh={handleRefresh}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
      </Card>
    </div>
  );
};

export default StatisticsPage;