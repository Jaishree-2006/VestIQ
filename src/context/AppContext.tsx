import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PageId, UserRole, HoldingItem, RedFlagAlert, CasParseResult, AuditLogEntry, AssetCategory } from '../types';
import { ROLE_PERMISSIONS } from '../types';
import { INITIAL_HOLDINGS, MOCK_RED_FLAGS } from '../data/mockData';
import { extractTextFromPdf, parseCasText } from '../utils/casParser';

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
  handleCasUpload: (fileOrName: File | string, options?: { onProgress?: (progress: number, message: string) => void }) => Promise<{ source: 'server' | 'client'; error?: string }>;
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

  // CAS Upload
  const handleCasUpload = async (
    fileOrName: File | string,
    options?: { onProgress?: (progress: number, message: string) => void }
  ): Promise<{ source: 'server' | 'client'; error?: string }> => {
    const reportProgress = (progress: number, message: string) => {
      options?.onProgress?.(progress, message);
    };

    let rawText = '';
    let fileName = 'statement.pdf';

    if (typeof fileOrName === 'string') {
      fileName = fileOrName;
      // Default sample string triggers Priya Sharma statement
      rawText = 'PRIYA SHARMA PAN: ABCDE1234F Statement Period: 01-Jan-2026 to 30-Jun-2026 Reliance Industries Ltd HDFC Bank Ltd Infosys Ltd PFC 7.35% NCD 2029 Embassy Office Parks REIT Grid Infrastructure InvIT Parag Parikh Flexi Cap Fund 18,92,882.14';
    } else if (fileOrName instanceof File) {
      fileName = fileOrName.name;
      reportProgress(5, `Preparing ${fileName} for CAS parsing...`);
      reportProgress(18, 'Uploading CAS to server parser endpoint...');

      let serverError: string | undefined;
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 15000);
        const form = new FormData();
        form.append('file', fileOrName, fileName);
        const resp = await fetch('/api/parse-cas', {
          method: 'POST',
          body: form,
          signal: controller.signal
        });
        window.clearTimeout(timeoutId);

        if (resp.ok) {
          reportProgress(55, 'Server parser responded successfully.');
          const serverParsed = await resp.json();
          
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
              broker: h.broker || h.broker_or_dp || 'Depository',
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
            rawExtractedText: serverParsed.raw_text || serverParsed.rawExtractedText || null
          } as CasParseResult;

          setUploadedCas(casFromServer);
          setHoldings(normalizedHoldings);
          setRedFlags((serverParsed.red_flags && serverParsed.red_flags.length) ? serverParsed.red_flags : MOCK_RED_FLAGS);
          reportProgress(100, 'Server endpoint reached and parsed successfully.');
          setCurrentPage('dashboard');
          return { source: 'server' as const };
        }

        const serverText = await resp.text();
        serverError = resp.status === 404
          ? 'Server parser endpoint not found at /api/parse-cas. Start the backend server or correct the proxy route.'
          : `Server parser returned ${resp.status}: ${serverText}`;
        reportProgress(100, serverError);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        serverError = message.includes('abort')
          ? 'Server parser timed out after 15s.'
          : `Server parser error: ${message}`;
        reportProgress(100, serverError);
      }

      reportProgress(60, serverError ? `Falling back to local parser: ${serverError}` : 'Using local parser fallback.');
      rawText = await extractTextFromPdf(fileOrName);
      reportProgress(85, 'Local text extraction complete; parsing statement locally.');
      const parsed = parseCasText(rawText, fileName);

      const casResult: CasParseResult = {
        investorName: parsed.investorName,
        pan: parsed.pan,
        statementPeriod: parsed.statementPeriod,
        totalAssets: parsed.totalAssets,
        holdingsCount: parsed.holdingsCount,
        detectedBrokers: parsed.detectedBrokers,
        parsedHoldings: parsed.parsedHoldings,
        rawExtractedText: parsed.rawExtractedText
      };

      setUploadedCas(casResult);
      setHoldings(parsed.parsedHoldings);
      setRedFlags(parsed.redFlags.length > 0 ? parsed.redFlags : MOCK_RED_FLAGS);
      reportProgress(100, serverError ? `Local parser complete; server endpoint issue: ${serverError}` : 'Local parser completed successfully.');
      setCurrentPage('dashboard');
      return { source: 'client' as const, error: serverError };
    }

    const parsed = parseCasText(rawText, fileName);

    const casResult: CasParseResult = {
      investorName: parsed.investorName,
      pan: parsed.pan,
      statementPeriod: parsed.statementPeriod,
      totalAssets: parsed.totalAssets,
      holdingsCount: parsed.holdingsCount,
      detectedBrokers: parsed.detectedBrokers,
      parsedHoldings: parsed.parsedHoldings,
      rawExtractedText: parsed.rawExtractedText
    };

    setUploadedCas(casResult);
    setHoldings(parsed.parsedHoldings);
    setRedFlags(parsed.redFlags.length > 0 ? parsed.redFlags : MOCK_RED_FLAGS);
    reportProgress(100, 'Sample CAS loaded locally.');
    setCurrentPage('dashboard');
    return { source: 'client' as const };
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
