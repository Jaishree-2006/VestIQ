import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { 
  AlertTriangle, 
  ArrowRight, 
  Lightbulb, 
  Sliders, 
  TrendingUp, 
  Upload, 
  Layers, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { 
    holdings, 
    redFlags, 
    healthScore, 
    setCurrentPage, 
    handleCasUpload,
    uploadedCas 
  } = useApp();

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
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans selection:bg-[#FCEEBB]">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* CAS Upload Banner if not uploaded */}
        {!uploadedCas && (
          <div className="mb-8 bg-white border border-[#E6DCCB] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between shadow-xs gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center shrink-0 border border-[#F7E5C8]">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B1220]">Upload & Scan CAS Statement</h4>
                <p className="text-xs text-[#64748B]">Parse your NSDL/CDSL CAS PDF (e.g. Priya Sharma CAS) to calculate real values & red flags instantly.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <label className="px-4 py-2 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await handleCasUpload(f);
                  }}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => handleCasUpload('sample_cas.pdf')}
                className="px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#0B1220] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Priya Sharma Sample
              </button>
            </div>
          </div>
        )}

        {/* Top Portfolio Header matching Image 2 EXACTLY */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B93A7] mb-1">
              total portfolio value {uploadedCas && <span className="text-[#C57D25]">({uploadedCas.investorName})</span>}
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono-num text-[#0B1220] tracking-tight">
              ₹{totalValue.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Health Score Badge Card top right matching Image 2 */}
          <div 
            onClick={() => setCurrentPage('red-flags')}
            className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 sm:px-6 sm:py-3 flex flex-col items-center justify-center min-w-[150px] shadow-xs cursor-pointer hover:border-[#C57D25] transition-colors"
          >
            <div className="text-xs font-semibold text-[#8B93A7] mb-0.5">
              health score
            </div>
            <div className="text-3xl font-extrabold text-[#C57D25] font-mono-num">
              {healthScore}
            </div>
          </div>
        </div>

        {uploadedCas && (
          <div className="mb-8 bg-white rounded-2xl border border-[#EDE9DF] p-5 shadow-xs">
            <div className="grid gap-3 sm:grid-cols-3 text-xs text-[#64748B]">
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">Investor</div>
                <div>{uploadedCas.investorName}</div>
              </div>
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">Statement Period</div>
                <div>{uploadedCas.statementPeriod}</div>
              </div>
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">Total Assets</div>
                <div>₹{uploadedCas.totalAssets.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">Holdings Count</div>
                <div>{uploadedCas.holdingsCount}</div>
              </div>
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">Detected Brokers</div>
                <div>{uploadedCas.detectedBrokers.join(', ') || 'Unknown'}</div>
              </div>
              <div>
                <div className="font-semibold text-[#0B1220] text-sm">PAN (masked)</div>
                <div>{uploadedCas.pan.substring(0, 5)}****{uploadedCas.pan.substring(9)}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#EDE9DF] text-xs text-[#475569]">
              <div className="font-semibold mb-2 text-[#0B1220]">Raw Extracted Text Preview</div>
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
            <div className="text-xs font-medium text-[#8B93A7] mb-1">equities</div>
            <div className="text-2xl font-bold font-mono-num text-[#0B1220]">
              ₹{totalEquities.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 font-medium">
              {totalValue > 0 ? ((totalEquities / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </div>
          </div>

          {/* Bonds Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-xs font-medium text-[#8B93A7] mb-1">bonds</div>
            <div className="text-2xl font-bold font-mono-num text-[#0B1220]">
              ₹{totalBonds.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 font-medium">
              {totalValue > 0 ? ((totalBonds / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </div>
          </div>

          {/* REITs / InvITs Card */}
          <div className="bg-[#F6F4ED] rounded-2xl p-5 border border-[#EDE9DF]">
            <div className="text-xs font-medium text-[#8B93A7] mb-1">REITs / InvITs</div>
            <div className="text-2xl font-bold font-mono-num text-[#0B1220]">
              ₹{totalReits.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 font-medium">
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
              <p className="text-xs sm:text-sm text-[#7F1D1D] mt-1 leading-relaxed">
                {topFlag.description}
              </p>
            </div>
          </div>
        )}

        {/* "Why your score dropped" Causal Chain Flow matching Image 2 EXACTLY */}
        <div className="bg-[#F6F4ED] rounded-2xl p-6 border border-[#EDE9DF] mb-8">
          <div className="text-xs font-semibold text-[#8B93A7] uppercase tracking-wider mb-4">
            why your score dropped
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Pill 1 */}
            <div className="px-4 py-2 rounded-full bg-[#FFF8EE] border border-[#F7E5C8] text-xs font-bold text-[#C57D25] shadow-2xs">
              40% in one REIT
            </div>

            <ArrowRight className="w-4 h-4 text-[#8B93A7] shrink-0" />

            {/* Pill 2 */}
            <div className="px-4 py-2 rounded-full bg-[#FFF8EE] border border-[#F7E5C8] text-xs font-bold text-[#C57D25] shadow-2xs">
              rate-sensitive asset class
            </div>

            <ArrowRight className="w-4 h-4 text-[#8B93A7] shrink-0" />

            {/* Pill 3 (Red) */}
            <div className="px-4 py-2 rounded-full bg-[#FDF2F2] border border-[#FCA5A5] text-xs font-bold text-[#EF4444] shadow-2xs">
              -15% per +1% rate move
            </div>

          </div>
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
                <h4 className="font-bold text-sm text-[#0B1220]">Explainability Center</h4>
                <p className="text-xs text-[#8B93A7]">Explore causal chains</p>
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
                <h4 className="font-bold text-sm text-[#0B1220]">Shock Sandbox</h4>
                <p className="text-xs text-[#8B93A7]">Macro stress-testing</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B93A7] group-hover:text-[#2BB673] transition-colors" />
          </div>

          <div 
            onClick={() => setCurrentPage('holdings')}
            className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#C57D25] transition-all cursor-pointer shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0B1220] flex items-center justify-center font-bold border border-[#EDE9DF]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B1220]">All Holdings</h4>
                <p className="text-xs text-[#8B93A7]">Zerodha, Groww, ICICI</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B93A7] group-hover:text-[#0B1220] transition-colors" />
          </div>

        </div>

        {/* Portfolio Holdings Summary Table */}
        <div className="bg-white rounded-2xl border border-[#EDE9DF] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-[#0B1220]">Top Portfolio Holdings</h3>
            <button
              onClick={() => setCurrentPage('holdings')}
              className="text-xs font-semibold text-[#C57D25] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View all {holdings.length} instruments</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
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
                    <td className="py-3 px-2 font-bold text-[#0B1220]">
                      <div>{holding.name}</div>
                      <div className="text-[10px] text-[#8B93A7] font-mono">{holding.ticker}</div>
                    </td>
                    <td className="py-3 px-2 uppercase text-[10px] font-semibold text-[#64748B]">
                      {holding.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-2 text-[#475569]">
                      {holding.broker} ({holding.depository})
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num font-bold text-[#0B1220]">
                      ₹{holding.currentValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num font-semibold text-[#64748B]">
                      {holding.portfolioWeight}%
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
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
