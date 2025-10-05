/**
 * 统一日志管理系统
 * 为前后端提供统一的日志记录功能
 */

// 动态导入fs和path模块，避免在浏览器环境中导入
const isBrowser = typeof window !== 'undefined';
let fs: any = null;
let path: any = null;

if (!isBrowser) {
  try {
    fs = require('fs');
    path = require('path');
  } catch (error) {
    console.warn('Failed to import fs/path modules:', error);
  }
}

export class UnifiedLogger {
  private logDir: string;
  private logFile: string = '';
  private consoleEnabled: boolean = true;
  private fileEnabled: boolean = true;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 10;

  constructor(logType: string = 'system') {
    if (isBrowser || !fs || !path) {
      // 浏览器环境或fs/path模块不可用，不使用文件系统
      this.logDir = '';
      this.fileEnabled = false;
      return;
    }
    
    // 确保在项目根目录的logs文件夹中
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    this.logFile = path.join(this.logDir, `${logType}-${timestamp}.log`);
    
    // 创建符号链接到最新的日志文件
    const latestLog = path.join(this.logDir, `${logType}-latest.log`);
    try {
      if (fs.existsSync(latestLog)) {
        fs.unlinkSync(latestLog);
      }
      fs.symlinkSync(path.basename(this.logFile), latestLog);
    } catch (error) {
      // 忽略符号链接错误
    }
    
    this.cleanupOldLogs();
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory() {
    if (!fs || !path) return;
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 清理旧日志文件
   */
  private cleanupOldLogs() {
    if (!fs || !path) return;
    
    try {
      const files = fs.readdirSync(this.logDir)
        .filter((file: any) => file.endsWith('.log') && !file.includes('latest'))
        .map((file: any) => ({
          name: file,
          path: path.join(this.logDir, file),
          stats: fs.statSync(path.join(this.logDir, file))
        }))
        .sort((a: any, b: any) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
      
      // 删除多余的文件
      for (let i = this.maxFiles; i < files.length; i++) {
        try {
          fs.unlinkSync(files[i].path);
        } catch (error) {
          // 忽略删除错误
        }
      }
      
      // 删除超过7天的文件
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      for (const file of files) {
        if (file.stats.mtime < sevenDaysAgo) {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            // 忽略删除错误
          }
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  }

  /**
   * 检查并轮转日志文件
   */
  private rotateLogFile() {
    if (!fs) return;
    
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxFileSize) {
          const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
          const rotatedFile = this.logFile.replace(/\.log$/, `-${timestamp}.log`);
          fs.renameSync(this.logFile, rotatedFile);
        }
      }
    } catch (error) {
      // 忽略轮转错误
    }
  }

  /**
   * 写入日志
   */
  private log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const emoji = this.getLevelEmoji(level);
    const prefix = `[${timestamp}] ${emoji} [${level}]`;
    
    const logMessage = prefix + ' ' + message;
    const formattedData = data ? ` - ${JSON.stringify(data, null, 2)}` : '';
    const fullLogMessage = logMessage + formattedData;
    
    // 控制台输出
    if (this.consoleEnabled) {
      if (level === 'ERROR') {
        console.error(fullLogMessage);
      } else if (level === 'WARN') {
        console.warn(fullLogMessage);
      } else if (level === 'DEBUG') {
        // DEBUG级别日志不输出到控制台（生产环境）
        // console.debug(fullLogMessage);
      } else {
        // INFO级别日志在生产环境中不输出到控制台
        // console.log(fullLogMessage);
      }
    }
    
    // 文件输出
    if (this.fileEnabled && fs) {
      try {
        this.rotateLogFile();
        fs.appendFileSync(this.logFile, fullLogMessage + '\n');
      } catch (error) {
        console.error(`❌ 写入日志文件失败: ${error}`);
      }
    }
  }

  /**
   * 获取日志级别emoji
   */
  private getLevelEmoji(level: string): string {
    const emojis: Record<string, string> = {
      'DEBUG': '🐛',
      'INFO': 'ℹ️',
      'WARN': '⚠️',
      'ERROR': '❌',
      'SYSTEM': '🔧',
      'REQUEST': '📥',
      'RESPONSE': '📤',
      'AGENT': '🤖',
      'ROUTER': '🔀',
      'LLM': '🧠',
      'FRONTEND': '🖥️',
      'BACKEND': '⚙️'
    };
    return emojis[level] || '📝';
  }

  /**
   * 启用或禁用控制台输出
   */
  setConsoleEnabled(enabled: boolean) {
    this.consoleEnabled = enabled;
  }

  /**
   * 启用或禁用文件输出
   */
  setFileEnabled(enabled: boolean) {
    this.fileEnabled = enabled;
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }

  /**
   * 信息日志
   */
  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  /**
   * 错误日志
   */
  error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  /**
   * 系统日志
   */
  system(message: string, data?: any) {
    this.log('SYSTEM', message, data);
  }

  /**
   * 请求日志
   */
  request(message: string, data?: any) {
    this.log('REQUEST', message, data);
  }

  /**
   * 响应日志
   */
  response(message: string, data?: any) {
    this.log('RESPONSE', message, data);
  }

  /**
   * Agent日志
   */
  agent(message: string, data?: any) {
    this.log('AGENT', message, data);
  }

  /**
   * 路由日志
   */
  router(message: string, data?: any) {
    this.log('ROUTER', message, data);
  }

  /**
   * LLM服务日志
   */
  llm(message: string, data?: any) {
    this.log('LLM', message, data);
  }

  /**
   * 前端日志
   */
  frontend(message: string, data?: any) {
    this.log('FRONTEND', message, data);
  }

  /**
   * 后端日志
   */
  backend(message: string, data?: any) {
    this.log('BACKEND', message, data);
  }

  /**
   * 获取日志文件路径
   */
  getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * 获取最新日志文件路径
   */
  getLatestLogPath(): string {
    return path.join(this.logDir, `${this.getLogType()}-latest.log`);
  }

  /**
   * 获取日志类型
   */
  private getLogType(): string {
    const match = this.logFile.match(/([^\/\\]+)-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.log$/);
    return match ? match[1] : 'unknown';
  }

  /**
   * 静态方法：清理所有日志
   */
  static cleanupAllLogs(logDir?: string) {
    // 检查是否在浏览器环境
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      return; // 浏览器环境不执行文件操作
    }
    
    const targetDir = logDir || path.join(process.cwd(), 'logs');
    if (!fs.existsSync(targetDir)) return;
    
    try {
      const files = fs.readdirSync(targetDir);
      for (const file of files) {
        if (file.endsWith('.log') && !file.includes('latest')) {
          const filePath = path.join(targetDir, file);
          const stats = fs.statSync(filePath);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (stats.mtime < sevenDaysAgo) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              // 忽略删除错误
            }
          }
        }
      }
    } catch (error) {
      // 忽略清理错误
    }
  }
}

// 创建单例导出
export const systemLogger = new UnifiedLogger('system');
export const testLogger = new UnifiedLogger('test');
export const frontendLogger = new UnifiedLogger('frontend');
export const backendLogger = new UnifiedLogger('backend');
export const routerLogger = new UnifiedLogger('router');
export const llmLogger = new UnifiedLogger('llm');
export const agentLogger = new UnifiedLogger('agent');

// 为了兼容现有代码，导出logger实例
export const logger = systemLogger;

// 为了兼容现有代码，导出Logger类
export { UnifiedLogger as Logger };

// 默认导出系统日志器
export default systemLogger;