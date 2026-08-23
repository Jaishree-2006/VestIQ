import type { HoldingItem, RedFlagAlert, SebiRiskCategory } from '../types';

export interface ScoresComplaintParams {
  flag: RedFlagAlert;
  holding?: HoldingItem;
  investorName: string;
  pan?: string;
  riskCategory?: SebiRiskCategory | null;
}

/**
 * Generate a pre-filled, copyable SEBI SCORES complaint draft from a Red Flag alert.
 */
export function generateScoresComplaintDraft(params: ScoresComplaintParams): string {
  const { flag, holding, investorName, pan, riskCategory } = params;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const maskedPan = pan
    ? `${pan.substring(0, 5)}****${pan.substring(pan.length - 1)}`
    : 'ABCDE****F';

  const brokerName = holding?.broker ? `${holding.broker} (${holding.depository || 'CDSL/NSDL'})` : 'Depository Participant / Intermediary';
  const isin = holding?.ticker || 'N/A';
  const holdingName = holding?.name || flag.holdingName || 'Target Instrument';
  const lockIn = holding?.lockInMonths ? `${holding.lockInMonths} Months Lock-in` : 'None (Liquid)';
  const currentValue = holding?.currentValue ? `₹${holding.currentValue.toLocaleString('en-IN')}` : 'N/A';
  const ruleRef = flag.sebiRuleRef || 'SEBI Master Circular on Product Suitability & Investor Protection Framework';
  const holdingRisk = holding?.riskCategory || 'Moderate';
  const userProfile = riskCategory || 'Moderate';

  return `================================================================================
SEBI SCORES COMPLAINT DRAFT (PRE-FILLED)
Filing Portal: https://scores.sebi.gov.in
Date of Generation: ${today}
================================================================================

1. COMPLAINANT IDENTIFICATION:
--------------------------------------------------------------------------------
Complainant / Investor Name : ${investorName || 'Investor'}
PAN (Masked)                : ${maskedPan}
Assessed Risk Profile       : ${userProfile} (SEBI Riskometer)
Date of Incident / Audit    : ${today}

2. AGAINST ENTITY / INTERMEDIARY DETAILS:
--------------------------------------------------------------------------------
Entity / Intermediary Name  : ${brokerName}
Target Instrument           : ${holdingName}
ISIN / Ticker               : ${isin}
Asset Category              : ${holding?.category ? holding.category.toUpperCase().replace('_', ' / ') : 'MARKET-LINKED ASSET'}
Investment Value (at audit) : ${currentValue}
Lock-in / Liquidity Terms   : ${lockIn}
Instrument Risk Level       : ${holdingRisk} on SEBI Riskometer

3. NATURE OF GRIEVANCE & REGULATORY VIOLATION:
--------------------------------------------------------------------------------
Grievance Category          : Product Suitability Mismatch / Unfair Lock-in / Mis-selling
Regulatory Violation Ref    : ${ruleRef}
Severity Level              : ${(flag.severity || 'medium').toUpperCase()} SEVERITY

4. STATEMENT OF FACTS & MISMATCH DETAILS:
--------------------------------------------------------------------------------
I am formally submitting this grievance regarding improper distribution, horizon mismatch, or unsuitability in respect of my demat account holdings managed via ${brokerName}.

Audit Red Flag Identified:
• Flag Title       : ${flag.title}
• Mismatch Summary : ${flag.description}
• Risk Assessment  : Investor profile is "${userProfile}", but instrument risk rating is "${holdingRisk}".
• Liquidity Terms  : ${lockIn}.

5. REMEDIAL ACTION & RELIEF SOUGHT:
--------------------------------------------------------------------------------
In accordance with SEBI guidelines on product suitability, code of conduct, and fair dealing with retail investors:
1. ${flag.suggestedAction}
2. Immediate investigation into whether mandatory risk-profiling disclosures and horizon suitability checks were complied with prior to trade execution.
3. Waiver of any premature exit penalties or restructuring of this allocation to align with my stated investment horizon and capital preservation needs.

================================================================================
DECLARATION:
The details stated above are factual extracts from my Consolidated Account Statement (CAS) records.
================================================================================`;
}
