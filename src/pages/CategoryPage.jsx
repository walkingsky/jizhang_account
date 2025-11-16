import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Typography, Card, Tag, Space, Row, Col, Spin, Tooltip, Badge } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { categoryAPI } from '../services/apiService'
import { handleError } from '../utils/errorHandler'

const { Title, Text } = Typography
const { Option } = Select
const { Item } = Form

const CategoryPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false) // 用于按钮操作的加载状态
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [filterType, setFilterType] = useState('all')
  // 使用标准的Form.useForm方式初始化表单
  const [form] = Form.useForm()

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setLoading(true)
      
      // 直接从服务器获取数据
      const data = await categoryAPI.getAllCategories();
      setCategories(data);
      
    } catch (error) {
      handleError('获取分类数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选分类 - 使用useMemo优化过滤逻辑
  const filteredCategories = useMemo(() => {
    if (filterType === 'all') {
      return categories
    } else {
      return categories.filter(cat => cat.type === filterType)
    }
  }, [categories, filterType])
  
  // 兼容旧的筛选方法
  const filterCategories = (data, type) => {
    // 此函数保留用于向后兼容，但实际过滤通过useMemo完成
    if (type === 'all') {
      return data
    }
    return data.filter(cat => cat.type === type)
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadCategories()
  }, [])

  // 筛选类型变化
  useEffect(() => {
    filterCategories(categories, filterType)
  }, [filterType, categories])

  // 打开添加/编辑模态框
  const showModal = (category = null) => {
    setEditingCategory(category)
    if (category) {
      form.setFieldsValue(category)
    } else {
      form.resetFields()
      form.setFieldsValue({ type: 'expense' })
    }
    setIsModalVisible(true)
  }

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingCategory(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      setActionLoading(true)
      // 添加时间戳信息
      const submitValues = {
        ...values,
        updatedAt: new Date().toISOString(),
        ...(!editingCategory && { createdAt: new Date().toISOString() })
      }
      
      // 直接调用API
      if (editingCategory) {
        // 编辑现有分类
        await categoryAPI.updateCategory(editingCategory.id, submitValues)
        message.success('更新成功')
      } else {
        // 添加新分类
        await categoryAPI.createCategory(submitValues)
        message.success('添加成功')
      }
      
      handleCancel();
      // 直接刷新页面数据
      await loadCategories();
    } catch (error) {
      // 在线保存失败时，尝试离线保存
      if (navigator.onLine) {
        try {
          // 直接提示失败，移除对未导入syncService的使用
          message.warning('保存失败，请稍后重试');
          handleCancel();
        } catch (localError) {
          handleError(editingCategory ? '更新失败' : '添加失败', error);
        }
      } else {
        handleError(editingCategory ? '更新失败' : '添加失败', error);
      }
    } finally {
      setActionLoading(false)
    }
  }

  // 删除分类
  const handleDelete = useCallback(async (category) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类 "${category.name}" 吗？\n删除后，使用该分类的记录将保留，但分类信息将被移除。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setActionLoading(true)
          
          // 直接调用API删除
          await categoryAPI.deleteCategory(category.id)
          message.success('删除成功')
          
          // 重新加载数据
          loadCategories();
          
        } catch (error) {
          handleError('删除失败', error, { defaultMessage: error.response?.data?.error || '删除失败' });
        } finally {
          setActionLoading(false)
        }
      }
    })
  }, [loadCategories])

  // 表格列配置 - 增强功能和响应式设计
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          <Tag color={record.type === 'income' ? 'green' : 'red'}>
            {record.type === 'income' ? '收入' : '支出'}
          </Tag>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || <Text type="secondary">无描述</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      defaultSortOrder: 'descend',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => date ? new Date(date).toLocaleString() : <Text type="secondary">未知</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      responsive: ['md'],
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            loading={actionLoading}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
            loading={actionLoading}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 统计信息
  const categoryStats = useMemo(() => {
    const incomeCount = categories.filter(cat => cat.type === 'income').length
    const expenseCount = categories.filter(cat => cat.type === 'expense').length
    // 统计本地临时ID的分类数量（离线创建的）
    const pendingSyncCount = categories.filter(cat => cat.id && cat.id.startsWith('local_')).length
    return { 
      incomeCount, 
      expenseCount, 
      total: categories.length,
      pendingSyncCount
    }
  }, [categories])

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>
          <Space>
            分类管理
            <Tooltip title="分类数据存储在服务器端，支持多设备同步访问">
              <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
        </Title>
        <Text type="secondary">管理收入和支出的分类，支持添加、编辑和删除操作。</Text>
      </div>

      {/* 统计卡片 */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="stats-card">
              <Text>总收入分类</Text>
              <Title level={3}>{categoryStats.incomeCount}</Title>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="stats-card">
              <Text>总支出分类</Text>
              <Title level={3}>{categoryStats.expenseCount}</Title>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="stats-card">
              <Text>分类总数</Text>
              <Title level={3}>{categoryStats.total}</Title>
            </Card>
          </Col>
          {categoryStats.pendingSyncCount > 0 && (
            <Col xs={24}>
              <Badge.Ribbon text="待同步" color="orange" placement="start">
                <Card bordered={false} className="stats-card">
                  <Text type="warning">有 {categoryStats.pendingSyncCount} 个分类需要同步到服务器</Text>
                </Card>
              </Badge.Ribbon>
            </Col>
          )}
        </Row>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text strong>筛选类型：</Text>
            <Select 
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
            >
              <Option value="all">全部</Option>
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            loading={actionLoading}
          >
            添加分类
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Space>
              <Spin size="large" />
              <Text type="secondary">正在从服务器加载分类数据...</Text>
            </Space>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: '暂无分类数据',
              filterConfirm: '确定',
              filterReset: '重置'
            }}
            className="responsive-table"
          />
        )}
      </Card>

      {/* 分类说明 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={5}>分类说明</Title>
        <ul style={{ marginLeft: 24, color: '#666' }}>
          <li>收入类型的分类用于记录各种收入来源</li>
          <li>支出类型的分类用于记录各种支出用途</li>
          <li>系统会预置一些常用分类，您可以根据需要进行调整</li>
          <li>删除分类不会影响已有的记账记录，但会移除记录中的分类信息</li>
          <li>建议合理设置分类，以便更好地进行统计分析</li>
        </ul>
      </Card>

      {/* 添加/编辑分类模态框 */}
      {isModalVisible && (
        <Modal
          title={editingCategory ? '编辑分类' : '添加分类'}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={500}
          confirmLoading={actionLoading}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}>
            <Item 
            label="分类类型" 
            name="type"
            rules={[{ required: true, message: '请选择分类类型' }]}
          >
            <Select placeholder="选择分类类型">
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Item>
          
          <Item 
            label="分类名称" 
            name="name"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 20, message: '分类名称不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入分类名称" />
          </Item>
          
          <Item 
            label="描述" 
            name="description"
            rules={[
              { max: 100, message: '描述不能超过100个字符' }
            ]}
          >
            <Input.TextArea rows={3} placeholder="可选，添加分类描述" />
          </Item>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16, gap: 12 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingCategory ? '更新' : '添加'}
            </Button>
          </div>
          </Form>
        </Modal>
      )}
    </div>
  )
}

export default CategoryPage