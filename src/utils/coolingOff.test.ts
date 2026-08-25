import { describe, it, expect } from 'vitest';
import { evaluateCoolingOffTrigger } from './coolingOff';
import type { HoldingItem, HealthScoreEvent } from '../types';

const baseHolding: HoldingItem = {
  id: 'h3',
  name: 'HDFC Bank Ltd',
  ticker: 'HDFCBANK',
  category: 'equities',
  broker: 'Zerodha',
  depository: 'CDSL',
  units: 250,
  avgPrice: 1540,
  currentPrice: 1680,
  currentValue: 420000,
  portfolioWeight: 22.8,
  lockInMonths: 0,
  riskCategory: 'Moderate',
  suitabilityScore: 92,
  causalChain: { cause: 'Banking', mechanism: 'NIM', impact: 'Stable' },
};

const noRecentEvents: HealthScoreEvent[] = [];

describe('Cooling-Off Nudge Evaluation', () => {
  it('does NOT trigger for a small -10% reduction', () => {
    const nextValue = Math.round(420000 * 0.9); // 378000 — only 10% drop
    const result = evaluateCoolingOffTrigger(baseHolding, nextValue, noRecentEvents);
    expect(result.triggered).toBe(false);
  });

  it('does NOT trigger for a +10% increase', () => {
    const nextValue = Math.round(420000 * 1.1);
    const result = evaluateCoolingOffTrigger(baseHolding, nextValue, noRecentEvents);
    expect(result.triggered).toBe(false);
  });

  it('triggers on a -30% large sell (exceeds 25% threshold)', () => {
    const nextValue = Math.round(420000 * 0.7); // 294000 — 30% drop
    const result = evaluateCoolingOffTrigger(baseHolding, nextValue, noRecentEvents);
    expect(result.triggered).toBe(true);
    expect(result.triggerType).toBe('large_sell');
    expect(result.title).toContain('Significant Position Reduction');
    expect(result.causalChain.longTermOutcome).toContain('lock in');
  });

  it('triggers on a -50% large sell', () => {
    const nextValue = Math.round(420000 * 0.5);
    const result = evaluateCoolingOffTrigger(baseHolding, nextValue, noRecentEvents);
    expect(result.triggered).toBe(true);
    expect(result.triggerType).toBe('large_sell');
  });

  it('triggers on a sell following a recent sharp score drop (within 7 days)', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const recentDropEvents: HealthScoreEvent[] = [
      {
        id: 'hse-recent',
        userId: 'user_1',
        timestamp: threeDaysAgo,
        previousScore: 78,
        newScore: 64,
        delta: -14,
        triggerType: 'new_holding',
        reasonObject: {
          factor: 'Concentration Risk',
          penaltyOrBonus: -14,
          reason: 'Sharp portfolio score drop due to new REIT concentration',
        },
      },
    ];

    const nextValue = Math.round(420000 * 0.85); // -15% (below 25% threshold but drop + recent event)
    const result = evaluateCoolingOffTrigger(baseHolding, nextValue, recentDropEvents, now);
    expect(result.triggered).toBe(true);
    expect(result.triggerType).toBe('recent_score_drop');
    expect(result.title).toContain('Recent Portfolio Stress');
  });

  it('does NOT trigger on sell with score drop older than 7 days', () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const oldDropEvents: HealthScoreEvent[] = [
      {
        id: 'hse-old',
        userId: 'user_1',
        timestamp: tenDaysAgo,
        previousScore: 78,
        newScore: 62,
        delta: -16,
        triggerType: 'new_holding',
        reasonObject: {
          factor: 'Old Risk',
          penaltyOrBonus: -16,
          reason: 'Old drop not within 7 day window',
        },
      },
    ];

    const nextValue = Math.round(420000 * 0.85); // -15%, no large-sell trigger
    const result = evaluateCoolingOffTrigger(baseHolding, nextValue, oldDropEvents, now);
    expect(result.triggered).toBe(false);
  });
});
