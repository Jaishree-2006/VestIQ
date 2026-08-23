import { describe, it, expect } from 'vitest';
import { hasActivePremiumAccess } from './trial';
import type { UserRecord } from './trial';
import { PREMIUM_PAGES, ROLE_PERMISSIONS } from '../types';
import type { PageId, UserRole } from '../types';

describe('Premium Access & Routing Gating Matrix', () => {
  const futureTrialEndsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(); // +10 days
  const pastTrialEndsAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(); // -2 days

  // Scenario 1: Paid Investor Premium (plan === 'premium')
  describe('Account 1: Genuine Paid Subscriber (investor_premium)', () => {
    const userRecord: UserRecord = { plan: 'premium' };
    const role: UserRole = 'investor_premium';

    it('hasActivePremiumAccess returns true', () => {
      expect(hasActivePremiumAccess(userRecord)).toBe(true);
    });

    it('all premium pages are unlocked (not gated)', () => {
      PREMIUM_PAGES.forEach((page) => {
        const isGated = !hasActivePremiumAccess(userRecord);
        expect(isGated).toBe(false);
      });
    });

    it('can access all 4 premium pages', () => {
      const perms = ROLE_PERMISSIONS[role];
      PREMIUM_PAGES.forEach((page) => {
        const canAccess = perms.canAccess.includes(page) || (PREMIUM_PAGES.includes(page) && hasActivePremiumAccess(userRecord));
        expect(canAccess).toBe(true);
      });
    });
  });

  // Scenario 2: Free User on Active 14-day Trial (investor_free + active trial)
  describe('Account 2: Free User with Active Trial (investor_free + future trialEndsAt)', () => {
    const userRecord: UserRecord = { plan: 'premium_trial', trialEndsAt: futureTrialEndsAt };
    const role: UserRole = 'investor_free';

    it('hasActivePremiumAccess returns true for active trial', () => {
      expect(hasActivePremiumAccess(userRecord)).toBe(true);
    });

    it('all 4 premium pages (Shock Sandbox, Peer Benchmark, Retrospective, IPO Screener) are unlocked', () => {
      PREMIUM_PAGES.forEach((page) => {
        const isGated = !hasActivePremiumAccess(userRecord);
        expect(isGated).toBe(false); // Unlocked!
      });
    });

    it('canAccess correctly grants access during active trial', () => {
      const perms = ROLE_PERMISSIONS[role];
      PREMIUM_PAGES.forEach((page) => {
        const canAccess = perms.canAccess.includes(page) || (PREMIUM_PAGES.includes(page) && hasActivePremiumAccess(userRecord));
        expect(canAccess).toBe(true); // Grants access!
      });
    });
  });

  // Scenario 3: Free User with Expired Trial (investor_free + past trialEndsAt)
  describe('Account 3: Free User with Expired Trial (investor_free + past trialEndsAt)', () => {
    const userRecord: UserRecord = { plan: 'premium_trial', trialEndsAt: pastTrialEndsAt };
    const role: UserRole = 'investor_free';

    it('hasActivePremiumAccess returns false for expired trial', () => {
      expect(hasActivePremiumAccess(userRecord)).toBe(false);
    });

    it('all 4 premium pages are gated (shows locked/upgrade card)', () => {
      PREMIUM_PAGES.forEach((page) => {
        const isGated = !hasActivePremiumAccess(userRecord);
        expect(isGated).toBe(true); // Gated -> triggers PremiumGate component!
      });
    });

    it('canAccess denies access when trial is expired', () => {
      const perms = ROLE_PERMISSIONS[role];
      PREMIUM_PAGES.forEach((page) => {
        const canAccess = perms.canAccess.includes(page) || (PREMIUM_PAGES.includes(page) && hasActivePremiumAccess(userRecord));
        expect(canAccess).toBe(false); // Gated!
      });
    });
  });

  // Scenario 4: Standard Free User (never started trial)
  describe('Account 4: Standard Free User without Trial (plan === "free")', () => {
    const userRecord: UserRecord = { plan: 'free' };
    const role: UserRole = 'investor_free';

    it('hasActivePremiumAccess returns false', () => {
      expect(hasActivePremiumAccess(userRecord)).toBe(false);
    });

    it('all premium pages are gated (shows upgrade prompt)', () => {
      PREMIUM_PAGES.forEach((page) => {
        const isGated = !hasActivePremiumAccess(userRecord);
        expect(isGated).toBe(true); // Gated -> triggers PremiumGate component!
      });
    });
  });

  // Scenario 5: Demo Personas (Compliance Officer, Broker / RM, Admin)
  describe('Demo Personas Role Matrix', () => {
    it('Compliance Officer has access to compliance dashboard and settings', () => {
      const perms = ROLE_PERMISSIONS['compliance_officer'];
      expect(perms.canAccess).toContain('compliance');
      expect(perms.canAccess).toContain('settings');
      expect(perms.defaultLandingPage).toBe('compliance');
    });

    it('Broker / RM has access to broker console and settings', () => {
      const perms = ROLE_PERMISSIONS['broker_rm'];
      expect(perms.canAccess).toContain('broker-console');
      expect(perms.canAccess).toContain('settings');
      expect(perms.defaultLandingPage).toBe('broker-console');
    });

    it('Platform Admin has access to admin panel and settings', () => {
      const perms = ROLE_PERMISSIONS['admin'];
      expect(perms.canAccess).toContain('admin');
      expect(perms.canAccess).toContain('settings');
      expect(perms.defaultLandingPage).toBe('admin');
    });
  });
});
