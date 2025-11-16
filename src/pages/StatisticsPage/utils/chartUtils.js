/**
 * 图表相关工具函数
 */

// 颜色常量
export const INCOME_COLOR = '#52c41a';
export const EXPENSE_COLOR = '#f5222d';

// 图表颜色配置
export const CHART_COLORS = {
  income: '#52c41a',
  expense: '#f5222d',
  balance: '#1890ff',
  // 分类图表颜色
  categoryColors: [
    '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
  ]
};

/**
 * 获取分类图表的颜色配置
 * @param {number} index 索引值
 * @returns {string} 颜色值
 */
export const getCategoryColor = (index) => {
  return CHART_COLORS.categoryColors[index % CHART_COLORS.categoryColors.length];
};

/**
 * 格式化金额显示
 * @param {number} value 金额
 * @returns {string} 格式化后的金额字符串
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00 元';
  }
  return `${Number(value).toFixed(2)} 元`;
};

/**
 * 配置饼图的单元格样式
 * @param {Array} data 饼图数据
 * @returns {Array} 配置后的饼图数据
 */
export const configurePieChartData = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map((entry, index) => ({
    ...entry,
    cellStyle: {
      fill: getCategoryColor(index)
    }
  }));
};

/**
 * 获取条形图的配置选项
 * @param {Object} options 配置选项
 * @returns {Object} 条形图配置
 */
export const getBarChartConfig = (options = {}) => {
  const {
    isMobile = false,
    showLegend = true
  } = options;

  return {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    barSize: isMobile ? 20 : 30,
    showLegend,
    // 动画配置
    animationDuration: 300,
    animationEasing: 'ease-in-out'
  };
};

/**
 * 获取饼图的配置选项
 * @param {Object} options 配置选项
 * @returns {Object} 饼图配置
 */
export const getPieChartConfig = (options = {}) => {
  const {
    isMobile = false,
    showLegend = true
  } = options;

  return {
    margin: { top: 20, right: 30, left: 30, bottom: 20 },
    radius: isMobile ? ['40%', '70%'] : ['50%', '80%'],
    showLegend,
    // 动画配置
    animationDuration: 300,
    animationEasing: 'ease-in-out'
  };
};

/**
 * 处理月度数据，转换为图表格式
 * @param {Array} data 原始月度数据
 * @returns {Array} 处理后的图表数据
 */
export const processMonthlyChartData = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // 确保数据按月份排序
  const sortedData = [...data].sort((a, b) => {
    // 支持两种数据格式：直接提供year/month或者只有month字符串
    if (a.year && a.month && b.year && b.month) {
      const dateA = new Date(a.year, a.month - 1);
      const dateB = new Date(b.year, b.month - 1);
      return dateA - dateB;
    } else if (a.monthStr && b.monthStr) {
      // 如果提供了monthStr，则使用它进行排序
      return a.monthStr.localeCompare(b.monthStr);
    } else if (a.month && b.month) {
      // 处理只有month字符串的情况 (YYYY-MM格式)
      return a.month.localeCompare(b.month);
    }
    return 0;
  });
  
  // 格式化月份显示
  return sortedData.map(item => {
    let monthLabel;
    
    // 根据数据格式生成合适的月份标签
    if (item.year && item.month) {
      monthLabel = `${item.year}年${item.month}月`;
    } else if (item.monthStr) {
      // 从monthStr解析年份和月份
      const [year, month] = item.monthStr.split('-');
      monthLabel = `${year}年${month}月`;
    } else if (item.month) {
      // 处理只有month字符串的情况
      const [year, month] = item.month.split('-');
      monthLabel = `${year}年${month}月`;
    } else {
      monthLabel = '未知月份';
    }
    
    return {
      ...item,
      monthLabel
    };
  });
};

/**
 * 计算统计汇总数据
 * @param {Array} data 数据数组
 * @returns {Object} 汇总数据
 */
export const calculateSummary = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      totalBalance: 0,
      recordCount: 0
    };
  }
  
  const totalIncome = data.reduce((sum, item) => sum + (item.income || 0), 0);
  const totalExpense = data.reduce((sum, item) => sum + (item.expense || 0), 0);
  
  return {
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
    recordCount: data.length
  };
};

/**
 * 格式化百分比显示
 * @param {number} value 数值
 * @param {number} total 总数
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (total === 0 || value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};