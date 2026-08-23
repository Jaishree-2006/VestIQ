import type { HoldingItem, SebiRiskCategory, IpoSuitabilityResult } from '../types';
import type { UpcomingIssue } from '../data/upcomingIssues';
import { SEBI_RISK_RANKS } from './riskProfiler';
import { CONCENTRATION_THRESHOLD_PCT } from './healthScore';

/**
 * Evaluates an upcoming IPO/NFO against the investor's existing portfolio concentration
 * and SEBI Riskometer risk profile before they commit capital.
 */
export function evaluateIssueSuitability(
  issue: UpcomingIssue,
  holdings: HoldingItem[],
  userRiskCategory: SebiRiskCategory,
  simulatedAmount: number = 50000
): IpoSuitabilityResult {
  const totalValue = (holdings || []).reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  // 1. Calculate existing asset class concentration
  const existingAssetClassValue = (holdings || [])
    .filter((h) => h.category === issue.assetClass)
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const existingAssetClassAllocationPct =
    totalValue > 0 ? (existingAssetClassValue / totalValue) * 100 : 0;

  // 2. Calculate existing sector concentration
  let existingSectorValue = 0;
  if (issue.assetClass === 'reits_invits' || /real estate|reit|invit|infrastructure/i.test(issue.sector)) {
    existingSectorValue = (holdings || [])
      .filter((h) => h.category === 'reits_invits' || /reit|invit/i.test(h.name))
      .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  } else if (issue.assetClass === 'bonds' || /bond|g-sec|sovereign|debt/i.test(issue.sector)) {
    existingSectorValue = (holdings || [])
      .filter((h) => h.category === 'bonds')
      .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  } else {
    existingSectorValue = (holdings || [])
      .filter((h) => h.category === 'equities')
      .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  }

  const existingSectorAllocationPct =
    totalValue > 0 ? (existingSectorValue / totalValue) * 100 : 0;

  // 3. Simulated post-application allocation percentages
  const simulatedTotal = totalValue + simulatedAmount;
  const simulatedAssetClassAllocationPct =
    simulatedTotal > 0 ? ((existingAssetClassValue + simulatedAmount) / simulatedTotal) * 100 : 0;
  const simulatedSectorAllocationPct =
    simulatedTotal > 0 ? ((existingSectorValue + simulatedAmount) / simulatedTotal) * 100 : 0;

  // 4. Compare SEBI Riskometer ranks
  const userRiskRank = SEBI_RISK_RANKS[userRiskCategory] || 3;
  const issueRiskRank = SEBI_RISK_RANKS[issue.riskCategory] || 3;
  const riskDelta = issueRiskRank - userRiskRank;
  const riskMatch = riskDelta <= 1;

  const warnings: string[] = [];
  const diversificationBenefits: string[] = [];

  // 5. Evaluate Conflicts
  const isReitConcentrated =
    (issue.assetClass === 'reits_invits' || /reit|invit/i.test(issue.sector)) &&
    existingAssetClassAllocationPct >= CONCENTRATION_THRESHOLD_PCT;

  const isSectorConcentrated =
    existingSectorAllocationPct >= 30 && issue.assetClass === 'equities';

  if (isReitConcentrated) {
    warnings.push(
      `You currently hold ₹${existingAssetClassValue.toLocaleString('en-IN')} (${existingAssetClassAllocationPct.toFixed(1)}%) in REIT/InvIT-linked instruments.`
    );
    warnings.push(
      `Applying would push your real-estate trust exposure to ${simulatedAssetClassAllocationPct.toFixed(1)}% of total portfolio.`
    );
    if (issue.lockInMonths > 0) {
      warnings.push(`Mandatory ${issue.lockInMonths}-month lock-in further limits liquidity.`);
    }

    return {
      verdict: 'warning',
      headline: 'Sector Concentration & Rate Sensitivity Warning',
      description: `Applying for ${issue.name} adds further real-estate and interest rate duration risk to a portfolio that already holds ${existingAssetClassAllocationPct.toFixed(1)}% in REITs/InvITs.`,
      existingSectorAllocationPct: Number(existingSectorAllocationPct.toFixed(1)),
      existingAssetClassAllocationPct: Number(existingAssetClassAllocationPct.toFixed(1)),
      simulatedSectorAllocationPct: Number(simulatedSectorAllocationPct.toFixed(1)),
      simulatedAssetClassAllocationPct: Number(simulatedAssetClassAllocationPct.toFixed(1)),
      riskMatch,
      userRiskCategory,
      issueRiskCategory: issue.riskCategory,
      causalChain: {
        cause: `You already hold ${existingAssetClassAllocationPct.toFixed(1)}% in REIT/InvIT-linked assets`,
        mechanism: `this ${issue.issueType} adds further real-estate sector exposure`,
        impact: `consider your existing concentration before applying.`,
      },
      warnings,
      diversificationBenefits: [],
    };
  }

  if (riskDelta >= 2) {
    warnings.push(
      `Your assessed risk profile is ${userRiskCategory} (Rank ${userRiskRank}/6). This issue is rated ${issue.riskCategory} (Rank ${issueRiskRank}/6).`
    );
    warnings.push(
      `High-volatility equity issues can cause substantial short-term drawdowns incompatible with conservative horizons.`
    );

    return {
      verdict: 'caution',
      headline: 'SEBI Riskometer Capacity Mismatch',
      description: `This ${issue.issueType} is rated higher on the SEBI Riskometer than your assessed risk capacity.`,
      existingSectorAllocationPct: Number(existingSectorAllocationPct.toFixed(1)),
      existingAssetClassAllocationPct: Number(existingAssetClassAllocationPct.toFixed(1)),
      simulatedSectorAllocationPct: Number(simulatedSectorAllocationPct.toFixed(1)),
      simulatedAssetClassAllocationPct: Number(simulatedAssetClassAllocationPct.toFixed(1)),
      riskMatch: false,
      userRiskCategory,
      issueRiskCategory: issue.riskCategory,
      causalChain: {
        cause: `Assessed risk capacity is ${userRiskCategory} (SEBI Rank ${userRiskRank}/6)`,
        mechanism: `this issue is rated ${issue.riskCategory} (SEBI Rank ${issueRiskRank}/6) with higher drawdowns`,
        impact: `volatility profile exceeds your stated risk tolerance.`,
      },
      warnings,
      diversificationBenefits: [],
    };
  }

  // Positive / Suitable Case
  diversificationBenefits.push(
    `Adds balanced ${issue.sector} exposure without exceeding the 25% single-sector safety ceiling.`
  );
  if (issue.assetClass === 'bonds') {
    diversificationBenefits.push(
      `Increases high-grade fixed income allocation to ${simulatedAssetClassAllocationPct.toFixed(1)}%, stabilizing household cash flow.`
    );
  } else {
    diversificationBenefits.push(
      `Matches your ${userRiskCategory} risk profile and broadens equity/asset diversification.`
    );
  }

  return {
    verdict: 'suitable',
    headline: 'Suitable Allocation · Aligned with Diversification Goals',
    description: `Applying for ${issue.name} maintains healthy sector balance and matches your ${userRiskCategory} risk profile.`,
    existingSectorAllocationPct: Number(existingSectorAllocationPct.toFixed(1)),
    existingAssetClassAllocationPct: Number(existingAssetClassAllocationPct.toFixed(1)),
    simulatedSectorAllocationPct: Number(simulatedSectorAllocationPct.toFixed(1)),
    simulatedAssetClassAllocationPct: Number(simulatedAssetClassAllocationPct.toFixed(1)),
    riskMatch: true,
    userRiskCategory,
    issueRiskCategory: issue.riskCategory,
    warnings: [],
    diversificationBenefits,
  };
}
