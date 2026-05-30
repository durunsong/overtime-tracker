# Overtime Tracker

智能加班统计、考勤分析与 AI 月报生成平台。项目基于 Next.js App Router 构建，支持 Excel 打卡数据导入、自动计算加班时长、Dashboard 图表分析、月报导出和 AI 智能总结。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS v4、本地 shadcn/ui 风格组件、Framer Motion
- Prisma ORM、Neon PostgreSQL
- Recharts、xlsx、date-fns、zod、react-hook-form、sonner、lucide-react
- Vercel AI SDK + OpenAI 兼容接口

## 环境变量

复制 `.env.example` 为 `.env` 后填写真实值。不要提交真实密钥。

```env
DATABASE_URL="你的 Neon pooled connection string"
DIRECT_URL="你的 Neon direct connection string"
NEXT_PUBLIC_APP_NAME="Overtime Tracker"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_PROVIDER="deepseek"
AI_BASE_URL="https://api.deepseek.com"
AI_API_KEY="你的 DeepSeek API Key"
AI_MODEL="deepseek-v4-flash"
```

## Prisma / Neon

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

当前 Prisma Schema 包含 `User`、`AttendanceRecord`、`ImportBatch`、`WorkRule`、`MonthlyReport`，单用户可直接使用，同时通过 `userId` 预留多用户能力。

## 本地启动

```bash
npm install
npm run dev
```

访问：

- `/`：产品官网首页
- `/dashboard`：统计看板
- `/dashboard/calendar`：中国月历考勤
- `/dashboard/records`：打卡记录
- `/dashboard/import`：Excel 导入
- `/dashboard/reports`：月报
- `/dashboard/rules`：规则配置
- `/dashboard/ai`：AI 分析助手

## Excel 导入格式

支持 `.xlsx` / `.xls`，会自动识别常见表头：

- 日期、打卡日期、考勤日期
- 姓名、员工姓名
- 上班时间、上班打卡、签到时间
- 下班时间、下班打卡、签退时间
- 实际出勤时长、考勤状态、备注

导入流程：上传文件、自动识别字段、预览前 20 行、展示异常原因、确认导入、生成导入批次并写入打卡记录。

## 加班计算规则

- 默认上班时间：09:30
- 默认下班时间：19:00
- 标准工作时长：480 分钟
- 加班开始时间：19:00
- 09:30 前打卡不额外算工时
- 午休时间：12:00-13:30，按与实际出勤重叠部分扣减
- 普通周末默认计入加班，按 8 小时封顶，迟到从 8 小时内扣减；节假日补班按普通工作日计算

计算口径：

- 有效上班时间 = `max(实际上班打卡时间, 09:30)`
- 每日有效出勤 = `实际下班时间 - 有效上班时间 - 午休重叠分钟`
- 普通工作日加班分钟数 = `max(0, 实际下班时间 - 19:00)`
- 普通周末加班分钟数 = `min(每日有效出勤, 480 - 迟到分钟数)`

异常场景会标记为 `ABNORMAL` 或 `ABSENT`：缺少上班打卡、缺少下班打卡、下班早于上班、日期或时间格式异常。

## 中国月历

`/dashboard/calendar` 按真实数据库记录生成每月日历，支持中国节假日、周末和当天考勤状态展示。点击某一天会载入右侧编辑器，可在 23:59 前设置当天上班打卡、下班打卡和备注，保存后写入数据库并重新计算有效出勤、加班、迟到、早退和异常状态。

当前内置 2026 年中国节假日规则，后续年份需要在 `lib/calendar/china-calendar.ts` 中继续维护或接入正式节假日服务。

## AI 配置

AI 通过 `AI_PROVIDER`、`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 接入 OpenAI 兼容接口。DeepSeek 可配置为 `AI_PROVIDER="deepseek"`、`AI_BASE_URL="https://api.deepseek.com"`、`AI_MODEL="deepseek-v4-flash"`。未配置完整 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 时接口会直接返回错误，不启用 Mock 回答。

## 验证命令

```bash
npm run test
npm run lint
npm run build
```

## 部署说明

推荐部署到 Vercel，并在 Vercel Project Settings 中配置 `DATABASE_URL`、`DIRECT_URL` 和 `AI_*` 环境变量。Neon 建议使用 pooled connection string 作为 `DATABASE_URL`，direct connection string 作为 `DIRECT_URL` 供迁移使用。

## 常见问题

- 页面能打开但写入失败：检查 `.env` 是否配置 `DATABASE_URL`。
- `prisma migrate dev` 失败：检查 Neon 连接串、SSL 参数和网络连通性。
- AI 无输出：检查 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 是否完整。
- Excel 解析异常：确认首个工作表包含表头，且日期/上下班字段可识别。
