import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { PortfolioStoryTimeline } from '../portfolio/PortfolioStoryTimeline';
import { Settings, Upload, Trash2, Download, ShieldCheck, Terminal, User, X, RotateCcw, Sliders, Check, Wallet, Info, Users, UserCheck, UserX, Link2, Lock, Sparkles, History, TrendingUp, TrendingDown, Clock, Activity, RefreshCw } from 'lucide-react';
import { SEBI_RISK_QUESTIONS, calculateRiskCategory, type SebiRiskCategory } from '../../utils/riskProfiler';
import type { CasUploadAuditRow } from '../../types';
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
    userRiskCategory,
    userRiskAnswers,
    updateUserRiskCategory,
    monthlyExpenses,
    updateMonthlyExpenses,
    householdLinks,
    activeHouseholdLink,
    sendHouseholdInvite,
    acceptHouseholdInvite,
    revokeHouseholdLink,
    toggleHoldingDetailConsent,
    hasActivePremiumAccess,
    startFreeTrial,
    user,
    uploadHistory,
    refreshUploadHistory,
  } = useApp();

  const [householdEmailInput, setHouseholdEmailInput] = useState<string>('');
  const [householdInviteStatus, setHouseholdInviteStatus] = useState<{ msg: string; isError?: boolean } | null>(null);

  const [customExpenseInput, setCustomExpenseInput] = useState<string>(
    monthlyExpenses ? String(monthlyExpenses) : ''
  );

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
  const [isEditingRisk, setIsEditingRisk] = useState<boolean>(false);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>(() => ({
    horizon: userRiskAnswers.horizon || 2,
    income: userRiskAnswers.income || 2,
    experience: userRiskAnswers.experience || 2,
    reaction: userRiskAnswers.reaction || 2,
    liquidity: userRiskAnswers.liquidity || 2,
  }));

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

        {/* SEBI Riskometer Risk Profiler Settings Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#EDE9DF]">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-[#C57D25]" />
              <div>
                <h3 className="font-extrabold text-base text-[#14213D]">SEBI Riskometer Risk Profiler</h3>
                <p className="text-xs text-[#6B7280]">
                  Controls suitability thresholds and risk profile mismatch flags across all holdings.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#8B93A7]">Current Profile:</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                userRiskCategory === 'Low' || userRiskCategory === 'Low to Moderate' 
                  ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]' 
                  : userRiskCategory === 'Very High' 
                  ? 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]' 
                  : 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
              }`}>
                {userRiskCategory}
              </span>
              <button
                onClick={() => setIsEditingRisk(!isEditingRisk)}
                className="px-3 py-1 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isEditingRisk ? 'Close Survey' : 'Re-take Survey'}
              </button>
            </div>
          </div>

          {isEditingRisk ? (
            <div className="space-y-6 pt-2">
              {SEBI_RISK_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                  <div className="text-xs font-extrabold text-[#C57D25] uppercase tracking-wider mb-1">
                    Question {qIdx + 1} of 5
                  </div>
                  <div className="text-sm font-bold text-[#14213D] mb-1">{q.title}</div>
                  {q.description && (
                    <p className="text-xs text-[#6B7280] mb-3">{q.description}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isSelected = (surveyAnswers[q.id] || userRiskAnswers[q.id] || 2) === opt.points;
                      return (
                        <button
                          key={opt.points}
                          onClick={() => {
                            const next = { ...surveyAnswers, [q.id]: opt.points };
                            setSurveyAnswers(next);
                            const cat = calculateRiskCategory(next);
                            updateUserRiskCategory(cat, next);
                          }}
                          className={`p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#C57D25] text-[#C57D25] shadow-xs'
                              : 'bg-white border-[#EDE9DF] text-[#475569] hover:bg-[#F6F4ED]'
                          }`}
                        >
                          <span className="leading-snug">{opt.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#C57D25] shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#6B7280]">
                  Updated Risk Category: <strong className="text-[#14213D]">{calculateRiskCategory(surveyAnswers)}</strong>
                </span>
                <button
                  onClick={() => setIsEditingRisk(false)}
                  className="px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save &amp; Close Profiler
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#475569]">
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE9DF]">
                <span className="text-[#8B93A7] font-semibold block mb-0.5">Assessed Category:</span>
                <span className="font-extrabold text-[#14213D] text-sm">{userRiskCategory}</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE9DF]">
                <span className="text-[#8B93A7] font-semibold block mb-0.5">SEBI Benchmark:</span>
                <span className="font-bold text-[#14213D]">6-Band Riskometer Framework</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE9DF]">
                <span className="text-[#8B93A7] font-semibold block mb-0.5">Suitability Engine Integration:</span>
                <span className="font-bold text-[#2BB673]">Active &amp; Monitoring Holdings</span>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Fund & Monthly Expenses Estimate Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#EDE9DF]">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-[#C57D25]" />
              <div>
                <h3 className="font-extrabold text-base text-[#14213D]">Emergency Fund &amp; Monthly Expenses</h3>
                <p className="text-xs text-[#6B7280]">
                  Required to verify your 3x liquid buffer safety threshold before allocating to illiquid assets.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#8B93A7]">Current Buffer Target:</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                monthlyExpenses 
                  ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]' 
                  : 'bg-[#FAF8F5] text-[#8B93A7] border-[#EDE9DF]'
              }`}>
                {monthlyExpenses ? `₹${(monthlyExpenses * 3).toLocaleString('en-IN')} (3 Mo)` : 'Not Configured'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#14213D] mb-1">
                Roughly what are your monthly living expenses?
              </label>
              <p className="text-xs text-[#6B7280] mb-3">
                Used strictly to flag thin cash buffers before committing capital to long lock-ins. Self-reported &amp; private.
              </p>

              {/* Preset quick-select buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { label: '₹25,000 / mo', value: 25000 },
                  { label: '₹50,000 / mo', value: 50000 },
                  { label: '₹1,00,000 / mo', value: 100000 },
                  { label: '₹2,00,000 / mo', value: 200000 },
                ].map((preset) => {
                  const isSelected = monthlyExpenses === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        updateMonthlyExpenses(preset.value);
                        setCustomExpenseInput(String(preset.value));
                      }}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-[#FFF8EE] border-[#C57D25] text-[#C57D25] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EDE9DF] text-[#475569] hover:bg-[#F6F4ED]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input & Clear Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B93A7]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Enter custom monthly expense (e.g. 75000)"
                    value={customExpenseInput}
                    onChange={(e) => setCustomExpenseInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-xs font-medium text-[#14213D] focus:outline-none focus:border-[#C57D25]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const val = Number(customExpenseInput);
                      if (!isNaN(val) && val > 0) {
                        updateMonthlyExpenses(val);
                      }
                    }}
                    className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Save Expense
                  </button>
                  {monthlyExpenses !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        updateMonthlyExpenses(null);
                        setCustomExpenseInput('');
                      }}
                      className="px-3 py-2.5 bg-[#FAF8F5] hover:bg-[#F6F4ED] text-[#EF4444] border border-[#EDE9DF] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {monthlyExpenses && (
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">
                  Active Emergency Safety Floor: <strong className="text-[#14213D]">₹{(monthlyExpenses * 3).toLocaleString('en-IN')}</strong> (3 × ₹{monthlyExpenses.toLocaleString('en-IN')})
                </span>
                <span className="text-[#2BB673] font-bold">✓ Active in Red Flag Detector</span>
              </div>
            )}
          </div>
        </div>

        {/* Household & Family Portfolio Card (Premium) */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#EDE9DF]">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#C57D25]" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-[#14213D]">Household &amp; Family Portfolio</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]">
                    Premium
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Link a family member's account with 2-way consent to see combined net worth and overall asset allocation.
                </p>
              </div>
            </div>
            {activeHouseholdLink && (
              <span className="px-3 py-1 bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0] rounded-xl text-xs font-extrabold inline-flex items-center space-x-1 self-start sm:self-auto">
                <UserCheck className="w-3.5 h-3.5" />
                <span>1 Active Household Link</span>
              </span>
            )}
          </div>

          {!hasActivePremiumAccess ? (
            <div className="bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#14213D] mb-1">Household View is a Premium Safeguard</h4>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto mb-4">
                Combine family portfolios, analyze aggregate diversification, and ensure mutual privacy protections.
              </p>
              <button
                type="button"
                onClick={startFreeTrial}
                className="px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start 14-Day Free Trial to Unlock</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form to link member */}
              <div>
                <label className="block text-xs font-extrabold text-[#14213D] mb-1">
                  Link a household member
                </label>
                <p className="text-xs text-[#6B7280] mb-3">
                  Enter the email address of your spouse or family member. They must accept from their own Settings page before any combined visibility is enabled.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <input
                      type="email"
                      placeholder="e.g. spouse@example.com"
                      value={householdEmailInput}
                      onChange={(e) => {
                        setHouseholdEmailInput(e.target.value);
                        setHouseholdInviteStatus(null);
                      }}
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-xs font-medium text-[#14213D] focus:outline-none focus:border-[#C57D25]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!householdEmailInput) return;
                      const res = await sendHouseholdInvite(householdEmailInput);
                      if (res.success) {
                        setHouseholdInviteStatus({ msg: `✅ Invitation sent to ${householdEmailInput}. Waiting for recipient acceptance.` });
                        setHouseholdEmailInput('');
                      } else {
                        setHouseholdInviteStatus({ msg: `❌ ${res.error || 'Failed to send invite'}`, isError: true });
                      }
                    }}
                    className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0 inline-flex items-center justify-center space-x-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Send Household Invite</span>
                  </button>
                </div>

                {householdInviteStatus && (
                  <div className={`mt-2 text-xs font-semibold p-2.5 rounded-xl border ${
                    householdInviteStatus.isError 
                      ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' 
                      : 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                  }`}>
                    {householdInviteStatus.msg}
                  </div>
                )}
              </div>

              {/* Active & Pending Links List */}
              {householdLinks.filter(l => l.status !== 'revoked').length > 0 && (
                <div className="pt-4 border-t border-[#EDE9DF] space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#8B93A7]">
                    Household Connections &amp; Invitations
                  </div>

                  {householdLinks.filter(l => l.status !== 'revoked').map((link) => {
                    const isAccepted = link.status === 'accepted';
                    const isIncoming = link.user_b_email.toLowerCase() === (user?.email || '').toLowerCase();

                    return (
                      <div key={link.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-[#14213D]">
                                {link.user_b_email === user?.email ? link.user_a_email : link.user_b_email}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isAccepted 
                                  ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]' 
                                  : 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
                              }`}>
                                {isAccepted ? 'Accepted & Active' : isIncoming ? 'Action Required: Incoming Invite' : 'Pending Acceptance'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8B93A7] mt-0.5">
                              {isAccepted 
                                ? `Linked on ${new Date(link.accepted_at || link.requested_at).toLocaleDateString('en-IN')}` 
                                : `Requested by ${link.user_a_email} on ${new Date(link.requested_at).toLocaleDateString('en-IN')}`}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isAccepted && isIncoming && (
                              <button
                                type="button"
                                onClick={() => acceptHouseholdInvite(link.id)}
                                className="px-3 py-1.5 bg-[#2BB673] hover:bg-[#239960] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                              >
                                Accept Link
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => revokeHouseholdLink(link.id)}
                              className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#FEE2E2] text-[#EF4444] border border-[#EDE9DF] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                            >
                              <UserX className="w-3 h-3" />
                              <span>{isAccepted ? 'Revoke Link' : 'Cancel / Decline'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Privacy Toggle: Holding-level sharing (Off by default) */}
                        {isAccepted && (
                          <div className="pt-2 border-t border-[#EDE9DF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="font-semibold text-[#14213D]">
                                Share individual holding names
                              </div>
                              <p className="text-[11px] text-[#6B7280]">
                                When disabled, only aggregate net worth &amp; asset allocations are shared. Both accounts must opt in to reveal individual holdings.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleHoldingDetailConsent(link.id, !link.share_holdings_a)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer shrink-0 ${
                                link.share_holdings_a && link.share_holdings_b
                                  ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                                  : 'bg-white text-[#6B7280] border-[#EDE9DF] hover:bg-[#F6F4ED]'
                              }`}
                            >
                              {link.share_holdings_a && link.share_holdings_b ? '✓ Both Consented (Detailed View)' : 'Aggregate Only (Default Safe)'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Privacy Guarantee Note */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] flex items-start space-x-2 text-xs text-[#6B7280]">
                <ShieldCheck className="w-4 h-4 text-[#2BB673] shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Safeguard:</strong> Combined Household View calculates aggregate asset allocation without exposing individual trade histories or private account balances unless explicitly approved by both members.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Story & Complete Health Score History */}
        <div className="mb-8">
          <PortfolioStoryTimeline
            events={healthScoreEvents}
          />
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

        {/* ── Upload History ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EDE9DF]">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#C57D25]" />
              <h3 className="font-extrabold text-base text-[#14213D]">Upload History</h3>
              {uploadHistory.length > 0 && (
                <span className="text-[10px] bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] px-2 py-0.5 rounded-full font-bold">
                  {uploadHistory.length} Upload{uploadHistory.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={() => refreshUploadHistory()}
              className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#8B93A7] hover:text-[#C57D25] transition-colors cursor-pointer"
              title="Refresh upload history"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {uploadHistory.length === 0 ? (
            <div className="py-5 px-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-center">
              <p className="text-xs text-[#8B93A7]">
                No upload history yet. Upload a CAS statement to see your history here.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E4D9]">
              {uploadHistory.map((row: CasUploadAuditRow, idx: number) => {
                const prev = uploadHistory[idx + 1];
                const deltaValue = prev?.total_portfolio_value != null && row.total_portfolio_value != null
                  ? row.total_portfolio_value - prev.total_portfolio_value : null;
                const deltaScore = prev?.health_score_at_upload != null && row.health_score_at_upload != null
                  ? row.health_score_at_upload - prev.health_score_at_upload : null;
                const hasDelta = idx < uploadHistory.length - 1;

                const isGain = (deltaValue ?? 0) > 0 || (deltaScore ?? 0) > 0;
                const isLoss = (deltaValue ?? 0) < 0 || (deltaScore ?? 0) < 0;

                // Outcome badge styling
                const outcomeLabel = row.outcome === 'success' ? 'Verified'
                  : row.outcome === 'need_identity_confirmation' ? 'Name Check'
                  : row.outcome === 'pan_mismatch' ? 'PAN Mismatch'
                  : row.outcome === 'low_name_similarity' ? 'Low Match'
                  : row.outcome ?? 'Unknown';
                const outcomePill = row.outcome === 'success'
                  ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                  : row.outcome === 'need_identity_confirmation'
                  ? 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
                  : 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]';

                const dotColor = isGain ? 'border-[#2BB673] text-[#2BB673]'
                  : isLoss ? 'border-[#EF4444] text-[#EF4444]'
                  : 'border-[#C57D25] text-[#C57D25]';

                const deltaPill = isGain ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                  : isLoss ? 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]'
                  : 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]';

                const uploadDate = new Date(row.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <div key={row.id} className="relative group">
                    {/* Node dot on vertical line */}
                    <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110 ${dotColor}`}>
                      {isGain ? <TrendingUp className="w-3 h-3" /> : isLoss ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-2.5 h-2.5" />}
                    </div>

                    {/* Row card */}
                    <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EDE9DF] transition-all hover:border-[#D4C7B5] shadow-xs">

                      {/* Top row: date, outcome badge, delta pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-xs text-[#8B93A7] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {uploadDate}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${outcomePill}`}>
                            {outcomeLabel}
                          </span>
                        </div>

                        {/* Delta pill — only when there's a prior upload to compare */}
                        {hasDelta && (deltaValue !== null || deltaScore !== null) && (
                          <div className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${deltaPill} shrink-0`}>
                            {deltaValue !== null && (
                              <span>
                                {deltaValue >= 0 ? '+' : ''}₹{Math.abs(deltaValue).toLocaleString('en-IN')}
                              </span>
                            )}
                            {deltaScore !== null && (
                              <span>{deltaScore >= 0 ? `+${deltaScore}` : deltaScore} pts</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Detail row */}
                      <div className="mt-2 bg-white rounded-xl p-3 border border-[#EDE9DF]">
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#C57D25] mb-1.5">
                          Investor: {row.parsed_name || '—'}
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-[#14213D]">
                          {row.total_portfolio_value != null && (
                            <span>
                              Portfolio Value:&nbsp;
                              <span className="font-bold">₹{row.total_portfolio_value.toLocaleString('en-IN')}</span>
                            </span>
                          )}
                          {row.health_score_at_upload != null && (
                            <span>
                              Health Score:&nbsp;
                              <span className="font-bold">{row.health_score_at_upload}/100</span>
                            </span>
                          )}
                          {row.holdings_count != null && (
                            <span className="text-[#6B7280]">{row.holdings_count} holdings</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
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
