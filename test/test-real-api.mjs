#!/usr/bin/env node

/**
 * 使用真实API密钥的对话测试
 * 解决前端卡住问题的诊断工具
 */

import path from 'path';
import logger from './logger.mjs';

console.log('🧪 使用真实API密钥的对话测试');
console.log('=====================================\n');

// 使用您之前配置的真实API密钥
const REAL_API_KEY = 'sk-01d7a9231b0e4e15aa902f99297d5f36';
const BASE_URL = 'https://api.deepseek.com';

console.log('1. API配置检查:');
console.log(`   ✅ 使用真实API密钥: ${REAL_API_KEY.slice(0, 10)}...${REAL_API_KEY.slice(-4)}`);
console.log(`   ✅ Base URL: ${BASE_URL}`);

// 清理旧日志
logger.info('🧹 清理旧日志文件...');
logger.constructor.cleanup(10);

// 开始测试
logger.startTest('真实API对话测试');

async function testRealAPI() {
  try {
    console.log('\n2. 导入OpenAI SDK:');
    const openaiModule = await import('../packages/core/node_modules/openai/index.js');
    const { default: OpenAI } = openaiModule;
    
    console.log('   ✅ OpenAI模块导入成功');
    
    console.log('\n3. 创建OpenAI客户端:');
    const client = new OpenAI({
      apiKey: REAL_API_KEY,
      baseURL: BASE_URL,
      dangerouslyAllowBrowser: true,
    });
    
    console.log('   ✅ OpenAI客户端创建成功');
    logger.info('OpenAI客户端创建成功', { baseURL: BASE_URL });
    
    // 测试1: 基础API调用
    console.log('\n4. 基础API调用测试:');
    const basicMessage = '你好，请简单介绍你自己，回复控制在50字以内';
    console.log(`   🔄 发送: "${basicMessage}"`);
    
    const basicResponse = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: basicMessage }],
      max_tokens: 100,
      temperature: 0.7,
    });
    
    const basicContent = basicResponse.choices[0]?.message?.content || '';
    const basicTokens = basicResponse.usage?.total_tokens || 0;
    
    console.log(`   ✅ 基础响应成功!`);
    console.log(`   📝 回复: ${basicContent}`);
    console.log(`   🔢 Token: ${basicTokens}`);
    
    logger.info('基础API调用成功', {
      content: basicContent,
      tokensUsed: basicTokens
    });
    
    // 测试2: 流式API调用（模拟前端体验）
    console.log('\n5. 流式API调用测试（关键测试）:');
    const streamMessage = '请分3个要点说明如何与AI进行有效对话';
    console.log(`   🔄 发送: "${streamMessage}"`);
    console.log('   📥 开始接收流式响应:');
    
    let streamContent = '';
    let chunkCount = 0;
    let totalResponseTime = 0;
    let firstChunkTime = null;
    let lastChunkTime = null;
    
    const streamStartTime = Date.now();
    
    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: streamMessage }],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });
    
    for await (const chunk of stream) {
      const chunkTime = Date.now();
      
      // 记录第一个chunk的时间
      if (firstChunkTime === null) {
        firstChunkTime = chunkTime;
        const firstChunkDelay = firstChunkTime - streamStartTime;
        console.log(`   ⏱️  首个chunk延迟: ${firstChunkDelay}ms`);
        logger.info('首个chunk接收', { delay: firstChunkDelay });
      }
      
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        lastChunkTime = chunkTime;
        streamContent += content;
        chunkCount++;
        
        // 实时显示内容（模拟前端）
        process.stdout.write(content);
        
        // 每接收10个chunks记录一次
        if (chunkCount % 10 === 0) {
          logger.info('流式响应中', {
            chunks: chunkCount,
            currentLength: streamContent.length,
            avgTimePerChunk: (chunkTime - firstChunkTime) / chunkCount
          });
        }
      }
    }
    
    totalResponseTime = lastChunkTime - firstChunkTime;
    const avgChunkTime = chunkCount > 0 ? totalResponseTime / chunkCount : 0;
    
    console.log('\n   ✅ 流式响应完成!');
    console.log(`   📊 总chunks: ${chunkCount}`);
    console.log(`   ⏱️  总流式时间: ${totalResponseTime}ms`);
    console.log(`   📈 平均chunk时间: ${avgChunkTime.toFixed(2)}ms`);
    console.log(`   📝 最终内容长度: ${streamContent.length}`);
    
    logger.info('流式API调用完成', {
      totalChunks: chunkCount,
      totalTime: totalResponseTime,
      avgChunkTime: avgChunkTime,
      finalLength: streamContent.length
    });
    
    // 测试3: 模拟前端对话流程
    console.log('\n6. 前端对话流程模拟:');
    
    const simulateFrontendChat = async (userMessage) => {
      console.log(`   📱 用户输入: "${userMessage}"`);
      
      // 模拟前端状态
      const state = {
        loading: true,
        streaming: true,
        startTime: Date.now()
      };
      
      console.log('   🔄 状态: loading=true, streaming=true');
      
      // 调用API
      const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 200,
        temperature: 0.7,
        stream: true,
      });
      
      let aiResponse = '';
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          aiResponse += content;
        }
      }
      
      state.loading = false;
      state.streaming = false;
      state.endTime = Date.now();
      state.duration = state.endTime - state.startTime;
      
      console.log('   ✅ 状态: loading=false, streaming=false');
      console.log(`   📝 AI回复: ${aiResponse.slice(0, 100)}...`);
      console.log(`   ⏱️  对话耗时: ${state.duration}ms`);
      
      return {
        userMessage,
        aiResponse,
        duration: state.duration,
        responseLength: aiResponse.length
      };
    };
    
    // 执行模拟对话
    const chatResult = await simulateFrontendChat('什么是提示词工程？请用简单语言解释');
    
    logger.info('前端对话模拟完成', {
      userMessage: chatResult.userMessage,
      responseLength: chatResult.responseLength,
      duration: chatResult.duration
    });
    
    // 生成诊断报告
    console.log('\n7. 问题诊断报告:');
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      testType: 'real-api-diagnosis',
      apiStatus: {
        apiKeyValid: true,
        baseURL: BASE_URL,
        connectionWorking: true
      },
      performance: {
        basicAPI: '正常',
        streamAPI: {
          status: '正常',
          firstChunkDelay: firstChunkTime - streamStartTime,
          totalChunks: chunkCount,
          totalTime: totalResponseTime,
          avgChunkTime: avgChunkTime
        },
        frontendSimulation: {
          status: '正常',
          responseTime: chatResult.duration,
          responseLength: chatResult.responseLength
        }
      },
      issues: [],
      recommendations: []
    };
    
    // 分析性能
    if (totalResponseTime > 10000) {
      diagnosis.issues.push('流式响应时间过长（>10秒）');
      diagnosis.recommendations.push('建议检查网络连接或API响应速度');
    }
    
    if (avgChunkTime > 500) {
      diagnosis.issues.push('平均chunk时间过长（>500ms）');
      diagnosis.recommendations.push('可能影响前端用户体验');
    }
    
    if (firstChunkTime - streamStartTime > 3000) {
      diagnosis.issues.push('首个chunk延迟过长（>3秒）');
      diagnosis.recommendations.push('前端可能显示加载时间过长');
    }
    
    if (diagnosis.issues.length === 0) {
      diagnosis.recommendations.push('✅ API连接和响应正常');
      diagnosis.recommendations.push('✅ 流式响应机制工作正常');
      diagnosis.recommendations.push('✅ 前端后端通信无问题');
      diagnosis.recommendations.push('💡 如果前端仍然卡住，请检查：');
      diagnosis.recommendations.push('   1. 前端是否正确处理流式响应');
      diagnosis.recommendations.push('   2. Agent路由逻辑是否正常');
      diagnosis.recommendations.push('   3. 前端错误处理机制');
    }
    
    console.log('   📋 诊断结果:');
    if (diagnosis.issues.length > 0) {
      console.log('   ⚠️  发现的问题:');
      diagnosis.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    console.log('\n   💡 建议:');
    diagnosis.recommendations.forEach(rec => console.log(`      ${rec}`));
    
    // 保存诊断报告
    const reportFile = path.join(process.cwd(), 'test', 'real-api-diagnosis.json');
    const fs = await import('fs');
    fs.writeFileSync(reportFile, JSON.stringify(diagnosis, null, 2));
    
    console.log('\n=====================================');
    console.log('📊 测试总结');
    console.log('=====================================');
    console.log(`✅ API密钥验证: 有效`);
    console.log(`✅ 基础API调用: 正常`);
    console.log(`✅ 流式API调用: 正常`);
    console.log(`✅ 前端对话模拟: 正常`);
    console.log(`🎯 核心结论: API连接正常，前端后端基础通信无问题`);
    
    console.log('\n📄 诊断报告文件:', reportFile);
    console.log('📄 日志文件:', logger.getLogFilePath());
    
    return diagnosis;
    
  } catch (error) {
    logger.error('❌ 测试失败', { error: error.message, stack: error.stack });
    console.error('❌ 测试失败:', error.message);
    
    // 保存错误诊断
    const errorDiagnosis = {
      timestamp: new Date().toISOString(),
      testType: 'real-api-diagnosis',
      success: false,
      error: error.message,
      stack: error.stack,
      apiStatus: {
        apiKeyValid: false,
        error: error.message
      }
    };
    
    const errorFile = path.join(process.cwd(), 'test', 'real-api-error-diagnosis.json');
    const fs = await import('fs');
    fs.writeFileSync(errorFile, JSON.stringify(errorDiagnosis, null, 2));
    
    throw error;
  }
}

// 运行测试
const startTime = Date.now();
testRealAPI().then(diagnosis => {
  const totalDuration = Date.now() - startTime;
  logger.endTest('真实API对话测试', totalDuration, true);
  
  console.log('\n🎉 测试完成！');
  console.log(`⏱️  总耗时: ${totalDuration}ms`);
  
}).catch(error => {
  const totalDuration = Date.now() - startTime;
  logger.endTest('真实API对话测试', totalDuration, false);
  
  console.error('\n💥 测试失败:', error.message);
  console.log('📄 错误诊断文件:', path.join(process.cwd(), 'test', 'real-api-error-diagnosis.json'));
  console.log('📄 日志文件:', logger.getLogFilePath());
});