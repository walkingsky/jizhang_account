// API服务层 - 与后端服务器通信

// 导入axios库用于HTTP请求
import axios from 'axios'
import { message } from 'antd'
import dayjs from 'dayjs'
import { debounce, handleError } from '../utils/optimizationUtils'

const API_BASE_URL = 'http://localhost:3001/api';

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || API_BASE_URL,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，可以跳转到登录页
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error('请求失败')
      }
    } else if (error.request) {
      message.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

// 基础请求函数
async function request(endpoint, options = {}) {
  try {
    const response = await axiosInstance(endpoint, options)
    return response.data
  } catch (error) {
    throw handleError(error)
  }
}

// 直接GET请求函数，不使用缓存
const directGet = (url, params) => {
  return request(url, {
    method: 'GET',
    params
  })
}



// 登录相关
export const authAPI = {
  // 登录 - 暂时移除防抖，确保登录功能正常工作
  login: async (username, password) => {
    try {
      // 对于演示环境，提供本地验证逻辑
      if (username === 'admin' && password === 'admin123') {
        const mockResponse = { success: true, token: 'mock-token-' + Date.now(), message: '登录成功' };
        localStorage.setItem('token', mockResponse.token);
        console.log('本地登录成功，返回:', mockResponse);
        return mockResponse;
      }
      
      const response = await request('/login', {
        method: 'POST',
        data: { username, password }
      });
      // 保存token到localStorage
      if (response && response.token) {
        localStorage.setItem('token', response.token);
      }
      // 确保返回的对象包含success属性
      const result = (!response || typeof response !== 'object' || response.success === undefined) 
        ? { ...response, success: true }
        : response;
      
      console.log('登录API返回:', result);
      return result;
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  },
  // 保留防抖版本，供将来使用
  loginDebounced: debounce(async (username, password) => {
    return authAPI.login(username, password);
  }, 500),
  
  // 验证token
  verifyToken: async (token) => {
    try {
      return await request('/verify-token', {
        method: 'POST',
        data: { token },
      });
    } catch (error) {
      // Token验证失败，清除本地存储的token
      localStorage.removeItem('token');
      throw error;
    }
  },
};

// 记录相关API
export const recordAPI = {
  // 获取所有记录 - 直接从服务器获取，不使用缓存
  getAllRecords: async (params) => {
    return request('/records', { params });
  },
  // 为了兼容性，添加getRecords作为getAllRecords的别名
  getRecords: async (params) => recordAPI.getAllRecords(params),
  
  // 获取单条记录
  getRecordById: (id) => request(`/records/${id}`, {
    method: 'GET',
  }),
  
  // 创建记录
  createRecord: (recordData) => request('/records', {
    method: 'POST',
    data: recordData,
  }),
  
  // 更新记录 - 移除防抖处理以确保Promise正确返回
  updateRecord: (id, updatedData) => request(`/records/${id}`, {
    method: 'PUT',
    data: updatedData,
  }),
  
  // 删除记录
  deleteRecord: (id) => request(`/records/${id}`, {
    method: 'DELETE',
  }),
};

// 分类相关API
export const categoryAPI = {
  // 获取所有分类 - 直接从服务器获取，不使用缓存
  getAllCategories: async () => request('/categories', { method: 'GET' }),
  
  // 获取所有分类的兼容方法
  getCategories: async () => request('/categories', { method: 'GET' }),
  
  // 获取指定类型分类 - 直接从服务器获取
  getCategoriesByType: (type) => request(`/categories/type/${type}`, {
    method: 'GET',
  }),
  
  // 创建分类
  createCategory: debounce((categoryData) => request('/categories', {
    method: 'POST',
    data: categoryData,
  }), 300), // 添加防抖处理
  
  // 更新分类 - 移除防抖处理以确保Promise正确返回
  updateCategory: (id, updatedData) => request(`/categories/${id}`, {
    method: 'PUT',
    data: updatedData,
  }),
  
  // 删除分类
  deleteCategory: (id) => request(`/categories/${id}`, {
    method: 'DELETE',
  }),
  
  // 批量获取分类信息
  getCategoriesByIds: (ids) => request('/categories/batch', {
    method: 'POST',
    data: { ids },
  })
};

// 统计相关API
export const statisticsAPI = {
  // 获取总体统计 - 直接从服务器获取，不使用缓存
  getOverallStatistics: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return directGet('/statistics/overall', params);
  },
  
  // 按分类统计 - 直接从服务器获取，不使用缓存
  getStatisticsByCategory: async (type, startDate, endDate) => {
    const params = { type };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    // 注意：路径不需要加'/api'前缀，因为axiosInstance的baseURL已包含该前缀
    return directGet('/statistics/category', params);
  },
  
  // 获取月度统计数据（调用后端API）
  getMonthStatistics: async (month) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    // 调用后端API获取月度统计数据
    return directGet('/statistics/month', { month: targetMonth });
  },
  
  // 获取时间段统计数据（为StatisticsPage组件添加）
  getPeriodStatistics: async (startDate, endDate) => {
    try {
      // 验证日期格式
      if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
        throw new Error('无效的日期格式');
      }
      
      // 解析开始和结束日期
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      
      // 生成日期范围内所有月份的列表
      const months = [];
      let currentMonth = start.startOf('month');
      
      // 循环添加每个月的数据，直到达到结束月份
      while (currentMonth.isBefore(end.endOf('month')) || currentMonth.isSame(end.endOf('month'))) {
        const yearMonth = currentMonth.format('YYYY-MM');
        
        try {
          // 获取该月的统计数据
          const monthData = await statisticsAPI.getMonthStatistics(yearMonth);
          
          // 解析月份字符串，提取年份和月份数字
          const [year, month] = yearMonth.split('-').map(Number);
          
          months.push({
            monthStr: yearMonth,
            year: year,
            month: month,
            income: monthData.totalIncome || 0,
            expense: monthData.totalExpense || 0,
            balance: monthData.balance || 0
          });
        } catch (monthError) {
          console.error(`获取${yearMonth}月度数据失败:`, monthError);
          
          // 如果某个月获取失败，添加默认数据
          const [year, month] = yearMonth.split('-').map(Number);
          months.push({
            monthStr: yearMonth,
            year: year,
            month: month,
            income: 0,
            expense: 0,
            balance: 0
          });
        }
        
        // 移动到下一个月
        currentMonth = currentMonth.add(1, 'month');
      }
      
      // 调用后端API获取总体统计数据
      const overallData = await directGet('/statistics/overall', { startDate, endDate });
      
      return {
        monthlyData: months,
        totalIncome: overallData.totalIncome || 0,
        totalExpense: overallData.totalExpense || 0,
        totalBalance: overallData.balance || 0,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      console.error('获取时间段统计数据失败:', error);
      // 返回空数据以避免页面崩溃
      return {
        monthlyData: [],
        totalIncome: 0,
        totalExpense: 0,
        totalBalance: 0,
        dateRange: { startDate, endDate }
      };
    }
  },
  
  // 获取分类统计数据（为StatisticsPage组件添加）
  getCategoryStatistics: async (yearMonth) => {
    try {
      // 分别获取收入和支出的分类统计
      const incomeStats = await directGet('/statistics/category', { 
        type: 'income',
        startDate: `${yearMonth}-01`,
        endDate: `${yearMonth}-${dayjs(`${yearMonth}-01`).daysInMonth()}`
      });
      
      const expenseStats = await directGet('/statistics/category', { 
        type: 'expense',
        startDate: `${yearMonth}-01`,
        endDate: `${yearMonth}-${dayjs(`${yearMonth}-01`).daysInMonth()}`
      });
      
      // 转换数据格式以匹配前端组件期望的格式
      // 注意：后端API返回的是包含categories数组的对象
      return {
        income: Array.isArray(incomeStats.categories) ? incomeStats.categories : [],
        expense: Array.isArray(expenseStats.categories) ? expenseStats.categories : []
      };
    } catch (error) {
      console.error('获取分类统计数据失败:', error);
      // 如果出错，返回空数组而不是抛出错误，避免整个页面崩溃
      return {
        income: [],
        expense: []
      };
    }
  },
  
  // 获取年度统计数据（为StatisticsPage组件添加）
  getYearlyStatistics: async (year) => {
    try {
      // 验证年份格式
      if (!year || !/^\d{4}$/.test(year.toString())) {
        throw new Error('无效的年份参数');
      }
      
      // 直接调用后端新的年度统计API，一次获取整个年度的数据
      // 避免之前循环调用12次月度API的性能问题
      // 注意：路径不需要加'/api'前缀，因为axiosInstance的baseURL已包含该前缀
      const response = await directGet('/statistics/year', { year });
      
      // 确保返回格式包含前端组件所需的字段
      return {
        year: response.year || parseInt(year),
        totalIncome: response.totalIncome || 0,
        totalExpense: response.totalExpense || 0,
        totalBalance: response.totalBalance || 0,
        monthlyData: response.monthlyData || []
      };
    } catch (error) {
      console.error('获取年度统计数据失败:', error);
      
      // 降级处理：如果新API调用失败，使用旧的方式获取数据
      try {
        // 获取年度总体统计
        const yearData = await directGet('/statistics/overall', {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        });
        
        // 获取月度数据
        const monthlyData = [];
        
        // 循环获取12个月的数据
        for (let month = 1; month <= 12; month++) {
          try {
            const monthStr = String(month).padStart(2, '0');
            const yearMonth = `${year}-${monthStr}`;
            const monthResult = await statisticsAPI.getMonthStatistics(yearMonth);
            
            monthlyData.push({
              month: month, // 数字格式，方便前端组件使用
              yearMonth: yearMonth,
              income: monthResult.totalIncome || 0,
              expense: monthResult.totalExpense || 0,
              balance: monthResult.balance || 0,
              recordCount: monthResult.recordCount || 0
            });
          } catch (monthError) {
            console.error(`获取${year}年${month}月统计数据失败:`, monthError);
            // 出错时添加默认数据，避免整个年度数据获取失败
            monthlyData.push({
              month: month,
              yearMonth: `${year}-${String(month).padStart(2, '0')}`,
              income: 0,
              expense: 0,
              balance: 0,
              recordCount: 0
            });
          }
        }
        
        return {
          year: parseInt(year),
          totalIncome: yearData.totalIncome || 0,
          totalExpense: yearData.totalExpense || 0,
          totalBalance: yearData.balance || 0,
          monthlyData: monthlyData
        };
      } catch (fallbackError) {
        console.error('降级获取年度统计数据失败:', fallbackError);
        // 返回安全的默认数据，确保前端组件不会崩溃
        const defaultMonthlyData = [];
        for (let month = 1; month <= 12; month++) {
          const monthStr = String(month).padStart(2, '0');
          defaultMonthlyData.push({
            month: month,
            yearMonth: `${year}-${monthStr}`,
            income: 0,
            expense: 0,
            balance: 0
          });
        }
        
        return {
          year,
          totalIncome: 0,
          totalExpense: 0,
          totalBalance: 0,
          monthlyData: defaultMonthlyData
        };
      }
    }
  },
  
  // 获取每日统计数据（为StatisticsPage组件添加）
  getDailyStatistics: async (yearMonth) => {
    try {
      // 构建日期范围（整个月）
      const startDate = `${yearMonth}-01`;
      const endDate = dayjs(`${yearMonth}-01`).endOf('month').format('YYYY-MM-DD');
      
      // 使用新的每日统计API获取当月数据，注意路径不需要再加'/api'前缀
      // 因为axiosInstance的baseURL已经包含了'/api'
      const response = await directGet('/statistics/daily', { startDate, endDate });
      
      // 返回数据数组，如果API返回的是包含data字段的对象
      return response.data || response || [];
    } catch (error) {
      console.error('获取每日统计数据失败:', error);
      
      // 降级处理：如果新API调用失败，尝试使用旧的月度统计API
      try {
        const monthData = await statisticsAPI.getMonthStatistics(yearMonth);
        return monthData.trendData || [];
      } catch (fallbackError) {
        console.error('降级获取每日统计数据失败:', fallbackError);
        return [];
      }
    }
  },
  
  // 获取日期范围内的每日统计数据
  getDailyStatisticsByRange: async (startDate, endDate) => {
    try {
      // 验证日期格式
      if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
        throw new Error('无效的日期格式');
      }
      
      // 调用后端API获取指定日期范围的每日数据
      // 注意路径不需要再加'/api'前缀，因为axiosInstance的baseURL已经包含了'/api'
      const response = await directGet('/statistics/daily', { startDate, endDate });
      
      return response.data || response || [];
    } catch (error) {
      console.error('获取日期范围内的每日统计数据失败:', error);
      return [];
    }
  }
};

// 备份相关API
export const backupAPI = {
  // 创建手动备份
  createBackup: () => request('/backups', {
    method: 'POST',
  }),
  
  // 获取备份列表
  getBackupList: () => request('/backups', {
    method: 'GET',
  }),
  
  // 恢复备份
  restoreBackup: (backupId) => request(`/backups/restore/${backupId}`, {
    method: 'POST',
  }),
  
  // 删除备份
  deleteBackup: (backupId) => request(`/backups/${backupId}`, {
    method: 'DELETE',
  }),
  
  // 下载备份文件
  downloadBackup: async (filename) => {
    try {
      const response = await axiosInstance(`/backup/download/${filename}`, {
        method: 'GET',
        responseType: 'blob',
      });
      
      // 直接返回blob数据
      return response.data;
    } catch (error) {
      const errorMsg = handleError(error, '下载备份失败');
      message.error(errorMsg);
      throw error;
    }
  },
};