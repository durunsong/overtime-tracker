import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetNavigationProgressForTests,
  doneNavigationProgress,
  shouldTrackNavigationClick,
  startNavigationProgress,
  subscribeNavigationProgress,
} from "./navigation-progress";

const location = {
  href: "http://localhost:3000/dashboard",
  origin: "http://localhost:3000",
  pathname: "/dashboard",
  search: "",
};

describe("navigation-progress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {});
    __resetNavigationProgressForTests();
  });

  afterEach(() => {
    __resetNavigationProgressForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("starts progress and notifies subscribers", () => {
    const states: Array<{ active: boolean; progress: number }> = [];
    const unsubscribe = subscribeNavigationProgress((state) => {
      states.push(state);
    });

    startNavigationProgress();

    expect(states.at(-1)?.active).toBe(true);
    expect(states.at(-1)?.progress).toBeGreaterThan(0);
    expect(states.at(-1)?.progress).toBeLessThan(100);

    unsubscribe();
  });

  it("completes to 100 then hides", () => {
    const states: Array<{ active: boolean; progress: number }> = [];
    subscribeNavigationProgress((state) => {
      states.push(state);
    });

    startNavigationProgress();
    doneNavigationProgress();

    expect(states.at(-1)).toEqual({ active: true, progress: 100 });

    vi.advanceTimersByTime(220);

    expect(states.at(-1)).toEqual({ active: false, progress: 0 });
  });

  it("safety timeout finishes stuck progress", () => {
    const states: Array<{ active: boolean; progress: number }> = [];
    subscribeNavigationProgress((state) => {
      states.push(state);
    });

    startNavigationProgress();
    vi.advanceTimersByTime(12_000);

    expect(states.some((state) => state.progress === 100)).toBe(true);

    vi.advanceTimersByTime(220);
    expect(states.at(-1)).toEqual({ active: false, progress: 0 });
  });
});

describe("shouldTrackNavigationClick", () => {
  it("tracks same-origin navigations that change path or search", () => {
    expect(
      shouldTrackNavigationClick(
        { href: "/dashboard/records" },
        { button: 0 },
        location,
      ),
    ).toBe(true);
    expect(
      shouldTrackNavigationClick(
        { href: "/dashboard?month=2026-10" },
        { button: 0 },
        location,
      ),
    ).toBe(true);
  });

  it("ignores external, hash-only, same-page, modified, download, and new-tab clicks", () => {
    expect(
      shouldTrackNavigationClick(
        { href: "https://example.com/out" },
        { button: 0 },
        location,
      ),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick({ href: "#rules" }, { button: 0 }, location),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick({ href: "/dashboard" }, { button: 0 }, location),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick(
        { href: "/dashboard/records" },
        { button: 0, metaKey: true },
        location,
      ),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick(
        { href: "/dashboard/records", download: true },
        { button: 0 },
        location,
      ),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick(
        { href: "/dashboard/records", target: "_blank" },
        { button: 0 },
        location,
      ),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick(
        { href: "mailto:ops@example.com" },
        { button: 0 },
        location,
      ),
    ).toBe(false);
    expect(
      shouldTrackNavigationClick(
        { href: "/dashboard/records", noProgress: true },
        { button: 0 },
        location,
      ),
    ).toBe(false);
  });
});
