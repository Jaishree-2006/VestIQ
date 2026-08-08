import React from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { Check, X, Sparkles } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { setCurrentPage, startFreeTrial, userRecord } = useApp();
  const alreadyOnTrial = userRecord.plan === 'premium_trial';
  const alreadyPremium = userRecord.plan === 'premium';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
            Transparent Pricing
          </span>
          <h1 className="text-4xl font-extrabold text-[#14213D] mt-3">
            Simple Plans for Retail & Enterprise
          </h1>
          <p className="text-base text-[#6B7280] mt-3">
            Start free with your CAS statement or deploy whitelisted compliance across your brokerage.
          </p>
        </div>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Card 1: Free */}
          <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-2">Retail Investor</div>
              <h3 className="text-2xl font-extrabold text-[#14213D]">Free DIY</h3>
              <div className="text-3xl font-mono-num font-extrabold text-[#14213D] my-4">₹0 <span className="text-xs font-normal text-[#8B93A7]">/ forever</span></div>
              <p className="text-sm text-[#6B7280] mb-6">Essential explainability for individual retail investors uploading CAS statements.</p>
              
              <ul className="space-y-3 text-sm text-[#475569] mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>NSDL/CDSL CAS Parsing</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Unified Portfolio Engine</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Basic Explainability Causal Chains</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Red Flag Mis-selling Detector</span></li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full py-3.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Card 2: Premium DIY (Highlighted) — trial-aware */}
          <div className="bg-white rounded-3xl p-8 border-2 border-[#C57D25] shadow-vestiq-lg flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C57D25] text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-2">Active Investor</div>
              <h3 className="text-2xl font-extrabold text-[#14213D]">Premium DIY</h3>
              <div className="text-3xl font-mono-num font-extrabold text-[#14213D] my-4">₹299 <span className="text-xs font-normal text-[#8B93A7]">/ month</span></div>
              <p className="text-sm text-[#6B7280] mb-6">Advanced stress-testing, behavioral tracking, and retrospective simulator.</p>
              
              <ul className="space-y-3 text-sm text-[#475569] mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Everything in Free Plan</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Shock Sandbox (Behavioral Twin)</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Retrospective Timeline Simulator</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Peer Cohort Benchmarking</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Cross-broker Cashflow Optimizer</span></li>
              </ul>
            </div>

            {/* Status-aware CTA */}
            {alreadyPremium ? (
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="w-full py-3.5 bg-[#2BB673] text-white font-bold rounded-xl text-sm cursor-pointer"
              >
                ✓ Already on Premium — Go to Dashboard
              </button>
            ) : alreadyOnTrial ? (
              <div className="space-y-2">
                <div className="w-full py-3 bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Trial Active — 14 days from activation
                </div>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="w-full py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={startFreeTrial}
                className="w-full py-3.5 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Start 14-Day Free Trial — No payment needed
              </button>
            )}
          </div>

          {/* Card 3: Enterprise Broker */}
          <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-2">Broker & Depository</div>
              <h3 className="text-2xl font-extrabold text-[#14213D]">Broker Enterprise</h3>
              <div className="text-3xl font-extrabold text-[#14213D] my-4">Custom <span className="text-xs font-normal text-[#8B93A7]">/ SLA based</span></div>
              <p className="text-sm text-[#6B7280] mb-6">Whitelisted compliance layer for brokerages, RMs, and compliance officers.</p>
              
              <ul className="space-y-3 text-sm text-[#475569] mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Relationship Manager (RM) Console</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Compliance SEBI Audit Dashboard</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>API & Domain Whitelisting</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>Dedicated Account SLA</span></li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentPage('for-brokers')}
              className="w-full py-3.5 bg-[#14213D] hover:bg-[#1E293B] text-white font-bold rounded-xl text-sm transition-all shadow-xs cursor-pointer"
            >
              Talk to Sales
            </button>
          </div>

        </div>
      </section>
    </div>
  );
};
