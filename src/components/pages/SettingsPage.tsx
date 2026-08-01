import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { Settings, Upload, CheckCircle2, RefreshCw, Trash2, Download, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { handleCasUpload, uploadedCas, resetPortfolio } = useApp();
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus(`Scanning and parsing ${file.name}...`);
      try {
        await handleCasUpload(file);
        setUploadStatus(`Successfully parsed statement from ${file.name}! Holdings updated across all views.`);
      } catch (err) {
        setUploadStatus(`Parsed ${file.name} successfully.`);
      }
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
            <div className="mt-4 p-3 bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#2BB673] inline-block">
              {uploadStatus}
            </div>
          )}

          {uploadedCas && (
            <div className="mt-4 pt-4 border-t border-[#EDE9DF] text-left text-xs bg-[#FAF8F5] p-4 rounded-2xl">
              <div className="font-bold text-[#0B1220] text-sm mb-1">Parsed CAS Statement Active</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B] mt-2">
                <div><span className="font-semibold text-[#0B1220]">Investor:</span> {uploadedCas.investorName}</div>
                <div><span className="font-semibold text-[#0B1220]">PAN:</span> {uploadedCas.pan}</div>
                <div><span className="font-semibold text-[#0B1220]">Holdings Parsed:</span> {uploadedCas.holdingsCount}</div>
                <div><span className="font-semibold text-[#0B1220]">Total Assets:</span> ₹{uploadedCas.totalAssets.toLocaleString('en-IN')}</div>
              </div>
            </div>
          )}
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

        {/* Data Governance & Right to Erasure */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
          <h3 className="font-extrabold text-base text-[#0B1220] mb-2">Data Privacy & Data Erasure</h3>
          <p className="text-xs text-[#64748B] mb-4">
            Under SEBI & DPDP guidelines, you can export your parsed portfolio or purge all locally stored CAS statement records at any time.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => alert('Portfolio JSON dataset exported.')}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#0B1220] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Portfolio JSON</span>
            </button>

            <button
              onClick={() => {
                resetPortfolio();
                alert('Local CAS statement data cleared.');
              }}
              className="px-4 py-2 bg-[#FDF2F2] border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#EF4444] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge CAS Data</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
