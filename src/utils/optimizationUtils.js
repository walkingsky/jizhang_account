// 性能优化和错误处理工具函数

/**
 * 防抖函数 - 延迟执行函数，避免频繁触发
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖处理后的函数
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流处理后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 * @returns {string} 格式化后的错误消息
 */
export function handleError(error, defaultMessage = '操作失败') {
  console.error('Error:', error)
  
  // 检查error是否存在
  if (!error) {
    return defaultMessage
  }
  
  // 处理服务器响应错误
  if (error.response) {
    const { response } = error
    const status = response.status || '未知状态码'
    
    // 尝试从响应数据中获取错误消息
    if (response.data) {
      if (typeof response.data === 'object') {
        if (response.data.message) return response.data.message
        if (response.data.error) return response.data.error
      } else if (typeof response.data === 'string') {
        return response.data
      }
    }
    
    // 返回带有状态码的默认错误消息
    return `${defaultMessage}: ${status}`
  }
  
  // 处理请求发送失败的情况
  if (error.request) {
    return '网络连接失败，请检查网络设置'
  }
  
  // 处理其他错误
  if (typeof error === 'string') {
    return error
  }
  
  if (error.message) {
    return error.message
  }
  
  return defaultMessage
}

/**
 * 数据缓存函数 - 缓存API请求结果，并提供清除缓存功能
 * @param {Function} fetchFn - 获取数据的函数
 * @param {number} expireTime - 过期时间（毫秒）
 * @param {string} cacheKeyPrefix - 缓存键前缀，用于按组清除缓存
 * @returns {Function} 带缓存的函数，包含clearCache方法
 */
export function withCache(fetchFn, expireTime = 5 * 60 * 1000, cacheKeyPrefix = '') {
  const cache = new Map()
  
  // 全局缓存管理器，用于跨函数清除缓存
  if (!globalThis._cacheManagers) {
    globalThis._cacheManagers = new Map()
  }
  
  // 存储此缓存实例到全局管理器
  if (cacheKeyPrefix) {
    if (!globalThis._cacheManagers.has(cacheKeyPrefix)) {
      globalThis._cacheManagers.set(cacheKeyPrefix, new Set())
    }
    globalThis._cacheManagers.get(cacheKeyPrefix).add(cache)
  }
  
  const cachedFunction = async function(...args) {
    const key = JSON.stringify(args)
    const now = Date.now()
    
    // 检查缓存是否有效
    if (cache.has(key)) {
      const { data, timestamp } = cache.get(key)
      if (now - timestamp < expireTime) {
        console.log('Cache hit:', key)
        return data
      }
    }
    
    // 获取新数据并缓存
    try {
      const data = await fetchFn.apply(this, args)
      cache.set(key, { data, timestamp: now })
      console.log('Cache miss, data fetched:', key)
      return data
    } catch (error) {
      throw error
    }
  }
  
  // 添加清除缓存方法
  cachedFunction.clearCache = function() {
    cache.clear()
    console.log('Cache cleared for:', cacheKeyPrefix || 'anonymous')
  }
  
  // 添加按前缀清除所有缓存的静态方法
  cachedFunction.clearCacheByPrefix = function(prefix) {
    if (globalThis._cacheManagers && globalThis._cacheManagers.has(prefix)) {
      const caches = globalThis._cacheManagers.get(prefix)
      caches.forEach(cache => cache.clear())
      console.log('All caches cleared for prefix:', prefix)
    }
  }
  
  return cachedFunction
}

/**
 * 清除指定前缀的所有缓存
 * @param {string} prefix - 缓存前缀
 */
export function clearCacheByPrefix(prefix) {
  withCache.clearCacheByPrefix(prefix)
}

/**
 * 性能监控 - 测量函数执行时间
 * @param {Function} func - 要测量的函数
 * @param {string} name - 函数名称（用于日志）
 * @returns {Function} 包装后的函数
 */
export function measurePerformance(func, name = 'function') {
  return function(...args) {
    const start = performance.now()
    try {
      const result = func.apply(this, args)
      const end = performance.now()
      console.log(`${name} executed in ${(end - start).toFixed(2)}ms`)
      return result
    } catch (error) {
      const end = performance.now()
      console.error(`${name} failed after ${(end - start).toFixed(2)}ms:`, error)
      throw error
    }
  }
}

/**
 * 延迟函数 - 用于模拟网络延迟或控制执行顺序
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} Promise对象
 */
export function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}