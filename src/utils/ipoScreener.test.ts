import { describe, it, expect } from 'vitest';
import { screenUpcomingIssue } from './ipoScreener';
import { UPCOMING_ISSUES } from '../data/upcomingIssues';
import type { HoldingItem } from '../types';

// Sample concentrated portfolio: 36.8% in REITs/InvITs
const testHoldings: HoldingItem[] = [
  {
    id: 'h1',
    name: 'Mindspace Business Parks REIT',
    ticker: 'MINDSPACE',
    category: 'reits_invits',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 1000,
    avgPrice: 350,
    currentPrice: 350,
    currentValue: 350000, // 350,000 / 950,000 = 36.8%
    portfolioWeight: 36.8,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 70,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
  {
    id: 'h2',
    name: 'Reliance Industries Ltd',
    ticker: 'RELIANCE',
    category: 'equities',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 150,
    avgPrice: 2000,
    currentPrice: 2000,
    currentValue: 300000,
    portfolioWeight: 31.6,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 85,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
  {
    id: 'h3',
    name: '7.18% GS 2033 Sovereign Bond',
    ticker: 'GS2033',
    category: 'bonds',
    broker: 'RBI',
    depository: 'CDSL',
    units: 30,
    avgPrice: 10000,
    currentPrice: 10000,
    currentValue: 300000,
    portfolioWeight: 31.6,
    lockInMonths: 0,
    riskCategory: 'Low',
    suitabilityScore: 95,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
];
// Total portfolio = 950,000. REITs = 350,000 (36.8%), Equities = 300,000 (31.6%), Bonds = 300,000 (31.6%)

describe('IPO/NFO Suitability Screener Engine', () => {
  const reitNfo = UPCOMING_ISSUES.find((i) => i.id === 'issue-1')!; // Nexus Select Commercial REIT NFO (High Risk)
  const bondNfo = UPCOMING_ISSUES.find((i) => i.id === 'issue-2')!; // HDFC Ultra Short Duration Debt NFO (Low to Moderate Risk)

  it('detects concentration warning & causal-chain when user is already concentrated in REITs', () => {
    const result = screenUpcomingIssue(testHoldings, 'Moderate', reitNfo);

    expect(result.isSuitable).toBe(false);
    expect(result.status).toBe('high_risk'); // High risk issue + 36.8% existing concentration
    expect(result.existingWeightPct).toBe(36.8);
    expect(result.causalChain.cause).toContain('36.8% in REIT/InvIT-linked assets');
    expect(result.causalChain.mechanism).toContain('adds further real estate / infrastructure exposure');
    expect(result.causalChain.impact).toContain('consider your existing concentration before applying');
  });

  it('confirms positive suitable status when checking a bond NFO against the same portfolio', () => {
    const result = screenUpcomingIssue(testHoldings, 'Moderate', bondNfo);

    expect(result.isSuitable).toBe(true);
    expect(result.status).toBe('suitable');
    expect(result.existingWeightPct).toBe(31.6);
    expect(result.causalChain.impact).toContain('provides healthy portfolio diversification');
  });

  it('detects risk category mismatch when a Conservative investor checks a Very High risk InvIT', () => {
    const highRiskInvit = UPCOMING_ISSUES.find((i) => i.id === 'issue-5')!; // CleanMax Solar InvIT (Very High)
    const result = screenUpcomingIssue(testHoldings, 'Low', highRiskInvit);

    expect(result.isSuitable).toBe(false);
    expect(result.conflictType).toBe('both'); // 36.8% reit concentration + Low vs Very High
    expect(result.status).toBe('high_risk');
  });
});
