# Prompt Engineering Matrix

<div align="center">

![Prompt Engineering Matrix Logo](./assets/logo.svg)

</div>

## 设计理念

- `X 层`：提示词工程师层（Conductor 调度 X0/X1/X4 专家）
- `Y 层`：面向业务场景的下游角色提示词
- `Z 层`：下游角色生成的结果内容

核心目标：把提示词设计从“单次对话”升级为“可路由、可复用、可迭代”的工程资产。

## NPM 部署 Quickstart

> 说明：仓库脚本通过 `npm run ...` 触发，但内部使用 `pnpm workspace` 编排。

```bash
# 1) 克隆项目
git clone https://github.com/hhx465453939/prompt_design.git
cd prompt_design

# 2) 安装依赖（先确保 pnpm 可用）
npm i -g pnpm
pnpm install

# 3) 配置环境变量（按需）
cp env.example .env.local

# 4) 构建
npm run build

# 5) 本地预览（部署前 smoke test）
pnpm -F @prompt-matrix/web preview --host 0.0.0.0 --port 3000

# 5) 运行开发部署
npm run dev
```

默认预览地址：`http://localhost:3000`

## License

[Apache-2.0](LICENSE)
