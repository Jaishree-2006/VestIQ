import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { PageId, UserRole, HoldingItem, RedFlagAlert, CasParseResult, AuditLogEntry, AssetCategory, HealthScoreBreakdown, HealthScoreThresholds, SuitabilityReportRecord, HealthScoreEvent, HealthScoreTriggerType, GuardianAlert, AccountNomineeStatus, SebiRiskCategory, RiskProfilerAnswers, HouseholdLink, HouseholdPartnerSummary } from '../types';
import { ROLE_PERMISSIONS, DEFAULT_HEALTH_SCORE_THRESHOLDS, PREMIUM_PAGES } from '../types';
import { INITIAL_HOLDINGS, MOCK_RED_FLAGS, MOCK_SUITABILITY_REPORTS, MOCK_CLIENTS, MOCK_HEALTH_SCORE_EVENTS } from '../data/mockData';
import { computeHealthScorePreview } from '../utils/healthScore';
import { scanPortfolioForEvents, SEED_NEWS_EVENTS } from '../utils/portfolioGuardianEngine';
import type { UserRecord } from '../utils/trial';
import { hasActivePremiumAccess, trialDaysRemaining, makeTrialEndsAt } from '../utils/trial';
import { supabase } from '../lib/supabaseClient';
import { validateCasFile } from '../utils/casFileValidation';
import { extractTextFromPdf, parseCasText } from '../utils/casParser';
import { deriveRedFlagsFromHoldings } from '../utils/redFlags';
import { computeSebiRiskCategory } from '../utils/riskProfiler';
import { computePartnerSummary, SAMPLE_PARTNER_HOLDINGS } from '../utils/household';

interface AppContextType {
  // Routing
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  navigateTo: (page: PageId) => void; // RBAC-enforced navigation

  // Role & Permissions
  role: UserRole;
  setRole: (role: UserRole) => void;
  canAccess: (page: PageId) => boolean;
  isPremiumGated: (page: PageId) => boolean;

  // Trial & Plan Management
  userRecord: UserRecord;
  setUserRecord: (user: UserRecord) => void;
  startFreeTrial: () => void;
  hasActivePremiumAccess: boolean;
  trialDaysRemaining: number | null;

  // Portfolio
  holdings: HoldingItem[];
  redFlags: RedFlagAlert[];
  healthScore: number;
  healthScoreBreakdown: HealthScoreBreakdown;
  healthScoreThresholds: HealthScoreThresholds;
  setHealthScoreThresholds: (t: HealthScoreThresholds) => void;
  explainMode: 'simple' | 'technical';
  setExplainMode: (mode: 'simple' | 'technical') => void;

  // Shock Sandbox
  interestRateChange: number;
  setInterestRateChange: (v: number) => void;
  marketCrashPct: number;
  setMarketCrashPct: (v: number) => void;

  // CAS Upload
  uploadedCas: CasParseResult | null;
  /**
   * isDemoMode is true whenever the current holdings/redFlags in React state
   * came from a sample/demo upload (string filename), NOT from a real user
   * CAS file. When isDemoMode is true, NOTHING is ever written to user_portfolios.
   */
  isDemoMode: boolean;
  handleCasUpload: (fileOrName: File | string, options?: { onProgress?: (progress: number, message: string) => void }) => Promise<{ source: 'server' | 'client'; error?: string }>;
  cancelCasUpload: () => void;
  resetPortfolio: () => Promise<void>;

  // Onboarding
  showOnboarding: boolean;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;
  // Auth state & Supabase Session
  user: any | null;
  session: any | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  userName: string;
  login: (name: string) => void;
  logout: () => void;
  signOut: () => Promise<void>;

  // Audit Log (for Compliance Officer & Admin drill-down)
  auditLog: AuditLogEntry[];
  logComplianceDrillDown: (clientId: string, clientName: string, reason: string) => void;
  logAuditAction: (action: AuditLogEntry['action'], entityId: string, entityName: string, reason?: string) => void;

  // Compliance-specific: PII visibility
  compliancePiiRevealed: string[]; // list of clientIds that have been explicitly un-masked
  revealClientPii: (clientId: string, clientName: string, reason: string) => void;
  maskClientPii: (clientId: string) => void;

  // Suitability Reports (internal compliance workflow)
  suitabilityReports: SuitabilityReportRecord[];
  generateSuitabilityReport: (clientId: string, generatedBy: string) => SuitabilityReportRecord | null;
  acknowledgeReport: (reportId: string, acknowledgedBy: string) => void;

  // Portfolio Story & Health Score Timeline Events
  healthScoreEvents: HealthScoreEvent[];
  recordHealthScoreEvent: (triggerType: HealthScoreTriggerType, previousScore: number, newScore: number, customReason?: string) => void;

  // Portfolio Guardian Proactive Agent State
  guardianAlerts: GuardianAlert[];
  unreadGuardianCount: number;
  isGuardianScanning: boolean;
  triggerGuardianScan: () => Promise<{ alerts: GuardianAlert[]; filteredOutCount: number }>;
  markAlertRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;

  // Nominee & Estate Readiness
  nomineeStatuses: AccountNomineeStatus[];
  setNomineeStatus: (broker: string, value: boolean | null) => void;
  nomineeStats: {
    confirmed: number;
    missing: number;
    unset: number;
    total: number;
    brokers: AccountNomineeStatus[];
    firstMissingHoldingName: string | null;
  };

  // SEBI Risk Profiler
  riskCategory: SebiRiskCategory | null;
  riskProfilerAnswers: Partial<RiskProfilerAnswers>;
  setRiskProfile: (category: SebiRiskCategory | null, answers?: Partial<RiskProfilerAnswers>) => void;

  // Emergency Fund Adequacy
  monthlyExpensesEstimate: number | null;
  setMonthlyExpensesEstimate: (val: number | null) => void;

  // Household / Family View
  householdLink: HouseholdLink | null;
  householdPartnerSummary: HouseholdPartnerSummary | null;
  isHouseholdViewActive: boolean;
  setIsHouseholdViewActive: (active: boolean) => void;
  requestHouseholdLink: (partnerEmail: string) => Promise<{ success: boolean; error?: string }>;
  acceptHouseholdLink: (linkId: string) => Promise<{ success: boolean; error?: string }>;
  revokeHouseholdLink: () => Promise<void>;
  toggleShareDetails: (share: boolean) => Promise<void>;

