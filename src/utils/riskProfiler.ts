export type SebiRiskCategory = 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';

export interface RiskQuestionOption {
  label: string;
  points: number;
}

export interface RiskQuestion {
  id: string;
  title: string;
  description?: string;
  options: RiskQuestionOption[];
}

export const SEBI_RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'horizon',
    title: 'What is your primary investment horizon for this capital?',
    description: 'The timeframe before you plan to liquidate or need access to these funds.',
    options: [
      { label: 'Short-term (< 1 year)', points: 1 },
      { label: 'Medium-short (1 – 3 years)', points: 2 },
      { label: 'Medium-term (3 – 5 years)', points: 3 },
      { label: 'Long-term (> 5 years)', points: 4 },
    ],
  },
  {
    id: 'income',
    title: 'How stable is your current income and financial emergency cushion?',
    description: 'Your financial stability determines your capacity to absorb investment volatility.',
    options: [
      { label: 'Variable income with minimal emergency savings', points: 1 },
      { label: 'Moderate income stability with 1-3 months savings', points: 2 },
      { label: 'Stable salary/business with 6+ months emergency fund', points: 3 },
      { label: 'High surplus income & substantial net worth cushion', points: 4 },
    ],
  },
  {
    id: 'experience',
    title: 'What is your prior experience with market-linked financial instruments?',
    description: 'Knowledge and exposure to market-traded assets like equities, REITs, and bonds.',
    options: [
      { label: 'None (FDs, Savings accounts, Post Office schemes only)', points: 1 },
      { label: 'Limited (Debt MFs, Fixed Income bonds, Bluechip funds)', points: 2 },
      { label: 'Moderate (Direct equities, REITs/InvITs, Hybrid funds)', points: 3 },
      { label: 'Extensive (Derivatives, High-Yield Bonds, Alternative assets)', points: 4 },
    ],
  },
  {
    id: 'reaction',
    title: 'How would you react if your portfolio dropped 20% during a market crash?',
    description: 'Assesses your psychological drawdown tolerance during high market stress.',
    options: [
      { label: 'Panic and exit all market positions immediately to safety', points: 1 },
      { label: 'Switch a portion of capital into fixed income/debt', points: 2 },
      { label: 'Hold steady and wait for market recovery over time', points: 3 },
      { label: 'Opportunity to buy more assets at discounted prices', points: 4 },
    ],
  },
  {
    id: 'liquidity',
    title: 'What are your immediate liquidity needs for this portfolio?',
    description: 'Requirement for cash withdrawals or emergency liquidity access.',
    options: [
      { label: 'High (Must be able to withdraw capital at any time without penalty)', points: 1 },
      { label: 'Moderate (May need partial withdrawals within 1-2 years)', points: 2 },
      { label: 'Low (Can lock in capital for 3-5 years for higher yield)', points: 3 },
      { label: 'Very Low (Pure long-term wealth creation, no withdrawal needs)', points: 4 },
    ],
  },
];

export const SEBI_RISK_RANKS: Record<SebiRiskCategory, number> = {
  'Low': 1,
  'Low to Moderate': 2,
  'Moderate': 3,
  'Moderately High': 4,
  'High': 5,
  'Very High': 6,
};

export const HOLDING_RISK_RANKS: Record<string, number> = {
  'Low': 1,
  'Low to Moderate': 2,
  'Moderate': 3,
  'Moderately High': 4,
  'High': 5,
  'Very High': 6,
};

/** Answers keyed by question id → selected option label string */
export type RiskProfilerAnswers = {
  horizon: string;
  incomeStability: string;
  experience: string;
  lossReaction: string;
  liquidityNeed: string;
};

/** Map each question id to its ordered option labels so we can score strings */
const QUESTION_LABEL_SCORES: Record<string, string[]> = {
  horizon: [
    'Short-term (< 1 year)',
    'Medium-short (1 – 3 years)',
    'Medium-term (3 – 5 years)',
    'Long-term (> 5 years)',
  ],
  incomeStability: [
    'Variable income with minimal emergency savings',
    'Moderate income stability with 1-3 months savings',
    'Stable salary/business with 6+ months emergency fund',
    'High surplus income & substantial net worth cushion',
  ],
  experience: [
    'None (FDs, Savings accounts, Post Office schemes only)',
    'Limited (Debt MFs, Fixed Income bonds, Bluechip funds)',
    'Moderate (Direct equities, REITs/InvITs, Hybrid funds)',
    'Extensive (Derivatives, High-Yield Bonds, Alternative assets)',
  ],
  lossReaction: [
    'Panic and exit all market positions immediately to safety',
    'Switch a portion of capital into fixed income/debt',
    'Hold steady and wait for market recovery over time',
    'Opportunity to buy more assets at discounted prices',
  ],
  liquidityNeed: [
    'High (Must be able to withdraw capital at any time without penalty)',
    'Moderate (May need partial withdrawals within 1-2 years)',
    'Low (Can lock in capital for 3-5 years for higher yield)',
    'Very Low (Pure long-term wealth creation, no withdrawal needs)',
  ],
};

