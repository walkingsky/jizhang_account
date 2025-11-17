// 后端服务器 - 基于Express.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule'); // 暂时禁用自动备份功能

// 尝试加载环境变量
let dotenvLoaded = false;
try {
  require('dotenv').config();
  dotenvLoaded = true;
  console.log('环境变量加载成功');
} catch (error) {
  console.warn('警告: dotenv模块未找到，环境变量可能未加载');
}

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backups');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 默认分类数据
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
];

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
];

// 初始化数据
function initializeData() {
  // 初始化分类数据
  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
  }
  
  // 初始化记录数据
  if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(INITIAL_RECORDS, null, 2));
  }
}

// 备份配置
const BACKUP_CONFIG = {
  DEFAULT_RETENTION_DAYS: 30,
  MAX_BACKUP_FILES: 100 // 最大备份文件数限制，防止磁盘空间耗尽
};

// 备份元数据存储文件
const BACKUP_METADATA_FILE = path.join(BACKUP_DIR, 'backup_metadata.json');

// 确保备份元数据文件存在
function ensureBackupMetadata() {
  if (!fs.existsSync(BACKUP_METADATA_FILE)) {
    fs.writeFileSync(BACKUP_METADATA_FILE, JSON.stringify([], null, 2));
  }
}

// 获取备份元数据
function getBackupMetadata() {
  ensureBackupMetadata();
  try {
    return JSON.parse(fs.readFileSync(BACKUP_METADATA_FILE, 'utf8'));
  } catch (error) {
    console.error('读取备份元数据失败:', error);
    return [];
  }
}

// 保存备份元数据
function saveBackupMetadata(metadata) {
  try {
    fs.writeFileSync(BACKUP_METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('保存备份元数据失败:', error);
  }
}

// 创建备份
function createBackup(description = '', type = 'auto') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    const dataToBackup = {
      id: timestamp,
      timestamp: new Date().toISOString(),
      description: description || (type === 'auto' ? `自动备份 - ${new Date().toLocaleString()}` : `手动备份 - ${new Date().toLocaleString()}`),
      type: type,
      records: JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8')),
      categories: JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8')),
      version: '1.0' // 备份格式版本
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(dataToBackup, null, 2));
    console.log(`备份成功: ${backupFilename}`);
    
    // 更新备份元数据
    const metadata = getBackupMetadata();
    metadata.unshift({
      id: timestamp,
      filename: backupFilename,
      description: dataToBackup.description,
      type: dataToBackup.type,
      createdAt: dataToBackup.timestamp,
      size: fs.statSync(backupPath).size
    });
    saveBackupMetadata(metadata);
    
    // 清理旧备份
    cleanupOldBackups();
    
    return {
      id: timestamp,
      filename: backupFilename,
      ...dataToBackup
    };
  } catch (error) {
    console.error('备份失败:', error);
    throw error;
  }
}

// 获取备份设置
function getBackupSettings() {
  try {
    const settingsFile = path.join(DATA_DIR, 'backup_settings.json');
    if (fs.existsSync(settingsFile)) {
      return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    }
    return {
      autoBackup: true,
      backupFrequency: 'daily', // 'daily', 'weekly', 'monthly'
      backupRetention: BACKUP_CONFIG.DEFAULT_RETENTION_DAYS,
      lastBackupTime: null
    };
  } catch (error) {
    console.error('获取备份设置失败:', error);
    return {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: BACKUP_CONFIG.DEFAULT_RETENTION_DAYS,
      lastBackupTime: null
    };
  }
}

// 保存备份设置
function saveBackupSettings(settings) {
  try {
    const settingsFile = path.join(DATA_DIR, 'backup_settings.json');
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('保存备份设置失败:', error);
    return false;
  }
}

