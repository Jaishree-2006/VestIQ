import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { supabase } from '../../lib/supabaseClient';
import { SlidersHorizontal, ShieldAlert, Building2, Save, Plus, AlertTriangle, Shield, Info, CheckCircle2, RefreshCw } from 'lucide-react';

type BrokerWhitelistRow = {
  id: string;
  org_name: string;
  integration_type: string;
  sebi_reg_number?: string | null;
  contact_email?: string | null;
  status: 'active' | 'revoked';
  onboarded_at: string;
  onboarded_by?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
};

export const AdminPanelPage: React.FC = () => {
  const { logAuditAction, healthScoreThresholds, setHealthScoreThresholds } = useApp();

  const [onboardingBroker, setOnboardingBroker] = useState<string>('');
  const [brokerIntegrationType, setBrokerIntegrationType] = useState<string>('VestIQ API v3');
  const [brokerSebiRegNumber, setBrokerSebiRegNumber] = useState<string>('');
  const [brokerContactEmail, setBrokerContactEmail] = useState<string>('');
  const [brokerFormError, setBrokerFormError] = useState<string | null>(null);
  const [brokerOnboarded, setBrokerOnboarded] = useState<boolean>(false);
  const [brokers, setBrokers] = useState<BrokerWhitelistRow[]>([]);
  const [brokerListLoading, setBrokerListLoading] = useState<boolean>(false);
  const [whitelistLoading, setWhitelistLoading] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [dbSaveLoading, setDbSaveLoading] = useState<boolean>(false);
  const [dbSaveMessage, setDbSaveMessage] = useState<string | null>(null);
  const [pendingThresholds, setPendingThresholds] = useState<typeof healthScoreThresholds>(healthScoreThresholds);
  const [serverThresholds, setServerThresholds] = useState<typeof healthScoreThresholds>(healthScoreThresholds);

  const hasUnsavedChanges = JSON.stringify(pendingThresholds) !== JSON.stringify(serverThresholds);

  const getAdminAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || (sessionData as any)?.access_token;
    const isDemoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
    return accessToken || (isDemoMode ? 'demo-admin-token' : null);
  };

  const loadWhitelistedBrokers = async () => {
    try {
      setBrokerListLoading(true);
      const accessToken = await getAdminAccessToken();
      if (!accessToken) {
        setBrokers([]);
        return;
      }

      const res = await fetch('/api/admin/brokers', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to load whitelisted brokers');
      }

      const json = await res.json();
      setBrokers(Array.isArray(json.brokers) ? json.brokers : []);
    } catch (err: any) {
      console.warn('Unable to load whitelisted brokers:', err.message);
      setBrokers([]);
    } finally {
      setBrokerListLoading(false);
    }
  };

  // Load server-side thresholds from Supabase on mount
  useEffect(() => {
    const loadDbThresholds = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || (sessionData as any)?.access_token;
        if (!accessToken) return;

        const res = await fetch('/api/admin/thresholds', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.thresholds) {
            setPendingThresholds(json.thresholds);
            setServerThresholds(json.thresholds);
            setHealthScoreThresholds(json.thresholds);
          }
        }
      } catch (err) {
        console.warn('Unable to load thresholds from server DB:', err);
      }
    };

    loadDbThresholds();
    loadWhitelistedBrokers();
  }, []);

  const handleSaveThresholdsToDatabase = async () => {
    setDbSaveLoading(true);
    setDbSaveMessage(null);
    try {
      const accessToken = await getAdminAccessToken();
      if (!accessToken) {
        setDbSaveMessage('Error: Authenticated admin session required.');
        setDbSaveLoading(false);
        return;
      }

      const res = await fetch('/api/admin/thresholds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ thresholds: pendingThresholds })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save thresholds to Supabase.');
      }

      setServerThresholds(json.thresholds);
      setPendingThresholds(json.thresholds);
      setHealthScoreThresholds(json.thresholds);
      setDbSaveMessage('✅ Saved to Supabase Database — Active Server-Wide!');
      logAuditAction(
        'rule_threshold_change',
        'health-score-engine',
        'Health Score Engine',
        `concentrationPct=${json.thresholds.concentrationThresholdPct}%, reitMax=${json.thresholds.reitInvitMaxPct}%, lockin=${json.thresholds.lockinHorizonMonths}mo`
      );
    } catch (err: any) {
      setDbSaveMessage(`Save error: ${err.message}`);
    } finally {
      setDbSaveLoading(false);
      setTimeout(() => setDbSaveMessage(null), 5000);
    }
  };

  const handleSaveScoreWeights = (next: typeof healthScoreThresholds) => {
    setPendingThresholds(next);
  };

  const handleBrokerOnboard = async () => {
    const orgName = onboardingBroker.trim();
    const sebiRegNumber = brokerSebiRegNumber.trim();
    const contactEmail = brokerContactEmail.trim();

    if (!orgName) {
      setBrokerFormError('Organization name is required.');
      return;
    }

    if (sebiRegNumber && !/^INZ[A-Z0-9]{4,20}$/i.test(sebiRegNumber)) {
      setBrokerFormError('SEBI Registration Number must match the INZ format, e.g. INZ12345.');
      return;
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setBrokerFormError('Contact email is invalid.');
      return;
    }

    try {
      setWhitelistLoading(true);
      setBrokerFormError(null);
      const accessToken = await getAdminAccessToken();
      if (!accessToken) {
        throw new Error('Authenticated admin session required.');
      }

      const res = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          org_name: orgName,
          integration_type: brokerIntegrationType,
          sebi_reg_number: sebiRegNumber || null,
          contact_email: contactEmail || null
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to whitelist broker.');
      }

      logAuditAction('broker_onboarded', json.broker?.id || orgName, orgName, 'New broker org whitelisted by Admin');
      setBrokerOnboarded(true);
      setOnboardingBroker('');
      setBrokerIntegrationType('VestIQ API v3');
      setBrokerSebiRegNumber('');
      setBrokerContactEmail('');
      await loadWhitelistedBrokers();
      setTimeout(() => setBrokerOnboarded(false), 4000);
    } catch (err: any) {
      console.warn('Broker whitelist failed:', err.message);
      setBrokerFormError(err.message);
      setBrokerOnboarded(false);
    } finally {
      setWhitelistLoading(false);
    }
  };

  const handleBrokerStatusToggle = async (broker: BrokerWhitelistRow) => {
    if (broker.status === 'revoked') return;

    const shouldRevoke = window.confirm(`Revoke access for ${broker.org_name}? This will mark the broker as revoked and log the change.`);
    if (!shouldRevoke) return;

    try {
      setRevokingId(broker.id);
      const accessToken = await getAdminAccessToken();
      if (!accessToken) {
        throw new Error('Authenticated admin session required.');
      }

      const res = await fetch(`/api/admin/brokers/${broker.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: 'revoked',
          reason: 'Admin revoked broker access from whitelist panel.'
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to revoke broker.');

      logAuditAction('broker_revoked', broker.id, broker.org_name, 'Broker access revoked by admin');
      await loadWhitelistedBrokers();
    } catch (err: any) {
      console.warn('Broker revoke failed:', err.message);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#14213D]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Health Score Thresholds</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#14213D] mt-1">
              Health Score Thresholds
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Configure Behavioral Matrix Engine thresholds and onboard new broker organizations.
            </p>
          </div>

        </div>

        {/* Non-negotiable Admin PII Boundary Banner */}
        <div className="mb-6 bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4.5 flex items-start space-x-3.5">
          <Shield className="w-5 h-5 text-[#C57D25] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-[#63451B] mb-1">Admin Scope: System Configuration Only</div>
            <p className="text-xs sm:text-sm text-[#785C37] leading-relaxed">
              Admins control the rule engine and broker onboarding — not individual investor accounts. Access to raw portfolio data requires switching to an authorized Compliance Officer context. This separation of "who configures the system" from "who sees the data" is a key compliance assurance.
            </p>
          </div>
        </div>


        {brokerOnboarded && (
          <div className="mb-6 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-sm font-bold text-[#2BB673]">
            <span>✅ Broker organization onboarded and whitelisted. Logged to audit trail.</span>
            <button onClick={() => setBrokerOnboarded(false)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Rule Engine Threshold Configuration */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#EDE9DF] shadow-xs mb-8">
          <h2 className="font-extrabold text-lg text-[#14213D] flex items-center space-x-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-[#C57D25]" />
            <span>Behavioral Matrix Engine — Rule Thresholds</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mb-6">
            These thresholds determine when the Mis-Selling Detector and Suitability Engine fire red flag alerts. All changes are audit-logged.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#14213D]">REIT/InvIT Concentration Threshold</label>
                <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.reitInvitMaxPct}%</span>
              </div>
              <input
                type="range" min="15" max="50" value={pendingThresholds.reitInvitMaxPct}
                onChange={(e) => handleSaveScoreWeights({ ...pendingThresholds, reitInvitMaxPct: +e.target.value })}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1 font-mono">
                <span>15% Strict</span><span>30% Default</span><span>50% Lenient</span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-2">
                Portfolio weight above this in a single REIT triggers concentration red flag.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#14213D]">Liquidity Mismatch Lock-in</label>
                <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.lockinHorizonMonths}mo</span>
              </div>
              <input
                type="range" min="12" max="60" step="6" value={pendingThresholds.lockinHorizonMonths}
                onChange={(e) => handleSaveScoreWeights({ ...pendingThresholds, lockinHorizonMonths: +e.target.value })}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1 font-mono">
                <span>12mo</span><span>24mo</span><span>60mo</span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-2">
                Lock-in months above stated investor horizon triggers liquidity mismatch flag.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#14213D]">High-Yield Bond Trap Threshold</label>
                <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.fixedIncomeMinPct}%</span>
              </div>
              <input
                type="range" min="8" max="25" step="1" value={pendingThresholds.fixedIncomeMinPct}
                onChange={(e) => handleSaveScoreWeights({ ...pendingThresholds, fixedIncomeMinPct: +e.target.value })}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1 font-mono">
                <span>8%</span><span>14% Default</span><span>25%</span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-2">
                Bond/fixed-income below this threshold triggers the fixed-income diversification gap penalty.
              </p>
            </div>

          </div>
        </div>

        {/* Health Score — Penalty Weight Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h2 className="font-extrabold text-base text-[#14213D] flex items-center space-x-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-[#C57D25]" />
            <span>Health Score — Penalty Weight Configuration</span>
          </h2>
          <p className="text-xs text-[#6B7280] mb-6">
            These values control when each Health Score penalty fires (trigger thresholds) and how many points it deducts or adds (penalty weights). Changes apply live and are audit-logged.
          </p>

          {/* Trigger Thresholds */}
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B93A7] mb-4">Trigger Thresholds — when does a penalty fire?</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#14213D]">Concentration Threshold (single instrument)</label>
                  <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.concentrationThresholdPct}%</span>
                </div>
                <input
                  type="range" min="10" max="40" step="1"
                  value={pendingThresholds.concentrationThresholdPct}
                  onChange={e => handleSaveScoreWeights({ ...pendingThresholds, concentrationThresholdPct: +e.target.value })}
                  className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Single holding above this % of portfolio triggers concentration penalty.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#14213D]">REIT/InvIT Max (combined category)</label>
                  <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.reitInvitMaxPct}%</span>
                </div>
                <input
                  type="range" min="15" max="60" step="1"
                  value={pendingThresholds.reitInvitMaxPct}
                  onChange={e => handleSaveScoreWeights({ ...pendingThresholds, reitInvitMaxPct: +e.target.value })}
                  className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Combined REIT/InvIT weight above this triggers rate-sensitive exposure penalty.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#14213D]">Investor Liquidity Horizon</label>
                  <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.lockinHorizonMonths} mo</span>
                </div>
                <input
                  type="range" min="6" max="60" step="6"
                  value={pendingThresholds.lockinHorizonMonths}
                  onChange={e => handleSaveScoreWeights({ ...pendingThresholds, lockinHorizonMonths: +e.target.value })}
                  className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Any holding locked beyond this investor horizon triggers liquidity mismatch penalty.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#14213D]">Min Fixed-Income Weight</label>
                  <span className="font-mono-num text-xs font-bold text-[#C57D25] bg-[#FFF8EE] px-2 py-0.5 rounded-lg border border-[#F7E5C8]">{pendingThresholds.fixedIncomeMinPct}%</span>
                </div>
                <input
                  type="range" min="5" max="40" step="1"
                  value={pendingThresholds.fixedIncomeMinPct}
                  onChange={e => handleSaveScoreWeights({ ...pendingThresholds, fixedIncomeMinPct: +e.target.value })}
                  className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Bond/fixed-income below this % triggers diversification gap penalty.</p>
              </div>

            </div>
          </div>

          {/* Penalty Weights */}
          <div className="border-t border-[#F1EFE9] pt-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B93A7] mb-4">Penalty Weights — how many points does each factor cost?</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

              {([
                { key: 'concentrationPenalty',  label: 'Concentration', color: '#EF4444', sign: '-' },
                { key: 'liquidityPenalty',       label: 'Liquidity',     color: '#EF4444', sign: '-' },
                { key: 'volatilityPenalty',      label: 'Volatility',    color: '#EF4444', sign: '-' },
                { key: 'diversificationPenalty', label: 'Diversif.',     color: '#EF4444', sign: '-' },
                { key: 'behaviorBonus',          label: 'Behav. Bonus',  color: '#2BB673', sign: '+' },
              ] as const).map(({ key, label, color, sign }) => (
                <div key={key} className="flex flex-col items-center bg-[#FAF8F5] rounded-xl p-3 border border-[#EDE9DF]">
                  <div className="text-[10px] font-bold text-[#8B93A7] mb-2 text-center">{label}</div>
                  <div className="text-2xl font-extrabold font-mono-num" style={{ color }}>
                    {sign}{pendingThresholds[key]}
                  </div>
                  <div className="text-[10px] text-[#8B93A7] mb-2">points</div>
                  <input
                    type="range" min="1" max="20" step="1"
                    value={pendingThresholds[key]}
                    onChange={e => handleSaveScoreWeights({ ...pendingThresholds, [key]: +e.target.value })}
                    className="w-full h-1.5 bg-[#EDE9DF] rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}

            </div>
          </div>

          {/* Database Save Action */}
          <div className="mt-6 pt-5 border-t border-[#F1EFE9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#6B7280]">
              <span className="font-semibold text-[#14213D]">Server Database Persistence: </span>
              {dbSaveMessage ? (
                <span className="text-[#16A34A] font-bold">{dbSaveMessage}</span>
              ) : hasUnsavedChanges ? (
                <span className="text-[#C57D25] font-bold">Preview changes locally — click Save to apply them server-wide.</span>
              ) : (
                <span>Persisted in Supabase <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#EDE9DF]">scoring_thresholds</code> table for authoritative server scoring.</span>
              )}
            </div>
            <button
              onClick={handleSaveThresholdsToDatabase}
              disabled={dbSaveLoading || !hasUnsavedChanges}
              className="px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center space-x-2 shrink-0"
            >
              {dbSaveLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Apply Server-Wide</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="bg-[#F4F3EF] rounded-[28px] border border-[#DDE2DB] p-0 shadow-[0_8px_20px_rgba(16,24,40,0.03)] mb-8 overflow-hidden">
          <div className="px-8 py-6 border-b border-[#E9E4DD] bg-[#F6F5F1]">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#DFF2E6] flex items-center justify-center text-[#2D9D76]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#1F2D3D]">Broker / Depository Whitelisting</h2>
              </div>
            </div>
            <p className="text-[18px] text-[#4B5563] leading-relaxed">
              Onboard new brokerage organizations for whitelisted VestIQ Enterprise deployment.
            </p>
            <p className="text-[18px] text-[#4B5563] mt-1">All additions are audit-logged.</p>
          </div>

          <div className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <label className="block text-[19px] font-bold text-[#1F2D3D] mb-3">
                  Organization name <span className="text-[#E11D48]">*</span>
                </label>
                <div className="flex items-center gap-3 rounded-[14px] border border-[#6CB88E] bg-[#F7FBF8] px-4 py-4 focus-within:ring-2 focus-within:ring-[#9AD5B6]">
                  <Building2 className="w-5 h-5 text-[#2D9D76]" />
                  <input
                    type="text"
                    placeholder="Enter organization name"
                    value={onboardingBroker}
                    onChange={(e) => setOnboardingBroker(e.target.value)}
                    className="w-full bg-transparent text-[18px] text-[#1F2D3D] placeholder:text-[#8B93A7] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[19px] font-bold text-[#1F2D3D] mb-3">
                  API version <span className="text-[#E11D48]">*</span>
                </label>
                <div className="rounded-[14px] border border-[#D7DCE1] bg-[#F7F7F5] px-4 py-4">
                  <select
                    value={brokerIntegrationType}
                    onChange={(e) => setBrokerIntegrationType(e.target.value)}
                    className="w-full bg-transparent text-[18px] text-[#1F2D3D] outline-none"
                  >
                    <option value="VestIQ API v3">VestIQ API v3</option>
                    <option value="G-Sec API Sync">G-Sec API Sync</option>
                    <option value="Broker Import Feed">Broker Import Feed</option>
                    <option value="Depository Sync">Depository Sync</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-[19px] font-bold text-[#1F2D3D] mb-3">
                  SEBI Registration Number (optional)
                </label>
                <div className="flex items-center gap-3 rounded-[14px] border border-[#D7DCE1] bg-[#F7F7F5] px-4 py-4">
                  <span className="text-[20px] text-[#5B6470]">🧾</span>
                  <input
                    type="text"
                    placeholder="Enter SEBI registration number"
                    value={brokerSebiRegNumber}
                    onChange={(e) => setBrokerSebiRegNumber(e.target.value)}
                    className="w-full bg-transparent text-[18px] text-[#1F2D3D] placeholder:text-[#8B93A7] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[19px] font-bold text-[#1F2D3D] mb-3">
                  Contact email (optional)
                </label>
                <div className="flex items-center gap-3 rounded-[14px] border border-[#D7DCE1] bg-[#F7F7F5] px-4 py-4">
                  <span className="text-[20px] text-[#5B6470]">✉️</span>
                  <input
                    type="email"
                    placeholder="Enter contact email"
                    value={brokerContactEmail}
                    onChange={(e) => setBrokerContactEmail(e.target.value)}
                    className="w-full bg-transparent text-[18px] text-[#1F2D3D] placeholder:text-[#8B93A7] outline-none"
                  />
                </div>
              </div>
            </div>

            {brokerFormError && (
              <div className="mb-4 text-[15px] text-[#B91C1C] font-medium">{brokerFormError}</div>
            )}

            <div className="border-t border-dashed border-[#D7DCE1] pt-6 flex justify-end">
              <button
                onClick={handleBrokerOnboard}
                disabled={!onboardingBroker.trim() || whitelistLoading}
                className={`inline-flex items-center gap-3 px-6 py-4 rounded-[16px] text-[18px] font-bold transition-all ${
                  onboardingBroker.trim() && !whitelistLoading
                    ? 'bg-[#EAF6EE] text-[#2D9D76] border border-[#79C7A0] hover:bg-[#DFF2E6]'
                    : 'bg-[#EEF2EF] text-[#9AA4A0] border border-[#DADFD9] cursor-not-allowed'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{whitelistLoading ? 'Logging...' : 'Whitelist & Log'}</span>
              </button>
            </div>
          </div>

          <div className="px-8 pb-8">
            {brokerListLoading ? (
              <div className="rounded-[18px] border border-[#CDE7D6] bg-[#EEF8F2] px-6 py-5 text-[18px] text-[#4F7A61] font-medium">
                Loading broker whitelist…
              </div>
            ) : brokers.length === 0 ? (
              <div className="rounded-[18px] border border-[#CDE7D6] bg-[#EEF8F2] px-6 py-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#DFF2E6] text-[#2D9D76] flex items-center justify-center text-2xl">✓</div>
                </div>
                <div className="text-[20px] font-bold text-[#1F2D3D]">No broker organizations currently whitelisted.</div>
                <div className="mt-2 text-[18px] text-[#4B5563]">Add organizations above to get started.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {brokers.map((b) => {
                  const isActive = b.status === 'active';
                  const badgeClasses = isActive
                    ? 'bg-[#E6F4EA] text-[#2BB673]'
                    : 'bg-[#F1F3F5] text-[#6B7280]';

                  return (
                    <div key={b.id} className="flex items-center justify-between rounded-[14px] border border-[#E8E9E6] bg-white px-4 py-3">
                      <div>
                        <div className="text-[18px] font-bold text-[#1F2D3D]">{b.org_name}</div>
                        <div className="text-[13px] text-[#6B7280] font-mono mt-0.5">{b.integration_type} · Since {new Date(b.onboarded_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                        {b.sebi_reg_number && (
                          <div className="text-[13px] text-[#6B7280] font-mono mt-0.5">SEBI Reg. No. {b.sebi_reg_number}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBrokerStatusToggle(b)}
                        disabled={!isActive || revokingId === b.id}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-bold ${badgeClasses} ${!isActive || revokingId === b.id ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                      >
                        {revokingId === b.id ? 'Updating...' : isActive ? 'Active' : 'Revoked'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PII Boundary Reminder */}
        <div className="bg-[#F6F4ED] rounded-2xl p-4 border border-[#EDE9DF] flex items-start space-x-3">
          <Info className="w-4 h-4 text-[#8B93A7] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#8B93A7] leading-relaxed">
            <strong className="text-[#14213D]">Admin context reminder:</strong> This panel controls system configuration only. Individual investor portfolio data, PAN details, and transaction histories are inaccessible from this context by design. Access requires switching to an authorized Compliance Officer session.
          </p>
        </div>

      </main>
    </div>
  );
};
