import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

type PrismaGlobal = typeof globalThis & {
  __overtimePrisma?: PrismaClient;
  __overtimePgPool?: Pool;
};

const globalForPrisma = globalThis as PrismaGlobal;

export function normalizeDatabaseUrlForPg(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    const useLibpqCompat = url.searchParams.get("uselibpqcompat")?.toLowerCase() === "true";

    if (!useLibpqCompat && (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca")) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    return connectionString;
  }

  return connectionString;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 未配置，无法初始化 Prisma Client");
  }

  if (!globalForPrisma.__overtimePgPool) {
    globalForPrisma.__overtimePgPool = new Pool({
      connectionString: normalizeDatabaseUrlForPg(process.env.DATABASE_URL),
    });
  }

  if (!globalForPrisma.__overtimePrisma) {
    const adapter = new PrismaPg(globalForPrisma.__overtimePgPool);
    globalForPrisma.__overtimePrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.__overtimePrisma;
}
