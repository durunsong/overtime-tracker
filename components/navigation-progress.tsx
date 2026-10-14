"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  doneNavigationProgress,
  shouldTrackNavigationClick,
  startNavigationProgress,
  subscribeNavigationProgress,
} from "@/lib/navigation-progress";

type ProgressViewState = {
  active: boolean;
  progress: number;
};

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [state, setState] = useState<ProgressViewState>({
    active: false,
    progress: 0,
  });

  useEffect(() => subscribeNavigationProgress(setState), []);

  useEffect(() => {
    doneNavigationProgress();
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        !shouldTrackNavigationClick(
          {
            href: anchor.getAttribute("href"),
            download: anchor.hasAttribute("download"),
            target: anchor.target || undefined,
            noProgress: anchor.dataset.noProgress === "true",
          },
          event,
          window.location,
        )
      ) {
        return;
      }
      startNavigationProgress();
    };

    const onPopState = () => {
      startNavigationProgress();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const visible = state.active || state.progress > 0;

  return (
    <div
      className="route-progress"
      aria-hidden="true"
      data-active={visible ? "true" : "false"}
    >
      <div
        className="route-progress__bar"
        style={{
          transform: `scaleX(${visible ? Math.min(state.progress, 100) / 100 : 0})`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

/** 顶部路由进度条：覆盖 Link 点击、编程式导航与浏览器前进后退 */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
