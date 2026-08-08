import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';

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
    uploadedCas 
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
    .reduce((sum, h) => sum + h.currentValue, 0);

  const totalBonds = holdings
    .filter(h => h.category === 'bonds')
    .reduce((sum, h) => sum + h.currentValue, 0);

  const totalReits = holdings
    .filter(h => h.category === 'reits_invits')
    .reduce((sum, h) => sum + h.currentValue, 0);

  const totalValue = totalEquities + totalBonds + totalReits;

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

        {/* Top Portfolio Header matching Image 2 EXACTLY */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-[#8B93A7] mb-1">
              total portfolio value {uploadedCas && <span className="text-[#C57D25]">({uploadedCas.investorName})</span>}
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono-num text-[#14213D] tracking-tight">
              ₹{totalValue.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Health Score Badge Card top right matching Image 2 */}
          <div 
            onClick={() => setCurrentPage('red-flags')}
            className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 sm:px-6 sm:py-3 flex flex-col items-center justify-center shadow-xs cursor-pointer hover:border-[#C57D25] transition-colors"
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

        {uploadedCas && (
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
            <div className="text-sm font-medium text-[#8B93A7] mb-1">equities</div>
            <div className="text-2xl font-bold font-mono-num text-[#14213D]">
              ₹{totalEquities.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              {totalValue > 0 ? ((totalEquities / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </div>
          </div>

          {/* Bonds Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-sm font-medium text-[#8B93A7] mb-1">bonds</div>
            <div className="text-2xl font-bold font-mono-num text-[#14213D]">
              ₹{totalBonds.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              {totalValue > 0 ? ((totalBonds / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </div>
          </div>

          {/* REITs / InvITs Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-sm font-medium text-[#8B93A7] mb-1">REITs / InvITs</div>
            <div className="text-2xl font-bold font-mono-num text-[#14213D]">
              ₹{totalReits.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-[#6B7280] mt-1 font-medium">
              {totalValue > 0 ? ((totalReits / totalValue) * 100).toFixed(1) : 0}% of portfolio
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
              <h3 className="font-bold text-base text-[#991B1B]">
                {topFlag.title}
              </h3>
              <p className="text-sm text-[#7F1D1D] mt-1 leading-relaxed">
                {topFlag.description}
              </p>
            </div>
          </div>
        )}

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
                const displayFactorName = factor.factor || factor.label || 'Risk Factor';
                const displayReason = factor.reason || factor.description || '';
                const displaySuggestion = factor.suggestion || factor.reason || '';

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
                        <div className="text-sm font-bold text-[#14213D] truncate">{displayFactorName}</div>
                        <div className="text-xs text-[#8B93A7] truncate">{displayReason}</div>
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
                        <p className="text-sm text-[#63451B] leading-relaxed">{displaySuggestion}</p>
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