export function calculateRiskCategory(answers: Record<string, number>): SebiRiskCategory {
  const values = Object.values(answers);
  if (values.length === 0) return 'Moderate';
  const totalScore = values.reduce((sum, pts) => sum + pts, 0);

  if (totalScore <= 7) return 'Low';
  if (totalScore <= 10) return 'Low to Moderate';
  if (totalScore <= 13) return 'Moderate';
  if (totalScore <= 15) return 'Moderately High';
  if (totalScore <= 18) return 'High';
  return 'Very High';
}

/**
 * Accepts string-keyed answers (question id → selected option label)
 * and returns the risk category + scoring metadata used by RiskProfilerForm.
 */
export function computeSebiRiskCategory(answers: Record<string, string | undefined>): {
  category: SebiRiskCategory;
  score: number;
  maxScore: number;
  answeredCount: number;
  totalQuestions: number;
} {
  const qIds = Object.keys(QUESTION_LABEL_SCORES);
  const totalQuestions = qIds.length;
  let score = 0;
  let answeredCount = 0;

  for (const qId of qIds) {
    const selected = answers[qId];
    if (!selected) continue;
    const labels = QUESTION_LABEL_SCORES[qId];
    const idx = labels.findIndex((l) => l === selected);
    if (idx !== -1) {
      score += idx + 1; // 1-indexed
      answeredCount++;
    }
  }

  const maxScore = totalQuestions * 4;

  // Compute category from accumulated score
  let category: SebiRiskCategory = 'Moderate';
  if (answeredCount === 0) {
    category = 'Moderate';
  } else if (score <= 7) {
    category = 'Low';
  } else if (score <= 10) {
    category = 'Low to Moderate';
  } else if (score <= 13) {
    category = 'Moderate';
  } else if (score <= 15) {
    category = 'Moderately High';
  } else if (score <= 18) {
    category = 'High';
  } else {
    category = 'Very High';
  }

  return { category, score, maxScore, answeredCount, totalQuestions };
}

/** Returns Tailwind token strings for the given risk category (bg, border, text). */
export function getSebiRiskVisualTokens(category: SebiRiskCategory): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  switch (category) {
    case 'Low':
      return { bg: 'bg-[#F0FDF4]', border: 'border-[#86EFAC]', text: 'text-[#15803D]', badge: 'bg-[#DCFCE7] text-[#15803D]' };
    case 'Low to Moderate':
      return { bg: 'bg-[#F0FDF4]', border: 'border-[#A3E635]', text: 'text-[#3F6212]', badge: 'bg-[#ECFCCB] text-[#3F6212]' };
    case 'Moderate':
      return { bg: 'bg-[#FFFBEB]', border: 'border-[#FCD34D]', text: 'text-[#92400E]', badge: 'bg-[#FEF3C7] text-[#92400E]' };
    case 'Moderately High':
      return { bg: 'bg-[#FFF7ED]', border: 'border-[#FDBA74]', text: 'text-[#C2410C]', badge: 'bg-[#FFEDD5] text-[#C2410C]' };
    case 'High':
      return { bg: 'bg-[#FFF1F2]', border: 'border-[#FCA5A5]', text: 'text-[#B91C1C]', badge: 'bg-[#FEE2E2] text-[#B91C1C]' };
    case 'Very High':
      return { bg: 'bg-[#FFF1F2]', border: 'border-[#F87171]', text: 'text-[#991B1B]', badge: 'bg-[#FEE2E2] text-[#991B1B]' };
    default:
      return { bg: 'bg-[#FFFBEB]', border: 'border-[#FCD34D]', text: 'text-[#92400E]', badge: 'bg-[#FEF3C7] text-[#92400E]' };
  }
}
