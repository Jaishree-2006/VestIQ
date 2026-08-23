import { describe, it, expect } from 'vitest';
import { validateSebiRegNumber } from './sebiRegValidator';

describe('SEBI Registration Format Validator', () => {
  it('validates stock broker registration numbers (INZ prefix)', () => {
    const result = validateSebiRegNumber('INZ000031633');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('valid_format');
    expect(result.prefix).toBe('INZ');
    expect(result.intermediaryType).toBe('Stock Broker');
    expect(result.explanation).toContain('Valid SEBI Stock Broker format');
  });

  it('validates RIA investment adviser registration numbers (INA prefix)', () => {
    const result = validateSebiRegNumber('INA000012345');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('valid_format');
    expect(result.prefix).toBe('INA');
    expect(result.intermediaryType).toBe('Investment Adviser (RIA)');
  });

  it('validates research analyst registration numbers (INH prefix)', () => {
    const result = validateSebiRegNumber('INH000005678');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('valid_format');
    expect(result.prefix).toBe('INH');
    expect(result.intermediaryType).toBe('Research Analyst');
  });

  it('validates AMFI mutual fund distributor registration numbers (ARN prefix)', () => {
    const result = validateSebiRegNumber('ARN-118253');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('valid_format');
    expect(result.prefix).toBe('ARN');
    expect(result.intermediaryType).toBe('AMFI Mutual Fund Distributor');
  });

  it('flags malformed or unrecognized registration numbers', () => {
    const result = validateSebiRegNumber('INVALID_REG_123');
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('invalid_format');
    expect(result.explanation).toContain("doesn't match a recognized SEBI format");
    expect(result.explanation).toContain("Format check only · Not a live registry verification");
  });

  it('handles missing or empty registration numbers gracefully', () => {
    const resultNull = validateSebiRegNumber(null);
    expect(resultNull.isValid).toBe(false);
    expect(resultNull.status).toBe('missing');
    expect(resultNull.explanation).toContain('No SEBI registration number recorded');

    const resultEmpty = validateSebiRegNumber('');
    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.status).toBe('missing');
  });
});
