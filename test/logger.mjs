#!/usr/bin/env node

/**
 * 测试工具日志管理器
 * 使用统一的日志管理系统
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { systemLogger } from '../packages/core/dist/index.js';

// 加载环境变量文件
const envFiles = ['.env.local', '.env', 'env.example'];
for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    config({ path: filePath });
    console.log(`✅ 已加载环境变量文件: ${file}`);
    break;
  }
}

class TestLogger {
  constructor(name = 'test') {
    // 使用统一的日志管理系统
    this.unifiedLogger = systemLogger;
    this.unifiedLogger.info('🔧 测试日志系统初始化', { 
      logFilePath: this.unifiedLogger.getLogFilePath() 
    });
  }

  /**
   * 启用或禁用控制台输出
   */
  setConsoleEnabled(enabled) {
    this.unifiedLogger.setConsoleEnabled(enabled);
  }

  /**
   * 启用或禁用文件输出
   */
  setFileEnabled(enabled) {
    this.unifiedLogger.setFileEnabled(enabled);
  }

  /**
   * 记录信息
   */
  info(message, data) {
    this.unifiedLogger.info(message, data);
  }

  /**
   * 记录警告
   */
  warn(message, data) {
    this.unifiedLogger.warn(message, data);
  }

  /**
   * 记录错误
   */
  error(message, data) {
    this.unifiedLogger.error(message, data);
  }

  /**
   * 记录开始测试
   */
  startTest(testName) {
    this.unifiedLogger.info(`🚀 开始测试: ${testName}`, {
      timestamp: new Date().toISOString(),
      process: process.pid,
      cwd: process.cwd()
    });
  }

  /**
   * 记录测试完成
   */
  endTest(testName, duration, success = true) {
    const status = success ? '✅' : '❌';
    this.unifiedLogger.info(`${status} 测试完成: ${testName}`, {
      duration: `${duration}ms`,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取日志文件路径
   */
  getLogFilePath() {
    return this.unifiedLogger.getLogFilePath();
  }

  /**
   * 清理旧日志文件
   */
  static cleanup(maxFiles = 10) {
    systemLogger.constructor.cleanupAllLogs();
  }
}

// 创建单例导出
const logger = new TestLogger();
export default logger;