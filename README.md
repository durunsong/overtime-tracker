# Overtime Tracker

智能加班统计、考勤分析与 AI 月报生成平台。基于 Next.js App Router 构建，支持 Excel / 截图导入、中国节假日-aware 加班计算、Dashboard 图表分析、月报导出、公开分享和 AI 智能总结。

## 功能概览

- 用户注册、登录、忘记密码、修改密码
- Excel 打卡导入：字段识别、预览、校验、批次写入
- 考勤截图 OCR 导入：基于视觉模型识别上下班时间
- 中国月历：节假日、周末、调休补班与单日补录
- Dashboard：月度统计、趋势图、异常与迟到早退分析
- 打卡记录管理、工作规则配置
- 月报生成、Excel / PDF 导出
- AI 月报总结与基于真实数据的问答
- 加班月报公开分享链接

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS v4、本地 shadcn/ui 风格组件、Framer Motion
- Prisma 7、PostgreSQL（推荐 Neon）
- Recharts、xlsx、date-fns、zod、react-hook-form、sonner、lucide-react
- Vercel AI SDK + OpenAI 兼容接口（Provider / 模型通过环境变量配置）
- 包管理器：**pnpm**（项目仅支持 pnpm，请勿使用 npm / yarn）

## 环境要求

- Node.js 20+
- [pnpm](https://pnpm.io/installation) 10+

启用 Corepack 后可直接使用项目锁定的 pnpm 版本：

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

## 环境变量

复制 `.env.example` 为 `.env` 后填写真实值。不要提交真实密钥。

```env
DATABASE_URL="你的 Neon pooled connection string"
DIRECT_URL="你的 Neon direct connection string"
NEXT_PUBLIC_APP_NAME="Overtime Tracker"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_PROVIDER="openai-compatible"
AI_BASE_URL="https://your-provider.example.com/v1"
AI_API_KEY="你的 API Key"
AI_MODEL="your-vision-or-chat-model"
```

说明：

- `DATABASE_URL` 建议使用 Neon 的 pooled connection string。
- `DIRECT_URL` 建议使用 Neon 的 direct connection string，供 Prisma 迁移使用。
- AI 支持任意 OpenAI 兼容 Provider，不限定单一模型。月报总结与问答可用文本或多模态模型；**截图 OCR 导入建议使用支持图像输入的多模态模型**。
- 未配置完整的 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 时，AI 相关接口会直接返回错误，不启用 Mock 回答。

## Prisma / Neon

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
pnpm prisma:studio
```

当前 Prisma Schema 包含 `User`、`UserSession`、`PasswordResetToken`、`AttendanceRecord`、`ImportBatch`、`WorkRule`、`MonthlyReport`、`OvertimeShare`，所有业务数据按 `userId` 隔离。

## 本地启动

```bash
pnpm install
pnpm dev
```

访问：

- `/`：产品官网首页
- `/auth/login`：登录
- `/dashboard`：统计看板
- `/dashboard/calendar`：中国月历考勤
- `/dashboard/records`：打卡记录
- `/dashboard/import`：Excel / 截图导入
- `/dashboard/reports`：月报
- `/dashboard/rules`：规则配置
- `/dashboard/ai`：AI 分析助手
- `/dashboard/account`：账号设置
- `/share/[token]`：公开分享页

## Excel 导入格式

支持 `.xlsx` / `.xls`，会自动识别常见表头：

- 日期、打卡日期、考勤日期
- 姓名、员工姓名
- 上班时间、上班打卡、签到时间
- 下班时间、下班打卡、签退时间
- 实际出勤时长、考勤状态、备注

导入流程：上传文件 → 自动识别字段 → 预览前 20 行 → 展示异常原因 → 确认导入 → 生成导入批次并写入打卡记录。

也可下载系统模板：`GET /api/import/template`。

## 截图导入

在 `/dashboard/import` 上传考勤 App 截图，系统会调用视觉模型 OCR 识别日期、上下班时间和备注。

要求：

- 必须配置支持图像输入的多模态（Vision）模型。
- 若模型不支持图像，接口会返回明确错误，提示更换视觉模型。
- 识别结果会经过 JSON 校验与考勤字段校验后再进入预览流程。

## 加班计算规则

默认规则（可在 `/dashboard/rules` 调整）：

- 默认上班时间：09:30
- 默认下班时间：19:00
- 标准工作时长：480 分钟
- 加班开始时间：19:00
- 09:30 前打卡不额外算工时
- 午休时间：12:00-13:30，按与实际出勤重叠部分扣减
- 普通周末默认计入加班，按 8 小时封顶，迟到从 8 小时内扣减
- 法定节假日是否计入加班由 `holidayEnabled` 控制
- 调休补班日按普通工作日计算

计算口径：

- 有效上班时间 = `max(实际上班打卡时间, 09:30)`
- 每日有效出勤 = `实际下班时间 - 有效上班时间 - 午休重叠分钟`
- 普通工作日加班分钟数 = `max(0, 实际下班时间 - 19:00)`
- 普通周末加班分钟数 = `min(每日有效出勤, 480 - 迟到分钟数)`

异常场景会标记为 `ABNORMAL` 或 `ABSENT`：缺少上班打卡、缺少下班打卡、下班早于上班、日期或时间格式异常。

## 中国月历

`/dashboard/calendar` 按真实数据库记录生成每月日历，支持中国节假日、周末和当天考勤状态展示。点击某一天会载入右侧编辑器，可在当天 23:59 前设置上班打卡、下班打卡和备注，保存后写入数据库并重新计算有效出勤、加班、迟到、早退和异常状态。

节假日与调休规则维护见 `docs/china-holiday-rules.md`。同步候选规则：

```bash
pnpm calendar:sync -- 2026
```

## AI 配置

AI 通过 `AI_PROVIDER`、`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 接入 OpenAI 兼容接口，**不限定单一厂商或模型**。

| 能力 | 模型要求 |
| --- | --- |
| 月报 AI 总结 | 文本或多模态模型 |
| `/dashboard/ai` 流式问答 | 文本或多模态模型 |
| 截图 OCR 导入 | 支持图像输入的多模态模型 |

配置示例（任选其一，按 Provider 文档填写）：

```env
# 示例 1：智谱 GLM 多模态
AI_PROVIDER="zhipu"
AI_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
AI_API_KEY="你的 API Key"
AI_MODEL="glm-4.6v-flashx"

# 示例 2：OpenAI 兼容网关
AI_PROVIDER="openai"
AI_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="你的 API Key"
AI_MODEL="gpt-4o"
```

约束：

- AI 只能基于真实考勤数据或上传截图回答，不能编造。
- 配置不完整时接口直接报错，不提供 Mock 回答。
- Prompt 统一维护在 `lib/ai/prompts.ts`。
- 更换 Provider 时，只需修改上述四个环境变量，无需改业务代码。

## 公开分享

Dashboard 可将指定月份月报生成公开分享链接，访问 `/share/[token]` 查看脱敏后的统计快照。分享快照不会随后续规则变更自动更新。

## 验证命令

```bash
pnpm test
pnpm lint
pnpm build
```

## 部署说明

推荐部署到 Vercel。项目包含 `pnpm-lock.yaml` 与 `packageManager` 字段，Vercel 会自动使用 pnpm 安装依赖。请在 Project Settings 中配置：

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

Neon 建议使用 pooled connection string 作为 `DATABASE_URL`，direct connection string 作为 `DIRECT_URL` 供迁移使用。

## 常见问题

- 页面能打开但写入失败：检查 `.env` 是否配置 `DATABASE_URL`。
- `prisma migrate dev` 失败：检查 Neon 连接串、SSL 参数和网络连通性；本地请使用 `pnpm prisma:migrate`。
- AI 无输出：检查 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 是否完整，Key 是否有效。
- 截图导入失败：确认 `AI_MODEL` 为支持图像输入的多模态模型，而不是纯文本模型；并检查 `AI_BASE_URL` 是否与 Provider 文档一致。
- Excel 解析异常：确认首个工作表包含表头，且日期/上下班字段可识别。
- 分享页数据与当前 Dashboard 不一致：分享页展示的是创建链接时的快照，不会自动跟随规则或记录变更。

## AI 协作

在本项目中使用 AI 编程助手时，请先阅读 `AGENTS.md` 与 `CLAUDE.md`。
