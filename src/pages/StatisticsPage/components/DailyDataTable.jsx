import React, { memo, useMemo } from 'react';
import { Card, Row, Col, Select, Button, Spin, Typography, Table } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { formatCurrency, CHART_COLORS } from '../utils/chartUtils';
import { getRecentYears, getRecentMonths, processDailyData } from '../utils/dataFormatUtils';
import useResponsive from '../hooks/useResponsive';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 每日明细表格组件
 * @param {Object} props 组件属性
 * @param {Array} props.data 每日数据
 * @param {boolean} props.loading 加载状态
 * @param {Function} props.onYearChange 年份变化回调
 * @param {Function} props.onMonthChange 月份变化回调
 * @param {Function} props.onRefresh 刷新按钮点击回调
 * @param {number} props.selectedYear 选中的年份
 * @param {number} props.selectedMonth 选中的月份
 * @param {string} props.error 错误信息
 */
const DailyDataTable = memo(({ 
  data, 
  loading, 
  onYearChange, 
  onMonthChange, 
  onRefresh,
  selectedYear,
  selectedMonth,
  error 
}) => {
  const { isMobile } = useResponsive();
  
  // 获取年份和月份选项
  const yearOptions = useMemo(() => getRecentYears(5), []);
  const monthOptions = useMemo(() => getRecentMonths(12).slice(0, 12), []);
  
  // 处理每日数据
  const processedData = useMemo(() => processDailyData(data || []), [data]);
  
  // 表格列配置
  const columns = useMemo(() => [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (value) => {
        const date = new Date(value);
        return (
          <div>
            <Text>{`${date.getMonth() + 1}月${date.getDate()}日`}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]}
            </Text>
          </div>
        );
      },
      responsive: ['md']
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date_mobile',
      render: (value) => {
        const date = new Date(value);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      },
      responsive: ['xs']
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      align: 'right',
      render: (value) => (
        <Text style={{ color: CHART_COLORS.income, fontWeight: 'bold' }}>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: (a, b) => (a.income || 0) - (b.income || 0)
    },
    {
      title: '支出',
      dataIndex: 'expense',
      key: 'expense',
      align: 'right',
      render: (value) => (
        <Text style={{ color: CHART_COLORS.expense, fontWeight: 'bold' }}>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: (a, b) => (a.expense || 0) - (b.expense || 0)
    },
    {
      title: '结余',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      render: (value) => (
        <Text style={{ 
          color: value >= 0 ? CHART_COLORS.income : CHART_COLORS.expense, 
          fontWeight: 'bold' 
        }}>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: (a, b) => (a.balance || 0) - (b.balance || 0)
    }
  ], []);
  
  // 渲染表格内容
  const renderTableContent = () => {
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
    
    return (
      <Table 
        columns={columns} 
        dataSource={processedData} 
        rowKey="date" 
        pagination={{
          pageSize: isMobile ? 10 : 20,
          showSizeChanger: !isMobile,
          showQuickJumper: !isMobile,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: '暂无每日数据',
          filterConfirm: '确定',
          filterReset: '重置',
          pageSize: '每页条数',
          jumpTo: '跳至'
        }}
        size={isMobile ? 'small' : 'middle'}
        style={{ minHeight: '400px' }}
      />
    );
  };
  
  return (
    <Card 
      className="chart-card" 
      title={
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Title level={5} style={{ margin: 0 }}>每日收支明细</Title>
          </Col>
          <Col>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Select
                value={selectedYear}
                onChange={onYearChange}
                disabled={loading}
                style={{ width: 90 }}
                size={isMobile ? "small" : "default"}
              >
                {yearOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.value}年</Option>
                ))}
              </Select>
              <Select
                value={selectedMonth}
                onChange={onMonthChange}
                disabled={loading}
                style={{ width: 70 }}
                size={isMobile ? "small" : "default"}
              >
                {monthOptions.map(option => (
                  <Option key={option.month} value={option.month}>{option.month}月</Option>
                ))}
              </Select>
            </div>
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
      <div className="table-container">
        {renderTableContent()}
      </div>
    </Card>
  );
});

DailyDataTable.displayName = 'DailyDataTable';

export default DailyDataTable;