// 清理旧备份
function cleanupOldBackups() {
  try {
    const settings = getBackupSettings();
    const retentionDays = settings.backupRetention || BACKUP_CONFIG.DEFAULT_RETENTION_DAYS;
    const now = Date.now();
    const retentionTime = now - (retentionDays * 24 * 60 * 60 * 1000);
    
    // 获取备份元数据
    let metadata = getBackupMetadata();
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          time: stats.mtime.getTime(),
          size: stats.size
        };
      })
      .sort((a, b) => b.time - a.time);
    
    // 删除过期备份
    const filesToDelete = files.filter(file => 
      file.time < retentionTime || files.indexOf(file) >= BACKUP_CONFIG.MAX_BACKUP_FILES
    );
    
    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
        console.log(`已删除过期备份: ${file.name}`);
      } catch (error) {
        console.error(`删除备份文件失败: ${file.name}`, error);
      }
    });
    
    // 更新元数据，移除已删除的备份信息
    const existingFileNames = new Set(fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json')));
    
    metadata = metadata.filter(item => existingFileNames.has(item.filename));
    saveBackupMetadata(metadata);
  } catch (error) {
    console.error('清理旧备份失败:', error);
  }
}

// 恢复备份
function restoreBackup(backupId) {
  try {
    // 查找备份文件
    const metadata = getBackupMetadata();
    const backupInfo = metadata.find(item => item.id === backupId);
    
    if (!backupInfo) {
      throw new Error('备份不存在');
    }
    
    const backupPath = path.join(BACKUP_DIR, backupInfo.filename);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('备份文件不存在');
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // 恢复数据
    if (backupData.records) {
      fs.writeFileSync(RECORDS_FILE, JSON.stringify(backupData.records, null, 2));
      console.log('恢复记录数据成功');
    }
    
    if (backupData.categories) {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(backupData.categories, null, 2));
      console.log('恢复分类数据成功');
    }
    
    console.log(`恢复备份成功: ${backupInfo.filename}`);
    
    // 记录恢复操作
    const restoreLogFile = path.join(BACKUP_DIR, 'restore_history.json');
    let restoreLog = [];
    if (fs.existsSync(restoreLogFile)) {
      restoreLog = JSON.parse(fs.readFileSync(restoreLogFile, 'utf8'));
    }
    
    restoreLog.unshift({
      timestamp: new Date().toISOString(),
      backupId: backupId,
      backupFilename: backupInfo.filename,
      backupTime: backupInfo.createdAt
    });
    
    // 只保留最近100条恢复记录
    if (restoreLog.length > 100) {
      restoreLog = restoreLog.slice(0, 100);
    }
    
    fs.writeFileSync(restoreLogFile, JSON.stringify(restoreLog, null, 2));
    
    return {
      success: true,
      backupId: backupId,
      backupInfo: backupInfo
    };
  } catch (error) {
    console.error('恢复备份失败:', error);
    throw error;
  }
}

// 获取备份列表
function getBackupList(page = 1, pageSize = 10) {
  try {
    // 获取并按时间排序的备份元数据
    let metadata = getBackupMetadata();
    
    // 如果元数据为空，尝试从文件系统重建
    if (metadata.length === 0) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .filter(file => file !== 'backup_metadata.json'); // 排除元数据文件
        
      files.forEach(file => {
        try {
          const stats = fs.statSync(path.join(BACKUP_DIR, file));
          metadata.push({
            id: file.replace('backup-', '').replace('.json', ''),
            filename: file,
            description: `备份 - ${stats.mtime.toLocaleString()}`,
            type: 'unknown',
            createdAt: stats.mtime.toISOString(),
            size: stats.size
          });
        } catch (error) {
          console.error(`读取备份文件信息失败: ${file}`, error);
        }
      });
      
      // 按创建时间降序排序
      metadata.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // 保存重建的元数据
      saveBackupMetadata(metadata);
    }
    
    // 分页处理
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = metadata.slice(start, end);
    
    return {
      total: metadata.length,
      page: page,
      pageSize: pageSize,
      data: paginatedData
    };
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return {
      total: 0,
      page: page,
      pageSize: pageSize,
      data: []
    };
  }
}

// 初始化数据
initializeData();

// 初始化备份功能
ensureBackupMetadata();

