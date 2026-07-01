export type RankingScore = {
  criteriaId: string;
  maxScore: number;
  score: number;
  weight: number;
};

export type RankingEvaluation = {
  scores: RankingScore[];
};

export type RankingProject = {
  evaluations: RankingEvaluation[];
  projectId: string;
  teamId: string;
  teamName: string;
};

export type RankingItem = {
  averageScore: number;
  evaluationsCount: number;
  projectId: string;
  rank: number;
  teamId: string;
  teamName: string;
  totalScore: number;
};

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateEvaluationScore(evaluation: RankingEvaluation) {
  const weightTotal = evaluation.scores.reduce(
    (total, score) => total + score.weight,
    0,
  );

  if (evaluation.scores.length === 0 || weightTotal === 0) return 0;

  return evaluation.scores.reduce((total, score) => {
    const normalized = score.maxScore > 0 ? score.score / score.maxScore : 0;
    return total + normalized * 10 * score.weight;
  }, 0);
}

export function calculateRanking(projects: RankingProject[]): RankingItem[] {
  return projects
    .map((project) => {
      const total = project.evaluations.reduce(
        (sum, evaluation) => sum + calculateEvaluationScore(evaluation),
        0,
      );
      const average =
        project.evaluations.length > 0 ? total / project.evaluations.length : 0;

      return {
        averageScore: roundScore(average),
        evaluationsCount: project.evaluations.length,
        projectId: project.projectId,
        rank: 0,
        teamId: project.teamId,
        teamName: project.teamName,
        totalScore: roundScore(average),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || a.teamName.localeCompare(b.teamName))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
