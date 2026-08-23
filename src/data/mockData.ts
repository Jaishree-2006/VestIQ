import type { HoldingItem, RedFlagAlert, ClientProfile, SuitabilityReportRecord, HealthScoreEvent } from '../types';

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
    portfolioWeight: 32.7,
    lockInMonths: 0,
    yieldPct: 6.8,
    riskCategory: 'Moderate',
    suitabilityScore: 68,
    expense_ratio_pct: 0.85,
    exit_load_pct: 0,
    brokerage_pct: 0.1,
    broker_reg_number: 'INZ000031633',
    rm_name: 'Direct Portal (Zerodha)',
    next_payout_date: '2026-09-15',
    payout_type: 'distribution',
    estimated_payout_amount: 10080,
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
    portfolioWeight: 4.3,
    lockInMonths: 36,
    yieldPct: 11.2,
    riskCategory: 'High',
    suitabilityScore: 45,
    expense_ratio_pct: 1.25,
    exit_load_pct: 1.0,
    brokerage_pct: 0.1,
    broker_reg_number: 'INZ000301838',
    rm_name: 'Amit Verma (Relationship Manager)',
    next_payout_date: '2026-09-28',
    payout_type: 'distribution',
    estimated_payout_amount: 3000,
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
    portfolioWeight: 18.6,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 92,
    expense_ratio_pct: null,
    exit_load_pct: null,
    brokerage_pct: 0.05,
    broker_reg_number: 'INZ000031633',
    next_payout_date: '2026-11-10',
    payout_type: 'dividend',
    estimated_payout_amount: 4875,
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
    portfolioWeight: 17.7,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 88,
    expense_ratio_pct: null,
    exit_load_pct: null,
    brokerage_pct: 0.05,
    broker_reg_number: 'INZ000183631',
    next_payout_date: '2026-11-25',
    payout_type: 'dividend',
    estimated_payout_amount: 4400,
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
    portfolioWeight: 13.7,
    lockInMonths: 60,
    yieldPct: 8.15,
    riskCategory: 'Low',
    suitabilityScore: 95,
    expense_ratio_pct: null,
    exit_load_pct: null,
    brokerage_pct: 0.0,
    broker_reg_number: 'INF000000001',
    next_payout_date: '2026-10-15',
    payout_type: 'coupon',
    estimated_payout_amount: 12632,
    causalChain: {
      cause: 'Sovereign backing zero default risk',
      mechanism: 'Fixed bi-annual coupon cashflow',
      impact: 'Guarantees regular income flow regardless of market crashes'
    }
  },
  {
    id: 'h6',
    name: 'HDFC Top 100 Fund (Active Regular Growth)',
    ticker: 'HDFC100REG',
    category: 'mutual_funds',
    broker: 'Groww',
    depository: 'CDSL',
    units: 2000,
    avgPrice: 85,
    currentPrice: 100.00,
    currentValue: 200000,
    portfolioWeight: 8.9,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 78,
    expense_ratio_pct: 2.1,
    benchmark_expense_ratio_pct: 0.3,
    exit_load_pct: 1.0,
    brokerage_pct: 0.0,
    broker_reg_number: 'ARN-118253',
    rm_name: 'Aditi Sharma (MF Distributor)',
    causalChain: {
      cause: '2.1% active mutual fund expense ratio',
      mechanism: 'Regular plan distributor commission recurring annual drag',
      impact: '₹3,600/year higher cost vs 0.3% direct index alternative'
    }
  },
  {
    id: 'h7',
    name: 'ICICI Prudential Liquid Fund (Direct Growth)',
    ticker: 'ICICILIQUID',
    category: 'mutual_funds',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 250,
    avgPrice: 360,
    currentPrice: 360.00,
    currentValue: 90000,
    portfolioWeight: 4.0,
    lockInMonths: 0,
    riskCategory: 'Low',
    suitabilityScore: 98,
    expense_ratio_pct: 0.20,
    benchmark_expense_ratio_pct: 0.20,
    exit_load_pct: 0.0,
    brokerage_pct: 0.0,
    broker_reg_number: 'INZ000031633',
    causalChain: {
      cause: 'T+1 liquid cash-equivalent buffer',
      mechanism: 'Short-term overnight & treasury debt instruments',
      impact: 'Acts as primary emergency liquidity cushion for living expenses'
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
    description: 'This holding has a 3-year lock-in recommended by your Relationship Manager (Amit Verma), but you said you may need this money in 18 months.',
    suggestedAction: 'Consider shifting ₹50,000 into liquid short-duration G-Secs before Q3 horizon.',
    sebiRuleRef: 'SEBI investor-horizon and product-suitability guidance',
    rm_name: 'Amit Verma (Relationship Manager)',
    broker_reg_number: 'INZ000301838'
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
    sebiRuleRef: 'SEBI alternative-asset concentration and suitability guidance',
    broker_reg_number: 'INZ000031633',
    rm_name: 'Direct Portal (Zerodha)'
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
    investmentTimeline: '18-36 Months (Medium Horizon)',
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
    investmentTimeline: '12 Months (Short Horizon)',
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
    investmentTimeline: '5+ Years (Long Horizon)',
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
    investmentTimeline: '24 Months (Medium Horizon)',
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

export const MOCK_HEALTH_SCORE_EVENTS: HealthScoreEvent[] = [
  {
    id: 'hse-3',
    userId: 'user_1',
    timestamp: '2026-08-04T10:30:00Z',
    previousScore: 78,
    newScore: 72,
    delta: -6,
    triggerType: 'new_holding',
    reasonObject: {
      factor: 'Concentration Risk',
      penaltyOrBonus: -6,
      reason: 'New REIT purchase increased real estate & infrastructure concentration to 38.7%, exceeding the recommended 25% threshold.'
    }
  },
  {
    id: 'hse-2',
    userId: 'user_1',
    timestamp: '2026-07-20T14:15:00Z',
    previousScore: 64,
    newScore: 78,
    delta: 14,
    triggerType: 'flag_resolved',
    reasonObject: {
      factor: 'Debt Maturity Mismatch',
      penaltyOrBonus: 14,
      reason: 'Resolved lock-in mismatch by reallocating high-risk unrated bonds into 3-Year G-Secs matching stated liquidity horizon.'
    }
  },
  {
    id: 'hse-1',
    userId: 'user_1',
    timestamp: '2026-06-10T09:00:00Z',
    previousScore: 52,
    newScore: 64,
    delta: 12,
    triggerType: 'holding_removed',
    reasonObject: {
      factor: 'Credit Quality Upgrade',
      penaltyOrBonus: 12,
      reason: 'Exited speculative unrated corporate debentures, reducing portfolio credit default exposure.'
    }
  }
];


export const MOCK_SUITABILITY_REPORTS: SuitabilityReportRecord[] = [
  {
    id: 'sr-101',
    clientId: 'c1',
    clientName: 'Rajesh Kumar (You)',
    casPan: 'ABCDE1234F',
    generatedBy: 'Amit Verma (RM)',
    generatedAt: '2026-08-04 10:15 AM',
    status: 'acknowledged',
    reviewedBy: 'Neha Iyer (Compliance)',
    reviewedAt: '2026-08-04 11:30 AM',
    healthScore: 72,
    redFlagsCount: 1,
    riskProfile: 'Moderate',
    investmentTimeline: '18-36 Months (Medium Horizon)',
    totalValue: 1842600,
    allocationSummary: {
      equitiesPct: 44.5,
      mfsPct: 0.0,
      bondsPct: 16.8,
      reitsPct: 38.7
    },
    healthScoreFactors: [
      { factor: 'Single REIT Concentration', penaltyOrBonus: -12, reason: '40% concentrated in Mindspace REIT' },
      { factor: 'Lock-in Horizon Mismatch', penaltyOrBonus: -10, reason: 'Grid InvIT 36-mo lockin vs 18-mo horizon' },
      { factor: 'No Panic Selling History', penaltyOrBonus: +8, reason: 'Consistent long-term holding pattern' }
    ],
    redFlagsList: [
      {
        title: 'Liquidity mismatch on Grid InvIT',
        category: 'liquidity_mismatch',
        description: 'Holding has 3-year lock-in vs stated 18-month liquidity horizon.',
        suggestedAction: 'Reallocate ₹50,000 to liquid G-Secs.',
        sebiRuleRef: 'SEBI product suitability and investor-horizon guidance'
      }
    ]
  },
  {
    id: 'sr-102',
    clientId: 'c2',
    clientName: 'Priya Sharma',
    casPan: 'FGHIJ5678K',
    generatedBy: 'Amit Verma (RM)',
    generatedAt: '2026-08-05 02:45 PM',
    status: 'generated',
    healthScore: 58,
    redFlagsCount: 3,
    riskProfile: 'Conservative',
    investmentTimeline: '12 Months (Short Horizon)',
    totalValue: 4250000,
    allocationSummary: {
      equitiesPct: 30.0,
      mfsPct: 20.0,
      bondsPct: 35.0,
      reitsPct: 15.0
    },
    healthScoreFactors: [
      { factor: 'Unrated Junk Bond Exposure', penaltyOrBonus: -20, reason: 'Conservative profile holds unrated high-yield debt' },
      { factor: 'Short Horizon Lock-in', penaltyOrBonus: -14, reason: 'Lock-in exceeds 12-month stated requirement' }
    ],
    redFlagsList: [
      {
        title: 'High-Yield Junk Bond Exposure (Unrated)',
        category: 'yield_trap',
        description: 'Client profile is Conservative, but holds unrated high-yield corporate debentures.',
        suggestedAction: 'Exit junk bond exposure and transition into AAA PSU bonds.',
        sebiRuleRef: 'SEBI Debt Product Suitability Guidelines'
      },
      {
        title: 'Over-concentrated Non-convertible Debentures',
        category: 'concentration_risk',
        description: '35% exposure in non-tier 1 corporate debt.',
        suggestedAction: 'Diversify across sovereign debt instruments.',
        sebiRuleRef: 'SEBI Portfolio Diversification Rule'
      }
    ]
  },
  {
    id: 'sr-103',
    clientId: 'c4',
    clientName: 'Ananya Deshmukh',
    casPan: 'QRSTU3456V',
    generatedBy: 'Sonia Mehta (Compliance RM)',
    generatedAt: '2026-08-06 09:10 AM',
    status: 'generated',
    healthScore: 61,
    redFlagsCount: 2,
    riskProfile: 'Moderate',
    investmentTimeline: '24 Months (Medium Horizon)',
    totalValue: 3100000,
    allocationSummary: {
      equitiesPct: 50.0,
      mfsPct: 15.0,
      bondsPct: 20.0,
      reitsPct: 15.0
    },
    healthScoreFactors: [
      { factor: 'Structured Product Lock-in', penaltyOrBonus: -15, reason: '5-year lock-in product mis-sold on 24-month horizon' }
    ],
    redFlagsList: [
      {
        title: 'Mis-sold Structured Product with 5-year lock-in',
        category: 'suitability',
        description: 'Complex derivative-linked structure sold without clear horizon disclosure.',
        suggestedAction: 'Initiate broker review and restructuring option.',
        sebiRuleRef: 'SEBI Mis-Selling & Suitability Framework'
      }
    ]
  }
];

