import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { Navbar } from '../layout/Navbar';
import { 
  Lightbulb, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';

export const ExplainabilityCenterPage: React.FC = () => {
  const { holdings, explainMode, setExplainMode, role } = useApp();
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('h1');

  const selectedHolding = holdings.find(h => h.id === selectedHoldingId) || holdings[0];

  const isStandalone = role === 'investor_free' || role === 'investor_premium';

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Lightbulb className="w-4 h-4" />
              <span>VestIQ Explainability Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              Explainability Center
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Every portfolio score, yield metric, and risk tag translated into a plain-English causal chain.
            </p>
          </div>

          {/* Mode Toggle: "Explain like I'm new" vs "Technical basis" */}
          <div className="bg-[#F6F4ED] p-1 rounded-xl border border-[#EDE9DF] flex items-center shrink-0">
            <button
              onClick={() => setExplainMode('simple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                explainMode === 'simple'
                  ? 'bg-white text-[#C57D25] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#14213D]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C57D25]" />
              <span>Explain like I'm new</span>
            </button>

            <button
              onClick={() => setExplainMode('technical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                explainMode === 'technical'
                  ? 'bg-white text-[#14213D] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#14213D]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Show technical basis</span>
            </button>
          </div>
        </div>

        {/* Instrument Selector */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-[#8B93A7] uppercase tracking-wider mb-2">
            Select Holding to Inspect Causal Chain:
          </label>
          <div className="flex flex-wrap gap-2">
            {holdings.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHoldingId(h.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedHoldingId === h.id
                    ? 'bg-[#FFF8EE] text-[#C57D25] border-[#C57D25] shadow-xs'
                    : 'bg-white text-[#6B7280] border-[#EDE9DF] hover:bg-[#FAF8F5]'
                }`}
              >
                {h.name} ({h.portfolioWeight}%)
              </button>
            ))}
          </div>
        </div>

        {/* Core Causal Chain Visualizer */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E6DCCB] shadow-vestiq-lg mb-10">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F1EFE9]">
            <div>
              <div className="text-xs text-[#8B93A7] font-semibold uppercase tracking-wider">Causal Analysis for</div>
              <h2 className="text-xl font-extrabold text-[#14213D] mt-0.5">{selectedHolding.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#8B93A7] font-mono">Weight in Portfolio</span>
              <div className="text-lg font-extrabold font-mono-num text-[#C57D25]">{selectedHolding.portfolioWeight}%</div>
            </div>
          </div>

          {/* Connected Causal Chain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1: Cause */}
            <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5 relative">
              <div className="w-7 h-7 rounded-full bg-[#C57D25] text-white text-xs font-extrabold flex items-center justify-center mb-3">
                1
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                Root Cause
              </div>
              <h3 className="font-bold text-base text-[#14213D] mb-2">
                {selectedHolding.causalChain.cause}
              </h3>
              <p className="text-sm text-[#63451B] leading-relaxed">
                {explainMode === 'simple'
                  ? `You hold ₹${selectedHolding.currentValue.toLocaleString('en-IN')} in this single instrument via ${selectedHolding.broker}.`
                  : `Concentration metric calculated via Herfindahl-Hirschman Index (HHI) exceeding threshold limit.`
                }
              </p>
            </div>

            {/* Step 2: Mechanism */}
            <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5 relative">
              <div className="w-7 h-7 rounded-full bg-[#C57D25] text-white text-xs font-extrabold flex items-center justify-center mb-3">
                2
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                Transmission Mechanism
              </div>
              <h3 className="font-bold text-base text-[#14213D] mb-2">
                {selectedHolding.causalChain.mechanism}
              </h3>
              <p className="text-sm text-[#63451B] leading-relaxed">
                {explainMode === 'simple'
                  ? `When repo interest rates rise, institutional investors demand higher yields from real estate trusts, driving prices down.`
                  : `Yield spread sensitivity duration coefficient calculated at 3.42 relative to RBI 10Y Benchmark G-Sec.`
                }
              </p>
            </div>

            {/* Step 3: Impact */}
            <div className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-5 relative">
              <div className="w-7 h-7 rounded-full bg-[#EF4444] text-white text-xs font-extrabold flex items-center justify-center mb-3">
                3
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#EF4444] mb-1">
                Projected Impact
              </div>
              <h3 className="font-bold text-base text-[#991B1B] mb-2">
                {selectedHolding.causalChain.impact}
              </h3>
              <p className="text-sm text-[#7F1D1D] leading-relaxed">
                {explainMode === 'simple'
                  ? `If central bank rates increase by 100 bps, your portfolio mark-to-market value could temporarily drop by ~₹1,10,000.`
                  : `VaR (Value at Risk) 95% confidence stress interval models a max drawdown of 14.8%.`
                }
              </p>
            </div>

          </div>

          {/* Explainability Mode Indicator Banner */}
          <div className="mt-8 pt-6 border-t border-[#F1EFE9] flex items-center justify-between text-sm text-[#6B7280]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#C57D25]" />
              <span>Current mode: <strong className="text-[#14213D]">{explainMode === 'simple' ? 'Plain-English Retail Narrative' : 'SEBI Institutional Risk Metric'}</strong></span>
            </div>
            <div className="font-semibold text-[#C57D25]">
              Suitability Score: {selectedHolding.suitabilityScore}/100
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
