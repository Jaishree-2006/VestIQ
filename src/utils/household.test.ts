import { describe, it, expect } from 'vitest';
import {
  computeCombinedHouseholdSummary,
  type HouseholdLink,
} from './household';
import type { HoldingItem } from '../types';

const myHoldings: HoldingItem[] = [
  {
    id: 'h1',
    name: 'HDFC Bank Ltd',
    ticker: 'HDFCBANK',
    category: 'equities',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 200,
    avgPrice: 1500,
    currentPrice: 1500,
    currentValue: 300000,
    portfolioWeight: 30,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 90,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
  {
    id: 'h2',
    name: '8.15% GOI Sovereign Bond',
    ticker: 'GBOND',
    category: 'bonds',
    broker: 'RBI',
    depository: 'CDSL',
    units: 20,
    avgPrice: 10000,
    currentPrice: 10000,
    currentValue: 200000,
    portfolioWeight: 20,
    lockInMonths: 0,
    riskCategory: 'Low',
    suitabilityScore: 95,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
  {
    id: 'h3',
    name: 'Mindspace Business Parks REIT',
    ticker: 'MINDSPACE',
    category: 'reits_invits',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 1000,
    avgPrice: 350,
    currentPrice: 350,
    currentValue: 350000,
    portfolioWeight: 35,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 70,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
];
// My Total Value: 300,000 + 200,000 + 350,000 = 850,000

describe('Household / Family View Logic & Privacy Safeguards', () => {
  it('correctly calculates combined totals and asset allocation percentages', () => {
    const acceptedLink: HouseholdLink = {
      id: 'hh_123',
      user_id_a: 'user_1',
      user_id_b: 'user_2',
      user_a_email: 'rajesh@example.com',
      user_b_email: 'priya@example.com',
      status: 'accepted',
      requested_by: 'user_1',
      requested_at: '2026-08-20T10:00:00Z',
      accepted_at: '2026-08-21T10:00:00Z',
      share_holdings_a: false,
      share_holdings_b: false,
      partner_name: 'Priya Sharma',
      partner_total_value: 1150000,
      partner_equities: 700000,
      partner_bonds: 300000,
      partner_reits: 150000,
      partner_cash: 0,
    };

    const summary = computeCombinedHouseholdSummary(myHoldings, acceptedLink);

    // My portfolio checks
    expect(summary.myTotalValue).toBe(850000);
    expect(summary.myEquities).toBe(300000);
    expect(summary.myBonds).toBe(200000);
    expect(summary.myReits).toBe(350000);

    // Combined checks: 850k + 1.15M = 2,000,000
    expect(summary.combinedTotalValue).toBe(2000000);
    // Equities: 300k + 700k = 1,000,000 (50.0%)
    expect(summary.combinedEquities).toBe(1000000);
    expect(summary.equitiesPct).toBe(50.0);
    // Bonds: 200k + 300k = 500,000 (25.0%)
    expect(summary.combinedBonds).toBe(500000);
    expect(summary.bondsPct).toBe(25.0);
    // REITs: 350k + 150k = 500,000 (25.0%)
    expect(summary.combinedReits).toBe(500000);
    expect(summary.reitsPct).toBe(25.0);
  });

  it('strictly protects holding-level privacy unless BOTH parties consent', () => {
    // Neither consented
    const linkNoConsent: HouseholdLink = {
      id: 'hh_456',
      user_id_a: 'user_1',
      user_id_b: 'user_2',
      user_a_email: 'rajesh@example.com',
      user_b_email: 'priya@example.com',
      status: 'accepted',
      requested_by: 'user_1',
      requested_at: '2026-08-20T10:00:00Z',
      accepted_at: '2026-08-21T10:00:00Z',
      share_holdings_a: false,
      share_holdings_b: false,
    };
    expect(computeCombinedHouseholdSummary(myHoldings, linkNoConsent).canViewPartnerHoldings).toBe(false);

    // Only User A consented
    const linkOneConsent: HouseholdLink = {
      ...linkNoConsent,
      share_holdings_a: true,
      share_holdings_b: false,
    };
    expect(computeCombinedHouseholdSummary(myHoldings, linkOneConsent).canViewPartnerHoldings).toBe(false);

    // Both User A and User B consented
    const linkBothConsent: HouseholdLink = {
      ...linkNoConsent,
      share_holdings_a: true,
      share_holdings_b: true,
    };
    expect(computeCombinedHouseholdSummary(myHoldings, linkBothConsent).canViewPartnerHoldings).toBe(true);
  });
});