// 根据备份设置调整定期备份计划
function updateBackupSchedule() {
  // 清除现有计划
  if (global.backupJob) {
    global.backupJob.cancel();
  }
  
  const settings = getBackupSettings();
  if (settings.autoBackup) {
    let cronExpression = '0 2 * * *'; // 默认每天凌晨2点
    
    switch (settings.backupFrequency) {
      case 'weekly':
        cronExpression = '0 2 * * 0'; // 每周日凌晨2点
        break;
      case 'monthly':
        cronExpression = '0 2 1 * *'; // 每月1日凌晨2点
        break;
      case 'daily':
      default:
        cronExpression = '0 2 * * *'; // 每天凌晨2点
        break;
    }
    
    global.backupJob = schedule.scheduleJob(cronExpression, async () => {
      try {
        console.log('执行自动备份...');
        const result = createBackup('定期自动备份', 'auto');
        
        // 更新最后备份时间
        const updatedSettings = { ...settings, lastBackupTime: new Date().toISOString() };
        saveBackupSettings(updatedSettings);
        
        console.log('自动备份完成:', result.id);
      } catch (error) {
        console.error('自动备份失败:', error);
      }
    });
    
    console.log(`备份计划已设置: ${settings.backupFrequency}`);
  }
}

// 初始设置备份计划
updateBackupSchedule();

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // 如果没有token，返回401未授权
  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证token' });
  }
  
  // 获取JWT密钥，如果没有设置则使用默认密钥
  const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
  
  // 验证token
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('Token验证失败:', err.message);
      return res.status(403).json({ success: false, message: '无效的token' });
    }
    
    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  });
};

// API 路由

