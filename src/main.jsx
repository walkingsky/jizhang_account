import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// 全局配置dayjs使用中文语言包
dayjs.locale('zh-cn')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 使用ConfigProvider设置Ant Design组件的全局语言为中文 */}
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)