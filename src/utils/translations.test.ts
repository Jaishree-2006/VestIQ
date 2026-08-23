import { describe, it, expect } from 'vitest';
import { translateExplanation, getLanguageFontClass } from './translations';

describe('Causal-Chain & Explanation Translation Engine', () => {
  it('returns original English text when language is "en"', () => {
    const enText = '40% concentration in one REIT';
    expect(translateExplanation(enText, 'en')).toBe(enText);
  });

  it('translates exact causal chain phrases into Tamil', () => {
    expect(translateExplanation('40% concentration in one REIT', 'ta'))
      .toBe('ஒரே REIT-ல் 40% செறிவு');

    expect(translateExplanation('rate-sensitive asset class', 'ta'))
      .toBe('வட்டி விகித மாற்றங்களுக்கு அதிக உணர்திறன் கொண்ட சொத்து பிரிவு');

    expect(translateExplanation('-15% estimated value per +1% rate move', 'ta'))
      .toBe('+1% வட்டி விகித உயர்வுக்கு -15% மதிப்பிடப்பட்ட மதிப்பு இழப்பு');
  });

  it('translates dynamic template phrases while preserving holding names and numbers', () => {
    const text = 'Mindspace Business Parks REIT exceeds 20% max concentration limit';
    const translated = translateExplanation(text, 'ta');
    expect(translated).toContain('Mindspace Business Parks REIT');
    expect(translated).toContain('20%');
    expect(translated).toBe('Mindspace Business Parks REIT அதிகபட்ச 20% செறிவு வரம்பை தாண்டியுள்ளது');
  });

  it('translates lock-in horizon mismatch templates', () => {
    const text = 'Grid InvIT is locked in for 36 months while the portfolio may require liquidity sooner.';
    const translated = translateExplanation(text, 'ta');
    expect(translated).toContain('Grid InvIT');
    expect(translated).toContain('36');
    expect(translated).toBe('Grid InvIT 36 மாதங்களுக்கு லாக் செய்யப்பட்டுள்ளது, ஆனால் போர்ட்ஃபோலியோவிற்கு விரைவில் பணப்புழக்கம் தேவைப்படலாம்.');
  });

  it('translates emergency fund adequacy check descriptions', () => {
    const text = 'Your liquid buffer covers ~1.2 months of expenses (below the 3-month safety threshold). Consider this before committing further funds to illiquid instruments like your Grid InvIT.';
    const translated = translateExplanation(text, 'ta');
    expect(translated).toContain('~1.2');
    expect(translated).toContain('Grid InvIT');
    expect(translated).toContain('3 மாத பாதுகாப்பு வரம்பிற்கு கீழ்');
  });

  it('translates Dashboard Health Score breakdown reasons and suggestions', () => {
    const concentrationReason = 'Holdings exceeding 25% threshold: Mindspace Business Parks REIT (32.7% of portfolio). Deducted 6.2 pts (capped at 25).';
    const translatedReason = translateExplanation(concentrationReason, 'ta');
    expect(translatedReason).toContain('Mindspace Business Parks REIT');
    expect(translatedReason).toContain('6.2 புள்ளிகள் கழிக்கப்பட்டன');

    const suggestion = 'Rebalance single holdings above 25% to recover up to 6.2 points.';
    const translatedSuggestion = translateExplanation(suggestion, 'ta');
    expect(translatedSuggestion).toContain('6.2 புள்ளிகளை மீட்டெடுக்கலாம்');

    expect(translateExplanation('Concentration Penalty', 'ta')).toBe('செறிவு அபராதம்');
    expect(translateExplanation('Liquidity Mismatch Penalty', 'ta')).toBe('பணப்புழக்க காலக்கெடு முரண்பாடு அபராதம்');
  });

  it('translates Red Flags titles, descriptions, and remedial actions', () => {
    expect(translateExplanation('3-Year Lock-In Liquidity Mismatch', 'ta')).toBe('3 வருட லாக்-இன் பணப்புழக்க காலக்கெடு முரண்பாடு');
    expect(translateExplanation('Alternate Asset Concentration Risk', 'ta')).toBe('மாற்று சொத்து செறிவு இடர்');

    const casDesc = 'RM mis-sold a 36-month lock-in InvIT (₹4,40,600 — 23.3% of portfolio) despite investor needing liquidity within 12 months.';
    const translatedCasDesc = translateExplanation(casDesc, 'ta');
    expect(translatedCasDesc).toContain('36 மாத லாக்-இன்');
    expect(translatedCasDesc).toContain('₹4,40,600');

    const casAction = 'Request RM secondary market redemption or file a formal complaint through the prescribed channel.';
    expect(translateExplanation(casAction, 'ta')).toBe('உறவு மேலாளரிடம் இரண்டாம் நிலை சந்தை மீட்பைக் கோரவும் அல்லது முறைப்படியான புகார் சேனல் மூலம் புகார் அளிக்கவும்.');
  });

  it('returns appropriate font class based on language', () => {
    expect(getLanguageFontClass('en')).toBe('');
    expect(getLanguageFontClass('ta')).toBe('font-tamil');
  });
});
