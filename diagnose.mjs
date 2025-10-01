#!/usr/bin/env node

/**
 * API配置诊断工具
 * 帮助检查DeepSeek API配置是否正确
 */

console.log('🔍 智能提示词工程师系统 - API配置诊断');
console.log('=====================================\n');

// 1. 检查环境变量
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
      console.log(`   ✅ ${varName}: ${value.slice(0, 10)}...${value.slice(-4)}`);
    } else {
      console.log(`   ✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`   ❌ ${varName}: 未配置`);
    configIssues.push(varName);
  }
});

// 2. 检查文件存在性
console.log('\n2. 检查配置文件:');
const fs = await import('fs');
const path = await import('path');

const configFiles = ['.env.local', '.env', 'env.example'];
configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}: 存在`);
  } else {
    console.log(`   ❌ ${file}: 不存在`);
  }
});

// 3. 提供配置建议
console.log('\n3. 配置建议:');
if (configIssues.length > 0) {
  console.log('   ⚠️  发现配置问题:');
  configIssues.forEach(varName => {
    if (varName.includes('API_KEY')) {
      console.log(`      - 缺少${varName}: 请配置你的DeepSeek API密钥`);
    } else {
      console.log(`      - 缺少${varName}: 请配置相应的模型参数`);
    }
  });
  
  console.log('\n   📝 配置步骤:');
  console.log('   1. 复制配置文件: cp .env.local.example .env.local');
  console.log('   2. 编辑 .env.local 文件');
  console.log('   3. 填入你的DeepSeek API密钥: VITE_DEEPSEEK_API_KEY=sk-xxx');
  console.log('   4. 重启开发服务器: pnpm dev');
} else {
  console.log('   ✅ 环境变量配置正常');
}

// 4. 测试API连接（如果配置完整）
if (!configIssues.includes('VITE_DEEPSEEK_API_KEY')) {
  console.log('\n4. API连接测试:');
  console.log('   💡 可以通过Web界面测试API连接，或者运行:');
  console.log('      node test-api.mjs');
}

console.log('\n=====================================');
console.log('📚 更多帮助:');
console.log('   - README.md: 完整使用指南');
console.log('   - docs/QUICK_START.md: 快速开始');
console.log('   - GitHub Issues: 问题反馈');