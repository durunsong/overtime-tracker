你现在是一个资深全栈架构师 + Next.js 高级工程师 + UI/UX 动效设计师 + 数据可视化工程师。  
请基于我已经新建好的项目 `overtime-tracker`，从 0 到 1 开发一个完整、可运行、可扩展的「加班统计系统」。

项目名称：overtime-tracker  
项目定位：一个支持 Excel 打卡数据导入、自动计算加班时长、日报/月报统计、图表分析、AI 智能总结、月报导出的现代化加班统计平台。

## 一、技术栈要求

请使用以下技术栈：

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Prisma ORM
- Neon PostgreSQL
- Recharts 或 ECharts，用于图表统计
- xlsx 或 exceljs，用于 Excel 导入解析
- date-fns 或 dayjs，用于时间计算
- zod，用于表单和接口数据校验
- react-hook-form，用于表单处理
- sonner，用于 Toast 提示
- lucide-react，用于图标
- Vercel AI SDK 或兼容方案，用于 AI 分析能力

如果项目中缺少依赖，请自动补充安装命令，并完成对应代码改造。

## 二、数据库要求

我会提供 Neon 数据库连接地址，请使用 Prisma 连接 Neon PostgreSQL。

请设计合理的 Prisma Schema，至少包含以下模型：

### 1. User 用户表

字段建议：

- id
- name
- email
- avatar
- createdAt
- updatedAt

目前可以先做单用户版本，也要预留多用户能力。

### 2. AttendanceRecord 打卡记录表

用于保存每日考勤数据。

字段建议：

- id
- userId
- workDate：日期
- checkInTime：上班打卡时间
- checkOutTime：下班打卡时间
- rawCheckInText：原始上班打卡文本
- rawCheckOutText：原始下班打卡文本
- actualWorkMinutes：实际出勤分钟数
- standardWorkMinutes：标准工作分钟数
- overtimeMinutes：加班分钟数
- lateMinutes：迟到分钟数
- earlyLeaveMinutes：早退分钟数
- status：NORMAL / LATE / EARLY_LEAVE / ABSENT / REST_DAY / HOLIDAY / ABNORMAL
- source：MANUAL / EXCEL_IMPORT
- importBatchId
- remark
- createdAt
- updatedAt

### 3. ImportBatch 导入批次表

用于保存 Excel 导入记录。

字段建议：

- id
- fileName
- fileSize
- totalRows
- successRows
- failedRows
- status：PENDING / PROCESSING / SUCCESS / FAILED / PARTIAL_SUCCESS
- errorMessage
- createdAt
- updatedAt

### 4. WorkRule 工作规则表

用于配置加班计算规则。

字段建议：

- id
- name
- startTime：默认 09:30
- endTime：默认 19:00
- standardWorkMinutes：默认 480
- overtimeStartTime：默认 19:00
- beforeStartNotCount：默认 true，表示 09:30 之前打卡不额外算工时
- lunchBreakEnabled
- lunchBreakMinutes
- weekendEnabled
- holidayEnabled
- isDefault
- createdAt
- updatedAt

### 5. MonthlyReport 月报表

用于缓存月度统计结果。

字段建议：

- id
- userId
- month：例如 2026-05
- workDays
- actualWorkMinutes
- standardWorkMinutes
- overtimeMinutes
- lateCount
- earlyLeaveCount
- abnormalCount
- reportJson
- aiSummary
- createdAt
- updatedAt

请生成完整的 Prisma Schema，并告诉我需要执行的命令：

- npx prisma generate
- npx prisma migrate dev
- npx prisma studio

同时请封装 `lib/prisma.ts`，避免 Next.js dev 模式下 PrismaClient 重复实例化。

## 三、核心加班计算规则

系统核心公式：

```txt
加班时长 = 实际有效出勤时长 - 工作日出勤天数 * 8小时