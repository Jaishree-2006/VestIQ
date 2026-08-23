import { describe, it, expect } from 'vitest';
import { scanPortfolioForEvents, SEED_NEWS_EVENTS } from './portfolioGuardianEngine';
import type { HoldingItem } from '../types';

describe('portfolioGuardianEngine Relevance Scan', () => {
  const sampleHoldings: HoldingItem[] = [
    {
      id: 'h1',
      name: 'Embassy Office Parks REIT',
      ticker: 'EMBASSY',
      category: 'reits_invits',
      broker: 'Zerodha',
      depository: 'CDSL',
      units: 800,
      avgPrice: 340,
      currentPrice: 340,
      currentValue: 272000,
      portfolioWeight: 30,
      lockInMonths: 0,
      riskCategory: 'Moderate',
      suitabilityScore: 78,
      causalChain: { cause: '', mechanism: '', impact: '' }
    },
    {
      id: 'h2',
      name: 'Grid Infrastructure InvIT',
      ticker: 'GRIDINVIT',
      category: 'reits_invits',
      broker: 'Relationship Manager',
      depository: 'NSDL',
      units: 4400,
      avgPrice: 100,
      currentPrice: 100,
      currentValue: 440600,
      portfolioWeight: 45,
      lockInMonths: 36,
      riskCategory: 'High',
      suitabilityScore: 42,
      causalChain: { cause: '', mechanism: '', impact: '' }
    },
    {
      id: 'h3',
      name: 'Infosys Ltd',
      ticker: 'INFY',
      category: 'equities',
      broker: 'Zerodha',
      depository: 'CDSL',
      units: 150,
      avgPrice: 1290,
      currentPrice: 1237,
      currentValue: 185600,
      portfolioWeight: 25,
      lockInMonths: 0,
      riskCategory: 'Moderate',
      suitabilityScore: 84,
      causalChain: { cause: '', mechanism: '', impact: '' }
    }
  ];

  it('filters out irrelevant news (wheat harvest) while retaining relevant market events', () => {
    const result = scanPortfolioForEvents(sampleHoldings, SEED_NEWS_EVENTS);

    expect(result.scannedCount).toBe(4);
    expect(result.filteredOutCount).toBe(1); // Wheat harvest control story filtered out
    expect(result.alerts.length).toBe(3);
  });

  it('generates structured causal chains and identifies relevant holdings correctly', () => {
    const result = scanPortfolioForEvents(sampleHoldings, SEED_NEWS_EVENTS);

    const rbiAlert = result.alerts.find(a => a.newsHeadline.includes('Repo Rate'));
    expect(rbiAlert).toBeDefined();
    expect(rbiAlert?.severity).toBe('high');
    expect(rbiAlert?.reasoningChain.cause).toContain('repo rate');
    expect(rbiAlert?.relevantHoldings.length).toBeGreaterThan(0);
    expect(rbiAlert?.relevantHoldings.some(h => h.ticker === 'EMBASSY')).toBe(true);
  });

  it('returns 0 alerts for an empty portfolio and never fabricates a synthetic scan result', () => {
    const result = scanPortfolioForEvents([], SEED_NEWS_EVENTS);
    expect(result.alerts.length).toBe(0);
    expect(result.filteredOutCount).toBe(0);
    expect(result.scannedCount).toBe(0);
  });
});
