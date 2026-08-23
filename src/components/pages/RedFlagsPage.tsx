import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { AlertTriangle, ShieldCheck, CheckCircle, ArrowRight, FileText, Info, Copy, Check, X } from 'lucide-react';
import { deriveRedFlagsFromHoldings } from '../../utils/redFlags';
import { generateScoresComplaintDraft } from '../../utils/scoresGrievance';
import type { RedFlagAlert } from '../../types';
import { GlossaryTerm } from '../ui/GlossaryTerm';
import { BrokerCredentialBadge } from '../ui/BrokerCredentialBadge';
import { LanguageToggle } from '../ui/LanguageToggle';
import { translateExplanation, getLanguageFontClass } from '../../utils/translations';

const normalizeSeverity = (value: string) => value?.charAt(0).toUpperCase() + value?.slice(1) || 'Medium';

export const RedFlagsPage: React.FC = () => {
  const { redFlags, holdings, setCurrentPage, riskCategory, userName, uploadedCas, monthlyExpensesEstimate, preferredLanguage } = useApp();
  const [filter, setFilter] = React.useState<'active' | 'resolved' | 'all'>('active');
  const [selectedFlagForComplaint, setSelectedFlagForComplaint] = useState<RedFlagAlert | null>(null);
  const [copiedComplaint, setCopiedComplaint] = useState<boolean>(false);

  const activeFlags = (redFlags || []).filter((flag) => !['resolved', 'acknowledged'].includes(flag.status || 'active'));
  const resolvedFlags = (redFlags || []).filter((flag) => ['resolved', 'acknowledged'].includes(flag.status || 'active'));
  const liveFlags = activeFlags.length > 0 ? activeFlags : deriveRedFlagsFromHoldings(holdings, riskCategory, monthlyExpensesEstimate);
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
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
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
          <div className="shrink-0">
            <LanguageToggle />
          </div>
        </div>

        {/* Muted Prompt when monthly expenses are not configured */}
        {monthlyExpensesEstimate === null && (
          <div className="mb-6 p-4 bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl flex items-center justify-between text-xs text-[#8B93A7]">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#C57D25] shrink-0" />
              <span>Add your monthly expenses in Settings to enable the Emergency Fund Adequacy check.</span>
            </div>
            <button
              onClick={() => setCurrentPage('settings')}
              className="font-bold text-[#C57D25] hover:underline cursor-pointer ml-3 shrink-0"
            >
              Configure in Settings &rarr;
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
          ) : visibleFlags.map((flag) => {
            const flagHolding = holdings.find((h) => h.id === flag.holdingId || h.name === flag.holdingName);
            const brokerReg = flag.broker_reg_number || flagHolding?.broker_reg_number;
            const rmName = flag.rm_name || flagHolding?.rm_name || (flag.holdingName?.includes('Grid InvIT') || flag.description?.includes('Relationship Manager') ? 'Amit Verma (Relationship Manager)' : undefined);
            const hasBrokerInfo = Boolean(brokerReg || rmName || flagHolding?.broker);

            const displayTitle = translateExplanation(flag.title, preferredLanguage);
            const displayDescription = translateExplanation(flag.description, preferredLanguage);
            const displaySuggestedAction = translateExplanation(flag.suggestedAction, preferredLanguage);

            return (
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
                    <h3 className={`text-xl font-extrabold text-[#991B1B] ${getLanguageFontClass(preferredLanguage)}`}>
                      {displayTitle}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedFlagForComplaint(flag);
                        setCopiedComplaint(false);
                      }}
                      className="px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      <FileText className="w-4 h-4 text-[#C57D25]" />
                      <span>Draft <GlossaryTerm term="scores">SCORES</GlossaryTerm> Complaint</span>
                    </button>

                    <button
                      onClick={() => handleSimulate(flag)}
                      className="px-4 py-2.5 bg-[#EF4444] text-white hover:bg-[#DC2626] rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Simulate Risk Impact
                    </button>
                  </div>
                </div>

                {/* Broker / RM Credential Display */}
                {hasBrokerInfo && (
                  <div className="mb-3.5 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A7] mb-1.5">
                      Intermediary / RM Attribution &amp; Credential Status
                    </div>
                    <BrokerCredentialBadge
                      brokerName={flagHolding?.broker}
                      brokerRegNumber={brokerReg}
                      rmName={rmName}
                    />
                  </div>
                )}

                <p className={`text-sm text-[#475569] leading-relaxed mb-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE9DF] ${getLanguageFontClass(preferredLanguage)}`}>
                  {displayDescription}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t border-[#F1EFE9]">
                  <div>
                    <span className="font-bold text-[#14213D] block mb-1">Suggested Remedial Action:</span>
                    <p className={`text-[#6B7280] ${getLanguageFontClass(preferredLanguage)}`}>{displaySuggestedAction}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#14213D] block mb-1">SEBI Compliance Benchmark:</span>
                    <p className="text-[#C57D25] font-mono text-xs">{flag.sebiRuleRef}</p>
                  </div>
                </div>

              </div>
            );
          })}
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
                  <th className="py-3 px-3"><GlossaryTerm term="lock-in period">Lock-in Period</GlossaryTerm></th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3"><GlossaryTerm term="suitability score">Suitability Score</GlossaryTerm></th>
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

        {/* SEBI SCORES Complaint Draft Modal */}
        {selectedFlagForComplaint && (() => {
          const matchingHolding = holdings.find(
            (h) => h.id === selectedFlagForComplaint.holdingId || h.name === selectedFlagForComplaint.holdingName || (selectedFlagForComplaint.holdingName && h.name.includes(selectedFlagForComplaint.holdingName))
          );
          const complaintDraft = generateScoresComplaintDraft({
            flag: selectedFlagForComplaint,
            holding: matchingHolding,
            investorName: userName || uploadedCas?.investorName || 'Investor',
            pan: uploadedCas?.pan,
            riskCategory,
          });

          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#EDE9DF] shadow-2xl">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EDE9DF]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25]">
                        SEBI SCORES Grievance Auto-Filer
                      </div>
                      <h3 className="text-lg font-extrabold text-[#14213D]">
                        Pre-filled SCORES Complaint Draft
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedFlagForComplaint(null)}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EDE9DF] text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4ED] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Read-only Draft Text Block */}
                <div className="flex-1 overflow-y-auto mb-4 bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl p-4 font-mono text-xs text-[#14213D] whitespace-pre-wrap select-text leading-relaxed">
                  {complaintDraft}
                </div>

                {/* Disclaimer Line */}
                <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-xl p-3 mb-4 text-xs text-[#6B7280] leading-relaxed">
                  <span className="font-bold text-[#C57D25]">Disclaimer: </span>
                  This is a draft for your review — please verify details before filing on the official SEBI SCORES portal.
                </div>

                {/* Modal Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EDE9DF]">
                  <span className="text-xs text-[#8B93A7] font-mono">
                    Target: {selectedFlagForComplaint.holdingName}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(complaintDraft);
                        setCopiedComplaint(true);
                        setTimeout(() => setCopiedComplaint(false), 2000);
                      }}
                      className="px-4 py-2 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      {copiedComplaint ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedComplaint ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedFlagForComplaint(null)}
                      className="px-4 py-2 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
};
