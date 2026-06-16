# overtime-tracker AI 协作规则

本文件适用于 `overtime-tracker/` 子项目。修改本项目时，必须同时遵守仓库根目录 `AGENTS.md` 的安全边界；如与根目录规则冲突，以更严格、更安全的规则为准。

## 沟通与执行方式

- 始终使用简体中文沟通，先给结论，再说明关键依据。
- 修改前先阅读本文件、`README.md`、`docs/china-holiday-rules.md`、相关源码和就近规则。
- 不凭经验猜业务。加班口径、节假日规则、Excel 字段、状态流转、AI 输出边界不明确时，先确认再实现。
- 不做无关重构，不批量格式化无关文件，不覆盖用户已有改动。
- 搜索优先使用 `rg` / `rg --files`，避开 `node_modules/`、`.next/`、构建产物。
- 本项目使用 Next.js 16。涉及 App Router、Route Handlers、Server/Client Components、缓存、metadata 等能力时，优先查看 `node_modules/next/dist/docs/` 对应文档。

## 项目定位

`overtime-tracker` 是一个现代化加班统计与个人考勤分析平台，当前已实现的核心能力包括：

- 用户注册、登录、登出、忘记密码、修改密码与会话管理。
- Excel 打卡数据导入、字段识别、预览校验与批次写入。
- 考勤截图 OCR 导入（依赖视觉模型）。
- 基于中国节假日/调休规则的每日与月度加班统计。
- 中国月历视图、单日手工补录与重新计算。
- Dashboard 统计看板、趋势图与异常统计。
- 打卡记录 CRUD、筛选与规则配置。
- 月报生成、Excel/PDF 导出、AI 月报总结与问答。
- 加班月报公开分享链接。

这不是普通 CRUD 后台。首页应有高级 SaaS 官网质感，Dashboard 应像专业数据产品，而不是简单堆叠默认组件。

## 技术栈约束

- Next.js 16 App Router + React 19 + TypeScript。
- Tailwind CSS v4 作为样式基础。
- UI 组件优先复用本地 shadcn/ui 风格组件与已有 dashboard/landing 组件。
- 图表使用 Recharts。
- Excel 解析使用 `xlsx`。
- 时间计算使用 `date-fns`。
- 表单与接口校验使用 `zod`；表单处理使用 `react-hook-form`。
- Toast 使用 `sonner`，图标使用 `lucide-react`，动效使用 `framer-motion`。
- 数据库使用 Prisma 7 + PostgreSQL（本地/部署常用 Neon）。
- AI 使用 Vercel AI SDK（`ai`、`@ai-sdk/openai`）接入 OpenAI 兼容接口；Provider 与模型通过环境变量配置，不限定单一厂商。截图导入对智谱等部分端点有额外适配。
- 测试使用 Vitest，Lint 使用 ESLint（`eslint-config-next`）。
- 不主动新增依赖。确需新增时，先说明用途、影响和替代方案。

## 目录与分层

核心约定如下，不要把业务逻辑堆在页面文件里：

| 目录 | 职责 |
| --- | --- |
| `app/` | 页面、布局、Route Handlers；只做渲染、交互编排和调用封装能力 |
| `components/` | landing、dashboard、charts、import、reports、share、auth 等可复用 UI |
| `lib/attendance/` | 加班计算、记录合并、格式化、校验等纯业务逻辑 |
| `lib/calendar/` | 中国节假日、月历元数据、农历展示 |
| `lib/excel/` | Excel 解析、字段映射、导入模板、导入转换 |
| `lib/import/` | 截图文件处理、导入摘要 |
| `lib/ai/` | AI Client、Prompts、截图 OCR、问答流式输出 |
| `lib/reports/` | 月报生成、Excel/PDF 导出、平均加班辅助文案 |
| `lib/share/` | 加班月报公开分享快照 |
| `lib/auth/` | 注册登录、会话、密码策略、回调 URL |
| `lib/data/` | 数据库访问封装（如 `attendance-repository`） |
| `lib/prisma.ts` | 统一 Prisma Client，避免 dev 模式重复实例化 |
| `prisma/` | schema、migration、seed |
| `types/` | attendance、report、import、api 等共享类型 |
| `scripts/` | 运维脚本（如 `calendar:sync`） |
| `docs/` | 运维与规则说明 |

