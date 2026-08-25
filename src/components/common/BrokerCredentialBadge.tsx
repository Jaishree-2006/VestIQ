import React from 'react';
import { validateSebiRegistrationFormat } from '../../utils/brokerValidation';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface BrokerCredentialBadgeProps {
  brokerRegNumber?: string | null;
  brokerName?: string;
  className?: string;
  showExplanation?: boolean;
}

export const BrokerCredentialBadge: React.FC<BrokerCredentialBadgeProps> = ({
  brokerRegNumber,
  brokerName,
  className = '',
  showExplanation = true,
}) => {
  const result = validateSebiRegistrationFormat(brokerRegNumber);

  if (result.isValid) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C57D25]" />
          <span>{result.statusLabel}</span>
        </div>
        {showExplanation && (
          <div className="text-[11px] text-[#6B7280] flex items-center space-x-1">
            <Info className="w-3 h-3 text-[#8B93A7] shrink-0" />
            <span>
              {result.intermediaryType ? `${result.intermediaryType} • ` : ''}
              <span className="text-[#8B93A7] italic">{result.isFormatOnlyNote}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Red-toned flagged badge when format is invalid or missing
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
        <span>
          {result.regNumber
            ? `SEBI Format Invalid: ${result.regNumber}`
            : 'SEBI Reg Number Missing / Unrecorded'}
        </span>
      </div>
      {showExplanation && (
        <div className="p-2.5 rounded-xl bg-[#FDF2F2] border border-[#FCA5A5]/60 text-xs">
          <p className="text-[#991B1B] font-semibold leading-relaxed">
            {result.explanation}
          </p>
          <p className="text-[10px] text-[#7F1D1D] mt-0.5 italic">
            * {result.isFormatOnlyNote}
          </p>
        </div>
      )}
    </div>
  );
};
