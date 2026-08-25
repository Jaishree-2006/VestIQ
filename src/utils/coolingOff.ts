import type { HoldingItem, HealthScoreEvent } from '../types';

export interface CoolingOffCheckResult {
  triggered: boolean;
  triggerType?: 'large_sell' | 'recent_score_drop';
  title: string;
  message: string;
  causalChain: {
    impulse: string;
    historicalPattern: string;
    longTermOutcome: string;
  };
}

/**
 * Checks if a portfolio holding adjustment should trigger a behavioral Cooling-Off Nudge:
 * 1. Large Sell: Reduction > 25% of the holding's current/baseline value.
 * 2. Recent Sharp Negative Move: Health Score event with delta <= -5 or red-flagged drop within 7 days.
 */
export function evaluateCoolingOffTrigger(
  holding: HoldingItem,
  nextValue: number,
  healthScoreEvents: HealthScoreEvent[] = [],
  referenceDate: Date = new Date()
): CoolingOffCheckResult {
  const currentValue = Number(holding.currentValue) || 0;
  const reductionPct = currentValue > 0 ? ((currentValue - nextValue) / currentValue) * 100 : 0;

  // Trigger Condition (a): Large sell (> 25% drop in single action)
  if (reductionPct > 25) {
    return {
      triggered: true,
      triggerType: 'large_sell',
      title: 'Cooling-Off Check: Significant Position Reduction',
      message: `You are simulating a ${Math.round(reductionPct)}% sell (₹${(currentValue - nextValue).toLocaleString('en-IN')}) in ${holding.name}.`,
      causalChain: {
        impulse: `Simulated rapid liquidation of ${Math.round(reductionPct)}% of ${holding.name}`,
        historicalPattern: 'Markets that dropped this much historically recovered over following months in over 85% of cycles',
        longTermOutcome: 'Selling during a dip can permanently lock in paper losses that a market recovery would have reversed.',
      },
    };
  }

  // Trigger Condition (b): Recent sharp score drop within 7 days
  const hasRecentDrop = healthScoreEvents.some((event) => {
    if (!event.timestamp) return false;
    const eventDate = new Date(event.timestamp);
    const diffDays = (referenceDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7 && (event.delta <= -5 || (event.reasonObject?.penaltyOrBonus || 0) <= -5);
  });

  if (hasRecentDrop && nextValue < currentValue) {
    return {
      triggered: true,
      triggerType: 'recent_score_drop',
      title: 'Cooling-Off Check: Reaction Following Recent Portfolio Stress',
      message: 'Your account experienced a recent Health Score drop in the past 7 days. Portfolio adjustments during stress periods often reflect emotional urgency.',
      causalChain: {
        impulse: 'Rushed rebalancing following a recent portfolio score dip',
        historicalPattern: 'Investors who paused 24-48 hours before executing sell decisions avoided emotional timing penalties in most market cycles',
        longTermOutcome: 'Maintaining disciplined asset allocation prevents compounding drawdown risk during volatile windows.',
      },
    };
  }

  return {
    triggered: false,
    title: '',
    message: '',
    causalChain: {
      impulse: '',
      historicalPattern: '',
      longTermOutcome: '',
    },
  };
}
