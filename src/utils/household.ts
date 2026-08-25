import type { HoldingItem } from '../types';

export interface HouseholdLink {
  id: string;
  user_id_a: string;
  user_id_b?: string;
  user_a_email: string;
  user_b_email: string;
  status: 'pending' | 'accepted' | 'revoked';
  requested_by: string;
  requested_at: string;
  accepted_at?: string;
  share_holdings_a: boolean;
  share_holdings_b: boolean;
  // Partner data attached for combined calculations
  partner_name?: string;
  partner_total_value?: number;
  partner_equities?: number;
  partner_bonds?: number;
  partner_reits?: number;
  partner_cash?: number;
  partner_holdings?: HoldingItem[];
}

export interface CombinedHouseholdSummary {
  myTotalValue: number;
  partnerTotalValue: number;
  combinedTotalValue: number;
  myEquities: number;
  partnerEquities: number;
  combinedEquities: number;
  myBonds: number;
  partnerBonds: number;
  combinedBonds: number;
  myReits: number;
  partnerReits: number;
  combinedReits: number;
  myCash: number;
  partnerCash: number;
  combinedCash: number;
  equitiesPct: number;
  bondsPct: number;
  reitsPct: number;
  cashPct: number;
  canViewPartnerHoldings: boolean;
  partnerName: string;
  partnerEmail: string;
}

/**
 * Standard default demo partner portfolio for sample / demo testing.
 */
export const DEFAULT_DEMO_PARTNER = {
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  totalValue: 1850000,
  equities: 1000000,
  bonds: 550000,
  reits: 300000,
  cash: 0,
};

/**
 * Computes combined portfolio totals and allocation percentages.
 * Adheres strictly to the privacy rule: partner holding-level items are only
 * exposed if BOTH share_holdings_a and share_holdings_b are explicitly true.
 */
export function computeCombinedHouseholdSummary(
  myHoldings: HoldingItem[],
  link: HouseholdLink
): CombinedHouseholdSummary {
  const myEquities = myHoldings
    .filter((h) => h.category === 'equities')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const myBonds = myHoldings
    .filter((h) => h.category === 'bonds')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const myReits = myHoldings
    .filter((h) => h.category === 'reits_invits')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const myCash = myHoldings
    .filter((h) => h.category === 'cash')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const myTotalValue = myEquities + myBonds + myReits + myCash;

  const partnerEquities = link.partner_equities ?? DEFAULT_DEMO_PARTNER.equities;
  const partnerBonds = link.partner_bonds ?? DEFAULT_DEMO_PARTNER.bonds;
  const partnerReits = link.partner_reits ?? DEFAULT_DEMO_PARTNER.reits;
  const partnerCash = link.partner_cash ?? DEFAULT_DEMO_PARTNER.cash;
  const partnerTotalValue = link.partner_total_value ?? (partnerEquities + partnerBonds + partnerReits + partnerCash);

  const combinedEquities = myEquities + partnerEquities;
  const combinedBonds = myBonds + partnerBonds;
  const combinedReits = myReits + partnerReits;
  const combinedCash = myCash + partnerCash;
  const combinedTotalValue = myTotalValue + partnerTotalValue;

  const equitiesPct = combinedTotalValue > 0 ? Number(((combinedEquities / combinedTotalValue) * 100).toFixed(1)) : 0;
  const bondsPct = combinedTotalValue > 0 ? Number(((combinedBonds / combinedTotalValue) * 100).toFixed(1)) : 0;
  const reitsPct = combinedTotalValue > 0 ? Number(((combinedReits / combinedTotalValue) * 100).toFixed(1)) : 0;
  const cashPct = combinedTotalValue > 0 ? Number(((combinedCash / combinedTotalValue) * 100).toFixed(1)) : 0;

  // Mutual consent boundary check: only true if both opted in
  const canViewPartnerHoldings = Boolean(link.share_holdings_a && link.share_holdings_b);

  return {
    myTotalValue,
    partnerTotalValue,
    combinedTotalValue,
    myEquities,
    partnerEquities,
    combinedEquities,
    myBonds,
    partnerBonds,
    combinedBonds,
    myReits,
    partnerReits,
    combinedReits,
    myCash,
    partnerCash,
    combinedCash,
    equitiesPct,
    bondsPct,
    reitsPct,
    cashPct,
    canViewPartnerHoldings,
    partnerName: link.partner_name || DEFAULT_DEMO_PARTNER.name,
    partnerEmail: link.user_b_email || DEFAULT_DEMO_PARTNER.email,
  };
}
