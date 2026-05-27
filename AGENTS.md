# overtime-tracker AI 协作规则

本文件适用于 `overtime-tracker/` 子项目。修改本项目时，必须同时遵守仓库根目录 `AGENTS.md` 的安全边界；如与根目录规则冲突，以更严格、更安全的规则为准。

## 沟通与执行方式

- 始终使用简体中文沟通，先给结论，再说明关键依据。
- 修改前先阅读本文件、`docs/规范.md`、`docs/prompt.md`、相关源码和就近规则。
- 不凭经验猜业务。加班口径、Excel 字段、状态流转、AI 输出边界不明确时，先确认再实现。
- 不做无关重构，不批量格式化无关文件，不覆盖用户已有改动。
- 搜索优先使用 `rg` / `rg --files`。
- 本项目当前使用 Next.js 16，API、目录和约定可能与旧版本不同。写 Next.js 代码前，优先查看 `node_modules/next/dist/docs/` 中的相关文档，并注意废弃提示。

## 项目定位

`overtime-tracker` 是一个现代化加班统计平台，目标能力包括：

- Excel 打卡数据导入与字段识别。
- 自动计算每日/每月加班时长。
- Dashboard 统计看板与图表分析。
- 打卡记录管理、规则配置、月报生成与导出。
- 基于真实考勤数据的 AI 智能总结和问答。

这个项目不是普通 CRUD 后台。首页应有高级 SaaS 官网质感，Dashboard 应像专业数据产品，而不是简单堆叠默认组件。

## 技术栈约束

- Next.js App Router + TypeScript + React。
- Tailwind CSS 作为样式基础。
- UI 组件优先使用 shadcn/ui 风格和本地可复用组件。
- 图表优先使用 Recharts 或 ECharts。
- Excel 解析优先使用 `xlsx` 或 `exceljs`。
- 时间计算优先使用 `date-fns` 或 `dayjs`。
- 表单与接口校验使用 `zod`，表单处理使用 `react-hook-form`。
- Toast 使用 `sonner`，图标使用 `lucide-react`。
- 数据库使用 Prisma ORM + Neon PostgreSQL。
- AI 能力使用 Vercel AI SDK 或兼容 OpenAI API 的统一封装。
- 不主动新增依赖。确需新增时，先说明用途、影响和替代方案，再执行安装与改造。

## 目录与分层

推荐目录结构以 `docs/规范.md` 为准，核心约定如下：

- `app/`：页面、布局、Route Handlers。页面层只做渲染、交互编排和调用封装能力。
- `components/`：可复用 UI、landing、dashboard、charts、import、reports、ai 组件。
- `lib/attendance/`：加班计算、日期解析、格式化、校验等纯业务逻辑。
- `lib/excel/`：Excel 解析、字段映射、导入转换。
- `lib/ai/`：AI Client、Prompts 和工具函数；开发环境必须调用真实 AI 配置，不提供 Mock 模式。
- `lib/reports/`：月报生成、Excel/PDF 或打印版导出。
- `lib/prisma.ts`：统一 Prisma Client，避免 dev 模式重复实例化。
- `prisma/`：schema、migration、seed。
- `types/`：attendance、report、import、api 等共享类型。

不要把核心计算、Excel 解析、AI Prompt、数据库访问直接写在页面组件里。

## 数据模型要求

Prisma Schema 至少覆盖以下模型，并预留多用户能力：

- `User`
- `AttendanceRecord`
- `ImportBatch`
- `WorkRule`
- `MonthlyReport`

新增或调整数据库结构时：

- 同步更新 `prisma/schema.prisma`。
- 明确需要执行的命令，例如 `npx prisma generate`、`npx prisma migrate dev`、`npx prisma studio`。
- 不修改 `.env*`。只维护 `.env.example` 模板，不写入真实连接串、密钥或生产配置。

## 核心加班计算口径

默认工作规则：

- 上班时间：`09:30`
- 下班时间：`19:00`
- 标准工作时长：`480` 分钟
- 加班开始时间：`19:00`
- `09:30` 前打卡不额外计入有效工时

核心规则：

- 有效上班时间 = `max(实际上班打卡时间, 09:30)`。
- 每日有效出勤 = `实际下班时间 - 有效上班时间`。
- 每日加班分钟数 = `max(0, 实际下班时间 - 19:00)`。
- 月度加班口径需支持总出勤天数、总有效出勤、总标准工时、总加班、平均加班、最大/最小单日加班、迟到/早退/异常次数、周趋势和日趋势。

