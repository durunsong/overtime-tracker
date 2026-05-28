import { describe, expect, it } from "vitest";
import { passwordInputClassName, passwordToggleButtonClassName } from "./auth-input-styles";

describe("passwordInputClassName", () => {
  it("reserves enough inline space for the visibility toggle inside the input", () => {
    expect(passwordInputClassName()).toContain("pr-12");
  });
});

describe("passwordToggleButtonClassName", () => {
  it("pins the visibility toggle inside the password field", () => {
    const className = passwordToggleButtonClassName();

    expect(className).toContain("absolute");
    expect(className).toContain("right-1");
    expect(className).toContain("h-8");
    expect(className).toContain("w-8");
  });
});
