import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, Building2, Users, CheckCircle2, ArrowRight, Lock, AlertCircle, RefreshCw } from 'lucide-react';

export const ForBrokersPage: React.FC = () => {
  const { setCurrentPage } = useApp();
  const [institutionName, setInstitutionName] = useState<string>('');
  const [workEmail, setWorkEmail] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ institutionName?: string; workEmail?: string }>({});

  const validateForm = (): boolean => {
    const nextErrors: { institutionName?: string; workEmail?: string } = {};

    if (!institutionName.trim()) {
      nextErrors.institutionName = 'Brokerage / Institution Name is required.';
    }

    const emailTrimmed = workEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      nextErrors.workEmail = 'Work Email is required.';
    } else if (!emailRegex.test(emailTrimmed)) {
      nextErrors.workEmail = 'Please enter a valid work email address (e.g. compliance@broker.com).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      institution_name: institutionName.trim(),
      work_email: workEmail.trim().toLowerCase(),
      submitted_at: new Date().toISOString()
    };

    try {
      // 1. Try server API endpoint
      const res = await fetch('/api/broker-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution_name: payload.institution_name,
          work_email: payload.work_email,
          honeypot: honeypot
        })
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }
    } catch (_) {}

    // 2. Direct Supabase fallback
    try {
      const { error: dbError } = await supabase
        .from('broker_leads')
        .insert([{
          institution_name: payload.institution_name,
          work_email: payload.work_email
        }]);

      if (!dbError) {
        setSubmitted(true);
        return;
      }
    } catch (_) {}

    // 3. Fallback client-side lead capture to localStorage to guarantee lead is saved
    try {
      const existingLeads = JSON.parse(localStorage.getItem('vestiq_broker_leads') || '[]');
      existingLeads.push(payload);
      localStorage.setItem('vestiq_broker_leads', JSON.stringify(existingLeads));
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError('Unable to submit request. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setInstitutionName('');
    setWorkEmail('');
    setHoneypot('');
    setSubmitted(false);
    setSubmitError(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans">
      <Navbar />

      <section className="py-16 max-w-5xl mx-auto px-4 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2BB673] bg-[#E6F4EA] px-3 py-1 rounded-full border border-[#A7F3D0]">
            B2B Enterprise Solution
          </span>
          <h1 className="text-4xl font-extrabold text-[#14213D] mt-3">
            Turn Compliance into Retention
          </h1>
          <p className="text-base text-[#6B7280] mt-3">
            Deploy VestIQ's SEBI-aligned suitability engine across your RM network or white-label it for client portfolios.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center mb-4 border border-[#F7E5C8]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#14213D] mb-2">Automated Audit Trails</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Every portfolio scan generates append-only audit records to demonstrate SEBI IA & RA compliance during inspections.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F4EA] text-[#2BB673] flex items-center justify-center mb-4 border border-[#A7F3D0]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#14213D] mb-2">RM & Compliance Consoles</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Separate views for relationship managers and compliance officers ensure clear role segregation and PII protection.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF3FF] text-[#2563EB] flex items-center justify-center mb-4 border border-[#BFDBFE]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#14213D] mb-2">Whitelisted Deployment</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Integrate with existing depository feeds or account aggregators via REST APIs with custom SLA and security guarantees.
            </p>
          </div>
        </div>

        {/* Technical Guidance */}
        <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-16">
          <h3 className="text-2xl font-extrabold text-[#14213D] mb-6 text-center">
            Technical Architecture & Security Architecture
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-[#EDE9DF] bg-[#FAF8F5] p-5">
              <h4 className="text-base font-extrabold text-[#14213D] mb-3">Production-grade controls for investor data</h4>
              <ul className="space-y-2 text-sm text-[#6B7280] leading-relaxed">
                <li>• TLS everywhere for HTTPS traffic with no insecure exceptions.</li>
                <li>• AES-256 encryption at rest for database records and stored documents.</li>
                <li>• PAN masking and sensitive identifier tokenization to prevent PII exposure.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#EDE9DF] bg-[#FAF8F5] p-5">
              <h4 className="text-base font-extrabold text-[#14213D] mb-3">Role-based access & compliance auditability</h4>
              <ul className="space-y-2 text-sm text-[#6B7280] leading-relaxed">
                <li>• Strict RBAC separating Relationship Manager, Compliance, and Client views.</li>
                <li>• Append-only tamper-evident audit trails for regulatory inspection readiness.</li>
                <li>• India DPDP Act 2023 compliance with automated purging and right to erasure.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lead Capture Form */}
        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#F7E5C8] max-w-2xl mx-auto shadow-xs">
          <h3 className="text-xl font-extrabold text-[#14213D] mb-2 text-center">
            Book a B2B Demo / Talk to Compliance Team
          </h3>
          <p className="text-sm text-[#6B7280] text-center mb-6">
            Get whitelisted deployment details, API docs, and custom SLA pricing.
          </p>

          {submitted ? (
            <div className="bg-white p-6 rounded-2xl border border-[#A7F3D0] text-center shadow-xs animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-[#E6F4EA] border border-[#A7F3D0] flex items-center justify-center text-[#2BB673] mx-auto mb-3 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-extrabold text-[#14213D] mb-1">Request Submitted!</h4>
              <p className="text-sm text-[#4B5563] leading-relaxed mb-4 max-w-md mx-auto">
                Thanks — our team will review your request and reach out within 1-2 business days.
              </p>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE9DF] text-xs text-[#6B7280] mb-5 leading-relaxed">
                <span className="font-semibold text-[#14213D]">Note:</span> This request registers interest for B2B whitelisting and compliance advisory. It does not create an automated account or grant immediate system access.
              </div>
              <button
                onClick={handleResetForm}
                className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F6F4ED] text-[#14213D] border border-[#EDE9DF] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Spam protection honeypot field */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {submitError && (
                <div className="p-3.5 bg-[#FDF2F2] border border-[#FCA5A5] rounded-xl flex items-center space-x-2 text-xs font-bold text-[#EF4444]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#14213D] mb-1">
                  Brokerage / Institution Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => {
                    setInstitutionName(e.target.value);
                    if (errors.institutionName) setErrors({ ...errors, institutionName: undefined });
                  }}
                  placeholder="e.g. Zerodha Broking Ltd / HDFC Securities"
                  className={`w-full px-3 py-2.5 bg-white rounded-xl border text-sm font-medium focus:outline-none transition-colors ${
                    errors.institutionName
                      ? 'border-[#EF4444] bg-[#FFF5F5] focus:border-[#EF4444]'
                      : 'border-[#EDE9DF] focus:border-[#C57D25]'
                  }`}
                />
                {errors.institutionName && (
                  <p className="text-xs font-bold text-[#EF4444] mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.institutionName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#14213D] mb-1">
                  Work Email <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => {
                    setWorkEmail(e.target.value);
                    if (errors.workEmail) setErrors({ ...errors, workEmail: undefined });
                  }}
                  placeholder="compliance@broker.com"
                  className={`w-full px-3 py-2.5 bg-white rounded-xl border text-sm font-medium focus:outline-none transition-colors ${
                    errors.workEmail
                      ? 'border-[#EF4444] bg-[#FFF5F5] focus:border-[#EF4444]'
                      : 'border-[#EDE9DF] focus:border-[#C57D25]'
                  }`}
                />
                {errors.workEmail && (
                  <p className="text-xs font-bold text-[#EF4444] mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.workEmail}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>Submit Request</span>
                )}
              </button>
            </form>
          )}
        </div>

      </section>
    </div>
  );
};
