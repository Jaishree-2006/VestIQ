import type { AssetCategory } from '../types';
import type { SebiRiskCategory } from '../utils/riskProfiler';

export interface UpcomingIssue {
  id: string;
  name: string;
  ticker?: string;
  issue_type: 'IPO' | 'NFO' | 'NCD';
  asset_class: AssetCategory;
  sector: string;
  risk_category: SebiRiskCategory;
  description: string;
  issue_dates: string;
  price_range: string;
  min_investment: number;
}

export const UPCOMING_ISSUES: UpcomingIssue[] = [
  {
    id: 'issue-1',
    name: 'Nexus Select Commercial REIT NFO',
    ticker: 'NEXUS-REIT',
    issue_type: 'NFO',
    asset_class: 'reits_invits',
    sector: 'Real Estate / Infrastructure',
    risk_category: 'High',
    description: 'New fund offer focused on Grade-A retail shopping malls and commercial assets across Tier-1 Indian metropolitan cities.',
    issue_dates: 'Open until 30 Aug 2026',
    price_range: '₹100 per unit',
    min_investment: 15000,
  },
  {
    id: 'issue-2',
    name: 'HDFC Ultra Short Duration Debt NFO',
    ticker: 'HDFC-USD',
    issue_type: 'NFO',
    asset_class: 'bonds',
    sector: 'Fixed Income / Sovereign Debt',
    risk_category: 'Low to Moderate',
    description: 'Open-ended ultra-short-term debt scheme investing in AAA-rated corporate bonds and short-tenor money market instruments.',
    issue_dates: 'Open until 28 Aug 2026',
    price_range: '₹10 per unit',
    min_investment: 5000,
  },
  {
    id: 'issue-3',
    name: 'Tata Capital Commercial NCD Issue',
    ticker: 'TATACAP-NCD',
    issue_type: 'NCD',
    asset_class: 'bonds',
    sector: 'Banking & Financial Services',
    risk_category: 'Moderate',
    description: 'Secured redeemable non-convertible debentures offering fixed 8.75% annualized coupon with AAA/Stable rating.',
    issue_dates: 'Closes 5 Sep 2026',
    price_range: '₹1,000 per NCD',
    min_investment: 10000,
  },
  {
    id: 'issue-4',
    name: 'Bajaj Housing Finance IPO',
    ticker: 'BAJAJHFL',
    issue_type: 'IPO',
    asset_class: 'equities',
    sector: 'Banking & Financial Services',
    risk_category: 'Moderately High',
    description: 'Initial public offering of a leading non-deposit-taking housing finance company registered with the National Housing Bank.',
    issue_dates: 'Opens 1 Sep 2026',
    price_range: '₹66 – ₹70 per share',
    min_investment: 14980,
  },
  {
    id: 'issue-5',
    name: 'CleanMax Solar & Wind InvIT Rights Issue',
    ticker: 'CLEANMAX',
    issue_type: 'NFO',
    asset_class: 'reits_invits',
    sector: 'Real Estate / Infrastructure',
    risk_category: 'Very High',
    description: 'Infrastructure investment trust raising capital to acquire operational commercial and industrial renewable power assets with a 5-year lock-in framework.',
    issue_dates: 'Opens 8 Sep 2026',
    price_range: '₹105 per unit',
    min_investment: 25000,
  },
];
