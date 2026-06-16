import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma generate / migrate 会加载 config。generate 不连库；migrate deploy 需要真实连接串。
// Neon 迁移优先用 DIRECT_URL，运行时 Prisma Client 仍走 lib/prisma.ts 的 DATABASE_URL（pooled）。
const cliDatabaseUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/overtime_tracker_build?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cliDatabaseUrl,
  },
});
