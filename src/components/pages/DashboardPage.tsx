import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { PortfolioStoryTimeline } from '../portfolio/PortfolioStoryTimeline';
import { PortfolioGuardianFeed } from '../portfolio/PortfolioGuardianFeed';
import { DataFreshnessIndicator } from '../portfolio/DataFreshnessIndicator';
import { 
  AlertTriangle, 
  ArrowRight, 
  Lightbulb, 
  Sliders, 
  TrendingUp, 
  Upload, 
  Layers, 
  CheckCircle,
  ExternalLink,
  ChevronDown,
  X,
  UserCheck,
  UserX,
  Users,
  Calendar,
} from 'lucide-react';
import { getSebiRiskVisualTokens, SEBI_RISK_RANKS } from '../../utils/riskProfiler';
import { computeCombinedPortfolioStats } from '../../utils/household';
import { LanguageToggle } from '../ui/LanguageToggle';
import { translateExplanation, getLanguageFontClass } from '../../utils/translations';

export const DashboardPage: React.FC = () => {
  const { 
    holdings, 
    redFlags, 
    healthScore,
    healthScoreBreakdown,
    healthScoreEvents,
    setCurrentPage, 
    navigateTo,
    handleCasUpload,
    cancelCasUpload,
    uploadedCas,
    nomineeStats,
    riskCategory,
    householdLink,
    householdPartnerSummary,
    isHouseholdViewActive,
    setIsHouseholdViewActive,
    preferredLanguage,
  } = useApp();


  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  /** Full reset — used after cancel, success, or a clean error. */
  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus(null);
    setUploadError(null);
  }, []);

  /** Cancel button handler — aborts the in-flight fetch and clears UI. */
  const handleCancel = useCallback(() => {
    cancelCasUpload();
    resetUploadState();
  }, [cancelCasUpload, resetUploadState]);

  const onFileUpload = async (fileOrName: File | string) => {
    const fileName = typeof fileOrName === 'string' ? fileOrName : fileOrName.name;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadStatus(`Starting parsing for ${fileName}...`);

    try {
      const result = await handleCasUpload(fileOrName, {
        onProgress: (progress, message) => {
          setUploadProgress(progress);
          setUploadStatus(message);
        }
      });

      // User clicked Cancel — reset silently, no error shown
      if (result.error === '__cancelled__') {
        resetUploadState();
        return;
      }

      if (result.error) {
        setUploadError(result.error);
        setUploadStatus('Upload failed.');
      } else {
        setUploadStatus(`✅ Successfully parsed statement from ${fileName}! Holdings updated.`);
        setUploadError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadError(message);
      setUploadStatus('Upload failed.');
      setUploadProgress(100);
    } finally {
      setIsUploading(false);
    }
  };

  // Score colour zones: green ≥75 / amber 50–74 / red <50
  const scoreColor = healthScore >= 75 ? '#2BB673' : healthScore >= 50 ? '#C57D25' : '#EF4444';
  const scoreBg    = healthScore >= 75 ? '#E6F4EA' : healthScore >= 50 ? '#FFF8EE' : '#FDF2F2';
  const scoreLabel = healthScore >= 75 ? 'Healthy'  : healthScore >= 50 ? 'At Risk'  : 'Critical';

  // SVG semicircular arc gauge
  const GAUGE_R = 74;
  const GAUGE_CX = 88;
  const GAUGE_CY = 88;
  const gaugeCircumference = Math.PI * GAUGE_R;
  const gaugeDashOffset = gaugeCircumference * (1 - healthScore / 100);

  // Aggregate figures matching Image 2
  const totalEquities = holdings
    .filter(h => h.category === 'equities')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const totalBonds = holdings
    .filter(h => h.category === 'bonds')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const totalReits = holdings
    .filter(h => h.category === 'reits_invits')
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const totalValue = totalEquities + totalBonds + totalReits;

  // Combined Household figures
  const combinedStats = useMemo(() => {
    return computeCombinedPortfolioStats(holdings, householdPartnerSummary);
  }, [holdings, householdPartnerSummary]);

  const isHouseholdActive = Boolean(isHouseholdViewActive && householdLink?.status === 'accepted');
  const displayTotalValue = isHouseholdActive ? combinedStats.combinedTotalValue : totalValue;
  const displayEquities = isHouseholdActive ? combinedStats.combinedEquities : totalEquities;
  const displayBonds = isHouseholdActive ? combinedStats.combinedBonds : totalBonds;
  const displayReits = isHouseholdActive ? combinedStats.combinedReits : totalReits;
  const displayEquitiesPct = isHouseholdActive
    ? combinedStats.combinedEquitiesPct
    : totalValue > 0 ? Number(((totalEquities / totalValue) * 100).toFixed(1)) : 0;
  const displayBondsPct = isHouseholdActive
    ? combinedStats.combinedBondsPct
    : totalValue > 0 ? Number(((totalBonds / totalValue) * 100).toFixed(1)) : 0;
  const displayReitsPct = isHouseholdActive
    ? combinedStats.combinedReitsPct
    : totalValue > 0 ? Number(((totalReits / totalValue) * 100).toFixed(1)) : 0;

  // Upcoming Dividend / Coupon / Distribution Cashflow Items
  const upcomingIncomeItems = useMemo(() => {
    return (holdings || [])
      .filter((h) => h.next_payout_date && (h.estimated_payout_amount || 0) > 0)
      .map((h) => ({
        id: h.id,
        name: h.name,
        ticker: h.ticker,
        payoutType: (h.payout_type || (h.category === 'bonds' ? 'coupon' : h.category === 'reits_invits' ? 'distribution' : 'dividend')) as 'dividend' | 'coupon' | 'distribution',
        estimatedAmount: h.estimated_payout_amount || 0,
        payoutDate: h.next_payout_date!,
        broker: h.broker,
        depository: h.depository,
      }))
      .sort((a, b) => new Date(a.payoutDate).getTime() - new Date(b.payoutDate).getTime())
      .slice(0, 5);
  }, [holdings]);

  const totalUpcomingIncome90Days = useMemo(() => {
    return upcomingIncomeItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
  }, [upcomingIncomeItems]);

  const topFlag = redFlags[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans selection:bg-[#FCEEBB] overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* CAS Upload Banner if not uploaded */}
        {!uploadedCas && (
          <div className="mb-6 bg-white border border-[#E6DCCB] rounded-2xl p-3.5 sm:p-4 flex flex-col shadow-xs gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center shrink-0 border border-[#F7E5C8]">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#14213D]">Upload & Scan CAS Statement</h4>
                  <p className="text-xs text-[#6B7280]">Parse your NSDL/CDSL CAS PDF (e.g. Priya Sharma CAS) to calculate real values & red flags instantly.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {/* Cancel button — only visible while upload is running */}
                {isUploading && (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 bg-[#FDF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#B91C1C] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                    title="Cancel upload"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}

                {!isUploading && (
                  <>
                    <label className="px-3 py-1.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload PDF</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            e.target.value = ''; // reset so same file can be re-selected after cancel
                            await onFileUpload(f);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => onFileUpload('sample_cas.pdf')}
                      disabled={isUploading}
                      className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Priya Sharma Sample
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress / status area */}
            {uploadStatus && (
              <div className="mt-2 space-y-2 pt-3 border-t border-[#EDE9DF]">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="truncate pr-4">{uploadStatus}</div>
                  {isUploading && <div className="text-[#6B7280] shrink-0">{uploadProgress}%</div>}
                </div>
                {isUploading && (
                  <>
                    <div className="h-2 rounded-full overflow-hidden bg-[#EDE9DF]">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full rounded-full bg-[#C57D25] transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-[#6B7280]">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#C57D25] animate-pulse" />
                      <span>Processing statement — click Cancel above to abort.</span>
                    </div>
                  </>
                )}
                {uploadError && (
                  <div className="text-xs font-bold rounded-xl p-3 text-[#B91C1C] bg-[#FEE2E2] border border-[#FECACA] flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[#991B1B]">Upload failed</div>
                      <div>{uploadError}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Household Perspective Switcher (Visible when Household Link is accepted) */}
        {householdLink?.status === 'accepted' && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#EDE9DF] p-2.5 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-2 text-xs text-[#6B7280] px-2">
              <Users className="w-4 h-4 text-[#C57D25]" />
              <span>Portfolio Perspective:</span>
            </div>
            <div className="inline-flex rounded-xl bg-[#F6F4ED] p-1 border border-[#EDE9DF]">
              <button
                onClick={() => setIsHouseholdViewActive(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isHouseholdActive
                    ? 'bg-white text-[#14213D] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                Individual ({uploadedCas?.investorName || 'My Portfolio'})
              </button>
              <button
                onClick={() => setIsHouseholdViewActive(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isHouseholdActive
                    ? 'bg-[#FFF8EE] text-[#C57D25] shadow-xs border border-[#F7E5C8]'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#C57D25]" />
                <span>Combined Household ({householdLink.partnerName})</span>
              </button>
            </div>
          </div>
        )}

        {/* Household View Active Notice Banner */}
        {isHouseholdActive && (
          <div className="mb-6 p-3.5 bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl flex items-center justify-between text-xs text-[#63451B]">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#C57D25] shrink-0" />
              <span>
                <strong>Household View Active:</strong> Aggregating your portfolio with {householdLink?.partnerName || 'Partner'}'s assets (₹{householdPartnerSummary?.totalValue.toLocaleString('en-IN')}). Holding-level privacy is preserved.
              </span>
            </div>
            <button
              onClick={() => setCurrentPage('settings')}
              className="text-[#C57D25] font-bold hover:underline cursor-pointer ml-3 shrink-0"
            >
              Manage Link &rarr;
            </button>
          </div>
        )}

        {/* Top Portfolio Header matching Image 2 EXACTLY */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-[#8B93A7] mb-1">
              {isHouseholdActive
                ? `total household portfolio value (${uploadedCas?.investorName || 'You'} + ${householdLink?.partnerName || 'Partner'})`
                : `total portfolio value ${uploadedCas ? `(${uploadedCas.investorName})` : ''}`}
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono-num text-[#14213D] tracking-tight">
              ₹{displayTotalValue.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Top Right Controls: SEBI Risk Profile + Health Score */}
          <div className="flex flex-wrap items-stretch gap-3">
            {/* SEBI Risk Profile Badge Card */}
            {riskCategory ? (() => {
              const riskTokens = getSebiRiskVisualTokens(riskCategory);
              return (
                <div
                  onClick={() => setCurrentPage('settings')}
                  className={`${riskTokens.bg} border ${riskTokens.border} rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-xs cursor-pointer ${riskTokens.hoverBorder} transition-colors flex-1 sm:w-44 min-w-[140px]`}
                  title="SEBI Riskometer Profile — Click to edit in Settings"
                >
                  <div className="text-sm font-semibold text-[#8B93A7] mb-0.5">
                    risk profile
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold ${riskTokens.text} font-mono-num text-center`}>
                    {riskCategory}
                  </div>
                  <div className="text-[10px] font-bold text-[#8B93A7] mt-1 uppercase tracking-wider">
                    Riskometer: {SEBI_RISK_RANKS[riskCategory] || 3}/6
                  </div>
                </div>
              );
            })() : (
              <div
                onClick={() => setCurrentPage('settings')}
                className="bg-white border border-dashed border-[#EDE9DF] hover:border-[#C57D25] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-xs cursor-pointer transition-colors flex-1 sm:w-44 min-w-[140px]"
                title="SEBI Risk Profile — Click to complete in Settings"
              >
                <div className="text-sm font-semibold text-[#8B93A7] mb-0.5">
                  risk profile
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#8B93A7] text-center my-0.5">
                  Not Assessed
                </div>
                <div className="text-[10px] font-bold text-[#C57D25] mt-0.5 flex items-center gap-1 hover:underline">
                  Complete in Settings &rarr;
                </div>
              </div>
            )}

            {/* Health Score Badge Card top right */}
            <div 
              onClick={() => setCurrentPage('red-flags')}
              className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-[#C57D25] transition-colors flex-1 sm:w-44 min-w-[140px]"
            >
              <div className="text-sm font-semibold text-[#8B93A7] mb-0.5">
                health score
              </div>
              <div className="text-3xl font-extrabold text-[#C57D25] font-mono-num">
                {healthScore}
              </div>
              <DataFreshnessIndicator
                uploadedCas={uploadedCas}
                onReUpload={() => setCurrentPage('dashboard')}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {uploadedCas && !isHouseholdActive && (
          <div className="mb-8 bg-white rounded-2xl border border-[#EDE9DF] p-5 shadow-xs">
            <div className="grid gap-3 sm:grid-cols-3 text-xs text-[#6B7280]">
              <div>
                <div className="font-semibold text-[#14213D] text-sm">Investor</div>
                <div>{uploadedCas.investorName}</div>
              </div>
              <div>
                <div className="font-semibold text-[#14213D] text-sm">Statement Period</div>
                <div>{uploadedCas.statementPeriod}</div>
              </div>
              <div>
                <div className="font-semibold text-[#14213D] text-sm">Total Assets</div>
                <div>₹{uploadedCas.totalAssets.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="font-semibold text-[#14213D] text-sm">Holdings Count</div>
                <div>{uploadedCas.holdingsCount}</div>
              </div>
              <div>
                <div className="font-semibold text-[#14213D] text-sm">Detected Brokers</div>
                <div>{uploadedCas.detectedBrokers.join(', ') || 'Unknown'}</div>
              </div>
              <div>
                <div className="font-semibold text-[#14213D] text-sm">PAN (masked)</div>
                <div>{uploadedCas.pan.substring(0, 5)}****{uploadedCas.pan.substring(9)}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#EDE9DF] text-xs text-[#475569]">
              <div className="font-semibold mb-2 text-[#14213D]">Raw Extracted Text Preview</div>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-[#F8FAFC] border border-[#EDE9DF] p-3 font-mono text-[11px] whitespace-pre-wrap">
                {uploadedCas.rawExtractedText || 'No raw text available.'}
              </div>
            </div>
          </div>
        )}

        {/* 3 Asset Class Summary Boxes matching Image 2 EXACTLY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          
          {/* Equities Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-sm font-medium text-[#8B93A7] mb-1">
              {isHouseholdActive ? 'combined equities' : 'equities'}
            </div>
            <div className="text-2xl font-bold font-mono-num text-[#14213D]">
              ₹{displayEquities.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              {displayEquitiesPct}% of portfolio
            </div>
          </div>

          {/* Bonds Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-sm font-medium text-[#8B93A7] mb-1">
              {isHouseholdActive ? 'combined bonds / g-secs' : 'bonds'}
            </div>
            <div className="text-2xl font-bold font-mono-num text-[#14213D]">
              ₹{displayBonds.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              {displayBondsPct}% of portfolio
            </div>
          </div>

          {/* REITs / InvITs Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-sm font-medium text-[#8B93A7] mb-1">
              {isHouseholdActive ? 'combined REITs / InvITs' : 'REITs / InvITs'}
            </div>
            <div className="text-2xl font-bold font-mono-num text-[#14213D]">
              ₹{displayReits.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              {displayReitsPct}% of portfolio
            </div>
          </div>

        </div>

        {/* Red Alert Banner matching Image 2 EXACTLY */}
        {topFlag && (
          <div 
            onClick={() => setCurrentPage('red-flags')}
            className="mb-8 bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-5 flex items-start space-x-4 shadow-xs cursor-pointer hover:border-[#EF4444] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 border border-[#FCA5A5] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-base text-[#991B1B] ${getLanguageFontClass(preferredLanguage)}`}>
                {translateExplanation(topFlag.title, preferredLanguage)}
              </h3>
              <p className={`text-sm text-[#7F1D1D] mt-1 leading-relaxed ${getLanguageFontClass(preferredLanguage)}`}>
                {translateExplanation(topFlag.description, preferredLanguage)}
              </p>
            </div>
          </div>
        )}

        {/* Nomination & Estate Readiness Card — shown whenever there are holdings */}
        {nomineeStats.total > 0 && (() => {
          const allConfirmed = nomineeStats.confirmed === nomineeStats.total && nomineeStats.total > 0;
          const anyMissing   = nomineeStats.missing > 0;
          // anyMissing → red; allConfirmed → emerald; otherwise (unset) → gold
          const cardBg      = allConfirmed ? 'bg-[#F0FDF4]' : anyMissing ? 'bg-[#FDF2F2]' : 'bg-[#FFF8EE]';
          const cardBorder  = allConfirmed ? 'border-[#6EE7B7]' : anyMissing ? 'border-[#FCA5A5]' : 'border-[#F7E5C8]';
          const hoverBorder = allConfirmed ? 'hover:border-[#2BB673]' : anyMissing ? 'hover:border-[#EF4444]' : 'hover:border-[#C57D25]';
          const iconBg      = allConfirmed ? 'bg-[#2BB673]/10 border-[#6EE7B7] text-[#2BB673]' : anyMissing ? 'bg-[#EF4444]/10 border-[#FCA5A5] text-[#EF4444]' : 'bg-[#C57D25]/10 border-[#F7E5C8] text-[#C57D25]';
          const headingColor = allConfirmed ? 'text-[#166534]' : anyMissing ? 'text-[#991B1B]' : 'text-[#92400E]';
          const bodyColor    = allConfirmed ? 'text-[#166534]' : anyMissing ? 'text-[#7F1D1D]' : 'text-[#78350F]';

          const summaryLine = allConfirmed
            ? `All ${nomineeStats.total} account${nomineeStats.total !== 1 ? 's have' : ' has'} a nominee registered`
            : `${nomineeStats.confirmed} of ${nomineeStats.total} account${nomineeStats.total !== 1 ? 's have' : ' has'} a nominee registered`;

          const explainLine = allConfirmed
            ? 'Your family can access all holdings without a court-order claim process in the event of estate transfer.'
            : nomineeStats.firstMissingHoldingName
              ? `Without a nominee, your ${nomineeStats.firstMissingHoldingName} holding may require a lengthy legal claim process for your family to access funds.`
              : 'Confirm nominee status for each account in Settings to protect your family from a lengthy legal claim process.';

          return (
            <div
              onClick={() => setCurrentPage('settings')}
              className={`mb-8 ${cardBg} border ${cardBorder} rounded-2xl p-5 flex items-start space-x-4 shadow-xs cursor-pointer ${hoverBorder} transition-colors`}
            >
              <div className={`w-8 h-8 rounded-lg ${iconBg} border flex items-center justify-center shrink-0 mt-0.5`}>
                {allConfirmed
                  ? <UserCheck className="w-5 h-5" />
                  : <UserX className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-base ${headingColor} ${getLanguageFontClass(preferredLanguage)}`}>
                  {translateExplanation(`Nomination & Estate Readiness — ${summaryLine}`, preferredLanguage)}
                </h3>
                <p className={`text-sm ${bodyColor} mt-1 leading-relaxed ${getLanguageFontClass(preferredLanguage)}`}>
                  {translateExplanation(explainLine, preferredLanguage)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Portfolio Guardian Proactive Event Scan Feed */}
        <div className="mb-8">
          <PortfolioGuardianFeed />
        </div>

        {/* Health Score Breakdown Card */}
        <div className="bg-white rounded-2xl border border-[#EDE9DF] shadow-xs mb-8">

          {/* Card Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-0.5">portfolio health</div>
              <h3 className="font-extrabold text-base text-[#14213D]">Health Score Breakdown</h3>
            </div>
            <span className="hidden sm:inline text-[10px] font-mono bg-[#FAF8F5] border border-[#EDE9DF] px-2.5 py-1 rounded-lg text-[#8B93A7]">
              100 &minus; penalties + bonuses
            </span>
          </div>

          {/* Gauge + Factor rows */}
          <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-10">

            {/* Semicircular SVG gauge */}
            <div className="flex flex-col items-center shrink-0">
              <svg
                width={GAUGE_CX * 2}
                height={GAUGE_CY + 20}
                viewBox={`0 0 ${GAUGE_CX * 2} ${GAUGE_CY + 20}`}
                aria-label={`Health Score: ${healthScore} out of 100`}
              >
                {/* Track */}
                <path
                  d={`M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`}
                  fill="none" stroke="#EDE9DF" strokeWidth="12" strokeLinecap="round"
                />
                {/* Fill */}
                <path
                  d={`M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={String(gaugeCircumference)}
                  strokeDashoffset={String(gaugeDashOffset)}
                  style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s ease' }}
                />
                {/* Score number */}
                <text
                  x={GAUGE_CX} y={GAUGE_CY - 10}
                  textAnchor="middle" fontSize="34" fontWeight="900"
                  fill={scoreColor} fontFamily="system-ui, sans-serif"
                >
                  {healthScore}
                </text>
                <text
                  x={GAUGE_CX} y={GAUGE_CY + 8}
                  textAnchor="middle" fontSize="10" fill="#8B93A7"
                  fontFamily="system-ui, sans-serif"
                >
                  out of 100
                </text>
                {/* Range labels */}
                <text x={GAUGE_CX - GAUGE_R + 2} y={GAUGE_CY + 18} textAnchor="middle" fontSize="9" fill="#CBD5E1" fontFamily="system-ui">0</text>
                <text x={GAUGE_CX + GAUGE_R - 2} y={GAUGE_CY + 18} textAnchor="middle" fontSize="9" fill="#CBD5E1" fontFamily="system-ui">100</text>
              </svg>

              {/* Status label */}
              <div
                className="mt-1 text-xs font-bold px-3 py-0.5 rounded-full"
                style={{ color: scoreColor, backgroundColor: scoreBg }}
              >
                {scoreLabel}
              </div>

              {/* Data freshness indicator under gauge */}
              <DataFreshnessIndicator
                uploadedCas={uploadedCas}
                onReUpload={() => setCurrentPage('dashboard')}
                className="mt-2 text-center"
              />

              {/* Inline formula */}
              <div className="mt-3 text-[11px] font-mono text-center leading-relaxed">
                <span className="text-[#8B93A7]">100</span>
                {(healthScoreBreakdown.breakdown || healthScoreBreakdown.factors || [])
                  .filter(f => (f.penaltyOrBonus ?? f.penalty ?? 0) < 0)
                  .map((f, i) => (
                    <span key={i} className="text-[#EF4444]"> {f.penaltyOrBonus ?? f.penalty}</span>
                  ))}
                {(healthScoreBreakdown.breakdown || healthScoreBreakdown.factors || [])
                  .filter(f => (f.penaltyOrBonus ?? f.penalty ?? 0) > 0)
                  .map((f, i) => (
                    <span key={i} className="text-[#2BB673]"> +{f.penaltyOrBonus ?? f.penalty}</span>
                  ))}
                <span className="text-[#8B93A7]"> = </span>
                <strong style={{ color: scoreColor }}>{healthScore}</strong>
              </div>
            </div>

            {/* Factor rows */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {(healthScoreBreakdown.breakdown || healthScoreBreakdown.factors || []).map((factor, idx) => {
                const itemKey = factor.id || factor.factor || `f-${idx}`;
                const isExpanded = expandedFactor === itemKey;
                const penaltyVal = factor.penaltyOrBonus ?? factor.penalty ?? 0;
                const isBonus    = penaltyVal > 0;
                const displayFactorName = translateExplanation(factor.factor || factor.label || 'Risk Factor', preferredLanguage);
                const displayReason = translateExplanation(factor.reason || factor.description || '', preferredLanguage);
                const displaySuggestion = translateExplanation(factor.suggestion || factor.reason || '', preferredLanguage);

                return (
                  <div
                    key={itemKey}
                    onClick={() => setExpandedFactor(isExpanded ? null : itemKey)}
                    className="cursor-pointer rounded-xl px-3 py-2.5 hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#EDE9DF] select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isBonus ? 'bg-[#E6F4EA] text-[#2BB673]' : penaltyVal === 0 ? 'bg-[#F1EFE9] text-[#6B7280]' : 'bg-[#FDF2F2] text-[#EF4444]'
                      }`}>
                        {isBonus
                          ? <CheckCircle className="w-3.5 h-3.5" />
                          : <AlertTriangle className="w-3.5 h-3.5" />}
                      </div>
                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold text-[#14213D] truncate ${getLanguageFontClass(preferredLanguage)}`}>{displayFactorName}</div>
                        <div className={`text-xs text-[#8B93A7] truncate ${getLanguageFontClass(preferredLanguage)}`}>{displayReason}</div>
                      </div>
                      {/* Penalty chip + chevron */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono-num ${
                          isBonus
                            ? 'bg-[#E6F4EA] text-[#2BB673]'
                            : penaltyVal === 0
                            ? 'bg-[#F1EFE9] text-[#6B7280]'
                            : 'bg-[#FDF2F2] text-[#EF4444]'
                        }`}>
                          {penaltyVal > 0 ? `+${penaltyVal}` : penaltyVal}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#8B93A7] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Expanded suggestion */}
                    {isExpanded && (
                      <div className="mt-2.5 ml-10 p-3 bg-[#FFF8EE] border border-[#F7E5C8] rounded-xl">
                        <p className={`text-sm text-[#63451B] leading-relaxed ${getLanguageFontClass(preferredLanguage)}`}>{displaySuggestion}</p>
                        {factor.sebiRuleRef && (
                          <p className="text-xs text-[#8B93A7] mt-1.5 font-mono">{factor.sebiRuleRef}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery potential footer */}
          {(() => {
            const list = healthScoreBreakdown.breakdown || healthScoreBreakdown.factors || [];
            const totalPenalty = list
              .filter(f => (f.penaltyOrBonus ?? f.penalty ?? 0) < 0)
              .reduce((s, f) => s - (f.penaltyOrBonus ?? f.penalty ?? 0), 0);
            const penaltyCount = list.filter(f => (f.penaltyOrBonus ?? f.penalty ?? 0) < 0).length;
            const potential = Math.min(100, healthScore + totalPenalty);
            return totalPenalty > 0 ? (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <div className="bg-[#F6F4ED] rounded-xl p-3.5 border border-[#EDE9DF] flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-[#2BB673] shrink-0" />
                  <p className="text-xs text-[#475569]">
                    <strong className="text-[#14213D]">Recovery potential:</strong>{' '}
                    Addressing all {penaltyCount} penalty factor{penaltyCount !== 1 ? 's' : ''} could recover up to{' '}
                    <strong className="text-[#2BB673]">+{totalPenalty} pts</strong> &rarr; potential score:{' '}
                    <strong className="text-[#2BB673]">{potential}</strong>
                  </p>
                </div>
              </div>
            ) : null;
          })()}

        </div>

        {/* Portfolio Story & Score History Timeline */}
        <div className="mb-8">
          <PortfolioStoryTimeline
            events={healthScoreEvents}
            mode="condensed"
            onViewFullHistory={() => navigateTo('settings')}
          />
        </div>

        {/* Quick Action Navigation Grid */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          
          <div 
            onClick={() => setCurrentPage('explainability')}
            className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#C57D25] transition-all cursor-pointer shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center font-bold">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#14213D]">Explainability Center</h4>
                <p className="text-sm text-[#8B93A7]">Explore causal chains</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B93A7] group-hover:text-[#C57D25] transition-colors" />
          </div>

          <div 
            onClick={() => setCurrentPage('shock-sandbox')}
            className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#2BB673] transition-all cursor-pointer shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#2BB673] flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#14213D]">Shock Sandbox</h4>
                <p className="text-sm text-[#8B93A7]">Macro stress-testing</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B93A7] group-hover:text-[#2BB673] transition-colors" />
          </div>

          <div 
            onClick={() => setCurrentPage('holdings')}
            className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#C57D25] transition-all cursor-pointer shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#14213D] flex items-center justify-center font-bold border border-[#EDE9DF]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#14213D]">All Holdings</h4>
                <p className="text-sm text-[#8B93A7]">Zerodha, Groww, ICICI</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B93A7] group-hover:text-[#14213D] transition-colors" />
          </div>

        </div>

        {/* Dividend & Coupon Upcoming Income Calendar Card */}
        <div className="bg-white rounded-2xl border border-[#EDE9DF] p-6 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                <Calendar className="w-4 h-4 text-[#C57D25]" />
                <span>Cash Flow &amp; Distribution Schedule</span>
              </div>
              <h3 className="font-extrabold text-base text-[#14213D] mt-1">
                Upcoming Income Calendar
              </h3>
            </div>

            {upcomingIncomeItems.length > 0 && (
              <div className="flex items-center space-x-2 bg-[#FFF8EE] border border-[#F7E5C8] px-3.5 py-1.5 rounded-xl">
                <span className="text-xs text-[#8B93A7] font-semibold">Upcoming Total:</span>
                <span className="font-extrabold font-mono-num text-sm text-[#2BB673]">
                  +₹{totalUpcomingIncome90Days.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {upcomingIncomeItems.length === 0 ? (
            /* Plain one-line empty state pattern */
            <div className="p-6 bg-[#FAF8F5] border border-dashed border-[#EDE9DF] rounded-2xl text-center text-xs text-[#8B93A7]">
              <Calendar className="w-6 h-6 mx-auto text-[#8B93A7] mb-2" />
              <p className="font-bold text-[#14213D]">No upcoming dividend or coupon payouts scheduled</p>
              <p className="text-[#6B7280] mt-0.5">
                Payout dates and estimated cash distributions will appear here as corporate actions and bond coupon dates approach.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EDE9DF] text-[#8B93A7] uppercase tracking-wider font-semibold text-xs">
                    <th className="py-3 px-2">Instrument</th>
                    <th className="py-3 px-2">Payout Type</th>
                    <th className="py-3 px-2 text-right">Estimated Cashflow</th>
                    <th className="py-3 px-2 text-right">Scheduled Payout Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFE9]">
                  {upcomingIncomeItems.map((item) => {
                    const formattedDate = new Date(item.payoutDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr 
                        key={item.id}
                        onClick={() => setCurrentPage('holdings')}
                        className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-2 font-bold text-[#14213D]">
                          <div>{item.name}</div>
                          <div className="text-xs text-[#8B93A7] font-mono">{item.ticker} • {item.broker}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                            item.payoutType === 'coupon'
                              ? 'bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0]'
                              : item.payoutType === 'distribution'
                              ? 'bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]'
                              : 'bg-[#FAF8F5] text-[#14213D] border border-[#EDE9DF]'
                          }`}>
                            {item.payoutType}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono-num font-extrabold text-[#2BB673]">
                          +₹{item.estimatedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono-num font-medium text-[#14213D]">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Portfolio Holdings Summary Table */}
        <div className="bg-white rounded-2xl border border-[#EDE9DF] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-[#14213D]">Top Portfolio Holdings</h3>
            <button
              onClick={() => setCurrentPage('holdings')}
              className="text-sm font-semibold text-[#C57D25] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View all {holdings.length} instruments</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EDE9DF] text-[#8B93A7] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-2">Instrument</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Broker</th>
                  <th className="py-3 px-2 text-right">Value (₹)</th>
                  <th className="py-3 px-2 text-right">Weight</th>
                  <th className="py-3 px-2 text-center">Suitability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFE9]">
                {holdings.map((holding) => (
                  <tr 
                    key={holding.id}
                    onClick={() => setCurrentPage('explainability')}
                    className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-2 font-bold text-[#14213D]">
                      <div>{holding.name}</div>
                      <div className="text-xs text-[#8B93A7] font-mono">{holding.ticker}</div>
                    </td>
                    <td className="py-3 px-2 uppercase text-xs font-semibold text-[#6B7280]">
                      {holding.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-2 text-[#475569]">
                      {holding.broker} ({holding.depository})
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num font-bold text-[#14213D]">
                      ₹{holding.currentValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num font-semibold text-[#6B7280]">
                      {holding.portfolioWeight}%
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                        holding.suitabilityScore >= 80 
                          ? 'bg-[#E6F4EA] text-[#2BB673]' 
                          : 'bg-[#FFF8EE] text-[#C57D25]'
                      }`}>
                        {holding.suitabilityScore}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
