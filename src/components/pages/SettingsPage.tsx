import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { PortfolioStoryTimeline } from '../portfolio/PortfolioStoryTimeline';
import { Settings, Upload, Trash2, Download, ShieldCheck, Terminal, User, X, RotateCcw, UserCheck, UserX, Edit3, Sliders, Coins, AlertCircle, CheckCircle2, Users, Lock, Sparkles, Mail, Check, UserPlus, Clock, Languages } from 'lucide-react';
import { RiskProfilerForm } from '../portfolio/RiskProfilerForm';
import { getSebiRiskVisualTokens, SEBI_RISK_RANKS } from '../../utils/riskProfiler';
import { LanguageToggle } from '../ui/LanguageToggle';

import { downloadJsonFile, downloadPortfolioExportPdf } from '../../utils/fileExport';
import { supabase } from '../../lib/supabaseClient';

export const SettingsPage: React.FC = () => {
  const { 
    handleCasUpload, 
    cancelCasUpload, 
    uploadedCas, 
    resetPortfolio, 
    healthScoreEvents, 
    holdings, 
    redFlags, 
    healthScore, 
    nomineeStats, 
    setNomineeStatus, 
    riskCategory, 
    riskProfilerAnswers, 
    setRiskProfile,
    monthlyExpensesEstimate,
    setMonthlyExpensesEstimate,
    role,
    hasActivePremiumAccess,
    user,
    userRecord,
    startFreeTrial,
    householdLink,
    householdPartnerSummary,
    requestHouseholdLink,
    acceptHouseholdLink,
    revokeHouseholdLink,
    toggleShareDetails,
  } = useApp();

  const [partnerEmailInput, setPartnerEmailInput] = useState<string>('');
  const [householdNotice, setHouseholdNotice] = useState<string | null>(null);
  const [isProcessingLink, setIsProcessingLink] = useState<boolean>(false);

  const [expenseInput, setExpenseInput] = useState<string>(
    monthlyExpensesEstimate !== null ? String(monthlyExpensesEstimate) : ''
  );
  const [expenseSavedNotice, setExpenseSavedNotice] = useState<string | null>(null);

  const liquidBuffer = (holdings || [])
    .filter(
      (h) =>
        h.category === 'cash' ||
        /liquid|overnight|money market|savings|treasury/i.test(h.name) ||
        /liquid|cash/i.test(h.ticker)
    )
    .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  const monthsCovered = monthlyExpensesEstimate && monthlyExpensesEstimate > 0
    ? liquidBuffer / monthlyExpensesEstimate
    : null;

  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [riskSavedNotice, setRiskSavedNotice] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState(false);

  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);
  const [demoResetStatus, setDemoResetStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportedData, setExportedData] = useState<object | null>(null);
  const [exportFilename, setExportFilename] = useState<string>('');
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [showExportPreview, setShowExportPreview] = useState<boolean>(false);

  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus(null);
    setUploadError(null);
  }, []);

  const handleCancel = useCallback(() => {
    cancelCasUpload();
    resetUploadState();
  }, [cancelCasUpload, resetUploadState]);

  const handleRightToErasurePurge = async () => {
    const confirmed = window.confirm(
      "This will permanently delete your portfolio data and cannot be undone — are you sure?"
    );
    if (!confirmed) return;

    setIsPurging(true);
    setPurgeStatus("Executing Right to Erasure data purge across servers...");
    try {
      await resetPortfolio();
      setPurgeStatus("✅ Local CAS statement, audit logs & sensitive identifiers purged under Right to Erasure.");
      alert("Local CAS statement & sensitive identifiers purged under Right to Erasure.");
    } catch (err) {
      setPurgeStatus("❌ Failed to execute complete data purge.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleDemoReset = async () => {
    const confirmed = window.confirm(
      "Reset portfolio and demo state back to clean default baseline?"
    );
    if (!confirmed) return;

    setIsPurging(true);
    setDemoResetStatus("Resetting demo data & purging upload history...");
    try {
      await resetPortfolio();
      setDemoResetStatus("✅ Demo data reset to clean baseline state (no leftover holdings, red flags, or audit rows).");
    } catch (err) {
      setDemoResetStatus("❌ Failed to reset demo data.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleExportPortfolioData = async () => {
    setIsExporting(true);
    setExportStatus('Gathering your portfolio data…');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('You must be logged in to export your data.');
      }

      setExportStatus('Fetching data from Supabase and assembling export file…');

      const response = await fetch('/api/export-portfolio-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          holdings,
          healthScore,
          healthScoreBreakdown: null, // breakdown is computed server-side on demand
          redFlags,
          healthScoreEvents,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || response.statusText || 'Server returned an error during export.');
      }

      const exportData = await response.json();
      setExportedData(exportData);

      // Build a user-friendly filename with the date
      const dateStr = new Date().toISOString().slice(0, 10);
      const userId = exportData.userProfile?.userId?.slice(0, 8) || 'user';
      const filename = `vestiq_dpdp_export_${userId}_${dateStr}`;
      const jsonFilename = `${filename}.json`;
      const pdfFilename = `${filename}.pdf`;
      setExportFilename(jsonFilename);

      console.log('handleExportPortfolioData: exportData ready, invoking downloadPortfolioExportPdf', {
        pdfFilename,
        exportDataKeys: Object.keys(exportData || {}),
      });

      await downloadPortfolioExportPdf(exportData, pdfFilename);

      const holdingsCount = exportData.portfolio?.holdingsCount ?? 0;
      const uploadHistoryCount = exportData.uploadHistory?.length ?? 0;
      const warningText = exportData.warnings?.length
        ? ` Note: ${exportData.warnings.join('; ')}`
        : '';

      setExportStatus(
        `✅ Export complete — PDF downloaded. Includes ${holdingsCount} holding${holdingsCount !== 1 ? 's' : ''}, ` +
        `${uploadHistoryCount} upload record${uploadHistoryCount !== 1 ? 's' : ''}, and health score history.${warningText}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setExportStatus(`❌ Export failed: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJsonExport = () => {
    if (!exportedData) return;
    const filename = exportFilename || 'vestiq_dpdp_export.json';
    downloadJsonFile(exportedData, filename);
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so the same file can be re-selected after cancel

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadStatus(`Starting parsing for ${file.name}...`);

    try {
      const result = await handleCasUpload(file, {
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
        setUploadStatus(`✅ Successfully parsed via server! Holdings & red flags updated.`);
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Settings className="w-4 h-4" />
              <span>User & Account Management</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              Settings & CAS Import
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Import CAS statements, manage depository connections, and configure data privacy settings.
            </p>
          </div>
        </div>

        {/* CAS File Drag & Drop Box */}
        <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-[#C57D25] shadow-xs mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mx-auto mb-4 border border-[#F7E5C8]">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-extrabold text-[#14213D] mb-1">
            Import NSDL / CDSL Consolidated Account Statement (CAS)
          </h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto mb-6">
            Upload your CAS PDF (e.g. Priya Sharma CAS or NSDL/CDSL statement) to parse holdings & calculate red flags automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isUploading ? (
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-[#FDF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#B91C1C] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel Upload</span>
              </button>
            ) : (
              <>
                <label className="px-6 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Choose CAS PDF File</span>
                  <input type="file" accept=".pdf" onChange={onFileUpload} className="hidden" />
                </label>

                <button
                  onClick={async () => {
                    setUploadStatus('Parsing sample CAS statement...');
                    await handleCasUpload('sample_cas.pdf');
                    setUploadStatus('Loaded Priya Sharma sample CAS data! Holdings & red flags updated.');
                  }}
                  className="px-5 py-3 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Load Priya Sharma CAS Sample
                </button>
              </>
            )}
          </div>

          {uploadStatus && (
            <div className="mt-4 space-y-3">
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
                    <span>Processing — click Cancel Upload above to abort.</span>
                  </div>
                </>
              )}
              {uploadError && (
                <div className="text-xs font-bold rounded-xl p-3 text-[#B91C1C] bg-[#FEE2E2] border border-[#FECACA] flex items-start space-x-2">
                  <div>
                    <div className="font-semibold text-[#991B1B]">Upload failed</div>
                    <div>{uploadError}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadedCas && (
            <div className="mt-4 pt-4 border-t border-[#EDE9DF] text-left text-xs bg-[#FAF8F5] p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-[#14213D] text-sm">✅ Statement Parsed Successfully</div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0] px-2 py-0.5 rounded-full font-bold">
                    {uploadedCas.holdingsCount} Holdings Found
                  </span>
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-[10px] bg-[#FAF8F5] border border-[#EDE9DF] text-[#6B7280] hover:text-[#C57D25] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>{showDebug ? 'Hide Technical Parser Log' : 'View Technical Parser Log'}</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2 text-[11px]">
                <div><span className="text-[#8B93A7]">Investor:</span> <strong>{uploadedCas.investorName}</strong></div>
                <div><span className="text-[#8B93A7]">PAN:</span> <strong className="font-mono">{uploadedCas.pan}</strong></div>
                <div><span className="text-[#8B93A7]">Period:</span> <strong>{uploadedCas.statementPeriod}</strong></div>
                <div><span className="text-[#8B93A7]">Depositories:</span> <strong>{uploadedCas.detectedBrokers.join(', ')}</strong></div>
              </div>
              {showDebug && uploadedCas.rawExtractedText && (
                <div className="mt-3 pt-3 border-t border-[#EDE9DF]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B93A7] mb-1">Raw Extracted Text Snippet (PyMuPDF / pdfplumber):</div>
                  <pre className="bg-white text-[#14213D] border border-[#EDE9DF] p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40 whitespace-pre-wrap">
                    {uploadedCas.rawExtractedText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Story & Complete Health Score History */}
        <div className="mb-8">
          <PortfolioStoryTimeline
            events={healthScoreEvents}
          />
        </div>

        {/* SEBI Risk Profile & Suitability Assessment Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>SEBI Investor Risk Profiler</span>
              </div>
              <h3 className="font-extrabold text-base text-[#14213D] mt-1">
                Risk Profile & Suitability Assessment
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Your assessed risk tolerance feeds directly into the Suitability Engine. Holdings exceeding your risk band trigger active compliance alerts.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {(() => {
                const riskTokens = getSebiRiskVisualTokens(riskCategory);
                return (
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${riskTokens.badge}`}>
                    {riskCategory ? `${riskCategory} (Riskometer ${SEBI_RISK_RANKS[riskCategory] || 3}/6)` : 'Not Assessed'}
                  </span>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  setIsEditingRisk(!isEditingRisk);
                  setRiskSavedNotice(null);
                }}
                className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C57D25]" />
                <span>{isEditingRisk ? 'Close Questionnaire' : riskCategory ? 'Retake Assessment' : 'Take Assessment'}</span>
              </button>
            </div>
          </div>

          {riskSavedNotice && (
            <div className="mb-4 p-3 bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#2BB673]">
              {riskSavedNotice}
            </div>
          )}

          {isEditingRisk ? (
            <div className="mt-2 pt-2">
              <RiskProfilerForm
                initialAnswers={riskProfilerAnswers}
                onComplete={(cat, ans) => {
                  setRiskProfile(cat, ans);
                  setIsEditingRisk(false);
                  setRiskSavedNotice(`✅ Updated your SEBI risk profile to "${cat}" (Riskometer Level ${SEBI_RISK_RANKS[cat]}/6). Suitability alerts and Health Score updated.`);
                }}
                onCancel={() => setIsEditingRisk(false)}
                submitLabel="Save Updated Profile & Recalculate Suitability"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">SEBI Risk Band</div>
                <div className="font-extrabold text-[#14213D] text-sm mt-0.5">{riskCategory || 'Not Assessed'}</div>
                <div className="text-[11px] text-[#6B7280] mt-1">{riskCategory ? `Level ${SEBI_RISK_RANKS[riskCategory] || 3} of 6 on standard Riskometer` : 'Pending questionnaire completion'}</div>
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Suitability Rule</div>
                <div className="font-extrabold text-[#14213D] text-sm mt-0.5">{riskCategory ? 'Automated Risk Filter' : 'Default Filter'}</div>
                <div className="text-[11px] text-[#6B7280] mt-1">{riskCategory ? `Flags holdings with risk rating above ${riskCategory}` : 'Flags high-risk and locked-in mis-selling'}</div>
              </div>
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Assessment Status</div>
                <div className={`font-extrabold text-sm mt-0.5 ${riskCategory ? 'text-[#2BB673]' : 'text-[#8B93A7]'}`}>
                  {riskCategory ? 'Active & Applied' : 'Not Yet Assessed'}
                </div>
                <div className="text-[11px] text-[#6B7280] mt-1">
                  {riskCategory ? 'Calculated across 5 regulatory parameters' : 'Complete 5-question SEBI assessment'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Linked Accounts */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-[#14213D] mb-4">Linked Depositories & Accounts</h3>
          
          <div className="space-y-3 text-xs">
            {[
              { name: 'Zerodha Broking (CDSL)', status: 'Connected', holdings: '2 Holdings' },
              { name: 'Groww (NSDL)', status: 'Connected', holdings: '1 Holding' },
              { name: 'ICICI Direct (NSDL)', status: 'Connected', holdings: '1 Holding' },
              { name: 'RBI Retail Direct Portal', status: 'Connected', holdings: '1 G-Sec' }
            ].map((acc, idx) => (
              <div key={idx} className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#14213D]">{acc.name}</div>
                  <div className="text-[10px] text-[#8B93A7]">{acc.holdings}</div>
                </div>
                <span className="bg-[#E6F4EA] text-[#2BB673] px-2.5 py-0.5 rounded-full font-bold">
                  {acc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nominee Registration Status */}
        {nomineeStats.total > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
            <h3 className="font-extrabold text-base text-[#14213D] mb-1">Nominee Registration Status</h3>
            <p className="text-xs text-[#6B7280] mb-4">
              CAS statements don't include nominee data — self-report your status per account below.
              Without a registered nominee, your family may need a lengthy court-order process to claim holdings.
            </p>

            <div className="space-y-3 text-xs">
              {nomineeStats.brokers.map((acc) => {
                const isSet     = acc.nominee_registered === true;
                const isMissing = acc.nominee_registered === false;
                const isUnset   = acc.nominee_registered === null;

                const holdingCount = holdings.filter(h => h.broker === acc.broker).length;

                const badgeCls = isSet
                  ? 'bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0]'
                  : isMissing
                    ? 'bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]'
                    : 'bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]';
                const badgeLabel = isSet ? 'Nominee set ✓' : isMissing ? 'No nominee' : 'Not confirmed';

                return (
                  <div key={acc.broker} className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#14213D]">{acc.broker}</div>
                      <div className="text-[10px] text-[#8B93A7]">
                        {holdingCount} Holding{holdingCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Status badge */}
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${badgeCls}`}>
                        {badgeLabel}
                      </span>

                      {/* Action buttons — reuse exact xs pill style from Settings buttons */}
                      {!isSet && (
                        <button
                          onClick={() => setNomineeStatus(acc.broker, true)}
                          className="px-2.5 py-0.5 bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0] rounded-full font-bold text-[10px] cursor-pointer hover:bg-[#D1FAE5] transition-colors"
                        >
                          Mark as set
                        </button>
                      )}
                      {!isMissing && (
                        <button
                          onClick={() => setNomineeStatus(acc.broker, false)}
                          className="px-2.5 py-0.5 bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5] rounded-full font-bold text-[10px] cursor-pointer hover:bg-[#FEE2E2] transition-colors"
                        >
                          Mark as missing
                        </button>
                      )}
                      {!isUnset && (
                        <button
                          onClick={() => setNomineeStatus(acc.broker, null)}
                          className="px-2.5 py-0.5 bg-[#FAF8F5] text-[#6B7280] border border-[#EDE9DF] rounded-full font-bold text-[10px] cursor-pointer hover:bg-[#F1EFE9] transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Emergency Fund Adequacy & Monthly Living Expenses */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                <Coins className="w-4 h-4 text-[#C57D25]" />
                <span>Emergency Fund Adequacy</span>
              </div>
              <h3 className="font-extrabold text-base text-[#14213D] mt-1">
                Roughly what are your monthly expenses?
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Self-report your estimated monthly expenses to evaluate your liquid buffer safety margin before committing capital into illiquid investments.
              </p>
            </div>

            {monthsCovered !== null ? (
              <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ${
                monthsCovered >= 3.0
                  ? 'bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0]'
                  : 'bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]'
              }`}>
                {monthsCovered >= 3.0 ? `✓ Safe (${monthsCovered.toFixed(1)} mo buffer)` : `⚠ Thin Buffer (${monthsCovered.toFixed(1)} mo)`}
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] shrink-0">
                Not Set · Check Inactive
              </span>
            )}
          </div>

          {expenseSavedNotice && (
            <div className="mb-4 p-3 bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#2BB673]">
              {expenseSavedNotice}
            </div>
          )}

          {/* Input & Quick Presets */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-[#14213D] mb-2">
              Monthly Living Expenses (₹)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8B93A7]">₹</span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="e.g. 50000"
                  value={expenseInput}
                  onChange={(e) => setExpenseInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] rounded-xl text-sm font-bold text-[#14213D] focus:outline-none focus:border-[#C57D25]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = expenseInput.trim() ? Math.max(0, Number(expenseInput)) : null;
                  setMonthlyExpensesEstimate(val);
                  setExpenseSavedNotice(
                    val !== null
                      ? `✅ Saved estimated monthly expenses of ₹${val.toLocaleString('en-IN')}. Emergency Fund Adequacy check updated.`
                      : '✅ Cleared monthly expenses estimate. Emergency Fund Adequacy check disabled.'
                  );
                }}
                className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Save Estimate
              </button>

              {monthlyExpensesEstimate !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setExpenseInput('');
                    setMonthlyExpensesEstimate(null);
                    setExpenseSavedNotice('✅ Cleared monthly expenses estimate.');
                  }}
                  className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#6B7280] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] text-[#8B93A7] font-semibold mr-1">Quick presets:</span>
              {[25000, 50000, 75000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setExpenseInput(String(preset));
                    setMonthlyExpensesEstimate(preset);
                    setExpenseSavedNotice(`✅ Saved estimated monthly expenses of ₹${preset.toLocaleString('en-IN')}.`);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    monthlyExpensesEstimate === preset
                      ? 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
                      : 'bg-[#FAF8F5] text-[#6B7280] border-[#EDE9DF] hover:border-[#C57D25]'
                  }`}
                >
                  ₹{(preset / 1000).toFixed(0)}k / mo
                </button>
              ))}
            </div>
          </div>

          {/* 3 Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
              <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Current Liquid Buffer</div>
              <div className="font-extrabold text-[#14213D] text-sm mt-0.5">
                ₹{liquidBuffer.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Cash & short-duration liquid holdings</div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
              <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Monthly Expenses</div>
              <div className="font-extrabold text-[#14213D] text-sm mt-0.5">
                {monthlyExpensesEstimate ? `₹${monthlyExpensesEstimate.toLocaleString('en-IN')} / mo` : 'Not Provided'}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Self-reported living expenditure</div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
              <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">3-Month Safety Floor</div>
              <div className={`font-extrabold text-sm mt-0.5 ${
                monthsCovered === null
                  ? 'text-[#8B93A7]'
                  : monthsCovered >= 3.0
                    ? 'text-[#2BB673]'
                    : 'text-[#EF4444]'
              }`}>
                {monthsCovered !== null ? `${monthsCovered.toFixed(1)} Months Coverage` : 'Needs Expense Input'}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">
                {monthsCovered !== null
                  ? monthsCovered >= 3.0
                    ? 'Buffer meets standard 3-month safety ceiling'
                    : 'Buffer is below 3x monthly expenses'
                  : 'Add expenses to evaluate adequacy'}
              </div>
            </div>
          </div>
        </div>

        {/* Language & Explainability Preferences Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                <Languages className="w-4 h-4 text-[#C57D25]" />
                <span>Explainability Language Preferences</span>
              </div>
              <h3 className="font-extrabold text-base text-[#14213D] mt-1">
                Causal Explanation Language
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Translate portfolio explainability sentences, Health Score reasons, and Red Flag alerts into Tamil while keeping holding names and rupee numbers intact.
              </p>
            </div>

            <LanguageToggle />
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-xs text-[#6B7280] leading-relaxed">
            <span className="font-bold text-[#14213D]">Note on Typography: </span>
            Selecting <span className="font-bold font-tamil text-[#14213D]">தமிழ் (Tamil)</span> activates native <code className="text-[#C57D25] bg-[#FFF8EE] px-1.5 py-0.5 rounded">Noto Sans Tamil</code> font rendering for Tamil explanation text, preventing missing glyphs while maintaining exact spacing and layout.
          </div>
        </div>

        {/* Household & Family Portfolio Linking Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                <Users className="w-4 h-4 text-[#C57D25]" />
                <span>Premium Feature · Household Consent Protocol</span>
              </div>
              <h3 className="font-extrabold text-base text-[#14213D] mt-1">
                Household & Family Portfolio Linking
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Optionally link a family member's account with explicit two-way consent to view combined net worth, asset allocation, and emergency buffer safety.
              </p>
            </div>

            {(() => {
              const isPrem = hasActivePremiumAccess || role === 'investor_premium' || role === 'admin';
              if (!isPrem) {
                return (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] shrink-0 flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Premium Only</span>
                  </span>
                );
              }
              if (!householdLink || householdLink.status === 'revoked') {
                return (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#FAF8F5] text-[#8B93A7] border border-[#EDE9DF] shrink-0">
                    Not Linked
                  </span>
                );
              }
              if (householdLink.status === 'pending') {
                return (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] shrink-0 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#C57D25]" />
                    <span>Pending Consent</span>
                  </span>
                );
              }
              return (
                <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0] shrink-0 flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Household Linked</span>
                </span>
              );
            })()}
          </div>

          {householdNotice && (
            <div className="mb-4 p-3 bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#2BB673] flex items-center justify-between">
              <span>{householdNotice}</span>
              <button onClick={() => setHouseholdNotice(null)} className="text-[#2BB673] hover:text-[#14213D] cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Premium Gating Preview */}
          {!hasActivePremiumAccess && role === 'investor_free' ? (
            <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5 text-xs text-[#63451B]">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div>
                  <div className="font-extrabold text-sm text-[#92400E] mb-1">
                    Upgrade to Premium for Combined Family Net Worth
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-xl">
                    Household View enables unified family asset allocation, combined liquid buffer tracking, and estate readiness across multiple investor portfolios under strict DPDP 2-way consent.
                  </p>
                </div>
                <button
                  onClick={() => {
                    startFreeTrial();
                    setHouseholdNotice('✅ Started 14-day Premium Trial! Household Linking is now unlocked.');
                  }}
                  className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Start 14-Day Free Trial
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* UNLINKED STATE */}
              {(!householdLink || householdLink.status === 'revoked') && (
                <div>
                  <label className="block text-xs font-bold text-[#14213D] mb-2">
                    Invite Family Member by Email
                  </label>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
                      <input
                        type="email"
                        placeholder="e.g. rohit.sharma@example.com"
                        value={partnerEmailInput}
                        onChange={(e) => setPartnerEmailInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] rounded-xl text-sm font-bold text-[#14213D] focus:outline-none focus:border-[#C57D25]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingLink || !partnerEmailInput.trim()}
                      onClick={async () => {
                        setIsProcessingLink(true);
                        const res = await requestHouseholdLink(partnerEmailInput);
                        setIsProcessingLink(false);
                        if (res.success) {
                          setHouseholdNotice(`✅ Link invitation sent to ${partnerEmailInput}. Recipient must accept from their own Settings page.`);
                          setPartnerEmailInput('');
                        } else {
                          alert(res.error || 'Failed to send request.');
                        }
                      }}
                      className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isProcessingLink ? 'Sending...' : 'Send Link Request'}</span>
                    </button>
                  </div>

                  {/* Demo Presets */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-[11px] text-[#8B93A7] font-semibold mr-1">Quick demo partner:</span>
                    {['rohit.sharma@example.com', 'priya.sharma@example.com'].map((email) => (
                      <button
                        key={email}
                        type="button"
                        onClick={() => setPartnerEmailInput(email)}
                        className="px-3 py-1 rounded-full text-xs font-bold border border-[#EDE9DF] bg-[#FAF8F5] text-[#6B7280] hover:border-[#C57D25] transition-colors cursor-pointer"
                      >
                        {email}
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-xs text-[#6B7280] leading-relaxed">
                    <span className="font-bold text-[#14213D]">🛡️ Two-Way Consent Boundary: </span>
                    Sending a request does NOT grant immediate access. The recipient must explicitly accept from their own account. By default, only combined net worth and asset class totals are shared — individual holdings remain private.
                  </div>
                </div>
              )}

              {/* PENDING STATE */}
              {householdLink && householdLink.status === 'pending' && (
                <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Mutual Consent</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-[#92400E]">
                        Link Request for {householdLink.partnerEmail}
                      </h4>
                      <p className="text-xs text-[#78350F] mt-1 leading-relaxed max-w-xl">
                        Awaiting explicit confirmation. No financial totals or holdings are shared while the request remains pending.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={async () => {
                          await acceptHouseholdLink(householdLink.id);
                          setHouseholdNotice(`✅ Household link accepted! Combined Household View is now active on your Dashboard.`);
                        }}
                        className="px-3.5 py-2 bg-[#2BB673] hover:bg-[#23965E] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        title="Simulate partner accepting the request"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept &amp; Link</span>
                      </button>

                      <button
                        onClick={async () => {
                          const confirmed = window.confirm('Cancel this pending household link request?');
                          if (confirmed) {
                            await revokeHouseholdLink();
                            setHouseholdNotice('Cancelled pending link request.');
                          }
                        }}
                        className="px-3.5 py-2 bg-white border border-[#EDE9DF] hover:bg-[#FDF2F2] hover:border-[#FCA5A5] text-[#EF4444] rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCEPTED / ACTIVE STATE */}
              {householdLink && householdLink.status === 'accepted' && (
                <div>
                  <div className="bg-[#F0FDF4] border border-[#A7F3D0] rounded-2xl p-5 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2BB673] mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Household Partnership</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#166534]">
                          Linked with {householdLink.partnerName} ({householdLink.partnerEmail})
                        </h4>
                        <p className="text-xs text-[#15803D] mt-1">
                          Consent confirmed on {householdLink.acceptedAt ? new Date(householdLink.acceptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'}. Combined totals are active on your Dashboard.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `Revoke household link with ${householdLink.partnerName}? This will immediately remove combined visibility for both accounts.`
                          );
                          if (confirmed) {
                            await revokeHouseholdLink();
                            setHouseholdNotice('✅ Household link revoked immediately.');
                          }
                        }}
                        className="px-3.5 py-2 bg-white border border-[#FCA5A5] hover:bg-[#FDF2F2] text-[#EF4444] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        Revoke Link
                      </button>
                    </div>
                  </div>

                  {/* Partner Aggregate Financial Breakdown Card */}
                  {householdPartnerSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                        <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Partner Assets</div>
                        <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                          ₹{householdPartnerSummary.totalValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">{householdPartnerSummary.holdingsCount} holding items</div>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                        <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Partner Equities</div>
                        <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                          ₹{householdPartnerSummary.equitiesValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">TCS, Reliance, etc.</div>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                        <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Partner Fixed Income</div>
                        <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                          ₹{householdPartnerSummary.bondsValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">GOI Sovereign Bonds</div>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                        <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Partner REITs/InvITs</div>
                        <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                          ₹{householdPartnerSummary.reitsValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5">Embassy REIT</div>
                      </div>
                    </div>
                  )}

                  {/* Granular Holding-Level Detail Toggle */}
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-[#14213D] flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#C57D25]" />
                        <span>Granular Holding-Level Sharing</span>
                      </div>
                      <p className="text-[#6B7280] mt-0.5">
                        By default, only category totals and weights are combined. Both parties must separately opt in to see specific individual holding names.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          const currentConsent = Boolean(householdLink.shareDetailsA);
                          await toggleShareDetails(!currentConsent);
                          setHouseholdNotice(
                            !currentConsent
                              ? '✅ Enabled your granular holding detail sharing.'
                              : '✅ Restricted sharing back to aggregate category totals only.'
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                          householdLink.shareDetailsA
                            ? 'bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0]'
                            : 'bg-white text-[#6B7280] border border-[#EDE9DF] hover:border-[#C57D25]'
                        }`}
                      >
                        {householdLink.shareDetailsA ? '✓ Your Opt-In Active' : 'Enable Holding Details'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEPARATE: Demo & Rehearsal Utilities Panel */}
        <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-3xl p-6 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                <RotateCcw className="w-4 h-4" />
                <span>Demo & Rehearsal Utilities</span>
              </div>
              <h3 className="font-extrabold text-base text-[#14213D] mt-1">
                Reset Demo Data
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-xl">
                Quickly restore portfolio holdings, health score timeline, and database upload history back to default baseline for testing or presentation rehearsals.
              </p>
            </div>

            <button
              onClick={handleDemoReset}
              disabled={isPurging}
              className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isPurging ? 'Resetting...' : 'Reset Demo Data'}</span>
            </button>
          </div>

          {demoResetStatus && (
            <div className="mt-4 p-3 bg-white border border-[#F7E5C8] rounded-xl text-xs font-bold text-[#C57D25]">
              {demoResetStatus}
            </div>
          )}
        </div>

        {/* DPDP Act 2023 & Security Architecture Panel */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
          <h3 className="font-extrabold text-base text-[#14213D] mb-2">India DPDP Act 2023 & Security Architecture</h3>
          <p className="text-xs text-[#6B7280] mb-4">
            Under India's Digital Personal Data Protection (DPDP) Act 2023, your personal financial data is processed under explicit consent with automatic 30-day file purging and right to erasure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-6">
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE9DF]">
              <div className="font-bold text-[#14213D] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>AES-256 KMS At-Rest</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Cloud KMS key management for raw parsed storage</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE9DF]">
              <div className="font-bold text-[#14213D] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>TLS 1.3 In-Transit</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Encrypted HTTPS transmission without exception</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE9DF]">
              <div className="font-bold text-[#14213D] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>PAN Masking</span>
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Identifiers are masked to prevent breach exposure.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleExportPortfolioData}
              disabled={isExporting}
              className="px-4 py-2 bg-[#C57D25] hover:bg-[#B06C19] text-white border border-[#C57D25] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting PDF...' : 'Export Portfolio Data PDF (DPDP Sec 12)'}</span>
            </button>

            <button
              onClick={handleDownloadJsonExport}
              disabled={!exportedData}
              className="px-4 py-2 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Download raw JSON</span>
            </button>

            <button
              onClick={handleRightToErasurePurge}
              disabled={isPurging}
              className="px-4 py-2 bg-[#FDF2F2] border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#EF4444] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isPurging ? 'Purging...' : 'Purge Data (Right to Erasure)'}</span>
            </button>
          </div>

          {(exportStatus || purgeStatus) && (
            <div className="mt-4 space-y-3">
              {exportStatus && (
                <div className="p-4 rounded-2xl text-xs font-bold text-[#14213D] bg-[#FAF8F5] border border-[#EDE9DF]">
                  <div className="flex items-center justify-between mb-2">
                    <span>{exportStatus}</span>
                    {exportedData && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(exportedData, null, 2));
                            setCopiedExport(true);
                            setTimeout(() => setCopiedExport(false), 2000);
                          }}
                          className="px-3 py-1 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          {copiedExport ? '✓ Copied JSON!' : 'Copy JSON to Clipboard'}
                        </button>
                        <button
                          onClick={() => setShowExportPreview(!showExportPreview)}
                          className="px-3 py-1 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#6B7280] rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          {showExportPreview ? 'Hide JSON Code' : 'View JSON Payload'}
                        </button>
                      </div>
                    )}
                  </div>
                  {showExportPreview && exportedData && (
                    <pre className="mt-3 p-3 bg-white text-[#14213D] border border-[#EDE9DF] rounded-xl text-[10px] font-mono overflow-x-auto max-h-60 whitespace-pre-wrap">
                      {JSON.stringify(exportedData, null, 2)}
                    </pre>
                  )}
                </div>
              )}
              {purgeStatus && (
                <div className="p-3 bg-[#FDF2F2] border border-[#FECACA] rounded-xl text-xs font-bold text-[#B91C1C]">
                  {purgeStatus}
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
