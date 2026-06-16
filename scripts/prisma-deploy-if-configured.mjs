import { execSync } from "node:child_process";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const isPlaceholder =
  !url ||
  /127\.0\.0\.1:5432\/overtime_tracker_build/i.test(url) ||
  /localhost:5432\/overtime_tracker_build/i.test(url);

if (isPlaceholder) {
  console.log(
    "跳过 prisma migrate deploy：未配置 DIRECT_URL / DATABASE_URL，或仍为构建占位连接串。",
  );
  process.exit(0);
}

execSync("pnpm exec prisma migrate deploy", { stdio: "inherit" });
