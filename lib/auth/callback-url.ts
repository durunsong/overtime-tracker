const defaultCallbackUrl = "/dashboard";

export function getSafeCallbackUrl(callbackUrl: string | null | undefined) {
  if (!callbackUrl) return defaultCallbackUrl;

  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return defaultCallbackUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, "http://overtime-tracker.local");
  } catch {
    return defaultCallbackUrl;
  }

  if (parsed.origin !== "http://overtime-tracker.local") return defaultCallbackUrl;
  if (parsed.pathname.startsWith("/auth")) return defaultCallbackUrl;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function buildLoginUrl(callbackUrl: string | null | undefined) {
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);
  return `/auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
}

export function getAuthenticatedAuthRedirectUrl(
  pathname: string | null | undefined,
  callbackUrl: string | null | undefined,
) {
  if (!pathname?.startsWith("/auth")) return null;
  return getSafeCallbackUrl(callbackUrl);
}
