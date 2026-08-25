import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { PageId, UserRole, HoldingItem, RedFlagAlert, CasParseResult, AuditLogEntry, AssetCategory, HealthScoreBreakdown, HealthScoreThresholds, SuitabilityReportRecord, HealthScoreEvent, HealthScoreTriggerType, GuardianAlert, CasUploadAuditRow } from '../types';
import { ROLE_PERMISSIONS, DEFAULT_HEALTH_SCORE_THRESHOLDS } from '../types';
import { INITIAL_HOLDINGS, MOCK_RED_FLAGS, MOCK_SUITABILITY_REPORTS, MOCK_CLIENTS, MOCK_HEALTH_SCORE_EVENTS } from '../data/mockData';
import { computeHealthScorePreview } from '../utils/healthScore';
import { scanPortfolioForEvents, SEED_NEWS_EVENTS } from '../utils/portfolioGuardianEngine';
import type { UserRecord } from '../utils/trial';
import { hasActivePremiumAccess, trialDaysRemaining, makeTrialEndsAt } from '../utils/trial';
import { supabase } from '../lib/supabaseClient';
import { validateCasFile } from '../utils/casFileValidation';
import { extractTextFromPdf, parseCasText } from '../utils/casParser';
import { deriveRedFlagsFromHoldings } from '../utils/redFlags';
import type { SebiRiskCategory } from '../utils/riskProfiler';
import type { HouseholdLink, CombinedHouseholdSummary } from '../utils/household';
import { computeCombinedHouseholdSummary, DEFAULT_DEMO_PARTNER } from '../utils/household';

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

  // Risk Profiler (SEBI Riskometer) & Emergency Buffer
  userRiskCategory: SebiRiskCategory;
  userRiskAnswers: Record<string, number>;
  updateUserRiskCategory: (category: SebiRiskCategory, answers?: Record<string, number>) => void;
  monthlyExpenses: number | null;
  updateMonthlyExpenses: (amount: number | null) => void;

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

  // Household / Family View (Premium)
  householdLinks: HouseholdLink[];
  activeHouseholdLink: HouseholdLink | null;
  sendHouseholdInvite: (email: string) => Promise<{ success: boolean; error?: string }>;
  acceptHouseholdInvite: (linkId: string) => Promise<void>;
  revokeHouseholdLink: (linkId: string) => Promise<void>;
  toggleHoldingDetailConsent: (linkId: string, consent: boolean) => Promise<void>;
  isHouseholdViewActive: boolean;
  setIsHouseholdViewActive: (active: boolean) => void;
  combinedHouseholdSummary: CombinedHouseholdSummary | null;

  // Upload History
  uploadHistory: CasUploadAuditRow[];
  refreshUploadHistory: () => Promise<void>;

  // Language preference
  preferredLanguage: 'en' | 'ta';
  setPreferredLanguage: (lang: 'en' | 'ta') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [role, setRoleInternal] = useState<UserRole>('investor_free');
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

  const [userRiskCategory, setUserRiskCategoryState] = useState<SebiRiskCategory>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vestiq_risk_category') as SebiRiskCategory;
      if (saved && ['Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High'].includes(saved)) {
        return saved;
      }
    }
    return 'Moderate';
  });

  const [userRiskAnswers, setUserRiskAnswersState] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vestiq_risk_answers');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return {};
  });

  const updateUserRiskCategory = useCallback((category: SebiRiskCategory, answers?: Record<string, number>) => {
    setUserRiskCategoryState(category);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vestiq_risk_category', category);
      if (answers) {
        setUserRiskAnswersState(answers);
        localStorage.setItem('vestiq_risk_answers', JSON.stringify(answers));
      }
    }
  }, []);

  // Monthly Expenses Estimate (Emergency Fund Adequacy Check)
  const [monthlyExpenses, setMonthlyExpensesState] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vestiq_monthly_expenses');
      if (saved !== null && saved !== '') {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  });

  const updateMonthlyExpenses = useCallback(async (amount: number | null) => {
    setMonthlyExpensesState(amount);
    if (typeof window !== 'undefined') {
      if (amount === null || amount <= 0) {
        localStorage.removeItem('vestiq_monthly_expenses');
      } else {
        localStorage.setItem('vestiq_monthly_expenses', String(amount));
      }
    }
    // Sync to Supabase profile if authenticated
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await supabase
          .from('profiles')
          .update({ monthly_expenses_estimate: amount })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Could not sync monthly_expenses_estimate to Supabase:', e);
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

  // Upload History — fetched from cas_upload_audit on login, RLS-restricted to own rows
  const [uploadHistory, setUploadHistory] = useState<CasUploadAuditRow[]>([]);

  // Language preference (persisted in localStorage)
  const [preferredLanguage, setPreferredLanguageState] = useState<'en' | 'ta'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vestiq_preferred_language');
      if (saved === 'ta') return 'ta';
    }
    return 'en';
  });
  const setPreferredLanguage = useCallback((lang: 'en' | 'ta') => {
    setPreferredLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vestiq_preferred_language', lang);
    }
  }, []);

  // Outcomes that represent real CAS upload events (exclude system/export audit entries)
  const UPLOAD_OUTCOMES = ['success', 'low_name_similarity', 'need_identity_confirmation', 'pan_mismatch'];

  const refreshUploadHistory = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from('cas_upload_audit')
        .select('id, created_at, parsed_name, profile_name, similarity, outcome, total_portfolio_value, holdings_count, health_score_at_upload')
        .eq('user_id', userId)
        .in('outcome', UPLOAD_OUTCOMES)
        .order('created_at', { ascending: false });
      if (!error && data) setUploadHistory(data as CasUploadAuditRow[]);
    } catch (e) {
      console.warn('[uploadHistory] Could not fetch cas_upload_audit:', e);
    }
  }, []);


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

        // Restore trial plan & monthly expenses from Supabase profiles (authoritative source)
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('plan, trial_ends_at, monthly_expenses_estimate')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (profileData) {
            const restored: UserRecord = {
              plan: (profileData.plan as UserRecord['plan']) ?? 'free',
              ...(profileData.trial_ends_at ? { trialEndsAt: profileData.trial_ends_at } : {}),
            };
            setUserRecord(restored);
            // Keep localStorage in sync with the server value
            if (typeof window !== 'undefined') {
              localStorage.setItem('vestiq_user_record', JSON.stringify(restored));
            }
            if (profileData.monthly_expenses_estimate !== undefined && profileData.monthly_expenses_estimate !== null) {
              const exp = Number(profileData.monthly_expenses_estimate);
              if (!isNaN(exp) && exp > 0) {
                setMonthlyExpensesState(exp);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('vestiq_monthly_expenses', String(exp));
                }
              }
            }
          }
        } catch (planErr) {
          console.warn('Could not restore trial plan / monthly expenses from profiles:', planErr);
          // Fall back to whatever was already loaded from localStorage
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
        // Fetch Upload History from cas_upload_audit
        try {
          const { data: auditRows, error: auditErr } = await supabase
            .from('cas_upload_audit')
            .select('id, created_at, parsed_name, profile_name, similarity, outcome, total_portfolio_value, holdings_count, health_score_at_upload')
            .eq('user_id', currentUser.id)
            .in('outcome', ['success', 'low_name_similarity', 'need_identity_confirmation', 'pan_mismatch'])
            .order('created_at', { ascending: false });
          if (!auditErr && auditRows) setUploadHistory(auditRows as CasUploadAuditRow[]);
        } catch (e) {
          console.warn('[uploadHistory] fetch failed silently:', e);
        }
      } else {
        setUserName('Investor');
        setIsAuthenticated(false);
        setIsDemoMode(false);
        setHoldings([]);
        setRedFlags([]);
        setUploadedCas(null);
        setUploadHistory([]);
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
      setUploadHistory([]);
      setCurrentPage('home');
      // Reset trial state so the next user on this browser starts clean
      setUserRecord({ plan: 'free' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vestiq_user_record');
      }
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

  // Health score state — computed dynamically based on current holdings
  const [healthScoreBreakdown, setHealthScoreBreakdown] = useState<HealthScoreBreakdown>(() => {
    return computeHealthScorePreview(holdings);
  });
  const derivedRedFlags = React.useMemo(() => {
    const derived = deriveRedFlagsFromHoldings(holdings, userRiskCategory, monthlyExpenses);
    if (redFlags.length === 0) return derived;
    
    // Combine state flags with derived suitability flags
    const flagMap = new Map<string, RedFlagAlert>();
    redFlags.forEach((f) => flagMap.set(f.id, f));
    derived.forEach((f) => {
      if (!flagMap.has(f.id)) {
        flagMap.set(f.id, f);
      }
    });
    return Array.from(flagMap.values());
  }, [holdings, redFlags, userRiskCategory, monthlyExpenses]);
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
  // Initialise from localStorage so trial state survives hot-reload / tab re-open
  // (Supabase is the authoritative source; localStorage is a fast-load cache)
  const [userRecord, setUserRecord] = useState<UserRecord>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('vestiq_user_record');
        if (cached) return JSON.parse(cached) as UserRecord;
      } catch { /* ignore */ }
    }
    return { plan: 'free' };
  });

  const activePremiumAccess = hasActivePremiumAccess(userRecord);
  const daysLeftInTrial = trialDaysRemaining(userRecord);

  const startFreeTrial = useCallback(async () => {
    // trialEndsAt is computed ONCE here at click time and then only read afterward
    const trialEndsAt = makeTrialEndsAt();
    const newRecord: UserRecord = { plan: 'premium_trial', trialEndsAt };
    setUserRecord(newRecord);
    setRoleInternal('investor_premium');
    setCurrentPage('dashboard');

    // 1. Persist to localStorage so the value survives hot-reload immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('vestiq_user_record', JSON.stringify(newRecord));
    }

    // 2. Persist to Supabase so the value survives full page reloads and new devices
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await supabase
          .from('profiles')
          .update({ plan: 'premium_trial', trial_ends_at: trialEndsAt })
          .eq('id', userId);
      }
    } catch (persistErr) {
      console.warn('Could not persist trial start to Supabase profiles:', persistErr);
      // Non-fatal: localStorage fallback is already written above
    }
  }, []);

  // RBAC helpers — route all premium gating through hasActivePremiumAccess(userRecord)
  const canAccess = useCallback((page: PageId): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    if (perms.canAccess.includes(page)) return true;
    const premiumPages: PageId[] = ['shock-sandbox', 'peer-benchmark', 'retrospective'];
    if (premiumPages.includes(page) && hasActivePremiumAccess(userRecord)) return true;
    return false;
  }, [role, userRecord]);

  const isPremiumGated = useCallback((page: PageId): boolean => {
    const premiumPages: PageId[] = ['shock-sandbox', 'peer-benchmark', 'retrospective'];
    if (!premiumPages.includes(page)) return false;
    // Check live access status — if active trial or paid, return false (not gated); otherwise return true (gated)
    return !hasActivePremiumAccess(userRecord);
  }, [userRecord]);

  // RBAC-enforced navigation: premium gate → show upgrade prompt; blocked page → redirect to role default
  const navigateTo = useCallback((page: PageId) => {
    const perms = ROLE_PERMISSIONS[role];

    const premiumPages: PageId[] = ['shock-sandbox', 'peer-benchmark', 'retrospective'];
    if (premiumPages.includes(page) && !hasActivePremiumAccess(userRecord)) {
      setCurrentPage(page); // Let PageRenderer render PremiumGate component for this page
      return;
    }

    // If this role can access it, go directly
    if (perms.canAccess.includes(page)) {
      setCurrentPage(page);
      return;
    }

    // Public pages always allowed
    const publicPages: PageId[] = ['home', 'how-it-works', 'features', 'for-brokers', 'pricing', 'about', 'auth', 'onboarding'];
    if (publicPages.includes(page)) {
      setCurrentPage(page);
      return;
    }

    // Blocked: redirect to default landing for this role
    setCurrentPage(perms.defaultLandingPage);
  }, [role, userRecord]);

  // When role changes, redirect to that role's default landing page
  const setRole = useCallback((newRole: UserRole) => {
    setRoleInternal(newRole);
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
              // Refresh upload history in background so Settings reflects the new row
              refreshUploadHistory().catch(() => {});
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
        try {
          await supabase.from('cas_upload_audit').insert([{
            user_id: user.id,
            parsed_name: clientParsed.investorName,
            profile_name: userName || 'Investor',
            similarity: 1.0,
            profile_pan: user?.user_metadata?.pan || clientParsed.pan,
            parsed_pan: clientParsed.pan,
            outcome: 'success',
            details: { client_parser: true },
            total_portfolio_value: clientParsed.totalAssets,
            holdings_count: clientParsed.holdingsCount,
            health_score_at_upload: Math.round(healthScore)
          }]);
          refreshUploadHistory().catch(() => {});
        } catch (auditErr) {
          console.warn('[client upload] audit log write failed:', auditErr);
        }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vestiq_health_thresholds');
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

  // Household / Family View State & Management (Premium)
  const [householdLinks, setHouseholdLinks] = useState<HouseholdLink[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vestiq_household_links');
        if (saved) return JSON.parse(saved) as HouseholdLink[];
      } catch (e) {}
    }
    return [];
  });

  const [isHouseholdViewActive, setIsHouseholdViewActiveState] = useState<boolean>(false);

  const saveHouseholdLinksState = useCallback((links: HouseholdLink[]) => {
    setHouseholdLinks(links);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vestiq_household_links', JSON.stringify(links));
    }
  }, []);

  const activeHouseholdLink = React.useMemo(() => {
    return householdLinks.find((l) => l.status === 'accepted') || null;
  }, [householdLinks]);

  const setIsHouseholdViewActive = useCallback((active: boolean) => {
    // Only allow activating if an accepted link exists and user has active premium
    if (active && !activeHouseholdLink) {
      setIsHouseholdViewActiveState(false);
      return;
    }
    setIsHouseholdViewActiveState(active);
  }, [activeHouseholdLink]);

  const sendHouseholdInvite = useCallback(async (targetEmail: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = targetEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const currentEmail = user?.email || 'investor@vestiq.in';
    if (trimmed === currentEmail.toLowerCase()) {
      return { success: false, error: 'You cannot link your own email address as a household member.' };
    }

    const existing = householdLinks.find(
      (l) => l.status !== 'revoked' && (l.user_b_email.toLowerCase() === trimmed || l.user_a_email.toLowerCase() === trimmed)
    );
    if (existing) {
      return { success: false, error: `A link request with ${targetEmail} is already ${existing.status}.` };
    }

    const newLink: HouseholdLink = {
      id: `hh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id_a: user?.id || 'current_user',
      user_a_email: currentEmail,
      user_b_email: targetEmail,
      status: 'pending',
      requested_by: user?.id || 'current_user',
      requested_at: new Date().toISOString(),
      share_holdings_a: false,
      share_holdings_b: false,
      partner_name: targetEmail.split('@')[0],
    };

    const nextLinks = [newLink, ...householdLinks];
    saveHouseholdLinksState(nextLinks);

    // Try Supabase insert if logged in
    try {
      if (user?.id) {
        await supabase.from('household_links').insert({
          id: newLink.id,
          user_id_a: user.id,
          user_a_email: currentEmail,
          user_b_email: targetEmail,
          status: 'pending',
          requested_by: user.id,
          share_holdings_a: false,
          share_holdings_b: false,
        });
      }
    } catch (e) {
      console.warn('Supabase household invite sync:', e);
    }

    return { success: true };
  }, [user, householdLinks, saveHouseholdLinksState]);

  const acceptHouseholdInvite = useCallback(async (linkId: string) => {
    const ts = new Date().toISOString();
    const nextLinks = householdLinks.map((l) =>
      l.id === linkId
        ? {
            ...l,
            status: 'accepted' as const,
            accepted_at: ts,
            partner_name: l.partner_name || DEFAULT_DEMO_PARTNER.name,
            partner_total_value: DEFAULT_DEMO_PARTNER.totalValue,
            partner_equities: DEFAULT_DEMO_PARTNER.equities,
            partner_bonds: DEFAULT_DEMO_PARTNER.bonds,
            partner_reits: DEFAULT_DEMO_PARTNER.reits,
            partner_cash: DEFAULT_DEMO_PARTNER.cash,
          }
        : l
    );
    saveHouseholdLinksState(nextLinks);

    try {
      await supabase
        .from('household_links')
        .update({ status: 'accepted', accepted_at: ts })
        .eq('id', linkId);
    } catch (e) {
      console.warn('Supabase household accept sync:', e);
    }
  }, [householdLinks, saveHouseholdLinksState]);

  const revokeHouseholdLink = useCallback(async (linkId: string) => {
    const nextLinks = householdLinks.map((l) =>
      l.id === linkId ? { ...l, status: 'revoked' as const } : l
    );
    saveHouseholdLinksState(nextLinks);
    // Immediately remove shared visibility on revoke
    setIsHouseholdViewActiveState(false);

    try {
      await supabase
        .from('household_links')
        .update({ status: 'revoked' })
        .eq('id', linkId);
    } catch (e) {
      console.warn('Supabase household revoke sync:', e);
    }
  }, [householdLinks, saveHouseholdLinksState]);

  const toggleHoldingDetailConsent = useCallback(async (linkId: string, consent: boolean) => {
    const nextLinks = householdLinks.map((l) =>
      l.id === linkId ? { ...l, share_holdings_a: consent, share_holdings_b: consent } : l
    );
    saveHouseholdLinksState(nextLinks);

    try {
      await supabase
        .from('household_links')
        .update({ share_holdings_a: consent, share_holdings_b: consent })
        .eq('id', linkId);
    } catch (e) {
      console.warn('Supabase consent sync:', e);
    }
  }, [householdLinks, saveHouseholdLinksState]);

  const combinedHouseholdSummary = React.useMemo(() => {
    if (!activeHouseholdLink) return null;
    return computeCombinedHouseholdSummary(holdings, activeHouseholdLink);
  }, [holdings, activeHouseholdLink]);

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
        userRiskCategory,
        userRiskAnswers,
        updateUserRiskCategory,
        monthlyExpenses,
        updateMonthlyExpenses,
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
        householdLinks,
        activeHouseholdLink,
        sendHouseholdInvite,
        acceptHouseholdInvite,
        revokeHouseholdLink,
        toggleHoldingDetailConsent,
        isHouseholdViewActive,
        setIsHouseholdViewActive,
        combinedHouseholdSummary,
        uploadHistory,
        refreshUploadHistory,
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
