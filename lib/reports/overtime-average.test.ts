import { describe, expect, it } from "vitest";
import { buildAverageOvertimeHelper } from "./overtime-average";

describe("buildAverageOvertimeHelper", () => {
  it("explains that weekend overtime is shown separately", () => {
    const result = buildAverageOvertimeHelper({
      weekendOvertimeMinutes: 480,
      weekendWorkDays: 1,
    });

    expect(result.helper).toBe("按工作日平均，不含周末加班");
    expect(result.extra).toContain("周末加班 8小时");
    expect(result.extra).toContain("单独统计");
  });

  it("explains when there is no weekend attendance", () => {
    const result = buildAverageOvertimeHelper({
      weekendOvertimeMinutes: 0,
      weekendWorkDays: 0,
    });

    expect(result.extra).toBe("本月无周末打卡，平均值仅统计工作日");
  });
});
