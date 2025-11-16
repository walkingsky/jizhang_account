import React, { memo, useMemo } from 'react';
import { Card, Row, Col, Select, Button, Spin, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, CHART_COLORS, calculateSummary } from '../utils/chartUtils';
import { getRecentYears, processYearlyData } from '../utils/dataFormatUtils';
import useResponsive from '../hooks/useResponsive';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 年度汇总组件
 * @param {Object} props 组件属性
 * @param {Array} props.data 年度数据
 * @param {boolean} props.loading 加载状态
 * @param {Function} props.onYearChange 年份变化回调
 * @param {Function} props.onRefresh 刷新按钮点击回调
 * @param {number} props.selectedYear 选中的年份
 * @param {string} props.error 错误信息
 */
const YearlySummary = memo(({ 
  data, 
  loading, 
  onYearChange, 
  onRefresh,
  selectedYear,
  error 
}) => {
  const { isMobile, getResponsiveValue } = useResponsive();
  
  // 获取年份选项
  const yearOptions = useMemo(() => getRecentYears(10), []);
  
  // 处理年度数据
  const processedData = useMemo(() => {
    // 适配可能的不同数据格式
    // 检查data是否包含monthlyData字段，如果有则使用它，否则直接使用data
    const sourceData = data && Array.isArray(data.monthlyData) ? data.monthlyData : (Array.isArray(data) ? data : []);
    return processYearlyData(sourceData);
  }, [data]);
  
  // 计算汇总数据
  const summary = useMemo(() => {
    // 如果data中直接包含汇总信息，优先使用它
    if (data && typeof data === 'object') {
      return {
        totalIncome: data.totalIncome || 0,
        totalExpense: data.totalExpense || 0,
        totalBalance: data.totalBalance || 0,
        recordCount: processedData.length
      };
    }
    // 否则通过processedData计算
    return calculateSummary(processedData);
  }, [data, processedData]);
  
  // 自定义Tooltip组件
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #ccc', 
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: '3px 0',
              fontSize: isMobile ? '12px' : '14px'
            }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // 渲染图表内容
  const renderChartContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
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
          height: '300px',
          color: '#f5222d'
        }}>
          <Text type="danger" style={{ marginBottom: '10px' }}>{error}</Text>
          <Button type="primary" icon={<ReloadOutlined />} onClick={onRefresh}>
            重新加载
          </Button>
        </div>
      );
    }
    
    if (processedData.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          color: '#999'
        }}>
          <Text>暂无年度数据</Text>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="monthLabel" 
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="income" name="收入" stackId="a" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="支出" stackId="a" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Card 
      className="chart-card" 
      title={
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Title level={5} style={{ margin: 0 }}>年度收支汇总</Title>
          </Col>
          <Col>
            <Select
              value={selectedYear}
              onChange={onYearChange}
              disabled={loading}
              style={{ width: 120 }}
              size={isMobile ? "small" : "default"}
            >
              {yearOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
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
      {/* 年度汇总统计 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={24} md={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
            <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
              {formatCurrency(summary.totalIncome)}
            </Title>
            <Text type="secondary">年度总收入</Text>
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #f5222d' }}>
            <Title level={4} style={{ color: '#f5222d', margin: 0 }}>
              {formatCurrency(summary.totalExpense)}
            </Title>
            <Text type="secondary">年度总支出</Text>
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
            <Text type="secondary">年度结余</Text>
          </Card>
        </Col>
      </Row>
      
      {/* 月度明细图表 */}
      <Card title={`${selectedYear}年各月收支明细`} size="small">
        {renderChartContent()}
      </Card>
    </Card>
  );
});

YearlySummary.displayName = 'YearlySummary';

export default YearlySummary;