禁止事项：

- 不在 `app/**/page.tsx` 中直接写 Prisma 查询、Excel 解析、核心加班计算或 Prompt 文本。
- 不在组件中散落 `process.env` 读取；AI 配置统一走 `lib/ai/client.ts`。
- Manager/页面层不要绕过 `lib/data/` 或既有 Service 封装直接构造复杂查询。

## 数据模型

Prisma Schema 当前包含：

- `User`、`UserSession`、`PasswordResetToken`
- `AttendanceRecord`、`ImportBatch`、`WorkRule`、`MonthlyReport`
- `OvertimeShare`

关键约束：

- `AttendanceRecord` 对 `(userId, workDate)` 唯一。
- 所有业务数据按 `userId` 隔离；会话通过 `UserSession.tokenHash` 校验。
- 新增或调整数据库结构时，同步更新 `prisma/schema.prisma`，并说明需执行的 `npx prisma generate`、`npx prisma migrate dev` 等命令。
- 不修改 `.env*`；只维护 `.env.example` 模板，不写入真实连接串、密钥或生产配置。

## 核心加班计算口径

默认工作规则（可被 `WorkRule` 覆盖）：

- 上班时间：`09:30`
- 下班时间：`19:00`
- 标准工作时长：`480` 分钟
- 加班开始时间：`19:00`
- `09:30` 前打卡不额外计入有效工时
- 午休：`12:00-13:30`，按与实际出勤重叠部分扣减（默认 90 分钟）

中国日历口径（见 `lib/calendar/china-calendar.ts` 与 `docs/china-holiday-rules.md`）：

- `WORKDAY`：普通工作日，按工作日规则计算。
- `WEEKEND`：普通周末；仅当 `weekendEnabled=true` 时计入加班。
- `HOLIDAY`：法定节假日；仅当 `holidayEnabled=true` 时计入加班。
- `ADJUSTED_WORKDAY`：调休补班日，即使落在周末也按普通工作日计算。

计算规则：

- 有效上班时间 = `max(实际上班打卡时间, 规则上班时间)`（受 `beforeStartNotCount` 控制）。
- 每日有效出勤 = `实际下班时间 - 有效上班时间 - 午休重叠分钟`。
- 普通工作日加班 = `max(0, 实际下班时间 - 加班开始时间)`。
- 普通周末/节假日加班 = `min(每日有效出勤, 480 - 迟到分钟数)`（受规则开关控制）。

异常场景必须显式处理并给出可读 `issues`：

- 缺少上班或下班打卡 → `ABNORMAL` 或 `ABSENT`。
- 下班早于或等于上班 → `ABNORMAL`。
- 日期或时间格式异常、Excel 行无法解析。
- 同一天多条记录需通过 `mergeRecordsByWorkDate` 等既有策略合并。

核心函数集中在 `lib/attendance/calculate.ts`、`parser.ts`、`validators.ts`、`records.ts`；修改口径时必须同步更新对应 Vitest 用例。

## 页面与 API 范围

主要页面：

- `/`：产品官网首页
- `/auth/login`、`/auth/register`、`/auth/forgot-password`、`/auth/reset-password`
- `/dashboard`：统计看板
- `/dashboard/calendar`：中国月历考勤
- `/dashboard/records`：打卡记录
- `/dashboard/import`：Excel / 截图导入
- `/dashboard/reports`：月报
- `/dashboard/rules`：规则配置
- `/dashboard/ai`：AI 分析助手
- `/dashboard/account`：账号设置
- `/share/[token]`：公开分享页

API 约定：

- Route Handlers 位于 `app/api/**`。
- 所有外部输入必须使用 `zod` 校验。
- 统一返回结构：

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

- 错误处理要可排障，不吞异常，不向前端暴露敏感信息或堆栈。
- 需要登录的接口通过 `lib/auth/session.ts` 获取当前用户；未登录返回明确错误。

## UI/UX 要求

