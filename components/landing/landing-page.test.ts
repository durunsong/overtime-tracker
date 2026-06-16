import { describe, expect, it } from "vitest";
import { getLandingSessionCopy, LANDING_COPY, resolveLandingVideoUrl } from "./landing-page";

describe("resolveLandingVideoUrl", () => {
  it("returns empty string when video url is missing", () => {
    expect(resolveLandingVideoUrl(undefined)).toBe("");
    expect(resolveLandingVideoUrl("   ")).toBe("");
  });

  it("trims configured video url", () => {
    expect(resolveLandingVideoUrl(" https://example.com/demo.mp4 ")).toBe("https://example.com/demo.mp4");
  });
});

describe("LANDING_COPY", () => {
  it("uses overtime tracker product copy instead of generic template text", () => {
    const content = JSON.stringify(LANDING_COPY);

    expect(content).toContain("加班统计");
    expect(content).toContain("Excel");
    expect(content).toContain("月报");
    expect(content).not.toMatch(/Asme|Built for the curious|Manifesto|newsletter|Instagram|Twitter/);
  });

  it("keeps acquisition actions for anonymous visitors", () => {
    expect(getLandingSessionCopy(null)).toEqual({
      isAuthenticated: false,
      navActionLabel: "登录",
      navActionHref: "/auth/login",
      secondaryActionLabel: "创建账号",
      secondaryActionHref: "/auth/register",
      heroActionLabel: "进入统计看板",
      heroActionHref: "/dashboard",
      helperText: LANDING_COPY.heroDescription,
      showEmailForm: true,
      userLabel: null,
    });
  });

  it("switches to workspace actions for signed in users", () => {
    const view = getLandingSessionCopy({
      id: "user-1",
      name: "测试用户",
      email: "tester@example.com",
      avatar: null,
    });

    expect(view).toMatchObject({
      isAuthenticated: true,
      navActionLabel: "进入工作台",
      navActionHref: "/dashboard",
      heroActionLabel: "继续查看本月统计",
      heroActionHref: "/dashboard",
      showEmailForm: false,
      userLabel: "测试用户",
    });
    expect(view.helperText).toContain("欢迎回来");
  });
});
