import type { SebiRiskCategory, RiskProfilerAnswers, RiskProfilerQuestion } from '../types';

/**
 * Ordered numeric rank for SEBI 6-tier Riskometer categories (1 = Low, 6 = Very High).
 */
export const SEBI_RISK_RANKS: Record<SebiRiskCategory, number> = {
  'Low': 1,
  'Low to Moderate': 2,
  'Moderate': 3,
  'Moderately High': 4,
  'High': 5,
  'Very High': 6,
};

/**
 * 5 Standard SEBI Riskometer Assessment Questions
 */
export const SEBI_RISK_QUESTIONS: RiskProfilerQuestion[] = [
  {
    id: 'horizon',
    title: '1. Investment Horizon',
    subtitle: 'How long do you intend to stay invested before needing substantial capital withdrawals?',
    options: [
      { value: '<1yr', label: 'Under 1 year', sublabel: 'Capital preservation is primary priority', score: 1 },
      { value: '1-3yr', label: '1 to 3 years', sublabel: 'Short-to-medium horizon, low volatility tolerance', score: 2 },
      { value: '3-5yr', label: '3 to 5 years', sublabel: 'Balanced horizon, can weather moderate cyclical swings', score: 3 },
      { value: '5-10yr', label: '5 to 10 years', sublabel: 'Long-term compounding focus', score: 4 },
      { value: '>10yr', label: 'Over 10 years', sublabel: 'Generational wealth / aggressive growth horizon', score: 5 },
    ],
  },
  {
    id: 'incomeStability',
    title: '2. Income Stability & Cash Flow',
    subtitle: 'Which description best matches your current primary income source and predictable cashflow?',
    options: [
      { value: 'unpredictable', label: 'Unpredictable or irregular income', sublabel: 'Freelance, early-stage business, or contract work', score: 1 },
      { value: 'moderate', label: 'Moderate stability with variable bonuses', sublabel: 'Commission-based or seasonal earnings', score: 2 },
      { value: 'stable', label: 'Stable, predictable salary / pension', sublabel: 'Established employment or assured recurring cashflow', score: 3 },
      { value: 'high_surplus', label: 'Substantial multi-source surplus', sublabel: 'Multiple income streams, high savings rate, strong safety net', score: 5 },
    ],
  },
  {
    id: 'experience',
    title: '3. Prior Market Experience',
    subtitle: 'What is your familiarity and past track record with market-linked financial instruments?',
    options: [
      { value: 'none', label: 'Fixed deposits & savings accounts only', sublabel: 'Zero exposure to price-fluctuating instruments', score: 1 },
      { value: 'mf_sip', label: 'Mutual fund SIPs & index funds', sublabel: 'Familiar with NAV fluctuations over multiple years', score: 2 },
      { value: 'direct_equity', label: 'Direct equities, REITs & corporate bonds', sublabel: 'Actively manage allocations and understand sector risks', score: 4 },
      { value: 'active_derivatives', label: 'Derivatives, InvITs & alternative assets', sublabel: 'Comfortable with leverage, illiquid lock-ins and market cycles', score: 5 },
    ],
  },
  {
    id: 'lossReaction',
    title: '4. Reaction to a Hypothetical 20% Drop',
    subtitle: 'If your portfolio drops 20% in 3 months due to sudden broad market volatility, what would you do?',
    options: [
      { value: 'panic_sell', label: 'Sell all remaining holdings immediately', sublabel: 'Cannot tolerate further loss of principal capital', score: 1 },
      { value: 'anxious_trim', label: 'Feel anxious and trim higher-risk positions', sublabel: 'Shift capital toward sovereign guaranteed debt', score: 2 },
      { value: 'hold_calm', label: 'Hold steady and wait for recovery', sublabel: 'Understand that drawdown is part of equity cycles', score: 4 },
      { value: 'buy_dip', label: 'Invest additional surplus at discounted valuations', sublabel: 'View corrections as strategic entry opportunities', score: 5 },
    ],
  },
  {
    id: 'liquidityNeed',
    title: '5. Emergency Liquidity Buffer',
    subtitle: 'How accessible must your invested capital be for unforeseen emergencies or family needs?',
    options: [
      { value: 'immediate', label: 'May need access within 6–12 months', sublabel: 'No dedicated emergency fund separate from this portfolio', score: 1 },
      { value: 'partial_1_2yr', label: 'May need 20–30% liquidity within 1–2 years', sublabel: 'Modest emergency buffer established', score: 2 },
      { value: 'fully_buffered', label: 'Separate 6+ month emergency fund intact', sublabel: 'Invested capital has zero liquidity pressure for 3+ years', score: 5 },
    ],
  },
];

