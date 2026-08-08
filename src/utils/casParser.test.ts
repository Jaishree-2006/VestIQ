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

  it('successfully parses valid CAS text input', () => {
    const validText = `PRIYA SHARMA PAN: ABCDE1234F Statement Period: 01-Jan-2026 to 30-Jun-2026 Reliance Industries Ltd HDFC Bank Ltd PFC 7.35% NCD 2029 18,92,882.14`;
    const result = parseCasText(validText, 'sample.pdf');
    expect(result.investorName).toBe('Priya Sharma');
    expect(result.pan).toBe('ABCDE1234F');
    expect(result.parsedHoldings.length).toBeGreaterThan(0);
  });
});

