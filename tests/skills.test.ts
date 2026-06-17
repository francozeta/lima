import { describe, expect, it } from "vitest";
import {
  dedupeSkillNames,
  normalizeSkillName,
  toSkillSlug,
} from "../lib/skills";

describe("skills helpers", () => {
  it("normalizes skill names for display", () => {
    expect(normalizeSkillName("  react   native ")).toBe("React Native");
    expect(normalizeSkillName("ui/ux")).toBe("UI/UX");
  });

  it("creates stable ascii slugs", () => {
    expect(toSkillSlug("Diseño UI/UX")).toBe("diseno-ui-ux");
    expect(toSkillSlug("Node.js")).toBe("node-js");
  });

  it("deduplicates skills by slug and keeps display labels", () => {
    expect(dedupeSkillNames(["React", " react ", "Diseño UX"])).toEqual([
      "React",
      "Diseno UX",
    ]);
  });
});
