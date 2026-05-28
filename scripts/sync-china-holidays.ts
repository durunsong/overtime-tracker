import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type TimorHolidayItem = {
  holiday: boolean;
  name: string;
  wage?: number;
  date: string;
};

type TimorHolidayResponse = {
  code: number;
  holiday?: Record<string, TimorHolidayItem>;
};

const year = Number(process.argv[2]);
const shouldWriteJson = process.argv.includes("--write-json");

async function main() {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    console.error("用法：npm run calendar:sync -- 2026 [-- --write-json]");
    process.exit(1);
  }

  const apiUrl = `https://timor.tech/api/holiday/year/${year}/`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`拉取节假日数据失败：${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as TimorHolidayResponse;
  if (payload.code !== 0 || !payload.holiday) {
    throw new Error("节假日接口返回格式异常");
  }

  const entries = Object.values(payload.holiday)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => {
      const kind = item.holiday ? "HOLIDAY" : "ADJUSTED_WORKDAY";
      const wageRate = item.wage && [1, 2, 3].includes(item.wage) ? item.wage : 1;
      return {
        date: item.date,
        kind,
        name: item.name,
        wageRate,
      };
    });

  const tsSnippet = entries
    .map((item) => {
      return `    "${item.date}": { kind: "${item.kind}", name: "${item.name}", wageRate: ${item.wageRate} },`;
    })
    .join("\n");

  console.log(`// ${year} 中国节假日候选规则`);
  console.log(`// 来源：${apiUrl}`);
  console.log("// 生成后请对照国务院办公厅通知复核，再合并到 lib/calendar/china-holiday-rules.ts。");
  console.log(`${year}: {`);
  console.log(tsSnippet);
  console.log("},");

  if (shouldWriteJson) {
    const outputDir = path.resolve(process.cwd(), "docs", "generated");
    const outputFile = path.join(outputDir, `china-holidays-${year}.json`);
    await mkdir(outputDir, { recursive: true });
    await writeFile(
      outputFile,
      `${JSON.stringify({ year, source: apiUrl, entries }, null, 2)}\n`,
      "utf8",
    );
    console.log(`已写入候选 JSON：${path.relative(process.cwd(), outputFile)}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
