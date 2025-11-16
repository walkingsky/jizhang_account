import React from 'react'
import { Layout, Button, Typography, Space } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import './Header.css'

const { Header: AntHeader } = Layout
const { Title } = Typography

const Header = ({ isMobile = false, onToggleSidebar, onLogout }) => {
  return (
    <AntHeader className="header">
      <div className="header-content">
        <Space align="center" style={{ flex: 1 }}>
          {isMobile && (
            <Button 
              type="text" 
              className="menu-toggle"
              onClick={onToggleSidebar}
              icon={<MenuOutlined />}
              style={{ fontSize: '20px', marginRight: '16px' }}
            />
          )}
          
          <Title level={4} className="header-title">在线记账系统</Title>
        </Space>
        
        <div className="header-actions">
          <Button 
            type="primary" 
            danger 
            onClick={onLogout}
            className="logout-button"
          >
            退出登录
          </Button>
        </div>
      </div>
    </AntHeader>
  )
}

export default Header