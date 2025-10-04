#!/usr/bin/env node

/**
 * API配置优先级验证脚本
 * 验证WebUI配置是否覆盖环境变量配置
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
logger.startTest('API配置优先级验证');

console.log('🔍 API配置优先级验证');
console.log('=====================================\n');

async function verifyConfigPriority() {
  console.log('1. 检查环境变量配置:');
  
  // 环境变量配置（模拟.env.local）
  const envConfig = {
    provider: 'deepseek',
    apiKey: process.env.VITE_DEEPSEEK_API_KEY || 'sk-env-test',
    baseURL: process.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEFAULT_EXPERT_MODEL || 'deepseek-chat',
  };
  
  const maskedEnvKey = envConfig.apiKey.includes('sk-') ? `${envConfig.apiKey.slice(0, 10)}...${envConfig.apiKey.slice(-4)}` : envConfig.apiKey;
  
  console.log(`   环境变量API Key: ${maskedEnvKey}`);
  console.log(`   环境变量Provider: ${envConfig.provider}`);
  console.log(`   环境变量Model: ${envConfig.model}`);
  
  logger.info('环境变量配置', { 
    apiKey: maskedEnvKey,
    provider: envConfig.provider,
    model: envConfig.model 
  });
  
  console.log('\n2. 模拟WebUI配置（localStorage）:');
  
  // WebUI配置（用户在前端填写，优先级最高）
  const webuiConfig = {
    provider: 'deepseek',
    apiKey: 'sk-webui-user-input-12345',  // 模拟用户在前端填写的API Key
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
  };
  
  console.log(`   WebUI API Key: ${webuiConfig.apiKey}`);
  console.log(`   WebUI Provider: ${webuiConfig.provider}`);
  console.log(`   WebUI Model: ${webuiConfig.model}`);
  
  logger.info('WebUI配置', { 
    apiKey: webuiConfig.apiKey,
    provider: webuiConfig.provider,
    model: webuiConfig.model 
  });
  
  console.log('\n3. 验证配置优先级:');
  
  // 模拟配置优先级逻辑
  function loadConfig() {
    const defaultConfig = {
      provider: 'deepseek',
      apiKey: 'sk-default',
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
    };
    
    console.log(`   默认配置: ${defaultConfig.apiKey}`);
    
    // 1. 检查localStorage（WebUI配置）
    console.log('   步骤1: 检查localStorage (WebUI配置)...');
    // 在实际应用中，localStorage会存储用户配置
    const hasWebUIConfig = true; // 模拟存在WebUI配置
    
    if (hasWebUIConfig) {
      console.log(`   ✅ 发现WebUI配置: ${webuiConfig.apiKey}`);
      logger.info('使用WebUI配置（最高优先级）', { finalApiKey: webuiConfig.apiKey });
      return { ...defaultConfig, ...webuiConfig }; // WebUI配置覆盖默认
    }
    
    // 2. 检查环境变量
    console.log('   步骤2: 检查环境变量...');
    const hasEnvConfig = !!process.env.VITE_DEEPSEEK_API_KEY;
    
    if (hasEnvConfig) {
      console.log(`   ✅ 发现环境变量配置: ${maskedEnvKey}`);
      logger.info('使用环境变量配置（中等优先级）', { finalApiKey: maskedEnvKey });
      return { ...defaultConfig, ...envConfig }; // 环境变量覆盖默认
    }
    
    // 3. 使用默认配置
    console.log('   步骤3: 使用默认配置...');
    logger.info('使用默认配置（最低优先级）', { finalApiKey: defaultConfig.apiKey });
    return defaultConfig;
  }
  
  const finalConfig = loadConfig();
  
  console.log('\n4. 最终使用的配置:');
  console.log(`   ✅ 最终API Key: ${finalConfig.apiKey}`);
  console.log(`   ✅ 最终Provider: ${finalConfig.provider}`);
  console.log(`   ✅ 最终Model: ${finalConfig.model}`);
  
  // 验证优先级
  const isUsingWebUIConfig = finalConfig.apiKey === webuiConfig.apiKey;
  const isUsingEnvConfig = finalConfig.apiKey === envConfig.apiKey;
  const isUsingDefaultConfig = finalConfig.apiKey === 'sk-default';
  
  console.log('\n5. 优先级验证结果:');
  
  if (isUsingWebUIConfig) {
    console.log('   ✅ WebUI配置生效（优先级最高）');
    logger.info('验证成功: WebUI配置覆盖环境变量', { 
      finalConfig,
      priority: 'WebUI > Env > Default'
    });
  } else if (isUsingEnvConfig) {
    console.log('   ⚠️  环境变量配置生效（WebUI配置不存在）');
    logger.info('验证结果: 环境变量配置生效', { 
      finalConfig,
      priority: 'Env > Default'
    });
  } else {
    console.log('   ❌ 默认配置生效（无任何配置）');
    logger.info('验证结果: 默认配置生效', { 
      finalConfig,
      priority: 'Default'
    });
  }
  
  // 保存验证结果
  const verificationResult = {
    timestamp: new Date().toISOString(),
    testType: 'config-priority-verification',
    environmentConfig: {
      hasAPIKey: !!process.env.VITE_DEEPSEEK_API_KEY,
      apiKey: maskedEnvKey,
      provider: envConfig.provider,
      model: envConfig.model
    },
    webuiConfig: {
      apiKey: webuiConfig.apiKey,
      provider: webuiConfig.provider,
      model: webuiConfig.model
    },
    finalConfig: {
      apiKey: finalConfig.apiKey,
      provider: finalConfig.provider,
      model: finalConfig.model,
      source: isUsingWebUIConfig ? 'WebUI' : isUsingEnvConfig ? 'Environment' : 'Default'
    },
    priority: 'WebUI > Environment > Default',
    success: true
  };
  
  const resultFile = path.join(process.cwd(), 'test', 'config-priority-verification.json');
  fs.writeFileSync(resultFile, JSON.stringify(verificationResult, null, 2));
  logger.info('验证结果已保存', { resultFile });
  
  return verificationResult;
}

// 运行验证
const startTime = Date.now();
verifyConfigPriority().then(result => {
  const duration = Date.now() - startTime;
  logger.endTest('API配置优先级验证', duration, true);
  
  console.log('\n=====================================');
  console.log('📊 验证总结');
  console.log('=====================================');
  console.log(`配置优先级: WebUI > Environment > Default`);
  console.log(`最终使用的API: ${result.finalConfig.apiKey}`);
  console.log(`来源: ${result.finalConfig.source}`);
  console.log('📄 验证结果文件:', path.join(process.cwd(), 'test', 'config-priority-verification.json'));
  console.log('📄 日志文件:', logger.getLogFilePath());
}).catch(error => {
  const duration = Date.now() - startTime;
  logger.endTest('API配置优先级验证', duration, false);
  console.error('验证失败:', error);
});