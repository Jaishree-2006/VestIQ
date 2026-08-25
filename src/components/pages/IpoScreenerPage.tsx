import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { UPCOMING_ISSUES, type UpcomingIssue } from '../../data/upcomingIssues';
import { screenUpcomingIssue, type IpoScreeningResult } from '../../utils/ipoScreener';
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  Calendar, 
  Tag, 
  ArrowRight,
  Info,
  DollarSign
} from 'lucide-react';
import { GlossaryTerm } from '../common/GlossaryTerm';

export const IpoScreenerPage: React.FC = () => {
  const { holdings, userRiskCategory, setCurrentPage } = useApp();
  const [selectedIssueId, setSelectedIssueId] = useState<string>(UPCOMING_ISSUES[0].id);
  const [filterType, setFilterType] = useState<'ALL' | 'IPO' | 'NFO' | 'NCD'>('ALL');

  const filteredIssues = useMemo(() => {
    if (filterType === 'ALL') return UPCOMING_ISSUES;
    return UPCOMING_ISSUES.filter(issue => issue.issue_type === filterType);
  }, [filterType]);

  const selectedIssue = useMemo(() => {
    return UPCOMING_ISSUES.find(i => i.id === selectedIssueId) || UPCOMING_ISSUES[0];
  }, [selectedIssueId]);

  const screeningResult: IpoScreeningResult = useMemo(() => {
    return screenUpcomingIssue(holdings, userRiskCategory, selectedIssue);
  }, [holdings, userRiskCategory, selectedIssue]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Sparkles className="w-4 h-4" />
              <span>Pre-Application Suitability Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              IPO &amp; NFO Suitability Screener
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Cross-reference upcoming market issues against your active portfolio concentration and <GlossaryTerm term="SEBI Riskometer">SEBI risk profile</GlossaryTerm> before applying.
            </p>
          </div>

          <div className="bg-[#F6F4ED] p-1 rounded-xl border border-[#EDE9DF] flex items-center shrink-0">
            {(['ALL', 'IPO', 'NFO', 'NCD'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-white text-[#C57D25] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                {type === 'ALL' ? 'All Issues' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Issue Selector (Left) & Screening Results (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upcoming Issues List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] px-1 mb-1">
              Upcoming Primary Issues ({filteredIssues.length})
            </div>

            {filteredIssues.map((issue) => {
              const isSelected = selectedIssue.id === issue.id;
              const previewResult = screenUpcomingIssue(holdings, userRiskCategory, issue);

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-[#C57D25] shadow-vestiq-sm'
                      : 'bg-white border-[#EDE9DF] hover:border-[#D5D8DD] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        issue.issue_type === 'IPO'
                          ? 'bg-[#EBF5FF] text-[#1D4ED8] border-[#BFDBFE]'
                          : issue.issue_type === 'NFO'
                          ? 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
                          : 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]'
                      }`}>
                        {issue.issue_type}
                      </span>
                      <span className="text-[11px] font-semibold text-[#8B93A7]">
                        {issue.sector}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      previewResult.isSuitable
                        ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                        : 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]'
                    }`}>
                      {previewResult.isSuitable ? '✓ Suitable' : '⚠️ Warning'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#14213D] mb-1">
                    {issue.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-[#F1EFE9]">
                    <span>{issue.price_range}</span>
                    <span className="text-[11px] font-medium">{issue.issue_dates}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: In-Depth Screener Evaluation Card */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Issue Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 mb-4 border-b border-[#EDE9DF]">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]">
                      {selectedIssue.issue_type} Analysis
                    </span>
                    <span className="text-xs font-semibold text-[#8B93A7]">
                      {selectedIssue.sector}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#14213D]">
                    {selectedIssue.name}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {selectedIssue.description}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs text-[#8B93A7] uppercase font-semibold">Min Investment</div>
                  <div className="text-lg font-bold font-mono-num text-[#14213D]">
                    ₹{selectedIssue.min_investment.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Assessment Status Banner */}
              {screeningResult.isSuitable ? (
                /* Emerald Positive Confirmation */
                <div className="bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-5 mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#2BB673] text-white flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#14532D]">
                        Issue Confirmed Suitable for Your Portfolio
                      </h4>
                      <p className="text-xs text-[#166534]">
                        Passes concentration limits and SEBI Riskometer profile alignment.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#14532D] leading-relaxed pt-2 border-t border-[#A7F3D0]/60">
                    {screeningResult.summaryReason}
                  </p>
                </div>
              ) : (
                /* Red Flag / Warning Banner */
                <div className="bg-[#FDF2F2] border-2 border-[#FCA5A5] rounded-2xl p-5 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-[#EF4444]" />
                  <div className="flex items-start space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white text-[#EF4444] border border-[#FCA5A5]">
                        {screeningResult.status === 'high_risk' ? 'High Risk Mismatch' : 'Concentration Warning'}
                      </span>
                      <h4 className="font-extrabold text-base text-[#991B1B] mt-1">
                        Pre-Application Conflict Detected
                      </h4>
                      <p className="text-xs text-[#7F1D1D] mt-0.5 leading-relaxed">
                        {screeningResult.summaryReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3-Step Causal-Chain Visualizer */}
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-3">
                  Suitability Causal-Chain Analysis
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Step 1: Cause */}
                  <div className={`p-4 rounded-2xl border relative ${
                    screeningResult.isSuitable ? 'bg-[#FAF8F5] border-[#EDE9DF]' : 'bg-[#FFF8EE] border-[#F7E5C8]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full text-white text-xs font-extrabold flex items-center justify-center mb-2 ${
                      screeningResult.isSuitable ? 'bg-[#8B93A7]' : 'bg-[#C57D25]'
                    }`}>
                      1
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A7] mb-1">
                      Existing State
                    </div>
                    <p className="text-xs font-bold text-[#14213D] leading-snug">
                      {screeningResult.causalChain.cause}
                    </p>
                  </div>

                  {/* Step 2: Mechanism */}
                  <div className={`p-4 rounded-2xl border relative ${
                    screeningResult.isSuitable ? 'bg-[#FAF8F5] border-[#EDE9DF]' : 'bg-[#FFF8EE] border-[#F7E5C8]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full text-white text-xs font-extrabold flex items-center justify-center mb-2 ${
                      screeningResult.isSuitable ? 'bg-[#8B93A7]' : 'bg-[#C57D25]'
                    }`}>
                      2
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A7] mb-1">
                      Issue Mechanism
                    </div>
                    <p className="text-xs font-bold text-[#14213D] leading-snug">
                      {screeningResult.causalChain.mechanism}
                    </p>
                  </div>

                  {/* Step 3: Impact / Action */}
                  <div className={`p-4 rounded-2xl border relative ${
                    screeningResult.isSuitable ? 'bg-[#E6F4EA] border-[#A7F3D0]' : 'bg-[#FDF2F2] border-[#FCA5A5]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full text-white text-xs font-extrabold flex items-center justify-center mb-2 ${
                      screeningResult.isSuitable ? 'bg-[#2BB673]' : 'bg-[#EF4444]'
                    }`}>
                      3
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      screeningResult.isSuitable ? 'text-[#2BB673]' : 'text-[#EF4444]'
                    }`}>
                      {screeningResult.isSuitable ? 'Diversification Gain' : 'Advisory Note'}
                    </div>
                    <p className={`text-xs font-bold leading-snug ${
                      screeningResult.isSuitable ? 'text-[#14532D]' : 'text-[#991B1B]'
                    }`}>
                      {screeningResult.causalChain.impact}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat Comparison Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#EDE9DF] text-xs">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF]">
                  <span className="text-[#8B93A7] block mb-0.5">Your Risk Profile:</span>
                  <strong className="text-[#14213D] text-sm">{userRiskCategory}</strong>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF]">
                  <span className="text-[#8B93A7] block mb-0.5">Issue Risk Level:</span>
                  <strong className={screeningResult.isSuitable ? 'text-[#2BB673] text-sm' : 'text-[#C57D25] text-sm'}>
                    {selectedIssue.risk_category}
                  </strong>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] col-span-2 sm:col-span-1">
                  <span className="text-[#8B93A7] block mb-0.5">Sector Exposure:</span>
                  <strong className="text-[#14213D] text-sm font-mono-num">{screeningResult.existingWeightPct}%</strong>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
