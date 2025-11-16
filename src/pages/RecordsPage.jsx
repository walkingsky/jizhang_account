import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, message, Typography, Card, Row, Col, InputNumber, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { recordAPI, categoryAPI } from '../services/apiService'
import { debounce, handleError } from '../utils/optimizationUtils'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { Item } = Form

const RecordsPage = () => {
  const [records, setRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [incomeCategories, setIncomeCategories] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  // 使用标准的Form.useForm方式初始化表单
  const [form] = Form.useForm()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState(null)

  // 获取分类数据 - 使用useCallback优化
  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryAPI.getCategories()
      setCategories(data)
      // 分离收入和支出分类，提高渲染性能
      setIncomeCategories(data.filter(cat => cat.type === 'income'))
      setExpenseCategories(data.filter(cat => cat.type === 'expense'))
    } catch (error) {
      const errorMsg = handleError(error, '获取分类失败')
      message.error(errorMsg)
    }
  }, [])

  // 获取记账记录 - 使用useCallback优化
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      let params = {}
      
      // 添加筛选条件
      if (filterType !== 'all') params.type = filterType
      if (filterCategory !== 'all') params.category = filterCategory
      if (filterDateRange) {
        params.startDate = filterDateRange[0].format('YYYY-MM-DD')
        params.endDate = filterDateRange[1].format('YYYY-MM-DD')
      }
      if (searchTerm) params.search = searchTerm.trim()
      
      const data = await recordAPI.getRecords(params)
      // 确保数据格式正确
      if (Array.isArray(data)) {
        setRecords(data)
      } else if (data.data) {
        setRecords(data.data)
      } else {
        setRecords([])
      }
    } catch (error) {
      const errorMsg = handleError(error, '获取记录失败')
      message.error(errorMsg)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [filterType, filterCategory, filterDateRange, searchTerm])

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCategories()
    fetchRecords()
  }, [fetchCategories, fetchRecords])

  // 筛选条件变化时重新获取数据
  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // 防抖搜索 - 使用优化工具函数
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setSearchTerm(value)
    }, 500),
    []
  )

  // 打开添加/编辑模态框
  const showModal = useCallback((record = null) => {
    setEditingRecord(record)
    if (record) {
      form.setFieldsValue({
        ...record,
        date: dayjs(record.date)
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        date: dayjs(),
        type: 'expense'
      })
    }
    setIsModalVisible(true)
  }, [form])

  // 关闭模态框
  const handleCancel = useCallback(() => {
    setIsModalVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }, [form])

  // 提交表单 - 添加数据验证和加载状态
  const handleSubmit = useCallback(async (values) => {
    setSubmitting(true)
    try {
      // 数据验证
      if (!values.amount || parseFloat(values.amount) <= 0) {
        message.error('请输入有效的金额')
        return
      }

      if (!values.date) {
        message.error('请选择日期')
        return
      }

      const recordData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        amount: Number(values.amount),
        description: values.description?.trim() || ''
      }

      if (editingRecord) {
        // 编辑现有记录 - 确保Promise正确返回
        await recordAPI.updateRecord(editingRecord.id, recordData)
        message.success('更新成功')
      } else {
        // 添加新记录
        await recordAPI.createRecord(recordData)
        message.success('添加成功')
      }

      handleCancel()
      // 确保在数据更新后再刷新
      await fetchRecords()
    } catch (error) {
      const errorMsg = handleError(error, editingRecord ? '更新失败' : '添加失败')
      message.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }, [editingRecord, handleCancel, fetchRecords])

  // 删除记录 - 添加错误处理优化
  const handleDelete = useCallback((record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这笔记录吗？\n${record.description || '无描述'}\n金额：${record.amount} 元`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await recordAPI.deleteRecord(record.id)
          message.success('删除成功')
          fetchRecords()
        } catch (error) {
          const errorMsg = handleError(error, '删除失败')
          message.error(errorMsg)
        }
      }
    })
  }, [fetchRecords])

  // 获取当前表单对应的分类选项
  const getCurrentCategories = (formType) => {
    if (formType === 'income') {
      return incomeCategories
    }
    return expenseCategories
  }

  // 表格列配置 - 使用useMemo优化
  const columns = useMemo(() => [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      ellipsis: true,
      responsive: ['md']
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: '收入', value: 'income' },
        { text: '支出', value: 'expense' }
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <span className={`${type === 'income' ? 'text-success' : 'text-danger'}`}>
          {type === 'income' ? '收入' : '支出'}
        </span>
      ),
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      filters: categories.map(cat => ({ text: cat.name, value: cat.id })),
      onFilter: (value, record) => record.category === value,
      render: (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : '未分类';
      },
      ellipsis: true,
      responsive: ['md']
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount, record) => (
        <span style={{ fontWeight: 'bold', color: record.type === 'income' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'income' ? '+' : '-'}{amount.toFixed(2)} 元
        </span>
      ),
      ellipsis: true
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg']
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
            size="small"
          >
            删除
          </Button>
        </Space>
      )
    }
  ], [categories, showModal, handleDelete])

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>记账记录</Title>
        <Text type="secondary">管理您的收支记录，包括添加、编辑、删除等操作。</Text>
      </div>

      {/* 筛选和搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            <Select 
              placeholder="全部类型" 
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
            >
              <Option value="all">全部类型</Option>
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            <Select 
              placeholder="全部分类" 
              style={{ width: '100%' }}
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <Option value="all">全部分类</Option>
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <DatePicker.RangePicker 
              style={{ width: '100%' }}
              value={filterDateRange}
              onChange={setFilterDateRange}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col xs={24} sm={16} md={12} lg={6} xl={6}>
            <Input.Search
              placeholder="搜索描述"
              allowClear
              value={searchTerm}
              onChange={(e) => debouncedSearch(e.target.value)}
              onSearch={(value) => setSearchTerm(value)}
            />
          </Col>
          <Col xs={24} sm={8} md={4} lg={4} xl={2}>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilterType('all')
                setFilterCategory('all')
                setFilterDateRange(null)
                setSearchTerm('')
              }}
              style={{ width: '100%' }}
              loading={loading}
            >
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 记录列表 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加记录
          </Button>
        </div>
        
        <Spin spinning={loading} tip="数据加载中...">
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            locale={{
              emptyText: '暂无记录',
              filterConfirm: '确定',
              filterReset: '重置'
            }}
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </div>

      {/* 添加/编辑记录模态框 */}
      {isModalVisible && (
        <Modal
          title={editingRecord ? '编辑记录' : '添加记录'}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={window.innerWidth < 768 ? '90%' : 600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}>
            <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Item 
                label="日期" 
                name="date"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Item>
            </Col>
            <Col xs={24} sm={12}>
              <Item 
                label="类型" 
                name="type"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select 
                  placeholder="选择收入或支出"
                  onChange={(value) => {
                    // 类型改变时，清空分类选择
                    form.setFieldValue('category', undefined)
                  }}
                >
                  <Option value="income">收入</Option>
                  <Option value="expense">支出</Option>
                </Select>
              </Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Item 
                label="分类" 
                name="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  {getCurrentCategories(form.getFieldValue('type'))?.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Item>
            </Col>
            <Col xs={24} sm={12}>
              <Item 
                label="金额" 
                name="amount"
                rules={[
                  { required: true, message: '请输入金额' },
                  {
                    validator: (_, value) => {
                      if (value && parseFloat(value) <= 0) {
                        return Promise.reject('金额必须大于0')
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="0.00" 
                    precision={2} 
                    min={0.01} 
                  />
                  <span>元</span>
                </Space.Compact>
              </Item>
            </Col>
          </Row>
          
          <Item 
            label="描述" 
            name="description"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="可选，添加备注说明" 
              maxLength={200}
              showCount
            />
          </Item>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16, gap: 12 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={submitting}
            >
              {editingRecord ? '更新' : '添加'}
            </Button>
          </div>
          </Form>
        </Modal>
      )}
    </div>
  )
}

export default RecordsPage