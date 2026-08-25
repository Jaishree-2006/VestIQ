import { describe, it, expect } from 'vitest';
import { calculateRiskCategory, SEBI_RISK_QUESTIONS } from './riskProfiler';
import { deriveRedFlagsFromHoldings } from './redFlags';
import type { HoldingItem } from '../types';

describe('SEBI Riskometer Risk Profiler & Suitability Engine', () => {
  it('correctly maps conservative questionnaire responses to "Low" risk category', () => {
    const conservativeAnswers = {
      horizon: 1, // Short-term
      income: 1,  // Variable income
      experience: 1, // None
      reaction: 1, // Panic & exit
      liquidity: 1, // High liquidity
    };

    const category = calculateRiskCategory(conservativeAnswers);
    expect(category).toBe('Low');
  });

  it('correctly maps aggressive questionnaire responses to "Very High" risk category', () => {
    const aggressiveAnswers = {
      horizon: 4, // Long-term
      income: 4,  // High surplus income
      experience: 4, // Extensive
      reaction: 4, // Buy more
      liquidity: 4, // Very low liquidity need
    };

    const category = calculateRiskCategory(aggressiveAnswers);
    expect(category).toBe('Very High');
  });

  it('triggers a suitability risk mismatch flag for a Low risk investor holding Grid InvIT (High risk)', () => {
    const sampleHoldings: HoldingItem[] = [
      {
        id: 'h2',
        name: 'PowerGrid Infrastructure Investment Trust (Grid InvIT)',
        ticker: 'PGINVIT',
        isin: 'INE081U23015',
        category: 'reits_invits',
        broker: 'Groww',
        depository: 'NSDL',
        units: 1000,
        avgPrice: 98,
        currentPrice: 97.50,
        currentValue: 97500,
        portfolioWeight: 100,
        lockInMonths: 36,
        riskCategory: 'High',
        suitabilityScore: 45,
        causalChain: {
          cause: 'Mandatory 3-year lock-in period',
          mechanism: 'Stated liquidity horizon is 18 months',
          impact: 'High risk of forced secondary market liquidation penalty',
        },
      },
    ];

    const redFlags = deriveRedFlagsFromHoldings(sampleHoldings, 'Low');
    const suitabilityFlag = redFlags.find((f) => f.category === 'suitability');

    expect(suitabilityFlag).toBeDefined();
    expect(suitabilityFlag?.title).toContain('Risk profile mismatch');
    expect(suitabilityFlag?.severity).toBe('high');
    expect(suitabilityFlag?.description).toContain('Your risk profile is Low, but this instrument is categorized High');
    expect(suitabilityFlag?.description).toContain('here\'s why that\'s a mismatch');
  });

  it('does NOT trigger a risk mismatch flag when holding risk aligns with user profile', () => {
    const lowRiskHoldings: HoldingItem[] = [
      {
        id: 'gsec1',
        name: 'G-Sec 7.26% 2033 Sovereign Bond',
        ticker: 'GSEC2033',
        isin: 'IN0020230018',
        category: 'bonds',
        broker: 'RBI Retail Direct',
        depository: 'CDSL',
        units: 100,
        avgPrice: 1000,
        currentPrice: 1000,
        currentValue: 100000,
        portfolioWeight: 100,
        lockInMonths: 0,
        riskCategory: 'Low',
        suitabilityScore: 95,
        causalChain: {
          cause: 'Sovereign guarantee',
          mechanism: 'Low credit risk',
          impact: 'Capital preservation',
        },
      },
    ];

    const redFlags = deriveRedFlagsFromHoldings(lowRiskHoldings, 'Low');
    const suitabilityFlag = redFlags.find((f) => f.category === 'suitability');

    expect(suitabilityFlag).toBeUndefined();
  });
});
