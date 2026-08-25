import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { AlertTriangle, ShieldCheck, CheckCircle, ArrowRight, FileText, Info, X, Copy, Check } from 'lucide-react';
import { deriveRedFlagsFromHoldings } from '../../utils/redFlags';
import type { RedFlagAlert } from '../../types';
import { GlossaryTerm } from '../common/GlossaryTerm';
import { BrokerCredentialBadge } from '../common/BrokerCredentialBadge';

const normalizeSeverity = (value: string) => value?.charAt(0).toUpperCase() + value?.slice(1) || 'Medium';

export const RedFlagsPage: React.FC = () => {
  const { redFlags, holdings, setCurrentPage, uploadedCas, monthlyExpenses, userRiskCategory } = useApp();
  const [filter, setFilter] = React.useState<'active' | 'resolved' | 'all'>('active');
  const [selectedFlagForDraft, setSelectedFlagForDraft] = React.useState<RedFlagAlert | null>(null);
  const [copiedDraft, setCopiedDraft] = React.useState(false);

  const activeFlags = (redFlags || []).filter((flag) => !['resolved', 'acknowledged'].includes(flag.status || 'active'));
  const resolvedFlags = (redFlags || []).filter((flag) => ['resolved', 'acknowledged'].includes(flag.status || 'active'));
  const liveFlags = activeFlags.length > 0 ? activeFlags : deriveRedFlagsFromHoldings(holdings, userRiskCategory, monthlyExpenses);
  const visibleFlags = filter === 'active' ? liveFlags : filter === 'resolved' ? resolvedFlags : [...liveFlags, ...resolvedFlags];

  const handleSimulate = (flag: { holdingId: string; holdingName: string; title: string }) => {
    sessionStorage.setItem('vestiq-shock-focus', JSON.stringify({
      holdingId: flag.holdingId,
      holdingName: flag.holdingName,
      title: flag.title,
    }));
    setCurrentPage('shock-sandbox');
  };

  const draftModalData = React.useMemo(() => {
    if (!selectedFlagForDraft) return null;
    const matchingHolding = holdings.find(
      (h) => h.id === selectedFlagForDraft.holdingId || h.name.toLowerCase().includes(selectedFlagForDraft.holdingName.toLowerCase())
    );
    const isin = matchingHolding?.isin || (selectedFlagForDraft.holdingName.includes('Grid InvIT') ? 'INE081U23015' : matchingHolding?.ticker || 'N/A');
    const lockIn = matchingHolding?.lockInMonths ? `${matchingHolding.lockInMonths} Months (${Math.round((matchingHolding.lockInMonths / 12) * 10) / 10} Years)` : (selectedFlagForDraft.description.includes('3-year') ? '36 Months (3 Years)' : 'None (Liquid)');
    const liquidityTerms = matchingHolding?.liquidity_terms || (matchingHolding?.lockInMonths ? `${matchingHolding.lockInMonths} Months Lock-in` : 'Standard Secondary Market Liquidity');
    const brokerName = matchingHolding?.broker || 'Groww / Relationship Manager';
    
    let investorName = 'Rajesh Kumar (PAN: ABCDE****F)';
    if (uploadedCas?.investorName) {
      investorName = uploadedCas.investorName;
    }

    const todayDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const draftText = `SEBI SCORES COMPLAINT DRAFT
--------------------------------------------------
Date: ${todayDate}
Category: Unsuitable Product Selling / Liquidity Horizon Mismatch

INVESTOR & INTERMEDIARY DETAILS
--------------------------------------------------
Complainant / Investor: ${investorName}
Intermediary / Broker / RM: ${brokerName}

SECURITY DETAILS
--------------------------------------------------
Security Name: ${matchingHolding?.name || selectedFlagForDraft.holdingName}
ISIN: ${isin}
Lock-in / Liquidity Terms: ${lockIn} (${liquidityTerms})

COMPLAINT STATEMENT & MISMATCH DESCRIPTION
--------------------------------------------------
SEBI Regulation / Benchmark: ${selectedFlagForDraft.sebiRuleRef}
Issue Title: ${selectedFlagForDraft.title}

Specific Mismatch Description:
${selectedFlagForDraft.description}

Remedial Action Requested:
${selectedFlagForDraft.suggestedAction}
--------------------------------------------------`;

    return { draftText, isin, lockIn, brokerName, investorName, todayDate };
  }, [selectedFlagForDraft, holdings, uploadedCas]);

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

        {/* Emergency Fund Check Prompt if monthly expenses estimate is not set */}
        {(monthlyExpenses === null || monthlyExpenses === undefined) && (
          <div className="mb-6 bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-[#8B93A7]">
              <Info className="w-4 h-4 text-[#8B93A7] shrink-0" />
              <span>Add your monthly expenses in Settings to enable this check.</span>
            </div>
            <button
              onClick={() => setCurrentPage('settings')}
              className="text-xs font-bold text-[#C57D25] hover:text-[#B06C19] transition-colors cursor-pointer self-start sm:self-auto underline"
            >
              Configure in Settings →
            </button>
          </div>
        )}

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

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => { setSelectedFlagForDraft(flag); setCopiedDraft(false); }}
                    className="px-4 py-2.5 bg-[#EF4444] text-white hover:bg-[#DC2626] rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0 inline-flex items-center gap-1"
                  >
                    <span>Draft <GlossaryTerm term="SCORES">SCORES</GlossaryTerm> Complaint</span>
                  </button>
                  <button
                    onClick={() => handleSimulate(flag)}
                    className="px-4 py-2.5 bg-[#EF4444] text-white hover:bg-[#DC2626] rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Simulate Risk Impact
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#475569] leading-relaxed mb-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE9DF]">
                {flag.description}
              </p>

              {/* RM / Intermediary Credential Format Badge */}
              {(() => {
                const matchingHolding = holdings.find(h => h.id === flag.holdingId || h.name === flag.holdingName);
                const regNum = flag.broker_reg_number !== undefined ? flag.broker_reg_number : matchingHolding?.broker_reg_number;
                const isRmFlag = Boolean(flag.rm_name || matchingHolding?.rm_name || /RM|Relationship Manager/i.test(flag.title + flag.description));

                if (isRmFlag || regNum !== undefined) {
                  return (
                    <div className="mb-4 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B93A7]">
                          Sourcing Intermediary / RM SEBI Credential Check
                        </span>
                        <BrokerCredentialBadge
                          brokerRegNumber={regNum}
                          brokerName={matchingHolding?.broker || flag.rm_name || 'Relationship Manager'}
                          showExplanation={false}
                        />
                      </div>
                      <BrokerCredentialBadge
                        brokerRegNumber={regNum}
                        brokerName={matchingHolding?.broker || flag.rm_name || 'Relationship Manager'}
                        showExplanation={true}
                      />
                    </div>
                  );
                }
                return null;
              })()}

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
                  <th className="py-3 px-3"><GlossaryTerm term="Lock-in Period" showIcon>Lock-in Period</GlossaryTerm></th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3"><GlossaryTerm term="Suitability Score" showIcon>Suitability Score</GlossaryTerm></th>
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

        {/* Modal / Drawer for SCORES Complaint Draft */}
        {selectedFlagForDraft && draftModalData && (
          <div className="fixed inset-0 bg-[#14213D]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-vestiq-lg border border-[#EDE9DF] relative max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EDE9DF]">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#EF4444]" />
                  <h3 className="font-extrabold text-lg text-[#14213D]">SEBI SCORES Complaint Draft</h3>
                </div>
                <button
                  onClick={() => { setSelectedFlagForDraft(null); setCopiedDraft(false); }}
                  className="p-1 text-[#6B7280] hover:text-[#14213D] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B7280]">
                    Pre-filled from Red Flag Detector &amp; Portfolio CAS
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(draftModalData.draftText);
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center space-x-1.5"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2BB673]" />
                        <span className="text-[#2BB673]">✓ Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#14213D]" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={draftModalData.draftText}
                  rows={14}
                  className="w-full p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-xs font-mono text-[#14213D] focus:outline-none resize-none leading-relaxed"
                />

                <p className="text-xs text-[#6B7280] text-center pt-1">
                  This is a draft for your review — please verify details before filing on the official SEBI SCORES portal.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
