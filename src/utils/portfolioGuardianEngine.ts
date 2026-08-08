import type { HoldingItem, NewsEvent, GuardianAlert } from '../types';

/**
 * Seeded set of realistic financial news events for hackathon demo.
 * Includes 3 highly relevant market stories + 1 deliberately irrelevant control story
 * to prove that relevance filtering works!
 */
export const SEED_NEWS_EVENTS: NewsEvent[] = [
  {
    id: 'news-rbi-rate-hike-2026',
    headline: 'RBI Monetary Policy Committee Hikes Repo Rate by 25 bps to 6.75%',
    source: 'Financial Express • 12 mins ago',
    publishedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    category: 'monetary_policy',
    summary: 'RBI raised repo rate by 25 bps to curb persistent inflation, impacting commercial real estate cap-rates and fixed income bond yields.',
    targetCategories: ['reits_invits', 'bonds'],
    targetKeywords: ['REIT', 'InvIT', 'rate', 'yield', 'repo', 'PFC', 'Embassy', 'Grid'],
    simulatedScoreDelta: -8,
    simulatedMtmImpact: '-₹42,800 mark-to-market yield duration adjustment',
    causalChain: {
      cause: 'RBI raised repo rate by +25 bps to combat headline inflation.',
      mechanism: 'Your portfolio has a 37.7% exposure to rate-sensitive REITs/InvITs (₹7,12,600 across Embassy & Grid InvIT) plus ₹3,10,000 in fixed-rate PFC NCDs.',
      impact: 'Higher benchmark yields increase capitalization rates for commercial REITs (estimating a ~3-5% price adjustment) and reduce capital appreciation on fixed-coupon NCDs.'
    }
  },
  {
    id: 'news-invit-tax-clarification',
    headline: 'SEBI Clarifies InvIT Distribution Taxation & Capital Repayment Framework',
    source: 'Economic Times • 45 mins ago',
    publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    category: 'regulatory',
    summary: 'SEBI issued revised guidance requiring clear bifurcation of return-of-capital vs dividend distributions for Infrastructure Investment Trusts.',
    targetCategories: ['reits_invits'],
    targetTickers: ['GRIDINVIT', 'EMBASSY'],
    targetKeywords: ['InvIT', 'Grid', 'distribution', 'tax'],
    simulatedScoreDelta: -4,
    simulatedMtmImpact: '-₹14,200 post-tax distribution adjustment',
    causalChain: {
      cause: 'SEBI mandated stricter tax classification on InvIT capital repayments.',
      mechanism: 'You hold ₹4,40,600 in Grid Infrastructure InvIT via a 3-year RM lock-in structure.',
      impact: 'Effective yield after tax deduction at source (TDS) reduces net cash flow from 11.4% to ~9.8%.'
    }
  },
  {
    id: 'news-it-sector-guidance',
    headline: 'Global Tech Spending Slowdown Triggers Margin Guidance Cut for Indian IT Services Exporters',
    source: 'Mint Markets • 2 hours ago',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'sector_news',
    summary: 'Major Fortune 500 enterprise clients scale back discretionary IT projects, putting pressure on tier-1 IT exporter revenues.',
    targetCategories: ['equities'],
    targetTickers: ['INFY'],
    targetKeywords: ['Infosys', 'INFY', 'IT', 'tech', 'exporter'],
    simulatedScoreDelta: -3,
    simulatedMtmImpact: '-₹9,400 short-term earnings revision impact',
    causalChain: {
      cause: 'US enterprise software budgets contracted by 4.2% quarter-on-quarter.',
      mechanism: 'You hold 150 units of Infosys Ltd (₹1,85,600 — 9.8% of portfolio value).',
      impact: 'Short-term margin compression may delay near-term stock price recovery, though USD revenue hedging offers downside protection.'
    }
  },
  {
    id: 'news-wheat-harvest-control',
    headline: 'Global Wheat Harvest Reaches Record High in Q2 2026 Following Favorable Monsoon Conditions',
    source: 'AgriBusiness Today • 4 hours ago',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: 'general_economy',
    summary: 'Bumper grain yields across Punjab and Madhya Pradesh stabilize domestic FMCG raw material costs.',
    targetKeywords: ['wheat', 'grain', 'agriculture', 'fmcg', 'monsoon'],
    simulatedScoreDelta: 0,
    simulatedMtmImpact: 'No direct impact on holdings',
    causalChain: {
      cause: 'Bumper agricultural grain yield.',
      mechanism: 'Your portfolio contains no direct agricultural commodity futures or standalone FMCG grain processors.',
      impact: 'Zero direct portfolio impact — automatically filtered out by VestIQ Guardian relevance engine.'
    }
  }
];

