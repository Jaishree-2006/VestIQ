import { describe, it, expect } from 'vitest';
import { computeHealthScore } from './healthScore';
import type { HoldingItem, BehaviorHistory } from '../types';

describe('computeHealthScore Engine', () => {

  // Scenario (a): Well-diversified portfolio with no lock-ins -> Expected to score high
  it('Scenario (a): scores high for a well-diversified portfolio with no lock-ins', () => {
    const holdings: HoldingItem[] = [
      {
        id: 'h1',
        name: 'Reliance Industries Ltd',
        ticker: 'RELIANCE',
        category: 'equities',
        broker: 'Zerodha',
        depository: 'CDSL',
        units: 100,
        avgPrice: 2000,
        currentPrice: 2000,
        currentValue: 200000, // 20%
        portfolioWeight: 20,
        lockInMonths: 0,
        riskCategory: 'Moderate',
        suitabilityScore: 90,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
      {
        id: 'h2',
        name: 'HDFC Bank Ltd',
        ticker: 'HDFCBANK',
        category: 'equities',
        broker: 'Zerodha',
        depository: 'CDSL',
        units: 100,
        avgPrice: 2000,
        currentPrice: 2000,
        currentValue: 200000, // 20%
        portfolioWeight: 20,
        lockInMonths: 0,
        riskCategory: 'Low',
        suitabilityScore: 92,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
      {
        id: 'h3',
        name: 'PFC Corporate Bond 2029',
        ticker: 'PFC2029',
        category: 'bonds',
        broker: 'ICICI Direct',
        depository: 'NSDL',
        units: 300,
        avgPrice: 1000,
        currentPrice: 1000,
        currentValue: 300000, // 30%
        portfolioWeight: 30,
        lockInMonths: 0,
        riskCategory: 'Low',
        suitabilityScore: 95,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
      {
        id: 'h4',
        name: 'Parag Parikh Flexi Cap Fund',
        ticker: 'PPFCF',
        category: 'equities',
        broker: 'CAMS',
        depository: 'CDSL',
        units: 3000,
        avgPrice: 100,
        currentPrice: 100,
        currentValue: 300000, // 30% (mutual_fund)
        portfolioWeight: 30,
        lockInMonths: 0,
        riskCategory: 'Moderate',
        suitabilityScore: 94,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
    ];

    const behavior: BehaviorHistory = { regularContributions: true, noPanicSelling: true };
    const result = computeHealthScore(holdings, behavior);

    // Concentration penalty: PFC (30% -> (30-25)*0.8 = 4), Parag Parikh (30% -> 4) => total -8
    // Liquidity penalty: 0
    // Volatility penalty: Equities + REITs = 20 + 20 + 30 = 70% (exceeds 50% by 20% -> (20*0.5) = 10) => total -10
    // Diversification penalty: 3 distinct asset classes (equity, bond, mutual_fund) => 0
    // Positive behavior bonus: +8
    // Expected score: 100 - 8 - 10 + 8 = 90
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.breakdown.length).toBeGreaterThan(0);
    expect(result.breakdown.some(f => f.factor === 'Positive Behavior Bonus')).toBe(true);
  });

  // Scenario (b): Heavily concentrated portfolio with long lock-ins and low diversification -> Expected to score low
  it('Scenario (b): scores low for a heavily concentrated, illiquid portfolio with poor diversification', () => {
    const holdings: HoldingItem[] = [
      {
        id: 'h1',
        name: 'Grid Infrastructure InvIT',
        ticker: 'GRIDINVIT',
        category: 'reits_invits',
        broker: 'Relationship Manager',
        depository: 'NSDL',
        units: 6000,
        avgPrice: 100,
        currentPrice: 100,
        currentValue: 600000, // 60% of portfolio
        portfolioWeight: 60,
        lockInMonths: 60, // 5-year lock-in (> 4 yrs -> -15 pts)
        liquidity_terms: '5-year lock-in',
        riskCategory: 'High',
        suitabilityScore: 40,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
      {
        id: 'h2',
        name: 'Embassy Office Parks REIT',
        ticker: 'EMBASSY',
        category: 'reits_invits',
        broker: 'Zerodha',
        depository: 'CDSL',
        units: 4000,
        avgPrice: 100,
        currentPrice: 100,
        currentValue: 400000, // 40% of portfolio
        portfolioWeight: 40,
        lockInMonths: 36, // 3-year lock-in (2-4 yrs -> -10 pts)
        liquidity_terms: '3-year lock-in',
        riskCategory: 'Moderate',
        suitabilityScore: 50,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
    ];

    const result = computeHealthScore(holdings); // No behavior history passed

    // Concentration: Grid (60% -> (60-25)*0.8 = 28, max 20), Embassy (40% -> (40-25)*0.8 = 12). Sum = 32, capped at 25 => -25
    // Liquidity Mismatch: Grid (5-yr -> -15), Embassy (3-yr -> -10) => -25
    // Volatility Exposure: 60 + 40 = 100% (exceeds 50% by 50% -> min(15, 50*0.5=25) = 15) => -15
    // Diversification Gap: 2 distinct classes (reit, invit) => -10
    // Total expected score: 100 - 25 - 25 - 15 - 10 = 25
    expect(result.score).toBeLessThanOrEqual(35);
    expect(result.score).toBe(25);
    expect(result.breakdown.find(f => f.factor === 'Concentration Penalty')?.penaltyOrBonus).toBe(-25);
    expect(result.breakdown.find(f => f.factor === 'Liquidity Mismatch Penalty')?.penaltyOrBonus).toBe(-25);
    expect(result.breakdown.find(f => f.factor === 'Volatility Exposure Penalty')?.penaltyOrBonus).toBe(-15);
    expect(result.breakdown.find(f => f.factor === 'Diversification Gap Penalty')?.penaltyOrBonus).toBe(-10);
  });

  // Scenario (c): Empty / edge-case portfolio -> Sensible default with clear "insufficient data" reason
  it('Scenario (c): handles empty or zero-value portfolio gracefully without crashing or returning misleading score', () => {
    const emptyResult = computeHealthScore([]);

    expect(emptyResult.score).toBe(0);
    expect(emptyResult.breakdown.length).toBe(1);
    expect(emptyResult.breakdown[0].factor).toBe('Insufficient Data');
    expect(emptyResult.breakdown[0].reason).toContain('Portfolio is empty');
  });

  it('throws an explicit error when passed invalid input data', () => {
    expect(() => computeHealthScore(null as any)).toThrowError(/Invalid input/);
    expect(() => computeHealthScore(undefined as any)).toThrowError(/Invalid input/);
    expect(() => computeHealthScore({} as any)).toThrowError(/Invalid input/);
  });

  // Test difference on sample CAS portfolios
  it('produces distinct scores for distinct CAS portfolios', () => {
    const portfolioA: HoldingItem[] = [
      { id: '1', name: 'G-Sec Sovereign Bond', ticker: 'GS2034', category: 'bonds', broker: 'RBI', depository: 'NSDL', units: 250, avgPrice: 1000, currentPrice: 1000, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Low', suitabilityScore: 98, causalChain: { cause: '', mechanism: '', impact: '' } },
      { id: '2', name: 'Sovereign Gold Bond', ticker: 'SGB2030', category: 'bonds', broker: 'RBI', depository: 'NSDL', units: 250, avgPrice: 1000, currentPrice: 1000, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Low', suitabilityScore: 98, causalChain: { cause: '', mechanism: '', impact: '' } },
      { id: '3', name: 'Nifty 50 Index Fund', ticker: 'NIFTY50', category: 'equities', broker: 'Zerodha', depository: 'CDSL', units: 1250, avgPrice: 200, currentPrice: 200, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Low', suitabilityScore: 95, causalChain: { cause: '', mechanism: '', impact: '' } },
      { id: '4', name: 'Parag Parikh Flexi Cap Fund', ticker: 'PPFCF', category: 'equities', broker: 'CAMS', depository: 'CDSL', units: 2500, avgPrice: 100, currentPrice: 100, currentValue: 250000, portfolioWeight: 25, lockInMonths: 0, riskCategory: 'Moderate', suitabilityScore: 92, causalChain: { cause: '', mechanism: '', impact: '' } },
    ];

    const portfolioB: HoldingItem[] = [
      { id: '1', name: 'High Risk Single Stock', ticker: 'RISK1', category: 'equities', broker: 'Zerodha', depository: 'CDSL', units: 1000, avgPrice: 1000, currentPrice: 1000, currentValue: 1000000, portfolioWeight: 100, lockInMonths: 0, riskCategory: 'Very High', suitabilityScore: 30, causalChain: { cause: '', mechanism: '', impact: '' } }
    ];

    const scoreA = computeHealthScore(portfolioA).score;
    const scoreB = computeHealthScore(portfolioB).score;

    expect(scoreA).toBeGreaterThanOrEqual(90);
    expect(scoreB).toBeLessThanOrEqual(45);
    expect(scoreA).toBeGreaterThan(scoreB);
    expect(Math.abs(scoreA - scoreB)).toBeGreaterThan(20);
  });

});
