// 数据服务模块 - 使用localStorage实现数据持久化

// 存储键名常量
const STORAGE_KEYS = {
  RECORDS: 'accounting_records',
  CATEGORIES: 'accounting_categories'
}

// 初始化默认分类数据
const DEFAULT_CATEGORIES = [
  // 支出分类
  { id: '1', name: '餐饮', type: 'expense', icon: '🍽️' },
  { id: '2', name: '交通', type: 'expense', icon: '🚗' },
  { id: '3', name: '购物', type: 'expense', icon: '🛒' },
  { id: '4', name: '娱乐', type: 'expense', icon: '🎬' },
  { id: '5', name: '医疗', type: 'expense', icon: '🏥' },
  { id: '6', name: '教育', type: 'expense', icon: '📚' },
  { id: '7', name: '住房', type: 'expense', icon: '🏠' },
  { id: '8', name: '其他支出', type: 'expense', icon: '📝' },
  // 收入分类
  { id: '9', name: '工资', type: 'income', icon: '💼' },
  { id: '10', name: '奖金', type: 'income', icon: '🎁' },
  { id: '11', name: '投资', type: 'income', icon: '📈' },
  { id: '12', name: '副业', type: 'income', icon: '💵' },
  { id: '13', name: '其他收入', type: 'income', icon: '💰' }
]

// 初始化示例数据
const INITIAL_RECORDS = [
  {
    id: '1',
    amount: 58.5,
    type: 'expense',
    categoryId: '1',
    categoryName: '餐饮',
    categoryIcon: '🍽️',
    description: '午餐',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 昨天
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    amount: 20000,
    type: 'income',
    categoryId: '9',
    categoryName: '工资',
    categoryIcon: '💼',
    description: '月薪',
    date: new Date().toISOString().split('T')[0], // 今天
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    amount: 120,
    type: 'expense',
    categoryId: '2',
    categoryName: '交通',
    categoryIcon: '🚗',
    description: '地铁月卡',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 前天
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
]

// 初始化数据
const initializeData = () => {
  // 初始化分类数据
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES))
  }
  
  // 初始化记录数据
  if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS))
  }
}

// 记录相关操作
const recordService = {
  // 获取所有记录
  getAllRecords: () => {
    try {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS) || '[]')
      return records.sort((a, b) => new Date(b.date) - new Date(a.date))
    } catch (error) {
      console.error('获取记录失败:', error)
      return []
    }
  },
  
  // 根据ID获取记录
  getRecordById: (id) => {
    try {
      const records = recordService.getAllRecords()
      return records.find(record => record.id === id)
    } catch (error) {
      console.error('获取记录失败:', error)
      return null
    }
  },
  
  // 创建记录
  createRecord: (recordData) => {
    try {
      const records = recordService.getAllRecords()
      // 先创建基础记录，包含必要的系统字段
      const baseRecord = {
        id: Date.now().toString(),
        ...recordData,
        createdAt: new Date().toISOString()
      }
      
      // 获取所有分类以构建分类映射表
      const categories = categoryService.getAllCategories();
      const categoryMap = categories.reduce((map, category) => {
        map[category.id] = category;
        return map;
      }, {});
      
      // 使用normalizeRecord函数对记录进行规范化处理，确保包含完整字段
      const normalizedRecord = normalizeRecord(baseRecord, categoryMap);
      
      // 验证规范化后的记录是否有效
      if (!normalizedRecord) {
        throw new Error('无效的记录数据');
      }
      
      records.unshift(normalizedRecord) // 添加到开头
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records))
      return normalizedRecord
    } catch (error) {
      console.error('创建记录失败:', error)
      throw error
    }
  },
  
  // 更新记录
  updateRecord: (id, updatedData) => {
    try {
      const records = recordService.getAllRecords()
      const index = records.findIndex(record => record.id === id)
      
      if (index === -1) {
        throw new Error('记录不存在')
      }
      
      // 创建更新后的基础记录
      const baseRecord = {
        ...records[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      }
      
      // 获取所有分类以构建分类映射表
      const categories = categoryService.getAllCategories();
      const categoryMap = categories.reduce((map, category) => {
        map[category.id] = category;
        return map;
      }, {});
      
      // 使用normalizeRecord函数对更新后的记录进行规范化处理
      const normalizedRecord = normalizeRecord(baseRecord, categoryMap);
      
      // 验证规范化后的记录是否有效
      if (!normalizedRecord) {
        throw new Error('无效的记录数据');
      }
      
      records[index] = normalizedRecord
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records))
      return normalizedRecord
    } catch (error) {
      console.error('更新记录失败:', error)
      throw error
    }
  },
  
  // 删除记录
  deleteRecord: (id) => {
    try {
      let records = recordService.getAllRecords()
      records = records.filter(record => record.id !== id)
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records))
      return true
    } catch (error) {
      console.error('删除记录失败:', error)
      throw error
    }
  },
  
  // 根据日期范围获取记录
  getRecordsByDateRange: (startDate, endDate) => {
    try {
      const records = recordService.getAllRecords()
      return records.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate)
      })
    } catch (error) {
      console.error('获取记录失败:', error)
      return []
    }
  }
}