/**
 * Core Guardian Relevance Engine:
 * Scans a user's holdings against market news events.
 * Filters out irrelevant stories, computes affected holdings, and generates structured GuardianAlerts.
 */
function buildDynamicReasoning(holdingNames: string[], news: NewsEvent): { mechanism: string; impact: string } {
  const names = holdingNames.length > 0 ? holdingNames : ['your portfolio'];
  const namedHoldings = names.join(', ');

  const mechanism = `Your portfolio currently includes ${namedHoldings}. These holdings match the ${news.category} signal and can transmit the market event into your asset mix.`;
  const impact = `This could shift the risk profile for ${namedHoldings} based on the current market condition, without implying a fixed rupee outcome for a non-uploaded or demo portfolio.`;

  return { mechanism, impact };
}

export function scanPortfolioForEvents(
  holdings: HoldingItem[],
  newsEvents: NewsEvent[] = SEED_NEWS_EVENTS
): { alerts: GuardianAlert[]; scannedCount: number; filteredOutCount: number } {
  if (!holdings || holdings.length === 0) {
    return { alerts: [], scannedCount: 0, filteredOutCount: 0 };
  }

  const alerts: GuardianAlert[] = [];
  let filteredOutCount = 0;

  for (const news of newsEvents) {
    // Relevance matching logic
    const matchingHoldings = holdings.filter(h => {
      // 1. Category match
      if (news.targetCategories && news.targetCategories.includes(h.category)) {
        return true;
      }
      // 2. Ticker match
      if (news.targetTickers && news.targetTickers.includes(h.ticker.toUpperCase())) {
        return true;
      }
      // 3. Keyword match in name or ticker
      if (news.targetKeywords && news.targetKeywords.length > 0) {
        const textToSearch = `${h.name} ${h.ticker} ${h.broker} ${h.category}`.toLowerCase();
        return news.targetKeywords.some(kw => textToSearch.includes(kw.toLowerCase()));
      }
      return false;
    });

    // Filtering out irrelevant news (e.g. wheat harvest story)
    if (matchingHoldings.length === 0) {
      filteredOutCount++;
      continue;
    }

    // Determine severity based on score delta
    let severity: 'high' | 'medium' | 'low' = 'low';
    if (Math.abs(news.simulatedScoreDelta) >= 6) severity = 'high';
    else if (Math.abs(news.simulatedScoreDelta) >= 3) severity = 'medium';

    const dynamicReasoning = buildDynamicReasoning(
      matchingHoldings.map(h => h.name),
      news
    );

    const alert: GuardianAlert = {
      id: `ga-${news.id}-${Date.now()}`,
      userId: 'user_1',
      newsId: news.id,
      newsHeadline: news.headline,
      newsSource: news.source,
      publishedAt: news.publishedAt,
      relevantHoldings: matchingHoldings.map(h => ({
        id: h.id,
        name: h.name,
        ticker: h.ticker,
        category: h.category
      })),
      severity,
      estimatedImpactScore: news.simulatedScoreDelta,
      estimatedImpactValue: news.simulatedMtmImpact,
      reasoningChain: {
        cause: news.causalChain.cause,
        mechanism: dynamicReasoning.mechanism,
        impact: dynamicReasoning.impact,
      },
      status: 'unread',
      createdAt: new Date().toISOString()
    };

    alerts.push(alert);
  }

  return {
    alerts,
    scannedCount: newsEvents.length,
    filteredOutCount
  };
}