/**
 * Score questionnaire answers into SEBI 6-tier Riskometer category.
 * Total points range from 5 to 25.
 */
export function computeSebiRiskCategory(answers: Partial<RiskProfilerAnswers>): {
  category: SebiRiskCategory;
  score: number;
  maxScore: number;
  answeredCount: number;
  totalQuestions: number;
} {
  let score = 0;
  let answeredCount = 0;

  for (const q of SEBI_RISK_QUESTIONS) {
    const val = answers[q.id];
    if (val) {
      const opt = q.options.find(o => o.value === val);
      if (opt) {
        score += opt.score;
        answeredCount++;
      }
    }
  }

  // If partially answered, extrapolate proportionally (default baseline score = 13 for Moderate)
  const normalizedScore = answeredCount > 0
    ? Math.round((score / (answeredCount * 5)) * 25)
    : 13;

  let category: SebiRiskCategory;
  if (normalizedScore <= 8) {
    category = 'Low';
  } else if (normalizedScore <= 12) {
    category = 'Low to Moderate';
  } else if (normalizedScore <= 16) {
    category = 'Moderate';
  } else if (normalizedScore <= 19) {
    category = 'Moderately High';
  } else if (normalizedScore <= 22) {
    category = 'High';
  } else {
    category = 'Very High';
  }

  return {
    category,
    score: normalizedScore,
    maxScore: 25,
    answeredCount,
    totalQuestions: SEBI_RISK_QUESTIONS.length,
  };
}

/**
 * Get visual token classes matching existing app color tokens:
 * - Low / Low to Moderate: emerald (low risk)
 * - Moderate / Moderately High: gold (neutral/info)
 * - High / Very High: red (high risk alert)
 */
export function getSebiRiskVisualTokens(category?: SebiRiskCategory | null) {
  if (!category) {
    return {
      bg: 'bg-white',
      border: 'border-[#EDE9DF]',
      hoverBorder: 'hover:border-[#C57D25]',
      text: 'text-[#8B93A7]',
      badge: 'bg-[#FAF8F5] text-[#8B93A7] border border-[#EDE9DF]',
      label: 'Not Assessed',
      accentColor: '#8B93A7',
    };
  }
  const rank = SEBI_RISK_RANKS[category] || 3;
  if (rank <= 2) {
    return {
      bg: 'bg-[#E6F4EA]',
      border: 'border-[#A7F3D0]',
      hoverBorder: 'hover:border-[#2BB673]',
      text: 'text-[#2BB673]',
      badge: 'bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0]',
      label: 'Low Risk',
      accentColor: '#2BB673',
    };
  }
  if (rank <= 4) {
    return {
      bg: 'bg-[#FFF8EE]',
      border: 'border-[#F7E5C8]',
      hoverBorder: 'hover:border-[#C57D25]',
      text: 'text-[#C57D25]',
      badge: 'bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]',
      label: 'Moderate Risk',
      accentColor: '#C57D25',
    };
  }
  return {
    bg: 'bg-[#FDF2F2]',
    border: 'border-[#FCA5A5]',
    hoverBorder: 'hover:border-[#EF4444]',
    text: 'text-[#EF4444]',
    badge: 'bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]',
    label: 'High Risk',
    accentColor: '#EF4444',
  };
}
