import type { SebiRegValidationResult } from '../types';

/**
 * Validates the syntax/format of a SEBI intermediary or AMFI registration number.
 * 
 * IMPORTANT: This is a SYNTACTIC FORMAT CHECK ONLY, not a live SEBI database verification.
 * It checks prefix adherence and character patterns to catch malformed, placeholder, or missing credentials.
 */
export function validateSebiRegNumber(regNumber?: string | null): SebiRegValidationResult {
  if (!regNumber || !regNumber.trim()) {
    return {
      isValid: false,
      regNumber: '',
      status: 'missing',
      explanation: "No SEBI registration number recorded for this broker / RM — verify their credentials before proceeding. (Format check only · Not a live registry verification)",
    };
  }

  const cleaned = regNumber.trim().toUpperCase();

  // Known standard SEBI prefixes:
  // INZ: Stock Broker (e.g. INZ000031633)
  // INA: Investment Adviser / RIA (e.g. INA000012345)
  // INH: Research Analyst (e.g. INH000005678)
  // INP: Portfolio Manager / PMS (e.g. INP000007890)
  // INM: Merchant Banker (e.g. INM000011223)
  // INF: Mutual Fund / Asset Management Company (e.g. INF000001234)
  // ARN: AMFI Mutual Fund Distributor (e.g. ARN-123456 or ARN123456)
  
  const sebiPattern = /^(INZ|INA|INH|INP|INM|INF)[0-9]{8,10}$/;
  const arnPattern = /^ARN-?[0-9]{4,8}$/;

  if (sebiPattern.test(cleaned)) {
    const prefix = cleaned.substring(0, 3);
    const typeMap: Record<string, string> = {
      INZ: 'Stock Broker',
      INA: 'Investment Adviser (RIA)',
      INH: 'Research Analyst',
      INP: 'Portfolio Manager (PMS)',
      INM: 'Merchant Banker',
      INF: 'Mutual Fund AMC',
    };
    const intermediaryType = typeMap[prefix] || 'SEBI Intermediary';
    return {
      isValid: true,
      regNumber: cleaned,
      prefix,
      intermediaryType,
      status: 'valid_format',
      explanation: `Valid SEBI ${intermediaryType} format (${prefix} + digits). (Format check only · Not a live registry verification)`,
    };
  }

  if (arnPattern.test(cleaned)) {
    return {
      isValid: true,
      regNumber: cleaned.startsWith('ARN-') ? cleaned : `ARN-${cleaned.substring(3)}`,
      prefix: 'ARN',
      intermediaryType: 'AMFI Mutual Fund Distributor',
      status: 'valid_format',
      explanation: "Valid AMFI MFD Registration format (ARN + digits). (Format check only · Not a live registry verification)",
    };
  }

  return {
    isValid: false,
    regNumber: cleaned,
    status: 'invalid_format',
    explanation: "This RM's registration number doesn't match a recognized SEBI format — verify their credentials before proceeding. (Format check only · Not a live registry verification)",
  };
}
