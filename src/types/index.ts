export type PageId =
  | 'home'
  | 'how-it-works'
  | 'features'
  | 'for-brokers'
  | 'pricing'
  | 'about'
  | 'auth'
  | 'dashboard'
  | 'holdings'
  | 'explainability'
  | 'red-flags'
  | 'shock-sandbox'
  | 'peer-benchmark'
  | 'retrospective'
  | 'broker-console'
  | 'compliance'
  | 'admin'
  | 'settings';

export type UserRole =
  | 'investor_free'
  | 'investor_premium'
  | 'broker_rm'
  | 'compliance_officer'
  | 'admin';

export type AssetCategory = 'equities' | 'bonds' | 'reits_invits' | 'cash';

export interface HoldingItem {
  id: string;
  name: string;
  ticker: string;
  category: AssetCategory;
  broker: string;
  depository: 'CDSL' | 'NSDL';
  units: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  portfolioWeight: number; // percentage, e.g. 40
  lockInMonths: number;
  yieldPct?: number;
  riskCategory: 'Low' | 'Moderate' | 'High' | 'Very High';
  suitabilityScore: number; // 0 - 100
  causalChain: {
    cause: string;
    mechanism: string;
    impact: string;
  };
}

export interface RedFlagAlert {
  id: string;
  holdingId: string;
  holdingName: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  category: 'liquidity_mismatch' | 'concentration_risk' | 'yield_trap' | 'hidden_fee' | 'suitability';
  description: string;
  suggestedAction: string;
  sebiRuleRef: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  casPan: string;
  totalValue: number;
  healthScore: number;
  flagCount: number;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  topFlag: string;
  lastUpdated: string;
  assignedRM: string;
}

export interface CasParseResult {
  investorName: string;
  pan: string;
  statementPeriod: string;
  totalAssets: number;
  holdingsCount: number;
  detectedBrokers: string[];
  parsedHoldings: HoldingItem[];
}
