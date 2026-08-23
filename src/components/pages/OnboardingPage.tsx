import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_PERMISSIONS } from '../../types';
import {
  Upload, ShieldCheck, CheckCircle2, ChevronRight, ArrowRight
} from 'lucide-react';
import { RiskProfilerForm } from '../portfolio/RiskProfilerForm';

export const OnboardingPage: React.FC = () => {
  const { role, setCurrentPage, completeOnboarding, riskProfilerAnswers, setRiskProfile, handleCasUpload } = useApp();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const perms = ROLE_PERMISSIONS[role];

  const totalSteps = 2;
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const handleProfilerComplete = (category: any, answers: any) => {
    setRiskProfile(category, answers);
    setCurrentStep(2);
  };

  const handleLoadSampleAndFinish = async () => {
    setLoadingSample(true);
    await handleCasUpload('sample_cas.pdf');
    setLoadingSample(false);
    completeOnboarding();
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-2xl my-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] mb-1">
            Welcome to <span className="text-[#C57D25]">VestIQ</span>
          </div>
          <p className="text-sm text-[#6B7280]">
            SEBI-aligned portfolio intelligence & mis-selling audit platform.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C57D25]">
              Step {currentStep} of {totalSteps}: {currentStep === 1 ? 'SEBI Risk Profile Assessment' : 'Connect Your Portfolio'}
            </span>
            <span className="text-xs text-[#8B93A7]">{Math.round(progressPct)}% complete</span>
          </div>
          <div className="w-full bg-[#EDE9DF] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#C57D25] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-between mt-3">
            {[1, 2].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`flex flex-col items-center cursor-pointer transition-all ${stepNum <= currentStep ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  stepNum === currentStep
                    ? 'bg-[#C57D25] border-[#C57D25] text-white shadow-md scale-110'
                    : stepNum < currentStep
                    ? 'bg-[#E6F4EA] border-[#2BB673] text-[#2BB673]'
                    : 'bg-white border-[#EDE9DF] text-[#8B93A7]'
                }`}>
                  {stepNum < currentStep ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: SEBI Risk Profiler */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border-2 border-[#C57D25] shadow-vestiq-lg p-6 sm:p-8 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-[#14213D]">
                SEBI Riskometer Questionnaire
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Answer 5 short questions to establish your baseline investor risk category. This directly feeds into the Suitability Engine to catch unsuitable or aggressive products.
              </p>
            </div>

            <RiskProfilerForm
              initialAnswers={riskProfilerAnswers}
              onComplete={handleProfilerComplete}
              submitLabel="Save Profile & Continue to Step 2 →"
            />
          </div>
        )}

        {/* Step 2: Connect Portfolio / CAS Upload */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border-2 border-[#C57D25] shadow-vestiq-lg p-6 sm:p-8 mb-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#14213D]">
                  Connect Your Portfolio
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Upload an NSDL / CDSL CAS PDF to scan all your multi-broker holdings, calculate your Health Score, and audit suitability mismatches.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleLoadSampleAndFinish}
                disabled={loadingSample}
                className="w-full sm:w-auto flex-1 px-6 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
              >
                {loadingSample ? 'Loading Sample Portfolio...' : 'Load Sample CAS Portfolio & Go to Dashboard →'}
              </button>

              <button
                onClick={() => {
                  completeOnboarding();
                  setCurrentPage('settings');
                }}
                className="w-full sm:w-auto px-5 py-3 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Upload CAS PDF File
              </button>
            </div>
          </div>
        )}

        {/* Role Access Level Banner */}
        <div className="bg-[#F6F4ED] rounded-3xl p-6 border border-[#EDE9DF] shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center shrink-0 border border-[#F7E5C8]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14213D]">
                Role: {perms.label}
              </div>
              <p className="text-[11px] text-[#6B7280]">{perms.description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              completeOnboarding();
              setCurrentPage('dashboard');
            }}
            className="text-xs text-[#8B93A7] hover:text-[#14213D] cursor-pointer underline shrink-0 font-medium"
          >
            Skip to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
