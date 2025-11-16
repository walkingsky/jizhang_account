import React, { memo, useMemo } from 'react';
import { Card, Row, Col, DatePicker, Button, Spin, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { processMonthlyChartData, CHART_COLORS, formatCurrency, getBarChartConfig } from '../utils/chartUtils';
import useResponsive from '../hooks/useResponsive';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/**
 * 月度趋势图表组件
 * @param {Object} props 组件属性
 * @param {Array} props.data 月度数据
 * @param {boolean} props.loading 加载状态
 * @param {Function} props.onDateRangeChange 日期范围变化回调
 * @param {Function} props.onRefresh 刷新按钮点击回调
 * @param {Array} props.dateRange 当前日期范围
 * @param {string} props.error 错误信息
 */
const MonthChart = memo(({ data, loading, onDateRangeChange, onRefresh, dateRange, error }) => {
  const { isMobile, getResponsiveValue } = useResponsive();
  
  // 处理数据，确保即使没有数据也有默认值
  const processedData = useMemo(() => processMonthlyChartData(data || []), [data]);
  
  // 获取图表配置
  const chartConfig = useMemo(() => getBarChartConfig({ isMobile }), [isMobile]);
  
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
          <Spin size="large" />
          <Text style={{ marginTop: '16px' }}>数据加载中...</Text>
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
    
    if (processedData.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#999'
        }}>
          <Text>暂无月度数据</Text>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={processedData}
          margin={chartConfig.margin}
          barSize={chartConfig.barSize}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="monthLabel" 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 60 : 40}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          {chartConfig.showLegend && (
            <Legend 
              iconSize={10}
              wrapperStyle={{ fontSize: isMobile ? 12 : 14 }}
            />
          )}
          <Bar 
            dataKey="income" 
            name="收入" 
            radius={[4, 4, 0, 0]}
            fill={CHART_COLORS.income} // 直接设置条形颜色，确保图例颜色正确
          />
          <Bar 
            dataKey="expense" 
            name="支出" 
            radius={[4, 4, 0, 0]}
            fill={CHART_COLORS.expense} // 直接设置条形颜色，确保图例颜色正确
          />
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
            <Title level={5} style={{ margin: 0 }}>月度收支趋势</Title>
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
      extra={
        <div style={{ maxWidth: isMobile ? '100%' : 'auto' }}>
          <RangePicker 
            value={dateRange} 
            onChange={onDateRangeChange}
            disabled={loading}
            size={isMobile ? "small" : "default"}
            style={{ width: isMobile ? '100%' : 'auto' }}
          />
        </div>
      }
    >
      <div className="chart-container">
        {renderChartContent()}
      </div>
    </Card>
  );
});

MonthChart.displayName = 'MonthChart';

export default MonthChart;