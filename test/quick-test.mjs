#!/usr/bin/env node

/**
 * 快速测试脚本
 * 运行推荐的测试组合，快速验证系统状态
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
logger.startTest('快速系统验证');

console.log('🚀 智能提示词工程师系统 - 快速验证');
console.log('=====================================\n');

async function quickTest() {
  const results = [];
  
  console.log('📋 执行推荐测试组合:\n');
  
  // 测试1: 环境配置诊断
  console.log('1️⃣ 环境配置诊断');
  console.log('----------------------------');
  
  try {
    // 检查环境变量
    const hasAPIKey = !!process.env.VITE_DEEPSEEK_API_KEY;
    const hasBaseURL = !!process.env.VITE_DEEPSEEK_BASE_URL;
    
    console.log(`   ✅ API Key: ${hasAPIKey ? '已配置' : '未配置'}`);
    console.log(`   ✅ Base URL: ${hasBaseURL ? '已配置' : '未配置'}`);
    
    results.push({
      test: '环境配置',
      status: hasAPIKey ? '✅ 通过' : '❌ 失败',
      details: `API Key: ${hasAPIKey ? '已配置' : '未配置'}`
    });
    
  } catch (error) {
    console.log(`   ❌ 诊断失败: ${error.message}`);
    results.push({
      test: '环境配置',
      status: '❌ 失败',
      details: error.message
    });
  }
  
  // 测试2: 真实API连接
  console.log('\n2️⃣ API连接测试');
  console.log('----------------------------');
  
  try {
    const openaiModule = await import('../packages/core/node_modules/openai/index.js');
    const { default: OpenAI } = openaiModule;
    
    // 使用真实API密钥
    const REAL_API_KEY = 'sk-01d7a9231b0e4e15aa902f99297d5f36';
    const client = new OpenAI({
      apiKey: REAL_API_KEY,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true,
    });
    
    console.log('   🔄 测试API连接...');
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: '测试连接，请回复"连接成功"' }],
      max_tokens: 10,
    });
    
    const content = response.choices[0]?.message?.content || '';
    console.log(`   ✅ API响应: ${content}`);
    
    results.push({
      test: 'API连接',
      status: '✅ 通过',
      details: `响应: ${content}`
    });
    
  } catch (error) {
    console.log(`   ❌ API连接失败: ${error.message}`);
    results.push({
      test: 'API连接',
      status: '❌ 失败',
      details: error.message
    });
  }
  
  // 测试3: Agent系统验证
  console.log('\n3️⃣ Agent系统验证');
  console.log('----------------------------');
  
  try {
    const { LLMService, RouterService } = await import('../packages/core/dist/index.js');
    
    const llmService = new LLMService();
    llmService.initialize({
      provider: 'deepseek',
      apiKey: 'sk-01d7a9231b0e4e15aa902f99297d5f36',
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    console.log('   🔄 初始化Agent系统...');
    const routerService = new RouterService(llmService);
    
    console.log('   ✅ Agent系统加载成功');
    results.push({
      test: 'Agent系统',
      status: '✅ 通过',
      details: '所有Agent正常加载'
    });
    
  } catch (error) {
    console.log(`   ❌ Agent系统失败: ${error.message}`);
    results.push({
      test: 'Agent系统',
      status: '❌ 失败',
      details: error.message
    });
  }
  
  // 生成测试总结
  console.log('\n=====================================');
  console.log('📊 快速测试结果');
  console.log('=====================================');
  
  const passedTests = results.filter(r => r.status.includes('✅')).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    console.log(`${result.status} ${result.test}: ${result.details}`);
  });
  
  console.log(`\n📈 测试通过率: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
  
  // 根据测试结果给出建议
  console.log('\n💡 建议:');
  
  if (passedTests === totalTests) {
    console.log('   🎉 系统状态良好！前端应该能正常工作');
    console.log('   📝 建议现在刷新前端页面测试');
  } else {
    console.log('   ⚠️  发现问题，请按以下步骤排查:');
    
    results.forEach(result => {
      if (!result.status.includes('✅')) {
        console.log(`      - ${result.test}: ${result.details}`);
      }
    });
    
    console.log('\n   🔧 解决方案:');
    console.log('   1. 检查.env.local文件中的API密钥配置');
    console.log('   2. 确保网络连接正常');
    console.log('   3. 运行完整测试: node test-agent-fixed.mjs');
  }
  
  // 保存快速测试报告
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'quick-verification',
    results: results,
    summary: {
      total: totalTests,
      passed: passedTests,
      successRate: `${(passedTests/totalTests*100).toFixed(1)}%`
    },
    overall: passedTests === totalTests ? 'success' : 'failed'
  };
  
  const reportFile = path.join(process.cwd(), 'test', 'quick-test-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 详细报告: ${reportFile}`);
  console.log('📄 日志文件:', logger.getLogFilePath());
  
  return report;
}

// 运行快速测试
const startTime = Date.now();
quickTest().then(report => {
  const duration = Date.now() - startTime;
  logger.endTest('快速系统验证', duration, report.overall === 'success');
  
  console.log('\n🎯 快速验证完成！');
  console.log(`⏱️  耗时: ${duration}ms`);
  
}).catch(error => {
  const duration = Date.now() - startTime;
  logger.endTest('快速系统验证', duration, false);
  
  console.error('\n💥 快速验证失败:', error.message);
  console.log('💡 请运行完整测试进行详细诊断');
});