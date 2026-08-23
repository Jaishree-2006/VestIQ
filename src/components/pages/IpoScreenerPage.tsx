import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { UPCOMING_ISSUES } from '../../data/upcomingIssues';
import type { UpcomingIssue } from '../../data/upcomingIssues';
import { evaluateIssueSuitability } from '../../utils/ipoScreener';
import { getSebiRiskVisualTokens, SEBI_RISK_RANKS } from '../../utils/riskProfiler';
import { translateExplanation, getLanguageFontClass } from '../../utils/translations';
import { 
  Sparkles, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  IndianRupee, 
  ShieldCheck, 
  Lock, 
  Info,
  Building2,
  TrendingUp,
  Layers,
  ChevronRight
} from 'lucide-react';
import { GlossaryTerm } from '../ui/GlossaryTerm';

export const IpoScreenerPage: React.FC = () => {
  const { holdings, riskCategory, setCurrentPage, preferredLanguage } = useApp();

  const [selectedIssueId, setSelectedIssueId] = useState<string>(UPCOMING_ISSUES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [simulatedAmount, setSimulatedAmount] = useState<number>(50000);

  const filteredIssues = useMemo(() => {
    return UPCOMING_ISSUES.filter((issue) => {
      const matchesSearch =
        issue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.ticker.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterType === 'all') return true;
      if (filterType === 'ipo') return issue.issueType === 'IPO';
      if (filterType === 'nfo') return issue.issueType === 'NFO';
      if (filterType === 'reits_invits') return issue.assetClass === 'reits_invits';
      if (filterType === 'bonds') return issue.assetClass === 'bonds';
      return true;
    });
  }, [searchQuery, filterType]);

  const selectedIssue = useMemo(() => {
    return UPCOMING_ISSUES.find((i) => i.id === selectedIssueId) || UPCOMING_ISSUES[0];
  }, [selectedIssueId]);

  const diagnosticResult = useMemo(() => {
    return evaluateIssueSuitability(selectedIssue, holdings, riskCategory, simulatedAmount);
  }, [selectedIssue, holdings, riskCategory, simulatedAmount]);

  const riskTokens = getSebiRiskVisualTokens(riskCategory);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans selection:bg-[#FCEEBB] overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
              <Sparkles className="w-4 h-4 text-[#C57D25]" />
              <span>SEBI-Aligned Pre-Application Screening</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14213D] tracking-tight">
              IPO &amp; NFO Suitability Screener
            </h1>
            <p className="text-sm text-[#6B7280] mt-1.5 max-w-2xl leading-relaxed">
              Screen upcoming primary public offerings and mutual fund NFOs against your actual portfolio concentration and <GlossaryTerm term="sebi riskometer">SEBI Riskometer</GlossaryTerm> capacity before committing capital.
            </p>
          </div>

          {/* Risk Profile Card */}
          <div
            onClick={() => setCurrentPage('settings')}
            className={`${riskTokens.bg} border ${riskTokens.border} rounded-2xl p-3.5 sm:px-5 sm:py-3 flex flex-col items-center justify-center shadow-xs cursor-pointer ${riskTokens.hoverBorder} transition-colors min-w-[150px]`}
            title="Click to edit SEBI Risk Profile in Settings"
          >
            <div className="text-[11px] font-semibold text-[#8B93A7] uppercase tracking-wider mb-0.5">
              Assessed Risk
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold ${riskTokens.text} font-mono-num text-center`}>
              {riskCategory || 'Not Assessed'}
            </div>
            <div className="text-[10px] font-bold text-[#8B93A7] mt-0.5">
              {riskCategory ? `Riskometer: ${SEBI_RISK_RANKS[riskCategory] || 3}/6` : 'Complete in Settings'}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EDE9DF] shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-[#8B93A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search upcoming IPOs, NFOs, sectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE9DF] rounded-xl text-xs font-bold text-[#14213D] focus:outline-none focus:border-[#C57D25]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Issues' },
              { id: 'ipo', label: 'IPOs' },
              { id: 'nfo', label: 'NFOs' },
              { id: 'reits_invits', label: 'REITs / InvITs' },
              { id: 'bonds', label: 'Bonds & G-Secs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#6B7280] border border-transparent hover:border-[#EDE9DF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid: List & Diagnostics Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: List of Upcoming Issues (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-1 px-1">
              Upcoming Primary Market Issues ({filteredIssues.length})
            </div>

            {filteredIssues.map((issue) => {
              const isSelected = issue.id === selectedIssue.id;
              const result = evaluateIssueSuitability(issue, holdings, riskCategory, simulatedAmount);
              const isConflict = result.verdict === 'warning';
              const isCaution = result.verdict === 'caution';

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#C57D25] shadow-vestiq-md ring-1 ring-[#C57D25]'
                      : 'bg-white border-[#EDE9DF] hover:border-[#C57D25]/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#EDE9DF] text-[#14213D] rounded-md font-mono text-[10px] font-bold">
                        {issue.issueType}
                      </span>
                      <span className="text-xs font-bold text-[#8B93A7] font-mono">
                        {issue.ticker}
                      </span>
                    </div>

                    {/* Suitability quick tag */}
                    {isConflict ? (
                      <span className="px-2 py-0.5 bg-[#FDF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Conflict</span>
                      </span>
                    ) : isCaution ? (
                      <span className="px-2 py-0.5 bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span>Caution</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#E6F4EA] border border-[#A7F3D0] text-[#2BB673] rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Suitable</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-[#14213D] leading-snug">
                    {issue.name}
                  </h3>

                  <div className="text-xs text-[#6B7280] mt-1 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-[#8B93A7]" />
                    <span>{issue.sector}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F1EFE9] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#8B93A7]" />
                      <span>{issue.biddingDates}</span>
                    </div>
                    <div className="font-bold font-mono-num text-[#14213D]">
                      Min: ₹{issue.minInvestment.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Diagnostic & Causal Suitability Panel (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EDE9DF] shadow-xs sticky top-6">
              
              {/* Selected Issue Title Bar */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-[#F1EFE9] mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] rounded-md text-xs font-bold">
                      {selectedIssue.issueType}
                    </span>
                    <span className="text-xs font-bold text-[#8B93A7] uppercase tracking-wider">
                      {selectedIssue.sector}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#14213D]">
                    {selectedIssue.name}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    {selectedIssue.description}
                  </p>
                </div>
              </div>

              {/* Issue Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                  <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Price / NAV</div>
                  <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                    {selectedIssue.priceRange}
                  </div>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                  <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">Min Application</div>
                  <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                    ₹{selectedIssue.minInvestment.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                  <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">
                    <GlossaryTerm term="lock-in period">Lock-in Period</GlossaryTerm>
                  </div>
                  <div className="font-extrabold text-[#14213D] text-sm mt-0.5">
                    {selectedIssue.lockInMonths > 0 ? `${selectedIssue.lockInMonths} Months` : 'Liquid (0 Mo)'}
                  </div>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                  <div className="text-[#8B93A7] text-[10px] font-bold uppercase tracking-wider">
                    <GlossaryTerm term="sebi riskometer">Riskometer</GlossaryTerm>
                  </div>
                  <div className="font-extrabold text-[#14213D] text-sm mt-0.5">
                    {selectedIssue.riskCategory}
                  </div>
                </div>
              </div>

              {/* Interactive "What If I Invest" Simulator */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
                  <div>
                    <span className="font-bold text-[#14213D]">Simulate Intended Application Amount:</span>
                    <p className="text-[11px] text-[#6B7280]">
                      Calculate post-application sector weighting and concentration impact
                    </p>
                  </div>
                  <div className="font-extrabold text-sm text-[#C57D25] font-mono-num">
                    ₹{simulatedAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[15000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setSimulatedAmount(amt)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        simulatedAmount === amt
                          ? 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
                          : 'bg-white text-[#6B7280] border-[#EDE9DF] hover:border-[#C57D25]'
                      }`}
                    >
                      ₹{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* SUITABILITY DIAGNOSTIC VERDICT CARD */}
              {diagnosticResult.verdict === 'warning' ? (
                /* Concentration / Conflict Warning Card */
                <div className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-5 mb-6 shadow-xs">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 border border-[#FCA5A5] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
                        Pre-Application Conflict Detected
                      </div>
                      <h3 className="font-extrabold text-base text-[#991B1B]">
                        {diagnosticResult.headline}
                      </h3>
                      <p className="text-xs text-[#7F1D1D] mt-1 leading-relaxed">
                        {diagnosticResult.description}
                      </p>
                    </div>
                  </div>

                  {/* Causal-Chain Pill Layout matching Explainability Center */}
                  {diagnosticResult.causalChain && (
                    <div className="bg-white rounded-xl p-4 border border-[#FCA5A5] mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#C57D25] mb-2.5 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span><GlossaryTerm term="causal chain">Causal Transmission Mechanism</GlossaryTerm></span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-[#FFF8EE] p-3 rounded-xl border border-[#F7E5C8]">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1">
                            1
                          </div>
                          <div className="text-[10px] font-bold text-[#C57D25] uppercase">Existing Portfolio</div>
                          <div className={`text-[11px] font-bold text-[#14213D] mt-0.5 ${getLanguageFontClass(preferredLanguage)}`}>
                            {translateExplanation(diagnosticResult.causalChain.cause, preferredLanguage)}
                          </div>
                        </div>

                        <div className="bg-[#FFF8EE] p-3 rounded-xl border border-[#F7E5C8]">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1">
                            2
                          </div>
                          <div className="text-[10px] font-bold text-[#C57D25] uppercase">New Issue Impact</div>
                          <div className={`text-[11px] font-bold text-[#14213D] mt-0.5 ${getLanguageFontClass(preferredLanguage)}`}>
                            {translateExplanation(diagnosticResult.causalChain.mechanism, preferredLanguage)}
                          </div>
                        </div>

                        <div className="bg-[#FDF2F2] p-3 rounded-xl border border-[#FCA5A5]">
                          <div className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold flex items-center justify-center mb-1">
                            3
                          </div>
                          <div className="text-[10px] font-bold text-[#EF4444] uppercase">Actionable Advice</div>
                          <div className={`text-[11px] font-bold text-[#991B1B] mt-0.5 ${getLanguageFontClass(preferredLanguage)}`}>
                            {translateExplanation(diagnosticResult.causalChain.impact, preferredLanguage)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning bullet points */}
                  <div className="space-y-1.5 text-xs text-[#991B1B] font-medium">
                    {diagnosticResult.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-[#EF4444] font-bold">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : diagnosticResult.verdict === 'caution' ? (
                /* Caution / Risk Mismatch Card */
                <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5 mb-6 shadow-xs">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#C57D25]/10 border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#C57D25]">
                        Risk Capacity Caution
                      </div>
                      <h3 className="font-extrabold text-base text-[#92400E]">
                        {diagnosticResult.headline}
                      </h3>
                      <p className="text-xs text-[#78350F] mt-1 leading-relaxed">
                        {diagnosticResult.description}
                      </p>
                    </div>
                  </div>

                  {/* Causal-Chain */}
                  {diagnosticResult.causalChain && (
                    <div className="bg-white rounded-xl p-4 border border-[#F7E5C8] mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#C57D25] mb-2.5 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Causal Transmission Mechanism</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF]">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1">
                            1
                          </div>
                          <div className="text-[10px] font-bold text-[#8B93A7] uppercase">Assessed Capacity</div>
                          <div className={`text-[11px] font-bold text-[#14213D] mt-0.5 ${getLanguageFontClass(preferredLanguage)}`}>
                            {translateExplanation(diagnosticResult.causalChain.cause, preferredLanguage)}
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF]">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1">
                            2
                          </div>
                          <div className="text-[10px] font-bold text-[#8B93A7] uppercase">Issue Rating</div>
                          <div className={`text-[11px] font-bold text-[#14213D] mt-0.5 ${getLanguageFontClass(preferredLanguage)}`}>
                            {translateExplanation(diagnosticResult.causalChain.mechanism, preferredLanguage)}
                          </div>
                        </div>

                        <div className="bg-[#FFF8EE] p-3 rounded-xl border border-[#F7E5C8]">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1">
                            3
                          </div>
                          <div className="text-[10px] font-bold text-[#C57D25] uppercase">Guidance</div>
                          <div className={`text-[11px] font-bold text-[#92400E] mt-0.5 ${getLanguageFontClass(preferredLanguage)}`}>
                            {translateExplanation(diagnosticResult.causalChain.impact, preferredLanguage)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-[#78350F] font-medium">
                    {diagnosticResult.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-[#C57D25] font-bold">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Emerald Positive Confirmation Card */
                <div className="bg-[#F0FDF4] border border-[#A7F3D0] rounded-2xl p-5 mb-6 shadow-xs">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#2BB673]/10 border border-[#A7F3D0] text-[#2BB673] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#2BB673]">
                        SEBI Suitability Matrix Confirmed
                      </div>
                      <h3 className="font-extrabold text-base text-[#166534]">
                        {diagnosticResult.headline}
                      </h3>
                      <p className="text-xs text-[#15803D] mt-1 leading-relaxed">
                        {diagnosticResult.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#166534] font-medium bg-white/60 p-4 rounded-xl border border-[#A7F3D0]">
                    {diagnosticResult.diversificationBenefits.map((b, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-[#2BB673] font-bold">✓</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concentration Shift Comparison Table */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-xs">
                <div className="font-bold text-[#14213D] mb-2 flex items-center justify-between">
                  <span>Portfolio Weighting Shift (Pre vs. Post Application)</span>
                  <span className="text-[10px] text-[#8B93A7] font-mono">SEBI 25% Threshold</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#EDE9DF]">
                    <div className="text-[#8B93A7] text-[10px]">Current Asset Class Weight</div>
                    <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                      {diagnosticResult.existingAssetClassAllocationPct}%
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-0.5">
                      {selectedIssue.assetClass.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#EDE9DF]">
                    <div className="text-[#8B93A7] text-[10px]">Post-Simulation Weight (+₹{(simulatedAmount/1000).toFixed(0)}k)</div>
                    <div className={`font-extrabold text-sm mt-0.5 font-mono-num ${
                      diagnosticResult.simulatedAssetClassAllocationPct > 25 ? 'text-[#EF4444]' : 'text-[#2BB673]'
                    }`}>
                      {diagnosticResult.simulatedAssetClassAllocationPct}%
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-0.5">
                      {diagnosticResult.simulatedAssetClassAllocationPct > 25 ? '⚠ Exceeds 25% Threshold' : '✓ Within Safe Limits'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
