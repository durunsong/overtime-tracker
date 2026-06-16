# Claude Code 项目规则

@AGENTS.md

Claude Code 在 `overtime-tracker/` 中工作时，必须优先遵守同目录 `AGENTS.md`，并补充执行以下约定：

## 开始任务前

1. 读取 `AGENTS.md`、`README.md`、`docs/china-holiday-rules.md` 与待修改文件上下文。
2. 确认任务是否涉及加班口径、节假日规则、AI 配置、导入流程或分享快照；涉及时必须对照 `lib/attendance/calculate.ts`、`lib/calendar/`、`lib/ai/` 现有实现。
3. 检查工作区是否已有用户改动，不要覆盖或回滚无关 diff。

## Next.js 16 注意事项

- 涉及 App Router、Route Handlers、缓存、Server/Client Components、metadata、font、image、config 等能力时，先查 `node_modules/next/dist/docs/` 对应文档。
- 只在需要 hooks、浏览器 API、动画库或交互状态时添加 `"use client"`。
- 页面与组件优先拆分到 `components/`、`lib/`、`types/`，避免把业务逻辑堆在 `app/**/page.tsx`。

## 模块边界

必须封装为独立模块的能力：

- 加班计算与时间解析 → `lib/attendance/`
- Excel 解析与导入 → `lib/excel/`、`lib/import/`
- AI Client、Prompt、截图 OCR、问答流 → `lib/ai/`
- Prisma 数据访问 → `lib/data/`、`lib/prisma.ts`
- 月报生成与导出 → `lib/reports/`
- 认证与会话 → `lib/auth/`

## AI 配置

- AI 通过 `AI_PROVIDER`、`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 接入 OpenAI 兼容接口，不限定单一厂商或模型。
- 截图 OCR 需要支持图像输入的多模态模型；文本总结与问答可使用文本或多模态模型。
- `.env.example` 中的 GLM 配置仅作示例，可替换为任意兼容 Provider。
- 不提供 Mock AI；配置缺失时接口应返回明确错误。
- 修改 Prompt 时只改 `lib/ai/prompts.ts`，并考虑截图导入与文本问答两类场景。

## 验证与交付

- 修改后优先运行 `pnpm test`、`pnpm lint`；涉及构建或路由变更时运行 `pnpm build`。
- 如果命令失败或未运行，最终回复必须说明原因与已做的替代检查。
- 不修改 `.env*`、`node_modules/`、`.next/`、构建产物或真实密钥配置；环境示例只维护 `.env.example`。
- 每次交付前检查本次改动文件的 UTF-8 编码和中文可读性，发现乱码先修复。

## 受保护范围

```text
.env*
node_modules/**
.next/**
dist/**
build/**
```

除非用户在当前任务中明确点名，否则不要修改上述内容。
