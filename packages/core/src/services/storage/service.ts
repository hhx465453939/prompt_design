/**
 * 存储服务
 * 负责数据的本地持久化
 * 支持浏览器环境（localStorage）和 Node.js 环境（内存存储）
 */

import { StorageKeys } from '../../types';
import { logger } from '../../utils/logger';

/**
 * 通用存储接口
 */
interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * 内存存储实现（用于 Node.js 环境）
 */
class MemoryStorage implements IStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export class StorageService {
  private storage: IStorage;

  constructor(storage?: IStorage) {
    // 自动检测环境并选择合适的存储方式
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      // 浏览器环境
      this.storage = window.localStorage;
    } else {
      // Node.js 环境，使用内存存储
      this.storage = new MemoryStorage();
      logger.debug('Using MemoryStorage (Node.js environment)');
    }
  }

  /**
   * 保存数据
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
      logger.debug(`Storage: saved ${key}`);
    } catch (error) {
      logger.error(`Storage: failed to save ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * 读取数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const serialized = this.storage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      logger.error(`Storage: failed to read ${key}`, error as Error);
      return null;
    }
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
      logger.debug(`Storage: removed ${key}`);
    } catch (error) {
      logger.error(`Storage: failed to remove ${key}`, error as Error);
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      this.storage.clear();
      logger.info('Storage: cleared all data');
    } catch (error) {
      logger.error('Storage: failed to clear', error as Error);
    }
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    return this.storage.getItem(key) !== null;
  }
}

// 导出单例
export const storageService = new StorageService();

