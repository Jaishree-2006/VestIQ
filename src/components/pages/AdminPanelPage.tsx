import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { SlidersHorizontal, ShieldAlert, Building2, Save, Plus, AlertTriangle, Shield, Info } from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const { logAuditAction } = useApp();

  const [reitThreshold, setReitThreshold] = useState<number>(30);
  const [bondLockinThreshold, setBondLockinThreshold] = useState<number>(24);
  const [yieldTrapThreshold, setYieldTrapThreshold] = useState<number>(14);
  const [saved, setSaved] = useState<boolean>(false);
  const [onboardingBroker, setOnboardingBroker] = useState<string>('');
  const [brokerOnboarded, setBrokerOnboarded] = useState<boolean>(false);

  const handleSaveThresholds = () => {
    logAuditAction('rule_threshold_change', 'behavioral-matrix-engine', 'Behavioral Matrix Engine', 
      `REIT threshold ${reitThreshold}%, Lock-in ${bondLockinThreshold}mo, Yield trap ${yieldTrapThreshold}%`);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  const handleBrokerOnboard = () => {
    if (!onboardingBroker.trim()) return;
    logAuditAction('broker_onboarded', 'new-broker', onboardingBroker, `New broker org whitelisted by Admin`);
    setBrokerOnboarded(true);
    setOnboardingBroker('');
    setTimeout(() => setBrokerOnboarded(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0B1220]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Platform Admin Control</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">
              Admin & Rule Engine Configuration
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Configure Behavioral Matrix Engine thresholds and onboard new broker organizations.
            </p>
          </div>

          <button
            onClick={handleSaveThresholds}
            className="px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Log Changes</span>
          </button>
        </div>

        {/* Non-negotiable Admin PII Boundary Banner */}
        <div className="mb-6 bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 flex items-start space-x-3">
          <Shield className="w-5 h-5 text-[#C57D25] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-[#63451B] mb-0.5">Admin Scope: System Configuration Only</div>
            <p className="text-[11px] text-[#8B93A7] leading-relaxed">
              Admins control the rule engine and broker onboarding — not individual investor accounts. Access to raw portfolio data requires switching to an authorized Compliance Officer context. This separation of "who configures the system" from "who sees the data" is a key compliance assurance.
            </p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-[#2BB673]">
            <span>✅ Rule thresholds updated. Change logged to Compliance Audit Trail.</span>
            <button onClick={() => setSaved(false)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {brokerOnboarded && (
          <div className="mb-6 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-[#2BB673]">
            <span>✅ Broker organization onboarded and whitelisted. Logged to audit trail.</span>
            <button onClick={() => setBrokerOnboarded(false)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Rule Engine Threshold Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h2 className="font-extrabold text-base text-[#0B1220] flex items-center space-x-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-[#C57D25]" />
            <span>Behavioral Matrix Engine — Rule Thresholds</span>
          </h2>
          <p className="text-xs text-[#64748B] mb-6">
            These thresholds determine when the Mis-Selling Detector and Suitability Engine fire red flag alerts. All changes are audit-logged.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#0B1220]">REIT/InvIT Concentration Threshold</label>
                <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{reitThreshold}%</span>
              </div>
              <input
                type="range" min="15" max="50" value={reitThreshold}
                onChange={(e) => setReitThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1 font-mono">
                <span>15% Strict</span><span>30% Default</span><span>50% Lenient</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Portfolio weight above this in a single REIT triggers concentration red flag.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#0B1220]">Liquidity Mismatch Lock-in</label>
                <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{bondLockinThreshold}mo</span>
              </div>
              <input
                type="range" min="12" max="60" step="6" value={bondLockinThreshold}
                onChange={(e) => setBondLockinThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1 font-mono">
                <span>12mo</span><span>24mo</span><span>60mo</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Lock-in months above stated investor horizon triggers liquidity mismatch flag.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#0B1220]">High-Yield Bond Trap Threshold</label>
                <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{yieldTrapThreshold}%</span>
              </div>
              <input
                type="range" min="8" max="25" step="1" value={yieldTrapThreshold}
                onChange={(e) => setYieldTrapThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1 font-mono">
                <span>8%</span><span>14% Default</span><span>25%</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Unrated bonds with yield above this threshold trigger the yield-trap mis-selling flag.
              </p>
            </div>

          </div>
        </div>

        {/* Broker Whitelisting */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h2 className="font-extrabold text-base text-[#0B1220] mb-2 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#2BB673]" />
            <span>Broker / Depository Whitelisting</span>
          </h2>
          <p className="text-xs text-[#64748B] mb-4">
            Onboard new brokerage organizations for whitelisted VestIQ Enterprise deployment. All additions are audit-logged.
          </p>

          {/* Add new broker */}
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              placeholder="Enter broker org name (e.g. HDFC Securities Ltd)"
              value={onboardingBroker}
              onChange={(e) => setOnboardingBroker(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25]"
            />
            <button
              onClick={handleBrokerOnboard}
              disabled={!onboardingBroker.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                onboardingBroker.trim()
                  ? 'bg-[#2BB673] hover:bg-[#22A163] text-white shadow-xs'
                  : 'bg-[#F1EFE9] text-[#8B93A7] cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Whitelist & Log</span>
            </button>
          </div>

          {/* Existing whitelisted brokers */}
          <div className="divide-y divide-[#F1EFE9]">
            {[
              { name: 'Zerodha Broking Ltd', status: 'Active', api: 'VestIQ API v3', since: 'Jan 2026' },
              { name: 'Groww (Nextbillion Technology)', status: 'Active', api: 'VestIQ API v3', since: 'Feb 2026' },
              { name: 'ICICI Securities', status: 'Active', api: 'VestIQ API v3', since: 'Mar 2026' },
              { name: 'RBI Retail Direct Portal', status: 'Active', api: 'G-Sec API Sync', since: 'May 2026' },
            ].map((b, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#0B1220]">{b.name}</div>
                  <div className="text-[10px] text-[#8B93A7] font-mono mt-0.5">{b.api} · Since {b.since}</div>
                </div>
                <span className="bg-[#E6F4EA] text-[#2BB673] px-2.5 py-0.5 rounded-full font-bold">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PII Boundary Reminder */}
        <div className="bg-[#F6F4ED] rounded-2xl p-4 border border-[#EDE9DF] flex items-start space-x-3">
          <Info className="w-4 h-4 text-[#8B93A7] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#8B93A7] leading-relaxed">
            <strong className="text-[#0B1220]">Admin context reminder:</strong> This panel controls system configuration only. Individual investor portfolio data, PAN details, and transaction histories are inaccessible from this context by design. Access requires switching to an authorized Compliance Officer session.
          </p>
        </div>

      </main>
    </div>
  );
};
