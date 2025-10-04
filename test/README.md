# 测试工具集

本目录包含了智能提示词工程师系统的完整测试工具套件，用于验证前端后端连接、API通信、Agent系统等核心功能。

## 📋 测试脚本概览

### 🔧 核心测试脚本

| 脚本名称 | 功能描述 | 适用场景 | 状态 |
|---------|---------|---------|------|
| `quick-test.mjs` | **快速系统验证** | **日常检查，快速验证系统状态** | ⭐ **强烈推荐** |
| `test-real-api.mjs` | 真实API连接测试 | 验证API密钥有效性，基础通信测试 | ✅ 推荐使用 |
| `test-agent-fixed.mjs` | Agent系统修复验证 | 验证Agent系统是否正常工作 | ✅ 推荐使用 |
| `test-direct.mjs` | 直接API调用测试 | 简单的API连接验证 | ✅ 基础测试 |
| `diagnose.mjs` | 环境配置诊断 | 检查环境变量和配置文件 | ✅ 配置检查 |

### 🔄 完整流程测试

| 脚本名称 | 功能描述 | 适用场景 | 状态 |
|---------|---------|---------|------|
| `test-full-chat-flow.mjs` | 完整对话流程测试 | 端到端功能验证 | ⚠️ 需要修复 |
| `test-simple-chat.mjs` | 简化核心对话测试 | 绕过Agent系统的基础测试 | ⚠️ 需要修复 |
| `test-api.mjs` | API集成测试 | 测试完整的API调用流程 | ⚠️ 需要修复 |
| `test-simple.mjs` | 简单API配置测试 | 基础API配置验证 | ⚠️ 需要修复 |

### 🛠️ 工具脚本

| 脚本名称 | 功能描述 | 适用场景 |
|---------|---------|---------|
| `logger.mjs` | 日志管理系统 | 为所有测试提供统一的日志功能 |
| `run-all-tests.mjs` | 统一测试运行器 | 批量运行所有测试脚本 |

---

## 🚀 快速开始

### ⭐ 推荐的快速验证（日常使用）
```bash
# 一键快速验证系统状态（强烈推荐）
node quick-test.mjs
```

### 🔧 详细测试步骤

#### 1. 基础环境检查
```bash
# 检查API配置和环境变量
node diagnose.mjs
```

#### 2. API连接验证
```bash
# 使用真实API密钥测试连接（推荐）
node test-real-api.mjs

# 或者使用简单的直接API测试
node test-direct.mjs
```

#### 3. Agent系统验证
```bash
# 验证Agent系统是否修复成功
node test-agent-fixed.mjs
```

---

## 📖 详细使用指南

### 🔧 核心推荐脚本

#### `quick-test.mjs` - 快速系统验证 ⭐ **强烈推荐**
**用途**: 日常快速检查系统状态
**特点**: 
- 一键运行核心测试组合
- 涵盖环境配置、API连接、Agent系统
- 生成简洁的测试报告
- 提供针对性的问题建议

**输出**: 
- 测试通过率统计
- 问题描述和解决方案
- 系统状态评估

```bash
node quick-test.mjs
```

#### `test-real-api.mjs` - 真实API连接测试
**用途**: 验证DeepSeek API密钥有效性和基础通信功能
**特点**: 
- 使用真实API密钥
- 测试非流式和流式响应
- 模拟前端对话流程
- 提供详细的性能分析

**输出**: 
- API连接状态
- 响应时间分析
- 流式chunks统计
- 性能建议

```bash
node test-real-api.mjs
```

#### `test-agent-fixed.mjs` - Agent系统修复验证
**用途**: 验证Agent矩阵系统是否正常工作
**特点**:
- 测试Agent加载和初始化
- 验证智能路由功能
- 测试不同Agent类型的响应
- 模拟完整的前端对话流程

```bash
node test-agent-fixed.mjs
```

#### `diagnose.mjs` - 环境配置诊断
**用途**: 检查系统环境配置是否正确
**特点**:
- 检查环境变量配置
- 验证配置文件存在性
- 提供配置建议
- 生成诊断报告

```bash
node diagnose.mjs
```

#### `test-direct.mjs` - 直接API调用测试
**用途**: 最简单的API连接验证
**特点**:
- 直接调用OpenAI SDK
- 最小化依赖
- 快速验证API密钥

```bash
node test-direct.mjs
```

### 🔄 完整流程测试

