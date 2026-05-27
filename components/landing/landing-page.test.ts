import { describe, expect, it } from "vitest";
import { LANDING_COPY } from "./landing-page";

describe("LANDING_COPY", () => {
  it("uses overtime tracker product copy instead of generic template text", () => {
    const content = JSON.stringify(LANDING_COPY);

    expect(content).toContain("加班统计");
    expect(content).toContain("Excel");
    expect(content).toContain("月报");
    expect(content).not.toMatch(/Asme|Built for the curious|Manifesto|newsletter|Instagram|Twitter/);
  });
});
