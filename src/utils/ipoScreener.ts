import type { HoldingItem } from '../types';
import { SEBI_RISK_RANKS, type SebiRiskCategory } from './riskProfiler';
import type { UpcomingIssue } from '../data/upcomingIssues';

export interface IpoScreeningResult {
  issue: UpcomingIssue;
  isSuitable: boolean;
  status: 'suitable' | 'warning' | 'high_risk';
  existingWeightPct: number;
  userRiskCategory: SebiRiskCategory;
  issueRiskCategory: SebiRiskCategory;
  conflictType?: 'concentration' | 'risk_profile' | 'both';
  causalChain: {
    cause: string;
    mechanism: string;
    impact: string;
  };
  summaryReason: string;
  suggestedAction: string;
}

export function screenUpcomingIssue(
  holdings: HoldingItem[],
  userRiskCategory: SebiRiskCategory = 'Moderate',
  issue: UpcomingIssue
): IpoScreeningResult {
  const totalValue = Array.isArray(holdings)
    ? holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0)
    : 0;

  // Calculate current allocation in matching asset class
  let matchingValue = 0;
  if (totalValue > 0 && Array.isArray(holdings)) {
    if (issue.asset_class === 'reits_invits') {
      matchingValue = holdings
        .filter((h) => h.category === 'reits_invits' || /REIT|InvIT/i.test(h.name) || /REIT|InvIT/i.test(h.ticker))
        .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    } else {
      matchingValue = holdings
        .filter((h) => h.category === issue.asset_class)
        .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    }
  }

  const existingWeightPct = totalValue > 0 ? Number(((matchingValue / totalValue) * 100).toFixed(1)) : 0;

  const userRank = SEBI_RISK_RANKS[userRiskCategory] || 3;
  const issueRank = SEBI_RISK_RANKS[issue.risk_category] || 3;
  const isRiskMismatch = issueRank > userRank;
  const rankGap = issueRank - userRank;

  // Concentration threshold evaluation
  const isReitOverconcentrated = issue.asset_class === 'reits_invits' && existingWeightPct >= 30;
  const isEquityOverconcentrated = issue.asset_class === 'equities' && existingWeightPct >= 65;
  const isConcentrationConflict = isReitOverconcentrated || isEquityOverconcentrated;

  // 1. Both Concentration and Risk Mismatch
  if (isConcentrationConflict && isRiskMismatch) {
    const assetLabel = issue.asset_class === 'reits_invits' ? 'REIT/InvIT-linked' : 'equity-linked';
    return {
      issue,
      isSuitable: false,
      status: 'high_risk',
      existingWeightPct,
      userRiskCategory,
      issueRiskCategory: issue.risk_category,
      conflictType: 'both',
      causalChain: {
        cause: `You already hold ${existingWeightPct.toFixed(1)}% in ${assetLabel} assets`,
        mechanism: `this ${issue.issue_type} adds further ${issue.sector.toLowerCase()} exposure while carrying a higher ${issue.risk_category} risk rating`,
        impact: `consider your existing concentration before applying.`,
      },
      summaryReason: `Dual conflict detected: Heavy existing ${assetLabel} allocation (${existingWeightPct}%) and higher instrument risk level (${issue.risk_category}) than your ${userRiskCategory} profile.`,
      suggestedAction: `Consider balancing your portfolio with sovereign debt or diversified index funds rather than adding further concentrated exposure to this issue.`,
    };
  }

  // 2. Concentration Conflict Only
  if (isConcentrationConflict) {
    const assetLabel = issue.asset_class === 'reits_invits' ? 'REIT/InvIT-linked' : 'matching sector';
    return {
      issue,
      isSuitable: false,
      status: 'warning',
      existingWeightPct,
      userRiskCategory,
      issueRiskCategory: issue.risk_category,
      conflictType: 'concentration',
      causalChain: {
        cause: `You already hold ${existingWeightPct.toFixed(1)}% in ${assetLabel} assets`,
        mechanism: `this ${issue.issue_type} adds further ${issue.sector.toLowerCase()} exposure`,
        impact: `consider your existing concentration before applying.`,
      },
      summaryReason: `Concentration warning: Your portfolio already holds ${existingWeightPct}% in ${assetLabel} assets, which is near or above prudent diversification limits.`,
      suggestedAction: `Ensure your target allocation won't result in excessive single-sector dependence before committing new capital.`,
    };
  }

  // 3. Risk Level Mismatch Only
  if (isRiskMismatch) {
    return {
      issue,
      isSuitable: false,
      status: rankGap >= 2 ? 'high_risk' : 'warning',
      existingWeightPct,
      userRiskCategory,
      issueRiskCategory: issue.risk_category,
      conflictType: 'risk_profile',
      causalChain: {
        cause: `Your assessed profile is ${userRiskCategory}`,
        mechanism: `this instrument is rated ${issue.risk_category} on the SEBI Riskometer`,
        impact: `volatility and drawdown risk exceed your profiled tolerance threshold.`,
      },
      summaryReason: `Suitability mismatch: Instrument's ${issue.risk_category} rating is above your ${userRiskCategory} profile band.`,
      suggestedAction: `Review whether you are prepared to absorb potential drawdowns associated with ${issue.risk_category.toLowerCase()} assets.`,
    };
  }

  // 4. Fully Suitable
  return {
    issue,
    isSuitable: true,
    status: 'suitable',
    existingWeightPct,
    userRiskCategory,
    issueRiskCategory: issue.risk_category,
    causalChain: {
      cause: `Current allocation in this asset class is balanced (${existingWeightPct}%)`,
      mechanism: `this ${issue.issue_type} matches your ${userRiskCategory} profile`,
      impact: `provides healthy portfolio diversification without introducing concentration stress.`,
    },
    summaryReason: `Suitable: This ${issue.issue_type} aligns with your ${userRiskCategory} risk profile and enhances your overall portfolio diversification.`,
    suggestedAction: `Proceed with application according to your planned investment schedule and target allocation limits.`,
  };
}
