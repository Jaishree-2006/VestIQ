/**
 * Authoritative Server-Side Health Score Engine for VestIQ
 *
 * All production / compliance Health Score calculations execute exclusively on the server.
 * Formula:
 *   score = 100 - concentrationPenalty - liquidityMismatchPenalty
 *               - volatilityExposurePenalty - diversificationGapPenalty
 *               + positiveBehaviorBonus
 * Clamped between 0 and 100.
 */

export const DEFAULT_THRESHOLDS = {
  concentrationThresholdPct: 25,
  reitInvitMaxPct: 35,
  lockinHorizonMonths: 18,
  fixedIncomeMinPct: 20,
  concentrationPenalty: 12,
  liquidityPenalty: 10,
  volatilityPenalty: 8,
  diversificationPenalty: 6,
  behaviorBonus: 8,
  CONCENTRATION_THRESHOLD_PCT: 25,
  CONCENTRATION_FACTOR: 0.8,
  CONCENTRATION_SINGLE_MAX_PENALTY: 20,
  CONCENTRATION_TOTAL_MAX_PENALTY: 25,
  VOLATILITY_THRESHOLD_PCT: 50,
  VOLATILITY_FACTOR: 0.5,
  VOLATILITY_MAX_PENALTY: 15,
  LIQUIDITY_MAX_PENALTY: 30,
  LIQUIDITY_LOCKIN_TIER1_MAX_YEARS: 2,
  LIQUIDITY_LOCKIN_TIER1_PENALTY: 5,
  LIQUIDITY_LOCKIN_TIER2_MAX_YEARS: 4,
  LIQUIDITY_LOCKIN_TIER2_PENALTY: 10,
  LIQUIDITY_LOCKIN_TIER3_PENALTY: 15,
  DIVERSIFICATION_TIER1_CLASSES: 3,
  DIVERSIFICATION_TIER1_PENALTY: 10,
  DIVERSIFICATION_TIER2_CLASSES: 2,
  DIVERSIFICATION_TIER2_PENALTY: 20,
  POSITIVE_BEHAVIOR_BONUS: 8
};

// In-memory threshold cache (short 60s TTL to ensure quick reflection of admin changes)
const THRESHOLD_CACHE_TTL_MS = 60_000;
let cachedThresholds = null;
let cacheExpiry = 0;

export function setScoringThresholdsCache(newThresholds) {
  cachedThresholds = { ...DEFAULT_THRESHOLDS, ...newThresholds };
  cacheExpiry = Date.now() + THRESHOLD_CACHE_TTL_MS;
}

export function invalidateScoringThresholdsCache() {
  cachedThresholds = null;
  cacheExpiry = 0;
}

export function getActiveScoringThresholdsCache() {
  return cachedThresholds || DEFAULT_THRESHOLDS;
}

export async function fetchScoringThresholds(supabaseClient) {
  if (cachedThresholds && Date.now() < cacheExpiry) {
    return cachedThresholds;
  }

  if (!supabaseClient) {
    return cachedThresholds || DEFAULT_THRESHOLDS;
  }

  try {
    const { data, error } = await supabaseClient.from('scoring_thresholds').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      const dbThresholds = { ...DEFAULT_THRESHOLDS };
      for (const row of data) {
        if (row.key && row.value !== undefined && row.value !== null) {
          dbThresholds[row.key] = Number(row.value);
        }
      }
      cachedThresholds = dbThresholds;
      cacheExpiry = Date.now() + THRESHOLD_CACHE_TTL_MS;
      return dbThresholds;
    }
  } catch (err) {
    console.warn('Failed to load scoring_thresholds from database, using cached/defaults:', err.message);
  }

  return cachedThresholds || DEFAULT_THRESHOLDS;
}

export async function computeHealthScoreWithSupabase(holdings, behaviorHistory, supabaseClient) {
  const thresholds = await fetchScoringThresholds(supabaseClient);
  return computeHealthScore(holdings, behaviorHistory, thresholds);
}

