import { describe, it, expect } from 'vitest';
import type { HoldingItem } from '../types';

export function calculateAnnualExpenseRupees(holding: HoldingItem): number {
  if (!holding.expense_ratio_pct || !holding.currentValue) return 0;
  return Math.round((holding.expense_ratio_pct / 100) * holding.currentValue);
}

export function calculatePassiveIndexSavingsRupees(holding: HoldingItem, benchmarkPct = 0.3): number {
  if (!holding.expense_ratio_pct || holding.expense_ratio_pct <= benchmarkPct || !holding.currentValue) return 0;
  const currentCost = (holding.expense_ratio_pct / 100) * holding.currentValue;
  const benchmarkCost = (benchmarkPct / 100) * holding.currentValue;
  return Math.round(currentCost - benchmarkCost);
}

describe('Hidden Cost X-Ray Calculations', () => {
  it('correctly calculates annual rupee cost for 2.1% expense ratio on ₹2,00,000 holding (₹4,200/year)', () => {
    const sampleHolding: HoldingItem = {
      id: 'h6',
      name: 'Parag Parikh Flexi Cap Direct Fund',
      ticker: 'PPFCF',
      category: 'equities',
      broker: 'CAMS',
      depository: 'CDSL',
      units: 2500,
      avgPrice: 80,
      currentPrice: 80,
      currentValue: 200000,
      portfolioWeight: 10,
      lockInMonths: 0,
      riskCategory: 'Very High',
      suitabilityScore: 85,
      expense_ratio_pct: 2.1,
      causalChain: { cause: 'Active equity', mechanism: 'TER drag', impact: 'Annual fee' },
    };

    const annualCost = calculateAnnualExpenseRupees(sampleHolding);
    expect(annualCost).toBe(4200);
  });

  it('correctly calculates fee drag delta vs 0.3% index fund benchmark (₹3,600/year difference)', () => {
    const sampleHolding: HoldingItem = {
      id: 'h6',
      name: 'Parag Parikh Flexi Cap Direct Fund',
      ticker: 'PPFCF',
      category: 'equities',
      broker: 'CAMS',
      depository: 'CDSL',
      units: 2500,
      avgPrice: 80,
      currentPrice: 80,
      currentValue: 200000,
      portfolioWeight: 10,
      lockInMonths: 0,
      riskCategory: 'Very High',
      suitabilityScore: 85,
      expense_ratio_pct: 2.1,
      causalChain: { cause: 'Active equity', mechanism: 'TER drag', impact: 'Annual fee' },
    };

    const savings = calculatePassiveIndexSavingsRupees(sampleHolding, 0.3);
    expect(savings).toBe(3600);
  });

  it('returns 0 savings if expense ratio is below or equal to benchmark', () => {
    const indexFundHolding: HoldingItem = {
      id: 'nifty50',
      name: 'Nifty 50 Index Direct Fund',
      ticker: 'NIFTY50',
      category: 'equities',
      broker: 'Groww',
      depository: 'CDSL',
      units: 1000,
      avgPrice: 200,
      currentPrice: 200,
      currentValue: 200000,
      portfolioWeight: 10,
      lockInMonths: 0,
      riskCategory: 'Moderate',
      suitabilityScore: 95,
      expense_ratio_pct: 0.2,
      causalChain: { cause: 'Index fund', mechanism: 'Low fee', impact: 'Efficient tracking' },
    };

    const savings = calculatePassiveIndexSavingsRupees(indexFundHolding, 0.3);
    expect(savings).toBe(0);
  });
});
