import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { PortfolioStoryTimeline } from '../portfolio/PortfolioStoryTimeline';
import { Settings, Upload, Trash2, Download, ShieldCheck, Terminal, User, X, RotateCcw } from 'lucide-react';

import { downloadJsonFile, downloadPortfolioExportPdf } from '../../utils/fileExport';
import { supabase } from '../../lib/supabaseClient';

export const SettingsPage: React.FC = () => {
  const { handleCasUpload, cancelCasUpload, uploadedCas, resetPortfolio, healthScoreEvents, holdings, redFlags, healthScore } = useApp();

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
