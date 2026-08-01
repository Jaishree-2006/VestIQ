import React from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PremiumGateProps {
  featureName: string;
  featureDescription: string;
  included: string[];
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ featureName, featureDescription, included }) => {
  const { navigateTo } = useApp();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">

        {/* Lock icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 bg-[#FFF8EE] border border-[#F7E5C8] px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#C57D25]" />
          <span className="text-xs font-bold text-[#C57D25] uppercase tracking-wider">Premium Feature</span>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0B1220] mb-2">{featureName}</h2>
        <p className="text-sm text-[#64748B] leading-relaxed mb-6">{featureDescription}</p>

        <div className="bg-white rounded-2xl p-4 border border-[#EDE9DF] text-left mb-6 space-y-2">
          <div className="text-xs font-bold text-[#8B93A7] uppercase tracking-wider mb-2">Included in Premium DIY:</div>
          {included.map((item, i) => (
            <div key={i} className="flex items-center space-x-2 text-xs text-[#475569]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2BB673] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigateTo('pricing')}
          className="w-full py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
        >
          <span>Upgrade to Premium — ₹299/month</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-[#8B93A7] mt-3">14-day free trial. No payment needed to start.</p>
      </div>
    </div>
  );
};
