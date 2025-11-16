import React, { memo, useMemo } from 'react';
import { Card, Row, Col, Select, Button, Spin, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCategoryColor, formatCurrency, formatPercentage, calculateSummary, getPieChartConfig } from '../utils/chartUtils';
import { getRecentYears, getRecentMonths } from '../utils/dataFormatUtils';
import useResponsive from '../hooks/useResponsive';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 分类分析图表组件
 * @param {Object} props 组件属性
 * @param {Array} props.data 分类数据
 * @param {boolean} props.loading 加载状态
 * @param {Function} props.onYearChange 年份变化回调
 * @param {Function} props.onMonthChange 月份变化回调
 * @param {Function} props.onRefresh 刷新按钮点击回调
 * @param {number} props.selectedYear 选中的年份
 * @param {number} props.selectedMonth 选中的月份
 * @param {string} props.error 错误信息
 */
const CategoryChart = memo(({ 
  data, 
  loading, 
  onYearChange, 
  onMonthChange, 
  onRefresh,
  selectedYear,
  selectedMonth,
  error 
}) => {
  const { isMobile, getResponsiveValue } = useResponsive();
  
  // 获取年份和月份选项
  const yearOptions = useMemo(() => getRecentYears(5), []);
  const monthOptions = useMemo(() => getRecentMonths(12).slice(0, 12), []);
  
  // 处理数据格式：将income和expense两个数组合并
  const processedData = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    
    // 处理包含income和expense属性的对象格式
    const mergedData = [];
    
    // 获取处理指定类型数据的辅助函数
    const processCategoryData = (type, sourceData) => {
      // 适配可能的categories数组或直接是数组的情况
      const categoryData = Array.isArray(sourceData.categories) ? sourceData.categories : sourceData;
      
      if (Array.isArray(categoryData)) {
        categoryData.forEach(item => {
          mergedData.push({
            ...item,
            type,
            // 确保数据字段统一
            name: item.categoryName || item.name || item.title,
            value: item.totalAmount || item.amount || 0,
            icon: item.categoryIcon || item.icon
          });
        });
      }
    };
    
    // 添加收入数据 - 适配新API可能返回的categories数组
    if (data.income) {
      processCategoryData('income', data.income);
    }
    
    // 添加支出数据 - 适配新API可能返回的categories数组
    if (data.expense) {
      processCategoryData('expense', data.expense);
    }
    
    // 如果已经是数组格式，确保每个项都有type属性
    if (Array.isArray(data) && !data.income && !data.expense) {
      return data.map(item => ({
        ...item,
        type: item.type || (item.amount >= 0 ? 'income' : 'expense'),
        name: item.categoryName || item.name || item.title,
        value: item.totalAmount || item.amount || 0
      }));
    }
    
    return mergedData;
  }, [data]);
  
  // 计算汇总数据
  const summary = useMemo(() => {
    if (!Array.isArray(processedData)) {
      return { totalIncome: 0, totalExpense: 0, totalBalance: 0, recordCount: 0 };
    }
    
    // 分别计算收入和支出，处理可能的不同字段名称，兼容新旧数据格式
    const totalIncome = processedData
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + (item.totalAmount || item.amount || 0), 0);
    
    const totalExpense = processedData
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + (item.totalAmount || item.amount || 0), 0);
    
    return {
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense,
      recordCount: processedData.length
    };
  }, [processedData]);
  
  // 获取饼图配置
  const pieConfig = useMemo(() => getPieChartConfig({ isMobile }), [isMobile]);
  
  // 自定义Tooltip组件
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = formatPercentage(data.amount, summary.totalIncome + summary.totalExpense);
      
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #ccc', 
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
          <p style={{ margin: '3px 0', fontSize: isMobile ? '12px' : '14px' }}>
            金额: <span style={{ color: data.type === 'income' ? '#52c41a' : '#f5222d' }}>
              {formatCurrency(data.value)}
            </span>
          </p>
          <p style={{ margin: '3px 0', fontSize: isMobile ? '12px' : '14px' }}>
            占比: <span style={{ color: '#1890ff' }}>{percentage}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // 渲染图表内容
  const renderChartContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="数据加载中..." />
        </div>
      );
    }
    
    if (error) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#f5222d'
        }}>
          <Text type="danger" style={{ marginBottom: '10px' }}>{error}</Text>
          <Button type="primary" icon={<ReloadOutlined />} onClick={onRefresh}>
            重新加载
          </Button>
        </div>
      );
    }
    
    if (!processedData || processedData.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#999'
        }}>
          <Text>暂无分类数据</Text>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={!isMobile}
              label={!isMobile ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
              outerRadius={isMobile ? 80 : 120}
              fill="#8884d8"
              dataKey="value"
              margin={pieConfig.margin}
            >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {pieConfig.showLegend && (
            <Legend 
              layout={isMobile ? 'vertical' : 'horizontal'}
              verticalAlign="bottom"
              align={isMobile ? 'center' : 'center'}
              iconSize={10}
              wrapperStyle={{ fontSize: isMobile ? 12 : 14 }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Card 
      className="chart-card" 
      title={
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Title level={5} style={{ margin: 0 }}>分类收支分析</Title>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={onRefresh}
              disabled={loading}
              size={isMobile ? "small" : "default"}
            />
          </Col>
        </Row>
      }
      size="small"
    >
      {/* 选择器区域 */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <Text style={{ whiteSpace: 'nowrap' }}>选择月份:</Text>
        <Select
          value={selectedYear}
          onChange={onYearChange}
          disabled={loading}
          style={{ width: 100 }}
          size={isMobile ? "small" : "default"}
        >
          {yearOptions.map(option => (
            <Option key={option.value} value={option.value}>{option.label}</Option>
          ))}
        </Select>
        <Select
          value={selectedMonth}
          onChange={onMonthChange}
          disabled={loading}
          style={{ width: 80 }}
          size={isMobile ? "small" : "default"}
        >
          {monthOptions.map(option => (
            <Option key={option.month} value={option.month}>{option.month}月</Option>
          ))}
        </Select>
      </div>
      
      {/* 汇总统计 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={24} md={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
            <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
              {formatCurrency(summary.totalIncome)}
            </Title>
            <Text type="secondary">总收入</Text>
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #f5222d' }}>
            <Title level={4} style={{ color: '#f5222d', margin: 0 }}>
              {formatCurrency(summary.totalExpense)}
            </Title>
            <Text type="secondary">总支出</Text>
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
            <Title level={4} style={{ 
              color: summary.totalBalance >= 0 ? '#52c41a' : '#f5222d', 
              margin: 0 
            }}>
              {formatCurrency(summary.totalBalance)}
            </Title>
            <Text type="secondary">结余</Text>
          </Card>
        </Col>
      </Row>
      
      {/* 图表区域 */}
      <div className="chart-container">
        {renderChartContent()}
      </div>
    </Card>
  );
});

CategoryChart.displayName = 'CategoryChart';

export default CategoryChart;