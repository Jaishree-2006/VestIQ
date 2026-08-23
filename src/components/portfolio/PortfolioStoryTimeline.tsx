import React from 'react';
import type { HealthScoreEvent, HealthScoreTriggerType } from '../../types';
import { useApp } from '../../context/AppContext';
import { translateExplanation, getLanguageFontClass } from '../../utils/translations';
import {
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  History,
  Layers,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';

interface PortfolioStoryTimelineProps {
  events: HealthScoreEvent[];
  mode?: 'condensed' | 'full';
  onViewFullHistory?: () => void;
}

const TRIGGER_TYPE_CONFIG: Record<HealthScoreTriggerType, { label: string; icon: React.ReactNode }> = {
  new_holding: { label: 'New Holding', icon: <Layers className="w-3 h-3 text-[#3B82F6]" /> },
  holding_removed: { label: 'Holding Removed', icon: <Layers className="w-3 h-3 text-[#EF4444]" /> },
  value_change: { label: 'Value Change', icon: <Activity className="w-3 h-3 text-[#8B5CF6]" /> },
  flag_resolved: { label: 'Flag Resolved', icon: <CheckCircle2 className="w-3 h-3 text-[#2BB673]" /> },
  flag_created: { label: 'Flag Created', icon: <AlertCircle className="w-3 h-3 text-[#EF4444]" /> },
  manual_rescore: { label: 'Portfolio Rescore', icon: <Sparkles className="w-3 h-3 text-[#C57D25]" /> },
};

function formatDate(isoOrString: string): string {
  try {
    const d = new Date(isoOrString);
    if (isNaN(d.getTime())) return isoOrString;
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoOrString;
  }
}

export const PortfolioStoryTimeline: React.FC<PortfolioStoryTimelineProps> = ({
  events,
  mode = 'condensed',
  onViewFullHistory
}) => {
  const { preferredLanguage } = useApp();

  // Sort events descending (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const displayedEvents = mode === 'condensed' ? sortedEvents.slice(0, 3) : sortedEvents;

  // Placeholder state when < 2 recorded events
  if (sortedEvents.length < 2) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs text-center">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-4">
          <History className="w-4 h-4" />
          <span>Portfolio Story</span>
        </div>

        <div className="py-6 px-4 bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#C57D25] shadow-xs mb-3 border border-[#F7E5C8]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-base text-[#14213D] mb-1">Your story starts here</h4>
          <p className="text-xs text-[#8B93A7] max-w-sm leading-relaxed">
            As you upload new CAS statements or your portfolio evolves, VestIQ will automatically document changes to your Health Score with plain-language explanations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EDE9DF]">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-[#C57D25]" />
          <h3 className="font-extrabold text-base text-[#14213D]">Portfolio Story & Score Timeline</h3>
          <span className="text-[10px] bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] px-2 py-0.5 rounded-full font-bold">
            {events.length} Events
          </span>
        </div>

        {mode === 'condensed' && onViewFullHistory && (
          <button
            onClick={onViewFullHistory}
            className="text-xs text-[#C57D25] hover:text-[#B06C19] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>View full history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E4D9]">
        {displayedEvents.map((evt, idx) => {
          const isImprovement = evt.delta > 0;
          const isDecrease = evt.delta < 0;
          const triggerConfig = TRIGGER_TYPE_CONFIG[evt.triggerType] || TRIGGER_TYPE_CONFIG.manual_rescore;

          const pillBg = isImprovement ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]' : isDecrease ? 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]' : 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]';
          const displayFactor = translateExplanation(evt.reasonObject.factor, preferredLanguage);
          const displayReason = translateExplanation(evt.reasonObject.reason, preferredLanguage);

          return (
            <div key={evt.id || idx} className="relative group">

              {/* Node Dot on vertical line */}
              <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110 ${
                isImprovement ? 'border-[#2BB673] text-[#2BB673]' : isDecrease ? 'border-[#EF4444] text-[#EF4444]' : 'border-[#C57D25] text-[#C57D25]'
              }`}>
                {isImprovement ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isDecrease ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Activity className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Event Card */}
              <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EDE9DF] transition-all hover:border-[#D4C7B5] shadow-xs">
                
                {/* Top Row: Date, Trigger Badge, Score Change */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[#8B93A7] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(evt.timestamp)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14213D] bg-white px-2 py-0.5 rounded-full border border-[#EDE9DF]">
                      {triggerConfig.icon}
                      <span>{triggerConfig.label}</span>
                    </span>
                  </div>

                  {/* Score Change Pill (e.g., "72 → 64, -8 pts") */}
                  <div className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${pillBg}`}>
                    <span>{evt.previousScore} → {evt.newScore}</span>
                    <span>({evt.delta > 0 ? `+${evt.delta}` : evt.delta} pts)</span>
                  </div>
                </div>

                {/* Structured Factor Badge & Plain-Language Reason */}
                <div className="mt-2 bg-white rounded-xl p-3 border border-[#EDE9DF]">
                  <div className={`text-[10px] uppercase tracking-wider font-extrabold text-[#C57D25] mb-1 ${getLanguageFontClass(preferredLanguage)}`}>
                    Factor: {displayFactor}
                  </div>
                  <p className={`text-xs font-medium text-[#14213D] leading-relaxed ${getLanguageFontClass(preferredLanguage)}`}>
                    "{displayReason}"
                  </p>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link if condensed */}
      {mode === 'condensed' && onViewFullHistory && (
        <div className="mt-6 pt-4 border-t border-[#EDE9DF] text-center">
          <button
            onClick={onViewFullHistory}
            className="text-xs font-bold text-[#C57D25] hover:text-[#B06C19] transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View complete portfolio story history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
