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
  | 'settings'
  | 'onboarding';

export type UserRole =
  | 'investor_free'
  | 'investor_premium'
  | 'broker_rm'
  | 'compliance_officer'
  | 'admin';

export type AssetCategory = 'equities' | 'bonds' | 'reits_invits' | 'cash';

/** Which pages each role can access */
export const ROLE_PERMISSIONS: Record<UserRole, {
  canAccess: PageId[];
  cannotAccess: PageId[];
  label: string;
  description: string;
  seesClientPii: boolean;
  defaultLandingPage: PageId;
  premiumGated: PageId[];
}> = {
  investor_free: {
    canAccess: ['dashboard', 'holdings', 'explainability', 'red-flags', 'settings'],
    cannotAccess: ['shock-sandbox', 'peer-benchmark', 'retrospective', 'broker-console', 'compliance', 'admin'],
    label: 'Investor (Free)',
    description: 'Upload CAS, view own unified dashboard, see own red flags & basic explainability.',
    seesClientPii: false,
    defaultLandingPage: 'dashboard',
    premiumGated: ['shock-sandbox', 'peer-benchmark', 'retrospective'],
  },
  investor_premium: {
    canAccess: ['dashboard', 'holdings', 'explainability', 'red-flags', 'shock-sandbox', 'peer-benchmark', 'retrospective', 'settings'],
    cannotAccess: ['broker-console', 'compliance', 'admin'],
    label: 'Investor (Premium)',
    description: 'Everything Free has, plus Shock Sandbox, Peer Benchmarking, Retrospective Simulator, cash-flow optimization.',
    seesClientPii: false,
    defaultLandingPage: 'dashboard',
    premiumGated: [],
  },
  broker_rm: {
    canAccess: ['broker-console', 'explainability', 'red-flags', 'settings'],
    cannotAccess: ['dashboard', 'holdings', 'shock-sandbox', 'peer-benchmark', 'retrospective', 'compliance', 'admin'],
    label: 'Broker / RM',
    description: 'View assigned clients\' portfolios, flags, and suitability scores.',
    seesClientPii: true, // Only for explicitly assigned clients
    defaultLandingPage: 'broker-console',
    premiumGated: [],
  },
  compliance_officer: {
    canAccess: ['compliance', 'settings'],
    cannotAccess: ['dashboard', 'holdings', 'shock-sandbox', 'peer-benchmark', 'retrospective', 'broker-console', 'admin'],
    label: 'Compliance Officer',
    description: 'View aggregate flag trends and mis-selling rates org-wide. Individual case drill-down requires explicit, logged action.',
    seesClientPii: false, // Default-aggregate. PII access requires logged explicit action.
    defaultLandingPage: 'compliance',
    premiumGated: [],
  },
  admin: {
    canAccess: ['admin', 'settings'],
    cannotAccess: ['dashboard', 'holdings', 'shock-sandbox', 'peer-benchmark', 'retrospective', 'broker-console', 'compliance'],
    label: 'Platform Admin',
    description: 'Configure rule-engine thresholds, onboard/whitelist new broker orgs. No client PII access by default.',
    seesClientPii: false, // Admins configure the system, not view individual data.
    defaultLandingPage: 'admin',
    premiumGated: [],
  },
};

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  action: 'drill_into_client' | 'export_audit_trail' | 'toggle_pii' | 'rule_threshold_change' | 'broker_onboarded';
  targetEntityId: string;
  targetEntityName: string;
  reason?: string;
  ipAddress: string;
  previousHash: string;
  hash: string;
}

export interface DpdpConsentRecord {
  consentId: string;
  purpose: 'Portfolio Aggregation & Mis-Selling Audit';
  lawBasis: 'India DPDP Act 2023 Section 6(1)';
  status: 'Active' | 'Revoked';
  grantedAt: string;
  retentionDays: number;
  autoPurgeAt: string;
}

export interface AccountAggregatorSession {
  aaHandle: string;
  fipName: string; // Financial Information Provider e.g. CDSL / NSDL / HDFC Bank
  consentStatus: 'APPROVED' | 'PENDING' | 'EXPIRED';
  sessionToken: string;
  expiresAt: string;
}

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
  portfolioWeight: number;
  lockInMonths: number;
  yieldPct?: number;
  riskCategory: 'Low' | 'Moderate' | 'High' | 'Very High';
  suitabilityScore: number;
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
  rawExtractedText?: string;
}

/** Onboarding walkthrough steps */
export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  action?: string;
  targetPage?: PageId;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 1,
    title: 'Sign up & choose your role',
    description: 'Your account is provisioned based on how you register — self-signup defaults you to the Investor role. Broker accounts are provisioned by your organization.',
    action: 'Continue',
  },
  {
    step: 2,
    title: 'Connect your portfolio',
    description: 'Upload a NSDL or CDSL Consolidated Account Statement (CAS) PDF, or parse the sample portfolio to see VestIQ in action immediately.',
    action: 'Parse Sample CAS',
    targetPage: 'dashboard',
  },
  {
    step: 3,
    title: 'Land on your Dashboard',
    description: 'Your total portfolio value, asset allocation, health score, and any active red flags appear instantly — no extra clicks needed.',
    action: 'Go to Dashboard',
    targetPage: 'dashboard',
  },
  {
    step: 4,
    title: 'Investigate a Red Flag',
    description: 'Click any flag card to see the full causal chain: why it was triggered, the exact mismatch that caused it, and the suggested remediation action.',
    action: 'View Red Flags',
    targetPage: 'red-flags',
  },
  {
    step: 5,
    title: 'Run the Shock Sandbox',
    description: 'Move the rate/market-shock sliders and watch the impact calculated against your actual holdings — not a generic template. Premium feature.',
    action: 'Open Shock Sandbox',
    targetPage: 'shock-sandbox',
  },
  {
    step: 6,
    title: 'Check Peer Benchmarking',
    description: 'See how your asset allocation compares to anonymized investors in your age and income cohort. Premium feature.',
    action: 'View Peer Benchmarks',
    targetPage: 'peer-benchmark',
  },
  {
    step: 7,
    title: 'Use the Retrospective Simulator',
    description: 'Explore "what if" scenarios on past decisions — framed constructively to educate rather than cause regret. Premium feature.',
    action: 'Run Retrospective',
    targetPage: 'retrospective',
  },
];
