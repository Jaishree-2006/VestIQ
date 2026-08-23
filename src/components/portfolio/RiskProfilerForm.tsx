import React, { useState } from 'react';
import type { SebiRiskCategory, RiskProfilerAnswers } from '../../types';
import { SEBI_RISK_QUESTIONS, computeSebiRiskCategory, getSebiRiskVisualTokens, SEBI_RISK_RANKS } from '../../utils/riskProfiler';
import { Check, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

interface RiskProfilerFormProps {
  initialAnswers?: Partial<RiskProfilerAnswers>;
  onComplete?: (category: SebiRiskCategory, answers: RiskProfilerAnswers) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isCompact?: boolean;
}

export const RiskProfilerForm: React.FC<RiskProfilerFormProps> = ({
  initialAnswers = {},
  onComplete,
  onCancel,
  submitLabel = 'Save & Apply SEBI Risk Profile',
  isCompact = false,
}) => {
  const [answers, setAnswers] = useState<Partial<RiskProfilerAnswers>>(initialAnswers);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  const { category, score, maxScore, answeredCount, totalQuestions } = computeSebiRiskCategory(answers);
  const riskTokens = getSebiRiskVisualTokens(category);
  const isAllAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (questionId: keyof RiskProfilerAnswers, optionValue: string) => {
    const nextAnswers = { ...answers, [questionId]: optionValue };
    setAnswers(nextAnswers);
    if (activeQuestionIdx < SEBI_RISK_QUESTIONS.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    // If not all explicitly selected, fallback with defaults
    const completeAnswers: RiskProfilerAnswers = {
      horizon: answers.horizon || '3-5yr',
      incomeStability: answers.incomeStability || 'stable',
      experience: answers.experience || 'mf_sip',
      lossReaction: answers.lossReaction || 'hold_calm',
      liquidityNeed: answers.liquidityNeed || 'partial_1_2yr',
    };
    const finalResult = computeSebiRiskCategory(completeAnswers);
    onComplete?.(finalResult.category, completeAnswers);
  };

  return (
    <div className="space-y-6">
      {/* Riskometer Realtime Score Preview Banner */}
      <div className={`${riskTokens.bg} border ${riskTokens.border} rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl bg-white/80 border ${riskTokens.border} flex items-center justify-center ${riskTokens.text} shrink-0`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7]">
              SEBI Riskometer Assessment ({answeredCount}/{totalQuestions} Answered)
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xl font-extrabold ${riskTokens.text}`}>
                {category} Risk
              </span>
              <span className="text-xs text-[#6B7280]">
                • Riskometer Level {SEBI_RISK_RANKS[category]}/6 (Score {score}/{maxScore})
              </span>
            </div>
          </div>
        </div>

        {answeredCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setActiveQuestionIdx(0);
            }}
            className="text-xs font-bold text-[#8B93A7] hover:text-[#14213D] flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset answers</span>
          </button>
        )}
      </div>

      {/* Questions Flow */}
      <div className="space-y-5">
        {SEBI_RISK_QUESTIONS.map((q, qIdx) => {
          const selectedVal = answers[q.id];
          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all ${
                qIdx === activeQuestionIdx ? 'border-[#C57D25] shadow-xs' : 'border-[#EDE9DF]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-[#14213D]">
                    {q.title}
                  </h4>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {q.subtitle}
                  </p>
                </div>
                {selectedVal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#2BB673] shrink-0 border border-[#A7F3D0]">
                    Answered ✓
                  </span>
                )}
              </div>

              {/* Option choices */}
              <div className="grid grid-cols-1 gap-2 mt-3">
                {q.options.map((opt) => {
                  const isSelected = selectedVal === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelectOption(q.id, opt.value)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#FFF8EE] border-[#C57D25] text-[#14213D] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EDE9DF] text-[#475569] hover:border-[#C57D25]/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs ${isSelected ? 'font-extrabold text-[#14213D]' : 'font-medium text-[#14213D]'}`}>
                          {opt.label}
                        </div>
                        {opt.sublabel && (
                          <div className="text-[11px] text-[#8B93A7] mt-0.5 truncate">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#C57D25] bg-[#C57D25] text-white' : 'border-[#CBD5E1] bg-white'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#EDE9DF]">
        <div className="text-xs text-[#6B7280]">
          {isAllAnswered ? (
            <span className="text-[#2BB673] font-bold">✓ All 5 assessment parameters answered</span>
          ) : (
            <span>{totalQuestions - answeredCount} question(s) remaining for full precision</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#6B7280] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2"
          >
            <span>{submitLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
