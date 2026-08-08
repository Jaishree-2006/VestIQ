import React from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { Upload, Cpu, PieChart, ShieldAlert, Sliders, Users, History, ArrowRight, FileText } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { setCurrentPage, handleCasUpload } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-5xl mx-auto px-4 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
            Process Flow & Architecture
          </span>
          <h1 className="text-4xl font-extrabold text-[#14213D] mt-3">
            How VestIQ Transforms Opaque Statements into Causal Intelligence
          </h1>
          <p className="text-base text-[#6B7280] mt-3">
            A 4-step pipeline that extracts unstructured PDF records into plain-English reasoning.
          </p>
        </div>

        {/* Step 1 */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center font-extrabold text-xl shrink-0 border border-[#F7E5C8]">
              1
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#14213D]">CAS Upload / Sample Data Parser</h3>
              <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                Drag and drop your NSDL or CDSL Consolidated Account Statement (CAS) PDF. We use local client-side extraction so your financial credentials never leave your browser unencrypted.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleCasUpload('sample.pdf');
              setCurrentPage('dashboard');
            }}
            className="px-5 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-xs transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Upload Sample CAS PDF
          </button>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center font-extrabold text-xl shrink-0 border border-[#F7E5C8]">
              2
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#14213D]">Multi-Asset Structured Portfolio Parser</h3>
              <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                Extracts ISINs, folio numbers, purchase NAVs, lock-in terms, and dividend yield schedules across equities, corporate bonds, sovereign G-Secs, REITs, and InvITs.
              </p>
            </div>
          </div>
          <Cpu className="w-10 h-10 text-[#C57D25] shrink-0 opacity-80" />
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center font-extrabold text-xl shrink-0 border border-[#F7E5C8]">
              3
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#14213D]">Unified Portfolio Engine</h3>
              <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                Aggregates your holdings from Zerodha, Groww, ICICI Direct, and RBI Retail Direct into a single holistic health dashboard.
              </p>
            </div>
          </div>
          <PieChart className="w-10 h-10 text-[#C57D25] shrink-0 opacity-80" />
        </div>

        {/* Step 4: 4 Parallel Modules Diagram */}
        <div className="bg-[#FAF8F5] rounded-3xl p-8 border-2 border-[#C57D25] shadow-vestiq">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25]">Step 4: Behavioral & Intelligence Engine Matrix</span>
            <h3 className="text-2xl font-extrabold text-[#14213D] mt-1">4 Parallel Analytics Engines</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => setCurrentPage('red-flags')}
              className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#EF4444] cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2 text-[#EF4444] font-bold text-sm mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Suitability & Mis-selling Check</span>
              </div>
              <p className="text-sm text-[#6B7280]">Triggers real-time Red Flag Alerts on lock-in mismatches and unrated bond traps.</p>
            </div>

            <div 
              onClick={() => setCurrentPage('shock-sandbox')}
              className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#2BB673] cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2 text-[#2BB673] font-bold text-sm mb-1">
                <Sliders className="w-4 h-4" />
                <span>Behavioral Twin (Shock Sandbox)</span>
              </div>
              <p className="text-sm text-[#6B7280]">Interactive rate hikes and market crash simulations on user's actual portfolio.</p>
            </div>

            <div 
              onClick={() => setCurrentPage('peer-benchmark')}
              className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#C57D25] cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2 text-[#C57D25] font-bold text-sm mb-1">
                <Users className="w-4 h-4" />
                <span>Peer Benchmarking Module</span>
              </div>
              <p className="text-sm text-[#6B7280]">Anonymized cohort comparison across age, income, and asset allocation.</p>
            </div>

            <div 
              onClick={() => setCurrentPage('retrospective')}
              className="bg-white p-5 rounded-2xl border border-[#EDE9DF] hover:border-[#14213D] cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2 text-[#14213D] font-bold text-sm mb-1">
                <History className="w-4 h-4" />
                <span>Retrospective Simulator</span>
              </div>
              <p className="text-sm text-[#6B7280]">"What if" timeline view analyzing past 24 months behavioral adjustments.</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};
