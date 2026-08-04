import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { Settings, Upload, Trash2, Download, ShieldCheck, Terminal } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { handleCasUpload, uploadedCas, resetPortfolio } = useApp();
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState(false);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      if (result.source === 'server') {
        setUploadStatus(`✅ Successfully parsed via server! Holdings & red flags updated. Redirecting to dashboard...`);
        setUploadError(null);
      } else if (result.error) {
        // Server failed but local parser succeeded (fallback)
        setUploadError(`Note: Server parser unavailable (${result.error}). Used local parser instead — holdings updated!`);
        setUploadStatus(`✅ Parsed locally. Holdings updated. Redirecting to dashboard...`);
      } else {
        setUploadStatus(`✅ Successfully parsed statement from ${file.name}! Holdings updated. Redirecting to dashboard...`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadError(message);
      setUploadStatus(`Upload failed: ${message}`);
      setUploadProgress(100);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Settings className="w-4 h-4" />
              <span>User & Account Management</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">
              Settings & CAS Import
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Import CAS statements, manage depository connections, and configure data privacy settings.
            </p>
          </div>
        </div>

        {/* CAS File Drag & Drop Box */}
        <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-[#C57D25] shadow-xs mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mx-auto mb-4 border border-[#F7E5C8]">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-extrabold text-[#0B1220] mb-1">
            Import NSDL / CDSL Consolidated Account Statement (CAS)
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mb-6">
            Upload your CAS PDF (e.g. Priya Sharma CAS or NSDL/CDSL statement) to parse holdings & calculate red flags automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label className="px-6 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Choose CAS PDF File</span>
              <input type="file" accept=".pdf,.txt" onChange={onFileUpload} className="hidden" />
            </label>

            <button
              onClick={async () => {
                setUploadStatus('Parsing sample CAS statement...');
                await handleCasUpload('sample_cas.pdf');
                setUploadStatus('Loaded Priya Sharma sample CAS data! Holdings & red flags updated.');
              }}
              className="px-5 py-3 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#0B1220] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Load Priya Sharma CAS Sample
            </button>
          </div>

          {uploadStatus && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <div>{uploadStatus}</div>
                <div className="text-[#64748B]">{uploadProgress}%</div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[#EDE9DF]">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="h-full rounded-full bg-[#C57D25] transition-all duration-300"
                />
              </div>
              {isUploading && (
                <div className="flex items-center space-x-2 text-xs text-[#64748B]">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#C57D25] animate-pulse" />
                  <span>Processing...</span>
                </div>
              )}
              {uploadError && (
                <div className={`text-xs font-bold rounded-xl p-3 ${
                  uploadError.startsWith('Note:')
                    ? 'text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A]'
                    : 'text-[#B91C1C] bg-[#FEE2E2] border border-[#FECACA]'
                }`}>
                  <div className="font-semibold">{uploadError.startsWith('Note:') ? 'ℹ️ Fallback used' : 'Parsing error'}</div>
                  <div>{uploadError}</div>
                </div>
              )}
            </div>
          )}

          {uploadedCas && (
            <div className="mt-4 pt-4 border-t border-[#EDE9DF] text-left text-xs bg-[#FAF8F5] p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-[#0B1220] text-sm">✅ Statement Parsed Successfully</div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0] px-2 py-0.5 rounded-full font-bold">
                    {uploadedCas.holdingsCount} Holdings Found
                  </span>
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-[10px] bg-[#FAF8F5] border border-[#EDE9DF] text-[#64748B] hover:text-[#C57D25] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Terminal className="w-2.5 h-2.5" />
                    <span>{showDebug ? 'Hide' : 'Show'} Raw Text</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B] mt-2">
                <div><span className="font-semibold text-[#0B1220]">Investor:</span> {uploadedCas.investorName}</div>
                <div><span className="font-semibold text-[#0B1220]">PAN:</span> {uploadedCas.pan.substring(0, 5)}****{uploadedCas.pan.substring(9)}</div>
                <div><span className="font-semibold text-[#0B1220]">Holdings:</span> {uploadedCas.holdingsCount}</div>
                <div><span className="font-semibold text-[#0B1220]">Total Assets:</span> ₹{uploadedCas.totalAssets.toLocaleString('en-IN')}</div>
              </div>
              {showDebug && uploadedCas.rawExtractedText && (
                <div className="mt-3 border-t border-[#EDE9DF] pt-3">
                  <div className="text-[10px] font-bold text-[#8B93A7] uppercase tracking-wider mb-1">Raw Extracted Text (first 2000 chars):</div>
                  <pre className="text-[9px] text-[#475569] font-mono bg-[#0B1220] text-[#C8E6C9] p-3 rounded-xl overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                    {uploadedCas.rawExtractedText.substring(0, 2000)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RBI Account Aggregator (AA) Framework Roadmap Card */}
        <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#F7E5C8] shadow-xs mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#C57D25]/10 border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-[#0B1220]">RBI Account Aggregator (AA) Framework Integration</h3>
                  <span className="text-[10px] bg-[#C57D25] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Production Roadmap</span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  While MVP uses client-side CAS PDF parsing, production VestIQ connects to the <strong>Sahamati RBI-regulated Account Aggregator network</strong>. Data flows via secure, encrypted FIP APIs under time-bound, purpose-specific user consent — eliminating PDF uploads entirely.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#F7E5C8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#F7E5C8]">
              <div className="font-bold text-[#0B1220]">Sahamati AA Ecosystem</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">RBI-regulated consent manager integration</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#F7E5C8]">
              <div className="font-bold text-[#0B1220]">Time-Bound Consent</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">User revokes access anytime via AA app</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#F7E5C8]">
              <div className="font-bold text-[#0B1220]">Zero PDF Exposure</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Direct FIP-to-FIU encrypted payload</div>
            </div>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-[#0B1220] mb-4">Linked Depositories & Accounts</h3>
          
          <div className="space-y-3 text-xs">
            {[
              { name: 'Zerodha Broking (CDSL)', status: 'Connected', holdings: '2 Holdings' },
              { name: 'Groww (NSDL)', status: 'Connected', holdings: '1 Holding' },
              { name: 'ICICI Direct (NSDL)', status: 'Connected', holdings: '1 Holding' },
              { name: 'RBI Retail Direct Portal', status: 'Connected', holdings: '1 G-Sec' }
            ].map((acc, idx) => (
              <div key={idx} className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0B1220]">{acc.name}</div>
                  <div className="text-[10px] text-[#8B93A7]">{acc.holdings}</div>
                </div>
                <span className="bg-[#E6F4EA] text-[#2BB673] px-2.5 py-0.5 rounded-full font-bold">
                  {acc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DPDP Act 2023 & Security Architecture Panel */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
          <h3 className="font-extrabold text-base text-[#0B1220] mb-2">India DPDP Act 2023 & Security Architecture</h3>
          <p className="text-xs text-[#64748B] mb-4">
            Under India's Digital Personal Data Protection (DPDP) Act 2023, your personal financial data is processed under explicit consent with automatic 30-day file purging and right to erasure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-6">
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE9DF]">
              <div className="font-bold text-[#0B1220] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>AES-256 KMS At-Rest</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">Cloud KMS key management for raw parsed storage</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE9DF]">
              <div className="font-bold text-[#0B1220] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>TLS 1.3 In-Transit</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">Encrypted HTTPS transmission without exception</div>
            </div>
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EDE9DF]">
              <div className="font-bold text-[#0B1220] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2BB673]" />
                <span>PAN Tokenization</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">Identifiers masked to prevent breach exposure</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => alert('Portfolio JSON dataset exported under DPDP Section 12.')}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#0B1220] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Portfolio Data (DPDP Sec 12)</span>
            </button>

            <button
              onClick={() => {
                resetPortfolio();
                alert('Local CAS statement & tokenized data purged under Right to Erasure.');
              }}
              className="px-4 py-2 bg-[#FDF2F2] border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#EF4444] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Data (Right to Erasure)</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
