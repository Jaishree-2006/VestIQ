import type { HoldingItem, RedFlagAlert, ClientProfile } from '../types';

export const INITIAL_HOLDINGS: HoldingItem[] = [
  {
    id: 'h1',
    name: 'Mindspace Business Parks REIT',
    ticker: 'MINDSPACE',
    category: 'reits_invits',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 2100,
    avgPrice: 320,
    currentPrice: 351.40,
    currentValue: 737940,
    portfolioWeight: 40.0,
    lockInMonths: 0,
    yieldPct: 6.8,
    riskCategory: 'Moderate',
    suitabilityScore: 68,
    causalChain: {
      cause: '40% concentration in one REIT',
      mechanism: 'rate-sensitive asset class',
      impact: '-15% estimated value per +1% rate move'
    }
  },
  {
    id: 'h2',
    name: 'PowerGrid Infrastructure Investment Trust (Grid InvIT)',
    ticker: 'PGINVIT',
    category: 'reits_invits',
    broker: 'Groww',
    depository: 'NSDL',
    units: 1000,
    avgPrice: 98,
    currentPrice: 97.50,
    currentValue: 97500,
    portfolioWeight: 5.3,
    lockInMonths: 36,
    yieldPct: 11.2,
    riskCategory: 'High',
    suitabilityScore: 45,
    causalChain: {
      cause: 'Mandatory 3-year lock-in period',
      mechanism: 'Stated liquidity horizon is 18 months',
      impact: 'High risk of forced secondary market liquidation penalty'
    }
  },
  {
    id: 'h3',
    name: 'HDFC Bank Ltd',
    ticker: 'HDFCBANK',
    category: 'equities',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 250,
    avgPrice: 1540,
    currentPrice: 1680.00,
    currentValue: 420000,
    portfolioWeight: 22.8,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 92,
    causalChain: {
      cause: 'Large-cap core banking allocation',
      mechanism: 'Stable net interest margin (NIM)',
      impact: 'Acts as portfolio stabilizer during market volatility'
    }
  },
  {
    id: 'h4',
    name: 'Infosys Ltd',
    ticker: 'INFY',
    category: 'equities',
    broker: 'ICICI Direct',
    depository: 'NSDL',
    units: 220,
    avgPrice: 1420,
    currentPrice: 1818.18,
    currentValue: 400000,
    portfolioWeight: 21.7,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 88,
    causalChain: {
      cause: 'Tier-1 IT export revenue generator',
      mechanism: 'USD earnings hedge against INR depreciation',
      impact: 'Provides growth upside with low default risk'
    }
  },
  {
    id: 'h5',
    name: '8.15% GOI Sovereign Bond 2031',
    ticker: 'GBOND2031',
    category: 'bonds',
    broker: 'RBI Retail Direct',
    depository: 'CDSL',
    units: 31,
    avgPrice: 10000,
    currentPrice: 10000.00,
    currentValue: 310000,
    portfolioWeight: 16.8,
    lockInMonths: 60,
    yieldPct: 8.15,
    riskCategory: 'Low',
    suitabilityScore: 95,
    causalChain: {
      cause: 'Sovereign backing zero default risk',
      mechanism: 'Fixed bi-annual coupon cashflow',
      impact: 'Guarantees regular income flow regardless of market crashes'
    }
  }
];

export const MOCK_RED_FLAGS: RedFlagAlert[] = [
  {
    id: 'rf1',
    holdingId: 'h2',
    holdingName: 'Grid InvIT',
    title: 'Liquidity mismatch on Grid InvIT',
    severity: 'high',
    category: 'liquidity_mismatch',
    description: 'This holding has a 3-year lock-in, but you said you may need this money in 18 months.',
    suggestedAction: 'Consider shifting ₹50,000 into liquid short-duration G-Secs before Q3 horizon.',
    sebiRuleRef: 'SEBI Circular CIR/IMD/DF/21/2012 on Investor Horizon Matching'
  },
  {
    id: 'rf2',
    holdingId: 'h1',
    holdingName: 'Mindspace REIT',
    title: 'Rate Sensitivity Concentration',
    severity: 'medium',
    category: 'concentration_risk',
    description: '40% of total portfolio value is concentrated in a single REIT asset class.',
    suggestedAction: 'Rebalance 15% from REIT into high-grade corporate bonds or diversified equity index.',
    sebiRuleRef: 'SEBI Advisory on Alternate Asset Concentration'
  }
];

export const MOCK_CLIENTS: ClientProfile[] = [
  {
    id: 'c1',
    name: 'Rajesh Kumar (You)',
    email: 'rajesh.k@example.com',
    casPan: 'ABCDE1234F',
    totalValue: 1842600,
    healthScore: 72,
    flagCount: 1,
    riskProfile: 'Moderate',
    topFlag: 'Liquidity Mismatch on Grid InvIT',
    lastUpdated: 'Today, 09:30 AM',
    assignedRM: 'Amit Verma (Senior Wealth Lead)'
  },
  {
    id: 'c2',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    casPan: 'FGHIJ5678K',
    totalValue: 4250000,
    healthScore: 58,
    flagCount: 3,
    riskProfile: 'Conservative',
    topFlag: 'High-Yield Junk Bond Exposure (Unrated)',
    lastUpdated: 'Yesterday',
    assignedRM: 'Amit Verma (Senior Wealth Lead)'
  },
  {
    id: 'c3',
    name: 'Vikram Merchant',
    email: 'vikram.m@example.com',
    casPan: 'LMNOP9012Q',
    totalValue: 12800000,
    healthScore: 89,
    flagCount: 0,
    riskProfile: 'Aggressive',
    topFlag: 'None - Clean Portfolio',
    lastUpdated: '3 days ago',
    assignedRM: 'Amit Verma (Senior Wealth Lead)'
  },
  {
    id: 'c4',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@example.com',
    casPan: 'QRSTU3456V',
    totalValue: 3100000,
    healthScore: 61,
    flagCount: 2,
    riskProfile: 'Moderate',
    topFlag: 'Mis-sold Structured Product with 5-year lock-in',
    lastUpdated: '1 week ago',
    assignedRM: 'Sonia Mehta (Compliance RM)'
  }
];

export const PEER_BENCHMARK_DATA = [
  { category: 'Equities', userPct: 44.5, peerAvgPct: 55.0, topQuartilePct: 60.0 },
  { category: 'Bonds & G-Secs', userPct: 16.8, peerAvgPct: 25.0, topQuartilePct: 20.0 },
  { category: 'REITs & InvITs', userPct: 38.7, peerAvgPct: 12.0, topQuartilePct: 10.0 },
  { category: 'Liquid Cash', userPct: 0.0, peerAvgPct: 8.0, topQuartilePct: 10.0 }
];

export const RETROSPECTIVE_SIM_DATA = [
  { month: 'Jul 2024', actualValue: 1650000, optimizedValue: 1650000, benchmarkNifty: 1650000 },
  { month: 'Oct 2024', actualValue: 1710000, optimizedValue: 1760000, benchmarkNifty: 1720000 },
  { month: 'Jan 2025', actualValue: 1680000, optimizedValue: 1840000, benchmarkNifty: 1750000 },
  { month: 'Apr 2025', actualValue: 1790000, optimizedValue: 1960000, benchmarkNifty: 1820000 },
  { month: 'Jul 2026', actualValue: 1842600, optimizedValue: 2085000, benchmarkNifty: 1910000 }
];
