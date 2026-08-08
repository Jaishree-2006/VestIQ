import React from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { PieChart, Lightbulb, ShieldAlert, Sliders, Users, History, CheckCircle2 } from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  const engines = [
    {
      id: 'explainability',
      title: 'Explainability Engine (Core Differentiator)',
      icon: <Lightbulb className="w-6 h-6 text-[#C57D25]" />,
      desc: 'Replaces opaque numeric risk scores with connected causal statements that map macro events directly to portfolio valuation.',
      example: '40% in Mindspace REIT → Rate-sensitive asset class → -15% value per +1% repo rate hike.',
      action: 'Try Explainability Center',
      page: 'explainability' as const
    },
    {
      id: 'unified',
      title: 'Unified Portfolio Engine',
      icon: <PieChart className="w-6 h-6 text-[#C57D25]" />,
      desc: 'Aggregates fragmented depository statements across Zerodha, Groww, ICICI Direct, and RBI Retail Direct into a single light-theme view.',
      example: 'Parsed ₹18,42,600 across 5 instruments in 60 seconds.',
      action: 'View Dashboard',
      page: 'dashboard' as const
    },
    {
      id: 'redflags',
      title: 'Mis-Selling Red Flag Detector',
      icon: <ShieldAlert className="w-6 h-6 text-[#EF4444]" />,
      desc: 'Automated compliance scan that catches lock-in horizon mismatches, unrated high-yield bond traps, and hidden fee structures.',
      example: 'Flagged 3-year lock-in Grid InvIT when user stated liquidity horizon was 18 months.',
      action: 'Inspect Red Flags',
      page: 'red-flags' as const
    },
    {
      id: 'sandbox',
      title: 'Behavioral Twin / Shock Sandbox',
      icon: <Sliders className="w-6 h-6 text-[#2BB673]" />,
      desc: 'Interactive stress-test environment simulating central bank rate hikes (+0.5% to +3%) and equity crashes against real holdings.',
      example: 'Simulates exact rupee loss impact before making investment decisions.',
      action: 'Open Shock Sandbox',
      page: 'shock-sandbox' as const
    },
    {
      id: 'peer',
      title: 'Peer Benchmarking Engine',
      icon: <Users className="w-6 h-6 text-[#C57D25]" />,
      desc: 'Anonymized cohort comparison comparing asset class weights against top-quartile retail investors in similar age & income bands.',
      example: 'Investors like you hold 12% in REITs, whereas you hold 38.7%.',
      action: 'View Peer Benchmarks',
      page: 'peer-benchmark' as const
    },
    {
      id: 'retro',
      title: 'Retrospective Simulator',
      icon: <History className="w-6 h-6 text-[#14213D]" />,
      desc: 'Historical "What If" timeline tool that demonstrates how behavioral adjustments over the past 24 months preserved capital.',
      example: 'Rebalancing 15% out of REIT in 2024 would have increased net returns by +₹2,42,400.',
      action: 'Run Retrospective',
      page: 'retrospective' as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
            Engine Deep Dive
          </span>
          <h1 className="text-4xl font-extrabold text-[#14213D] mt-3">
            The 6 Core Analytics Engines Driving VestIQ
          </h1>
          <p className="text-base text-[#6B7280] mt-3">
            Designed specifically to eliminate investor confusion and empower retail portfolios with plain-English clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {engines.map((engine) => (
            <div 
              key={engine.id}
              className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] flex items-center justify-center mb-4 border border-[#F7E5C8]">
                  {engine.icon}
                </div>
                <h3 className="text-xl font-extrabold text-[#14213D] mb-2">{engine.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{engine.desc}</p>
                
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF] mb-6">
                  <div className="text-[11px] text-[#8B93A7] font-bold uppercase tracking-wider mb-1">Explainability Example</div>
                  <div className="text-xs font-semibold text-[#63451B]">{engine.example}</div>
                </div>
              </div>

              <button
                onClick={() => setCurrentPage(engine.page)}
                className="w-full py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer text-center"
              >
                {engine.action}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
