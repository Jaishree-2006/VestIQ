export interface SebiValidationResult {
  isValid: boolean;
  regNumber: string;
  prefix?: string;
  intermediaryType?: string;
  statusLabel: string;
  explanation: string;
  isFormatOnlyNote: string;
}

const SEBI_PREFIXES: Record<string, string> = {
  INZ: 'Stock Broker',
  INA: 'Investment Adviser (RIA)',
  INH: 'Research Analyst',
  INP: 'Portfolio Manager (PMS)',
  INF: 'Mutual Fund AMC',
  INM: 'Merchant Banker',
  INR: 'Registrar & Transfer Agent (RTA)',
};

/**
 * Validates whether a SEBI registration number matches the standard format.
 * Format: 3-letter valid prefix (INZ, INA, INH, INP, INF, INM, INR) followed by 6 to 10 digits.
 * NOTE: This is a format validation check only and does not perform a live SEBI portal query.
 */
export function validateSebiRegistrationFormat(regNumber?: string | null): SebiValidationResult {
  const isFormatOnlyNote = 'Format check only — not a live SEBI portal verification';

  if (!regNumber || !regNumber.trim()) {
    return {
      isValid: false,
      regNumber: '',
      statusLabel: 'SEBI Reg Number Missing',
      explanation: "This RM's registration number is missing — verify their credentials before proceeding.",
      isFormatOnlyNote,
    };
  }

  const clean = regNumber.trim().toUpperCase();
  const match = clean.match(/^([A-Z]{3})([0-9]{6,10})$/);

  if (!match) {
    return {
      isValid: false,
      regNumber: clean,
      statusLabel: 'SEBI Format Invalid',
      explanation: "This RM's registration number doesn't match a recognized SEBI format — verify their credentials before proceeding.",
      isFormatOnlyNote,
    };
  }

  const prefix = match[1];
  const intermediaryType = SEBI_PREFIXES[prefix];

  if (!intermediaryType) {
    return {
      isValid: false,
      regNumber: clean,
      prefix,
      statusLabel: `Unrecognized Prefix (${prefix})`,
      explanation: "This RM's registration number doesn't match a recognized SEBI format — verify their credentials before proceeding.",
      isFormatOnlyNote,
    };
  }

  return {
    isValid: true,
    regNumber: clean,
    prefix,
    intermediaryType,
    statusLabel: `SEBI Format Valid (${clean})`,
    explanation: `Recognized format for registered ${intermediaryType}.`,
    isFormatOnlyNote,
  };
}
