import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { AlertTriangle, ShieldCheck, CheckCircle, ArrowRight, FileText, Info } from 'lucide-react';
import { deriveRedFlagsFromHoldings } from '../../utils/redFlags';

const normalizeSeverity = (value: string) => value?.charAt(0).toUpperCase() + value?.slice(1) || 'Medium';

export const RedFlagsPage: React.FC = () => {
  const { redFlags, holdings, setCurrentPage } = useApp();
  const [filter, setFilter] = React.useState<'active' | 'resolved' | 'all'>('active');

  const activeFlags = (redFlags || []).filter((flag) => !['resolved', 'acknowledged'].includes(flag.status || 'active'));
  const resolvedFlags = (redFlags || []).filter((flag) => ['resolved', 'acknowledged'].includes(flag.status || 'active'));
  const liveFlags = activeFlags.length > 0 ? activeFlags : deriveRedFlagsFromHoldings(holdings);
  const visibleFlags = filter === 'active' ? liveFlags : filter === 'resolved' ? resolvedFlags : [...liveFlags, ...resolvedFlags];

  const handleSimulate = (flag: { holdingId: string; holdingName: string; title: string }) => {
    sessionStorage.setItem('vestiq-shock-focus', JSON.stringify({
      holdingId: flag.holdingId,
      holdingName: flag.holdingName,
      title: flag.title,
    }));
    setCurrentPage('shock-sandbox');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        <div className="mb-8 pb-6 border-b border-[#EDE9DF]">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#EF4444]">
            <AlertTriangle className="w-4 h-4" />
            <span>SEBI-Aligned Mis-Selling Safeguard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
            Red Flags & Suitability Detector
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Catches inappropriate product selling, horizon mismatches, and hidden lock-in penalties before they impact your capital.
          </p>
        </div>

        {/* Active Red Flags Cards */}
        <div className="space-y-6 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#14213D] flex items-center justify-between">
              <span>{filter === 'resolved' ? 'Resolved / Acknowledged Alerts' : filter === 'all' ? 'All Compliance Alerts' : 'Active Red Flag Alerts'} ({visibleFlags.length})</span>
            </h2>
            <div className="inline-flex rounded-xl border border-[#EDE9DF] bg-white p-1">
              {(['active', 'resolved', 'all'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filter === option ? 'bg-[#FFF8EE] text-[#C57D25]' : 'text-[#6B7280]'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {visibleFlags.length === 0 ? (
            <div className="bg-white border border-dashed border-[#D5D8DD] rounded-3xl p-8 text-center text-[#6B7280]">
              <ShieldCheck className="w-10 h-10 mx-auto text-[#2BB673] mb-3" />
              <h3 className="text-xl font-bold text-[#14213D] mb-2">No active compliance flags</h3>
              <p className="max-w-md mx-auto text-sm leading-relaxed">
                Your current portfolio looks well-aligned to your stated horizon and risk profile. Review the holdings matrix below or upload a revised CAS to re-run the scanner.
              </p>
            </div>
          ) : visibleFlags.map((flag) => (
            <div 
              key={flag.id}
              className="bg-white border-2 border-[#FCA5A5] rounded-3xl p-6 shadow-xs relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-[#EF4444]" />

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]">
                      {normalizeSeverity(flag.severity)} Severity Flag
                    </span>
                    <span className="text-sm text-[#8B93A7] font-semibold">
                      Target: {flag.holdingName}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#991B1B]">
                    {flag.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleSimulate(flag)}
                  className="px-4 py-2.5 bg-[#EF4444] text-white hover:bg-[#DC2626] rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Simulate Risk Impact
                </button>
              </div>

              <p className="text-sm text-[#475569] leading-relaxed mb-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE9DF]">
                {flag.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t border-[#F1EFE9]">
                <div>
                  <span className="font-bold text-[#14213D] block mb-1">Suggested Remedial Action:</span>
                  <p className="text-[#6B7280]">{flag.suggestedAction}</p>
                </div>
                <div>
                  <span className="font-bold text-[#14213D] block mb-1">SEBI Compliance Benchmark:</span>
                  <p className="text-[#C57D25] font-mono text-xs">{flag.sebiRuleRef}</p>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Suitability Score Matrix */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
          <h2 className="text-lg font-bold text-[#14213D] mb-4">
            Holding Suitability Matrix
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#EDE9DF] text-[#8B93A7] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Holding</th>
                  <th className="py-3 px-3">Lock-in Period</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3">Suitability Score</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFE9]">
                {holdings.map((h) => (
                  <tr key={h.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#14213D]">
                      {h.name}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#6B7280]">
                      {h.lockInMonths > 0 ? `${h.lockInMonths} Months` : 'None (Liquid)'}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-[#475569]">
                      {h.riskCategory}
                    </td>
                    <td className="py-3.5 px-3 font-bold font-mono-num">
                      <span className={h.suitabilityScore >= 80 ? 'text-[#2BB673]' : 'text-[#C57D25]'}>
                        {h.suitabilityScore} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold">
                      {h.suitabilityScore >= 80 ? (
                        <span className="inline-flex items-center space-x-1 text-[#2BB673] bg-[#E6F4EA] px-2.5 py-1 rounded-full text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Suitable</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[#EF4444] bg-[#FDF2F2] px-2.5 py-1 rounded-full text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Flagged</span>
                        </span>
                      )}
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
