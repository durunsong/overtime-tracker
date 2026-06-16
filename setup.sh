#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==> Overtime Tracker bootstrap"

if ! command -v corepack >/dev/null 2>&1; then
  echo "请先安装 Node.js 20+（包含 Corepack）。"
  exit 1
fi

corepack enable
corepack prepare pnpm@10.33.0 --activate

echo "==> 安装依赖"
pnpm install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "已创建 .env，请填写 DATABASE_URL / DIRECT_URL / AI 配置。"
else
  echo "检测到已有 .env，跳过复制 .env.example。"
fi

echo "==> 生成 Prisma Client"
pnpm prisma:generate

cat <<'EOF'

下一步：
  1. 编辑 .env，配置 PostgreSQL 与 AI Provider
  2. pnpm prisma:migrate
  3. pnpm dev

验证：
  pnpm test
  pnpm lint
  pnpm build

EOF
