import { describe, expect, it } from "vitest";
import { profileSchema, splitSkills } from "../lib/validation/profile";

describe("profile validation", () => {
  it("accepts a complete profile", () => {
    const result = profileSchema.safeParse({
      careerArea: "Ingenieria de Software",
      experience: "He trabajado en proyectos academicos con equipos pequenos.",
      fullName: "Ada Lovelace",
      skills: "React, Supabase, UX",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing full name", () => {
    const result = profileSchema.safeParse({
      careerArea: "Diseno",
      experience: "Portafolio academico.",
      fullName: "",
      skills: "Figma",
    });

    expect(result.success).toBe(false);
  });

  it("splits skills into trimmed unique values", () => {
    expect(splitSkills("React, Supabase, react, UX")).toEqual([
      "React",
      "Supabase",
      "UX",
    ]);
  });
});
