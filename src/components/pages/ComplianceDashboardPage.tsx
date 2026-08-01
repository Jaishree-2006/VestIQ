import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { MOCK_CLIENTS } from '../../data/mockData';
import { 
  ShieldCheck, Download, Eye, EyeOff, CheckCircle2, AlertTriangle,
  FileText, Clock, Lock, Unlock, UserCheck, ChevronDown, ChevronUp,
  Info, Shield
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const ComplianceDashboardPage: React.FC = () => {
  const { 
    auditLog, 
    logAuditAction,
    compliancePiiRevealed, 
    revealClientPii, 
    maskClientPii 
  } = useApp();

  const [auditExported, setAuditExported] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [drillDownClientId, setDrillDownClientId] = useState<string | null>(null);
  const [drillDownReason, setDrillDownReason] = useState('');
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);

  const complianceChartData = [
    { month: 'Mar 2026', HighFlags: 14, MediumFlags: 28, CleanPortfolios: 180 },
    { month: 'Apr 2026', HighFlags: 11, MediumFlags: 22, CleanPortfolios: 195 },
    { month: 'May 2026', HighFlags: 8,  MediumFlags: 19, CleanPortfolios: 210 },
    { month: 'Jun 2026', HighFlags: 5,  MediumFlags: 14, CleanPortfolios: 235 },
    { month: 'Jul 2026', HighFlags: 2,  MediumFlags: 9,  CleanPortfolios: 260 },
  ];

  const handleExportAuditTrail = () => {
    logAuditAction('export_audit_trail', 'org-wide', 'Organization Audit Export', 'Monthly SEBI IEPF submission');
    setAuditExported(true);
  };

  const handleConfirmReveal = () => {
    if (!pendingRevealId || !drillDownReason.trim()) return;
    const client = MOCK_CLIENTS.find(c => c.id === pendingRevealId);
    if (client) {
      revealClientPii(pendingRevealId, client.name, drillDownReason);
    }
    setDrillDownClientId(null);
    setPendingRevealId(null);
    setDrillDownReason('');
  };

  const actionLabels: Record<string, string> = {
    drill_into_client: 'Client Case Drill-Down',
    export_audit_trail: 'Audit Trail Export',
    toggle_pii: 'PII Toggle',
    rule_threshold_change: 'Rule Threshold Changed',
    broker_onboarded: 'Broker Onboarded',
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2BB673]">
              <ShieldCheck className="w-4 h-4" />
              <span>SEBI IEPF Compliance & Audit Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">Compliance Dashboard</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Aggregate-first view. Individual case drill-down requires an explicit, logged action.
            </p>
          </div>
          <button
            onClick={handleExportAuditTrail}
            className="px-4 py-2 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SEBI Audit Trail</span>
          </button>
        </div>

        {/* Default Aggregate Policy Banner */}
        <div className="mb-6 bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 flex items-start space-x-3">
          <Shield className="w-5 h-5 text-[#C57D25] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-[#63451B] mb-0.5">Privacy-First Default: Aggregate View Only</div>
            <p className="text-[11px] text-[#8B93A7] leading-relaxed">
              Individual client data is hidden by default. Any drill-down into a specific client case requires a stated business reason and is permanently recorded in the audit log — making every access defensible in a SEBI regulatory inspection.
            </p>
          </div>
        </div>

        {auditExported && (
          <div className="mb-6 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-xs font-semibold text-[#15803D]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#2BB673]" />
              <span>SEBI-compliant audit trail (AES-256 signed JSON/PDF) generated and logged.</span>
            </div>
            <button onClick={() => setAuditExported(false)} className="text-xs underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* 4 Aggregate KPI Stats — NO individual PII */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">Active Mis-Selling Flags</div>
            <div className="text-3xl font-extrabold text-[#EF4444] font-mono-num mt-1">11</div>
            <div className="text-[11px] text-[#2BB673] font-semibold mt-1">↓ 35% vs last month</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">Org Suitability Score</div>
            <div className="text-3xl font-extrabold text-[#2BB673] font-mono-num mt-1">94.2%</div>
            <div className="text-[11px] text-[#64748B] font-semibold mt-1">Org-wide compliance</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">Portfolios Audited</div>
            <div className="text-3xl font-extrabold text-[#0B1220] font-mono-num mt-1">271</div>
            <div className="text-[11px] text-[#64748B] font-semibold mt-1">CDSL/NSDL synced</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#EDE9DF]">
            <div className="text-xs text-[#8B93A7] font-semibold">IEPF Alignment</div>
            <div className="text-3xl font-extrabold text-[#C57D25] font-mono-num mt-1">100%</div>
            <div className="text-[11px] text-[#64748B] font-semibold mt-1">Full audit trail</div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-[#0B1220] mb-4">5-Month Mis-Selling Flag Resolution Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} />
                <YAxis stroke="#8B93A7" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE9DF' }} />
                <Legend />
                <Bar dataKey="HighFlags" name="High Risk Flags" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MediumFlags" name="Medium Risk Flags" fill="#C57D25" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CleanPortfolios" name="Compliant Portfolios" fill="#2BB673" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual Case Drill-Down Section — requires explicit action + reason */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-[#0B1220] flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-[#C57D25]" />
              <span>Individual Case Drill-Down</span>
            </h3>
            <span className="text-[11px] bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5] px-2.5 py-0.5 rounded-full font-bold">
              Requires Audit Log Entry
            </span>
          </div>
          <p className="text-xs text-[#64748B] mb-4">
            Select a flagged case below. You must provide a business reason before individual client data is revealed. This action is permanent and auditable.
          </p>

          <div className="space-y-2">
            {MOCK_CLIENTS.filter(c => c.flagCount > 0).map(client => {
              const isRevealed = compliancePiiRevealed.includes(client.id);
              return (
                <div key={client.id} className={`p-4 rounded-2xl border transition-all ${isRevealed ? 'border-[#A7F3D0] bg-[#F0FDF4]' : 'border-[#EDE9DF] bg-[#FAF8F5]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Masked / unmasked identity */}
                      <div className="w-8 h-8 rounded-full bg-[#F6F4ED] border border-[#EDE9DF] flex items-center justify-center text-xs font-bold text-[#8B93A7]">
                        {isRevealed ? client.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0B1220]">
                          {isRevealed ? client.name : `Client ID ${client.id.toUpperCase()} — PAN Hidden`}
                        </div>
                        <div className="text-[11px] text-[#8B93A7]">
                          {isRevealed ? `PAN: ${client.casPan} • ${client.email}` : 'Reveal identity to see full details'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        client.healthScore < 65 ? 'bg-[#FDF2F2] text-[#EF4444]' : 'bg-[#FFF8EE] text-[#C57D25]'
                      }`}>
                        {client.flagCount} Flag{client.flagCount > 1 ? 's' : ''}
                      </span>

                      {isRevealed ? (
                        <button
                          onClick={() => maskClientPii(client.id)}
                          className="flex items-center space-x-1 text-[11px] font-bold text-[#8B93A7] hover:text-[#EF4444] cursor-pointer bg-white border border-[#EDE9DF] px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Mask</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => { setDrillDownClientId(client.id); setPendingRevealId(client.id); }}
                          className="flex items-center space-x-1 text-[11px] font-bold text-[#C57D25] cursor-pointer bg-[#FFF8EE] border border-[#F7E5C8] px-2.5 py-1 rounded-lg hover:bg-[#F7E5C8] transition-colors"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Reveal + Log Access</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Revealed client detail */}
                  {isRevealed && (
                    <div className="mt-3 pt-3 border-t border-[#D1FAE5] grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-[#A7F3D0]">
                        <div className="text-[#8B93A7]">Top Flag Issue</div>
                        <div className="font-bold text-[#991B1B] mt-0.5">{client.topFlag}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#A7F3D0]">
                        <div className="text-[#8B93A7]">Risk Profile</div>
                        <div className="font-bold text-[#0B1220] mt-0.5">{client.riskProfile} • Score {client.healthScore}/100</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drill-down Reason Modal */}
        {drillDownClientId && (
          <div className="fixed inset-0 bg-[#0B1220]/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-vestiq-lg border border-[#EDE9DF]">
              <div className="flex items-center space-x-2 mb-3">
                <Lock className="w-4 h-4 text-[#EF4444]" />
                <h3 className="font-extrabold text-base text-[#0B1220]">Mandatory Reason Required</h3>
              </div>
              <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
                You are about to reveal <strong>individual client PII</strong>. This action will be permanently recorded in the SEBI audit log with your identity, timestamp, and IP address.
              </p>
              <label className="block text-xs font-bold text-[#0B1220] mb-1">
                Business Reason for Access <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={drillDownReason}
                onChange={(e) => setDrillDownReason(e.target.value)}
                placeholder="e.g. Investigating high-severity mis-selling flag for SEBI inquiry reference #2026-0084..."
                rows={3}
                className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25] resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setDrillDownClientId(null); setPendingRevealId(null); setDrillDownReason(''); }}
                  className="flex-1 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F6F4ED] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReveal}
                  disabled={!drillDownReason.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    drillDownReason.trim() ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#D4CEBF] cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Confirm & Log Access</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Panel */}
        <div className="bg-white rounded-3xl border border-[#EDE9DF] shadow-xs overflow-hidden">
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="w-full flex items-center justify-between p-5 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-[#C57D25]" />
              <div className="text-left">
                <div className="font-extrabold text-sm text-[#0B1220]">
                  Compliance Audit Log
                </div>
                <div className="text-[11px] text-[#8B93A7]">{auditLog.length} entries — permanently immutable</div>
              </div>
            </div>
            {showAuditLog
              ? <ChevronUp className="w-4 h-4 text-[#8B93A7]" />
              : <ChevronDown className="w-4 h-4 text-[#8B93A7]" />
            }
          </button>

          {showAuditLog && (
            <div className="border-t border-[#EDE9DF] divide-y divide-[#F1EFE9]">
              {auditLog.map((entry) => (
                <div key={entry.id} className="px-5 py-3.5 text-xs flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      entry.action === 'drill_into_client' ? 'bg-[#EF4444]' :
                      entry.action === 'export_audit_trail' ? 'bg-[#2BB673]' :
                      'bg-[#C57D25]'
                    }`} />
                    <div>
                      <div className="font-bold text-[#0B1220]">
                        {actionLabels[entry.action]} — <span className="text-[#C57D25]">{entry.targetEntityName}</span>
                      </div>
                      <div className="text-[#64748B] mt-0.5">{entry.officerName}</div>
                      {entry.reason && (
                        <div className="text-[#8B93A7] mt-0.5 italic">"{entry.reason}"</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#8B93A7] font-mono">
                      {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-[#D4CEBF] font-mono">{entry.ipAddress}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
