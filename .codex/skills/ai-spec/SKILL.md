---
name: ai-spec
description: 将自然语言需求转换为生产级技术规范与 AI 执行指令。用于需求不清晰、需要架构选型、需要完整技术规格或可执行任务清单时。
---

# AI Spec

## Overview

把用户需求翻译成结构化技术规格与可执行的“实现指令”，强调安全、测试、性能与可维护性。

## Workflow

### 1. 需求审计
- 提取核心功能与非功能需求（性能、安全、可靠性、可维护性、部署约束）。
- 标出缺失信息，优先询问：技术栈/版本、数据规模、并发指标、部署环境、合规要求。

### 2. 架构与技术栈决策
- 给出 2-3 种实现路径并简要对比（性能、成本、生态、团队技能）。
- 选择最优方案并记录权衡（ADR）。

### 3. 规格与实现约束
- 生成目录结构、核心数据模型、关键流程说明。
- 明确错误处理、测试策略、安全防护、性能基线。
- 明确文档交付：前端变更的用户说明书、后端/环境变更的开发与部署文档。

### 4. AI 执行指令
- 输出可直接交给编码工具的分阶段任务清单（初始化 → 核心模型 → 业务逻辑 → 接口层 → 测试/文档）。
- 指令必须可执行、避免含糊措辞。
- **Checkfix 闭环（必选）**：生成的执行指令中必须包含「每阶段/每次代码变更后按技术栈执行自动检查」的步骤（见下方「技术栈与推荐检查」），形成基础开发工作流：实现 → 检查 → 修正 → 再验收。

### 5. 文档与部署策略（必选）
- 前端功能更新必须包含 `docs/` 用户说明书更新任务，默认面向零基础用户，步骤写到可直接照做。
- 后端/API/环境迭代必须包含开发与部署文档更新任务，要求“新开发者可按文档独立完成部署与验证”。
- 每次功能或环境变更都要显式检查既有部署指导文档是否需要更新（如 `docs/DEPLOYMENT.md`、`docs/README.md`）。
- Python 部署优先级固定：`uv`（注意是 `uv`，不是 `uvicorn`）> 直接部署 > `conda`。
- 涉及 PyTorch 且目标环境有 NVIDIA GPU 时，默认优先给出 CUDA 版本安装命令（含官方 CUDA 索引链接），并附 CPU 回退命令。

### 技术栈与推荐检查（须写入生成的 AI 指令）

| 技术栈/类型 | 推荐检查 | 说明 |
|-------------|----------|------|
| Python | 优先 `uv venv` + `uv sync`（或 `uv pip install -r requirements.txt`），并执行 `ruff check .`、`ruff format --check .` 或 `black --check .` | 部署优先级：`uv`（非 `uvicorn`）> 直接部署 > `conda` |
| 前端 (Node/npm) | `npm install`（依赖变更时）、`npm run lint` 或 `npx eslint .`，可选 `npm run build` | 优先用 package.json scripts |
| PyTorch (GPU) | `uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124`（按目标 CUDA 版本调整） | 有 NVIDIA GPU 时优先 CUDA 包，并给 CPU 回退命令 |
| Rust | `cargo check` 或 `cargo clippy` | 编译与 Clippy |
| Go | `go build ./...`、`gofmt -l .` 或 `golangci-lint run` | 编译与格式/静态检查 |
| Java/Kotlin (Maven) | `mvn compile` 或 `mvn verify` | 编译与测试 |
| Java/Kotlin (Gradle) | `./gradlew compileJava` 或 `./gradlew check` | 同上 |
| C# / .NET | `dotnet build`、`dotnet format --verify-no-changes` | 编译与格式 |
| 通用 | 项目内已配置的 lint/format/check 脚本 | 优先执行项目既有脚本 |

## Output Format (required)

```markdown
# [项目名称]: 技术规范与 AI 指令

## 1. 需求审计总结（含缺失信息）
## 2. 架构决策记录（含备选与权衡）
## 3. 系统设计（目录结构 / 数据模型 / 关键流程）
## 4. 详细实现要求（错误处理 / 测试 / 安全 / 性能）
## 5. AI 执行指令（分阶段任务清单）
```

## Guardrails
- 信息不足时先提问，不擅自假设关键约束。
- 技术栈中立，除非用户已指定。
- 明确安全红线（输入验证、敏感数据、依赖安全）。
- 输出必须达到生产级（Production-Ready）标准。
- **生成的 AI 执行指令中必须包含 Checkfix 闭环**：按技术栈在每阶段或每次代码变更后执行自动检查，作为最基础的代码开发工作流，不可省略。
- **生成的 AI 执行指令中必须包含 docs 同步任务**：前端功能更新对应用户说明书，后端/环境变更对应开发与部署文档。
- **文档写作默认“零基础可执行”**：按步骤、命令、预期结果、故障排查、回滚方案完整交付。
