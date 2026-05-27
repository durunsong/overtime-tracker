# Claude Code 项目规则

@AGENTS.md

Claude Code 在 `overtime-tracker/` 中工作时，必须优先遵守同目录 `AGENTS.md`，并补充执行以下约定：

- 开始编码前，先读取 `docs/规范.md`、`docs/prompt.md` 和待修改文件的上下文。
- 这是 Next.js 16 项目。涉及 App Router、Route Handlers、缓存、Server/Client Components、metadata、font、image、config 等能力时，先查 `node_modules/next/dist/docs/` 的对应文档。
- 先小步实现、再验证。不要一次生成超大页面、超大工具文件或无法维护的全量功能。
- 页面与组件优先拆分到 `components/`、`lib/`、`types/` 等目录，避免把业务逻辑堆在 `app/**/page.tsx`。
- 加班计算、Excel 解析、AI Prompt、Prisma 访问、月报导出必须封装为独立模块。
- 修改后优先运行项目已有命令：`npm run lint`，必要时运行 `npm run build`。如果命令失败或未运行，最终回复必须说明原因。
- 不修改 `.env*`、`node_modules/`、`.next/`、构建产物或真实密钥配置。
- 每次交付前检查本次改动文件的 UTF-8 编码和中文可读性，发现乱码先修复。

阶段推进顺序以 `docs/规范.md` 的 Phase 1 到 Phase 8 为准；除非用户明确指定，否则优先先完成基础设施、核心计算和基础页面，再扩展 Excel、月报和 AI。
