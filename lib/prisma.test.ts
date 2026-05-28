import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrlForPg } from "@/lib/prisma";

describe("normalizeDatabaseUrlForPg", () => {
  it("keeps pg current verify-full behavior explicit for sslmode aliases", () => {
    expect(normalizeDatabaseUrlForPg("postgres://u:p@example.com/db?sslmode=require")).toBe(
      "postgres://u:p@example.com/db?sslmode=verify-full",
    );
    expect(normalizeDatabaseUrlForPg("postgres://u:p@example.com/db?sslmode=prefer")).toBe(
      "postgres://u:p@example.com/db?sslmode=verify-full",
    );
    expect(normalizeDatabaseUrlForPg("postgres://u:p@example.com/db?sslmode=verify-ca")).toBe(
      "postgres://u:p@example.com/db?sslmode=verify-full",
    );
  });

  it("does not change already explicit or libpq-compatible connection strings", () => {
    expect(normalizeDatabaseUrlForPg("postgres://u:p@example.com/db?sslmode=verify-full")).toBe(
      "postgres://u:p@example.com/db?sslmode=verify-full",
    );
    expect(
      normalizeDatabaseUrlForPg("postgres://u:p@example.com/db?uselibpqcompat=true&sslmode=require"),
    ).toBe("postgres://u:p@example.com/db?uselibpqcompat=true&sslmode=require");
  });
});
