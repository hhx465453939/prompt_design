#!/usr/bin/env node

/**
 * DeepSeek API 集成测试脚本
 * 测试完整的API调用流程
 */

import path from 'path';
import logger from './logger.mjs';
import { config } from 'dotenv';

// 加载环境变量文件
const fs = await import('fs');
const envFiles = ['.env.local', '.env', 'env.example'];
for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    config({ path: filePath });
    console.log(`✅ 已加载环境变量文件: ${file}`);
    break;
  }
}

// 清理旧日志
logger.info('🧹 清理旧日志文件...');
logger.constructor.cleanup(10);

// 开始测试
logger.startTest('DeepSeek API 集成测试');

async function testDeepSeekAPI() {
  console.log('🧪 DeepSeek API 集成测试');
  console.log('=====================================\n');
  
  try {
    // 直接导入构建后的core包
    const { LLMService, RouterService } = await import('../packages/core/dist/index.js');
    
    // 1. 初始化LLM服务
    logger.info('初始化LLM服务');
    console.log('1. 初始化LLM服务:');
    
    const llmService = new LLMService();
    llmService.initialize({
      provider: 'deepseek',
      apiKey: 'sk-test',  // 这里需要真实的API key
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    logger.info('✅ LLM服务初始化成功');
    console.log('   ✅ LLM服务初始化成功');
    
    // 2. 创建路由服务
    logger.info('创建路由服务');
    console.log('\n2. 创建路由服务:');
    
    const routerService = new RouterService(llmService);
    logger.info('✅ 路由服务创建成功');
    console.log('   ✅ 路由服务创建成功');
    
    // 3. 测试简单请求（非流式）
    logger.info('开始API调用测试');
    console.log('\n3. API调用测试:');
    console.log('   🔄 发送测试请求...');
    
    const testInput = '你好，请简单介绍一下自己';
    logger.info('测试请求', { input: testInput });
    
    const response = await routerService.handleRequest(testInput);
    
    logger.info('✅ API调用成功', { 
      agentType: response.agentType,
      intent: response.intent,
      tokensUsed: response.metadata.tokensUsed 
    });
    
    console.log('   ✅ API调用成功！');
    console.log('   Agent类型:', response.agentType);
    console.log('   意图:', response.intent);
    console.log('   响应内容:', response.content.slice(0, 200) + '...');
    console.log('   Token使用量:', response.metadata.tokensUsed);
    
    // 4. 保存测试结果
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: 'integration',
      success: true,
      agentType: response.agentType,
      intent: response.intent,
      tokensUsed: response.metadata.tokensUsed,
      contentLength: response.content.length
    };
    
    const resultFile = path.join(process.cwd(), 'test', 'api-test-result.json');
    import('fs').then(fs => {
      fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
      logger.info('测试结果已保存', { resultFile });
    });
    
  } catch (error) {
    logger.error('❌ 测试失败', { error: error.message, stack: error.stack });
    console.error('❌ 测试失败:', error.message);
    
    // 保存失败结果
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: 'integration',
      success: false,
      error: error.message
    };
    
    const resultFile = path.join(process.cwd(), 'test', 'api-test-result.json');
    import('fs').then(fs => {
      fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
      logger.error('测试结果已保存', { resultFile });
    });
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  testDeepSeekAPI().then(() => {
    logger.endTest('DeepSeek API 集成测试', Date.now() - startTime, true);
    console.log('\n=====================================');
    console.log('📄 日志文件:', logger.getLogFilePath());
  }).catch(error => {
    logger.endTest('DeepSeek API 集成测试', Date.now() - startTime, false);
    console.error('测试执行失败:', error);
  });
}

const startTime = Date.now();