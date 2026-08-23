import type { HoldingItem, HouseholdLink, HouseholdPartnerSummary } from '../types';

export const SAMPLE_PARTNER_HOLDINGS: HoldingItem[] = [
  {
    id: 'ph1',
    name: 'Tata Consultancy Services Ltd',
    ticker: 'TCS',
    category: 'equities',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 120,
    avgPrice: 3800,
    currentPrice: 4250.0,
    currentValue: 510000,
    portfolioWeight: 35.2,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 90,
    expense_ratio_pct: null,
    exit_load_pct: null,
    brokerage_pct: 0.05,
    causalChain: {
      cause: 'Blue-chip IT services exporter',
      mechanism: 'Stable cash flow and dividend generation',
      impact: 'Acts as large-cap portfolio ballast',
    },
  },
  {
    id: 'ph2',
    name: 'Reliance Industries Ltd',
    ticker: 'RELIANCE',
    category: 'equities',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 115,
    avgPrice: 2800,
    currentPrice: 2956.5,
    currentValue: 340000,
    portfolioWeight: 23.4,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 88,
    expense_ratio_pct: null,
    exit_load_pct: null,
    brokerage_pct: 0.05,
    causalChain: {
      cause: 'Diversified conglomerate exposure',
      mechanism: 'Retail & telecom domestic market dominance',
      impact: 'Provides growth upside',
    },
  },
  {
    id: 'ph3',
    name: '7.18% GOI Sovereign Bond 2033',
    ticker: 'GBOND2033',
    category: 'bonds',
    broker: 'RBI Retail Direct',
    depository: 'CDSL',
    units: 35,
    avgPrice: 10000,
    currentPrice: 10000.0,
    currentValue: 350000,
    portfolioWeight: 24.1,
    lockInMonths: 84,
    yieldPct: 7.18,
    riskCategory: 'Low',
    suitabilityScore: 96,
    expense_ratio_pct: null,
    exit_load_pct: null,
    brokerage_pct: 0.0,
    causalChain: {
      cause: 'Sovereign-backed fixed income',
      mechanism: 'Semi-annual coupon payout',
      impact: 'Secures predictable household cash flow',
    },
  },
  {
    id: 'ph4',
    name: 'Embassy Office Parks REIT',
    ticker: 'EMBASSY',
    category: 'reits_invits',
    broker: 'Groww',
    depository: 'NSDL',
    units: 400,
    avgPrice: 360,
    currentPrice: 375.0,
    currentValue: 150000,
    portfolioWeight: 10.3,
    lockInMonths: 0,
    yieldPct: 7.1,
    riskCategory: 'Moderate',
    suitabilityScore: 82,
    expense_ratio_pct: 0.9,
    exit_load_pct: 0,
    brokerage_pct: 0.1,
    causalChain: {
      cause: 'Commercial Grade-A real estate assets',
      mechanism: 'Quarterly rental distributions',
      impact: 'Yield generator for household income',
    },
  },
  {
    id: 'ph5',
    name: 'Parag Parikh Flexi Cap Fund (Direct Growth)',
    ticker: 'PPFASGROWTH',
    category: 'mutual_funds',
    broker: 'Groww',
    depository: 'CDSL',
    units: 1250,
    avgPrice: 70,
    currentPrice: 80.0,
    currentValue: 100000,
    portfolioWeight: 6.9,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 92,
    expense_ratio_pct: 0.65,
    benchmark_expense_ratio_pct: 0.3,
    exit_load_pct: 1.0,
    brokerage_pct: 0.0,
    causalChain: {
      cause: 'Global flexi-cap mutual fund',
      mechanism: 'Active value investing with US equity allocation',
      impact: 'Diversifies household equity beyond domestic indices',
    },
  },
];

/**
 * Derives partner aggregate financial totals from raw holdings.
 * By default, partnerHoldings line items are withheld unless canViewDetails is true.
 */
export function computePartnerSummary(
  partnerName: string,
  partnerEmail: string,
  partnerHoldings: HoldingItem[],
  canViewDetails: boolean
): HouseholdPartnerSummary {
  const totalValue = partnerHoldings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const equitiesValue = partnerHoldings
    .filter((h) => h.category === 'equities')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const bondsValue = partnerHoldings
    .filter((h) => h.category === 'bonds')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const reitsValue = partnerHoldings
    .filter((h) => h.category === 'reits_invits')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const mutualFundsValue = partnerHoldings
    .filter((h) => h.category === 'mutual_funds')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const cashValue = partnerHoldings
    .filter((h) => h.category === 'cash')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  return {
    partnerName,
    partnerEmail,
    totalValue,
    equitiesValue,
    bondsValue,
    reitsValue,
    mutualFundsValue,
    cashValue,
    holdingsCount: partnerHoldings.length,
    canViewDetails,
    partnerHoldings: canViewDetails ? partnerHoldings : undefined,
  };
}

export interface CombinedPortfolioStats {
  combinedTotalValue: number;
  combinedEquities: number;
  combinedBonds: number;
  combinedReits: number;
  combinedMutualFunds: number;
  combinedCash: number;
  combinedEquitiesPct: number;
  combinedBondsPct: number;
  combinedReitsPct: number;
  combinedMutualFundsPct: number;
  combinedCashPct: number;
}

export function computeCombinedPortfolioStats(
  userHoldings: HoldingItem[],
  partnerSummary: HouseholdPartnerSummary | null
): CombinedPortfolioStats {
  const myEquities = userHoldings
    .filter((h) => h.category === 'equities')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const myBonds = userHoldings
    .filter((h) => h.category === 'bonds')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const myReits = userHoldings
    .filter((h) => h.category === 'reits_invits')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const myMutualFunds = userHoldings
    .filter((h) => h.category === 'mutual_funds')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const myCash = userHoldings
    .filter((h) => h.category === 'cash')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const myTotal = userHoldings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const partnerEquities = partnerSummary ? partnerSummary.equitiesValue : 0;
  const partnerBonds = partnerSummary ? partnerSummary.bondsValue : 0;
  const partnerReits = partnerSummary ? partnerSummary.reitsValue : 0;
  const partnerMutualFunds = partnerSummary ? partnerSummary.mutualFundsValue : 0;
  const partnerCash = partnerSummary ? partnerSummary.cashValue : 0;
  const partnerTotal = partnerSummary ? partnerSummary.totalValue : 0;

  const combinedTotalValue = myTotal + partnerTotal;
  const combinedEquities = myEquities + partnerEquities;
  const combinedBonds = myBonds + partnerBonds;
  const combinedReits = myReits + partnerReits;
  const combinedMutualFunds = myMutualFunds + partnerMutualFunds;
  const combinedCash = myCash + partnerCash;

  return {
    combinedTotalValue,
    combinedEquities,
    combinedBonds,
    combinedReits,
    combinedMutualFunds,
    combinedCash,
    combinedEquitiesPct: combinedTotalValue > 0 ? Number(((combinedEquities / combinedTotalValue) * 100).toFixed(1)) : 0,
    combinedBondsPct: combinedTotalValue > 0 ? Number(((combinedBonds / combinedTotalValue) * 100).toFixed(1)) : 0,
    combinedReitsPct: combinedTotalValue > 0 ? Number(((combinedReits / combinedTotalValue) * 100).toFixed(1)) : 0,
    combinedMutualFundsPct: combinedTotalValue > 0 ? Number(((combinedMutualFunds / combinedTotalValue) * 100).toFixed(1)) : 0,
    combinedCashPct: combinedTotalValue > 0 ? Number(((combinedCash / combinedTotalValue) * 100).toFixed(1)) : 0,
  };
}
