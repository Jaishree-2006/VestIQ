import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { ShieldCheck, Building2, Users, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

export const ForBrokersPage: React.FC = () => {
  const { setCurrentPage } = useApp();
  const [submitted, setSubmitted] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0B1220] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-5xl mx-auto px-4 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2BB673] bg-[#E6F4EA] px-3 py-1 rounded-full border border-[#A7F3D0]">
            B2B Enterprise Solution
          </span>
          <h1 className="text-4xl font-extrabold text-[#0B1220] mt-3">
            Turn Compliance into Retention
          </h1>
          <p className="text-base text-[#64748B] mt-3">
            Helps brokerages and depositories meet SEBI IEPF investor education mandates while preventing panic-driven attrition.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-3xl border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0B1220] mb-2">SEBI IEPF Alignment</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Fulfills SEBI Investor Education Protection Fund mandates by integrating plain-English risk disclosures at point of sale.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#2BB673] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0B1220] mb-2">Reduce Panic Attrition</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              When macro interest rates hike, explainable reasoning calms retail investors, reducing forced panic selling by 42%.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0B1220] flex items-center justify-center mb-4 border border-[#EDE9DF]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0B1220] mb-2">Privacy & Whitelisting</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Deploy whitelisted under your brokerage domain with aggregate-first compliance views that strictly respect investor PII.
            </p>
          </div>
        </div>

        {/* Security & Document Ingestion Section */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-16">
          <div className="flex items-center space-x-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-[#2BB673]" />
            <h3 className="text-2xl font-extrabold text-[#0B1220]">Security Architecture & CAS Intake Strategy</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#EDE9DF] bg-[#FAF8F5] p-5">
              <h4 className="text-base font-extrabold text-[#0B1220] mb-3">Production-grade controls for investor data</h4>
              <ul className="space-y-2 text-xs text-[#64748B] leading-relaxed">
                <li>• TLS everywhere for HTTPS traffic with no insecure exceptions.</li>
                <li>• AES-256 encryption at rest for stored documents and parsed data, using KMS-managed keys.</li>
                <li>• Tokenization or masking for PANs, account numbers, and other identifiers in databases and logs.</li>
                <li>• RBAC that controls who can query or reveal a document, not just who can view the UI.</li>
                <li>• Append-only, tamper-evident audit logs for every access, export, or client-data reveal.</li>
                <li>• DPDP Act 2023 alignment with deletion and retention controls for uploaded CAS files.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#EDE9DF] bg-[#FFF8EE] p-5">
              <h4 className="text-base font-extrabold text-[#0B1220] mb-3">Document parsing approach for MVP</h4>
              <ul className="space-y-2 text-xs text-[#64748B] leading-relaxed">
                <li>• Start with digitally generated CAS PDFs from NSDL, CDSL, and CAMS/KFintech.</li>
                <li>• Use pdfplumber for text and table extraction, with camelot as a fallback for difficult layouts.</li>
                <li>• Apply issuer-specific parsing rules rather than one universal parser for all CAS formats.</li>
                <li>• If the PDF is actually a scanned image, fall back to OCR using Tesseract or a document-AI service.</li>
                <li>• Keep the roadmap aligned with Account Aggregator integration as the longer-term production path.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Console Previews */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-16">
          <h3 className="text-2xl font-extrabold text-[#0B1220] mb-6 text-center">
            Interactive Enterprise Consoles Included
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setCurrentPage('broker-console')}
              className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EDE9DF] hover:border-[#C57D25] cursor-pointer transition-all text-center"
            >
              <h4 className="font-bold text-base text-[#0B1220] mb-2">Relationship Manager (RM) Console</h4>
              <p className="text-xs text-[#64748B] mb-4">Sort assigned clients by red flag severity, inspect causal chains, and schedule compliance nudges.</p>
              <span className="text-xs font-bold text-[#C57D25] inline-flex items-center space-x-1">
                <span>Preview RM Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div 
              onClick={() => setCurrentPage('compliance')}
              className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EDE9DF] hover:border-[#2BB673] cursor-pointer transition-all text-center"
            >
              <h4 className="font-bold text-base text-[#0B1220] mb-2">Compliance & SEBI Audit Dashboard</h4>
              <p className="text-xs text-[#64748B] mb-4">Track organization-wide mis-selling trends, export encrypted audit trails, and ensure regulatory alignment.</p>
              <span className="text-xs font-bold text-[#2BB673] inline-flex items-center space-x-1">
                <span>Preview Compliance Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Lead Capture Form */}
        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#F7E5C8] max-w-2xl mx-auto shadow-xs">
          <h3 className="text-xl font-extrabold text-[#0B1220] mb-2 text-center">
            Book a B2B Demo / Talk to Compliance Team
          </h3>
          <p className="text-xs text-[#64748B] text-center mb-6">
            Get whitelisted deployment details, API docs, and custom SLA pricing.
          </p>

          {submitted ? (
            <div className="bg-white p-4 rounded-xl border border-[#A7F3D0] text-center text-xs font-bold text-[#2BB673]">
              ✅ Thank you! Our Compliance Solutions Lead will contact your team within 2 hours.
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#0B1220] mb-1">Brokerage / Institution Name</label>
                <input required type="text" placeholder="e.g. Zerodha Broking Ltd / HDFC Securities" className="w-full px-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1220] mb-1">Work Email</label>
                <input required type="email" placeholder="compliance@broker.com" className="w-full px-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25]" />
              </div>

              <button type="submit" className="w-full py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer">
                Submit Request
              </button>
            </form>
          )}
        </div>

      </section>
    </div>
  );
};
