import type {
  HoldingItem,
  HealthScoreBreakdown,
  HealthScoreFactor,
  BehaviorHistory,
} from '../types';

// ─── NAMED THRESHOLD CONSTANTS ───────────────────────────────────────────────

/** Concentration Penalty Constants */
export const CONCENTRATION_THRESHOLD_PCT = 25;
export const CONCENTRATION_FACTOR = 0.8;
export const CONCENTRATION_SINGLE_MAX_PENALTY = 20;
export const CONCENTRATION_TOTAL_MAX_PENALTY = 25;

/** Liquidity Mismatch Penalty Constants */
export const LIQUIDITY_MAX_PENALTY = 30;
export const LIQUIDITY_LOCKIN_TIER1_MAX_YEARS = 2; // <= 2 years -> -5
export const LIQUIDITY_LOCKIN_TIER1_PENALTY = 5;
export const LIQUIDITY_LOCKIN_TIER2_MAX_YEARS = 4; // 2-4 years -> -10
export const LIQUIDITY_LOCKIN_TIER2_PENALTY = 10;
export const LIQUIDITY_LOCKIN_TIER3_PENALTY = 15;  // > 4 years -> -15

/** Volatility Exposure Penalty Constants */
export const VOLATILITY_THRESHOLD_PCT = 50;
export const VOLATILITY_FACTOR = 0.5;
export const VOLATILITY_MAX_PENALTY = 15;

/** Diversification Gap Penalty Constants */
export const DIVERSIFICATION_TIER1_CLASSES = 3; // < 3 classes -> -10
export const DIVERSIFICATION_TIER1_PENALTY = 10;
export const DIVERSIFICATION_TIER2_CLASSES = 2; // < 2 classes -> -20
export const DIVERSIFICATION_TIER2_PENALTY = 20;

/** Positive Behavior Bonus Constants */
export const POSITIVE_BEHAVIOR_BONUS = 8;

/**
 * CLIENT-SIDE PREVIEW ONLY — NON-AUTHORITATIVE ESTIMATE
 *
 * Notice: Authoritative Health Score calculation is performed exclusively on the server
 * (`/api/health-score` endpoint backed by `server/healthScoreEngine.js`).
 * This client function is strictly for instant "What If" UI slider previews.
 * It is marked non-authoritative and must never be persisted or used for compliance reporting.
 */
