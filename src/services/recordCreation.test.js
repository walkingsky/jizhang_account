// 测试记录创建功能，验证分类信息是否正确补充

import { recordService, categoryService, normalizeRecord } from './dataService.js';

// 模拟localStorage环境
if (!global.localStorage) {
  global.localStorage = {
    _data: {},
    getItem(key) {
      return this._data[key] || null;
    },
    setItem(key, value) {
      this._data[key] = value;
    },
    removeItem(key) {
      delete this._data[key];
    },
    clear() {
      this._data = {};
    }
  };
}

// 测试记录创建功能
function testCreateRecord() {
  console.log('开始测试记录创建功能...');
  
  try {
    // 创建一个测试记录
    const testRecord = {
      type: 'expense',
      category: '1', // 餐饮分类ID
      amount: 58.5,
      date: new Date().toISOString().split('T')[0],
      description: '测试午餐'
    };
    
    // 创建记录
    const createdRecord = recordService.createRecord(testRecord);
    
    // 验证分类信息是否正确补充
    console.log('创建的记录:', createdRecord);
    console.log('是否包含categoryId:', !!createdRecord.categoryId);
    console.log('是否包含categoryName:', !!createdRecord.categoryName);
    console.log('是否包含categoryIcon:', !!createdRecord.categoryIcon);
    
    // 验证字段值是否正确
    if (createdRecord.categoryId === '1' && 
        createdRecord.categoryName === '餐饮' && 
        createdRecord.categoryIcon === '🍽️') {
      console.log('✅ 测试通过：分类信息正确补充');
    } else {
      console.error('❌ 测试失败：分类信息补充不正确');
      console.error('预期：餐饮 (ID: 1, 图标: 🍽️)');
      console.error('实际:', createdRecord.categoryName, 
                   '(ID:', createdRecord.categoryId, 
                   '图标:', createdRecord.categoryIcon, ')');
    }
    
    // 测试更新记录功能
    console.log('\n开始测试记录更新功能...');
    const updateData = {
      category: '2' // 交通分类ID
    };
    
    const updatedRecord = recordService.updateRecord(createdRecord.id, updateData);
    console.log('更新的记录:', updatedRecord);
    
    // 验证更新后的分类信息
    if (updatedRecord.categoryId === '2' && 
        updatedRecord.categoryName === '交通' && 
        updatedRecord.categoryIcon === '🚗') {
      console.log('✅ 测试通过：更新后的分类信息正确');
    } else {
      console.error('❌ 测试失败：更新后的分类信息不正确');
      console.error('预期：交通 (ID: 2, 图标: 🚗)');
      console.error('实际:', updatedRecord.categoryName, 
                   '(ID:', updatedRecord.categoryId, 
                   '图标:', updatedRecord.categoryIcon, ')');
    }
    
    console.log('\n所有测试完成！');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testCreateRecord();