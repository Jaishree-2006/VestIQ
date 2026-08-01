import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { ShieldCheck, Download, Eye, EyeOff, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ComplianceDashboardPage: React.FC = () => {
  const [anonymizePii, setAnonymizePii] = useState<boolean>(true);
  const [auditExported, setAuditExported] = useState<boolean>(false);

  const complianceChartData = [
    { month: 'Mar 2026', HighFlags: 14, MediumFlags: 28, CleanPortfolios: 180 },
    { month: 'Apr 2026', HighFlags: 11, MediumFlags: 22, CleanPortfolios: 195 },
    { month: 'May 2026', HighFlags: 8,  MediumFlags: 19, CleanPortfolios: 210 },
    { month: 'Jun 2026', HighFlags: 5,  MediumFlags: 14, CleanPortfolios: 235 },
    { month: 'Jul 2026', HighFlags: 2,  MediumFlags: 9,  CleanPortfolios: 260 },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2BB673]">
              <ShieldCheck className="w-4 h-4" />
              <span>SEBI IEPF Compliance & Audit Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">
              Compliance Dashboard
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Organization-wide aggregate mis-selling metrics, audit trail generation, and privacy-first governance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAnonymizePii(!anonymizePii)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
                anonymizePii
                  ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                  : 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]'
              }`}
            >
              {anonymizePii ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>PII Anonymization: {anonymizePii ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setAuditExported(true)}
              className="px-4 py-2 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SEBI Audit Trail</span>
            </button>
          </div>
        </div>

        {auditExported && (
          <div className="mb-6 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-xs font-semibold text-[#15803D]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#2BB673]" />
              <span>SEBI-compliant audit trail (AES-256 signed JSON/PDF) generated successfully.</span>
            </div>
            <button onClick={() => setAuditExported(false)} className="text-xs underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">Active Mis-Selling Flags</div>
            <div className="text-3xl font-extrabold text-[#EF4444] font-mono-num mt-1">11</div>
            <div className="text-[11px] text-[#2BB673] font-semibold mt-1">↓ 35% vs last month</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">SEBI Suitability Score</div>
            <div className="text-3xl font-extrabold text-[#2BB673] font-mono-num mt-1">94.2%</div>
            <div className="text-[11px] text-[#64748B] font-semibold mt-1">Org-wide compliance</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">Portfolios Audited</div>
            <div className="text-3xl font-extrabold text-[#0B1220] font-mono-num mt-1">271</div>
            <div className="text-[11px] text-[#64748B] font-semibold mt-1">CDSL/NSDL synchronized</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">IEPF Mandate Alignment</div>
            <div className="text-3xl font-extrabold text-[#C57D25] font-mono-num mt-1">100%</div>
            <div className="text-[11px] text-[#64748B] font-semibold mt-1">Full audit trail ready</div>
          </div>
        </div>

        {/* Recharts Mis-Selling Trend Graph */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-[#0B1220] mb-4">
            5-Month Mis-Selling Flag Resolution Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} />
                <YAxis stroke="#8B93A7" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE9DF' }} />
                <Bar dataKey="HighFlags" name="High Risk Flags" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MediumFlags" name="Medium Risk Flags" fill="#C57D25" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CleanPortfolios" name="Compliant Portfolios" fill="#2BB673" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
};
