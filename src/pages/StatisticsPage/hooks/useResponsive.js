import { useState, useEffect, useCallback } from 'react';

/**
 * 响应式设计的自定义Hook，用于检测屏幕尺寸并提供响应式状态
 * @returns {Object} 响应式状态对象
 */
const useResponsive = () => {
  // 初始化状态，设置默认值以避免SSR和首次加载时的布局跳跃
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  // 监听窗口尺寸变化的处理函数，使用useCallback避免重复创建函数
  const handleResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    }
  }, []);

  // 监听窗口尺寸变化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 初始设置
      handleResize();
      
      // 添加事件监听器
      window.addEventListener('resize', handleResize);
      
      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [handleResize]);

  // 根据屏幕宽度判断设备类型
  const isMobile = screenWidth < 576;
  const isTablet = screenWidth >= 576 && screenWidth < 768;
  const isDesktop = screenWidth >= 768;

  // 返回响应式状态和工具函数
  return {
    screenWidth,
    screenHeight,
    isMobile,
    isTablet,
    isDesktop,
    // 根据设备类型获取合适的值的工具函数
    getResponsiveValue: useCallback((mobileValue, tabletValue, desktopValue) => {
      if (isMobile) return mobileValue;
      if (isTablet) return tabletValue || mobileValue;
      return desktopValue || tabletValue || mobileValue;
    }, [isMobile, isTablet])
  };
};

export default useResponsive;