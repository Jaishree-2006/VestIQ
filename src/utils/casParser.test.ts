import { describe, it, expect, vi } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn()
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn()
}));

import { parseCasText, CasParsingError } from './casParser';

describe('parseCasText Parser', () => {
  it('throws a typed CasParsingError when passed empty or invalid text input', () => {
    expect(() => parseCasText('', 'corrupted.pdf')).toThrowError(CasParsingError);
    expect(() => parseCasText('   ', 'empty.pdf')).toThrowError(CasParsingError);
    expect(() => parseCasText(null as any, 'invalid.pdf')).toThrowError(CasParsingError);
  });

  it('includes the filename and clear message in CasParsingError', () => {
    try {
      parseCasText('', 'bad_file.pdf');
      expect.fail('Should have thrown CasParsingError');
    } catch (err) {
      expect(err).toBeInstanceOf(CasParsingError);
      expect((err as CasParsingError).message).toContain('bad_file.pdf');
    }
  });

  it('successfully parses valid CAS text input for sample file', () => {
    const validText = `PRIYA SHARMA PAN: ABCDE1234F Statement Period: 01-Jan-2026 to 30-Jun-2026 Reliance Industries Ltd HDFC Bank Ltd PFC 7.35% NCD 2029 18,92,882.14`;
    const result = parseCasText(validText, 'sample_cas.pdf');
    expect(result.investorName).toBe('Priya Sharma');
    expect(result.pan).toBe('ABCDE1234F');
    expect(result.parsedHoldings.length).toBe(7);
    expect(result.totalAssets).toBe(1892882);
  });

  it('accurately parses Felix D\'Souza CAS text without falling back to Priya Sharma', () => {
    const felixText = `
      Consolidated Account Statement
      Investor Name : FELIX D'SOUZA
      PAN : FXDSZ7890K
      Statement Period: 01-Apr-2025 to 31-Mar-2026

      Demutualised / Depository Holdings (Groww - Nextbillion Technology)
      TCS LTD INE467B01029  100  3800  380000.00
      INFOSYS LTD INE009A01021  150  1450  217500.00

      Depository Holdings (Upstox - RKSV Securities)
      HDFC BANK LTD INE040A01034  150  1600  240000.00

      Government Securities (RBI Retail Direct)
      7.18% GS 2033 IN0020230085  2500  100  250000.00

      Relationship Manager - Axis Bank Advisory
      AXIS DYNAMIC BOND FUND INF846K01164  10000  28.59  285900.00
    `;

    const result = parseCasText(felixText, 'felix_dsouza_cas.pdf');
    expect(result.investorName).toBe("FELIX D'SOUZA");
    expect(result.pan).toBe('FXDSZ7890K');
    expect(result.totalAssets).toBe(1373400);
    expect(result.holdingsCount).toBe(5);
    expect(result.detectedBrokers).toContain('Groww');
    expect(result.detectedBrokers).toContain('Upstox');
    expect(result.detectedBrokers).toContain('RBI Retail Direct');
    expect(result.detectedBrokers).toContain('Relationship Manager - Axis');
    // Ensure no leakage of Priya Sharma data
    expect(result.investorName).not.toBe('Priya Sharma');
    expect(result.pan).not.toBe('ABCDE1234F');
    expect(result.totalAssets).not.toBe(1892882);
  });
});

