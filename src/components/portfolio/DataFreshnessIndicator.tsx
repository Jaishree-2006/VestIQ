import React from 'react';
import { AlertTriangle, Upload, Clock } from 'lucide-react';
import type { CasParseResult } from '../../types';

interface DataFreshnessIndicatorProps {
  uploadedCas: CasParseResult | null;
  /** Called when user clicks the re-upload nudge — navigate to upload flow */
  onReUpload: () => void;
  className?: string;
}

const STALE_THRESHOLD_DAYS = 30;

/**
 * Shows a single line beneath the Health Score number:
 *  - Fresh (< 30 days):  "Based on your CAS uploaded 3 Aug 2025 · 12 holdings analysed"
 *  - Stale (≥ 30 days):  amber warning with re-upload nudge
 *  - No data: nothing rendered
 */
export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  uploadedCas,
  onReUpload,
  className = '',
}) => {
  if (!uploadedCas?.uploadedAt) return null;

  const uploadDate = new Date(uploadedCas.uploadedAt);
  const now = new Date();
  const diffMs = now.getTime() - uploadDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isStale = diffDays >= STALE_THRESHOLD_DAYS;

  const formattedDate = uploadDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (isStale) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <AlertTriangle className="w-3 h-3 text-[#C57D25] shrink-0" />
        <span className="text-[11px] font-semibold text-[#C57D25]">
          Your data is {diffDays} day{diffDays !== 1 ? 's' : ''} old —{' '}
        </span>
        <button
          onClick={onReUpload}
          className="text-[11px] font-bold text-[#C57D25] underline underline-offset-2 decoration-dotted hover:text-[#B06C19] cursor-pointer transition-colors"
        >
          re-upload your CAS for an updated score
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Clock className="w-3 h-3 text-[#8B93A7] shrink-0" />
      <span className="text-[11px] text-[#8B93A7]">
        Based on your CAS uploaded{' '}
        <span className="font-semibold text-[#6B7280]">{formattedDate}</span>
        {' · '}
        <span className="font-semibold text-[#6B7280]">
          {uploadedCas.holdingsCount} holding{uploadedCas.holdingsCount !== 1 ? 's' : ''}
        </span>{' '}
        analysed
      </span>
    </div>
  );
};
