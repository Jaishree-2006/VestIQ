import { describe, it, expect } from 'vitest';
import { getUpcomingPayouts } from './incomeCalendar';
import type { HoldingItem } from '../types';

describe('Dividend & Coupon Income Calendar Engine', () => {
  const sampleHoldingsWithPayouts: HoldingItem[] = [
    {
      id: 'h-reit',
      name: 'Embassy Office Parks REIT',
      ticker: 'EMBASSY',
      category: 'reits_invits',
      broker: 'Zerodha',
      depository: 'CDSL',
      units: 800,
      avgPrice: 340,
      currentPrice: 340,
      currentValue: 272000,
      portfolioWeight: 25,
      lockInMonths: 0,
      riskCategory: 'Moderate',
      suitabilityScore: 80,
      payout_type: 'distribution',
      next_payout_date: '2026-09-15',
      estimated_payout_amount: 4692,
      causalChain: { cause: '', mechanism: '', impact: '' },
    },
    {
      id: 'h-bond',
      name: 'PFC 7.35% NCD 2029',
      ticker: 'PFC2029',
      category: 'bonds',
      broker: 'ICICI Direct',
      depository: 'NSDL',
      units: 300,
      avgPrice: 1000,
      currentPrice: 1033.33,
      currentValue: 310000,
      portfolioWeight: 30,
      lockInMonths: 36,
      riskCategory: 'Low',
      suitabilityScore: 90,
      payout_type: 'coupon',
      next_payout_date: '2026-09-05',
      estimated_payout_amount: 5696,
      causalChain: { cause: '', mechanism: '', impact: '' },
    },
    {
      id: 'h-invit',
      name: 'Grid Infrastructure InvIT',
      ticker: 'GRIDINVIT',
      category: 'reits_invits',
      broker: 'Relationship Manager - ICICI',
      depository: 'NSDL',
      units: 4400,
      avgPrice: 100,
      currentPrice: 100.14,
      currentValue: 440600,
      portfolioWeight: 40,
      lockInMonths: 36,
      riskCategory: 'High',
      suitabilityScore: 42,
      payout_type: 'distribution',
      next_payout_date: '2026-10-10',
      estimated_payout_amount: 12557,
      causalChain: { cause: '', mechanism: '', impact: '' },
    },
    {
      id: 'h-equity-nodiv',
      name: 'Infosys Ltd',
      ticker: 'INFY',
      category: 'equities',
      broker: 'Zerodha',
      depository: 'CDSL',
      units: 100,
      avgPrice: 1500,
      currentPrice: 1500,
      currentValue: 150000,
      portfolioWeight: 5,
      lockInMonths: 0,
      riskCategory: 'Moderate',
      suitabilityScore: 85,
      payout_type: null,
      next_payout_date: null,
      estimated_payout_amount: null,
      causalChain: { cause: '', mechanism: '', impact: '' },
    },
  ];

  it('correctly extracts and sorts upcoming payouts chronologically by date', () => {
    const fixedNow = new Date('2026-08-25T00:00:00Z');
    const payouts = getUpcomingPayouts(sampleHoldingsWithPayouts, 5, fixedNow);

    expect(payouts.length).toBe(3);

    // 1st: PFC NCD coupon on 2026-09-05 (soonest)
    expect(payouts[0].holdingName).toBe('PFC 7.35% NCD 2029');
    expect(payouts[0].payoutType).toBe('coupon');
    expect(payouts[0].estimatedAmount).toBe(5696);
    expect(payouts[0].payoutDate).toBe('2026-09-05');
    expect(payouts[0].daysRemaining).toBe(11);

    // 2nd: Embassy REIT distribution on 2026-09-15
    expect(payouts[1].holdingName).toBe('Embassy Office Parks REIT');
    expect(payouts[1].payoutType).toBe('distribution');
    expect(payouts[1].estimatedAmount).toBe(4692);
    expect(payouts[1].payoutDate).toBe('2026-09-15');
    expect(payouts[1].daysRemaining).toBe(21);

    // 3rd: Grid InvIT distribution on 2026-10-10
    expect(payouts[2].holdingName).toBe('Grid Infrastructure InvIT');
    expect(payouts[2].payoutType).toBe('distribution');
    expect(payouts[2].estimatedAmount).toBe(12557);
    expect(payouts[2].payoutDate).toBe('2026-10-10');
    expect(payouts[2].daysRemaining).toBe(46);
  });

  it('returns an empty array when holdings have no upcoming payout data', () => {
    const holdingsNoPayout: HoldingItem[] = [
      {
        id: 'h1',
        name: 'Growth Stock 1',
        ticker: 'GROW1',
        category: 'equities',
        broker: 'Zerodha',
        depository: 'CDSL',
        units: 10,
        avgPrice: 100,
        currentPrice: 100,
        currentValue: 1000,
        portfolioWeight: 100,
        lockInMonths: 0,
        riskCategory: 'High',
        suitabilityScore: 80,
        causalChain: { cause: '', mechanism: '', impact: '' },
      },
    ];

    const payouts = getUpcomingPayouts(holdingsNoPayout);
    expect(payouts).toEqual([]);
  });

  it('handles empty holdings array or null/undefined gracefully', () => {
    expect(getUpcomingPayouts([])).toEqual([]);
    expect(getUpcomingPayouts(null as any)).toEqual([]);
  });
});
