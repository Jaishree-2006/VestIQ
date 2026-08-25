import type { HoldingItem, RedFlagAlert } from '../types';
import { SEBI_RISK_RANKS, HOLDING_RISK_RANKS, type SebiRiskCategory } from './riskProfiler';

export function normalizeRedFlagStatus(flag?: Partial<RedFlagAlert>): 'active' | 'resolved' | 'acknowledged' {
  const status = flag?.status;
  if (status === 'resolved' || status === 'acknowledged') return status;
  return 'active';
}

export function calculateLiquidBuffer(holdings: HoldingItem[]): number {
  if (!Array.isArray(holdings)) return 0;
  return holdings
    .filter((h) => {
      if (h.category === 'cash') return true;
      const isLiquidNaming = /liquid|overnight|money market|savings|treasury bill|t-bill|cash/i.test(h.name) ||
        /liquid|overnight|cash/i.test(h.ticker);
      // Mutual funds / bonds with short-duration/liquid naming and 0 lock-in
      if ((h.category === 'equities' || h.category === 'bonds') && (!h.lockInMonths || h.lockInMonths === 0) && isLiquidNaming) {
        return true;
      }
      return false;
    })
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
}

export function deriveRedFlagsFromHoldings(
  holdings: HoldingItem[],
  userRiskCategory: SebiRiskCategory = 'Moderate',
  monthlyExpenses?: number | null
): RedFlagAlert[] {
  if (!Array.isArray(holdings) || holdings.length === 0) return [];

  const totalValue = holdings.reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
  if (!totalValue) return [];

  const flags = new Map<string, RedFlagAlert>();

  // Emergency Fund Adequacy Check (only if monthlyExpenses is provided and > 0)
  if (typeof monthlyExpenses === 'number' && monthlyExpenses > 0) {
    const liquidBuffer = calculateLiquidBuffer(holdings);
    const targetBuffer = 3 * monthlyExpenses;
    if (liquidBuffer < targetBuffer) {
      const monthsCovered = (liquidBuffer / monthlyExpenses).toFixed(1);
      const illiquidHolding = holdings.find((h) => h.lockInMonths && h.lockInMonths > 0) ||
        holdings.find((h) => h.category === 'reits_invits' || /REIT|InvIT/i.test(h.name));
      const illiquidRef = illiquidHolding ? ` like your ${illiquidHolding.name}` : '';

      flags.set('emergency-fund-adequacy', {
        id: 'auto-emergency-fund-adequacy',
        holdingId: 'portfolio',
        holdingName: 'Emergency Fund & Liquid Buffer',
        title: 'Liquid buffer below 3-month emergency threshold',
        severity: Number(monthsCovered) < 1.0 ? 'high' : 'medium',
        category: 'liquidity_mismatch',
        description: `Your liquid buffer covers ~${monthsCovered} months of expenses (₹${Math.round(liquidBuffer).toLocaleString('en-IN')}) against your estimated monthly expense of ₹${Math.round(monthlyExpenses).toLocaleString('en-IN')}, which is below the 3-month safety threshold. Consider this before committing further funds to illiquid instruments${illiquidRef}.`,
        suggestedAction: 'Establish an emergency buffer covering at least 3 to 6 months of mandatory living expenses in high-liquidity instruments (e.g. liquid mutual funds or sweep-in deposits) before committing additional capital to lock-in products.',
        sebiRuleRef: 'SEBI emergency liquidity buffer and financial suitability guidance',
        status: 'active',
      });
    }
  }

  const reitInvitValue = holdings
    .filter((holding) => holding.category === 'reits_invits' || /REIT|InvIT/i.test(holding.name) || /REIT|InvIT/i.test(holding.ticker))
    .reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);

  if (reitInvitValue / totalValue >= 0.35) {
    const severity: RedFlagAlert['severity'] = reitInvitValue / totalValue >= 0.5 ? 'high' : 'medium';
    flags.set('reit-concentration', {
      id: 'auto-reit-concentration',
      holdingId: 'portfolio',
      holdingName: 'Portfolio REIT/InvIT Exposure',
      title: 'REIT / InvIT concentration beyond comfort threshold',
      severity,
      category: 'concentration_risk',
      description: `Combined REIT and InvIT exposure is ${(reitInvitValue / totalValue * 100).toFixed(1)}% of the portfolio, which is above the recommended ceiling for a ${userRiskCategory.toLowerCase()} risk profile.`,
      suggestedAction: 'Rebalance a portion of the REIT / InvIT allocation into liquid sovereign debt or diversified equity funds to restore liquidity and reduce rate sensitivity.',
      sebiRuleRef: 'SEBI alternate-asset concentration and suitability guidance',
      status: 'active',
    });
  }

  const userRank = SEBI_RISK_RANKS[userRiskCategory] || 3;

  holdings.forEach((holding) => {
    const holdingWeight = ((Number(holding.currentValue) || 0) / totalValue) * 100;
    const lockInMonths = Number(holding.lockInMonths) || 0;

    if (holdingWeight > 25) {
      flags.set(`concentration-${holding.id}`, {
        id: `auto-concentration-${holding.id}`,
        holdingId: holding.id,
        holdingName: holding.name,
        title: 'Single holding concentration exceeds prudent limit',
        severity: holdingWeight > 35 ? 'high' : 'medium',
        category: 'concentration_risk',
        description: `${holding.name} represents ${holdingWeight.toFixed(1)}% of the portfolio, above a prudent single-asset concentration ceiling for most retail investors.`,
        suggestedAction: 'Reduce exposure in this holding and diversify into lower-correlation assets that better match the stated investment horizon.',
        sebiRuleRef: 'SEBI concentration and suitability guidance',
        status: 'active',
      });
    }

    if (lockInMonths >= 24 && holdingWeight >= 10) {
      flags.set(`liquidity-${holding.id}`, {
        id: `auto-liquidity-${holding.id}`,
        holdingId: holding.id,
        holdingName: holding.name,
        title: 'Lock-in period may mismatch your liquidity horizon',
        severity: lockInMonths >= 36 ? 'high' : 'medium',
        category: 'liquidity_mismatch',
        description: `${holding.name} is locked in for ${lockInMonths} months while the portfolio may require liquidity sooner.`,
        suggestedAction: 'Confirm the intended liquidity window and consider reallocating a portion of this capital into liquid debt or cash equivalents.',
        sebiRuleRef: 'SEBI product suitability and investor horizon guidance',
        status: 'active',
      });
    }

    // Product Risk Level Mismatch Check against User Risk Category
    const rawHoldingRisk = holding.riskCategory || 'Moderate';
    const holdingRank = HOLDING_RISK_RANKS[rawHoldingRisk] || (holding.category === 'reits_invits' ? 5 : 3);

    if (holdingRank > userRank) {
      const rankGap = holdingRank - userRank;
      const severity: RedFlagAlert['severity'] = rankGap >= 2 ? 'high' : 'medium';
      flags.set(`suitability-risk-${holding.id}`, {
        id: `auto-suitability-risk-${holding.id}`,
        holdingId: holding.id,
        holdingName: holding.name,
        title: `Risk profile mismatch on ${holding.name}`,
        severity,
        category: 'suitability',
        description: `Your risk profile is ${userRiskCategory}, but this instrument is categorized ${rawHoldingRisk} — here's why that's a mismatch: your profiled risk tolerance cannot absorb the price volatility and loss potential associated with ${rawHoldingRisk.toLowerCase()}-risk assets like ${holding.name}.`,
        suggestedAction: `Review whether this high-risk instrument aligns with your ${userRiskCategory.toLowerCase()} risk profile, and consider reallocating into lower-volatility capital preservation options.`,
        sebiRuleRef: 'SEBI Riskometer alignment and product suitability guidance',
        status: 'active',
      });
    }
  });

  return Array.from(flags.values());
}