export function computeHealthScorePreview(
  holdings: HoldingItem[],
  behaviorHistory?: BehaviorHistory
): HealthScoreBreakdown {
  if (!holdings || !Array.isArray(holdings)) {
    throw new Error('Invalid input: holdings must be a non-null Array');
  }

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  if (holdings.length === 0 || totalPortfolioValue <= 0) {
    const insufficientFactor: HealthScoreFactor = {
      factor: 'Insufficient Data',
      penaltyOrBonus: 0,
      reason: 'Portfolio is empty or total value is zero. Unable to calculate Health Score.',
      id: 'insufficient_data',
      label: 'Insufficient Data',
      description: 'No holdings or zero portfolio value found.',
      penalty: 0,
      suggestion: 'Upload a CAS statement or add portfolio holdings to calculate your Health Score.',
    };
    return {
      score: 0,
      base: 100,
      breakdown: [insufficientFactor],
      factors: [insufficientFactor],
    };
  }

  const breakdown: HealthScoreFactor[] = [];
  const holdingsWithWeights = holdings.map(h => ({
    ...h,
    pct: ((Number(h.currentValue) || 0) / totalPortfolioValue) * 100,
  }));

  // 1. Concentration Penalty
  let sumConcentrationPenalties = 0;
  const concentratedDetails: string[] = [];

  for (const h of holdingsWithWeights) {
    if (h.pct > CONCENTRATION_THRESHOLD_PCT) {
      const excess = h.pct - CONCENTRATION_THRESHOLD_PCT;
      const penalty = Math.min(CONCENTRATION_SINGLE_MAX_PENALTY, excess * CONCENTRATION_FACTOR);
      sumConcentrationPenalties += penalty;
      concentratedDetails.push(`${h.name} (${h.pct.toFixed(1)}% of portfolio)`);
    }
  }

  const totalConcentrationPenalty = Math.min(CONCENTRATION_TOTAL_MAX_PENALTY, sumConcentrationPenalties);
  if (totalConcentrationPenalty > 0) {
    const roundedPenalty = Number(totalConcentrationPenalty.toFixed(1));
    const factor: HealthScoreFactor = {
      factor: 'Concentration Penalty',
      penaltyOrBonus: -roundedPenalty,
      reason: `Holdings exceeding 25% threshold: ${concentratedDetails.join(', ')}. Deducted ${roundedPenalty} pts (capped at 25).`,
      id: 'concentration',
      label: 'Concentration Risk',
      description: `High concentration in: ${concentratedDetails.join(', ')}`,
      penalty: -roundedPenalty,
      suggestion: `Rebalance single holdings above 25% to recover up to ${roundedPenalty} points.`,
      sebiRuleRef: 'SEBI IA Regulations — Concentration Limits',
    };
    breakdown.push(factor);
  }

  // 2. Liquidity Mismatch Penalty
  let sumLiquidityPenalties = 0;
  const illiquidDetails: string[] = [];

  for (const h of holdingsWithWeights) {
    const isReitOrInvit = h.category === 'reits_invits' || /REIT|InvIT/i.test(h.name) || /REIT|InvIT/i.test(h.ticker);
    if (!isReitOrInvit) continue;

    let lockInYears = 0;
    if (h.lockInMonths && h.lockInMonths > 0) {
      lockInYears = h.lockInMonths / 12;
    } else {
      const terms = h.liquidity_terms || h.name || '';
      const yearMatch = terms.match(/(\d+)\s*[-_]?\s*year/i);
      const monthMatch = terms.match(/(\d+)\s*[-_]?\s*month/i);

      if (yearMatch) {
        lockInYears = parseInt(yearMatch[1], 10);
      } else if (monthMatch) {
        lockInYears = parseInt(monthMatch[1], 10) / 12;
      }
    }

    if (lockInYears > 0) {
      let instPenalty = 0;
      if (lockInYears <= LIQUIDITY_LOCKIN_TIER1_MAX_YEARS) {
        instPenalty = LIQUIDITY_LOCKIN_TIER1_PENALTY;
      } else if (lockInYears <= LIQUIDITY_LOCKIN_TIER2_MAX_YEARS) {
        instPenalty = LIQUIDITY_LOCKIN_TIER2_PENALTY;
      } else {
        instPenalty = LIQUIDITY_LOCKIN_TIER3_PENALTY;
      }

      sumLiquidityPenalties += instPenalty;
      illiquidDetails.push(`${h.name} (${lockInYears.toFixed(1)}-yr lock-in: -${instPenalty} pts)`);
    }
  }

  const totalLiquidityPenalty = Math.min(LIQUIDITY_MAX_PENALTY, sumLiquidityPenalties);
  if (totalLiquidityPenalty > 0) {
    const factor: HealthScoreFactor = {
      factor: 'Liquidity Mismatch Penalty',
      penaltyOrBonus: -totalLiquidityPenalty,
      reason: `Illiquid REIT/InvIT instruments with lock-in: ${illiquidDetails.join(', ')}. Deducted ${totalLiquidityPenalty} pts (capped at 30).`,
      id: 'liquidity',
      label: 'Liquidity Mismatch',
      description: `Lock-in restriction detected on: ${illiquidDetails.join(', ')}`,
      penalty: -totalLiquidityPenalty,
      suggestion: `Consider liquid alternatives or extending target horizons to close the liquidity gap.`,
      sebiRuleRef: 'SEBI Circular CIR/IMD/DF/13/2021 — Product Lock-in Rules',
    };
    breakdown.push(factor);
  }

  // 3. Volatility Exposure Penalty
  const volatileValue = holdingsWithWeights
    .filter(h => h.category === 'equities' || h.category === 'reits_invits' || /equity|reit|invit/i.test(h.category))
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const combinedVolatilePct = (volatileValue / totalPortfolioValue) * 100;

  if (combinedVolatilePct > VOLATILITY_THRESHOLD_PCT) {
    const excessPct = combinedVolatilePct - VOLATILITY_THRESHOLD_PCT;
    const volPenalty = Number(Math.min(VOLATILITY_MAX_PENALTY, excessPct * VOLATILITY_FACTOR).toFixed(1));

    if (volPenalty > 0) {
      const factor: HealthScoreFactor = {
        factor: 'Volatility Exposure Penalty',
        penaltyOrBonus: -volPenalty,
        reason: `Combined REIT + InvIT + Equity allocation is ${combinedVolatilePct.toFixed(1)}% (exceeds 50% threshold by ${excessPct.toFixed(1)}%). Deducted ${volPenalty} pts.`,
        id: 'volatility',
        label: 'Volatility Exposure',
        description: `${combinedVolatilePct.toFixed(1)}% in market/rate-sensitive assets (threshold: 50%)`,
        penalty: -volPenalty,
        suggestion: `Trimming market-sensitive exposure below 50% can recover up to ${volPenalty} points.`,
        sebiRuleRef: 'SEBI Alternate Asset Concentration Guidelines',
      };
      breakdown.push(factor);
    }
  }

  // 4. Diversification Gap Penalty
  const distinctAssetClasses = new Set<string>();

  for (const h of holdingsWithWeights) {
    if ((Number(h.currentValue) || 0) <= 0) continue;

    const cat = String(h.category).toLowerCase();
    const name = String(h.name).toLowerCase();
    const ticker = String(h.ticker || '').toLowerCase();

    if (cat === 'bonds' || name.includes('ncd') || name.includes('bond') || name.includes('debenture')) {
      distinctAssetClasses.add('bond');
    } else if (cat === 'reits_invits' || name.includes('reit') || name.includes('invit')) {
      if (name.includes('invit') || ticker.includes('invit')) {
        distinctAssetClasses.add('invit');
      } else {
        distinctAssetClasses.add('reit');
      }
    } else if (name.includes('fund') || name.includes('ppfcf') || ticker.startsWith('folio') || name.includes('mutual')) {
      distinctAssetClasses.add('mutual_fund');
    } else if (cat === 'equities' || cat === 'equity') {
      distinctAssetClasses.add('equity');
    } else if (cat === 'cash') {
      distinctAssetClasses.add('cash');
    } else {
      distinctAssetClasses.add(cat);
    }
  }

  const numClasses = distinctAssetClasses.size;
  let divPenalty = 0;

  if (numClasses < DIVERSIFICATION_TIER2_CLASSES) {
    divPenalty = DIVERSIFICATION_TIER2_PENALTY;
  } else if (numClasses < DIVERSIFICATION_TIER1_CLASSES) {
    divPenalty = DIVERSIFICATION_TIER1_PENALTY;
  }

  if (divPenalty > 0) {
    const factor: HealthScoreFactor = {
      factor: 'Diversification Gap Penalty',
      penaltyOrBonus: -divPenalty,
      reason: `Only ${numClasses} distinct asset class${numClasses === 1 ? '' : 'es'} present (${Array.from(distinctAssetClasses).join(', ') || 'none'}). Deducted ${divPenalty} pts.`,
      id: 'diversification',
      label: 'Diversification Gap',
      description: `Portfolio has only ${numClasses} distinct asset class${numClasses === 1 ? '' : 'es'}`,
      penalty: -divPenalty,
      suggestion: `Add holdings in other asset classes (e.g. bonds, debt funds) to reach at least 3 distinct asset classes.`,
      sebiRuleRef: 'SEBI IA Asset Allocation & Diversification Matrix',
    };
    breakdown.push(factor);
  }

  // 5. Positive Behavior Bonus
  if (behaviorHistory && behaviorHistory.regularContributions === true && behaviorHistory.noPanicSelling === true) {
    const factor: HealthScoreFactor = {
      factor: 'Positive Behavior Bonus',
      penaltyOrBonus: POSITIVE_BEHAVIOR_BONUS,
      reason: 'Recorded history of regular monthly contributions with no panic-selling during drawdowns. Added +8 pts.',
      id: 'behavior_bonus',
      label: 'Positive Behavior Bonus',
      description: 'Disciplined monthly contribution history',
      penalty: POSITIVE_BEHAVIOR_BONUS,
      suggestion: 'Maintain regular contribution cadence to keep your behavior bonus active.',
    };
    breakdown.push(factor);
  }

  const totalAdjustments = breakdown.reduce((sum, f) => sum + f.penaltyOrBonus, 0);
  const rawScore = 100 + totalAdjustments;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    score,
    base: 100,
    breakdown,
    factors: breakdown,
  };
}

/** Alias for backward compatibility in tests/previews */
export const computeHealthScore = computeHealthScorePreview;
