/**
 * 数据格式化和处理工具函数
 */
import dayjs from 'dayjs';

/**
 * 格式化日期显示
 * @param {string|Date} date 日期对象或字符串
 * @param {string} format 格式化模式
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

/**
 * 获取近N个月的月份列表
 * @param {number} count 月份数量
 * @returns {Array} 月份对象数组
 */
export const getRecentMonths = (count = 6) => {
  const months = [];
  const currentDate = dayjs();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = currentDate.subtract(i, 'month');
    months.push({
      value: date.format('YYYY-MM'),
      label: date.format('YYYY年MM月'),
      year: date.year(),
      month: date.month() + 1
    });
  }
  
  return months;
};

/**
 * 获取近N年的年份列表
 * @param {number} count 年份数量
 * @returns {Array} 年份对象数组
 */
export const getRecentYears = (count = 5) => {
  const years = [];
  const currentYear = dayjs().year();
  
  for (let i = count - 1; i >= 0; i--) {
    const year = currentYear - i;
    years.push({
      value: year,
      label: `${year}年`
    });
  }
  
  return years;
};

/**
 * 格式化百分比显示
 * @param {number} value 数值
 * @param {number} total 总值
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

/**
 * 处理分类数据，转换为饼图格式
 * @param {Array} data 原始分类数据
 * @returns {Array} 处理后的饼图数据
 */
export const processCategoryChartData = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // 按金额降序排序
  return [...data].sort((a, b) => (b.amount || 0) - (a.amount || 0));
};

/**
 * 转换每日数据格式，添加格式化日期
 * @param {Array} data 原始每日数据
 * @returns {Array} 处理后的每日数据
 */
export const processDailyData = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date, 'MM月DD日'),
    balance: (item.income || 0) - (item.expense || 0)
  }));
};

/**
 * 转换年度数据格式
 * @param {Array} data 原始年度数据
 * @returns {Array} 处理后的年度数据
 */
export const processYearlyData = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // 确保数据按月份排序，兼容数字格式和字符串格式的month
  const sortedData = [...data].sort((a, b) => {
    // 提取月份数字，处理字符串格式的month字段（如"2025-01"）
    const monthA = typeof a.month === 'string' ? parseInt(a.month.split('-')[1]) : a.month;
    const monthB = typeof b.month === 'string' ? parseInt(b.month.split('-')[1]) : b.month;
    return monthA - monthB;
  });
  
  return sortedData.map(item => {
    // 根据month字段的格式生成月份标签
    let monthNumber;
    if (typeof item.month === 'string') {
      // 处理字符串格式的month（如"2025-01"）
      monthNumber = parseInt(item.month.split('-')[1]);
    } else {
      // 处理数字格式的month
      monthNumber = item.month;
    }
    
    return {
      ...item,
      month: monthNumber, // 确保month字段为数字格式
      monthLabel: `${monthNumber}月`,
      balance: (item.income || 0) - (item.expense || 0)
    };
  });
};

/**
 * 生成日期范围选项
 * @returns {Array} 日期范围选项数组
 */
export const getDateRangeOptions = () => {
  const today = dayjs();
  
  return [
    {
      label: '最近3个月',
      value: [today.subtract(3, 'month'), today]
    },
    {
      label: '最近6个月',
      value: [today.subtract(6, 'month'), today]
    },
    {
      label: '最近1年',
      value: [today.subtract(1, 'year'), today]
    },
    {
      label: '今年',
      value: [today.startOf('year'), today]
    }
  ];
};

/**
 * 验证日期范围的有效性
 * @param {Array} dateRange 日期范围数组 [startDate, endDate]
 * @returns {boolean} 是否有效
 */
export const validateDateRange = (dateRange) => {
  if (!Array.isArray(dateRange) || dateRange.length !== 2) {
    return false;
  }
  
  const [start, end] = dateRange;
  if (!start || !end) return false;
  
  return dayjs(start).isBefore(end) || dayjs(start).isSame(end);
};

/**
 * 获取默认日期范围（最近6个月）
 * @returns {Array} 默认日期范围
 */
export const getDefaultDateRange = () => {
  const today = dayjs();
  return [today.subtract(6, 'month'), today];
};