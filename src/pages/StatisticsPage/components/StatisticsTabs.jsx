import React, { memo } from 'react';
import { Tabs } from 'antd';
import MonthChart from './MonthChart';
import CategoryChart from './CategoryChart';
import YearlySummary from './YearlySummary';
import DailyDataTable from './DailyDataTable';
import useResponsive from '../hooks/useResponsive';

/**
 * 统计分析标签页容器组件
 * @param {Object} props 组件属性
 * @param {string} props.activeTab 当前激活的标签页
 * @param {Function} props.onTabChange 标签页切换回调
 * @param {Object} props.data 数据对象
 * @param {Object} props.loadingStates 各标签页加载状态
 * @param {Object} props.errors 各标签页错误信息
 * @param {Function} props.onRefresh 刷新回调
 * @param {Array} props.dateRange 日期范围
 * @param {Function} props.onDateRangeChange 日期范围变化回调
 * @param {number} props.selectedYear 选中的年份
 * @param {number} props.selectedMonth 选中的月份
 * @param {Function} props.onYearChange 年份变化回调
 * @param {Function} props.onMonthChange 月份变化回调
 */
const StatisticsTabs = memo(({
  activeTab,
  onTabChange,
  data,
  loadingStates,
  errors,
  onRefresh,
  dateRange,
  onDateRangeChange,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange
}) => {
  const { isMobile } = useResponsive();
  
  // 标签页配置
  const tabItems = [
    {
      key: 'month',
      label: '月度趋势',
      children: (
        <MonthChart
          data={data.monthly || []}
          loading={loadingStates.month || false}
          error={errors.month || null}
          onDateRangeChange={onDateRangeChange}
          onRefresh={() => onRefresh('month')}
          dateRange={dateRange}
        />
      )
    },
    {
      key: 'category',
      label: '分类分析',
      children: (
        <CategoryChart
          data={data.category || []}
          loading={loadingStates.category || false}
          error={errors.category || null}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          onRefresh={() => onRefresh('category')}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      )
    },
    {
      key: 'year',
      label: '年度汇总',
      children: (
        <YearlySummary
          data={data.yearly || []}
          loading={loadingStates.year || false}
          error={errors.year || null}
          onYearChange={onYearChange}
          onRefresh={() => onRefresh('year')}
          selectedYear={selectedYear}
        />
      )
    },
    {
      key: 'daily',
      label: '每日明细',
      children: (
        <DailyDataTable
          data={data.daily || []}
          loading={loadingStates.daily || false}
          error={errors.daily || null}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          onRefresh={() => onRefresh('daily')}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      )
    }
  ];
  
  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange}
      type={isMobile ? 'line' : 'card'}
      size={isMobile ? 'small' : 'default'}
      items={tabItems}
      tabBarStyle={{
        marginBottom: 20,
        fontSize: isMobile ? '14px' : '16px'
      }}
    />
  );
});

StatisticsTabs.displayName = 'StatisticsTabs';

export default StatisticsTabs;