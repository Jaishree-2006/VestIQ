import React from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { 
  Upload, 
  ArrowRight, 
  ShieldAlert, 
  Sliders, 
  PieChart, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  FileText, 
  Lock, 
  Building2,
  ChevronRight,
  Zap,
  Sparkles
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0B1220] flex flex-col font-sans selection:bg-[#FCEEBB]">
      <Navbar />

      {/* Hero Section with Exact Pastel Circle Backgrounds matching Image 1 */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        
        {/* Soft Overlapping Pastel Circles Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[420px] pointer-events-none z-0">
          {/* Gold Circle (left-center) */}
          <div className="absolute top-0 left-12 w-[380px] h-[380px] rounded-full bg-[#FCEEBB]/70 blur-2xl transform -translate-x-1/4" />
          {/* Mint Green Circle (right-center) */}
          <div className="absolute top-4 right-12 w-[420px] h-[420px] rounded-full bg-[#D8F3E5]/70 blur-2xl transform translate-x-1/4" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          
          {/* Eyebrow label matching Image 1 */}
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold tracking-wide text-[#C57D25] uppercase">
              multi-asset portfolio intelligence
            </span>
          </div>

          {/* Main Headline matching Image 1 */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0B1220] max-w-3xl mx-auto leading-[1.15] mb-6">
            Your money, explained — not just tracked
          </h1>

          {/* Subheadline matching Image 1 */}
          <p className="text-lg sm:text-xl text-[#64748B] max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Equities, bonds, REITs and InvITs, unified into one dashboard with plain-English reasoning behind every number.
          </p>

          {/* Hero CTAs matching Image 1 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold bg-[#C57D25] text-white hover:bg-[#B06C19] transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center space-x-2 text-base"
            >
              <span>Upload your CAS</span>
            </button>
            
            <button
              onClick={() => setCurrentPage('for-brokers')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold bg-white text-[#0B1220] border border-[#E2D8CC] hover:bg-[#F7F5EE] transition-all cursor-pointer text-base"
            >
              <span>For brokers</span>
            </button>
          </div>

          {/* Hero Callout Floating Box matching Image 1 EXACTLY */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-[#EBE6DB] shadow-vestiq text-left relative backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-[#8B93A7] font-semibold mb-2">
              portfolio health score
            </div>
            
            <div className="flex items-baseline space-x-3 mb-3">
              <span className="text-4xl font-extrabold font-mono-num text-[#0B1220]">
                72 / 100
              </span>
              <span className="text-sm font-semibold text-[#EF4444] bg-[#FDF2F2] px-2.5 py-0.5 rounded-full border border-[#FCA5A5]">
                1 flag
              </span>
            </div>

            <p className="text-sm text-[#475569] leading-relaxed">
              Score dropped because <strong className="text-[#0B1220] font-semibold">40% of your portfolio sits in one REIT</strong>, which historically falls 15% when rates rise 1%.
            </p>
          </div>

        </div>
      </section>

      {/* 3 Quick Cards Row matching Image 1 bottom cards */}
      <section className="py-8 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Unified Portfolio */}
          <div 
            onClick={() => setCurrentPage('dashboard')}
            className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#C57D25] flex items-center justify-center text-white shrink-0">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1220] text-base">Unified portfolio</h3>
              <p className="text-xs text-[#8B93A7] mt-0.5">All brokers, one view</p>
            </div>
          </div>

          {/* Card 2: Red Flag Detector */}
          <div 
            onClick={() => setCurrentPage('red-flags')}
            className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#EF4444] flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1220] text-base">Red flag detector</h3>
              <p className="text-xs text-[#8B93A7] mt-0.5">Catches mis-selling</p>
            </div>
          </div>

          {/* Card 3: Shock Sandbox */}
          <div 
            onClick={() => setCurrentPage('shock-sandbox')}
            className="bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#2BB673] flex items-center justify-center text-white shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1220] text-base">Shock sandbox</h3>
              <p className="text-xs text-[#8B93A7] mt-0.5">Stress-test your holdings</p>
            </div>
          </div>

        </div>
      </section>

      {/* Problem Section: 3 Pain Points */}
      <section className="py-20 bg-white border-y border-[#EDE9DF]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-[#0B1220] mb-4">
              Why traditional wealth apps fail retail investors
            </h2>
            <p className="text-base text-[#64748B]">
              Tracking prices isn't understanding risk. VestIQ solves the 3 fundamental friction points in Indian retail finance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EDE9DF]">
              <div className="w-10 h-10 rounded-lg bg-[#FDF2F2] text-[#EF4444] flex items-center justify-center mb-4">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1220] mb-2">Scattered Portfolios</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Your holdings are fragmented across Zerodha, Groww, ICICI Direct, and RBI Retail Direct. You lack a unified view of real exposure.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EDE9DF]">
              <div className="w-10 h-10 rounded-lg bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1220] mb-2">Opaque Instruments</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                REITs, InvITs, and structured corporate bonds are sold without plain-English disclosure of lock-in terms or interest rate vulnerability.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EDE9DF]">
              <div className="w-10 h-10 rounded-lg bg-[#E6F4EA] text-[#2BB673] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1220] mb-2">Abstract Risk Scores</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                A bare risk score of "6.5/10" gives zero actionable insight into why your portfolio drops when macro rates move.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side Explainability Showcase */}
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
              The VestIQ Differentiator
            </span>
            <h2 className="text-3xl font-extrabold text-[#0B1220] mt-3">
              Generic Score vs. Plain-English Causal Reasoning
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Generic Broker App (Crossed out) */}
            <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-xs relative opacity-75">
              <div className="text-xs font-bold uppercase tracking-wider text-[#EF4444] mb-4 flex items-center justify-between">
                <span>Traditional Broker App</span>
                <span className="line-through text-xs text-[#8B93A7]">Opaque</span>
              </div>
              <div className="bg-[#F8F6F0] p-4 rounded-xl mb-4">
                <div className="text-xs text-[#8B93A7]">Portfolio Risk Score</div>
                <div className="text-3xl font-bold text-[#0B1220] mt-1">6.8 / 10</div>
                <div className="text-xs text-[#EF4444] mt-1">Moderate-High Volatility</div>
              </div>
              <p className="text-xs text-[#64748B]">
                ❌ Gives no reason for the score. User has no idea which instrument will drop or how interest rate hikes will impact cash flow.
              </p>
            </div>

            {/* VestIQ Explainability Engine */}
            <div className="bg-white p-6 rounded-2xl border-2 border-[#C57D25] shadow-vestiq relative">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-4 flex items-center justify-between">
                <span>VestIQ Causal Chain</span>
                <span className="bg-[#E6F4EA] text-[#2BB673] px-2 py-0.5 rounded text-[11px] font-semibold">Explainable</span>
              </div>
              
              <div className="flex flex-col gap-2 mb-4">
                <div className="bg-[#FFF8EE] border border-[#F7E5C8] p-2.5 rounded-lg text-xs font-semibold text-[#63451B]">
                  1. Cause: 40% of portfolio concentrated in Mindspace REIT
                </div>
                <div className="bg-[#FFF8EE] border border-[#F7E5C8] p-2.5 rounded-lg text-xs font-semibold text-[#63451B]">
                  2. Mechanism: REIT dividend yields compete directly with RBI repo rate bonds
                </div>
                <div className="bg-[#FDF2F2] border border-[#FCA5A5] p-2.5 rounded-lg text-xs font-bold text-[#EF4444]">
                  3. Impact: -15% estimated value drop per +1.0% interest rate hike
                </div>
              </div>

              <p className="text-xs text-[#0B1220] font-medium">
                ✅ Transparent causal reasoning allows investors to act with confidence.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Trust & Regulatory Strip */}
      <section className="py-12 bg-white border-t border-[#EDE9DF]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-6">
            Aligned with SEBI & Investor Education Protection Fund (IEPF) Mandates
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-80 text-sm font-semibold text-[#475569]">
            <div className="flex items-center space-x-2 bg-[#FAF8F5] px-4 py-2 rounded-xl border border-[#EDE9DF]">
              <ShieldAlert className="w-4 h-4 text-[#C57D25]" />
              <span>SEBI Suitability Guidelines</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#FAF8F5] px-4 py-2 rounded-xl border border-[#EDE9DF]">
              <Lock className="w-4 h-4 text-[#2BB673]" />
              <span>AES-256 CAS Data Encryption</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#FAF8F5] px-4 py-2 rounded-xl border border-[#EDE9DF]">
              <Building2 className="w-4 h-4 text-[#C57D25]" />
              <span>Depository Whitelisting Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <footer className="bg-[#0B1220] text-white py-16 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Take control of your real multi-asset portfolio today
          </h2>
          <p className="text-[#94A3B8] max-w-xl mx-auto mb-8 text-sm">
            Upload your NSDL / CDSL Consolidated Account Statement (CAS) to generate your explainable health score in under 60 seconds.
          </p>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="px-8 py-3.5 rounded-xl font-bold bg-[#C57D25] text-white hover:bg-[#B06C19] transition-all shadow-lg cursor-pointer"
          >
            Upload your CAS — Free
          </button>
          
          <div className="mt-12 pt-8 border-t border-[#1E293B] text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>© 2026 VestIQ Intelligence Inc. Built for SEBI-aligned investor protection.</div>
            <div className="flex space-x-6">
              <span className="hover:text-white cursor-pointer" onClick={() => setCurrentPage('privacy' as any)}>Privacy Policy</span>
              <span className="hover:text-white cursor-pointer" onClick={() => setCurrentPage('terms' as any)}>Terms of Service</span>
              <span className="hover:text-white cursor-pointer" onClick={() => setCurrentPage('for-brokers')}>Broker Licensing</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