// 登录路由 - 不需要认证
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // 从环境变量读取用户名密码 - 不设置默认值
  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;
  
  // 验证环境变量是否存在
  if (!envUsername || !envPassword) {
    console.error('错误: 环境变量 ADMIN_USERNAME 或 ADMIN_PASSWORD 未设置');
    return res.status(500).json({ success: false, message: '服务器配置错误' });
  }
  
  // 严格验证用户名密码
  if (username === envUsername && password === envPassword) {
    // 获取JWT密钥，如果没有设置则使用默认密钥
    const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
    
    // 创建JWT payload
    const payload = {
      username: username,
      role: 'admin',
      timestamp: Date.now()
    };
    
    // 设置token过期时间（例如24小时）
    const options = {
      expiresIn: '24h'
    };
    
    // 生成JWT token
    jwt.sign(payload, jwtSecret, options, (err, token) => {
      if (err) {
        console.error('生成JWT token失败:', err);
        return res.status(500).json({ success: false, message: '生成认证token失败' });
      }
      
      // 返回token给客户端
      res.json({ 
        success: true, 
        token: token,
        username: username,
        expiresIn: 86400 // 24小时，单位秒
      });
    });
  } else {
    console.log('登录失败: 用户名或密码不匹配');
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// 记录相关路由

// 获取所有记录 - 支持筛选和排序
app.get('/api/records', authenticateToken, (req, res) => {
  try {
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    
    // 提取查询参数
    const { limit, sort, startDate, endDate, category, type, search } = req.query;
    
    // 筛选记录
    let filteredRecords = records;
    
    // 按类型筛选
    if (type && type !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.type === type);
    }
    
    // 按分类筛选
    if (category && category !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.categoryId === category);
    }
    
    // 按日期范围筛选
    if (startDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.date) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.date) <= new Date(endDate)
      );
    }
    
    // 按描述搜索（支持中文）
    if (search && search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      filteredRecords = filteredRecords.filter(record => {
        // 搜索描述字段
        if (record.description && 
            record.description.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // 搜索分类名称
        if (record.categoryName && 
            record.categoryName.toLowerCase().includes(searchTerm)) {
          return true;
        }
        return false;
      });
    }
    
    // 排序
    filteredRecords.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sort === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    // 限制返回数量
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredRecords = filteredRecords.slice(0, limitNum);
      }
    }
    
    res.json(filteredRecords);
  } catch (error) {
    console.error('获取记录失败:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 获取单条记录
app.get('/api/records/:id', authenticateToken, (req, res) => {
  try {
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    const record = records.find(r => r.id === req.params.id);
    
    if (record) {
      res.json(record);
    } else {
      res.status(404).json({ error: '记录不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 创建记录
app.post('/api/records', authenticateToken, (req, res) => {
  try {
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    const categoryMap = categories.reduce((map, category) => {
      map[category.id] = category;
      return map;
    }, {});
    
    // 创建规范化的记录
    const recordData = {
      id: Date.now().toString(),
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0],
      type: req.body.type || 'expense',
      amount: req.body.amount || 0,
      createdAt: new Date().toISOString(),
      description: req.body.description || ''
    };
    
    // 确保分类信息完整
    if (recordData.categoryId && categoryMap[recordData.categoryId]) {
      recordData.categoryName = categoryMap[recordData.categoryId].name;
      recordData.categoryIcon = categoryMap[recordData.categoryId].icon;
    }
    
    // 如果没有categoryId但有category字段，尝试匹配
    if (!recordData.categoryId && recordData.category) {
      const category = categories.find(cat => 
        cat.name === recordData.category || cat.id === recordData.category
      );
      if (category) {
        recordData.categoryId = category.id;
        recordData.categoryName = category.name;
        recordData.categoryIcon = category.icon;
      }
    }
    
    // 确保category字段始终存在
    if (!recordData.category && recordData.categoryId) {
      recordData.category = recordData.categoryId;
    }
    
    records.unshift(recordData);
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
    res.json(recordData);
  } catch (error) {
    console.error('创建记录失败:', error);
    res.status(500).json({ error: '创建记录失败' });
  }
});

// 更新记录
app.put('/api/records/:id', authenticateToken, (req, res) => {
  try {
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    const index = records.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    records[index] = { ...records[index], ...req.body };
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
    res.json(records[index]);
  } catch (error) {
    res.status(500).json({ error: '更新记录失败' });
  }
});

// 删除记录
app.delete('/api/records/:id', authenticateToken, (req, res) => {
  try {
    let records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    records = records.filter(r => r.id !== req.params.id);
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除记录失败' });
  }
});

// 分类相关路由

// 获取所有分类
app.get('/api/categories', authenticateToken, (req, res) => {
  try {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 获取指定类型分类
app.get('/api/categories/type/:type', authenticateToken, (req, res) => {
  try {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    const filtered = categories.filter(c => c.type === req.params.type);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 创建分类
app.post('/api/categories', authenticateToken, (req, res) => {
  try {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    const newCategory = {
      id: Date.now().toString(),
      ...req.body
    };
    
    categories.push(newCategory);
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ error: '创建分类失败' });
  }
});

// 更新分类
app.put('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    const index = categories.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '分类不存在' });
    }
    
    categories[index] = { ...categories[index], ...req.body };
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    
    // 同时更新记录中的分类信息
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    const updatedRecords = records.map(record => {
      if (record.categoryId === req.params.id) {
        return {
          ...record,
          categoryName: req.body.name || record.categoryName,
          categoryIcon: req.body.icon || record.categoryIcon
        };
      }
      return record;
    });
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(updatedRecords, null, 2));
    
    res.json(categories[index]);
  } catch (error) {
    res.status(500).json({ error: '更新分类失败' });
  }
});

// 删除分类
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    // 检查是否有记录使用该分类
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    const hasRecords = records.some(record => record.categoryId === req.params.id);
    
    if (hasRecords) {
      return res.status(400).json({ error: '该分类下还有记账记录，无法删除' });
    }
    
    let categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    categories = categories.filter(c => c.id !== req.params.id);
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除分类失败' });
  }
});

// 批量获取分类
app.post('/api/categories/batch', authenticateToken, (req, res) => {
  try {
    const { ids } = req.body;
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    
    if (Array.isArray(ids)) {
      const filteredCategories = categories.filter(cat => ids.includes(cat.id));
      res.json(filteredCategories);
    } else {
      res.status(400).json({ error: '无效的请求参数' });
    }
  } catch (error) {
    res.status(500).json({ error: '批量获取分类失败' });
  }
});

// 统计相关路由

// 获取总体统计
app.get('/api/statistics/overall', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    
    let filteredRecords = records;
    if (startDate && endDate) {
      filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
      });
    }
    
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    
    filteredRecords.forEach(record => {
      if (record.type === 'income') {
        totalIncome += record.amount;
        incomeCount += 1;
      } else {
        totalExpense += record.amount;
        expenseCount += 1;
      }
    });
    
    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      totalRecords: filteredRecords.length
    });
  } catch (error) {
    res.status(500).json({ error: '统计失败' });
  }
});

