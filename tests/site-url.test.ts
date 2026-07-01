import { describe, expect, it } from "vitest";
import { getAuthCallbackUrl, getSiteUrl } from "../lib/site-url";

describe("site URL helpers", () => {
  it("prefers the configured public site URL over request origin", () => {
    expect(
      getSiteUrl({
        env: { NEXT_PUBLIC_SITE_URL: "https://lima-certus.vercel.app" },
        requestOrigin: "http://localhost:3000",
      }),
    ).toBe("https://lima-certus.vercel.app");
  });

  it("normalizes Vercel deployment domains without protocol", () => {
    expect(
      getSiteUrl({
        env: { VERCEL_URL: "lima-certus-preview.vercel.app/" },
      }),
    ).toBe("https://lima-certus-preview.vercel.app");
  });

  it("ignores quoted empty values from protected env pulls", () => {
    expect(
      getSiteUrl({
        env: {
          NEXT_PUBLIC_SITE_URL: '""',
          VERCEL_PROJECT_PRODUCTION_URL: "lima-certus.vercel.app",
        },
      }),
    ).toBe("https://lima-certus.vercel.app");
  });

  it("builds the auth callback on the canonical site URL", () => {
    expect(
      getAuthCallbackUrl("https://lima-certus.vercel.app"),
    ).toBe("https://lima-certus.vercel.app/auth/callback?next=%2Fdashboard");
  });
});
