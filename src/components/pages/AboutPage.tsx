import React from 'react';
import { Navbar } from '../layout/Navbar';
import { ShieldCheck, Lock, Award, Cpu, FileText, CheckCircle2, Server, Key, EyeOff } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-5xl mx-auto px-4 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
            Trust & Security Architecture
          </span>
          <h1 className="text-4xl font-extrabold text-[#14213D] mt-3">
            Built for SEBI Alignment & DPDP Act 2023 Compliance
          </h1>
          <p className="text-base text-[#6B7280] mt-3">
            VestIQ combines explainable portfolio intelligence with bank-grade security architecture, zero raw PII retention, and tamper-evident auditability.
          </p>
        </div>

        {/* Philosophy Card */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs space-y-8 mb-12">
          <div>
            <h2 className="text-2xl font-extrabold text-[#14213D] mb-3">Our Core Philosophy</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              VestIQ was built on the belief that financial transparency shouldn't require a CFA. Rather than presenting abstract risk numbers that panic users into bad liquidations, we deliver structured, plain-English causal chains across equities, bonds, REITs, and InvITs.
            </p>
          </div>
        </div>

        {/* 4 Security & Compliance Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          {/* Pillar 1: Encryption & PII Protection */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#2BB673] flex items-center justify-center mb-4 border border-[#A7F3D0]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#14213D] mb-2">Encryption & PII Protection</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              TLS 1.3 in-transit and AES-256 at-rest storage for database records and uploaded PDFs. PANs are masked for on-screen display, and full PAN is not exposed in the client UI or general API responses.
            </p>
            <div className="flex items-center space-x-2 text-sm font-bold text-[#2BB673]">
              <CheckCircle2 className="w-4 h-4" />
              <span>TLS 1.3 · AES-256 At-Rest · Masked PAN Display</span>
            </div>
          </div>

          {/* Pillar 2: DPDP Act 2023 & Retention */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mb-4 border border-[#F7E5C8]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#14213D] mb-2">DPDP Act 2023 & Right to Erasure</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              Full alignment with India's Digital Personal Data Protection (DPDP) Act 2023. Explicit, purpose-bound user consent with automatic 30-day raw CAS file purging and 1-click Right to Erasure data purge.
            </p>
            <div className="flex items-center space-x-2 text-sm font-bold text-[#C57D25]">
              <CheckCircle2 className="w-4 h-4" />
              <span>India DPDP Act 2023 Sec 6(1) & Sec 12</span>
            </div>
          </div>

          {/* Pillar 3: Two-Tier Parsing Engine */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#14213D] flex items-center justify-center mb-4 border border-[#EDE9DF]">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#14213D] mb-2">Two-Tier CAS Extraction Engine</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              Rule-based digital table extraction (NSDL, CDSL, CAMS/KFintech templates) for standard PDFs without heavy ML overhead. Automatic fallback to Tesseract/Document AI layout OCR for scanned statements.
            </p>
            <div className="flex items-center space-x-2 text-sm font-bold text-[#14213D]">
              <CheckCircle2 className="w-4 h-4 text-[#2BB673]" />
              <span>Tier 1 Template Rules + Tier 2 OCR Fallback</span>
            </div>
          </div>

          {/* Pillar 4: RBI Account Aggregator (AA) Roadmap */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mb-4 border border-[#F7E5C8]">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#14213D] mb-2">RBI Account Aggregator (AA) Roadmap</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              Production deployment integrates with Sahamati RBI-regulated Account Aggregators. Time-bound, consent-driven API data flows directly between regulated FIP entities, eliminating PDF file uploads entirely.
            </p>
            <div className="flex items-center space-x-2 text-sm font-bold text-[#C57D25]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sahamati RBI AA API Integration</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