// 分类相关操作
const categoryService = {
  // 获取所有分类
  getAllCategories: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]')
    } catch (error) {
      console.error('获取分类失败:', error)
      return DEFAULT_CATEGORIES
    }
  },
  
  // 根据类型获取分类
  getCategoriesByType: (type) => {
    try {
      const categories = categoryService.getAllCategories()
      return categories.filter(category => category.type === type)
    } catch (error) {
      console.error('获取分类失败:', error)
      return []
    }
  },
  
  // 创建分类
  createCategory: (categoryData) => {
    try {
      const categories = categoryService.getAllCategories()
      const newCategory = {
        id: Date.now().toString(),
        ...categoryData
      }
      categories.push(newCategory)
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
      return newCategory
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  },
  
  // 更新分类
  updateCategory: (id, updatedData) => {
    try {
      const categories = categoryService.getAllCategories()
      const index = categories.findIndex(category => category.id === id)
      
      if (index === -1) {
        throw new Error('分类不存在')
      }
      
      categories[index] = { ...categories[index], ...updatedData }
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
      
      // 同时更新所有使用该分类的记录
      const records = recordService.getAllRecords()
      const updatedRecords = records.map(record => {
        if (record.categoryId === id) {
          return {
            ...record,
            categoryName: updatedData.name || record.categoryName,
            categoryIcon: updatedData.icon || record.categoryIcon
          }
        }
        return record
      })
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords))
      
      return categories[index]
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  },
  
  // 删除分类
  deleteCategory: (id) => {
    try {
      // 检查是否有记录使用该分类
      const records = recordService.getAllRecords()
      const hasRecords = records.some(record => record.categoryId === id)
      
      if (hasRecords) {
        throw new Error('该分类下还有记账记录，无法删除')
      }
      
      let categories = categoryService.getAllCategories()
      categories = categories.filter(category => category.id !== id)
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
      
      return true
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }
}

// 统计相关操作
const statisticsService = {
  // 按分类统计
  getStatisticsByCategory: (type, startDate, endDate) => {
    try {
      const records = recordService.getRecordsByDateRange(startDate, endDate)
      const filteredRecords = records.filter(record => record.type === type)
      
      const stats = {}
      filteredRecords.forEach(record => {
        if (!stats[record.categoryId]) {
          stats[record.categoryId] = {
            categoryId: record.categoryId,
            categoryName: record.categoryName,
            categoryIcon: record.categoryIcon,
            totalAmount: 0,
            count: 0
          }
        }
        stats[record.categoryId].totalAmount += record.amount
        stats[record.categoryId].count += 1
      })
      
      return Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount)
    } catch (error) {
      console.error('统计失败:', error)
      return []
    }
  },
  
  // 按日期统计
  getStatisticsByDate: (type, startDate, endDate, grouping = 'day') => {
    try {
      const records = recordService.getRecordsByDateRange(startDate, endDate)
      const filteredRecords = records.filter(record => record.type === type)
      
      const stats = {}
      filteredRecords.forEach(record => {
        let key
        const date = new Date(record.date)
        
        switch (grouping) {
          case 'week':
            const weekNumber = Math.ceil((date.getDate() + date.getDay()) / 7)
            key = `${date.getFullYear()}-W${weekNumber}`
            break
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            break
          case 'year':
            key = `${date.getFullYear()}`
            break
          default: // day
            key = record.date
        }
        
        if (!stats[key]) {
          stats[key] = 0
        }
        stats[key] += record.amount
      })
      
      // 转换为数组并排序
      return Object.entries(stats)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('统计失败:', error)
      return []
    }
  },
  
  // 获取总体统计
  getOverallStatistics: (startDate, endDate) => {
    try {
      const records = recordService.getRecordsByDateRange(startDate, endDate)
      
      let totalIncome = 0
      let totalExpense = 0
      let incomeCount = 0
      let expenseCount = 0
      
      records.forEach(record => {
        if (record.type === 'income') {
          totalIncome += record.amount
          incomeCount += 1
        } else {
          totalExpense += record.amount
          expenseCount += 1
        }
      })
      
      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeCount,
        expenseCount,
        totalRecords: records.length
      }
    } catch (error) {
      console.error('统计失败:', error)
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
        totalRecords: 0
      }
    }
  }
}

// 初始化数据
initializeData()

/**
 * 规范化记录数据结构
 * @param {Object} record 原始记录
 * @param {Object} categoryMap 分类映射表
 * @returns {Object} 规范化后的记录
 */
const normalizeRecord = (record, categoryMap = {}) => {
  // 确保record是对象
  if (!record || typeof record !== 'object') {
    return null;
  }
  
  // 创建规范化记录对象，保留所有原始字段
  const normalized = { ...record };
  
  // 确保必要字段存在
  normalized.id = normalized.id || Date.now().toString();
  normalized.date = normalized.date || new Date().toISOString().split('T')[0];
  normalized.type = normalized.type || 'expense';
  normalized.amount = normalized.amount || 0;
  normalized.description = normalized.description || '';
  normalized.createdAt = normalized.createdAt || new Date().toISOString();
  
  // 处理分类信息
  // 如果只有category字段，将其作为categoryId
  if (record.category && !record.categoryId) {
    normalized.categoryId = record.category;
  }
  
  // 如果有categoryId且在categoryMap中存在，补充分类名称和图标
  if (normalized.categoryId && categoryMap[normalized.categoryId]) {
    const categoryInfo = categoryMap[normalized.categoryId];
    normalized.categoryName = normalized.categoryName || categoryInfo.name;
    normalized.categoryIcon = normalized.categoryIcon || categoryInfo.icon;
  }
  
  // 确保category字段始终存在，使用categoryId作为备选
  normalized.category = normalized.category || normalized.categoryId || '';
  
  return normalized;
};

export {
  recordService,
  categoryService,
  statisticsService,
  normalizeRecord
}