#!/usr/bin/env node

/**
 * 简单的API配置测试
 * 直接测试LLM服务而不依赖复杂的Agent路由
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
logger.startTest('简单API测试');

console.log('🧪 简单API配置测试');
console.log('=====================================\n');

async function simpleAPITest() {
  try {
    // 检查环境变量
    const apiKey = process.env.VITE_DEEPSEEK_API_KEY || 'sk-test';
    const maskedKey = apiKey.includes('sk-') ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : apiKey;
    
    logger.info('检查环境变量', { 
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY,
      apiKey: maskedKey 
    });
    
    console.log('1. 环境变量检查:');
    if (process.env.VITE_DEEPSEEK_API_KEY) {
      console.log('   ✅ VITE_DEEPSEEK_API_KEY: 已配置');
    } else {
      console.log('   ⚠️  VITE_DEEPSEEK_API_KEY: 未配置，使用测试密钥');
    }
    
    // 直接导入OpenAI和我们的服务
    logger.info('导入服务模块');
    console.log('\n2. 导入服务模块:');
    
    const { LLMService } = await import('../packages/core/dist/index.js');
    // 如果需要RouterService，可以使用构建版本
    
    console.log('   ✅ 模块导入成功');
    logger.info('✅ 模块导入成功');
    
    // 1. 测试LLM服务初始化
    logger.info('初始化LLM服务');
    console.log('\n3. 初始化LLM服务:');
    console.log('   🔄 配置参数...');
    
    const llmService = new LLMService();
    llmService.initialize({
      provider: 'deepseek',
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    console.log('   ✅ LLM服务初始化成功');
    logger.info('✅ LLM服务初始化成功', { provider: 'deepseek', model: 'deepseek-chat' });
    
    // 2. 测试Router服务
    logger.info('初始化Router服务');
    console.log('\n4. 初始化Router服务:');
    
    const routerService = new RouterService(llmService);
    console.log('   ✅ Router服务初始化成功');
    logger.info('✅ Router服务初始化成功');
    
    // 3. 测试简单对话
    logger.info('测试简单对话');
    console.log('\n5. 测试简单对话:');
    console.log('   🔄 发送请求...');
    
    const testInput = '你好，请简单介绍一下自己';
    logger.info('测试请求', { input: testInput });
    
    const response = await routerService.handleRequest(testInput);
    
    console.log('   ✅ API调用成功！');
    console.log('   Agent类型:', response.agentType);
    console.log('   意图:', response.intent);
    console.log('   响应内容:', response.content.slice(0, 200) + '...');
    console.log('   Token使用量:', response.metadata.tokensUsed);
    
    logger.info('✅ API调用成功', { 
      agentType: response.agentType,
      intent: response.intent,
      tokensUsed: response.metadata.tokensUsed 
    });
    
    // 保存测试结果
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: 'simple',
      success: true,
      agentType: response.agentType,
      intent: response.intent,
      tokensUsed: response.metadata.tokensUsed,
      contentLength: response.content.length,
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY
    };
    
    const resultFile = path.join(process.cwd(), 'test', 'simple-test-result.json');
    import('fs').then(fs => {
      fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
      logger.info('测试结果已保存', { resultFile });
    });
    
  } catch (error) {
    logger.error('❌ 测试失败', { error: error.message, stack: error.stack });
    console.error('❌ 测试失败:', error);
    
    // 提供更详细的错误信息
    console.log('\n🔍 错误详情:');
    console.log('错误名称:', error.name);
    console.log('错误消息:', error.message);
    
    // 如果是网络错误，提示配置检查
    if (error.message.includes('fetch')) {
      console.log('\n📝 可能的解决方案:');
      console.log('1. 检查网络连接');
      console.log('2. 确认API密钥配置');
      console.log('3. 运行诊断工具: node diagnose.mjs');
    }
    
    // 保存失败结果
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: 'simple',
      success: false,
      error: error.message,
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY
    };
    
    const resultFile = path.join(process.cwd(), 'test', 'simple-test-result.json');
    import('fs').then(fs => {
      fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
      logger.error('测试结果已保存', { resultFile });
    });
  }
}

// 检查是否提供了API密钥
if (!process.env.VITE_DEEPSEEK_API_KEY) {
  logger.warn('未检测到VITE_DEEPSEEK_API_KEY环境变量');
  console.log('⚠️  未检测到VITE_DEEPSEEK_API_KEY环境变量');
  console.log('请配置API密钥:');
  console.log('1. 创建.env.local文件');
  console.log('2. 添加: VITE_DEEPSEEK_API_KEY=sk-your-api-key');
}

// 运行测试
const startTime = Date.now();
simpleAPITest().then(() => {
  const duration = Date.now() - startTime;
  logger.endTest('简单API测试', duration, true);
  console.log('\n=====================================');
  console.log('📄 日志文件:', logger.getLogFilePath());
}).catch(error => {
  const duration = Date.now() - startTime;
  logger.endTest('简单API测试', duration, false);
  console.error('测试执行失败:', error);
});

// 运行测试