// 按分类统计
app.get('/api/statistics/category', authenticateToken, (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // 参数验证
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: '无效的type参数，必须为income或expense' });
    }
    
    // 读取记录和分类数据
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    
    // 获取当前类型的所有分类
    const typeCategories = categories.filter(cat => cat.type === type);
    
    // 过滤记录
    let filteredRecords = records.filter(record => record.type === type);
    if (startDate && endDate) {
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
      });
    }
    
    // 计算总金额，用于计算百分比
    const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
    
    // 创建分类统计对象，确保包含所有分类
    const stats = {};
    
    // 先添加所有类型的分类，初始化为0
    typeCategories.forEach(category => {
      stats[category.id] = {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        totalAmount: 0,
        count: 0,
        percentage: 0
      };
    });
    
    // 处理未分类记录
    let uncategorizedTotal = 0;
    let uncategorizedCount = 0;
    
    // 统计每个分类的数据
    filteredRecords.forEach(record => {
      // 获取分类ID，兼容category和categoryId两种字段格式
      const categoryId = record.categoryId || record.category;
      
      // 处理未分类或无效分类ID的记录
      if (!categoryId || !stats[categoryId]) {
        uncategorizedTotal += record.amount;
        uncategorizedCount += 1;
      } else {
        // 正常分类的记录
        stats[categoryId].totalAmount += record.amount;
        stats[categoryId].count += 1;
      }
    });
    
    // 如果有未分类的记录，添加到统计结果中
    if (uncategorizedTotal > 0 || uncategorizedCount > 0) {
      stats['uncategorized'] = {
        categoryId: 'uncategorized',
        categoryName: '未分类',
        categoryIcon: '❓',
        totalAmount: uncategorizedTotal,
        count: uncategorizedCount,
        percentage: 0
      };
    }
    
    // 计算每个分类的百分比
    const result = Object.values(stats).map(stat => ({
      ...stat,
      percentage: totalAmount > 0 ? Math.round((stat.totalAmount / totalAmount) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount);
    
    // 返回完整的数据，包括汇总信息和所有分类
    res.json({
      categories: result,
      totalAmount,
      recordCount: filteredRecords.length,
      categoryCount: result.length,
      type,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('分类统计失败:', error);
    res.status(500).json({ 
      error: '统计失败', 
      details: error.message,
      categories: [],
      totalAmount: 0,
      recordCount: 0,
      categoryCount: 0,
      type: req.query.type || 'unknown',
      dateRange: null
    });
  }
});

// 备份相关路由

// 获取年度统计数据
app.get('/api/statistics/year', authenticateToken, (req, res) => {
  try {
    const { year } = req.query;
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    
    // 验证年份参数
    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: '无效的年份参数，请使用YYYY格式' });
    }
    
    const yearNumber = parseInt(year);
    
    // 筛选指定年份的记录
    const filteredRecords = records.filter(record => {
      const recordYear = new Date(record.date).getFullYear();
      return recordYear === yearNumber;
    });
    
    // 创建月度数据结构
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      monthlyData.push({
        month: month,
        yearMonth: `${year}-${String(month).padStart(2, '0')}`,
        income: 0,
        expense: 0,
        balance: 0,
        recordCount: 0
      });
    }
    
    // 计算年度总收入和总支出
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 按月份汇总记录
    filteredRecords.forEach(record => {
      const month = new Date(record.date).getMonth() + 1;
      const monthIndex = month - 1;
      
      if (record.type === 'income') {
        monthlyData[monthIndex].income += record.amount;
        totalIncome += record.amount;
      } else {
        monthlyData[monthIndex].expense += record.amount;
        totalExpense += record.amount;
      }
      monthlyData[monthIndex].recordCount++;
    });
    
    // 计算月度结余
    monthlyData.forEach(month => {
      month.balance = month.income - month.expense;
    });
    
    res.json({
      year: yearNumber,
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense,
      totalRecordCount: filteredRecords.length,
      monthlyData
    });
  } catch (error) {
    console.error('获取年度统计数据失败:', error);
    res.status(500).json({ error: '获取年度统计数据失败', details: error.message });
  }
});

