import { LLMService, RouterService } from '@prompt-matrix/core';

async function testDeepSeekAPI() {
  console.log('🧪 开始测试DeepSeek API调用...');
  
  try {
    // 1. 初始化LLM服务
    const llmService = new LLMService();
    llmService.initialize({
      provider: 'deepseek',
      apiKey: 'sk-test',  // 这里需要真实的API key
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    console.log('✅ LLM服务初始化成功');
    
    // 2. 创建路由服务
    const routerService = new RouterService(llmService);
    console.log('✅ 路由服务创建成功');
    
    // 3. 测试简单请求（非流式）
    console.log('🔄 开始测试API调用...');
    const response = await routerService.handleRequest('你好，请简单介绍一下自己');
    
    console.log('✅ API调用成功！');
    console.log('Agent类型:', response.agentType);
    console.log('意图:', response.intent);
    console.log('响应内容:', response.content.slice(0, 200) + '...');
    console.log('Token使用量:', response.metadata.tokensUsed);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  testDeepSeekAPI();
}