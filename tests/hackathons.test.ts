import { describe, expect, it } from "vitest";
import {
  getHackathonStatusLabel,
  isRegistrationOpen,
  toHackathonSlug,
} from "../lib/hackathons";

describe("hackathon helpers", () => {
  it("creates readable stable slugs", () => {
    expect(toHackathonSlug("Hackaton Innovacion CERTUS 2026")).toBe(
      "hackaton-innovacion-certus-2026",
    );
    expect(toHackathonSlug("  IA & Datos: Reto #1  ")).toBe(
      "ia-datos-reto-1",
    );
  });

  it("labels statuses in Spanish", () => {
    expect(getHackathonStatusLabel("draft")).toBe("Borrador");
    expect(getHackathonStatusLabel("published")).toBe("Publicado");
    expect(getHackathonStatusLabel("closed")).toBe("Cerrado");
    expect(getHackathonStatusLabel("archived")).toBe("Archivado");
  });

  it("opens registration only for published hackathons before the deadline", () => {
    const now = new Date("2026-06-16T12:00:00.000Z");

    expect(
      isRegistrationOpen({
        now,
        registrationDeadline: "2026-06-17T12:00:00.000Z",
        status: "published",
      }),
    ).toBe(true);

    expect(
      isRegistrationOpen({
        now,
        registrationDeadline: "2026-06-15T12:00:00.000Z",
        status: "published",
      }),
    ).toBe(false);

    expect(
      isRegistrationOpen({
        now,
        registrationDeadline: null,
        status: "draft",
      }),
    ).toBe(false);
  });
});
