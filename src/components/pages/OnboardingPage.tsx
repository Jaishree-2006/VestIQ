import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_PERMISSIONS } from '../../types';
import type { PageId } from '../../types';
import {
  ShieldCheck, CheckCircle2, ChevronRight, Check, Sliders, Sparkles
} from 'lucide-react';
import { SEBI_RISK_QUESTIONS, calculateRiskCategory, type SebiRiskCategory } from '../../utils/riskProfiler';

export const OnboardingPage: React.FC = () => {
  const { role, setCurrentPage, completeOnboarding, userRiskAnswers, updateUserRiskCategory } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>(() => ({
    horizon: userRiskAnswers.horizon || 2,
    income: userRiskAnswers.income || 2,
    experience: userRiskAnswers.experience || 2,
    reaction: userRiskAnswers.reaction || 2,
    liquidity: userRiskAnswers.liquidity || 2,
  }));

  const perms = ROLE_PERMISSIONS[role];
  const totalSteps = 2;

  const handleOptionSelect = (qId: string, pts: number) => {
    const nextAnswers = { ...answers, [qId]: pts };
    setAnswers(nextAnswers);
    const cat = calculateRiskCategory(nextAnswers);
    updateUserRiskCategory(cat, nextAnswers);
  };

  const computedCategory = calculateRiskCategory(answers);

  const handleFinishOnboarding = () => {
    updateUserRiskCategory(computedCategory, answers);
    completeOnboarding();
    setCurrentPage('dashboard');
  };

  const progressPct = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold text-[#14213D] mb-1">
            Welcome to <span className="text-[#C57D25]">VestIQ</span>
          </div>
          <p className="text-sm text-[#6B7280]">
            SEBI Riskometer Risk Profiler & Portfolio Suitability Setup
          </p>
        </div>

        {/* Step Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C57D25]">
              Step {currentStep} of {totalSteps}: {currentStep === 1 ? 'Platform Overview' : 'SEBI Risk Profiler'}
            </span>
            <span className="text-xs text-[#8B93A7]">{Math.round(progressPct)}% complete</span>
          </div>
          <div className="w-full bg-[#EDE9DF] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#C57D25] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        {currentStep === 1 ? (
          <div className="bg-white rounded-3xl border-2 border-[#C57D25] shadow-vestiq-lg p-8 mb-6">
            <div className="flex items-start space-x-5">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                  Step 1: Suitability Protection Safeguard
                </div>
                <h3 className="text-xl font-extrabold text-[#14213D] mb-2">
                  SEBI-Aligned Suitability & Risk Engine
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  VestIQ continuously cross-references your portfolio holdings against SEBI’s 6-band Riskometer framework to detect product mis-selling, horizon mismatches, and inappropriate risk exposure before losses occur.
                </p>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer inline-flex items-center space-x-2"
                >
                  <span>Proceed to SEBI Risk Profiler</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-[#C57D25] shadow-vestiq-lg p-8 mb-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EDE9DF]">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#C57D25]" />
                <h3 className="font-extrabold text-lg text-[#14213D]">SEBI Riskometer Risk Profiler</h3>
              </div>
              <div className="px-3 py-1 bg-[#FFF8EE] border border-[#F7E5C8] rounded-xl flex items-center space-x-1.5">
                <span className="text-xs text-[#8B93A7] font-semibold">Assessed Profile:</span>
                <span className={`text-xs font-extrabold ${computedCategory === 'Low' || computedCategory === 'Low to Moderate' ? 'text-[#2BB673]' : computedCategory === 'Very High' ? 'text-[#EF4444]' : 'text-[#C57D25]'}`}>
                  {computedCategory}
                </span>
              </div>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
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
                      const isSelected = answers[q.id] === opt.points;
                      return (
                        <button
                          key={opt.points}
                          onClick={() => handleOptionSelect(q.id, opt.points)}
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
            </div>

            <div className="mt-6 pt-4 border-t border-[#EDE9DF] flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] text-[#6B7280] rounded-xl text-xs font-bold hover:bg-[#F6F4ED] cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="px-6 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Save Risk Profile &amp; Launch Dashboard →</span>
              </button>
            </div>
          </div>
        )}

        {/* Access Summary */}
        <div className="bg-[#F6F4ED] rounded-3xl p-6 border border-[#EDE9DF] shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center shrink-0 border border-[#F7E5C8]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14213D]">
                Access Level: {perms.label}
              </div>
              <p className="text-[11px] text-[#6B7280]">{perms.description}</p>
            </div>
          </div>
          <button
            onClick={handleFinishOnboarding}
            className="text-xs text-[#8B93A7] hover:text-[#14213D] cursor-pointer underline shrink-0 font-medium"
          >
            Skip &amp; use defaults
          </button>
        </div>

      </div>
    </div>
  );
};
