import { describe, expect, it } from "vitest";
import { parseScreenshotAiJson } from "./screenshot-json";

describe("parseScreenshotAiJson", () => {
  it("parses fenced json and trailing commas", () => {
    const records = parseScreenshotAiJson(`
\`\`\`json
{
  "records": [
    { "date": "2026-05-27", "checkIn": "09:30", "checkOut": "20:00", },
  ],
}
\`\`\`
`);

    expect(records).toHaveLength(1);
    expect(records[0]?.date).toBe("2026-05-27");
  });

  it("accepts alternate record containers", () => {
    const records = parseScreenshotAiJson(`{"data":[{"date":"2026-05-01","status":"休息"}]}`);
    expect(records[0]?.status).toBe("休息");
  });
});
