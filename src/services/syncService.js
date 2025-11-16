import { categoryAPI } from './apiService';
import { handleError } from '../utils/errorHandler';

// 简单的防抖实现
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 本地存储键名
const STORAGE_KEYS = {
  CATEGORIES: 'finance_app_categories',
  LAST_SYNC_TIME: 'finance_app_last_sync_time',
  SYNC_STATUS: 'finance_app_sync_status',
};

// 同步状态
const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  FAILED: 'failed',
};

// 获取本地存储的分类数据
const getLocalCategories = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取本地分类数据失败:', error);
    return [];
  }
};

// 保存分类数据到本地存储
const saveLocalCategories = (categories) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return true;
  } catch (error) {
    console.error('保存分类数据到本地失败:', error);
    return false;
  }
};

// 获取最后同步时间
const getLastSyncTime = () => {
  try {
    const time = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
    return time ? new Date(time) : null;
  } catch (error) {
    console.error('获取最后同步时间失败:', error);
    return null;
  }
};

// 更新同步时间
const updateSyncTime = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('更新同步时间失败:', error);
    return false;
  }
};

// 获取同步状态
const getSyncStatus = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.SYNC_STATUS) || SYNC_STATUS.PENDING;
  } catch (error) {
    console.error('获取同步状态失败:', error);
    return SYNC_STATUS.PENDING;
  }
};

// 更新同步状态
const updateSyncStatus = (status) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, status);
    return true;
  } catch (error) {
    console.error('更新同步状态失败:', error);
    return false;
  }
};

// 合并分类数据（解决冲突）
const mergeCategories = (localCategories, serverCategories) => {
  const localMap = new Map(localCategories.map(cat => [cat.id, cat]));
  const serverMap = new Map(serverCategories.map(cat => [cat.id, cat]));
  
  const merged = [];
  
  // 处理所有存在的ID
  const allIds = new Set([...localMap.keys(), ...serverMap.keys()]);
  
  allIds.forEach(id => {
    const localCat = localMap.get(id);
    const serverCat = serverMap.get(id);
    
    // 如果只存在于一方，直接使用
    if (!localCat) {
      merged.push(serverCat);
    } else if (!serverCat) {
      merged.push(localCat);
    } else {
      // 存在冲突，比较时间戳
      const localUpdated = new Date(localCat.updatedAt || localCat.createdAt);
      const serverUpdated = new Date(serverCat.updatedAt || serverCat.createdAt);
      
      // 使用更新时间较晚的数据
      if (localUpdated >= serverUpdated) {
        merged.push(localCat);
      } else {
        merged.push(serverCat);
      }
    }
  });
  
  return merged;
};

// 执行完整同步
const performFullSync = async () => {
  try {
    updateSyncStatus(SYNC_STATUS.PENDING);
    
    // 从服务器获取最新分类数据
    const serverCategories = await categoryAPI.getCategories();
    const localCategories = getLocalCategories();
    
    // 合并数据
    const mergedCategories = mergeCategories(localCategories, serverCategories);
    
    // 保存到本地
    saveLocalCategories(mergedCategories);
    
    // 更新同步时间和状态
    updateSyncTime();
    updateSyncStatus(SYNC_STATUS.SYNCED);
    
    return {
      success: true,
      categories: mergedCategories,
      syncedAt: new Date(),
    };
  } catch (error) {
    updateSyncStatus(SYNC_STATUS.FAILED);
    handleError('分类数据同步失败', error);
    
    // 同步失败时返回本地数据
    return {
      success: false,
      categories: getLocalCategories(),
      error: error.message,
    };
  }
};

// 推送本地更改到服务器（用于离线操作后）
const pushLocalChanges = async () => {
  try {
    const localCategories = getLocalCategories();
    const serverCategories = await categoryAPI.getCategories();
    
    const serverIds = new Set(serverCategories.map(cat => cat.id));
    const serverMap = new Map(serverCategories.map(cat => [cat.id, cat]));
    
    let changesDetected = false;
    
    // 检查并推送创建的分类
    for (const localCat of localCategories) {
      if (!serverIds.has(localCat.id)) {
        // 新分类，推送到服务器
        await categoryAPI.createCategory(localCat);
        changesDetected = true;
      } else {
        // 已存在的分类，检查是否需要更新
        const serverCat = serverMap.get(localCat.id);
        const localUpdated = new Date(localCat.updatedAt || localCat.createdAt);
        const serverUpdated = new Date(serverCat.updatedAt || serverCat.createdAt);
        
        if (localUpdated > serverUpdated) {
          // 本地版本更新，推送到服务器
          await categoryAPI.updateCategory(localCat.id, localCat);
          changesDetected = true;
        }
      }
    }
    
    if (changesDetected) {
      updateSyncTime();
      updateSyncStatus(SYNC_STATUS.SYNCED);
    }
    
    return { success: true, changesDetected };
  } catch (error) {
    updateSyncStatus(SYNC_STATUS.FAILED);
    handleError('推送本地更改失败', error);
    return { success: false, error: error.message };
  }
};

// 检查是否需要同步
const shouldSync = () => {
  const lastSync = getLastSyncTime();
  if (!lastSync) return true;
  
  // 如果最后同步时间超过1小时，需要同步
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  return lastSync < oneHourAgo || getSyncStatus() !== SYNC_STATUS.SYNCED;
};

// 智能同步：根据需要决定同步策略
export const syncCategories = async () => {
  try {
    if (!navigator.onLine) {
      console.log('当前处于离线状态，使用本地分类数据');
      return {
        success: false,
        offline: true,
        categories: getLocalCategories(),
      };
    }
    
    // 先尝试推送本地更改
    await pushLocalChanges();
    
    // 然后执行完整同步
    return await performFullSync();
  } catch (error) {
    handleError('智能同步失败', error);
    return {
      success: false,
      categories: getLocalCategories(),
      error: error.message,
    };
  }
};

// 监听在线状态变化，自动同步
window.addEventListener('online', () => {
  console.log('网络已连接，开始自动同步分类数据');
  syncCategories();
});

// 导出同步服务
export const syncService = {
  // 立即同步
  syncCategoriesImmediate: syncCategories,
  
  // 防抖处理的同步函数
  syncCategories: debounce(syncCategories, 1000),
  
  // 获取本地分类（带缓存）
  getLocalCategories,
  
  // 保存分类到本地
  saveLocalCategories,
  
  // 获取同步状态信息
  getSyncInfo: () => ({
    lastSyncTime: getLastSyncTime(),
    status: getSyncStatus(),
    shouldSync: shouldSync(),
  }),
  
  // 手动触发同步
  triggerSync: performFullSync,
  
  // 推送本地更改
  pushChanges: pushLocalChanges,
};

export default syncService;