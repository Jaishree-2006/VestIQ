import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Sliders, 
  Sparkles, 
  Check, 
  X,
  Info,
  Layers
} from 'lucide-react';

export const PortfolioGuardianFeed: React.FC = () => {
  const { 
    guardianAlerts, 
    unreadGuardianCount, 
    isGuardianScanning, 
    triggerGuardianScan, 
    markAlertRead, 
    dismissAlert,
    navigateTo 
  } = useApp();

  const [scanResultToast, setScanResultToast] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState<boolean>(false);

  const handleScanClick = async () => {
    const res = await triggerGuardianScan();
    const msg = `Scan complete: ${res.alerts.length} relevant market event${res.alerts.length === 1 ? '' : 's'} matched, ${res.filteredOutCount} irrelevant story filtered out.`;
    setScanResultToast(msg);
    setTimeout(() => setScanResultToast(null), 5000);
  };

  const activeAlerts = guardianAlerts.filter(a => showDismissed || a.status !== 'dismissed');

  return (
    <div className="bg-white rounded-3xl border border-[#EDE9DF] p-6 shadow-xs">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F1EFE9]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
            <ShieldCheck className="w-4 h-4 text-[#C57D25]" />
            <span>Proactive Event Guardian</span>
            {unreadGuardianCount > 0 && (
              <span className="bg-[#EF4444] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                {unreadGuardianCount} UNREAD
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-[#14213D]">Portfolio Guardian Feed</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Continuously monitors market news & macro shifts against your specific holdings — flagging actionable events automatically.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleScanClick}
            disabled={isGuardianScanning}
            className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGuardianScanning ? 'animate-spin' : ''}`} />
            <span>{isGuardianScanning ? 'Scanning News Feed...' : 'Scan Market Events Now'}</span>
          </button>

          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className="text-xs text-[#8B93A7] hover:text-[#14213D] font-semibold cursor-pointer underline"
          >
            {showDismissed ? 'Hide Dismissed' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Human-in-the-loop Principle Copy Banner */}
      <div className="mt-4 bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#63451B]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#C57D25] shrink-0" />
          <span>
            <strong>VestIQ Guardian flags relevant events — you decide what to do next.</strong> Zero auto-trading or auto-rebalancing.
          </span>
        </div>
        <span className="hidden sm:inline text-[10px] font-mono text-[#C57D25] bg-white border border-[#F7E5C8] px-2 py-0.5 rounded-md font-bold">
          Human-in-the-Loop Safe
        </span>
      </div>

      {/* Scan result toast message */}
      {scanResultToast && (
        <div className="mt-3 bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl p-3 text-xs font-bold text-[#15803D] flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#2BB673]" />
            <span>{scanResultToast}</span>
          </div>
          <button onClick={() => setScanResultToast(null)} className="text-[#15803D] hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alerts list */}
      <div className="mt-6 space-y-5">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8B93A7] bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
            <CheckCircle2 className="w-8 h-8 text-[#2BB673] mx-auto mb-2 opacity-60" />
            <div className="font-bold text-[#14213D] text-sm">Upload your portfolio to start receiving personalized alerts</div>
            <p className="mt-0.5">No alert cards will be shown until a real portfolio is uploaded.</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const isUnread = alert.status === 'unread';
            const isDismissed = alert.status === 'dismissed';

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border transition-all p-5 relative overflow-hidden ${
                  isDismissed
                    ? 'opacity-50 bg-[#FAF8F5] border-[#EDE9DF]'
                    : isUnread
                    ? 'bg-[#FFFFFF] border-2 border-[#C57D25] shadow-xs'
                    : 'bg-[#FFFFFF] border border-[#EDE9DF]'
                }`}
              >
                {/* Severity indicator accent bar */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    alert.severity === 'high' ? 'bg-[#EF4444]' : alert.severity === 'medium' ? 'bg-[#C57D25]' : 'bg-[#2BB673]'
                  }`}
                />

                {/* Top header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'high'
                          ? 'bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]'
                          : alert.severity === 'medium'
                          ? 'bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]'
                          : 'bg-[#E6F4EA] text-[#2BB673] border border-[#A7F3D0]'
                      }`}>
                        {alert.severity} Priority Alert
                      </span>

                      {isUnread && (
                        <span className="bg-[#C57D25] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}

                      <span className="text-xs text-[#8B93A7]">{alert.newsSource}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#14213D] leading-snug">
                      {alert.newsHeadline}
                    </h3>
                  </div>

                  {/* Impact pill */}
                  <div className="shrink-0 bg-[#FAF8F5] border border-[#EDE9DF] rounded-xl px-3 py-1.5 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A7]">Score Delta</div>
                    <div className="text-base font-extrabold font-mono-num text-[#EF4444]">
                      {alert.estimatedImpactScore} pts
                    </div>
                  </div>
                </div>

                {/* Affected Holdings Tags */}
                <div className="mb-4 flex items-center space-x-2 flex-wrap gap-y-1 text-xs">
                  <span className="font-bold text-[#14213D] flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-[#C57D25]" />
                    <span>Affected Portfolio Holdings:</span>
                  </span>
                  {alert.relevantHoldings.map(h => (
                    <span key={h.id} className="bg-[#FAF8F5] border border-[#EDE9DF] text-[#14213D] font-bold text-[11px] px-2.5 py-0.5 rounded-lg">
                      {h.name} ({h.ticker})
                    </span>
                  ))}
                </div>

                {/* 3-Step Causal Chain Card Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
                  
                  {/* Step 1: Root Cause */}
                  <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-xl p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#C57D25] mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-[#C57D25] text-white flex items-center justify-center text-[9px]">1</span>
                      <span>Market Event</span>
                    </div>
                    <p className="text-xs text-[#63451B] leading-relaxed">
                      {alert.reasoningChain.cause}
                    </p>
                  </div>

                  {/* Step 2: Transmission Mechanism */}
                  <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-xl p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#C57D25] mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-[#C57D25] text-white flex items-center justify-center text-[9px]">2</span>
                      <span>Portfolio Transmission</span>
                    </div>
                    <p className="text-xs text-[#63451B] leading-relaxed">
                      {alert.reasoningChain.mechanism}
                    </p>
                  </div>

                  {/* Step 3: Projected Impact */}
                  <div className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-xl p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#EF4444] mb-1 flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[9px]">3</span>
                      <span>Directional Impact</span>
                    </div>
                    <p className="text-xs text-[#7F1D1D] leading-relaxed font-medium">
                      {alert.reasoningChain.impact}
                    </p>
                  </div>

                </div>

                {/* Card Action Row */}
                <div className="pt-3 border-t border-[#F1EFE9] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[#8B93A7] text-[11px] font-mono">
                    Impact estimate: <span className="font-bold text-[#14213D]">{alert.estimatedImpactValue}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isUnread && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 text-[#2BB673]" />
                        <span>Mark Read</span>
                      </button>
                    )}

                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#6B7280] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isDismissed ? 'Dismissed' : 'Dismiss'}</span>
                    </button>

                    <button
                      onClick={() => navigateTo('shock-sandbox')}
                      className="px-3.5 py-1.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Stress Test in Sandbox</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
