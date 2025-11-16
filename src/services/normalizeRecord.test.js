import { normalizeRecord } from './dataService';

// 模拟分类映射表
const mockCategoryMap = {
  '1': { name: '餐饮', icon: '🍽️' },
  '6': { name: '教育', icon: '📚' },
  '2': { name: '交通', icon: '🚗' }
};

// 测试函数
export const testNormalizeRecord = () => {
  console.log('=== 开始测试 normalizeRecord 函数 ===');
  
  // 测试1: 测试只有category字段的记录
  const record1 = {
    "id": "1763100244545", 
    "date": "2025-09-01", 
    "type": "expense", 
    "category": "6", 
    "amount": 99, 
    "description": "", 
    "createdAt": "2025-11-14T06:04:04.545Z" 
  };
  
  // 测试2: 测试完整字段的记录
  const record2 = {
    "id": "1", 
    "amount": 585, 
    "type": "expense", 
    "categoryId": "1", 
    "categoryName": "餐饮", 
    "categoryIcon": "🍽️", 
    "description": "午餐", 
    "date": "2025-11-13", 
    "createdAt": "2025-11-13T04:15:58.897Z", 
    "category": "1" 
  };
  
  // 测试3: 测试缺少部分字段的记录
  const record3 = {
    "amount": 120,
    "type": "expense",
    "category": "2"
  };
  
  // 运行测试
  const normalized1 = normalizeRecord(record1, mockCategoryMap);
  const normalized2 = normalizeRecord(record2, mockCategoryMap);
  const normalized3 = normalizeRecord(record3, mockCategoryMap);
  
  // 打印测试结果
  console.log('\n测试1 - 只有category字段的记录:');
  console.log('原始记录:', record1);
  console.log('规范化后:', normalized1);
  console.log('测试1结果:', normalized1.categoryId === '6' && normalized1.categoryName === '教育' ? '通过' : '失败');
  
  console.log('\n测试2 - 完整字段的记录:');
  console.log('原始记录:', record2);
  console.log('规范化后:', normalized2);
  console.log('测试2结果:', normalized2.categoryId === '1' && normalized2.categoryName === '餐饮' ? '通过' : '失败');
  
  console.log('\n测试3 - 缺少部分字段的记录:');
  console.log('原始记录:', record3);
  console.log('规范化后:', normalized3);
  console.log('测试3结果:', normalized3.id !== undefined && normalized3.categoryId === '2' && normalized3.categoryName === '交通' ? '通过' : '失败');
  
  console.log('\n=== 测试完成 ===');
};

// 如果直接运行此文件，则执行测试
if (typeof window !== 'undefined' || typeof require !== 'undefined') {
  testNormalizeRecord();
}