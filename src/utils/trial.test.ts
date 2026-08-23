import { describe, it, expect } from 'vitest';
import { hasActivePremiumAccess, trialDaysRemaining, makeTrialEndsAt } from './trial';
import type { UserRecord } from './trial';

// ─── hasActivePremiumAccess ───────────────────────────────────────────────────

describe('hasActivePremiumAccess', () => {
  it('returns true for a paid premium user regardless of trial fields', () => {
    const user: UserRecord = { plan: 'premium' };
    expect(hasActivePremiumAccess(user)).toBe(true);
  });

  it('returns false for a free user', () => {
    const user: UserRecord = { plan: 'free' };
    expect(hasActivePremiumAccess(user)).toBe(false);
  });

  // Req 8a: trialEndsAt in the past → false
  it('returns false for premium_trial with trialEndsAt in the past', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // yesterday
    const user: UserRecord = { plan: 'premium_trial', trialEndsAt: pastDate };
    expect(hasActivePremiumAccess(user)).toBe(false);
  });

  // Req 8b: trialEndsAt in the future → true
  it('returns true for premium_trial with trialEndsAt in the future', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days ahead
    const user: UserRecord = { plan: 'premium_trial', trialEndsAt: futureDate };
    expect(hasActivePremiumAccess(user)).toBe(true);
  });

  it('returns false for premium_trial when trialEndsAt is missing', () => {
    const user: UserRecord = { plan: 'premium_trial' };
    expect(hasActivePremiumAccess(user)).toBe(false);
  });

  it('returns false for premium_trial exactly at the expiry millisecond', () => {
    // Set trialEndsAt to a time definitely in the past by a tiny margin
    const justExpired = new Date(Date.now() - 1).toISOString();
    const user: UserRecord = { plan: 'premium_trial', trialEndsAt: justExpired };
    expect(hasActivePremiumAccess(user)).toBe(false);
  });
});

// ─── trialDaysRemaining ───────────────────────────────────────────────────────

describe('trialDaysRemaining', () => {
  it('returns null for a free user', () => {
    expect(trialDaysRemaining({ plan: 'free' })).toBeNull();
  });

  it('returns null for a paid premium user', () => {
    expect(trialDaysRemaining({ plan: 'premium' })).toBeNull();
  });

  it('returns 0 for an expired trial', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    expect(trialDaysRemaining({ plan: 'premium_trial', trialEndsAt: past })).toBe(0);
  });

  it('returns ~13 days for a trial that started today (14-day trial, ≈13 whole days left)', () => {
    const endsAt = makeTrialEndsAt(); // 14 days from now
    const days = trialDaysRemaining({ plan: 'premium_trial', trialEndsAt: endsAt });
    // Should be 13 (floor) because we're a few ms into the first day
    expect(days).toBeGreaterThanOrEqual(13);
    expect(days).toBeLessThanOrEqual(14);
  });
});

// ─── makeTrialEndsAt ─────────────────────────────────────────────────────────

describe('makeTrialEndsAt', () => {
  it('returns a date 14 days in the future from now', () => {
    const before = Date.now();
    const endsAt = new Date(makeTrialEndsAt()).getTime();
    const after = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    expect(endsAt).toBeGreaterThanOrEqual(before + fourteenDaysMs);
    expect(endsAt).toBeLessThanOrEqual(after + fourteenDaysMs + 100);
  });

  it('uses a provided base date', () => {
    const base = new Date('2026-01-01T00:00:00.000Z');
    const result = makeTrialEndsAt(base);
    expect(result).toBe('2026-01-15T00:00:00.000Z');
  });
});
