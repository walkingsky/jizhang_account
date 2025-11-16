import { useState, useCallback, useRef, useEffect } from 'react';
import { statisticsAPI } from '../../../services/apiService';
import { handleError } from '../../../utils/optimizationUtils';
import dayjs from 'dayjs';

/**
 * 统计数据获取和处理的自定义Hook
 * @param {Object} options 配置选项
 * @param {string} options.activeTab 当前激活的标签页
 * @param {Array} options.dateRange 日期范围，格式为[startDate, endDate]
 * @param {number} options.selectedYear 选中的年份
 * @param {number} options.selectedMonth 选中的月份
 * @returns {Object} 数据和状态对象
 */
const useStatisticsData = ({ activeTab, dateRange, selectedYear, selectedMonth }) => {
  // 数据状态
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  
  // UI状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 追踪上一次请求的参数，用于取消过时的请求
  const abortControllerRef = useRef(null);

  // 生成年月字符串
  const yearMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // 取消上一次的请求
  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 获取月度统计数据
  const fetchMonthlyStatistics = useCallback(async () => {
    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // 使用getPeriodStatistics代替不存在的getMonthlyStatistics
      // 根据dateRange计算月度统计数据
      const response = await statisticsAPI.getPeriodStatistics(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
      
      setMonthlyData(response.monthlyData || []);
    } catch (err) {
      // 忽略取消请求的错误
      if (err.name !== 'AbortError') {
        const errorMessage = handleError(err);
        setError(errorMessage);
        console.error('获取月度统计数据失败:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, cancelPreviousRequest]);

  // 获取分类统计数据
  const fetchCategoryStatistics = useCallback(async () => {
    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await statisticsAPI.getCategoryStatistics(yearMonthStr);
      
      setCategoryData(response);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = handleError(err);
        setError(errorMessage);
        console.error('获取分类统计数据失败:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [yearMonthStr, cancelPreviousRequest]);

  // 获取年度汇总数据
  const fetchYearlyStatistics = useCallback(async () => {
    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await statisticsAPI.getYearlyStatistics(selectedYear);
      
      setYearlyData(response);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = handleError(err);
        setError(errorMessage);
        console.error('获取年度统计数据失败:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, cancelPreviousRequest]);

  // 获取每日明细数据
  const fetchDailyData = useCallback(async () => {
    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // 构建日期范围（整个月）
      const startDate = `${yearMonthStr}-01`;
      const endDate = dayjs(`${yearMonthStr}-01`).endOf('month').format('YYYY-MM-DD');
      
      // 使用新的按日期范围获取每日统计数据的API
      // 这样可以一次性获取整个月的数据，避免多次请求
      const response = await statisticsAPI.getDailyStatisticsByRange(startDate, endDate);
      
      setDailyData(response);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = handleError(err);
        setError(errorMessage);
        console.error('获取每日统计数据失败:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [yearMonthStr, cancelPreviousRequest]);
  
  // 主动刷新每日数据的方法，支持自定义日期范围
  const refreshDailyData = useCallback(async (customStartDate, customEndDate) => {
    cancelPreviousRequest();
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (customStartDate && customEndDate) {
        // 使用自定义日期范围
        response = await statisticsAPI.getDailyStatisticsByRange(customStartDate, customEndDate);
      } else {
        // 默认使用当前选择的年月
        const startDate = `${yearMonthStr}-01`;
        const endDate = dayjs(`${yearMonthStr}-01`).endOf('month').format('YYYY-MM-DD');
        response = await statisticsAPI.getDailyStatisticsByRange(startDate, endDate);
      }
      
      setDailyData(response);
      return response;
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = handleError(err);
        setError(errorMessage);
        console.error('刷新每日统计数据失败:', err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [yearMonthStr, cancelPreviousRequest]);

  // 根据激活的标签页获取对应的数据
  const fetchDataForActiveTab = useCallback(() => {
    switch (activeTab) {
      case 'month':
        fetchMonthlyStatistics();
        break;
      case 'category':
        fetchCategoryStatistics();
        break;
      case 'year':
        fetchYearlyStatistics();
        break;
      case 'daily':
        fetchDailyData();
        break;
      default:
        break;
    }
  }, [activeTab, fetchMonthlyStatistics, fetchCategoryStatistics, fetchYearlyStatistics, fetchDailyData]);

  // 当激活标签页或相关参数变化时，获取数据
  useEffect(() => {
    // 只在activeTab有值时获取数据
    if (activeTab) {
      fetchDataForActiveTab();
    }
    
    // 组件卸载时取消请求
    return () => {
      cancelPreviousRequest();
    };
  }, [activeTab, fetchDataForActiveTab, cancelPreviousRequest]);

  // 手动刷新数据的方法
  const refreshData = useCallback(() => {
    fetchDataForActiveTab();
  }, [fetchDataForActiveTab]);

  return {
    // 数据
    monthlyData,
    categoryData,
    yearlyData,
    dailyData,
    // 状态
    loading,
    error,
    // 方法
    refreshData,
    refreshDailyData,
    // 暴露各个数据获取方法，以便在需要时手动调用
    fetchMonthlyStatistics,
    fetchCategoryStatistics,
    fetchYearlyStatistics,
    fetchDailyData
  };
};

export default useStatisticsData;