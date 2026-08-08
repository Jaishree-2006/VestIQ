/**
 * Trial access helpers — single source of truth for premium access decisions.
 *
 * Rule: never mutate the stored plan field when a trial expires.
 * Access status is always computed live from this module.
 */

export type UserPlan = 'free' | 'premium_trial' | 'premium';

export interface UserRecord {
  plan: UserPlan;
  /** ISO-8601 string, only present when plan === 'premium_trial' */
  trialEndsAt?: string;
}

/**
 * Returns true if the user has active premium access right now.
 *
 *  - plan === 'premium'       → always true (paid subscriber)
 *  - plan === 'premium_trial' → true only if trialEndsAt is in the future
 *  - plan === 'free'          → always false
 *
 * This is the ONE place that performs the date comparison. All callers
 * must route through here; do not duplicate `Date.now() > trialEndsAt`
 * comparisons elsewhere.
 */
export function hasActivePremiumAccess(user: UserRecord): boolean {
  if (user.plan === 'premium') return true;
  if (user.plan === 'premium_trial') {
    if (!user.trialEndsAt) return false;
    return new Date(user.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

/**
 * Returns the number of whole days remaining in the trial (floor).
 * Returns 0 if the trial has expired or is not a trial user.
 * Returns null if the user is not on a trial plan.
 */
export function trialDaysRemaining(user: UserRecord): number | null {
  if (user.plan !== 'premium_trial' || !user.trialEndsAt) return null;
  const msLeft = new Date(user.trialEndsAt).getTime() - Date.now();
  if (msLeft <= 0) return 0;
  return Math.floor(msLeft / (1000 * 60 * 60 * 24));
}

/**
 * Returns the ISO-8601 string for 14 days from a given date.
 * Defaults to Date.now() when no base is provided.
 */
export function makeTrialEndsAt(base: Date = new Date()): string {
  const end = new Date(base);
  end.setDate(end.getDate() + 14);
  return end.toISOString();
}
