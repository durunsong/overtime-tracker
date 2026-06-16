import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma generate 不连接数据库，但 Prisma 7 仍会加载 config。
// CI/Vercel 构建阶段可能尚未注入 DATABASE_URL，此处用占位 URL 仅用于生成 Client。
const buildTimeDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/overtime_tracker_build?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: buildTimeDatabaseUrl,
  },
});
