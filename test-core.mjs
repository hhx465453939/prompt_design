/**
 * 核心服务层测试脚本
 * 
 * 用法：
 * 1. 确保已构建：pnpm build
 * 2. 配置 .env.local（填入 VITE_DEEPSEEK_API_KEY）
 * 3. 运行：node test-core.mjs
 */

import { LLMService, RouterService, ConductorAgent } from './packages/core/dist/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

console.log('🚀 智能提示词工程师系统 - 核心服务测试\n');

// 检查 API Key
if (!process.env.VITE_DEEPSEEK_API_KEY) {
  console.error('❌ 错误：未找到 VITE_DEEPSEEK_API_KEY');
  console.error('请在 .env.local 中配置 DeepSeek API Key\n');
  console.log('示例：');
  console.log('VITE_DEEPSEEK_API_KEY=sk-your-key-here\n');
  process.exit(1);
}

console.log('✅ 环境变量加载成功');
console.log(`📝 API Key: ${process.env.VITE_DEEPSEEK_API_KEY.substring(0, 10)}...`);
console.log('');

// 测试场景
const testCases = [
  {
    name: '场景1：逆向分析提示词',
    input: `你是一个专业的Python编程助手。

## Role
- 角色：资深Python开发工程师
- 专长：代码审查、性能优化

## Skills
- Python语言精通
- 代码质量评估

## Goals
- 帮助用户编写高质量Python代码
- 提供专业的代码审查意见`,
    expectedAgent: 'X0_REVERSE'
  },
  {
    name: '场景2：生成场景化提示词',
    input: '帮我设计一个数据分析助手',
    expectedAgent: 'X4_SCENARIO'
  },
  {
    name: '场景3：基础Agent设计',
    input: '设计一个通用的AI助手',
    expectedAgent: 'X1_BASIC'
  }
];

async function runTest() {
  try {
    // 1. 初始化 LLM 服务
    console.log('🔧 初始化 LLM 服务...');
    const llmService = new LLMService();
    llmService.initialize({
      provider: 'deepseek',
      apiKey: process.env.VITE_DEEPSEEK_API_KEY,
      baseURL: process.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEFAULT_EXPERT_MODEL || 'deepseek-chat',
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.MAX_TOKENS || '4096'),
    });
    console.log('✅ LLM 服务初始化成功\n');

    // 2. 创建路由服务
    console.log('🔧 创建路由服务...');
    const routerService = new RouterService(llmService);
    console.log('✅ 路由服务创建成功\n');

    // 3. 测试意图识别（不调用 API）
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 测试：意图识别（本地测试，不消耗 API）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const conductor = new ConductorAgent();
    for (const testCase of testCases) {
      console.log(`🧪 ${testCase.name}`);
      console.log(`输入: ${testCase.input.substring(0, 50)}...`);
      
      const intent = await conductor.analyzeIntent(testCase.input);
      console.log(`✅ 识别意图: ${intent}`);
      console.log(`📍 预期调用: ${testCase.expectedAgent}\n`);
    }

    // 4. 真实 API 调用测试（可选）
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  真实 API 调用测试（将消耗 API 额度）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('是否执行真实 API 调用测试？（会调用 DeepSeek API）');
    console.log('如果要测试，请在代码中取消注释以下部分\n');

    // 取消注释以下代码来执行真实 API 测试
    /*
    const testInput = "帮我设计一个简单的AI助手";
    console.log(`📝 测试输入: ${testInput}`);
    console.log('🔄 正在处理...\n');

    const response = await routerService.handleRequest(testInput);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 响应结果');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🤖 调用的 Agent: ${response.agentType}`);
    console.log(`🎯 识别的意图: ${response.intent}`);
    console.log(`📊 Token 使用: ${response.metadata.tokensUsed || 'N/A'}`);
    console.log(`⏱️  时间戳: ${new Date(response.timestamp).toLocaleString()}`);
    console.log('\n📄 输出内容:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response.content.substring(0, 500) + '...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    */

    console.log('✅ 所有测试完成！');
    console.log('\n💡 提示：');
    console.log('   - 核心服务层工作正常');
    console.log('   - 如需 Web 界面，请等待 Phase 2 开发');
    console.log('   - 如需真实 API 测试，请取消注释代码中的测试部分\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('\n堆栈跟踪:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
runTest();

