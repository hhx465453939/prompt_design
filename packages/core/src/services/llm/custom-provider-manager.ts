/**
 * 自定义供应商管理器
 */

import { CustomProvider } from '../../types';
import OpenAI from 'openai';

export class CustomProviderManager {
  private static STORAGE_KEY = 'prompt-matrix-custom-providers';
  
  /**
   * 获取所有自定义供应商
   */
  static getProviders(): CustomProvider[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load custom providers:', error);
      return [];
    }
  }
  
  /**
   * 添加自定义供应商
   */
  static addProvider(provider: Omit<CustomProvider, 'id' | 'createdAt'>): CustomProvider {
    const providers = this.getProviders();
    const newProvider: CustomProvider = {
      ...provider,
      id: this.generateId(),
      createdAt: Date.now(),
    };
    
    providers.push(newProvider);
    this.saveProviders(providers);
    return newProvider;
  }
  
  /**
   * 更新自定义供应商
   */
  static updateProvider(id: string, updates: Partial<CustomProvider>): boolean {
    const providers = this.getProviders();
    const index = providers.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    providers[index] = { ...providers[index], ...updates };
    this.saveProviders(providers);
    return true;
  }
  
  /**
   * 删除自定义供应商
   */
  static deleteProvider(id: string): boolean {
    const providers = this.getProviders();
    const filtered = providers.filter(p => p.id !== id);
    
    if (filtered.length === providers.length) return false;
    
    this.saveProviders(filtered);
    return true;
  }
  
  /**
   * 根据ID获取供应商
   */
  static getProvider(id: string): CustomProvider | undefined {
    return this.getProviders().find(p => p.id === id);
  }
  
  /**
   * 保存供应商列表到本地存储
   */
  private static saveProviders(providers: CustomProvider[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(providers));
    } catch (error) {
      console.error('Failed to save custom providers:', error);
    }
  }
  
  /**
   * 测试供应商连接
   */
  static async testConnection(baseURL: string, apiKey: string): Promise<boolean> {
    try {
      const openai = new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true,
      });

      await openai.chat.completions.create({
        model: 'test-model',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取供应商的模型列表
   */
  static async fetchModels(baseURL: string, apiKey: string): Promise<string[]> {
    try {
      const openai = new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.models.list();
      return response.data.map((model: any) => model.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}