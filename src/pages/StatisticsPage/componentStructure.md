# 统计分析页面组件结构设计

## 核心组件结构

```
StatisticsPage/
├── index.jsx                 # 主页面容器组件
├── hooks/                    # 自定义hooks目录
│   ├── useStatisticsData.js  # 数据获取和处理的hook
│   └── useResponsive.js      # 响应式设计hook
├── components/               # 子组件目录
│   ├── MonthChart.jsx        # 月度趋势图表组件
│   ├── CategoryChart.jsx     # 分类分析图表组件
│   ├── YearlySummary.jsx     # 年度汇总组件
│   ├── DailyDataTable.jsx    # 每日明细表格组件
│   └── StatisticsTabs.jsx    # 标签页容器组件
└── utils/                    # 工具函数
    ├── chartUtils.js         # 图表配置和处理工具
    └── dataFormatUtils.js    # 数据格式化工具
```

## 数据流设计

### 1. 数据流向
- `StatisticsPage/index.jsx`：作为容器组件，管理全局状态和业务逻辑
- `useStatisticsData.js`：封装所有API调用和数据处理逻辑
- 子组件：纯展示组件，通过props接收数据和回调函数

### 2. 状态管理
```javascript
// 在StatisticsPage/index.jsx中管理的状态
const [activeTab, setActiveTab] = useState('month');
const [dateRange, setDateRange] = useState([dayjs().subtract(6, 'month'), dayjs()]);
const [selectedYear, setSelectedYear] = useState(dayjs().year());
const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
```

### 3. 数据获取逻辑
- 使用自定义hook `useStatisticsData` 集中处理所有数据获取
- 根据不同标签页，按需加载数据，避免一次性加载所有数据
- 统一的加载状态和错误处理

### 4. 组件通信
- 通过props向下传递数据和回调函数
- 子组件通过回调函数通知父组件状态变化

## 响应式设计策略

### 1. 断点设计
- 移动端：< 576px
- 平板：576px - 767px
- 桌面端：>= 768px

### 2. 响应式适配方案
- 使用 `useResponsive` hook 检测屏幕尺寸
- 根据不同尺寸调整组件布局、字体大小和交互方式
- 使用Ant Design的响应式组件（如Col）实现栅格布局

## 性能优化措施

### 1. 避免无限循环
- 使用 `useCallback` 和 `useMemo` 缓存函数和计算结果
- 确保依赖数组准确无误
- 分离数据获取和UI渲染逻辑

### 2. 按需加载
- 仅在需要时获取对应标签页的数据
- 使用React.memo避免不必要的重渲染

### 3. 优化渲染性能
- 图表组件使用React.memo包装
- 数据处理逻辑移至hooks中，避免在渲染函数中执行复杂计算