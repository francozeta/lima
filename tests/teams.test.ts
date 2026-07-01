import { describe, expect, it } from "vitest";
import { createTeamJoinCode, normalizeTeamName } from "../lib/teams";

describe("team helpers", () => {
  it("normalizes team names for display", () => {
    expect(normalizeTeamName("  los   builders  ")).toBe("Los Builders");
    expect(normalizeTeamName("CERTUS IA")).toBe("CERTUS IA");
  });

  it("creates readable join codes with a stable alphabet", () => {
    const code = createTeamJoinCode(() => 0);

    expect(code).toBe("222222");
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
});
