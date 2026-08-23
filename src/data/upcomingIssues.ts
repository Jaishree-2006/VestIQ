import type { AssetCategory, SebiRiskCategory } from '../types';

export interface UpcomingIssue {
  id: string;
  name: string;
  ticker: string;
  issueType: 'IPO' | 'NFO' | 'FPO';
  assetClass: AssetCategory;
  sector: string;
  riskCategory: SebiRiskCategory;
  lockInMonths: number;
  priceRange: string;
  minInvestment: number;
  biddingDates: string;
  description: string;
  targetUseOfFunds?: string;
}

export const UPCOMING_ISSUES: UpcomingIssue[] = [
  {
    id: 'issue-1',
    name: 'Brookfield Real Estate Income Trust NFO',
    ticker: 'BROOKFIELD-REIT',
    issueType: 'NFO',
    assetClass: 'reits_invits',
    sector: 'Real Estate & REITs',
    riskCategory: 'High',
    lockInMonths: 0,
    priceRange: '₹100 - ₹105',
    minInvestment: 15000,
    biddingDates: 'Sep 10 – Sep 14, 2026',
    description: 'Institutional Grade-A commercial office space portfolio with quarterly rental dividend distributions.',
    targetUseOfFunds: 'Acquisition of 4.2M sq.ft prime commercial office tech parks in Bengaluru & NCR.',
  },
  {
    id: 'issue-2',
    name: 'NTPC Green Energy Ltd IPO',
    ticker: 'NTPCGREEN',
    issueType: 'IPO',
    assetClass: 'equities',
    sector: 'Renewable Energy & Utilities',
    riskCategory: 'Moderate',
    lockInMonths: 0,
    priceRange: '₹102 - ₹108',
    minInvestment: 14850,
    biddingDates: 'Sep 18 – Sep 22, 2026',
    description: 'PSU-backed renewable solar and wind power generation utility with long-term 25-year sovereign-backed PPAs.',
    targetUseOfFunds: 'Debt repayment and capital expenditure for 12 GW operational renewable pipeline expansion.',
  },
  {
    id: 'issue-3',
    name: 'SBI Sovereign Target Maturity G-Sec NFO 2034',
    ticker: 'SBIGSEC2034',
    issueType: 'NFO',
    assetClass: 'bonds',
    sector: 'Government Sovereign Bonds',
    riskCategory: 'Low',
    lockInMonths: 0,
    priceRange: '₹10 NAV Par',
    minInvestment: 5000,
    biddingDates: 'Sep 05 – Sep 19, 2026',
    description: 'Zero-credit risk sovereign debt fund targeting 2034 government security yields with indexation benefits.',
    targetUseOfFunds: '100% allocation into RBI-issued Government of India 2034 benchmark bonds.',
  },
  {
    id: 'issue-4',
    name: 'Swiggy Ltd IPO',
    ticker: 'SWIGGY',
    issueType: 'IPO',
    assetClass: 'equities',
    sector: 'Consumer Tech & Platform',
    riskCategory: 'Very High',
    lockInMonths: 0,
    priceRange: '₹375 - ₹390',
    minInvestment: 14820,
    biddingDates: 'Sep 25 – Sep 29, 2026',
    description: 'Hyperlocal on-demand convenience and quick-commerce platform expanding dark store infrastructure network.',
    targetUseOfFunds: 'Expansion of Instamart dark store footprint and proprietary AI fulfillment logistics technology.',
  },
  {
    id: 'issue-5',
    name: 'Bharat Highways InvIT NFO',
    ticker: 'BHARATHWY',
    issueType: 'NFO',
    assetClass: 'reits_invits',
    sector: 'Infrastructure & InvITs',
    riskCategory: 'High',
    lockInMonths: 36,
    priceRange: '₹98 - ₹100',
    minInvestment: 25000,
    biddingDates: 'Oct 02 – Oct 06, 2026',
    description: 'HAM road asset portfolio offering toll and annuity cash flows with a 3-year mandatory unitholder lock-in window.',
    targetUseOfFunds: 'Repayment of concessionaire debt across 7 National Highway operational stretches.',
  },
  {
    id: 'issue-6',
    name: 'HDFC Corporate Bond Fund NFO (AAA Short Duration)',
    ticker: 'HDFCCORPBOND',
    issueType: 'NFO',
    assetClass: 'bonds',
    sector: 'High-Grade Corporate Debt',
    riskCategory: 'Low to Moderate',
    lockInMonths: 0,
    priceRange: '₹10 NAV Par',
    minInvestment: 5000,
    biddingDates: 'Oct 10 – Oct 20, 2026',
    description: 'High-quality AAA/AA+ rated corporate bond fund with average maturity under 3 years.',
    targetUseOfFunds: 'Investment in banking, PSU, and blue-chip corporate debentures.',
  },
];
