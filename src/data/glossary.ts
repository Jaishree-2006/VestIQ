/**
 * Static financial glossary — fixed reference content, no backend required.
 * Each entry: the canonical term and a plain-English one-sentence definition
 * matching the tone used in existing explanation text throughout the app.
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
}

/** Lookup key → GlossaryEntry. Keys are lowercase for case-insensitive matching. */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  invit: {
    term: 'InvIT',
    definition:
      'Infrastructure Investment Trust — a listed instrument that pools investor money to own and operate infrastructure assets like roads, power lines, or gas pipelines, paying out most income as regular distributions.',
  },
  reit: {
    term: 'REIT',
    definition:
      'Real Estate Investment Trust — a listed instrument that owns income-generating real estate (offices, malls, warehouses) and must distribute at least 90% of its net distributable cash flow to unitholders.',
  },
  ncd: {
    term: 'NCD',
    definition:
      'Non-Convertible Debenture — a fixed-income bond issued by a company that pays a set interest rate and cannot be converted into equity shares, making it purely a debt instrument.',
  },
  'expense ratio': {
    term: 'Expense Ratio',
    definition:
      'The annual percentage of your invested amount charged by a mutual fund or ETF to cover management, administration, and distribution costs — deducted directly from the fund\'s NAV.',
  },
  ter: {
    term: 'TER (Total Expense Ratio)',
    definition:
      'Total Expense Ratio — the all-in annual cost of holding a fund, expressed as a percentage of AUM, covering fund management fees, trustee fees, and SEBI-mandated distributor commissions.',
  },
  'lock-in period': {
    term: 'Lock-in Period',
    definition:
      'A mandatory holding window during which you cannot redeem or sell an investment without incurring a penalty — common in ELSS funds (3 years), InvITs, and certain NCDs.',
  },
  'exit load': {
    term: 'Exit Load',
    definition:
      'A fee charged when you redeem a mutual fund within a specified period (typically 1 year), expressed as a percentage of the redemption amount, to discourage short-term trading.',
  },
  nav: {
    term: 'NAV',
    definition:
      'Net Asset Value — the per-unit price of a mutual fund calculated daily by dividing the total market value of all assets minus liabilities by the total number of units outstanding.',
  },
  'suitability score': {
    term: 'Suitability Score',
    definition:
      'VestIQ\'s proprietary 0–100 rating that measures how well a holding matches your stated risk tolerance, investment horizon, and financial goals — higher is better.',
  },
  'concentration risk': {
    term: 'Concentration Risk',
    definition:
      'The danger of having too much of your portfolio in a single holding, sector, or asset class — amplifying losses if that position underperforms.',
  },
  'liquidity mismatch': {
    term: 'Liquidity Mismatch',
    definition:
      'A misalignment between when you may need your money (your investment horizon) and when a holding actually allows you to access it — for example, holding a 3-year locked-in InvIT when you need funds in 18 months.',
  },
  brokerage: {
    term: 'Brokerage',
    definition:
      'The transaction fee charged by your broker each time you buy or sell an instrument, expressed as a percentage of the trade value or a flat fee per order.',
  },
  scores: {
    term: 'SCORES',
    definition:
      'SEBI Complaints Redress System — the official SEBI portal where retail investors can file grievances against brokers, mutual funds, or listed companies and track resolution.',
  },
  'health score': {
    term: 'Health Score',
    definition:
      'VestIQ\'s overall portfolio wellness rating (0–100) derived from diversification, suitability alignment, cost efficiency, and liquidity — updated each time you upload a fresh CAS.',
  },
  'causal chain': {
    term: 'Causal Chain',
    definition:
      'VestIQ\'s three-step explanation format — Root Cause → Transmission Mechanism → Projected Impact — that shows exactly why a holding creates risk and how that risk flows through to your portfolio value.',
  },
  benchmark: {
    term: 'Benchmark',
    definition:
      'A reference index (e.g. Nifty 50 or a category average) against which a fund\'s performance or cost is compared to judge whether it is delivering value for the fees charged.',
  },
  'horizon mismatch': {
    term: 'Horizon Mismatch',
    definition:
      'A mismatch between your investment timeline (when you need the money) and the actual liquidity or lock-in profile of a holding — a key SEBI suitability concern.',
  },
  'sebi riskometer': {
    term: 'SEBI Riskometer',
    definition:
      'A mandatory SEBI-standardised risk dial on every mutual fund that classifies product risk into six levels — Low, Low-to-Moderate, Moderate, Moderately High, High, and Very High.',
  },
};

/**
 * Look up a glossary entry by any casing of the term.
 * Returns undefined if the term is not in the glossary.
 */
export function lookupGlossaryTerm(term: string): GlossaryEntry | undefined {
  return GLOSSARY[term.toLowerCase()];
}
