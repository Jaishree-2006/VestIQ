import type { HoldingItem, RedFlagAlert } from '../types';

export function normalizeRedFlagStatus(flag?: Partial<RedFlagAlert>): 'active' | 'resolved' | 'acknowledged' {
  const status = flag?.status;
  if (status === 'resolved' || status === 'acknowledged') return status;
  return 'active';
}

export function deriveRedFlagsFromHoldings(holdings: HoldingItem[]): RedFlagAlert[] {
  if (!Array.isArray(holdings) || holdings.length === 0) return [];

  const totalValue = holdings.reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
  if (!totalValue) return [];

  const flags = new Map<string, RedFlagAlert>();

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
      description: `Combined REIT and InvIT exposure is ${(reitInvitValue / totalValue * 100).toFixed(1)}% of the portfolio, which is above the recommended ceiling for a moderate risk profile.`,
      suggestedAction: 'Rebalance a portion of the REIT / InvIT allocation into liquid sovereign debt or diversified equity funds to restore liquidity and reduce rate sensitivity.',
      sebiRuleRef: 'SEBI alternate-asset concentration and suitability guidance',
      status: 'active',
    });
  }

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
  });

  return Array.from(flags.values());
}
