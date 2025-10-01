/**
 * 提示词管理服务
 * 负责提示词的存储、检索、版本管理
 */

import { PromptRecord, PromptMetadata } from '../../types';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class PromptManager {
  private prompts: Map<string, PromptRecord> = new Map();

  /**
   * 保存提示词
   */
  async savePrompt(
    content: string,
    metadata: Partial<PromptMetadata>
  ): Promise<PromptRecord> {
    const id = metadata.id || uuidv4();
    const now = Date.now();

    const record: PromptRecord = {
      id,
      name: metadata.name || '未命名提示词',
      description: metadata.description || '',
      category: metadata.category || 'general',
      createdAt: metadata.createdAt || now,
      updatedAt: now,
      tags: metadata.tags || [],
      agentType: metadata.agentType || 'X1_BASIC',
      content,
      version: 1,
    };

    this.prompts.set(id, record);
    logger.info(`Prompt saved: ${id}`);

    return record;
  }

  /**
   * 获取提示词
   */
  async getPrompt(id: string): Promise<PromptRecord | undefined> {
    return this.prompts.get(id);
  }

  /**
   * 更新提示词
   */
  async updatePrompt(
    id: string,
    content: string,
    metadata?: Partial<PromptMetadata>
  ): Promise<PromptRecord> {
    const existing = this.prompts.get(id);
    if (!existing) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const updated: PromptRecord = {
      ...existing,
      ...metadata,
      content,
      updatedAt: Date.now(),
      version: existing.version + 1,
      parentId: id,
    };

    // 保存新版本
    const newId = uuidv4();
    updated.id = newId;
    this.prompts.set(newId, updated);

    logger.info(`Prompt updated: ${id} -> ${newId}`);
    return updated;
  }

  /**
   * 删除提示词
   */
  async deletePrompt(id: string): Promise<boolean> {
    const result = this.prompts.delete(id);
    if (result) {
      logger.info(`Prompt deleted: ${id}`);
    }
    return result;
  }

  /**
   * 搜索提示词
   */
  async searchPrompts(query: string): Promise<PromptRecord[]> {
    const results: PromptRecord[] = [];
    const lowerQuery = query.toLowerCase();

    for (const prompt of this.prompts.values()) {
      if (
        prompt.name.toLowerCase().includes(lowerQuery) ||
        prompt.description.toLowerCase().includes(lowerQuery) ||
        prompt.content.toLowerCase().includes(lowerQuery) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push(prompt);
      }
    }

    return results;
  }

  /**
   * 按分类获取提示词
   */
  async getPromptsByCategory(category: string): Promise<PromptRecord[]> {
    return Array.from(this.prompts.values()).filter(
      p => p.category === category
    );
  }

  /**
   * 获取所有提示词
   */
  async getAllPrompts(): Promise<PromptRecord[]> {
    return Array.from(this.prompts.values());
  }
}

// 导出单例
export const promptManager = new PromptManager();

