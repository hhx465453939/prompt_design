#!/usr/bin/env node

/**
 * 统一测试运行器
 * 运行所有测试脚本并生成测试报告
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
logger.startTest('统一测试运行器');

console.log('🧪 智能提示词工程师系统 - 统一测试');
console.log('=====================================\n');

async function runAllTests() {
  const results = [];
  
  // 测试列表
  const tests = [
    { name: 'API配置诊断', script: 'diagnose.mjs' },
    { name: '直接API测试', script: 'test-direct.mjs' },
    { name: 'API集成测试', script: 'test-api.mjs' },
    { name: '简单API测试', script: 'test-simple.mjs' }
  ];
  
  for (const test of tests) {
    console.log(`\n🔄 运行测试: ${test.name}`);
    logger.info(`运行测试: ${test.name}`);
    
    try {
      const startTime = Date.now();
      
      // 动态导入测试脚本
      const testModule = await import(`./${test.script}`);
      if (typeof testModule.default === 'function') {
        await testModule.default();
      } else if (typeof testModule.run === 'function') {
        await testModule.run();
      } else {
        console.log(`   ⚠️  脚本 ${test.script} 没有可执行的函数`);
        results.push({ name: test.name, success: false, error: '没有可执行的函数' });
        continue;
      }
      
      const duration = Date.now() - startTime;
      results.push({ name: test.name, success: true, duration });
      console.log(`   ✅ ${test.name} 完成 (${duration}ms)`);
      logger.info(`${test.name} 完成`, { duration: `${duration}ms`, success: true });
      
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
      console.log(`   ❌ ${test.name} 失败: ${error.message}`);
      logger.error(`${test.name} 失败`, { error: error.message });
    }
  }
  
  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      successRate: `${(results.filter(r => r.success).length / results.length * 100).toFixed(1)}%`
    },
    details: results
  };
  
  // 保存报告
  const reportFile = path.join(process.cwd(), 'test', 'test-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // 显示报告
  console.log('\n=====================================');
  console.log('📊 测试报告');
  console.log('=====================================');
  console.log(`总计: ${report.summary.total}`);
  console.log(`通过: ${report.summary.passed}`);
  console.log(`失败: ${report.summary.failed}`);
  console.log(`成功率: ${report.summary.successRate}`);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.success ? '成功' : '失败'}`);
    if (!result.success && result.error) {
      console.log(`   错误: ${result.error}`);
    }
    if (result.duration) {
      console.log(`   耗时: ${result.duration}ms`);
    }
  });
  
  console.log('\n📄 测试报告文件:', reportFile);
  console.log('📄 日志文件位置:', logger.getLogFilePath());
  
  // 保存最终结果
  const finalResult = {
    timestamp: new Date().toISOString(),
    summary: report.summary,
    logFile: logger.getLogFilePath()
  };
  
  const resultFile = path.join(process.cwd(), 'test', 'final-test-result.json');
  fs.writeFileSync(resultFile, JSON.stringify(finalResult, null, 2));
  
  logger.endTest('统一测试运行器', Date.now() - startTime, report.summary.failed === 0);
  
  return report;
}

// 运行所有测试
const startTime = Date.now();
runAllTests().then(report => {
  console.log('\n🎉 所有测试完成！');
}).catch(error => {
  console.error('测试运行失败:', error);
  logger.endTest('统一测试运行器', Date.now() - startTime, false);
});