import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Space, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { authAPI } from '../services/apiService'

const { Title, Paragraph } = Typography
const { Item } = Form

const LoginPage = ({ onLogin }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  
  // 登录凭据现在通过环境变量配置，默认值为admin/admin123

  const onFinish = async (values) => {
    const { username, password } = values
    setLoading(true)
    
    try {
      console.log('开始登录，用户名:', username)
      // 使用API服务登录
      const response = await authAPI.login(username, password)
      console.log('登录响应:', response)
      
      // 安全检查，确保response是对象且有success属性
      if (response && typeof response === 'object' && response.success) {
        message.success('登录成功')
        console.log('调用onLogin函数')
        onLogin()
      } else {
        console.log('登录失败，响应:', response)
        message.error(response?.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误异常:', error)
      message.error(error.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = () => {
    message.error('请填写完整的登录信息')
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <Card 
        style={{ 
          width: 400, 
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            在线记账系统
          </Title>
          <Paragraph style={{ color: '#666' }}>
            请使用固定账户登录
          </Paragraph>
        </div>
        
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="请输入用户名" 
              autoComplete="username"
            />
          </Item>
          
          <Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Item>
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
                   
            <Space size="middle">
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                style={{ width: '100%' }}
                loading={loading}
              >
                登录
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage