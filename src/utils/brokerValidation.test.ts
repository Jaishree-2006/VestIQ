import { describe, it, expect } from 'vitest';
import { validateSebiRegistrationFormat } from './brokerValidation';

describe('SEBI Registration Number Format Validator', () => {
  it('validates recognized Stock Broker format (INZ prefix + digits)', () => {
    const res = validateSebiRegistrationFormat('INZ000031633');
    expect(res.isValid).toBe(true);
    expect(res.prefix).toBe('INZ');
    expect(res.intermediaryType).toBe('Stock Broker');
    expect(res.statusLabel).toContain('SEBI Format Valid (INZ000031633)');
  });

  it('validates recognized Investment Adviser format (INA prefix + digits)', () => {
    const res = validateSebiRegistrationFormat('INA000012345');
    expect(res.isValid).toBe(true);
    expect(res.prefix).toBe('INA');
    expect(res.intermediaryType).toBe('Investment Adviser (RIA)');
  });

  it('validates recognized Mutual Fund AMC format (INF prefix + digits)', () => {
    const res = validateSebiRegistrationFormat('INF109K012R6'); // alphanumeric AMC code normalized
    // If testing strict alphanumeric vs digits
    const resStandard = validateSebiRegistrationFormat('INF000012345');
    expect(resStandard.isValid).toBe(true);
    expect(resStandard.prefix).toBe('INF');
  });

  it('flags clearly malformed registration numbers with red status and explanation', () => {
    const res = validateSebiRegistrationFormat('RM-ICICI-9821');
    expect(res.isValid).toBe(false);
    expect(res.statusLabel).toBe('SEBI Format Invalid');
    expect(res.explanation).toContain("This RM's registration number doesn't match a recognized SEBI format — verify their credentials before proceeding.");
    expect(res.isFormatOnlyNote).toContain('Format check only');
  });

  it('handles null, undefined, or empty strings gracefully', () => {
    const resEmpty = validateSebiRegistrationFormat('');
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.statusLabel).toBe('SEBI Reg Number Missing');

    const resNull = validateSebiRegistrationFormat(null);
    expect(resNull.isValid).toBe(false);
    expect(resNull.statusLabel).toBe('SEBI Reg Number Missing');
  });

  it('flags invalid/unrecognized 3-letter prefixes', () => {
    const res = validateSebiRegistrationFormat('XYZ1234567');
    expect(res.isValid).toBe(false);
    expect(res.statusLabel).toContain('Unrecognized Prefix');
    expect(res.explanation).toContain("verify their credentials before proceeding");
  });
});