- 首页强调深色科技风、玻璃拟态、渐变、流光、动效、数据可视化与强视觉 Hero。
- Dashboard 采用 Sidebar + Topbar，信息密度高但清晰，统计卡片和图表要专业。
- 不要只使用 shadcn 默认样式堆页面。
- 所有页面都要考虑 loading、empty、error 状态。
- 用户可见中文文案必须自然、清晰、无乱码。
- 适配 `1440px`、`1200px`、`768px`、`375px`；如与根目录“默认桌面端”规则不同，以本项目产品要求为准。

## AI 功能边界

AI 通过 OpenAI 兼容接口接入，**不限定单一模型或厂商**。只要 Provider 支持 Chat Completions，且模型具备所需能力，即可用于月报总结、问答和截图 OCR 导入。

模型选择建议：

- **文本总结与问答**：任意兼容的文本或多模态模型均可。
- **截图 OCR 导入**：优先选择支持图像输入的多模态（Vision）模型；纯文本模型会在接口层返回明确错误。
- 示例（任选其一，按实际 Provider 文档填写 `AI_BASE_URL` 与 `AI_MODEL`）：
  - 智谱：`glm-4.6v-flashx`、`glm-4.6v-flash`
  - OpenAI：`gpt-4o`、`gpt-4o-mini`
  - 其他兼容网关：按服务商文档填写模型名

配置项（详见 `README.md` 与 `.env.example`）：

- `AI_PROVIDER`：Provider 标识，便于区分适配逻辑（如 `zhipu`、`openai`、`openai-compatible`）
- `AI_BASE_URL`：OpenAI 兼容 Base URL
- `AI_API_KEY`：对应 Provider 的 API Key
- `AI_MODEL`：模型名，需与 Provider 文档一致

实现约束：

- AI 回答必须基于数据库真实考勤数据或用户上传的截图内容。
- 数据不足时必须明确说明，不能编造日期、时长或原因。
- API Key、模型名、Base URL 只能通过环境变量读取。
- 无 Key 或配置不完整时接口必须明确报错，不允许 Mock 回答。
- Prompt 统一维护在 `lib/ai/prompts.ts`。
- 截图导入走 `lib/ai/screenshot-import.ts`；智谱等特定端点可走 `resolveChatCompletionsUrl` 与 `buildZhipuScreenshotMessages`。
- 文本流式问答走 `lib/ai/tools.ts` 与 `streamAiText`。

## Excel 与截图导入

Excel：

- 支持 `.xlsx` / `.xls`，上传前校验类型和大小。
- 支持拖拽上传、字段映射、前 20 行预览、异常原因展示。
- 自动识别常见表头：日期、打卡日期、姓名、员工姓名、上班时间、上班打卡、签到时间、下班时间、下班打卡、签退时间、实际出勤时长、考勤状态、备注。
- 导入成功后生成 `ImportBatch`，写入打卡记录，并重新计算统计结果。

截图：

- 通过 AI 视觉模型 OCR 抽取打卡记录，批量大小见 `screenshotAiBatchSize`。
- 必须使用支持图像输入的视觉模型；纯文本模型会返回明确错误提示。
- 识别结果经 `zod` 校验与 `validateAttendanceRow` 二次校验后再入库。

## 分享与快照

- 公开分享通过 `OvertimeShare` 保存月报快照，链接形如 `/share/[token]`。
- 已生成的分享快照不会随节假日规则或计算口径变更自动更新；修改历史规则前需评估是否批量重算。

## 质量与验证

- TypeScript 类型完整，避免 `any`；确需使用时说明原因并限制范围。
- 核心计算、Excel 解析、AI Prompt、导出、分享逻辑应拆成可测试模块。
- 修改业务逻辑后优先运行：

```bash
npm run test
npm run lint
npm run build
```

- 涉及用户可见页面时，尽量启动 `npm run dev` 并做浏览器验证。
- 每次修改后检查本次改动文件是否为 UTF-8，且不存在中文乱码、异常替换字符或 BOM 异常。
- 最终交付必须说明：改了哪些文件、做了哪些验证、是否检查乱码、是否有风险或待确认事项。
