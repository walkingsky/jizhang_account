import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, List, Button, Typography, Tag, message, Spin } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, FileTextOutlined, PieChartOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { recordAPI, statisticsAPI, categoryAPI } from '../services/apiService'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const HomePage = () => {
  const [statistics, setStatistics] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    recordCount: 0
  })
  const [recentRecords, setRecentRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeMonth, setActiveMonth] = useState(dayjs().format('YYYY-MM'))

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      const categoriesData = await categoryAPI.getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('获取分类数据失败:', error)
    }
  }

  // 获取首页数据
  const fetchHomeData = async () => {
    try {
      setLoading(true)
      
      // 获取当月统计数据
      const stats = await statisticsAPI.getMonthStatistics(activeMonth)
      setStatistics(stats)
      
      // 获取指定月份的最近记录，添加月份过滤条件
      const startDate = `${activeMonth}-01`;
      const endDate = dayjs(activeMonth).endOf('month').format('YYYY-MM-DD');
      
      const records = await recordAPI.getRecords({ 
        limit: 5, 
        sort: 'desc',
        startDate: startDate,
        endDate: endDate
      })
      setRecentRecords(records)
    } catch (error) {
      message.error('获取数据失败')
      console.error('获取首页数据错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 根据分类ID获取分类名称
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : '未分类'
  }

  // 组件挂载时获取分类数据
  useEffect(() => {
    fetchCategories()
  }, [])

  // 获取首页数据
  useEffect(() => {
    fetchHomeData()
  }, [activeMonth])

  // 切换月份
  const handleMonthChange = (month) => {
    setActiveMonth(month)
  }

  // 获取月份选择器选项
  const getMonthOptions = () => {
    const options = []
    const currentMonth = dayjs()
    
    // 生成最近6个月的选项
    for (let i = 0; i < 6; i++) {
      const month = currentMonth.subtract(i, 'month')
      const monthStr = month.format('YYYY-MM')
      const displayText = month.format('YYYY年MM月')
      options.push(
        <Button
          key={monthStr}
          onClick={() => handleMonthChange(monthStr)}
          type={activeMonth === monthStr ? 'primary' : 'default'}
          style={{ margin: '4px' }}
        >
          {displayText}
        </Button>
      )
    }
    
    return options
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ fontSize: '20px' }}>欢迎回来</Title>
        <Text type="secondary">查看您的记账概览和最近的记录。</Text>
      </div>

      {/* 月份选择器 */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <Text strong style={{ marginRight: 16 }}>选择月份：</Text>
        {getMonthOptions()}
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchHomeData}
          loading={loading}
          style={{ marginLeft: 16 }}
        >
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="当月收入"
              value={statistics.totalIncome}
              precision={2}
              valueStyle={{ color: '#3f8600', fontSize: '16px' }}
              prefix={<ArrowUpOutlined />}
              suffix="元"
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="当月支出"
              value={statistics.totalExpense}
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: '16px' }}
              prefix={<ArrowDownOutlined />}
              suffix="元"
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="当月结余"
              value={statistics.balance}
              precision={2}
              valueStyle={{ color: statistics.balance >= 0 ? '#3f8600' : '#cf1322', fontSize: '16px' }}
              suffix="元"
              titleStyle={{ fontSize: '12px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="当月记录"
              value={statistics.recordCount}
              suffix="笔"
              titleStyle={{ fontSize: '12px' }}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷功能和最近记录 */}
      <Row gutter={[8, 8]}>
        <Col xs={24} md={8}>
          <Card title="快捷功能" size="small" styles={{ body: { padding: '12px' } }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/records" style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '12px', 
                  borderRadius: '8px',
                  backgroundColor: '#f0f2f5',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}>
                  <FileTextOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: '8px' }} />
                  <Text strong style={{ fontSize: '14px' }}>添加记录</Text>
                </div>
              </Link>
              <Link to="/statistics" style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '12px', 
                  borderRadius: '8px',
                  backgroundColor: '#f0f2f5',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}>
                  <PieChartOutlined style={{ fontSize: 20, color: '#52c41a', marginRight: '8px' }} />
                  <Text strong style={{ fontSize: '14px' }}>查看统计</Text>
                </div>
              </Link>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={16}>
          <Card title="最近记账记录" size="small" extra={<Link to="/records">查看全部</Link>}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="small" />
              </div>
            ) : recentRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无记账记录
              </div>
            ) : (
              <List
                itemLayout="vertical"
                dataSource={recentRecords}
                renderItem={record => (
                  <List.Item
                    key={record.id}
                    extra={
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: record.type === 'income' ? '#52c41a' : '#ff4d4f'
                      }}>
                        {record.type === 'income' ? '+' : '-'}{record.amount.toFixed(2)} 元
                      </span>
                    }
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Tag color={record.type === 'income' ? 'green' : 'red'}>
                            {record.type === 'income' ? '收入' : '支出'}
                          </Tag>
                          <span style={{ marginLeft: '8px' }}>{getCategoryName(record.category)}</span>
                          <span style={{ marginLeft: 'auto', color: '#999' }}>
                            {dayjs(record.date).format('MM-DD')}
                          </span>
                        </div>
                      }
                      description={record.description || '无描述'}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Card style={{ marginTop: 24 }}>
        <Typography>
          <Title level={5}>记账小贴士</Title>
          <Paragraph type="secondary">
            1. 建议每天记录收支，养成良好的记账习惯
          </Paragraph>
          <Paragraph type="secondary">
            2. 定期查看统计分析，了解自己的消费习惯
          </Paragraph>
          <Paragraph type="secondary">
            3. 合理设置分类，便于后续数据分析
          </Paragraph>
          <Paragraph type="secondary">
            4. 不要忘记定期备份数据
          </Paragraph>
        </Typography>
      </Card>
    </div>
  )
}

export default HomePage