export interface GlossaryEntry {
  term: string;
  definition: string;
  category?: 'instrument' | 'risk' | 'metric' | 'regulatory';
  aliases?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'invit': {
    term: 'InvIT (Infrastructure Investment Trust)',
    definition: 'A pooled investment vehicle that owns and manages revenue-generating infrastructure assets (like power grids, toll roads) and distributes periodic income to unit holders.',
    category: 'instrument',
    aliases: ['invit', 'invits', 'grid invit'],
  },
  'reit': {
    term: 'REIT (Real Estate Investment Trust)',
    definition: 'A company that owns, operates, or finances income-producing real estate properties (like office parks, commercial complexes) and distributes regular rental income to investors.',
    category: 'instrument',
    aliases: ['reit', 'reits'],
  },
  'ncd': {
    term: 'NCD (Non-Convertible Debenture)',
    definition: 'A fixed-income debt instrument issued by companies to raise capital that cannot be converted into equity shares, offering fixed coupon returns.',
    category: 'instrument',
    aliases: ['ncd', 'ncds', 'debenture'],
  },
  'expense ratio': {
    term: 'Expense Ratio (TER)',
    definition: 'The annual percentage fee charged by mutual funds and asset managers to cover administrative and operational costs, deducted directly from fund NAV.',
    category: 'metric',
    aliases: ['expense ratio', 'ter', 'expense ratio (ter)'],
  },
  'lock-in period': {
    term: 'Lock-in Period',
    definition: 'A mandatory minimum duration during which an investor cannot sell, redeem, or liquidate invested capital without restrictions or severe penalties.',
    category: 'risk',
    aliases: ['lock-in period', 'lock-in', 'lock in', 'locked-in'],
  },
  'suitability score': {
    term: 'Suitability Score',
    definition: 'A proprietary score (0–100) assessing whether an instrument fits your time horizon, risk profile, and liquidity requirements under SEBI guidelines.',
    category: 'metric',
    aliases: ['suitability score', 'suitability'],
  },
  'concentration risk': {
    term: 'Concentration Risk',
    definition: 'The vulnerability of a portfolio to heavy losses when too much capital is concentrated in a single stock, sector, or asset class (typically >25%).',
    category: 'risk',
    aliases: ['concentration risk', 'concentration'],
  },
  'liquidity mismatch': {
    term: 'Liquidity Mismatch',
    definition: 'A situation where your capital is tied up in illiquid or locked-in assets while your upcoming financial needs require liquid cash sooner.',
    category: 'risk',
    aliases: ['liquidity mismatch', 'liquidity horizon mismatch'],
  },
  'nav': {
    term: 'NAV (Net Asset Value)',
    definition: 'The per-unit market value of a mutual fund or REIT calculated by dividing the total value of all its holdings minus liabilities by outstanding units.',
    category: 'metric',
    aliases: ['nav', 'net asset value'],
  },
  'exit load': {
    term: 'Exit Load',
    definition: 'A fractional penalty percentage charged by mutual funds if you redeem your units before a specified holding period (e.g. 1% if redeemed within 1 year).',
    category: 'metric',
    aliases: ['exit load', 'exit penalty'],
  },
  'health score': {
    term: 'Health Score',
    definition: 'VestIQ’s holistic portfolio safety rating (0–100) combining diversification, liquidity, concentration, and regulatory suitability factors.',
    category: 'metric',
    aliases: ['health score', 'portfolio health score'],
  },
  'causal chain': {
    term: 'Causal Chain',
    definition: 'A 3-step explainability sequence (Trigger → Transmission Mechanism → Capital Impact) clarifying the exact structural cause of every portfolio risk.',
    category: 'metric',
    aliases: ['causal chain', 'causal-chain'],
  },
  'riskometer': {
    term: 'SEBI Riskometer',
    definition: 'SEBI’s standardized 6-tier visual risk classification system (Low to Very High) indicating the principal risk level of mutual fund schemes and market products.',
    category: 'regulatory',
    aliases: ['riskometer', 'sebi riskometer'],
  },
  'yield trap': {
    term: 'Yield Trap',
    definition: 'An investment offering deceptively high dividend or coupon yields that conceal high default risk, falling asset value, or unsustainable payout structures.',
    category: 'risk',
    aliases: ['yield trap', 'yield-trap'],
  },
  'what-if simulator': {
    term: 'What-If Simulator',
    definition: 'A non-authoritative sandbox to test how hypothetical buy, sell, or rebalancing trades would impact your Health Score before placing real orders.',
    category: 'metric',
    aliases: ['what-if simulator', 'what-if simulation'],
  },
  'cooling-off nudge': {
    term: 'Cooling-Off Nudge',
    definition: 'A behavioral friction checkpoint that interrupts panic selling or large impulsive liquidations with historical market context before proceeding.',
    category: 'risk',
    aliases: ['cooling-off nudge', 'cooling off', 'cooling-off'],
  },
  'emergency fund': {
    term: 'Emergency Fund',
    definition: 'A dedicated, highly liquid cash buffer covering 3 to 6 months of mandatory living expenses to prevent distressed forced selling of investments.',
    category: 'risk',
    aliases: ['emergency fund', 'liquid buffer'],
  },
  'scores': {
    term: 'SEBI SCORES',
    definition: 'SEBI Complaints Redress System — a centralized web-based portal enabling investors to lodge and track complaints against regulated market entities.',
    category: 'regulatory',
    aliases: ['scores', 'sebi scores'],
  },
};

export function getGlossaryEntry(termKey: string): GlossaryEntry | undefined {
  const normalized = termKey.toLowerCase().trim();
  if (GLOSSARY[normalized]) return GLOSSARY[normalized];
  for (const entry of Object.values(GLOSSARY)) {
    if (entry.aliases?.some((a) => a.toLowerCase() === normalized)) {
      return entry;
    }
  }
  return undefined;
}

/** Alias used by GlossaryTerm component */
export const lookupGlossaryTerm = getGlossaryEntry;