// 获取日期范围内的每日统计数据
app.get('/api/statistics/daily', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    
    // 验证日期参数
    if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ error: '无效的日期参数，请使用YYYY-MM-DD格式' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ error: '开始日期不能晚于结束日期' });
    }
    
    // 筛选指定日期范围内的记录
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });
    
    // 创建每日数据结构
    const dailyData = {};
    
    // 遍历日期范围，初始化每日数据
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData[dateStr] = { income: 0, expense: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 按日期汇总记录
    filteredRecords.forEach(record => {
      if (record.type === 'income') {
        dailyData[record.date].income += record.amount;
      } else {
        dailyData[record.date].expense += record.amount;
      }
    });
    
    // 转换为数组并过滤掉收支都为0的日期
    const resultData = Object.entries(dailyData)
      .filter(([_, data]) => data.income > 0 || data.expense > 0)
      .map(([date, data]) => ({
        date,
        ...data
      }));
    
    res.json({
      startDate,
      endDate,
      totalRecords: resultData.length,
      data: resultData
    });
  } catch (error) {
    console.error('获取每日统计数据失败:', error);
    res.status(500).json({ error: '获取每日统计数据失败', details: error.message });
  }
});

// 获取月度统计数据
app.get('/api/statistics/month', authenticateToken, (req, res) => {
  try {
    const { month } = req.query;
    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf8'));
    
    // 验证month参数格式
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: '无效的月份参数，请使用YYYY-MM格式' });
    }
    
    // 筛选指定月份的记录
    const filteredRecords = records.filter(record => record.date.startsWith(month));
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    filteredRecords.forEach(record => {
      if (record.type === 'income') {
        totalIncome += record.amount;
      } else {
        totalExpense += record.amount;
      }
    });
    
    // 按支出分类统计
    const categoryStats = {};
    filteredRecords
      .filter(record => record.type === 'expense')
      .forEach(record => {
        if (!categoryStats[record.categoryId]) {
          categoryStats[record.categoryId] = {
            categoryId: record.categoryId,
            categoryName: record.categoryName || '未分类',
            categoryIcon: record.categoryIcon || '📝',
            amount: 0
          };
        }
        categoryStats[record.categoryId].amount += record.amount;
      });
    
    // 计算分类百分比并整理数据
    const categoryData = Object.values(categoryStats).map(cat => ({
      ...cat,
      percentage: totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.amount - a.amount);
    
    // 生成真正的每日数据
    const trendData = [];
    const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
    
    // 创建每日数据结构
    const dailyData = {};
    
    // 初始化每日数据为0
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      dailyData[`${month}-${dayStr}`] = { income: 0, expense: 0 };
    }
    
    // 按日期汇总记录
    filteredRecords.forEach(record => {
      if (record.type === 'income') {
        dailyData[record.date].income += record.amount;
      } else {
        dailyData[record.date].expense += record.amount;
      }
    });
    
    // 转换为数组并过滤掉收支都为0的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const date = `${month}-${dayStr}`;
      const { income, expense } = dailyData[date];
      
      // 只包含有收入或支出的日期
      if (income > 0 || expense > 0) {
        trendData.push({
          date,
          income,
          expense
        });
      }
    }
    
    res.json({
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      recordCount: filteredRecords.length,
      categoryData,
      trendData
    });
  } catch (error) {
    console.error('月度统计失败:', error);
    res.status(500).json({ error: '月度统计失败' });
  }
});

