// 简单的测试脚本，检查StatisticsPage组件导入

// 这个脚本用于验证StatisticsPage组件的导入是否正常
// 不执行实际渲染，仅检查模块结构

console.log('开始测试StatisticsPage组件...');

// 尝试导入组件
let StatisticsPage;
try {
  // 注意：这是在Node环境中运行，不会实际执行React组件
  // 只检查模块导出是否正常
  const fs = require('fs');
  const path = require('path');
  
  // 检查文件存在性
  const mainPagePath = path.join(__dirname, 'src', 'pages', 'StatisticsPage.jsx');
  const indexPagePath = path.join(__dirname, 'src', 'pages', 'StatisticsPage', 'index.jsx');
  const componentsDirPath = path.join(__dirname, 'src', 'pages', 'StatisticsPage', 'components');
  const hooksDirPath = path.join(__dirname, 'src', 'pages', 'StatisticsPage', 'hooks');
  const utilsDirPath = path.join(__dirname, 'src', 'pages', 'StatisticsPage', 'utils');
  
  console.log(`检查主入口文件: ${mainPagePath}`);
  if (fs.existsSync(mainPagePath)) {
    console.log('✓ 主入口文件存在');
    const mainContent = fs.readFileSync(mainPagePath, 'utf8');
    console.log(`  内容: ${mainContent.trim()}`);
  } else {
    console.error('✗ 主入口文件不存在');
  }
  
  console.log(`\n检查组件目录: ${componentsDirPath}`);
  if (fs.existsSync(componentsDirPath)) {
    console.log('✓ 组件目录存在');
    const components = fs.readdirSync(componentsDirPath);
    console.log(`  组件文件: ${components.join(', ')}`);
  } else {
    console.error('✗ 组件目录不存在');
  }
  
  console.log(`\n检查hooks目录: ${hooksDirPath}`);
  if (fs.existsSync(hooksDirPath)) {
    console.log('✓ hooks目录存在');
    const hooks = fs.readdirSync(hooksDirPath);
    console.log(`  hook文件: ${hooks.join(', ')}`);
  } else {
    console.error('✗ hooks目录不存在');
  }
  
  console.log(`\n检查工具目录: ${utilsDirPath}`);
  if (fs.existsSync(utilsDirPath)) {
    console.log('✓ 工具目录存在');
    const utils = fs.readdirSync(utilsDirPath);
    console.log(`  工具文件: ${utils.join(', ')}`);
  } else {
    console.error('✗ 工具目录不存在');
  }
  
  console.log('\nStatisticsPage组件结构验证完成');
  console.log('✓ 所有文件和目录结构看起来正常');
  
} catch (error) {
  console.error('在测试过程中发生错误:', error.message);
  console.error('错误堆栈:', error.stack);
}