import React, { useState, useEffect, useCallback } from 'react'
import { Button, Table, message, Modal, Typography, Card, Space, Spin, List, Popconfirm } from 'antd'
import { DownloadOutlined, DatabaseOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined, SettingOutlined, FileTextOutlined, FileExcelOutlined } from '@ant-design/icons'
import { handleError } from '../utils/optimizationUtils'
import backupService from '../services/backupService'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { confirm } = Modal

const BackupPage = () => {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [exportingBackupToCSV, setExportingBackupToCSV] = useState(false)
  const [backupSettings, setBackupSettings] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)

  // 获取备份列表
  const fetchBackups = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const result = await backupService.getBackupList(page, 10)
      setBackups(result.items || [])
      setTotal(result.total || 0)
      setCurrentPage(page)
    } catch (error) {
      const errorMsg = handleError(error, '获取备份列表失败')
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取备份设置
  const fetchBackupSettings = useCallback(async () => {
    try {
      const settings = await backupService.getBackupSettings()
      setBackupSettings(settings)
    } catch (error) {
      console.warn('获取备份设置失败:', error)
    }
  }, [])

  // 组件挂载时获取备份列表和设置
  useEffect(() => {
    fetchBackups()
    fetchBackupSettings()
  }, [fetchBackups, fetchBackupSettings])

  // 创建手动备份
  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true)
      await backupService.createBackup()
      message.success('备份创建成功')
      fetchBackups() // 刷新备份列表
      fetchBackupSettings() // 刷新备份设置（更新最后备份时间）
    } catch (error) {
      const errorMsg = handleError(error, '备份创建失败')
      message.error(errorMsg)
    } finally {
      setCreatingBackup(false)
    }
  }


  // 将指定备份导出为CSV
  const handleExportBackupToCSV = async (backupId) => {
    try {
      setExportingBackupToCSV(true)
      message.loading('正在处理，请稍候...')
      await backupService.exportBackupToCSV(backupId)
      message.success('CSV导出成功')
    } catch (error) {
      const errorMsg = handleError(error, '从备份导出CSV失败')
      message.error(errorMsg)
    } finally {
      setExportingBackupToCSV(false)
      message.destroy()
    }
  }

  // 删除备份
  const handleDeleteBackup = async (backupId) => {
    try {
      setLoading(true)
      await backupService.deleteBackup(backupId)
      message.success('备份删除成功')
      fetchBackups(currentPage)
    } catch (error) {
      const errorMsg = handleError(error, '备份删除失败')
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 恢复备份
  const handleRestoreBackup = (backup) => {
    confirm({
      title: '确认恢复数据',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>此操作将覆盖当前所有数据，恢复到 {dayjs(backup.createdAt).format('YYYY-MM-DD HH:mm:ss')} 的备份状态。</p>
          <p style={{ color: '#f5222d', marginTop: '8px' }}>请确保在恢复前已创建当前数据的备份！</p>
        </div>
      ),
      onOk: async () => {
        try {
          setRestoringBackup(true)
          await backupService.restoreFromBackup(backup.id)
          message.success('数据恢复成功，请刷新页面以查看更新后的数据')
          fetchBackups() // 刷新备份列表
        } catch (error) {
          const errorMsg = handleError(error, '数据恢复失败')
          message.error(errorMsg)
        } finally {
          setRestoringBackup(false)
        }
      },
    })
  }

  // 下载备份
  const handleDownloadBackup = async (backup) => {
    try {
      const blob = await backupService.downloadBackup(backup.filename)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `记账备份_${dayjs(backup.createdAt).format('YYYY-MM-DD_HH-mm-ss')}.json`
      document.body.appendChild(link)
      link.click()
      
      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      message.success('备份下载成功')
    } catch (error) {
      const errorMsg = handleError(error, '备份下载失败')
      message.error(errorMsg)
    }
  }

  // 格式化备份类型
  const formatBackupType = (type) => {
    const typeMap = {
      'manual': '手动备份',
      'auto': '自动备份'
    }
    return typeMap[type] || type
  }

  // 表格列配置
  const columns = [
    {
      title: '备份时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '备份类型',
      dataIndex: 'type',
      key: 'type',
      render: formatBackupType
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || '无描述'
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        if (!size) return '-'
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
        return `${(size / (1024 * 1024)).toFixed(2)} MB`
      }
    },
    {title: '操作',
      key: 'action',
      render: (_, record) => (
          <Space size="middle">
            <Button 
              type="link" 
              icon={<ReloadOutlined />}
              onClick={() => handleRestoreBackup(record)}
              loading={restoringBackup}
            >
              恢复
            </Button>
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadBackup(record)}
            >
              下载
            </Button>
            <Button 
              type="link" 
              icon={<FileExcelOutlined />}
              onClick={() => handleExportBackupToCSV(record.id)}
              loading={exportingBackupToCSV}
            >
              导出CSV
            </Button>
            <Popconfirm
              title="确认删除"
              description="确定要删除此备份吗？此操作不可撤销。"
              okText="确定"
              cancelText="取消"
              onConfirm={() => handleDeleteBackup(record.id)}
            >
              <Button 
                type="link" 
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
    },
  ]

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>数据备份管理</Title>
        <Text type="secondary">系统会每天凌晨2点自动备份数据，您也可以手动创建备份。</Text>
      </div>

      {/* 备份统计信息 */}
      {backupSettings && (
        <Card className="backup-stats" style={{ marginBottom: 20 }}>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                {backupSettings.autoBackup ? (
                  <SettingOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                ) : (
                  <SettingOutlined style={{ color: '#d9d9d9', fontSize: 24 }} />
                )}
              </div>
              <div className="stat-content">
                <Text strong className="stat-title">自动备份</Text>
                <Text className="stat-description">
                  {backupSettings.autoBackup ? '已启用' : '未启用'}
                </Text>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 24 }} />
              </div>
              <div className="stat-content">
                <Text strong className="stat-title">备份频率</Text>
                <Text className="stat-description">
                  {{'daily': '每天', 'weekly': '每周', 'monthly': '每月'}[backupSettings.backupFrequency] || '未设置'}
                </Text>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 24 }} />
              </div>
              <div className="stat-content">
                <Text strong className="stat-title">保留天数</Text>
                <Text className="stat-description">
                  {backupSettings.backupRetention || 30} 天
                </Text>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 24 }} />
              </div>
              <div className="stat-content">
                <Text strong className="stat-title">最后备份</Text>
                <Text className="stat-description">
                  {backupSettings.lastBackupTime
                    ? dayjs(backupSettings.lastBackupTime).format('YYYY-MM-DD HH:mm')
                    : '从未备份'
                  }
                </Text>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Text strong>备份文件列表</Text>
          <Space>
            <Button 
              type="primary" 
              icon={<DatabaseOutlined />}
              onClick={handleCreateBackup}
              loading={creatingBackup}
            >
              立即创建备份
            </Button>
          </Space>
        </div>

        {loading && backups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="加载备份列表中..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={backups}
            rowKey="id"
            pagination={{
              current: currentPage,
              total,
              onChange: fetchBackups,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个备份`,
              pageSize: 10
            }}
            locale={{
              emptyText: '暂无备份文件',
              filterConfirm: '确定',
              filterReset: '重置'
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <div style={{ marginTop: 24, padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={5}>备份说明</Title>
        <ul style={{ marginLeft: 24, color: '#666' }}>
          <li>系统支持手动备份和自动备份功能</li>
          <li>手动备份可立即创建当前数据的快照</li>
          <li>建议定期下载备份文件到本地保存，以防数据丢失</li>
          <li>恢复备份会覆盖当前所有数据，请务必谨慎操作</li>
          <li>请确保在恢复前已创建当前数据的备份，避免数据丢失</li>
        </ul>
      </div>

      {/* 备份设置模态框已移除 */}

      <style jsx="true">{
        `.page-container {
          padding: 0 16px;
        }
        .backup-stats {
          margin-bottom: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        .stat-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          background-color: #fafafa;
          transition: background-color 0.3s;
        }
        .stat-item:hover {
          background-color: #f0f0f0;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          background-color: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .stat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stat-title {
          font-size: 16px;
          margin-bottom: 4px;
          color: #333;
        }
        .stat-description {
          font-size: 14px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        @media (max-width: 575px) {
          .page-container {
            padding: 0 8px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .stat-item {
            padding: 12px;
          }
          .stat-icon {
            width: 40px;
            height: 40px;
            margin-right: 12px;
          }
          .stat-title {
            font-size: 14px;
          }
          .stat-description {
            font-size: 12px;
          }
        }
        
        @media (min-width: 576px) and (max-width: 767px) {
          .page-container {
            padding: 0 12px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }`
      }</style>
    </div>
  )
}

export default BackupPage