app.post('/api/backups', authenticateToken, (req, res) => {
  try {
    const { description } = req.body;
    const backupResult = createBackup(description || '', 'manual');
    res.json({ 
      success: true, 
      backupId: backupResult.id,
      description: backupResult.description,
      createdAt: backupResult.timestamp
    });
  } catch (error) {
    console.error('创建备份失败:', error);
    res.status(500).json({ error: '创建备份失败', details: error.message });
  }
});

// 获取备份列表（支持分页）
app.get('/api/backups', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const backupList = getBackupList(page, pageSize);
    res.json(backupList);
  } catch (error) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({ error: '获取备份列表失败', details: error.message });
  }
});

// 获取备份设置
app.get('/api/settings/backup', authenticateToken, (req, res) => {
  try {
    const settings = getBackupSettings();
    res.json(settings);
  } catch (error) {
    console.error('获取备份设置失败:', error);
    res.status(500).json({ error: '获取备份设置失败', details: error.message });
  }
});

// 更新备份设置
app.put('/api/settings/backup', authenticateToken, (req, res) => {
  try {
    const newSettings = req.body;
    
    // 验证设置
    const validatedSettings = {
      autoBackup: typeof newSettings.autoBackup === 'boolean' ? newSettings.autoBackup : true,
      backupFrequency: ['daily', 'weekly', 'monthly'].includes(newSettings.backupFrequency) ? newSettings.backupFrequency : 'daily',
      backupRetention: Math.max(1, Math.min(365, parseInt(newSettings.backupRetention) || BACKUP_CONFIG.DEFAULT_RETENTION_DAYS)),
      lastBackupTime: getBackupSettings().lastBackupTime // 保留现有最后备份时间
    };
    
    const success = saveBackupSettings(validatedSettings);
    
    if (success) {
      // 更新备份计划
      updateBackupSchedule();
      res.json({ success: true, settings: validatedSettings });
    } else {
      res.status(500).json({ error: '保存备份设置失败' });
    }
  } catch (error) {
    console.error('更新备份设置失败:', error);
    res.status(500).json({ error: '更新备份设置失败', details: error.message });
  }
});

// 恢复备份
app.post('/api/backups/restore/:backupId', authenticateToken, (req, res) => {
  try {
    const { backupId } = req.params;
    const restoreResult = restoreBackup(backupId);
    
    res.json({
      success: true,
      message: '恢复备份成功',
      backupId: restoreResult.backupId,
      backupInfo: restoreResult.backupInfo
    });
  } catch (error) {
    console.error('恢复备份失败:', error);
    if (error.message === '备份不存在' || error.message === '备份文件不存在') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: '恢复备份失败', details: error.message });
    }
  }
});

// 删除备份
app.delete('/api/backups/:backupId', authenticateToken, (req, res) => {
  try {
    const { backupId } = req.params;
    const metadata = getBackupMetadata();
    const backupInfo = metadata.find(item => item.id === backupId);
    
    if (!backupInfo) {
      return res.status(404).json({ error: '备份不存在' });
    }
    
    const backupPath = path.join(BACKUP_DIR, backupInfo.filename);
    
    // 删除备份文件
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    
    // 更新元数据
    const updatedMetadata = metadata.filter(item => item.id !== backupId);
    saveBackupMetadata(updatedMetadata);
    
    res.json({ success: true, message: '删除备份成功' });
  } catch (error) {
    console.error('删除备份失败:', error);
    res.status(500).json({ error: '删除备份失败', details: error.message });
  }
});

// 下载备份文件
app.get('/api/backup/download/:filename', authenticateToken, (req, res) => {
  try {
    const backupPath = path.join(BACKUP_DIR, req.params.filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: '备份文件不存在' });
    }
    
    res.download(backupPath, req.params.filename);
  } catch (error) {
    res.status(500).json({ error: '下载备份失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('定期备份已设置：每天凌晨2点自动备份');
});