import React, { createContext, useContext, useState } from 'react';
import type { PageId, UserRole, HoldingItem, RedFlagAlert, CasParseResult } from '../types';
import { INITIAL_HOLDINGS, MOCK_RED_FLAGS } from '../data/mockData';

interface AppContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  holdings: HoldingItem[];
  redFlags: RedFlagAlert[];
  healthScore: number;
  explainMode: 'simple' | 'technical';
  setExplainMode: (mode: 'simple' | 'technical') => void;

  // Shock Sandbox sliders
  interestRateChange: number; // e.g. +1.0 %
  setInterestRateChange: (v: number) => void;
  marketCrashPct: number; // e.g. -15 %
  setMarketCrashPct: (v: number) => void;

  // CAS upload simulation state
  uploadedCas: CasParseResult | null;
  handleCasUpload: (fileName: string) => void;
  resetPortfolio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [role, setRole] = useState<UserRole>('investor_free');
  const [holdings, setHoldings] = useState<HoldingItem[]>(INITIAL_HOLDINGS);
  const [redFlags, setRedFlags] = useState<RedFlagAlert[]>(MOCK_RED_FLAGS);
  const [explainMode, setExplainMode] = useState<'simple' | 'technical'>('simple');

  const [interestRateChange, setInterestRateChange] = useState<number>(1.0);
  const [marketCrashPct, setMarketCrashPct] = useState<number>(0);
  const [uploadedCas, setUploadedCas] = useState<CasParseResult | null>(null);

  // Dynamic health score calculation
  const healthScore = Math.max(
    30,
    100 - redFlags.reduce((acc, flag) => acc + (flag.severity === 'high' ? 18 : 10), 0)
  );

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

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        role,
        setRole,
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
        resetPortfolio
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
