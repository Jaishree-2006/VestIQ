import type { HoldingItem, RedFlagAlert, SebiRiskCategory } from '../types';
import { SEBI_RISK_RANKS } from './riskProfiler';

export function normalizeRedFlagStatus(flag?: Partial<RedFlagAlert>): 'active' | 'resolved' | 'acknowledged' {
  const status = flag?.status;
  if (status === 'resolved' || status === 'acknowledged') return status;
  return 'active';
}

export function deriveRedFlagsFromHoldings(
  holdings: HoldingItem[],
  userRiskCategory: SebiRiskCategory = 'Moderate',
  monthlyExpensesEstimate?: number | null
): RedFlagAlert[] {
  if (!Array.isArray(holdings) || holdings.length === 0) return [];

  const totalValue = holdings.reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
  if (!totalValue) return [];

  const flags = new Map<string, RedFlagAlert>();
  const userRank = SEBI_RISK_RANKS[userRiskCategory] || 3;

  // ── Liquid Buffer Calculation ──
  const liquidBuffer = holdings
    .filter(
      (h) =>
        h.category === 'cash' ||
        /liquid|overnight|money market|savings|treasury/i.test(h.name) ||
        /liquid|cash/i.test(h.ticker)
    )
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  // ── Emergency Fund Adequacy Check (< 3x Monthly Living Expenses) ──
  if (monthlyExpensesEstimate !== null && monthlyExpensesEstimate !== undefined && monthlyExpensesEstimate > 0) {
    const monthsCovered = liquidBuffer / monthlyExpensesEstimate;
    if (monthsCovered < 3.0) {
      const illiquidHoldings = holdings.filter(h => Number(h.lockInMonths) >= 12 || /InvIT|REIT/i.test(h.name));
      const illiquidExample = illiquidHoldings[0]?.name || 'Grid InvIT';
      const severity: RedFlagAlert['severity'] = monthsCovered < 1.5 ? 'high' : 'medium';

      flags.set('emergency-fund-inadequacy', {
        id: 'auto-emergency-fund-inadequacy',
        holdingId: 'portfolio',
        holdingName: 'Emergency Liquid Buffer',
        title: 'Thin Liquid Buffer Ahead of Illiquid Allocations',
        severity,
        category: 'liquidity_mismatch',
        description: `Your liquid buffer covers ~${monthsCovered.toFixed(1)} months of expenses (below the 3-month safety threshold). Consider this before committing further funds to illiquid instruments like your ${illiquidExample}.`,
        suggestedAction: `Maintain at least 3–6 months of living expenses (₹${(monthlyExpensesEstimate * 3).toLocaleString('en-IN')}–₹${(monthlyExpensesEstimate * 6).toLocaleString('en-IN')}) in liquid debt funds or high-yield savings before allocating capital to locked-in assets.`,
        sebiRuleRef: 'SEBI Investor Education & Protection Guidelines on Emergency Buffer & Liquidity Adequacy',
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

  holdings.forEach((holding) => {
    const holdingWeight = ((Number(holding.currentValue) || 0) / totalValue) * 100;
    const lockInMonths = Number(holding.lockInMonths) || 0;
    const holdingRisk = (holding.riskCategory || 'Moderate') as SebiRiskCategory;
    const holdingRank = SEBI_RISK_RANKS[holdingRisk] || 3;

    // ── 1. SEBI Product Risk vs Investor Profile Mismatch ──
    if (holdingRank > userRank) {
      const rankDiff = holdingRank - userRank;
      const severity: RedFlagAlert['severity'] = rankDiff >= 2 ? 'high' : 'medium';
      flags.set(`suitability-mismatch-${holding.id}`, {
        id: `auto-suitability-${holding.id}`,
        holdingId: holding.id,
        holdingName: holding.name,
        title: `Suitability risk mismatch on ${holding.name}`,
        severity,
        category: 'suitability',
        description: `Your assessed SEBI risk profile is ${userRiskCategory}, but ${holding.name} is categorized ${holdingRisk} on the SEBI Riskometer — holding this higher-volatility instrument creates an investor suitability mismatch.`,
        suggestedAction: `Review whether this asset fits your overall financial goals, or consider reallocating to lower-risk instruments matching your ${userRiskCategory} profile (e.g., sovereign debt or balanced hybrid funds).`,
        sebiRuleRef: 'SEBI Master Circular on Product Suitability & Riskometer Alignment',
        status: 'active',
        broker_reg_number: holding.broker_reg_number,
        rm_name: holding.rm_name,
      });
    }

    // ── 2. Single Asset Concentration Risk ──
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
        broker_reg_number: holding.broker_reg_number,
        rm_name: holding.rm_name,
      });
    }

    // ── 3. Horizon Lock-in vs Liquidity Mismatch ──
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
        broker_reg_number: holding.broker_reg_number,
        rm_name: holding.rm_name || (holding.id === 'h2' ? 'Amit Verma (Relationship Manager)' : undefined),
      });
    }
  });

  return Array.from(flags.values());
}
