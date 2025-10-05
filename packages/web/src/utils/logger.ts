/**
 * 前端日志管理工具
 * 提供浏览器环境下的日志记录功能
 */

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
  component?: string;
  action?: string;
}

export class FrontendLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private consoleEnabled: boolean = true;
  private storageKey: string = 'frontend-logs';

  constructor() {
    this.loadLogsFromStorage();
    this.info('前端日志系统初始化', { 
      maxLogs: this.maxLogs,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 从本地存储加载日志
   */
  private loadLogsFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('加载日志失败:', error);
    }
  }

  /**
   * 保存日志到本地存储
   */
  private saveLogsToStorage() {
    try {
      // 只保留最新的maxLogs条日志
      const recentLogs = this.logs.slice(-this.maxLogs);
      localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('保存日志失败:', error);
    }
  }

  /**
   * 添加日志条目
   */
  private addLog(level: LogEntry['level'], message: string, data?: any, component?: string, action?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component,
      action
    };

    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs * 2) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 保存到本地存储
    this.saveLogsToStorage();

    // 控制台输出
    if (this.consoleEnabled) {
      const timestamp = logEntry.timestamp.split('T')[1].slice(0, 8);
      const prefix = `[${timestamp}] ${this.getLevelEmoji(level)} [${level}]`;
      const componentInfo = component ? ` [${component}]` : '';
      const actionInfo = action ? ` [${action}]` : '';
      
      const logMessage = `${prefix}${componentInfo}${actionInfo} ${message}`;
      const formattedData = data ? ` - ${JSON.stringify(data, null, 2)}` : '';
      
      if (level === 'ERROR') {
        console.error(logMessage + formattedData);
      } else if (level === 'WARN') {
        console.warn(logMessage + formattedData);
      } else if (level === 'DEBUG') {
        // DEBUG级别日志不输出到控制台（生产环境）
        // console.debug(logMessage + formattedData);
      } else {
        // INFO级别日志在生产环境中不输出到控制台
        // console.log(logMessage + formattedData);
      }
    }
  }

  /**
   * 获取日志级别emoji
   */
  private getLevelEmoji(level: LogEntry['level']): string {
    const emojis: Record<LogEntry['level'], string> = {
      'DEBUG': '🐛',
      'INFO': 'ℹ️',
      'WARN': '⚠️',
      'ERROR': '❌'
    };
    return emojis[level] || '📝';
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: any, component?: string) {
    this.addLog('DEBUG', message, data, component);
  }

  /**
   * 信息日志
   */
  info(message: string, data?: any, component?: string) {
    this.addLog('INFO', message, data, component);
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any, component?: string) {
    this.addLog('WARN', message, data, component);
  }

  /**
   * 错误日志
   */
  error(message: string, data?: any, component?: string) {
    this.addLog('ERROR', message, data, component);
  }

  /**
   * 用户操作日志
   */
  action(action: string, data?: any) {
    this.addLog('INFO', `用户操作: ${action}`, data, 'AppContent', action);
  }

  /**
   * API请求日志
   */
  apiRequest(method: string, url: string, data?: any) {
    this.addLog('INFO', `API请求: ${method} ${url}`, data, 'API', 'REQUEST');
  }

  /**
   * API响应日志
   */
  apiResponse(method: string, url: string, status: number, data?: any) {
    this.addLog('INFO', `API响应: ${method} ${url} (${status})`, data, 'API', 'RESPONSE');
  }

  /**
   * 消息发送日志
   */
  messageSent(content: string, agentType?: string) {
    this.addLog('INFO', '消息发送', { 
      content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      agentType,
      length: content.length
    }, 'ChatWindow', 'SEND');
  }

  /**
   * 消息接收日志
   */
  messageReceived(content: string, agentType: string, tokensUsed?: number) {
    this.addLog('INFO', '消息接收', { 
      content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      agentType,
      tokensUsed,
      length: content.length
    }, 'ChatWindow', 'RECEIVE');
  }

  /**
   * 配置更新日志
   */
  configUpdated(config: any, changes: any) {
    this.addLog('INFO', '配置更新', { config, changes }, 'ConfigPanel', 'UPDATE');
  }

  /**
   * 错误处理日志
   */
  handleError(error: Error, context?: string) {
    this.addLog('ERROR', '处理错误', {
      message: error.message,
      stack: error.stack,
      context
    }, context || 'Unknown');
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 按级别过滤日志
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 按组件过滤日志
   */
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  /**
   * 获取错误日志
   */
  getErrorLogs(): LogEntry[] {
    return this.getLogsByLevel('ERROR');
  }

  /**
   * 清除所有日志
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
    this.info('日志已清除');
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 启用或禁用控制台输出
   */
  setConsoleEnabled(enabled: boolean) {
    this.consoleEnabled = enabled;
  }

  /**
   * 设置最大日志数量
   */
  setMaxLogs(maxLogs: number) {
    this.maxLogs = maxLogs;
  }
}

// 创建单例
export const frontendLogger = new FrontendLogger();

// 导出工具函数
export const logInfo = (message: string, data?: any, component?: string) => 
  frontendLogger.info(message, data, component);

export const logError = (message: string, data?: any, component?: string) => 
  frontendLogger.error(message, data, component);

export const logAction = (action: string, data?: any) => 
  frontendLogger.action(action, data);

export const logAPI = (method: string, url: string, status?: number, data?: any) => {
  if (status !== undefined) {
    frontendLogger.apiResponse(method, url, status, data);
  } else {
    frontendLogger.apiRequest(method, url, data);
  }
};