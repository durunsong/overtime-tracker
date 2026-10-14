type NavigationProgressState = {
  active: boolean;
  progress: number;
};

type Listener = (state: NavigationProgressState) => void;

export type NavigationClickAnchor = {
  href?: string | null;
  download?: boolean;
  target?: string;
  noProgress?: boolean;
};

export type NavigationClickInput = {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export type NavigationLocation = {
  href: string;
  origin: string;
  pathname: string;
  search: string;
};

const listeners = new Set<Listener>();

let active = false;
let progress = 0;
let trickleTimer: ReturnType<typeof setTimeout> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  const snapshot: NavigationProgressState = { active, progress };
  listeners.forEach((listener) => listener(snapshot));
}

function clearTimers() {
  if (trickleTimer) {
    clearTimeout(trickleTimer);
    trickleTimer = null;
  }
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function scheduleTrickle() {
  if (!active) return;
  const rest = 92 - progress;
  progress = Math.min(
    92,
    progress + Math.max(0.6, rest * 0.08) + Math.random(),
  );
  emit();
  trickleTimer = setTimeout(scheduleTrickle, 220 + Math.random() * 180);
}

function armSafetyTimeout() {
  if (safetyTimer) clearTimeout(safetyTimer);
  safetyTimer = setTimeout(() => {
    doneNavigationProgress();
  }, 12_000);
}

export function shouldTrackNavigationClick(
  anchor: NavigationClickAnchor,
  event: NavigationClickInput,
  current: NavigationLocation,
) {
  if ((event.button ?? 0) !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false;
  if (anchor.download || anchor.noProgress) return false;
  if (anchor.target && anchor.target !== "_self") return false;

  const href = anchor.href;
  if (!href || href.startsWith("#")) return false;
  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  try {
    const url = new URL(href, current.href);
    if (url.origin !== current.origin) return false;
    return (
      `${url.pathname}${url.search}` !== `${current.pathname}${current.search}`
    );
  } catch {
    return false;
  }
}

/** 站内路由开始切换时调用，立即给出顶部进度反馈 */
export function startNavigationProgress() {
  if (typeof window === "undefined") return;

  clearTimers();
  active = true;
  progress = Math.max(progress, 12);
  emit();
  scheduleTrickle();
  armSafetyTimeout();
}

/** 路由落地（pathname / search 变化）后收尾 */
export function doneNavigationProgress() {
  if (typeof window === "undefined") return;
  if (!active && progress === 0) return;

  if (trickleTimer) {
    clearTimeout(trickleTimer);
    trickleTimer = null;
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }

  active = true;
  progress = 100;
  emit();

  finishTimer = setTimeout(() => {
    active = false;
    progress = 0;
    emit();
    finishTimer = null;
  }, 220);
}

export function subscribeNavigationProgress(listener: Listener) {
  listeners.add(listener);
  listener({ active, progress });
  return () => {
    listeners.delete(listener);
  };
}

/** 仅测试用：重置模块状态 */
export function __resetNavigationProgressForTests() {
  clearTimers();
  active = false;
  progress = 0;
  emit();
}
