import React from 'react';
import { ShieldCheck, AlertTriangle, UserCheck, HelpCircle } from 'lucide-react';
import { validateSebiRegNumber } from '../../utils/sebiRegValidator';

interface BrokerCredentialBadgeProps {
  brokerName?: string | null;
  brokerRegNumber?: string | null;
  rmName?: string | null;
  showExplanation?: boolean;
  className?: string;
}

export const BrokerCredentialBadge: React.FC<BrokerCredentialBadgeProps> = ({
  brokerName,
  brokerRegNumber,
  rmName,
  showExplanation = true,
  className = '',
}) => {
  const result = validateSebiRegNumber(brokerRegNumber);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {/* RM / Broker attribution name if present */}
        {rmName && (
          <span className="font-semibold text-[#14213D] inline-flex items-center space-x-1">
            <UserCheck className="w-3.5 h-3.5 text-[#8B93A7]" />
            <span>{rmName}</span>
          </span>
        )}

        {/* Valid Neutral Gold State */}
        {result.isValid ? (
          <span
            className="px-2.5 py-0.5 bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] rounded-full font-bold text-[11px] inline-flex items-center space-x-1 shadow-xs"
            title={result.explanation}
          >
            <ShieldCheck className="w-3 h-3 text-[#C57D25]" />
            <span>SEBI: {result.regNumber}</span>
            {result.intermediaryType && (
              <span className="text-[10px] text-[#C57D25]/80 font-normal">
                ({result.intermediaryType})
              </span>
            )}
          </span>
        ) : (
          /* Invalid / Missing Red Alert State */
          <span
            className="px-2.5 py-0.5 bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5] rounded-full font-bold text-[11px] inline-flex items-center space-x-1 shadow-xs"
            title={result.explanation}
          >
            <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
            <span>
              {result.status === 'missing'
                ? 'SEBI Reg: Unverified / Missing'
                : `SEBI Reg: Invalid Format (${result.regNumber})`}
            </span>
          </span>
        )}
      </div>

      {/* One line of causal explanation when the badge is red */}
      {!result.isValid && showExplanation && (
        <div className="text-[11px] text-[#991B1B] bg-[#FDF2F2] border border-[#FCA5A5] rounded-xl px-3 py-1.5 flex items-start space-x-1.5 leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
          <span>{result.explanation}</span>
        </div>
      )}
    </div>
  );
};
