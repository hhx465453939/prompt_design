#!/usr/bin/env node

/**
 * API配置诊断工具
 * 帮助检查DeepSeek API配置是否正确
 */

import logger from './logger.mjs';

// 清理旧日志
logger.info('🧹 清理旧日志文件...');
logger.constructor.cleanup(10);

// 开始诊断
logger.startTest('API配置诊断');

const startTime = Date.now();

console.log('🔍 智能提示词工程师系统 - API配置诊断');
console.log('=====================================\n');

// 1. 检查环境变量
logger.info('开始检查环境变量配置');
console.log('1. 检查环境变量配置:');
console.log('   当前目录:', process.cwd());

const envVars = [
  'VITE_DEEPSEEK_API_KEY',
  'VITE_DEEPSEEK_BASE_URL',
  'DEFAULT_CONDUCTOR_MODEL',
  'DEFAULT_EXPERT_MODEL'
];

let configIssues = [];

envVars.forEach(varName => {
  const value = process.env[varName] || import.meta.env?.[varName];
  if (value) {
    if (varName.includes('API_KEY')) {
      const maskedValue = `${value.slice(0, 10)}...${value.slice(-4)}`;
      logger.info(`✅ ${varName}: ${maskedValue}`, { hasAPIKey: true });
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    } else {
      logger.info(`✅ ${varName}: ${value}`);
      console.log(`   ✅ ${varName}: ${value}`);
    }
  } else {
    logger.warn(`❌ ${varName}: 未配置`, { missingVar: varName });
    console.log(`   ❌ ${varName}: 未配置`);
    configIssues.push(varName);
  }
});

// 2. 检查文件存在性
logger.info('开始检查配置文件');
console.log('\n2. 检查配置文件:');

const fs = await import('fs');
const path = await import('path');

const configFiles = ['.env.local', '.env', 'env.example'];
const existingFiles = [];

configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    existingFiles.push(file);
    logger.info(`✅ ${file}: 存在`, { filePath });
    console.log(`   ✅ ${file}: 存在`);
  } else {
    logger.warn(`❌ ${file}: 不存在`, { missingFile: file });
    console.log(`   ❌ ${file}: 不存在`);
  }
});

// 3. 提供配置建议
logger.info('分析配置结果');
console.log('\n3. 配置建议:');

const diagnosis = {
  timestamp: new Date().toISOString(),
  envVars: {},
  files: existingFiles,
  issues: configIssues,
  hasAPIKey: !configIssues.includes('VITE_DEEPSEEK_API_KEY')
};

if (configIssues.length > 0) {
  logger.warn('发现配置问题:', { configIssues });
  console.log('   ⚠️  发现配置问题:');
  configIssues.forEach(varName => {
    if (varName.includes('API_KEY')) {
      console.log(`      - 缺少${varName}: 请配置你的DeepSeek API密钥`);
      logger.error(`缺少API密钥: 请配置${varName}`);
    } else {
      console.log(`      - 缺少${varName}: 请配置相应的模型参数`);
      logger.error(`缺少配置变量: 请配置${varName}`);
    }
  });
  
  console.log('\n   📝 配置步骤:');
  logger.info('提供配置步骤建议');
  console.log('   1. 复制配置文件: cp .env.local.example .env.local');
  console.log('   2. 编辑 .env.local 文件');
  console.log('   3. 填入你的DeepSeek API密钥: VITE_DEEPSEEK_API_KEY=sk-xxx');
  console.log('   4. 重启开发服务器: pnpm dev');
} else {
  logger.info('环境变量配置正常');
  console.log('   ✅ 环境变量配置正常');
}

// 4. 测试API连接（如果配置完整）
if (!configIssues.includes('VITE_DEEPSEEK_API_KEY')) {
  logger.info('API密钥已配置，可进行API连接测试');
  console.log('\n4. API连接测试:');
  console.log('   💡 可以通过Web界面测试API连接，或者运行:');
  console.log('      node test-api.mjs');
} else {
  logger.warn('API密钥未配置，无法进行API连接测试');
}

// 保存诊断结果
const diagnosisFile = path.join(process.cwd(), 'test', 'diagnosis-result.json');
try {
  fs.writeFileSync(diagnosisFile, JSON.stringify(diagnosis, null, 2));
  logger.info('诊断结果已保存', { diagnosisFile });
} catch (error) {
  logger.error('保存诊断结果失败', { error });
}

const endTime = Date.now();
const duration = endTime - startTime;
logger.endTest('API配置诊断', duration, configIssues.length === 0);

console.log('\n=====================================');
console.log('📚 更多帮助:');
console.log('   - README.md: 完整使用指南');
console.log('   - docs/QUICK_START.md: 快速开始');
console.log('   - GitHub Issues: 问题反馈');

// 显示日志文件位置
console.log('\n📄 日志文件:');
console.log(`   日志位置: ${logger.getLogFilePath()}`);
console.log(`   诊断结果: ${diagnosisFile}`);