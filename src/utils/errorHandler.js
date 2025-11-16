// 错误处理工具

/**
 * 统一错误处理函数
 * @param {string} message - 错误消息
 * @param {Error} error - 错误对象
 * @param {Object} options - 配置选项
 * @returns {void}
 */
export const handleError = (message, error, options = {}) => {
  console.error(`${message}:`, error);
  
  // 尝试获取更友好的错误信息
  const displayMessage = options.defaultMessage || message;
  
  // 处理常见错误类型
  if (error.response) {
    // API响应错误
    console.error('API错误响应:', error.response.status, error.response.data);
  } else if (error.request) {
    // 请求发送失败
    console.error('网络请求失败:', error.request);
  }
  
  // 这里可以根据需要添加其他错误处理逻辑
  // 例如发送错误日志到服务器等
};

/**
 * 错误边界组件的错误处理函数
 * @param {Error} error - 错误对象
 * @param {Object} errorInfo - 错误信息
 * @returns {void}
 */
export const logErrorToConsole = (error, errorInfo) => {
  console.error('错误边界捕获的错误:', error);
  if (errorInfo) {
    console.error('错误堆栈:', errorInfo.componentStack);
  }
};

/**
 * 重试操作的工具函数
 * @param {Function} fn - 要重试的函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 重试间隔（毫秒）
 * @returns {Promise<any>}
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};