import axios from 'axios';

async function testCategoryAPI() {
  try {
    console.log('测试分类统计API...');
    const response = await axios.get('http://localhost:3001/api/statistics/category', {
      params: {
        type: 'income',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
    });
    console.log('API响应:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testCategoryAPI();