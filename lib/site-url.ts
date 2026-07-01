type SiteUrlEnv = Record<string, string | undefined>;

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim().replace(/^["']|["']$/g, "");

  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(options: {
  env?: SiteUrlEnv;
  requestOrigin?: string | null;
} = {}) {
  const env = options.env ?? process.env;

  return (
    normalizeBaseUrl(env.NEXT_PUBLIC_SITE_URL) ??
    normalizeBaseUrl(env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeBaseUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeBaseUrl(env.NEXT_PUBLIC_VERCEL_URL) ??
    normalizeBaseUrl(env.VERCEL_URL) ??
    normalizeBaseUrl(options.requestOrigin) ??
    "http://localhost:3000"
  );
}

export function getAuthCallbackUrl(requestOrigin?: string | null) {
  const callbackUrl = new URL("/auth/callback", getSiteUrl({ requestOrigin }));
  callbackUrl.searchParams.set("next", "/dashboard");
  return callbackUrl.toString();
}
