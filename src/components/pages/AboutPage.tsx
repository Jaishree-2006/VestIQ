import React from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { ShieldCheck, Lock, Award, Heart } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0B1220] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-4xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
            Trust & Philosophy
          </span>
          <h1 className="text-4xl font-extrabold text-[#0B1220] mt-3">
            Why Explainability-First Intelligence Matters
          </h1>
          <p className="text-base text-[#64748B] mt-3">
            Over 65% of Indian retail investors holding non-traditional assets (REITs, InvITs, corporate bonds) cannot explain how repo rate changes impact their yield.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs space-y-8 mb-12">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0B1220] mb-3">Our Core Philosophy</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              VestIQ was built on the belief that financial transparency shouldn't require a CFA. Rather than presenting abstract risk numbers that panic users into bad liquidations, we deliver structured, plain-English causal chains.
            </p>
          </div>

          <div className="pt-6 border-t border-[#F1EFE9]">
            <h2 className="text-2xl font-extrabold text-[#0B1220] mb-3">Data Security & CAS Encryption</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Consolidated Account Statements (CAS) are parsed client-side using local WASM engines. Your private PAN credentials and transaction histories are encrypted with AES-256 and never shared with third-party advertising networks.
            </p>
          </div>

          <div className="pt-6 border-t border-[#F1EFE9]">
            <h2 className="text-2xl font-extrabold text-[#0B1220] mb-3">Regulatory Alignment with SEBI & IEPF</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Our Mis-selling Red Flag Detector and Suitability Engine map directly onto SEBI investor-protection advisories, making VestIQ an easy integration for compliance-conscious Indian brokerages.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
