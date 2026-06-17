import { describe, expect, it } from "vitest";
import { getProfileUrl } from "../lib/qr";

describe("profile QR helpers", () => {
  it("builds an absolute profile URL", () => {
    expect(getProfileUrl("http://localhost:3000", "user-123")).toBe(
      "http://localhost:3000/profile/user-123",
    );
  });

  it("removes trailing slash from site URL", () => {
    expect(getProfileUrl("https://lima.certus.edu.pe/", "abc")).toBe(
      "https://lima.certus.edu.pe/profile/abc",
    );
  });
});
