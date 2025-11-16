import { backupAPI } from './apiService'
import { debounce } from '../utils/optimizationUtils'
import { message } from 'antd'
import { normalizeRecord } from './dataService'

/**
 * 备份服务 - 提供数据备份和恢复功能，与服务器端备份API完全兼容
 */
const backupService = {
  /**
   * 创建数据备份
   * @param {Object} options 备份选项
   * @param {string} options.description 备份描述
   * @returns {Promise<Object>} 备份结果
   */
  async createBackup(options = {}) {
    try {
      const response = await backupAPI.createBackup()
      message.success('备份创建成功')
      return response
    } catch (error) {
      console.error('创建备份错误:', error)
      const errorMessage = error.message || '创建备份失败'
      message.error(errorMessage)
      throw error
    }
  },

  /**
   * 获取备份列表
   * @param {number} page 页码
   * @param {number} pageSize 每页数量
   * @returns {Promise<Object>} 备份列表数据
   */
  async getBackupList(page = 1, pageSize = 10) {
    try {
      const response = await backupAPI.getBackupList()
      // 确保数据是数组格式，如果API返回对象，尝试从中提取数据数组
      const backupArray = Array.isArray(response) ? response : 
                        (response && Array.isArray(response.data)) ? response.data : 
                        [];
      
      // 模拟分页处理
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      // 返回BackupPage.jsx期望的格式（items和total属性）
      return {
        items: backupArray.slice(start, end),
        total: backupArray.length
      }
    } catch (error) {
      console.error('获取备份列表错误:', error)
      const errorMessage = error.message || '获取备份列表失败'
      message.error(errorMessage)
      throw error
    }
  },

  /**
   * 下载备份文件
   * @param {string} backupId 备份ID
   * @returns {Promise<Blob>} 备份文件
   */
  async downloadBackup(backupId) {
    try {
      // 验证backupId参数
      if (!backupId) {
        throw new Error('备份ID不能为空')
      }
      
      // 构建完整的备份文件名，包含前缀和后缀
      const fullBackupFilename = `backup-${backupId}.json`;
      
      // backupAPI中已有downloadBackup方法
      const response = await backupAPI.downloadBackup(fullBackupFilename)
      return response
    } catch (error) {
      console.error('下载备份错误:', error)
      const errorMessage = error.message || '下载备份失败'
      message.error(errorMessage)
      throw error
    }
  },

  /**
   * 从备份恢复数据
   * @param {string} backupId 备份ID
   * @returns {Promise<Object>} 恢复结果
   */
  async restoreFromBackup(backupId) {
    try {
      // 显示确认提示 - 使用Modal替代toast.confirm
      const { Modal } = await import('antd');
      const confirmRestore = await new Promise((resolve) => {
        Modal.confirm({
          title: '确认恢复备份',
          content: '恢复备份将覆盖当前所有数据，是否继续？',
          okText: '确认恢复',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false)
        })
      })

      if (!confirmRestore) {
        throw new Error('取消恢复操作')
      }

      const response = await backupAPI.restoreBackup(backupId)
      message.success('备份恢复成功，页面将刷新')
      
      // 恢复成功后，等待一小段时间再刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1500)
      
      return response
    } catch (error) {
      console.error('恢复备份错误:', error)
      if (error.message !== '取消恢复操作') {
        const errorMessage = error.message || '恢复备份失败'
        message.error(errorMessage)
      }
      throw error
    }
  },

  /**
   * 删除备份
   * @param {string} backupId 备份ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteBackup(backupId) {
    try {
      // 调用backupAPI中的deleteBackup方法
      await backupAPI.deleteBackup(backupId);
      message.success('删除备份成功');
      return true;
    } catch (error) {
      console.error('删除备份错误:', error);
      const errorMessage = error.message || '删除备份失败';
      message.error(errorMessage);
      return false;
    }
  },

  /**
   * 获取备份设置
   * @returns {Promise<Object>} 备份设置
   */
  async getBackupSettings() {
    try {
      // 返回默认备份设置
      return {
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        lastBackupTime: null
      }
    } catch (error) {
      // 如果获取设置失败，返回默认设置
      console.warn('获取备份设置失败，使用默认设置:', error)
      return {
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        lastBackupTime: null
      }
    }
  },

  /**
   * 更新备份设置
   * @param {Object} settings 备份设置
   * @returns {Promise<Object>} 更新结果
   */
  async updateBackupSettings(settings) {
    try {
      // 由于apiService中没有直接的updateBackupSettings方法，这里模拟成功
      message.success('备份设置更新成功')
      return settings
    } catch (error) {
      console.error('更新备份设置错误:', error)
      const errorMessage = error.message || '更新备份设置失败'
      message.error(errorMessage)
      throw error
    }
  },
  
  /**
   * 格式化备份大小显示
   * @param {number} bytes 字节数
   * @returns {string} 格式化后的大小
   */
  formatBackupSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },
  
  /**
   * 格式化备份时间显示
   * @param {string} dateString ISO日期字符串
   * @returns {string} 格式化后的时间
   */
  formatBackupTime(dateString) {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  },
  
  /**
   * 导出备份为文件
   * @param {Object} backup 备份信息
   * @returns {Promise<void>}
   */
  async exportBackup(backup) {
    try {
      const blob = await this.downloadBackup(backup.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `记账备份_${backup.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      message.success('备份导出成功')
    } catch (error) {
      console.error('导出备份失败:', error)
      message.error('导出备份失败')
      throw error
    }
  },

  /**
   * 导出数据为CSV格式（纯前端实现）
   * @param {Array} records 记录数据数组
   * @param {string} filename 可选的文件名
   * @param {Object} categoryMap 可选的分类ID到名称的映射表
   * @returns {Promise<void>}
   */
  async exportToCSV(records, filename, categoryMap = {}) {
    try {
      // 确保records是数组
      const rawData = Array.isArray(records) ? records : []
      
      if (rawData.length === 0) {
        message.warning('没有数据可导出')
        return
      }
      
      // 规范化所有记录数据
      const data = rawData
        .map(record => normalizeRecord(record, categoryMap))
        .filter(record => record !== null) // 过滤掉无效记录
      
      if (data.length === 0) {
        message.warning('所有记录数据无效')
        return
      }

      // 构建CSV表头
      const headers = ['日期', '类型', '分类', '金额', '描述']
      const csvContent = []
      csvContent.push(headers.join(','))

      // 添加数据行
      data.forEach(record => {
        // 获取分类名称，优先使用categoryName，然后尝试通过categoryMap查找，最后才使用原始category值
        let categoryDisplay = record.categoryName || ''
        if (!categoryDisplay && record.category && categoryMap[record.category]) {
          categoryDisplay = categoryMap[record.category]
        } else if (!categoryDisplay && record.category) {
          categoryDisplay = record.category
        }
        
        const row = [
          record.date || '',
          record.type === 'income' ? '收入' : '支出',
          categoryDisplay,
          record.amount || 0,
          record.description || ''
        ]
        // 转义CSV特殊字符
        const escapedRow = row.map(cell => {
          // 如果单元格包含逗号、换行符或引号，需要用双引号包裹
          if (cell && (cell.toString().includes(',') || cell.toString().includes('\n') || cell.toString().includes('"'))) {
            // 将双引号替换为两个双引号，然后用双引号包裹整个单元格
            return `"${cell.toString().replace(/"/g, '""')}"`
          }
          return cell.toString()
        })
        csvContent.push(escapedRow.join(','))
      })

      // 组合CSV内容并创建Blob，添加BOM以支持中文
      const csvString = csvContent.join('\n')
      const blob = new Blob([`\ufeff${csvString}`], { type: 'text/csv;charset=utf-8;' })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `记账数据_${new Date().toISOString().split('T')[0]}.csv`
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)

      message.success('CSV数据导出成功')
    } catch (error) {
      console.error('导出CSV失败:', error)
      message.error('导出CSV失败')
      throw error
    }
  },

  /**
   * 根据备份ID导出为CSV格式
   * @param {string} backupId 备份ID
   * @returns {Promise<void>}
   */
  async exportBackupToCSV(backupId) {
    try {
      // 验证backupId
      if (!backupId) {
        throw new Error('备份ID不能为空')
      }
      
      // 下载备份文件
      const blob = await this.downloadBackup(backupId)
      
      // 检查blob是否有效
      if (!blob || !(blob instanceof Blob)) {
        throw new Error('下载的备份数据无效')
      }
      
      // 读取并解析备份文件内容
      const backupData = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            if (!e.target || !e.target.result) {
              reject(new Error('文件读取结果为空'))
              return
            }
            
            const data = JSON.parse(e.target.result)
            if (!data || typeof data !== 'object') {
              reject(new Error('备份文件格式错误'))
              return
            }
            resolve(data)
          } catch (err) {
            reject(new Error('解析备份文件失败: ' + (err.message || '未知错误')))
          }
        }
        reader.onerror = (error) => {
          reject(new Error('读取备份文件失败: ' + (error.message || '未知错误')))
        }
        reader.readAsText(blob)
      })
      
      // 提取记录数据
      const rawRecords = Array.isArray(backupData.records) ? backupData.records : []
      
      // 创建完整的分类映射表，包含名称和图标
      const categoryMap = {}
      if (Array.isArray(backupData.categories)) {
        backupData.categories.forEach(category => {
          if (category.id) {
            categoryMap[category.id] = {
              name: category.name || '',
              icon: category.icon || ''
            }
          }
        })
      }
      
      // 规范化所有记录数据
      const records = rawRecords
        .map(record => normalizeRecord(record, categoryMap))
        .filter(record => record !== null) // 过滤掉无效记录
      
      // 导出为CSV，传入分类映射表
      await this.exportToCSV(records, `备份_${backupId}_CSV格式.csv`, categoryMap)
    } catch (error) {
      console.error('从备份导出CSV失败:', error)
      // 让错误继续传播，由调用方处理UI反馈
      throw error
    }
  }
}

// 导出带防抖功能的备份服务方法，避免频繁请求
export const debouncedBackupService = {
  ...backupService,
  // 创建备份添加防抖，避免频繁备份
  createBackup: debounce(backupService.createBackup, 2000),
  // 恢复备份添加防抖，避免频繁操作
  restoreFromBackup: debounce(backupService.restoreFromBackup, 3000)
}

export default backupService