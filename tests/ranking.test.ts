import { describe, expect, it } from "vitest";
import { calculateRanking } from "../lib/ranking";

describe("ranking helpers", () => {
  it("orders teams by weighted score and keeps score details", () => {
    const ranking = calculateRanking([
      {
        projectId: "project-a",
        teamId: "team-a",
        teamName: "Aster",
        evaluations: [
          {
            scores: [
              { criteriaId: "impact", maxScore: 10, score: 8, weight: 0.6 },
              { criteriaId: "demo", maxScore: 10, score: 6, weight: 0.4 },
            ],
          },
        ],
      },
      {
        projectId: "project-b",
        teamId: "team-b",
        teamName: "Nexo",
        evaluations: [
          {
            scores: [
              { criteriaId: "impact", maxScore: 10, score: 7, weight: 0.6 },
              { criteriaId: "demo", maxScore: 10, score: 10, weight: 0.4 },
            ],
          },
        ],
      },
    ]);

    expect(ranking.map((item) => item.teamName)).toEqual(["Nexo", "Aster"]);
    expect(ranking[0]).toMatchObject({
      averageScore: 8.2,
      rank: 1,
      totalScore: 8.2,
    });
  });

  it("averages multiple jury evaluations per project", () => {
    const ranking = calculateRanking([
      {
        projectId: "project-a",
        teamId: "team-a",
        teamName: "Aster",
        evaluations: [
          {
            scores: [{ criteriaId: "impact", maxScore: 10, score: 10, weight: 1 }],
          },
          {
            scores: [{ criteriaId: "impact", maxScore: 10, score: 6, weight: 1 }],
          },
        ],
      },
    ]);

    expect(ranking[0].averageScore).toBe(8);
    expect(ranking[0].evaluationsCount).toBe(2);
  });
});
