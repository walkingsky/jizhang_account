import React from 'react'
import { Menu, Layout } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { HomeOutlined, FileTextOutlined, BarChartOutlined, DatabaseOutlined, AppstoreOutlined } from '@ant-design/icons'
import './Sidebar.css'

const { Sider } = Layout
const { Item } = Menu

const Sidebar = ({ isMobile, isOpen, onClose }) => {
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: 'record',
      icon: <FileTextOutlined />,
      label: <Link to="/records">记账记录</Link>,
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">统计分析</Link>,
    },
    {
      key: 'categories',
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">分类管理</Link>,
    },
    {
      key: 'backup',
      icon: <DatabaseOutlined />,
      label: <Link to="/backup">数据备份</Link>,
    },
  ]

  return (
    <Sider
      width={220}
      theme="light"
      className={`sidebar ${isMobile ? 'mobile-sidebar' : ''} ${isOpen ? 'open' : 'closed'}`}
      breakpoint="md"
      collapsedWidth={0}
      onClose={onClose}
      trigger={null}
    >
      <Menu
        mode="inline"
        items={menuItems}
        defaultSelectedKeys={['home']}
        selectedKeys={[useLocation().pathname.split('/')[1] || 'home']}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  )
}

export default Sidebar