export function computeHealthScore(holdings, behaviorHistory, customThresholds = null) {
  if (!holdings || !Array.isArray(holdings)) {
    throw new Error('Invalid input: holdings must be a non-null Array');
  }

  const t = customThresholds
    ? { ...DEFAULT_THRESHOLDS, ...customThresholds }
    : (cachedThresholds || DEFAULT_THRESHOLDS);


  const CONC_THRESH = t.CONCENTRATION_THRESHOLD_PCT ?? t.concentrationThresholdPct ?? 25;
  const CONC_FACTOR = t.CONCENTRATION_FACTOR ?? 0.8;
  const CONC_SINGLE_MAX = t.CONCENTRATION_SINGLE_MAX_PENALTY ?? t.concentrationPenalty ?? 20;
  const CONC_TOTAL_MAX = t.CONCENTRATION_TOTAL_MAX_PENALTY ?? 25;

  const LIQ_MAX = t.LIQUIDITY_MAX_PENALTY ?? t.liquidityPenalty ?? 30;
  const LIQ_TIER1_MAX = t.LIQUIDITY_LOCKIN_TIER1_MAX_YEARS ?? 2;
  const LIQ_TIER1_PEN = t.LIQUIDITY_LOCKIN_TIER1_PENALTY ?? 5;
  const LIQ_TIER2_MAX = t.LIQUIDITY_LOCKIN_TIER2_MAX_YEARS ?? 4;
  const LIQ_TIER2_PEN = t.LIQUIDITY_LOCKIN_TIER2_PENALTY ?? 10;
  const LIQ_TIER3_PEN = t.LIQUIDITY_LOCKIN_TIER3_PENALTY ?? 15;

  const VOL_THRESH = t.VOLATILITY_THRESHOLD_PCT ?? 50;
  const VOL_FACTOR = t.VOLATILITY_FACTOR ?? 0.5;
  const VOL_MAX = t.VOLATILITY_MAX_PENALTY ?? t.volatilityPenalty ?? 15;

  const DIV_TIER1_CLASSES = t.DIVERSIFICATION_TIER1_CLASSES ?? 3;
  const DIV_TIER1_PEN = t.DIVERSIFICATION_TIER1_PENALTY ?? 10;
  const DIV_TIER2_CLASSES = t.DIVERSIFICATION_TIER2_CLASSES ?? 2;
  const DIV_TIER2_PEN = t.DIVERSIFICATION_TIER2_PENALTY ?? 20;

  const BEHAVIOR_BONUS = t.POSITIVE_BEHAVIOR_BONUS ?? t.behaviorBonus ?? 8;

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  if (holdings.length === 0 || totalPortfolioValue <= 0) {
    const insufficientFactor = {
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

  const breakdown = [];
  const holdingsWithWeights = holdings.map(h => ({
    ...h,
    pct: ((Number(h.currentValue) || 0) / totalPortfolioValue) * 100,
  }));

  // 1. Concentration Penalty
  let sumConcentrationPenalties = 0;
  const concentratedDetails = [];

  for (const h of holdingsWithWeights) {
    if (h.pct > CONC_THRESH) {
      const excess = h.pct - CONC_THRESH;
      const penalty = Math.min(CONC_SINGLE_MAX, excess * CONC_FACTOR);
      sumConcentrationPenalties += penalty;
      concentratedDetails.push(`${h.name} (${h.pct.toFixed(1)}% of portfolio)`);
    }
  }

  const totalConcentrationPenalty = Math.min(CONC_TOTAL_MAX, sumConcentrationPenalties);
  if (totalConcentrationPenalty > 0) {
    const roundedPenalty = Number(totalConcentrationPenalty.toFixed(1));
    breakdown.push({
      factor: 'Concentration Penalty',
      penaltyOrBonus: -roundedPenalty,
      reason: `Holdings exceeding ${CONC_THRESH}% threshold: ${concentratedDetails.join(', ')}. Deducted ${roundedPenalty} pts (capped at ${CONC_TOTAL_MAX}).`,
      id: 'concentration',
      label: 'Concentration Risk',
      description: `High concentration in: ${concentratedDetails.join(', ')}`,
      penalty: -roundedPenalty,
      suggestion: `Rebalance single holdings above ${CONC_THRESH}% to recover up to ${roundedPenalty} points.`,
      sebiRuleRef: 'SEBI IA Regulations — Concentration Limits',
    });
  }

  // 2. Liquidity Mismatch Penalty
  let sumLiquidityPenalties = 0;
  const illiquidDetails = [];

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
      if (yearMatch) lockInYears = parseInt(yearMatch[1], 10);
      else if (monthMatch) lockInYears = parseInt(monthMatch[1], 10) / 12;
    }

    if (lockInYears > 0) {
      let instPenalty = 0;
      if (lockInYears <= LIQ_TIER1_MAX) instPenalty = LIQ_TIER1_PEN;
      else if (lockInYears <= LIQ_TIER2_MAX) instPenalty = LIQ_TIER2_PEN;
      else instPenalty = LIQ_TIER3_PEN;

      sumLiquidityPenalties += instPenalty;
      illiquidDetails.push(`${h.name} (${lockInYears.toFixed(1)}-yr lock-in: -${instPenalty} pts)`);
    }
  }

  const totalLiquidityPenalty = Math.min(LIQ_MAX, sumLiquidityPenalties);
  if (totalLiquidityPenalty > 0) {
    breakdown.push({
      factor: 'Liquidity Mismatch Penalty',
      penaltyOrBonus: -totalLiquidityPenalty,
      reason: `Illiquid REIT/InvIT instruments with lock-in: ${illiquidDetails.join(', ')}. Deducted ${totalLiquidityPenalty} pts (capped at ${LIQ_MAX}).`,
      id: 'liquidity',
      label: 'Liquidity Mismatch',
      description: `Lock-in restriction detected on: ${illiquidDetails.join(', ')}`,
      penalty: -totalLiquidityPenalty,
      suggestion: `Consider liquid alternatives or extending target horizons to close the liquidity gap.`,
      sebiRuleRef: 'SEBI Circular CIR/IMD/DF/13/2021 — Product Lock-in Rules',
    });
  }

  // 3. Volatility Exposure Penalty
  const volatileValue = holdingsWithWeights
    .filter(h => h.category === 'equities' || h.category === 'reits_invits' || /equity|reit|invit/i.test(h.category))
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const combinedVolatilePct = (volatileValue / totalPortfolioValue) * 100;

  if (combinedVolatilePct > VOL_THRESH) {
    const excessPct = combinedVolatilePct - VOL_THRESH;
    const volPenalty = Number(Math.min(VOL_MAX, excessPct * VOL_FACTOR).toFixed(1));

    if (volPenalty > 0) {
      breakdown.push({
        factor: 'Volatility Exposure Penalty',
        penaltyOrBonus: -volPenalty,
        reason: `Combined REIT + InvIT + Equity allocation is ${combinedVolatilePct.toFixed(1)}% (exceeds ${VOL_THRESH}% threshold by ${excessPct.toFixed(1)}%). Deducted ${volPenalty} pts.`,
        id: 'volatility',
        label: 'Volatility Exposure',
        description: `${combinedVolatilePct.toFixed(1)}% in market/rate-sensitive assets (threshold: ${VOL_THRESH}%)`,
        penalty: -volPenalty,
        suggestion: `Trimming market-sensitive exposure below ${VOL_THRESH}% can recover up to ${volPenalty} points.`,
        sebiRuleRef: 'SEBI Alternate Asset Concentration Guidelines',
      });
    }
  }

  // 4. Diversification Gap Penalty
  const distinctAssetClasses = new Set();
  for (const h of holdingsWithWeights) {
    if ((Number(h.currentValue) || 0) <= 0) continue;

    const cat = String(h.category).toLowerCase();
    const name = String(h.name).toLowerCase();
    const ticker = String(h.ticker || '').toLowerCase();

    if (cat === 'bonds' || name.includes('ncd') || name.includes('bond') || name.includes('debenture')) {
      distinctAssetClasses.add('bond');
    } else if (cat === 'reits_invits' || name.includes('reit') || name.includes('invit')) {
      if (name.includes('invit') || ticker.includes('invit')) distinctAssetClasses.add('invit');
      else distinctAssetClasses.add('reit');
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
  if (numClasses < DIV_TIER2_CLASSES) divPenalty = DIV_TIER2_PEN;
  else if (numClasses < DIV_TIER1_CLASSES) divPenalty = DIV_TIER1_PEN;

  if (divPenalty > 0) {
    breakdown.push({
      factor: 'Diversification Gap Penalty',
      penaltyOrBonus: -divPenalty,
      reason: `Only ${numClasses} distinct asset class${numClasses === 1 ? '' : 'es'} present (${Array.from(distinctAssetClasses).join(', ') || 'none'}). Deducted ${divPenalty} pts.`,
      id: 'diversification',
      label: 'Diversification Gap',
      description: `Portfolio has only ${numClasses} distinct asset class${numClasses === 1 ? '' : 'es'}`,
      penalty: -divPenalty,
      suggestion: `Add holdings in other asset classes (e.g. bonds, debt funds) to reach at least 3 distinct asset classes.`,
      sebiRuleRef: 'SEBI IA Asset Allocation & Diversification Matrix',
    });
  }

  // 5. Positive Behavior Bonus
  if (behaviorHistory && behaviorHistory.regularContributions === true && behaviorHistory.noPanicSelling === true) {
    breakdown.push({
      factor: 'Positive Behavior Bonus',
      penaltyOrBonus: BEHAVIOR_BONUS,
      reason: `Recorded history of regular monthly contributions with no panic-selling during drawdowns. Added +${BEHAVIOR_BONUS} pts.`,
      id: 'behavior_bonus',
      label: 'Positive Behavior Bonus',
      description: 'Disciplined monthly contribution history',
      penalty: BEHAVIOR_BONUS,
      suggestion: 'Maintain regular contribution cadence to keep your behavior bonus active.',
    });
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
