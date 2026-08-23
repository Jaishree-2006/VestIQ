import React from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Sparkles, ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface PremiumGateProps {
  featureName: string;
  featureDescription: string;
  included: string[];
  /** 'upgrade' = free-tier user (default), 'trial_expired' = premium_trial whose time ran out */
  variant?: 'upgrade' | 'trial_expired';
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  featureName,
  featureDescription,
  included,
  variant = 'upgrade',
}) => {
  const { navigateTo, startFreeTrial } = useApp();
  const isExpired = variant === 'trial_expired';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">

        {/* Icon — different for expired vs. upgrade prompt */}
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-6 ${
          isExpired
            ? 'bg-[#FDF2F2] border-[#FCA5A5] text-[#EF4444]'
            : 'bg-[#FFF8EE] border-[#F7E5C8] text-[#C57D25]'
        }`}>
          {isExpired ? <Clock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        {/* Badge */}
        <div className={`inline-flex items-center space-x-1.5 border px-3 py-1 rounded-full mb-4 ${
          isExpired
            ? 'bg-[#FDF2F2] border-[#FCA5A5]'
            : 'bg-[#FFF8EE] border-[#F7E5C8]'
        }`}>
          {isExpired
            ? <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            : <Sparkles className="w-3.5 h-3.5 text-[#C57D25]" />
          }
          <span className={`text-xs font-bold uppercase tracking-wider ${isExpired ? 'text-[#EF4444]' : 'text-[#C57D25]'}`}>
            {isExpired ? 'Trial Ended' : 'Premium Feature'}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-extrabold text-[#14213D] mb-2">
          {isExpired ? 'Your 14-day trial has ended' : featureName}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
          {isExpired
            ? `Your free trial of ${featureName} has expired. Upgrade to Premium DIY to keep full access — no lock-in, cancel anytime.`
            : featureDescription
          }
        </p>

        {/* Included features list */}
        <div className="bg-white rounded-2xl p-4 border border-[#EDE9DF] text-left mb-6 space-y-2">
          <div className="text-xs font-bold text-[#8B93A7] uppercase tracking-wider mb-2">
            {isExpired ? 'What you had access to:' : 'Included in Premium DIY:'}
          </div>
          {included.map((item, i) => (
            <div key={i} className="flex items-center space-x-2 text-xs text-[#475569]">
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isExpired ? 'text-[#CBD5E1]' : 'text-[#2BB673]'}`} />
              <span className={isExpired ? 'line-through text-[#94A3B8]' : ''}>{item}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigateTo('pricing')}
          className="w-full py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 mb-3"
        >
          <span>{isExpired ? 'Upgrade to Premium — ₹299/month' : 'Upgrade to Premium — ₹299/month'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Secondary link — only for free users, not expired trial */}
        {!isExpired && (
          <button
            onClick={startFreeTrial}
            className="w-full py-2.5 bg-white border border-[#C57D25] text-[#C57D25] font-bold rounded-xl text-sm transition-all cursor-pointer hover:bg-[#FFF8EE]"
          >
            Start 14-Day Free Trial — No payment needed
          </button>
        )}

        <p className="text-[11px] text-[#8B93A7] mt-3">
          {isExpired ? 'No lock-in · Cancel anytime' : '14-day free trial. No payment needed to start.'}
        </p>
      </div>
    </div>
  );
};
