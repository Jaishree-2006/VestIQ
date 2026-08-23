import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeHealthScore,
  invalidateScoringThresholdsCache,
  DEFAULT_THRESHOLDS,
} from './healthScoreEngine.js';

// Balanced, well-diversified portfolio — no holding exceeds 25%
const BALANCED_HOLDINGS = [
  { id: '1', name: 'G-Sec Sovereign Bond', ticker: 'GS2034', category: 'bonds', broker: 'RBI', depository: 'NSDL', units: 250, avgPrice: 1000, currentPrice: 1000, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Low', suitabilityScore: 98, causalChain: { cause: '', mechanism: '', impact: '' } },
  { id: '2', name: 'Sovereign Gold Bond', ticker: 'SGB2030', category: 'bonds', broker: 'RBI', depository: 'NSDL', units: 250, avgPrice: 1000, currentPrice: 1000, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Low', suitabilityScore: 98, causalChain: { cause: '', mechanism: '', impact: '' } },
  { id: '3', name: 'Nifty 50 Index Fund', ticker: 'NIFTY50', category: 'equities', broker: 'Zerodha', depository: 'CDSL', units: 1250, avgPrice: 200, currentPrice: 200, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Low', suitabilityScore: 95, causalChain: { cause: '', mechanism: '', impact: '' } },
  { id: '4', name: 'Parag Parikh Flexi Cap Fund', ticker: 'PPFCF', category: 'equities', broker: 'CAMS', depository: 'CDSL', units: 2500, avgPrice: 100, currentPrice: 100, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Moderate', suitabilityScore: 92, causalChain: { cause: '', mechanism: '', impact: '' } },
];

// Concentrated portfolio: one holding at 28% — above 25% threshold but below 30%
const CONCENTRATED_28_HOLDINGS = [
  { id: '1', name: 'G-Sec Sovereign Bond', ticker: 'GS2034', category: 'bonds', currentValue: 280000 },
  { id: '2', name: 'Sovereign Gold Bond', ticker: 'SGB2030', category: 'bonds', currentValue: 240000 },
  { id: '3', name: 'Nifty 50 Index Fund', ticker: 'NIFTY50', category: 'equities', currentValue: 240000 },
  { id: '4', name: 'Parag Parikh Flexi Cap Fund', ticker: 'PPFCF', category: 'equities', currentValue: 240000 },
];

describe('Server Authoritative HealthScore Engine', () => {
  beforeEach(() => {
    invalidateScoringThresholdsCache();
  });

  it('computes correct score server-side for valid balanced holdings (default thresholds)', () => {
    const result = computeHealthScore(BALANCED_HOLDINGS);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('throws on invalid input', () => {
    expect(() => computeHealthScore(null)).toThrow();
    expect(() => computeHealthScore('not an array')).toThrow();
  });

  it('returns score=0 for empty holdings', () => {
    const result = computeHealthScore([]);
    expect(result.score).toBe(0);
  });

  it('applies concentration penalty when holding exceeds 25% (default threshold)', () => {
    const result = computeHealthScore(CONCENTRATED_28_HOLDINGS);
    const concFactor = result.breakdown.find(f => f.id === 'concentration');
    expect(concFactor).toBeDefined();
    expect(concFactor.penaltyOrBonus).toBeLessThan(0);
  });

  it('does NOT apply concentration penalty when threshold raised to 30%', () => {
    const result = computeHealthScore(
      CONCENTRATED_28_HOLDINGS,
      null,
      { ...DEFAULT_THRESHOLDS, CONCENTRATION_THRESHOLD_PCT: 30 }
    );
    const concFactor = result.breakdown.find(f => f.id === 'concentration');
    expect(concFactor).toBeUndefined();
  });

  it('reflects custom behavior bonus from dynamic threshold', () => {
    const history = { regularContributions: true, noPanicSelling: true };
    const resultDefault = computeHealthScore(BALANCED_HOLDINGS, history);
    const resultCustom = computeHealthScore(
      BALANCED_HOLDINGS,
      history,
      { ...DEFAULT_THRESHOLDS, POSITIVE_BEHAVIOR_BONUS: 15 }
    );
    const bonusDefault = resultDefault.breakdown.find(f => f.id === 'behavior_bonus');
    const bonusCustom = resultCustom.breakdown.find(f => f.id === 'behavior_bonus');
    expect(bonusDefault?.penaltyOrBonus).toBe(8);
    expect(bonusCustom?.penaltyOrBonus).toBe(15);
  });
});
