# 贡献指南

感谢你对 Overtime Tracker 的关注。欢迎通过 Issue 与 Pull Request 参与改进。

## 开始之前

1. 阅读 [README.md](./README.md) 与 [AGENTS.md](./AGENTS.md)，了解项目定位与分层约定。
2. 使用 **pnpm** 安装依赖，不要使用 npm / yarn。
3. 复制 `.env.example` 为 `.env`，配置本地 PostgreSQL（推荐 Neon）后再开发。

## 本地开发

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

## 提交前检查

```bash
pnpm lint
pnpm test
pnpm build
```

涉及加班口径、节假日规则、AI 行为或分享快照逻辑时，请同步更新/补充 Vitest 用例。

## Pull Request 约定

- 一个 PR 聚焦一个主题，避免无关格式化或大范围重构。
- 说明改动动机、验证方式与残余风险。
- 不要提交 `.env`、密钥、证书或生产配置。
- 中文用户可见文案需保持可读，避免乱码。

## Issue 指引

- Bug：请附复现步骤、期望/实际结果、环境信息（Node / pnpm / 浏览器）。
- Feature：请先说明使用场景与边界，再讨论实现方案。
- 安全漏洞：请按 [SECURITY.md](./SECURITY.md) 私下报告，不要公开 Issue。

## 代码风格

- TypeScript 类型尽量完整，避免无约束 `any`。
- 业务逻辑放在 `lib/`，页面与 Route Handler 只做编排。
- 复用现有组件、工具函数与 API 返回结构，保持一致性。

再次感谢你的贡献。
