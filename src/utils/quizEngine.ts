import { DifficultyProfileConfig, QuizQuestion, UserDifficulty } from '../types/game';

/**
 * Selects 10 questions for a normal quiz session based on:
 * 1) difficulty_profile.json probability weights
 * 2) localStorage solved_question_ids exclusion (unsolved questions prioritized)
 * 3) Distinct master_ids within the same 10-question session so questions feel varied
 */
export function selectSessionQuestions(
  allQuestions: QuizQuestion[],
  difficulty: UserDifficulty,
  difficultyConfig: DifficultyProfileConfig,
  solvedQuestionIds: string[],
  count: number = 10
): QuizQuestion[] {
  const weights = difficultyConfig.profiles[difficulty]?.difficulty_weights || {
    '1': 0.4,
    '2': 0.4,
    '3': 0.15,
    '4': 0.05
  };

  const solvedSet = new Set(solvedQuestionIds);
  const unsolvedPool = allQuestions.filter(q => !solvedSet.has(q.question_id));
  // If the child has solved almost the entire bank, fall back to full bank for remaining slots
  const workingPool = unsolvedPool.length >= count ? unsolvedPool : [...unsolvedPool, ...allQuestions.filter(q => solvedSet.has(q.question_id))];

  const selected: QuizQuestion[] = [];
  const usedQuestionIds = new Set<string>();
  const usedMasterIds = new Set<string>();

  const pickTargetDifficulty = (): number => {
    const r = Math.random();
    let acc = 0;
    for (const [diffStr, weight] of Object.entries(weights)) {
      acc += weight;
      if (r <= acc) return parseInt(diffStr, 10);
    }
    return 2;
  };

  for (let i = 0; i < count; i++) {
    const targetDiff = pickTargetDifficulty();

    // Try exact difficulty + new master_id in workingPool
    let candidates = workingPool.filter(
      q => !usedQuestionIds.has(q.question_id) && !usedMasterIds.has(q.master_id) && q.internal_difficulty === targetDiff
    );

    // Fallback 1: nearby difficulty (+-1) + new master_id
    if (candidates.length === 0) {
      candidates = workingPool.filter(
        q => !usedQuestionIds.has(q.question_id) && !usedMasterIds.has(q.master_id) && Math.abs(q.internal_difficulty - targetDiff) <= 1
      );
    }

    // Fallback 2: any unsolved question with new master_id
    if (candidates.length === 0) {
      candidates = workingPool.filter(
        q => !usedQuestionIds.has(q.question_id) && !usedMasterIds.has(q.master_id)
      );
    }

    // Fallback 3: any unused question in workingPool
    if (candidates.length === 0) {
      candidates = workingPool.filter(q => !usedQuestionIds.has(q.question_id));
    }

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      selected.push(chosen);
      usedQuestionIds.add(chosen.question_id);
      usedMasterIds.add(chosen.master_id);
    }
  }

  return selected;
}

/**
 * Section 10.1: Wrong-Answer Review Question Matcher
 * - Loads wrong_master_ids from localStorage
 * - Picks up to 5 questions (1 per wrong master_id)
 * - Prioritizes sibling questions with DIFFERENT question_id / question_type from previously solved/seen ones so the child doesn't just memorize choice positions!
 */
export function selectReviewQuestions(
  allQuestions: QuizQuestion[],
  wrongMasterIds: string[],
  solvedQuestionIds: string[],
  maxCount: number = 5
): QuizQuestion[] {
  const solvedSet = new Set(solvedQuestionIds);
  const selected: QuizQuestion[] = [];
  const targetMasterIds = wrongMasterIds.slice(0, maxCount);

  for (const masterId of targetMasterIds) {
    const siblings = allQuestions.filter(q => q.master_id === masterId);
    if (siblings.length === 0) continue;

    // Prefer a sibling question that hasn't been solved yet and is at a friendly review difficulty (2~5)
    const freshSiblings = siblings.filter(q => !solvedSet.has(q.question_id));
    const pool = freshSiblings.length > 0 ? freshSiblings : siblings;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    selected.push(chosen);
  }

  return selected;
}
