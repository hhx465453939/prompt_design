#!/usr/bin/env node

/**
 * 最简单的DeepSeek API测试
 * 直接使用OpenAI SDK测试DeepSeek API
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
logger.startTest('直接API测试');

console.log('🧪 DeepSeek API 直接测试');
console.log('=====================================\n');

async function testDirectAPI() {
  try {
    // 检查环境变量
    const apiKey = process.env.VITE_DEEPSEEK_API_KEY || 'sk-test';
    const maskedKey = apiKey.includes('sk-') ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : apiKey;
    
    logger.info('检查环境变量', { 
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY,
      apiKey: maskedKey 
    });
    
    console.log('1. 配置状态:');
    console.log('   API密钥:', process.env.VITE_DEEPSEEK_API_KEY ? '已配置' : '未配置');
    console.log('   Base URL: https://api.deepseek.com');
    
    console.log('\n2. 导入OpenAI SDK...');
    logger.info('导入OpenAI SDK');
    
    const openaiModule = await import('../packages/core/node_modules/openai/index.js');
    console.log('   ✅ OpenAI模块导入成功');
    console.log('   模块内容:', Object.keys(openaiModule).slice(0, 5).join(', '));
    logger.info('✅ OpenAI模块导入成功', { moduleKeys: Object.keys(openaiModule) });
    
    console.log('\n3. 创建客户端...');
    logger.info('创建OpenAI客户端');
    
    const { default: OpenAI } = openaiModule;
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true,
    });
    
    console.log('   ✅ 客户端创建成功');
    logger.info('✅ 客户端创建成功');
    
    console.log('\n4. 发送测试请求...');
    logger.info('发送API请求', { model: 'deepseek-chat', maxTokens: 100 });
    
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: '你好，请简单介绍一下自己' }],
      max_tokens: 100,
    });
    
    const content = response.choices[0]?.message?.content || '无响应';
    console.log('   ✅ API调用成功！');
    console.log('   响应内容:', content);
    console.log('   Token使用量:', response.usage?.total_tokens);
    
    logger.info('✅ API调用成功', { 
      content: content.slice(0, 100),
      tokensUsed: response.usage?.total_tokens 
    });
    
    // 保存测试结果
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: 'direct',
      success: true,
      content: content,
      tokensUsed: response.usage?.total_tokens,
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY
    };
    
    const resultFile = path.join(process.cwd(), 'test', 'direct-test-result.json');
    import('fs').then(fs => {
      fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
      logger.info('测试结果已保存', { resultFile });
    });
    
  } catch (error) {
    logger.error('❌ API测试失败', { error: error.message, stack: error.stack });
    console.error('❌ API测试失败:', error);
    
    console.log('\n🔍 错误分析:');
    console.log('错误类型:', error.constructor.name);
    console.log('错误信息:', error.message);
    
    // 提供具体的解决方案
    if (error.code === 'invalid_api_key') {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查API密钥是否正确');
      console.log('2. 运行: node diagnose.mjs');
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      console.log('\n🔧 解决方案:');
      console.log('1. 检查网络连接');
      console.log('2. 确认可以访问 api.deepseek.com');
    }
    
    // 保存失败结果
    const testResult = {
      timestamp: new Date().toISOString(),
      testType: 'direct',
      success: false,
      error: error.message,
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY
    };
    
    const resultFile = path.join(process.cwd(), 'test', 'direct-test-result.json');
    import('fs').then(fs => {
      fs.writeFileSync(resultFile, JSON.stringify(testResult, null, 2));
      logger.error('测试结果已保存', { resultFile });
    });
  }
}

// 显示配置信息
console.log('📋 配置状态:');
console.log('API密钥:', process.env.VITE_DEEPSEEK_API_KEY ? '已配置' : '未配置');
console.log('Base URL: https://api.deepseek.com');

// 运行测试
const startTime = Date.now();
testDirectAPI().then(() => {
  const duration = Date.now() - startTime;
  logger.endTest('直接API测试', duration, true);
  console.log('\n=====================================');
  console.log('📄 日志文件:', logger.getLogFilePath());
}).catch(error => {
  const duration = Date.now() - startTime;
  logger.endTest('直接API测试', duration, false);
  console.error('测试执行失败:', error);
});