import type { HoldingItem } from '../types';

export interface UpcomingPayoutItem {
  holdingId: string;
  holdingName: string;
  ticker: string;
  category: string;
  payoutType: 'dividend' | 'coupon' | 'distribution';
  payoutDate: string; // ISO string e.g. "2026-09-15"
  estimatedAmount: number;
  daysRemaining?: number;
}

/**
 * Extracts and sorts upcoming income payouts from holdings by next_payout_date ascending.
 */
export function getUpcomingPayouts(
  holdings: HoldingItem[],
  limit: number = 5,
  referenceDate: Date = new Date()
): UpcomingPayoutItem[] {
  if (!Array.isArray(holdings) || holdings.length === 0) return [];

  const nowMs = referenceDate.getTime();

  const payouts: UpcomingPayoutItem[] = [];

  for (const h of holdings) {
    if (h.next_payout_date && h.payout_type) {
      const pDate = new Date(h.next_payout_date);
      const diffDays = Math.ceil((pDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));

      // Calculate estimated amount if not directly provided
      let estimatedAmount = h.estimated_payout_amount || 0;
      if (!estimatedAmount && h.yieldPct && h.currentValue) {
        // e.g. quarterly distribution (yield / 4)
        estimatedAmount = Math.round((h.currentValue * (h.yieldPct / 100)) / 4);
      }

      payouts.push({
        holdingId: h.id,
        holdingName: h.name,
        ticker: h.ticker,
        category: h.category,
        payoutType: h.payout_type,
        payoutDate: h.next_payout_date,
        estimatedAmount,
        daysRemaining: diffDays,
      });
    }
  }

  // Sort by date ascending (soonest first)
  payouts.sort((a, b) => new Date(a.payoutDate).getTime() - new Date(b.payoutDate).getTime());

  return payouts.slice(0, limit);
}
