import React from 'react'
import { Result, Button, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

const NotFoundPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        }
      />
      <div style={{ marginTop: 24, textAlign: 'center', maxWidth: 600 }}>
        <Paragraph type="secondary">
          可能的原因：
        </Paragraph>
        <ul style={{ color: '#999', textAlign: 'left', display: 'inline-block' }}>
          <li>您输入的URL有误</li>
          <li>该页面已被删除</li>
          <li>您没有权限访问此页面</li>
        </ul>
      </div>
    </div>
  )
}

export default NotFoundPage