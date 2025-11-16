import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Layout, ConfigProvider, Drawer, Button, Menu, message } from 'antd'
import { MenuOutlined, HomeOutlined, FileTextOutlined, BarChartOutlined, DatabaseOutlined, AppstoreOutlined } from '@ant-design/icons'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import RecordsPage from './pages/RecordsPage'
import StatisticsPage from './pages/StatisticsPage'
import CategoryPage from './pages/CategoryPage'
import BackupPage from './pages/BackupPage'
import NotFoundPage from './pages/NotFoundPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import './App.css'
import './styles/global.css'

// 移动菜单组件 - 正确使用useLocation钩子
function MobileMenu({ onClose }) {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'home';
  
  // 处理菜单项点击
  const handleMenuClick = () => {
    // 点击菜单项后立即关闭抽屉
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <Menu
      mode="inline"
      items={[
        {
          key: 'home',
          icon: <HomeOutlined />,
          label: <Link to="/">首页</Link>,
          onClick: handleMenuClick,
        },
        {
          key: 'record',
          icon: <FileTextOutlined />,
          label: <Link to="/records">记账记录</Link>,
          onClick: handleMenuClick,
        },
        {
          key: 'statistics',
          icon: <BarChartOutlined />,
          label: <Link to="/statistics">统计分析</Link>,
          onClick: handleMenuClick,
        },
        {
          key: 'categories',
          icon: <AppstoreOutlined />,
          label: <Link to="/categories">分类管理</Link>,
          onClick: handleMenuClick,
        },
        {
          key: 'backup',
          icon: <DatabaseOutlined />,
          label: <Link to="/backup">数据备份</Link>,
          onClick: handleMenuClick,
        },
      ]}
      selectedKeys={[currentPath]}
      style={{ height: '100%', borderRight: 0 }}
    />
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  // 处理设备宽度变化，实现响应式设计
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setSidebarOpen(false)
      }
    }
    handleResize() // 初始化
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 处理登录 - 由于token已经在apiService中设置，这里只需要更新状态
  const handleLogin = () => {
    try {
      // 验证localStorage中是否有token
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        return { success: true };
      } else {
        throw new Error('未找到登录凭证');
      }
    } catch (error) {
      console.error('登录状态更新错误:', error);
      return { success: false, error: error.message };
    }
  }

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setSidebarOpen(false)
  }

  // 切换侧边栏显示
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          {isLoggedIn && (
            <>
              <Header 
                isMobile={isMobile} 
                onToggleSidebar={toggleSidebar} 
                onLogout={handleLogout} 
              />
              {/* 移除多余的悬浮菜单按钮，保留Header中的菜单按钮 */}
              {sidebarOpen && isMobile && (
                <div
                  className="overlay show"
                  onClick={toggleSidebar}
                />
              )}
              <Drawer
                title="菜单导航"
                placement="left"
                onClose={toggleSidebar}
                open={sidebarOpen && isMobile}
                width={220}
                closable={true}
                styles={{ body: { padding: 0 } }}
              >
                <MobileMenu onClose={toggleSidebar} />
              </Drawer>
              {!isMobile && (
                <div className="sidebar">
                  <Sidebar 
                    isMobile={false} 
                    isOpen={true} 
                    onClose={() => {}} 
                  />
                </div>
              )}
            </>
          )}
          
          <div className={`content ${isLoggedIn && !isMobile ? 'content-shifted' : ''}`}>
            <Routes>
              <Route path="/login" element={
                isLoggedIn ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />}
              />
              <Route path="/" element={
                isLoggedIn ? <HomePage /> : <Navigate to="/login" />}
              />
              <Route path="/records" element={
                isLoggedIn ? <RecordsPage /> : <Navigate to="/login" />}
              />
              <Route path="/statistics" element={
                isLoggedIn ? <StatisticsPage /> : <Navigate to="/login" />}
              />
              <Route path="/categories" element={
                isLoggedIn ? <CategoryPage /> : <Navigate to="/login" />}
              />
              <Route path="/backup" element={
                isLoggedIn ? <BackupPage /> : <Navigate to="/login" />}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ConfigProvider>
  )
}

export default App