import { describe, it, expect } from 'vitest';
import { deriveRedFlagsFromHoldings, calculateLiquidBuffer } from './redFlags';
import type { HoldingItem } from '../types';

const sampleHoldingsWithIlliquid: HoldingItem[] = [
  {
    id: 'h1',
    name: 'Mindspace Business Parks REIT',
    ticker: 'MINDSPACE',
    category: 'reits_invits',
    broker: 'Zerodha',
    depository: 'CDSL',
    units: 2100,
    avgPrice: 320,
    currentPrice: 350,
    currentValue: 735000,
    portfolioWeight: 50,
    lockInMonths: 0,
    riskCategory: 'Moderate',
    suitabilityScore: 70,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
  {
    id: 'h2',
    name: 'PowerGrid Infrastructure Investment Trust (Grid InvIT)',
    ticker: 'PGINVIT',
    category: 'reits_invits',
    broker: 'Groww',
    depository: 'NSDL',
    units: 1000,
    avgPrice: 100,
    currentPrice: 100,
    currentValue: 100000,
    portfolioWeight: 10,
    lockInMonths: 36,
    riskCategory: 'High',
    suitabilityScore: 45,
    causalChain: { cause: '', mechanism: '', impact: '' },
  },
  {
    id: 'h3',
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
];

const sampleLiquidFundHolding: HoldingItem = {
  id: 'h-liq',
  name: 'ICICI Prudential Liquid Fund Direct Growth',
  ticker: 'ICICILIQ',
  category: 'equities', // MFs recorded under equities/cash category in CAS
  broker: 'CAMS',
  depository: 'CDSL',
  units: 1000,
  avgPrice: 100,
  currentPrice: 100,
  currentValue: 100000,
  portfolioWeight: 10,
  lockInMonths: 0,
  riskCategory: 'Low',
  suitabilityScore: 98,
  causalChain: { cause: '', mechanism: '', impact: '' },
};

describe('Emergency Fund Adequacy Check', () => {
  it('calculateLiquidBuffer accurately identifies liquid funds and cash equivalents', () => {
    const portfolio = [...sampleHoldingsWithIlliquid, sampleLiquidFundHolding];
    const buffer = calculateLiquidBuffer(portfolio);
    expect(buffer).toBe(100000);
  });

  it('does NOT generate emergency fund flag if monthly_expenses_estimate is null or undefined', () => {
    const flagsNull = deriveRedFlagsFromHoldings(sampleHoldingsWithIlliquid, 'Moderate', null);
    const emergencyFlagNull = flagsNull.find((f) => f.id === 'auto-emergency-fund-adequacy');
    expect(emergencyFlagNull).toBeUndefined();

    const flagsUndefined = deriveRedFlagsFromHoldings(sampleHoldingsWithIlliquid, 'Moderate', undefined);
    const emergencyFlagUndefined = flagsUndefined.find((f) => f.id === 'auto-emergency-fund-adequacy');
    expect(emergencyFlagUndefined).toBeUndefined();
  });

  it('generates a red flag when liquid buffer is below 3x monthly expenses', () => {
    // Liquid buffer = 90,000 (from liquid fund), monthly expenses = 50,000 (target = 150,000)
    const liquidFund90k: HoldingItem = {
      ...sampleLiquidFundHolding,
      currentValue: 90000,
    };
    const portfolio = [...sampleHoldingsWithIlliquid, liquidFund90k];
    const flags = deriveRedFlagsFromHoldings(portfolio, 'Moderate', 50000);
    const emergencyFlag = flags.find((f) => f.id === 'auto-emergency-fund-adequacy');

    expect(emergencyFlag).toBeDefined();
    expect(emergencyFlag?.category).toBe('liquidity_mismatch');
    expect(emergencyFlag?.title).toContain('Liquid buffer below 3-month emergency threshold');
    // 90,000 / 50,000 = 1.8 months
    expect(emergencyFlag?.description).toContain('covers ~1.8 months of expenses');
    expect(emergencyFlag?.description).toContain('below the 3-month safety threshold');
    expect(emergencyFlag?.description).toContain('Grid InvIT');
  });

  it('generates high severity flag when liquid buffer covers less than 1 month of expenses', () => {
    // 0 liquid buffer with 50,000 monthly expenses
    const flags = deriveRedFlagsFromHoldings(sampleHoldingsWithIlliquid, 'Moderate', 50000);
    const emergencyFlag = flags.find((f) => f.id === 'auto-emergency-fund-adequacy');

    expect(emergencyFlag).toBeDefined();
    expect(emergencyFlag?.severity).toBe('high');
    expect(emergencyFlag?.description).toContain('covers ~0.0 months of expenses');
  });

  it('does NOT generate emergency fund flag when liquid buffer exceeds 3x monthly expenses', () => {
    // Liquid buffer = 200,000, monthly expenses = 50,000 (target = 150,000)
    const liquidFund200k: HoldingItem = {
      ...sampleLiquidFundHolding,
      currentValue: 200000,
    };
    const portfolio = [...sampleHoldingsWithIlliquid, liquidFund200k];
    const flags = deriveRedFlagsFromHoldings(portfolio, 'Moderate', 50000);
    const emergencyFlag = flags.find((f) => f.id === 'auto-emergency-fund-adequacy');

    expect(emergencyFlag).toBeUndefined();
  });
});