异常场景必须显式处理：

- 缺少上班打卡。
- 缺少下班打卡。
- 下班时间早于上班时间。
- 日期或时间格式异常。
- Excel 行数据无法解析。
- 同一天多条记录冲突或合并策略不明确。

核心工具函数建议独立封装：

- `parseTime`
- `parseExcelDate`
- `calculateDailyAttendance`
- `calculateMonthlyReport`
- `formatMinutes`
- `minutesToDecimalHours`
- `groupByMonth`
- `groupByWeek`
- `validateAttendanceRow`

核心计算逻辑必须配套单元测试或至少提供稳定测试用例数据。

## 页面与功能范围

按阶段推进，不要一次性写不可维护的大文件。

1. Phase 1：依赖检查、Tailwind/shadcn 基础、Prisma/Neon、基础 Layout、首页、Dashboard Layout。
2. Phase 2：加班计算、时间解析、每日/月度统计、测试数据、Dashboard Summary。
3. Phase 3：Excel 上传、解析、字段识别、预览、校验、确认导入、写库。
4. Phase 4：Dashboard 卡片、趋势图、异常统计、最近导入记录。
5. Phase 5：记录列表、新增、编辑、删除、筛选、重新计算。
6. Phase 6：月报生成、查看、Excel 导出、PDF 或 HTML 打印版。
7. Phase 7：AI Chat、AI 月报总结、AI 异常分析、结果保存。
8. Phase 8：动效、loading、错误态、空状态、响应式、README、部署说明。

目标页面：

- `/`：产品官网首页。
- `/dashboard`：统计看板。
- `/dashboard/records`：打卡记录。
- `/dashboard/import`：Excel 导入。
- `/dashboard/reports`：月报。
- `/dashboard/rules`：规则配置。
- `/dashboard/ai`：AI 分析助手。

## UI/UX 要求

- 首页强调深色科技风、玻璃拟态、渐变、流光、动效、数据可视化和强视觉 Hero。
- Dashboard 采用 Sidebar + Topbar，信息密度高但清晰，统计卡片和图表要专业。
- 不要只使用 shadcn 默认样式堆页面。
- 所有页面都要考虑 loading、empty、error 状态。
- 用户可见中文文案必须自然、清晰、无乱码。
- 按 `docs/规范.md` 要求适配 `1440px`、`1200px`、`768px`、`375px`；如与根目录“默认桌面端”规则不同，以本项目 docs 的明确产品要求为准。

## API 与错误处理

- 基于 Next.js App Router 实现 Route Handlers 或 Server Actions。
- 所有外部输入必须使用 `zod` 校验。
- API 返回统一结构：

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

- 错误处理要可排障，不吞异常，不向前端暴露敏感信息。
- 数据库访问统一封装，不在组件中直接散落 Prisma 查询。

## AI 功能边界

- AI 回答必须基于数据库真实考勤数据。
- 数据不足时必须明确说明没有数据，不能编造。
- API Key、模型名、Base URL 只能通过环境变量读取。
- 无 Key 时接口必须明确报错，不允许生成 Mock 回答。
- Prompt 统一维护在 `lib/ai/prompts.ts`，避免散落在组件或接口里。

## Excel 导入要求

- 支持 `.xlsx` / `.xls`，上传前校验类型和大小。
- 支持拖拽上传、字段映射、前 20 行预览、异常原因展示。
- 尽量自动识别常见表头：日期、打卡日期、姓名、员工姓名、上班时间、上班打卡、签到时间、下班时间、下班打卡、签退时间、实际出勤时长、考勤状态、备注。
- 导入成功后生成 `ImportBatch`，写入打卡记录，并重新计算统计结果。

## 质量与验证

- TypeScript 类型完整，避免 `any`。确需使用时说明原因并限制范围。
- 核心计算、Excel 解析、AI Prompt、导出逻辑应拆成可测试模块。
- 修改页面后优先运行 `npm run lint`、`npm run build` 或相关测试。
- 涉及用户可见页面时，尽量启动 `npm run dev` 并做浏览器验证。
- 每次修改后检查本次改动文件是否为 UTF-8，且不存在中文乱码、异常替换字符或 BOM 异常。
- 最终交付必须说明：改了哪些文件、做了哪些验证、是否检查乱码、是否有风险或待确认事项。