  // Language Preference
  preferredLanguage: 'en' | 'ta';
  setPreferredLanguage: (lang: 'en' | 'ta') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [role, setRoleInternal] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vestiq_demo_role');
      if (saved) return saved as UserRole;
    }
    return 'investor_free';
  });
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlagAlert[]>([]);
  const [explainMode, setExplainMode] = useState<'simple' | 'technical'>('simple');
  const [healthScoreThresholds, setHealthScoreThresholdsState] = useState<HealthScoreThresholds>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vestiq_health_thresholds');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return DEFAULT_HEALTH_SCORE_THRESHOLDS;
  });

  const setHealthScoreThresholds = useCallback((next: HealthScoreThresholds) => {
    setHealthScoreThresholdsState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vestiq_health_thresholds', JSON.stringify(next));
    }
  }, []);
  const [interestRateChange, setInterestRateChange] = useState<number>(1.0);
  const [marketCrashPct, setMarketCrashPct] = useState<number>(0);
  const [uploadedCas, setUploadedCas] = useState<CasParseResult | null>(null);
  /**
   * isDemoMode: true whenever holdings/redFlags in React state came from a
   * sample/demo upload (string filename passed to handleCasUpload) rather than
   * a genuine authenticated user CAS file. NOTHING is written to user_portfolios
   * while this flag is true — it is a defense-in-depth guard on top of the
   * isSampleUpload check already present at each persistence call site.
   */
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Auth state & Supabase Session
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Investor');

  // Helper to persist holdings & red flags to Supabase per user_id with RLS.
  const persistUserPortfolio = useCallback(async (userId: string, newHoldings: HoldingItem[], newRedFlags: RedFlagAlert[]) => {
    if (!userId) return;
    try {
      const totalVal = newHoldings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
      await supabase.from('user_portfolios').upsert({
        user_id: userId,
        holdings: newHoldings,
        red_flags: newRedFlags,
        total_value: totalVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[user_portfolios] DB persistence warning:', err);
    }
  }, []);

  // Session storage client cache helpers — ensures uploaded state survives page navigation
  const savePortfolioCache = useCallback((userId: string, newHoldings: HoldingItem[], newRedFlags: RedFlagAlert[], newCas?: CasParseResult | null) => {
    if (typeof window === 'undefined' || !userId) return;
    try {
      sessionStorage.setItem(`vestiq_portfolio_${userId}`, JSON.stringify({
        holdings: newHoldings,
        redFlags: newRedFlags,
        uploadedCas: newCas ?? null
      }));
    } catch (e) {}
  }, []);

  const loadPortfolioCache = useCallback((userId: string) => {
    if (typeof window === 'undefined' || !userId) return null;
    try {
      const cached = sessionStorage.getItem(`vestiq_portfolio_${userId}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const setAuthState = async (currentSession: any | null) => {
      if (!mounted) return;
      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        const name = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Investor';
        setUserName(name);
        setIsAuthenticated(true);

        // Fetch user plan, trialEndsAt & monthly_expenses_estimate from Supabase profiles table
        try {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('plan, trial_ends_at, monthly_expenses_estimate')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (!profileErr && profileData) {
            if (profileData.plan) {
              const loadedRecord: UserRecord = {
                plan: (profileData.plan as any) || 'free',
                trialEndsAt: profileData.trial_ends_at || undefined,
              };
              setUserRecord(loadedRecord);
              const explicitDemoRole = typeof window !== 'undefined' ? localStorage.getItem('vestiq_demo_role') : null;
              if (!explicitDemoRole) {
                if (hasActivePremiumAccess(loadedRecord)) {
                  setRoleInternal('investor_premium');
                }
              }
              try {
                localStorage.setItem(`vestiq_user_record_${currentUser.id}`, JSON.stringify(loadedRecord));
              } catch (e) {}
            }
            if (profileData.monthly_expenses_estimate !== undefined && profileData.monthly_expenses_estimate !== null) {
              setMonthlyExpensesEstimateState(Number(profileData.monthly_expenses_estimate));
              try {
                localStorage.setItem('vestiq_monthly_expenses_estimate', String(profileData.monthly_expenses_estimate));
              } catch (e) {}
            }
          } else {
            // Local fallback
            const cachedRecord = localStorage.getItem(`vestiq_user_record_${currentUser.id}`);
            if (cachedRecord) {
              try {
                const parsed = JSON.parse(cachedRecord);
                setUserRecord(parsed);
                const explicitDemoRole = typeof window !== 'undefined' ? localStorage.getItem('vestiq_demo_role') : null;
                if (!explicitDemoRole) {
                  if (hasActivePremiumAccess(parsed)) {
                    setRoleInternal('investor_premium');
                  }
                }
              } catch (e) {}
            }
            const cachedExpenses = localStorage.getItem('vestiq_monthly_expenses_estimate');
            if (cachedExpenses !== null && cachedExpenses !== '') {
              const parsed = Number(cachedExpenses);
              if (!isNaN(parsed)) setMonthlyExpensesEstimateState(parsed);
            }
          }
        } catch (profErr) {
          console.warn('Failed to load user profile trial info:', profErr);
        }

        // Fetch user-isolated portfolio from Supabase user_portfolios table.
        try {
          const { data, error } = await supabase
            .from('user_portfolios')
            .select('holdings, red_flags')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (!error && data && Array.isArray(data.holdings) && data.holdings.length > 0) {
            setHoldings(data.holdings);
            setRedFlags(Array.isArray(data.red_flags) ? data.red_flags : []);
            setIsDemoMode(false);
            savePortfolioCache(currentUser.id, data.holdings, Array.isArray(data.red_flags) ? data.red_flags : []);
          } else {
            // Check client cache if DB returned no rows or table does not exist yet
            const cached = loadPortfolioCache(currentUser.id);
            if (cached && Array.isArray(cached.holdings) && cached.holdings.length > 0) {
              setHoldings(cached.holdings);
              setRedFlags(Array.isArray(cached.redFlags) ? cached.redFlags : []);
              if (cached.uploadedCas) setUploadedCas(cached.uploadedCas);
              setIsDemoMode(false);
            } else {
              setHoldings([]);
              setRedFlags([]);
            }
          }
        } catch (fetchErr) {
          console.warn('Failed to load user_portfolios:', fetchErr);
          const cached = loadPortfolioCache(currentUser.id);
          if (cached && Array.isArray(cached.holdings) && cached.holdings.length > 0) {
            setHoldings(cached.holdings);
            setRedFlags(Array.isArray(cached.redFlags) ? cached.redFlags : []);
            if (cached.uploadedCas) setUploadedCas(cached.uploadedCas);
          } else {
            setHoldings([]);
            setRedFlags([]);
          }
        }

        // Fetch household link from Supabase
        try {
          const { data: linkData } = await supabase
            .from('household_links')
            .select('*')
            .or(`user_id_a.eq.${currentUser.id},user_id_b.eq.${currentUser.id}`)
            .neq('status', 'revoked')
            .order('requested_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (linkData) {
            const parsedLink: HouseholdLink = {
              id: linkData.id,
              userIdA: linkData.user_id_a,
              userIdB: linkData.user_id_b,
              status: linkData.status as any,
              requestedBy: linkData.requested_by,
              partnerEmail: linkData.partner_email || 'partner@example.com',
              partnerName: linkData.partner_name || 'Partner',
              shareDetailsA: Boolean(linkData.share_details_a),
              shareDetailsB: Boolean(linkData.share_details_b),
              requestedAt: linkData.requested_at,
              acceptedAt: linkData.accepted_at,
            };
            setHouseholdLinkState(parsedLink);
            try {
              localStorage.setItem('vestiq_household_link', JSON.stringify(parsedLink));
            } catch (e) {}
          }
        } catch (linkErr) {
          console.warn('Failed to load household link from Supabase:', linkErr);
        }
      } else {
        setUserName('Investor');
        setIsAuthenticated(false);
        setIsDemoMode(false);
        setHoldings([]);
        setRedFlags([]);
        setUploadedCas(null);
      }
      setAuthLoading(false);
    };

    const initAuth = async () => {
      try {
        await (supabase.auth as any).getSessionFromUrl?.({ storeSession: true });
      } catch (e) {
        // ignore if not an OAuth callback URL
      }
      try {
        const { data } = await supabase.auth.getSession();
        await setAuthState(data.session);
      } catch {
        await setAuthState(null);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, currentSession) => {
      setAuthState(currentSession);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut failed:', e);
    } finally {
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setUserName('Investor');
      setIsDemoMode(false);
      setHoldings([]);
      setRedFlags([]);
      setUploadedCas(null);
      setCurrentPage('home');
    }
  }, []);

  // Suitability Reports state
  const [suitabilityReports, setSuitabilityReports] = useState<SuitabilityReportRecord[]>(MOCK_SUITABILITY_REPORTS);

function computeEntryHash(prevHash: string, timestamp: string, action: string, targetId: string, officer: string): string {
  const str = `${prevHash}:${timestamp}:${action}:${targetId}:${officer}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, '0')}f4e3d2c1`;
}

  // Audit log state (Compliance Officer & Admin actions with tamper-evident hash-chain)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    {
      id: 'al-seed-2',
      timestamp: '2026-07-30T14:33:10Z',
      officerName: 'Neha Iyer (Compliance)',
      action: 'export_audit_trail',
      targetEntityId: 'org-wide',
      targetEntityName: 'Organization Audit Export',
      reason: 'Monthly SEBI IEPF submission',
      ipAddress: '10.0.1.42',
      previousHash: '0x9a8b7c6d5e4f3a2b',
      hash: '0x4e2d1c0b9a8f7e6d'
    },
    {
      id: 'al-seed-1',
      timestamp: '2026-07-28T09:12:44Z',
      officerName: 'Neha Iyer (Compliance)',
      action: 'drill_into_client',
      targetEntityId: 'c2',
      targetEntityName: 'Priya Sharma',
      reason: 'Investigating high-severity junk bond mis-selling flag',
      ipAddress: '10.0.1.42',
      previousHash: '0x0000000000000000',
      hash: '0x9a8b7c6d5e4f3a2b'
    },
  ]);

  // Compliance PII visibility state — tracks which clients have been explicitly un-masked
  const [compliancePiiRevealed, setCompliancePiiRevealed] = useState<string[]>([]);

  // SEBI Risk Profiler State with localStorage persistence
  const [riskProfilerAnswers, setRiskProfilerAnswersState] = useState<Partial<RiskProfilerAnswers>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_user_risk_answers');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return {};
  });

  const [riskCategory, setRiskCategoryState] = useState<SebiRiskCategory | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_user_risk_category');
        if (saved) return saved as SebiRiskCategory;
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  const setRiskProfile = useCallback((category: SebiRiskCategory | null, answers?: Partial<RiskProfilerAnswers>) => {
    setRiskCategoryState(category);
    if (typeof window !== 'undefined') {
      try {
        if (category) localStorage.setItem('vestiq_user_risk_category', category);
        else localStorage.removeItem('vestiq_user_risk_category');
      } catch (e) { /* ignore */ }
    }
    if (answers) {
      setRiskProfilerAnswersState(answers);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('vestiq_user_risk_answers', JSON.stringify(answers));
        } catch (e) { /* ignore */ }
      }
    }
  }, []);

  // Emergency Fund Adequacy State with localStorage persistence
  const [monthlyExpensesEstimate, setMonthlyExpensesEstimateState] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_monthly_expenses_estimate');
        if (saved !== null && saved !== '') {
          const parsed = Number(saved);
          return isNaN(parsed) ? null : parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  const setMonthlyExpensesEstimate = useCallback((val: number | null) => {
    setMonthlyExpensesEstimateState(val);
    if (typeof window !== 'undefined') {
      try {
        if (val === null) {
          localStorage.removeItem('vestiq_monthly_expenses_estimate');
        } else {
          localStorage.setItem('vestiq_monthly_expenses_estimate', String(val));
        }
      } catch (e) { /* ignore */ }
    }
    if (user?.id) {
      try {
        supabase.from('profiles').upsert({
          id: user.id,
          monthly_expenses_estimate: val,
        }).then(() => {});
      } catch (e) {}
    }
  }, [user]);

  // ── Language Preference State (en / ta) ───────────────────────────────────
  const [preferredLanguage, setPreferredLanguageState] = useState<'en' | 'ta'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_preferred_language');
        if (saved === 'ta' || saved === 'en') return saved;
      } catch (e) {}
    }
    return 'en';
  });

  const setPreferredLanguage = useCallback((lang: 'en' | 'ta') => {
    setPreferredLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vestiq_preferred_language', lang);
      } catch (e) {}
    }
    if (user?.id) {
      try {
        supabase.from('profiles').upsert({
          id: user.id,
          preferred_language: lang,
        }).then(() => {});
      } catch (e) {}
    }
  }, [user]);

  // ── Household / Family View State & Actions ───────────────────────────────
  const [householdLink, setHouseholdLinkState] = useState<HouseholdLink | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_household_link');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [isHouseholdViewActive, setIsHouseholdViewActiveState] = useState<boolean>(false);

  const setIsHouseholdViewActive = useCallback((active: boolean) => {
    if (active && householdLink?.status !== 'accepted') {
      setIsHouseholdViewActiveState(false);
      return;
    }
    setIsHouseholdViewActiveState(active);
  }, [householdLink]);

  const householdPartnerSummary = React.useMemo<HouseholdPartnerSummary | null>(() => {
    if (!householdLink || householdLink.status !== 'accepted') {
      return null;
    }
    const canViewDetails = Boolean(householdLink.shareDetailsA && householdLink.shareDetailsB);
    return computePartnerSummary(
      householdLink.partnerName || 'Partner',
      householdLink.partnerEmail,
      SAMPLE_PARTNER_HOLDINGS,
      canViewDetails
    );
  }, [householdLink]);

  const requestHouseholdLink = useCallback(async (partnerEmail: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = partnerEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (user?.email && trimmed === user.email.toLowerCase()) {
      return { success: false, error: 'You cannot link your own account as a household partner.' };
    }

    const currentUserId = user?.id || 'demo-user-a';
    const partnerName = trimmed
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const newLink: HouseholdLink = {
      id: `link-${Date.now()}`,
      userIdA: currentUserId,
      userIdB: `partner-${trimmed}`,
      status: 'pending',
      requestedBy: currentUserId,
      partnerEmail: trimmed,
      partnerName,
      shareDetailsA: false,
      shareDetailsB: false,
      requestedAt: new Date().toISOString(),
      acceptedAt: null,
    };

    setHouseholdLinkState(newLink);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vestiq_household_link', JSON.stringify(newLink));
      } catch (e) {}
    }

    if (user?.id) {
      try {
        await supabase.from('household_links').insert({
          id: newLink.id.startsWith('link-') ? undefined : newLink.id,
          user_id_a: currentUserId,
          user_id_b: currentUserId,
          status: 'pending',
          requested_by: currentUserId,
          partner_email: trimmed,
          partner_name: partnerName,
        });
      } catch (e) {}
    }

    return { success: true };
  }, [user]);

  const acceptHouseholdLink = useCallback(async (linkId: string): Promise<{ success: boolean; error?: string }> => {
    if (!householdLink) {
      return { success: false, error: 'No active household link found.' };
    }

    const updated: HouseholdLink = {
      ...householdLink,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    };

    setHouseholdLinkState(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vestiq_household_link', JSON.stringify(updated));
      } catch (e) {}
    }

    if (user?.id) {
      try {
        await supabase
          .from('household_links')
          .update({
            status: 'accepted',
            accepted_at: updated.acceptedAt,
          })
          .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`);
      } catch (e) {}
    }

    return { success: true };
  }, [householdLink, user]);

  const revokeHouseholdLink = useCallback(async () => {
    setIsHouseholdViewActiveState(false);
    if (householdLink) {
      const revoked: HouseholdLink = {
        ...householdLink,
        status: 'revoked',
      };
      setHouseholdLinkState(revoked);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('vestiq_household_link');
        } catch (e) {}
      }

      if (user?.id) {
        try {
          await supabase
            .from('household_links')
            .update({ status: 'revoked' })
            .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`);
        } catch (e) {}
      }
    }
  }, [householdLink, user]);

  const toggleShareDetails = useCallback(async (share: boolean) => {
    if (!householdLink) return;
    const isUserA = !user?.id || householdLink.userIdA === user.id;
    const updated: HouseholdLink = {
      ...householdLink,
      shareDetailsA: isUserA ? share : householdLink.shareDetailsA,
      shareDetailsB: !isUserA ? share : householdLink.shareDetailsB,
    };
    setHouseholdLinkState(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vestiq_household_link', JSON.stringify(updated));
      } catch (e) {}
    }

    if (user?.id) {
      try {
        await supabase
          .from('household_links')
          .update(isUserA ? { share_details_a: share } : { share_details_b: share })
          .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`);
      } catch (e) {}
    }
  }, [householdLink, user]);

  // Health score state — computed dynamically based on current holdings
  const [healthScoreBreakdown, setHealthScoreBreakdown] = useState<HealthScoreBreakdown>(() => {
    return computeHealthScorePreview(holdings);
  });
  const derivedRedFlags = React.useMemo(() => {
    const autoFlags = deriveRedFlagsFromHoldings(holdings, riskCategory, monthlyExpensesEstimate);
    if (!redFlags || redFlags.length === 0) return autoFlags;

    const flagMap = new Map<string, RedFlagAlert>();
    redFlags.forEach(f => flagMap.set(f.id, f));
    autoFlags.forEach(f => flagMap.set(f.id, f));
    return Array.from(flagMap.values());
  }, [holdings, redFlags, riskCategory, monthlyExpensesEstimate]);
  const healthScore = healthScoreBreakdown.score;

  // Authoritative server health score fetcher
  const refreshServerHealthScore = useCallback(async (currentHoldings: HoldingItem[]) => {
    // Always compute client preview instantly so UI updates without delay
    setHealthScoreBreakdown(computeHealthScorePreview(currentHoldings));

    if (!currentHoldings || currentHoldings.length === 0) return;

    try {
      const resp = await fetch('/api/health-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: currentHoldings }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'success' && data.health_score_breakdown) {
          setHealthScoreBreakdown(data.health_score_breakdown);
        }
      }
    } catch (e) {
      console.warn('Unable to fetch server health score:', e);
    }
  }, []);

  // Fetch authoritative health score on mount / when holdings change
  React.useEffect(() => {
    refreshServerHealthScore(holdings);
  }, [holdings, refreshServerHealthScore]);

  // Portfolio Story timeline events state
  const [healthScoreEvents, setHealthScoreEvents] = useState<HealthScoreEvent[]>(MOCK_HEALTH_SCORE_EVENTS);
  const prevScoreRef = React.useRef<number>(healthScore);
  const prevHoldingsRef = React.useRef<HoldingItem[]>(holdings);
  const prevRedFlagsRef = React.useRef<RedFlagAlert[]>(redFlags);

  // Function to explicitly record a Health Score change event
  const recordHealthScoreEvent = useCallback((
    triggerType: HealthScoreTriggerType,
    previousScore: number,
    newScore: number,
    customReason?: string
  ) => {
    if (previousScore === newScore) return;
    const delta = newScore - previousScore;

    // Pick top penalty or bonus factor from current authoritative breakdown
    const topFactor = healthScoreBreakdown.factors && healthScoreBreakdown.factors.length > 0
      ? healthScoreBreakdown.factors.reduce((prev, curr) => Math.abs(curr.penaltyOrBonus) > Math.abs(prev.penaltyOrBonus) ? curr : prev, healthScoreBreakdown.factors[0])
      : { factor: 'Portfolio Scoring Engine', penaltyOrBonus: delta, reason: 'Portfolio asset composition recalculated.' };

    const newEvent: HealthScoreEvent = {
      id: `hse-${Date.now()}`,
      userId: 'user_1',
      timestamp: new Date().toISOString(),
      previousScore,
      newScore,
      delta,
      triggerType,
      reasonObject: {
        factor: topFactor.factor,
        penaltyOrBonus: topFactor.penaltyOrBonus,
        reason: customReason || topFactor.reason || (delta < 0 ? `Health score decreased by ${Math.abs(delta)} pts.` : `Health score increased by +${delta} pts.`),
      }
    };

    setHealthScoreEvents(prev => [newEvent, ...prev]);
  }, [healthScoreBreakdown]);

  // Auto-record whenever Health Score recalculates and differs from last recorded score
  React.useEffect(() => {
    if (prevScoreRef.current === healthScore) {
      // update refs so future diffs are accurate
      prevHoldingsRef.current = holdings;
      prevRedFlagsRef.current = redFlags;
      return;
    }

    const pScore = prevScoreRef.current;

    // Determine trigger type by comparing previous vs current holdings / red flags
    let trigger: HealthScoreTriggerType = 'manual_rescore';

    try {
      const prevHoldings = prevHoldingsRef.current || [];
      const prevFlags = prevRedFlagsRef.current || [];

      if ((redFlags.length || 0) > (prevFlags.length || 0)) trigger = 'flag_created';
      else if ((redFlags.length || 0) < (prevFlags.length || 0)) trigger = 'flag_resolved';
      else if (holdings.length > prevHoldings.length) trigger = 'new_holding';
      else if (holdings.length < prevHoldings.length) trigger = 'holding_removed';
      else {
        // Check for value changes in holdings
        const anyValueChanged = holdings.some((h) => {
          const prev = prevHoldings.find(ph => ph.id === h.id);
          return prev && prev.currentValue !== h.currentValue;
        });
        if (anyValueChanged) trigger = 'value_change';
      }
    } catch (e) {
      trigger = 'manual_rescore';
    }

    // Record event using the detected trigger
    prevScoreRef.current = healthScore;
    recordHealthScoreEvent(trigger, pScore, healthScore);

    // Refresh previous state refs for next detection
    prevHoldingsRef.current = holdings;
    prevRedFlagsRef.current = redFlags;
  }, [healthScore, holdings, redFlags, recordHealthScoreEvent]);

  // User plan & trial state
  const [userRecord, setUserRecord] = useState<UserRecord>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guest = localStorage.getItem('vestiq_guest_user_record');
        if (guest) return JSON.parse(guest);
      } catch (e) {}
    }
    return { plan: 'free' };
  });

  const activePremiumAccess = hasActivePremiumAccess(userRecord);
  const daysLeftInTrial = trialDaysRemaining(userRecord);

  const startFreeTrial = useCallback(async () => {
    // If user is already on a trial with a valid trialEndsAt, preserve it
    let trialEndsAt = userRecord.trialEndsAt;
    if (!trialEndsAt || userRecord.plan !== 'premium_trial') {
      trialEndsAt = makeTrialEndsAt();
    }

    const newRecord: UserRecord = {
      plan: 'premium_trial',
      trialEndsAt,
    };

    setUserRecord(newRecord);
    setRoleInternal('investor_premium');
    setCurrentPage('dashboard');

    // Persist to local storage
    const storageKey = user?.id ? `vestiq_user_record_${user.id}` : 'vestiq_guest_user_record';
    try {
      localStorage.setItem(storageKey, JSON.stringify(newRecord));
    } catch (e) {}

    // Persist to Supabase profiles table if authenticated
    if (user?.id) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          plan: 'premium_trial',
          trial_ends_at: trialEndsAt,
        });
      } catch (dbErr) {
        console.warn('Failed to persist trial to Supabase profiles:', dbErr);
      }
    }
  }, [user, userRecord]);

  // RBAC helpers — route all premium gating through hasActivePremiumAccess(userRecord)
  const canAccess = useCallback((page: PageId): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    if (perms.canAccess.includes(page)) return true;
    if (PREMIUM_PAGES.includes(page) && hasActivePremiumAccess(userRecord)) return true;
    return false;
  }, [role, userRecord]);

  const isPremiumGated = useCallback((page: PageId): boolean => {
    if (!PREMIUM_PAGES.includes(page)) return false;
    // Check live access status — if active trial or paid, return false (not gated); otherwise return true (gated)
    return !hasActivePremiumAccess(userRecord);
  }, [userRecord]);

  // RBAC-enforced navigation: premium gate → show upgrade prompt; blocked page → redirect to role default
  const navigateTo = useCallback((page: PageId) => {
    const perms = ROLE_PERMISSIONS[role];

    // 1. Premium pages: always allow setting currentPage so:
    //    - If active trial / paid: PageRenderer renders the actual feature
    //    - If expired / free: PageRenderer renders the PremiumGate upgrade card (never silence)
    if (PREMIUM_PAGES.includes(page)) {
      setCurrentPage(page);
      return;
    }

    // 2. Direct role permission access
    if (perms.canAccess.includes(page)) {
      setCurrentPage(page);
      return;
    }

    // 3. Public pages always allowed
    const publicPages: PageId[] = ['home', 'how-it-works', 'features', 'for-brokers', 'pricing', 'about', 'auth', 'onboarding'];
    if (publicPages.includes(page)) {
      setCurrentPage(page);
      return;
    }

    // 4. Inaccessible role pages (e.g. investor accessing broker console): redirect to role default
    setCurrentPage(perms.defaultLandingPage);
  }, [role]);

  // When role changes, redirect to that role's default landing page
  const setRole = useCallback((newRole: UserRole) => {
    setRoleInternal(newRole);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vestiq_demo_role', newRole);
      } catch (e) {}
    }
    const landingPage = ROLE_PERMISSIONS[newRole].defaultLandingPage;
    setCurrentPage(landingPage);
  }, []);

  // Audit logging utility with cryptographic hash-chaining
  const logAuditAction = useCallback((
    action: AuditLogEntry['action'],
    entityId: string,
    entityName: string,
    reason?: string
  ) => {
    setAuditLog(prev => {
      const topEntry = prev[0];
      const previousHash = topEntry ? topEntry.hash : '0x0000000000000000';
      const timestamp = new Date().toISOString();
      const officerName = role === 'compliance_officer' ? 'Neha Iyer (Compliance)' : 'Platform Admin';
      const hash = computeEntryHash(previousHash, timestamp, action, entityId, officerName);

      const entry: AuditLogEntry = {
        id: `al-${Date.now()}`,
        timestamp,
        officerName,
        action,
        targetEntityId: entityId,
        targetEntityName: entityName,
        reason,
        ipAddress: '10.0.1.42',
        previousHash,
        hash
      };
      return [entry, ...prev];
    });
  }, [role]);

  // Compliance: explicitly drill into client (creates mandatory audit log entry)
  const logComplianceDrillDown = useCallback((clientId: string, clientName: string, reason: string) => {
    logAuditAction('drill_into_client', clientId, clientName, reason);
  }, [logAuditAction]);

  // Compliance: explicitly reveal a client's PII (creates audit log + adds to revealed list)
  const revealClientPii = useCallback((clientId: string, clientName: string, reason: string) => {
    logAuditAction('drill_into_client', clientId, clientName, reason);
    setCompliancePiiRevealed(prev => prev.includes(clientId) ? prev : [...prev, clientId]);
  }, [logAuditAction]);

  const maskClientPii = useCallback((clientId: string) => {
    setCompliancePiiRevealed(prev => prev.filter(id => id !== clientId));
  }, []);

  // Ref to the active upload's AbortController — set during upload, cleared after
  const cancelUploadRef = useRef<AbortController | null>(null);

  // CAS Upload — Server-First with Automatic Client-Side Parser Fallback
  const handleCasUpload = async (
    fileOrName: File | string,
    options?: { onProgress?: (progress: number, message: string) => void; confirmIdentity?: boolean; confirmPanMismatch?: boolean }
  ): Promise<{ source: 'server' | 'client'; error?: string }> => {
    const reportProgress = (progress: number, message: string) => {
      options?.onProgress?.(progress, message);
    };

    let fileToUpload: File;

    // isSampleUpload: true when called with a filename string (demo/preview) rather
    // than a real File object from the user's file system.
    const isSampleUpload = typeof fileOrName === 'string';
    // Mark React state as demo mode immediately so no subsequent persistence
    // call can accidentally write this data to user_portfolios.
    if (isSampleUpload) setIsDemoMode(true);

    if (isSampleUpload) {
      const sampleText = `PRIYA SHARMA PAN: ABCDE1234F Statement Period: 01-Jan-2026 to 30-Jun-2026 Reliance Industries Ltd HDFC Bank Ltd Infosys Ltd PFC 7.35% NCD 2029 Embassy Office Parks REIT Grid Infrastructure InvIT Parag Parikh Flexi Cap Fund 18,92,882.14`;
      const blob = new Blob([sampleText], { type: 'text/plain' });
      fileToUpload = new File([blob], fileOrName || 'sample_cas.pdf', { type: 'application/pdf' });
    } else {
      // Real file upload — clear demo mode so persistence is re-enabled
      setIsDemoMode(false);
      fileToUpload = fileOrName;

      // ── Client-side pre-validation (instant feedback before any network I/O) ──
      if (!options?.confirmIdentity && !options?.confirmPanMismatch) {
        const validationError = await validateCasFile(fileToUpload);
        if (validationError) {
          reportProgress(0, validationError.message);
          return { source: 'server' as const, error: validationError.message };
        }
      }
    }

    const fileName = fileToUpload.name;
    reportProgress(5, `Preparing ${fileName} for CAS statement parsing...`);

    // ── Attempt 1: Server-Side Parser Endpoint ──────────────────────────────
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || (sessionData as any)?.access_token;
      
      if (accessToken) {
        reportProgress(15, 'Uploading to server parser endpoint...');
        const form = new FormData();
        form.append('file', fileToUpload, fileName);
        if (options?.confirmIdentity) form.append('confirmIdentity', 'true');
        if (options?.confirmPanMismatch) form.append('confirmPanMismatch', 'true');

        const controller = new AbortController();
        cancelUploadRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort('timeout'), 60000);

        let resp: Response;
        try {
          resp = await fetch('/api/parse-cas', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          cancelUploadRef.current = null;
          if (fetchErr?.name === 'AbortError') {
            const reason = fetchErr?.message ?? '';
            if (reason === 'timeout' || String(fetchErr).includes('timeout')) {
              return { source: 'server' as const, error: 'Upload timed out after 60 seconds. Please try again.' };
            }
            return { source: 'server' as const, error: '__cancelled__' };
          }
          throw fetchErr; // Switch to client fallback
        }

        cancelUploadRef.current = null;

        if (resp.ok) {
          reportProgress(55, 'Server parser responded successfully.');
          const serverParsed = await resp.json();

          if (serverParsed.status === 'need_identity_confirmation') {
            const confirmed = window.confirm(
              `This statement appears to be for ${serverParsed.parsedName}. Is that you?`
            );
            if (!confirmed) return { source: 'server', error: 'Identity confirmation declined.' };
            return handleCasUpload(fileToUpload, { ...options, confirmIdentity: true });
          }

          if (serverParsed.status === 'low_name_similarity') {
            const confirmed = window.confirm(
              `This statement appears to be for ${serverParsed.parsedName}, but the parsed name does not match your profile closely. Do you want to continue anyway?`
            );
            if (!confirmed) return { source: 'server', error: 'Low similarity upload cancelled by user.' };
            return handleCasUpload(fileToUpload, { ...options, confirmIdentity: true });
          }

          if (serverParsed.status === 'pan_mismatch') {
            const confirmed = window.confirm(
              `The parsed PAN ${serverParsed.parsedPan} does not match the PAN on your profile (${serverParsed.profilePan || 'unknown'}). Do you want to proceed anyway?`
            );
            if (!confirmed) return { source: 'server', error: 'PAN mismatch upload cancelled by user.' };
            return handleCasUpload(fileToUpload, { ...options, confirmPanMismatch: true });
          }

          if (serverParsed.status === 'success') {
            const rawHoldings = Array.isArray(serverParsed.holdings) ? serverParsed.holdings : [];
            const normalizedHoldings: HoldingItem[] = rawHoldings.map((h: any, idx: number) => {
              const units = h.units || h.quantity || 1;
              const curVal = h.currentValue || h.current_value || 0;
              const avgPrice = h.avgPrice || h.cost_or_nav || 100;
              const currentPrice = h.currentPrice || h.current_price || (curVal / (units || 1));
              const category = (h.category || (h.asset_class === 'equity' || h.asset_class === 'mutual_fund' ? 'equities' : (h.asset_class === 'bond' ? 'bonds' : 'reits_invits'))) as AssetCategory;
              
              return {
                id: h.id || `h-${idx + 1}`,
                name: h.name || h.security_name || 'Holding Item',
                ticker: h.ticker || h.isin || `H-${idx + 1}`,
                category,
                broker: h.broker || h.broker_or_dp || 'Depository Participant',
                depository: h.depository || (h.broker_or_dp?.includes('NSDL') ? 'NSDL' : 'CDSL'),
                units,
                avgPrice,
                currentPrice,
                currentValue: curVal,
                portfolioWeight: h.portfolioWeight || 0,
                lockInMonths: h.lockInMonths || 0,
                riskCategory: h.riskCategory || 'Moderate',
                suitabilityScore: h.suitabilityScore || 85,
                causalChain: h.causalChain || {
                  cause: 'Imported from CAS Statement',
                  mechanism: `${category} holding`,
                  impact: `Current value ₹${curVal.toLocaleString('en-IN')}`
                }
              };
            });

            const casFromServer = {
              investorName: serverParsed.investor_name || serverParsed.investorName || 'Investor',
              pan: serverParsed.pan || 'ABCDE1234F',
              statementPeriod: serverParsed.statement_period || serverParsed.statementPeriod || 'Current Period',
              totalAssets: serverParsed.total_portfolio_value || serverParsed.totalAssets || normalizedHoldings.reduce((sum, h) => sum + h.currentValue, 0),
              holdingsCount: normalizedHoldings.length,
              detectedBrokers: Array.from(new Set(normalizedHoldings.map(h => h.broker))),
              parsedHoldings: normalizedHoldings,
              rawExtractedText: serverParsed.raw_text || serverParsed.rawExtractedText || null,
              uploadedAt: new Date().toISOString(),
            } as CasParseResult;

            setUploadedCas(casFromServer);
            setHoldings(normalizedHoldings);
            if (serverParsed.health_score_breakdown) setHealthScoreBreakdown(serverParsed.health_score_breakdown);
            const targetFlags = (serverParsed.red_flags && serverParsed.red_flags.length) ? serverParsed.red_flags : [];
            setRedFlags(targetFlags);

            if (!isSampleUpload && user?.id) {
              savePortfolioCache(user.id, normalizedHoldings, targetFlags, casFromServer);
              persistUserPortfolio(user.id, normalizedHoldings, targetFlags);
            } else if (isSampleUpload) {
              console.info('[user_portfolios] Sample upload — DB write suppressed.');
            }

            reportProgress(100, 'Server endpoint reached and parsed successfully.');
            setCurrentPage('dashboard');
            return { source: 'server' as const };
          }
        }
      }
    } catch (serverErr) {
      console.warn('Server parsing skipped/unavailable, executing client-side PDF parser fallback:', serverErr);
    }

    // ── Attempt 2: Client-Side Fallback Parser ────────────────────────────────
    try {
      reportProgress(30, 'Reading PDF structure with client-side engine...');
      const extractedText = await extractTextFromPdf(fileToUpload, reportProgress);
      reportProgress(75, 'Parsing extracted text & identifying holdings...');
      const clientParsed = parseCasText(extractedText, fileName);
      const casObj = {
        investorName: clientParsed.investorName,
        pan: clientParsed.pan,
        statementPeriod: clientParsed.statementPeriod,
        totalAssets: clientParsed.totalAssets,
        holdingsCount: clientParsed.holdingsCount,
        detectedBrokers: clientParsed.detectedBrokers,
        parsedHoldings: clientParsed.parsedHoldings,
        rawExtractedText: clientParsed.rawExtractedText,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedCas(casObj);
      setHoldings(clientParsed.parsedHoldings);
      setRedFlags(clientParsed.redFlags);

      if (!isSampleUpload && user?.id) {
        savePortfolioCache(user.id, clientParsed.parsedHoldings, clientParsed.redFlags, casObj);
        persistUserPortfolio(user.id, clientParsed.parsedHoldings, clientParsed.redFlags);
      } else if (isSampleUpload) {
        console.info('[user_portfolios] Sample upload (client fallback) — DB write suppressed.');
      }

      reportProgress(100, 'Parsed statement successfully via client engine!');
      setCurrentPage('dashboard');
      return { source: 'client' as const };
    } catch (clientErr: any) {
      cancelUploadRef.current = null;
      const msg = clientErr instanceof Error ? clientErr.message : String(clientErr);
      reportProgress(100, `Parsing error: ${msg}`);
      return { source: 'client' as const, error: msg };
    }
  };

  /**
   * Aborts an in-progress CAS upload.
   */
  const cancelCasUpload = useCallback(() => {
    if (cancelUploadRef.current) {
      cancelUploadRef.current.abort('user_cancel');
      cancelUploadRef.current = null;
    }
  }, []);

  const resetPortfolio = useCallback(async () => {
    // 1. Backend database purge — delete cas_upload_audit rows, user_portfolios & clear profile PAN
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || (sessionData as any)?.access_token;
      if (accessToken) {
        // Call server purge endpoint
        await fetch('/api/purge-data', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => console.warn('Server purge endpoint call failed:', err));
      }

      // Direct client-side Supabase deletion as secondary layer
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await supabase
          .from('cas_upload_audit')
          .delete()
          .eq('user_id', userData.user.id);

        await supabase
          .from('user_portfolios')
          .delete()
          .eq('user_id', userData.user.id);

        await supabase
          .from('profiles')
          .update({ pan: null })
          .eq('id', userData.user.id);
      }
    } catch (e) {
      console.warn('Error executing backend data purge:', e);
    }

    // 2. Clear React in-memory state back to clean empty baseline
    setIsDemoMode(false);
    setHoldings([]);
    setRedFlags([]);
    setUploadedCas(null);
    setHealthScoreThresholds(DEFAULT_HEALTH_SCORE_THRESHOLDS);
    setRiskCategoryState(null);
    setRiskProfilerAnswersState({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vestiq_health_thresholds');
      localStorage.removeItem('vestiq_user_risk_category');
      localStorage.removeItem('vestiq_user_risk_answers');
      localStorage.removeItem('vestiq_monthly_expenses_estimate');
    }
    setHealthScoreEvents([]);
  }, [setHealthScoreThresholds]);

  // Onboarding
  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(1);
    setCurrentPage('onboarding');
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setCurrentPage(ROLE_PERMISSIONS[role].defaultLandingPage);
  };

  const login = useCallback((name: string) => {
    setUserName(name || 'Investor');
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut().catch(console.error);
    setIsAuthenticated(false);
    setCurrentPage('home');
  }, []);

  // Suitability Report: generate from current MOCK_CLIENTS data
  const generateSuitabilityReport = (clientId: string, generatedBy: string): SuitabilityReportRecord | null => {
    // Return existing pending report if one already exists for this client
    const existing = suitabilityReports.find(r => r.clientId === clientId && r.status === 'generated');
    if (existing) return existing;

    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    if (!client) return null;

    const ts = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const newReport: SuitabilityReportRecord = {
      id: `sr-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      casPan: client.casPan,
      generatedBy,
      generatedAt: ts,
      status: 'generated',
      healthScore: client.healthScore,
      redFlagsCount: client.flagCount,
      riskProfile: client.riskProfile,
      investmentTimeline: client.investmentTimeline ?? 'Not specified',
      totalValue: client.totalValue,
      allocationSummary: { equitiesPct: 44, mfsPct: 5, bondsPct: 17, reitsPct: 34 },
      healthScoreFactors: [
        { factor: 'Concentration Risk', penaltyOrBonus: -12, reason: 'Single asset class dominates allocation' },
        { factor: 'Liquidity Horizon', penaltyOrBonus: -10, reason: 'Lock-in vs stated liquidity horizon mismatch' }
      ],
      redFlagsList: client.topFlag && client.topFlag !== 'None - Clean Portfolio' ? [{
        title: client.topFlag,
        category: 'suitability',
        description: `Active flag for ${client.name}: ${client.topFlag}`,
        suggestedAction: 'Review with client and propose remediation.',
        sebiRuleRef: 'SEBI Suitability & Mis-Selling Framework'
      }] : []
    };

    setSuitabilityReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const acknowledgeReport = (reportId: string, acknowledgedBy: string) => {
    const ts = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    setSuitabilityReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, status: 'acknowledged' as const, reviewedBy: acknowledgedBy, reviewedAt: ts }
        : r
    ));
  };

  // ── Nominee & Estate Readiness ────────────────────────────────────────────
  const [nomineeStatuses, setNomineeStatusesState] = useState<AccountNomineeStatus[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_nominee_statuses');
        if (saved) return JSON.parse(saved) as AccountNomineeStatus[];
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const setNomineeStatus = useCallback((broker: string, value: boolean | null) => {
    setNomineeStatusesState(prev => {
      const updated = prev.some(s => s.broker === broker)
        ? prev.map(s => s.broker === broker ? { ...s, nominee_registered: value } : s)
        : [...prev, { broker, nominee_registered: value }];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('vestiq_nominee_statuses', JSON.stringify(updated)); } catch (e) { /* ignore */ }
      }
      return updated;
    });
  }, []);

  // Guardian state
  const [guardianAlerts, setGuardianAlerts] = useState<GuardianAlert[]>([]);
  const [isGuardianScanning, setIsGuardianScanning] = useState<boolean>(false);

  const unreadGuardianCount = guardianAlerts.filter(a => a.status === 'unread').length;

  const triggerGuardianScan = useCallback(async () => {
    setIsGuardianScanning(true);
    await new Promise(res => setTimeout(res, 800));

    if (!holdings || holdings.length === 0) {
      setGuardianAlerts([]);
      setIsGuardianScanning(false);
      return { alerts: [], filteredOutCount: 0 };
    }

    const { alerts, filteredOutCount } = scanPortfolioForEvents(holdings, SEED_NEWS_EVENTS);
    setGuardianAlerts(alerts);
    setIsGuardianScanning(false);
    return { alerts, filteredOutCount };
  }, [holdings]);

  const markAlertRead = useCallback((alertId: string) => {
    setGuardianAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'read' as const } : a));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setGuardianAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'dismissed' as const } : a));
  }, []);

  // Derive per-broker nominee stats from live holdings + stored statuses
  const nomineeStats = React.useMemo(() => {
    const uniqueBrokers = Array.from(new Set(holdings.map(h => h.broker)));
    const brokers: AccountNomineeStatus[] = uniqueBrokers.map(broker => {
      const saved = nomineeStatuses.find(s => s.broker === broker);
      return { broker, nominee_registered: saved?.nominee_registered ?? null };
    });
    const confirmed = brokers.filter(b => b.nominee_registered === true).length;
    const missing   = brokers.filter(b => b.nominee_registered === false).length;
    const unset     = brokers.filter(b => b.nominee_registered === null).length;
    const total     = brokers.length;

    // First holding name from the first broker that has no nominee set
    const firstMissingBroker = brokers.find(b => b.nominee_registered === false || b.nominee_registered === null);
    const firstMissingHolding = firstMissingBroker
      ? holdings.find(h => h.broker === firstMissingBroker.broker)
      : null;
    const firstMissingHoldingName = firstMissingHolding?.name ?? null;

    return { confirmed, missing, unset, total, brokers, firstMissingHoldingName };
  }, [holdings, nomineeStatuses]);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        navigateTo,
        role,
        setRole,
        canAccess,
        isPremiumGated,
        userRecord,
        setUserRecord,
        startFreeTrial,
        hasActivePremiumAccess: activePremiumAccess,
        trialDaysRemaining: daysLeftInTrial,
        holdings,
        redFlags: derivedRedFlags,
        healthScore,
        healthScoreBreakdown,
        healthScoreThresholds,
        setHealthScoreThresholds,
        explainMode,
        setExplainMode,
        interestRateChange,
        setInterestRateChange,
        marketCrashPct,
        setMarketCrashPct,
        uploadedCas,
        isDemoMode,
        handleCasUpload,
        cancelCasUpload,
        resetPortfolio,
        showOnboarding,
        onboardingStep,
        setOnboardingStep,
        completeOnboarding,
        startOnboarding,
        user,
        session,
        authLoading,
        isAuthenticated,
        userName,
        login,
        logout,
        signOut,
        auditLog,
        logComplianceDrillDown,
        logAuditAction,
        compliancePiiRevealed,
        revealClientPii,
        maskClientPii,
        suitabilityReports,
        generateSuitabilityReport,
        acknowledgeReport,
        healthScoreEvents,
        recordHealthScoreEvent,
        guardianAlerts,
        unreadGuardianCount,
        isGuardianScanning,
        triggerGuardianScan,
        markAlertRead,
        dismissAlert,
        nomineeStatuses,
        setNomineeStatus,
        nomineeStats,
        riskCategory,
        riskProfilerAnswers,
        setRiskProfile,
        monthlyExpensesEstimate,
        setMonthlyExpensesEstimate,
        householdLink,
        householdPartnerSummary,
        isHouseholdViewActive,
        setIsHouseholdViewActive,
        requestHouseholdLink,
        acceptHouseholdLink,
        revokeHouseholdLink,
        toggleShareDetails,
        preferredLanguage,
        setPreferredLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useApp();
  return {
    user: context.user,
    session: context.session,
    loading: context.authLoading,
    isAuthenticated: context.isAuthenticated,
    userName: context.userName,
    signOut: context.signOut,
  };
};
