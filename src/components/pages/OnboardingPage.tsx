import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ONBOARDING_STEPS, ROLE_PERMISSIONS } from '../../types';
import type { PageId } from '../../types';
import { 
  Upload, LayoutDashboard, AlertTriangle, Sliders, Users, History,
  CheckCircle2, ArrowRight, ChevronRight, Lock, Sparkles, ShieldCheck
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { role, setCurrentPage, handleCasUpload, completeOnboarding, startOnboarding } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const perms = ROLE_PERMISSIONS[role];

  const stepIcons: React.ReactNode[] = [
    <ShieldCheck className="w-6 h-6" />,
    <Upload className="w-6 h-6" />,
    <LayoutDashboard className="w-6 h-6" />,
    <AlertTriangle className="w-6 h-6" />,
    <Sliders className="w-6 h-6" />,
    <Users className="w-6 h-6" />,
    <History className="w-6 h-6" />,
  ];

  const isPremium = role === 'investor_premium' || role === 'broker_rm' || role === 'compliance_officer' || role === 'admin';
  const totalSteps = isPremium ? 7 : 4; // Free investors skip sandbox/peer/retro
  const steps = ONBOARDING_STEPS.slice(0, totalSteps);
  const step = steps[currentStep - 1];

  const handleStepAction = () => {
    if (currentStep === 2) {
      handleCasUpload('sample_cas.pdf');
    }

    if (currentStep < totalSteps) {
      setCurrentStep(s => s + 1);
    } else {
      if (step.targetPage) {
        setCurrentPage(step.targetPage as PageId);
      }
      completeOnboarding();
    }
  };

  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold text-[#0B1220] mb-1">
            Welcome to <span className="text-[#C57D25]">VestIQ</span>
          </div>
          <p className="text-sm text-[#64748B]">
            Your multi-asset portfolio intelligence walkthrough — {totalSteps} steps to get started.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C57D25]">
              Step {currentStep} of {totalSteps}
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
            {steps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx + 1)}
                className={`flex flex-col items-center cursor-pointer transition-all ${idx + 1 <= currentStep ? 'opacity-100' : 'opacity-30'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  idx + 1 === currentStep
                    ? 'bg-[#C57D25] border-[#C57D25] text-white shadow-md scale-110'
                    : idx + 1 < currentStep
                    ? 'bg-[#E6F4EA] border-[#2BB673] text-[#2BB673]'
                    : 'bg-white border-[#EDE9DF] text-[#8B93A7]'
                }`}>
                  {idx + 1 < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Step Card */}
        <div className="bg-white rounded-3xl border-2 border-[#C57D25] shadow-vestiq-lg p-8 mb-6">
          <div className="flex items-start space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center shrink-0">
              {stepIcons[currentStep - 1]}
            </div>

            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                Step {currentStep}: {step.title}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Premium badge for gated steps */}
              {perms.premiumGated.includes(step.targetPage as PageId) && (
                <div className="flex items-center space-x-1.5 bg-[#FFF8EE] border border-[#F7E5C8] px-3 py-1.5 rounded-full w-fit mb-4">
                  <Lock className="w-3.5 h-3.5 text-[#C57D25]" />
                  <span className="text-xs font-bold text-[#C57D25]">Premium Feature — Upgrade to Unlock</span>
                </div>
              )}

              <button
                onClick={handleStepAction}
                className="px-6 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer inline-flex items-center space-x-2"
              >
                <span>{currentStep === totalSteps ? 'Launch VestIQ →' : step.action || 'Next'}</span>
                {currentStep < totalSteps && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Role Summary Card */}
        <div className="bg-[#F6F4ED] rounded-2xl p-4 border border-[#EDE9DF] flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center shrink-0 border border-[#F7E5C8]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-[#0B1220] mb-0.5">
              Your Access Level: {perms.label}
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">{perms.description}</p>
          </div>
          <button
            onClick={completeOnboarding}
            className="text-xs text-[#8B93A7] hover:text-[#0B1220] cursor-pointer underline shrink-0"
          >
            Skip tour
          </button>
        </div>

      </div>
    </div>
  );
};