#### `test-full-chat-flow.mjs` - 完整对话流程测试
**用途**: 端到端的完整功能测试
**特点**:
- 模拟前端发送消息
- 测试Agent路由和响应
- 验证流式响应机制
- 生成完整测试报告

**注意**: 目前需要修复Agent文件加载问题

#### `test-simple-chat.mjs` - 简化核心对话测试
**用途**: 绕过Agent系统的核心功能测试
**特点**:
- 直接测试LLM服务
- 避免Agent系统复杂性
- 专注于API通信验证

---

## 📊 测试结果文件

所有测试脚本都会在`test/`目录下生成以下文件：

### 日志文件
- **统一日志目录**: `logs/` (项目根目录)
- `logs/test-*.log` - 测试脚本执行日志
- `logs/frontend-*.log` - 前端运行日志
- `logs/backend-*.log` - 后端服务日志
- `logs/system-*.log` - 系统级日志
- 包含时间戳、执行过程、错误信息等

### JSON报告文件
- `real-api-diagnosis.json` - API连接诊断报告
- `agent-fix-evaluation.json` - Agent修复评估报告
- `test-report.json` - 统一测试运行报告
- `simple-chat-test-report.json` - 简化对话测试报告

### 错误报告文件
- `*-error-report.json` - 各种测试的错误报告
- `chat-flow-error-report.json` - 对话流程错误报告

---

## 🔍 问题排查指南

### 1. API连接问题
**症状**: API调用失败、认证错误
**解决方案**:
```bash
# 1. 检查API密钥配置
node diagnose.mjs

# 2. 测试直接API连接
node test-direct.mjs

# 3. 使用真实API密钥测试
node test-real-api.mjs
```

### 2. Agent系统问题
**症状**: Agent加载失败、路由错误
**解决方案**:
```bash
# 验证Agent修复效果
node test-agent-fixed.mjs

# 查看Agent加载日志
cat test-*.log | grep Agent
```

### 3. 前端卡住问题
**症状**: 前端发送消息后无响应
**解决方案**:
```bash
# 1. 检查API连接
node test-real-api.mjs

# 2. 验证Agent系统
node test-agent-fixed.mjs

# 3. 查看完整日志
cat test-*.log
```

### 4. 流式响应问题
**症状**: 流式显示不工作、chunks缺失
**解决方案**:
```bash
# 测试流式API响应
node test-real-api.mjs

# 检查流式性能
grep "流式" test-*.log
```

---

## 🛠️ 开发者指南

### 添加新测试脚本
1. 创建新的`.mjs`文件
2. 导入`logger.mjs`用于日志记录
3. 加载环境变量文件
4. 实现测试逻辑
5. 生成JSON报告文件
6. 更新本README文档

### 测试脚本模板
```javascript
#!/usr/bin/env node

import path from 'path';
import logger from './logger.mjs';
import { config } from 'dotenv';

// 加载环境变量
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
logger.startTest('测试名称');

async function runTest() {
  try {
    // 测试逻辑
    console.log('测试执行中...');
    
    // 保存结果
    const report = { /* 测试结果 */ };
    const reportFile = path.join(process.cwd(), 'test', 'test-result.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    logger.error('❌ 测试失败', { error: error.message });
    throw error;
  }
}

// 运行测试
const startTime = Date.now();
runTest().then(() => {
  const duration = Date.now() - startTime;
  logger.endTest('测试名称', duration, true);
  console.log('✅ 测试完成');
}).catch(error => {
  const duration = Date.now() - startTime;
  logger.endTest('测试名称', duration, false);
  console.error('❌ 测试失败:', error.message);
});
```

---

## 📝 注意事项

1. **API密钥安全**: 确保不要在日志中暴露完整的API密钥
2. **文件权限**: 确保test目录有读写权限
3. **网络连接**: 测试需要稳定的网络连接访问DeepSeek API
4. **Node.js版本**: 建议使用Node.js 18+版本
5. **依赖安装**: 确保所有依赖包已正确安装

---

## 🎯 推荐测试流程

### 日常开发测试
```bash
# 1. 快速检查
node diagnose.mjs

# 2. API验证
node test-real-api.mjs

# 3. Agent验证
node test-agent-fixed.mjs
```

### 问题排查流程
```bash
# 1. 环境诊断
node diagnose.mjs

# 2. API连接测试
node test-direct.mjs

# 3. 完整功能测试
node test-agent-fixed.mjs

# 4. 查看日志
cat test-*.log
```

---

**最后更新**: 2025-10-04  
**维护者**: Claude Code Assistant