import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PageId, UserRole, HoldingItem, RedFlagAlert, CasParseResult, AuditLogEntry } from '../types';
import { ROLE_PERMISSIONS } from '../types';
import { INITIAL_HOLDINGS, MOCK_RED_FLAGS } from '../data/mockData';

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

  // Portfolio
  holdings: HoldingItem[];
  redFlags: RedFlagAlert[];
  healthScore: number;
  explainMode: 'simple' | 'technical';
  setExplainMode: (mode: 'simple' | 'technical') => void;

  // Shock Sandbox
  interestRateChange: number;
  setInterestRateChange: (v: number) => void;
  marketCrashPct: number;
  setMarketCrashPct: (v: number) => void;

  // CAS Upload
  uploadedCas: CasParseResult | null;
  handleCasUpload: (fileName: string) => void;
  resetPortfolio: () => void;

  // Onboarding
  showOnboarding: boolean;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;

  // Audit Log (for Compliance Officer & Admin drill-down)
  auditLog: AuditLogEntry[];
  logComplianceDrillDown: (clientId: string, clientName: string, reason: string) => void;
  logAuditAction: (action: AuditLogEntry['action'], entityId: string, entityName: string, reason?: string) => void;

  // Compliance-specific: PII visibility
  compliancePiiRevealed: string[]; // list of clientIds that have been explicitly un-masked
  revealClientPii: (clientId: string, clientName: string, reason: string) => void;
  maskClientPii: (clientId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [role, setRoleInternal] = useState<UserRole>('investor_free');
  const [holdings, setHoldings] = useState<HoldingItem[]>(INITIAL_HOLDINGS);
  const [redFlags, setRedFlags] = useState<RedFlagAlert[]>(MOCK_RED_FLAGS);
  const [explainMode, setExplainMode] = useState<'simple' | 'technical'>('simple');
  const [interestRateChange, setInterestRateChange] = useState<number>(1.0);
  const [marketCrashPct, setMarketCrashPct] = useState<number>(0);
  const [uploadedCas, setUploadedCas] = useState<CasParseResult | null>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // Audit log state (Compliance Officer & Admin actions)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    {
      id: 'al-seed-1',
      timestamp: '2026-07-28T09:12:44Z',
      officerName: 'Neha Iyer (Compliance)',
      action: 'drill_into_client',
      targetEntityId: 'c2',
      targetEntityName: 'Priya Sharma',
      reason: 'Investigating high-severity junk bond mis-selling flag',
      ipAddress: '10.0.1.42'
    },
    {
      id: 'al-seed-2',
      timestamp: '2026-07-30T14:33:10Z',
      officerName: 'Neha Iyer (Compliance)',
      action: 'export_audit_trail',
      targetEntityId: 'org-wide',
      targetEntityName: 'Organization Audit Export',
      reason: 'Monthly SEBI IEPF submission',
      ipAddress: '10.0.1.42'
    },
  ]);

  // Compliance PII visibility — tracks which clients have been explicitly unmasked
  const [compliancePiiRevealed, setCompliancePiiRevealed] = useState<string[]>([]);

  // Health score dynamically derived from red flags
  const healthScore = Math.max(
    30,
    100 - redFlags.reduce((acc, flag) => acc + (flag.severity === 'high' ? 18 : 10), 0)
  );

  // RBAC helpers
  const canAccess = useCallback((page: PageId): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    return perms.canAccess.includes(page);
  }, [role]);

  const isPremiumGated = useCallback((page: PageId): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    return perms.premiumGated.includes(page);
  }, [role]);

  // RBAC-enforced navigation: premium gate → show upgrade prompt; blocked page → redirect to role default
  const navigateTo = useCallback((page: PageId) => {
    const perms = ROLE_PERMISSIONS[role];

    // Premium gate: page is gated and user is free investor
    if (perms.premiumGated.includes(page)) {
      setCurrentPage('pricing' as PageId);
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
  }, [role]);

  // When role changes, redirect to that role's default landing page
  const setRole = useCallback((newRole: UserRole) => {
    setRoleInternal(newRole);
    const landingPage = ROLE_PERMISSIONS[newRole].defaultLandingPage;
    setCurrentPage(landingPage);
  }, []);

  // Audit logging utility
  const logAuditAction = useCallback((
    action: AuditLogEntry['action'],
    entityId: string,
    entityName: string,
    reason?: string
  ) => {
    const entry: AuditLogEntry = {
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      officerName: role === 'compliance_officer' ? 'Neha Iyer (Compliance)' : 'Platform Admin',
      action,
      targetEntityId: entityId,
      targetEntityName: entityName,
      reason,
      ipAddress: '10.0.1.42',
    };
    setAuditLog(prev => [entry, ...prev]);
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

  // CAS Upload
  const handleCasUpload = (fileName: string) => {
    const mockCasResult: CasParseResult = {
      investorName: 'Rajesh Kumar',
      pan: 'ABCDE1234F',
      statementPeriod: '01-Apr-2024 to 31-Jul-2026',
      totalAssets: 1842600,
      holdingsCount: 5,
      detectedBrokers: ['Zerodha', 'Groww', 'ICICI Direct', 'RBI Retail Direct'],
      parsedHoldings: INITIAL_HOLDINGS
    };
    setUploadedCas(mockCasResult);
    setHoldings(INITIAL_HOLDINGS);
    setRedFlags(MOCK_RED_FLAGS);
  };

  const resetPortfolio = () => {
    setHoldings(INITIAL_HOLDINGS);
    setRedFlags(MOCK_RED_FLAGS);
    setUploadedCas(null);
  };

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
        holdings,
        redFlags,
        healthScore,
        explainMode,
        setExplainMode,
        interestRateChange,
        setInterestRateChange,
        marketCrashPct,
        setMarketCrashPct,
        uploadedCas,
        handleCasUpload,
        resetPortfolio,
        showOnboarding,
        onboardingStep,
        setOnboardingStep,
        completeOnboarding,
        startOnboarding,
        auditLog,
        logComplianceDrillDown,
        logAuditAction,
        compliancePiiRevealed,
        revealClientPii,
        maskClientPii,
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
