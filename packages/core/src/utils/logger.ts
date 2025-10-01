/**
 * 日志工具
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;

  private constructor() {
    // 从环境变量读取日志级别
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
      if (debugMode) {
        this.level = LogLevel.DEBUG;
      }
    } else if (typeof process !== 'undefined' && process.env) {
      // Node.js 环境
      const debugMode = process.env.VITE_DEBUG_MODE === 'true' || process.env.DEBUG_MODE === 'true';
      if (debugMode) {
        this.level = LogLevel.DEBUG;
      }
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...args);
    }
  }
}

// 导出单例
export const logger = Logger.getInstance();

