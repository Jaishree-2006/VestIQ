import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { supabase } from '../../lib/supabaseClient';
import {
  SlidersHorizontal,
  ShieldAlert,
  Save,
  AlertTriangle,
  Shield,
  Info,
  CheckCircle2,
  RefreshCw,
  Building2,
  Plus,
  ShieldCheck
} from 'lucide-react';
import type { WhitelistedBroker } from '../../types';
import { validateSebiRegistrationFormat } from '../../utils/brokerValidation';

export const AdminPanelPage: React.FC = () => {
  const { logAuditAction, healthScoreThresholds, setHealthScoreThresholds } = useApp();

  // ── Thresholds State ──────────────────────────────────────────────────────────
  const [dbSaveLoading, setDbSaveLoading] = useState<boolean>(false);
  const [dbSaveMessage, setDbSaveMessage] = useState<string | null>(null);
  const [pendingThresholds, setPendingThresholds] = useState<typeof healthScoreThresholds>(healthScoreThresholds);
  const [serverThresholds, setServerThresholds] = useState<typeof healthScoreThresholds>(healthScoreThresholds);

  const hasUnsavedChanges = JSON.stringify(pendingThresholds) !== JSON.stringify(serverThresholds);

  // ── Broker Whitelisting State ─────────────────────────────────────────────────
  const [brokers, setBrokers] = useState<WhitelistedBroker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [newIntegrationType, setNewIntegrationType] = useState<string>('VestIQ API v3');
  const [newSebiReg, setNewSebiReg] = useState<string>('');
  const [newContactEmail, setNewContactEmail] = useState<string>('');
  const [addBrokerLoading, setAddBrokerLoading] = useState<boolean>(false);
  const [addBrokerError, setAddBrokerError] = useState<string | null>(null);
  const [addBrokerSuccess, setAddBrokerSuccess] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [brokerActionMessage, setBrokerActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAdminAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || (sessionData as any)?.access_token;
    const isDemoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
    return accessToken || (isDemoMode ? 'demo-admin-token' : null);
  };

  const loadBrokers = async () => {
    setBrokersLoading(true);
    try {
      const accessToken = await getAdminAccessToken();
      if (!accessToken) return;

      const res = await fetch('/api/admin/brokers', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (json && Array.isArray(json.brokers)) {
          setBrokers(json.brokers);
          return;
        }
      }
      // Fallback: direct Supabase query if proxy fails
      const { data: directBrokers } = await supabase
        .from('whitelisted_brokers')
        .select('*')
        .order('onboarded_at', { ascending: true });
      if (Array.isArray(directBrokers)) {
        setBrokers(directBrokers as WhitelistedBroker[]);
      }
    } catch (err) {
      console.warn('Unable to load brokers from server DB, attempting direct query:', err);
      try {
        const { data: directBrokers } = await supabase
          .from('whitelisted_brokers')
          .select('*')
          .order('onboarded_at', { ascending: true });
        if (Array.isArray(directBrokers)) {
          setBrokers(directBrokers as WhitelistedBroker[]);
        }
      } catch (directErr) {
        console.warn('Direct Supabase query also failed:', directErr);
      }
    } finally {
      setBrokersLoading(false);
    }
  };

  // Load server-side thresholds and whitelisted brokers on mount
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
    loadBrokers();
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

  const handleAddBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBrokerError(null);
    setAddBrokerSuccess(null);

    const orgNameTrimmed = newOrgName.trim();
    const sebiTrimmed = newSebiReg.trim().toUpperCase();
    const emailTrimmed = newContactEmail.trim();

    if (!orgNameTrimmed) {
      setAddBrokerError('Please provide a valid Broker or Depository name.');
      return;
    }

    if (sebiTrimmed && !validateSebiRegistrationFormat(sebiTrimmed).isValid) {
      setAddBrokerError('SEBI Registration Number format is invalid. Expected prefix like INZ, INA, INH followed by digits.');
      return;
    }

    setAddBrokerLoading(true);
    try {
      const accessToken = await getAdminAccessToken();
      if (!accessToken) {
        setAddBrokerError('Authenticated admin session required.');
        setAddBrokerLoading(false);
        return;
      }

      const res = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          org_name: orgNameTrimmed,
          integration_type: newIntegrationType,
          sebi_reg_number: sebiTrimmed || undefined,
          contact_email: emailTrimmed || undefined
        })
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(json?.error || 'Something went wrong, please try again.');
      }

      if (!json?.broker) {
        throw new Error('Something went wrong, please try again.');
      }

      setAddBrokerSuccess(`✅ "${json.broker.org_name}" successfully whitelisted and logged to audit trail.`);
      setNewOrgName('');
      setNewSebiReg('');
      setNewContactEmail('');
      setNewIntegrationType('VestIQ API v3');

      await loadBrokers();

      logAuditAction(
        'broker_whitelist_add',
        json.broker.id,
        json.broker.org_name,
        `Integration: ${json.broker.integration_type}`
      );
    } catch (err: any) {
      setAddBrokerError(err.message || 'Error whitelisting broker');
    } finally {
      setAddBrokerLoading(false);
    }
  };

  const handleToggleBrokerStatus = async (broker: WhitelistedBroker) => {
    const nextStatus = broker.status === 'active' ? 'revoked' : 'active';
    const actionName = nextStatus === 'revoked' ? 'revoke access for' : 'restore access for';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} "${broker.org_name}"? This action will be recorded in the regulatory audit trail.`
    );
    if (!confirmed) return;

    setActionInProgressId(broker.id);
    setBrokerActionMessage(null);
    try {
      const accessToken = await getAdminAccessToken();
      if (!accessToken) {
        setBrokerActionMessage({ type: 'error', text: 'Authenticated admin session required.' });
        setActionInProgressId(null);
        return;
      }

      const res = await fetch(`/api/admin/brokers/${broker.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(json?.error || `Failed to ${nextStatus} broker.`);
      }

      if (!json?.broker) {
        throw new Error('Something went wrong, please try again.');
      }

      setBrokerActionMessage({
        type: 'success',
        text: `✅ Status for "${broker.org_name}" updated to ${nextStatus.toUpperCase()} and logged to audit trail.`
      });

      await loadBrokers();

      logAuditAction(
        nextStatus === 'revoked' ? 'broker_whitelist_revoke' : 'broker_whitelist_restore',
        broker.id,
        broker.org_name,
        `Status changed to ${nextStatus}`
      );
    } catch (err: any) {
      setBrokerActionMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionInProgressId(null);
      setTimeout(() => setBrokerActionMessage(null), 5000);
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
              <span>Platform Governance & Administration</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#14213D] mt-1">
              Admin Control Panel
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Configure Behavioral Matrix Engine thresholds and manage authorized broker/depository integrations.
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

        {/* Broker / Depository Whitelist Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#EDE9DF] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <h2 className="font-extrabold text-lg text-[#14213D] flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#C57D25]" />
              <span>Broker & Depository Whitelist</span>
            </h2>
            <span className="text-xs text-[#8B93A7] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EDE9DF] font-medium w-fit">
              Enterprise B2B Security Layer
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mb-6">
            Onboard and manage authorized broker organizations and depository feed integrations. All whitelisting and revocation events are verified server-side with service-role security and logged to the immutable audit trail.
          </p>

          {/* Onboard New Broker Form */}
          <form onSubmit={handleAddBroker} className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#EDE9DF] mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] mb-4 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-[#C57D25]" />
              <span>Onboard New Broker / Depository</span>
            </h3>

            {addBrokerError && (
              <div className="mb-4 p-3.5 bg-[#FDF2F2] border border-[#FCA5A5] rounded-xl text-xs font-bold text-[#EF4444] flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addBrokerError}</span>
              </div>
            )}

            {addBrokerSuccess && (
              <div className="mb-4 p-3.5 bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#2BB673] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{addBrokerSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                  Broker / Org Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Zerodha Broking Ltd"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium text-[#14213D] focus:outline-none focus:border-[#C57D25] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                  Integration Type
                </label>
                <select
                  value={newIntegrationType}
                  onChange={(e) => setNewIntegrationType(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium text-[#14213D] focus:outline-none focus:border-[#C57D25] transition-colors cursor-pointer"
                >
                  <option value="VestIQ API v3">VestIQ API v3 (Direct)</option>
                  <option value="CDSL Easiest API">CDSL Easiest API</option>
                  <option value="NSDL Speed-e API">NSDL Speed-e API</option>
                  <option value="G-Sec API Sync">G-Sec API Sync</option>
                  <option value="Direct Depository Feed">Direct Depository Feed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                  SEBI Reg Number <span className="text-[#8B93A7] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newSebiReg}
                  onChange={(e) => setNewSebiReg(e.target.value.toUpperCase())}
                  placeholder="e.g. INZ000031633"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium text-[#14213D] focus:outline-none focus:border-[#C57D25] transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                  Contact Email <span className="text-[#8B93A7] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="compliance@broker.com"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium text-[#14213D] focus:outline-none focus:border-[#C57D25] transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addBrokerLoading}
                className="px-4 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center space-x-2"
              >
                {addBrokerLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Whitelisting &amp; Logging...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Whitelist &amp; Log</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Currently Whitelisted Brokers Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B93A7]">
                Whitelisted Brokers &amp; Depositories ({brokers.length})
              </h3>
              <button
                type="button"
                onClick={loadBrokers}
                disabled={brokersLoading}
                className="p-1 rounded-lg text-[#8B93A7] hover:text-[#14213D] transition-colors cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${brokersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {brokerActionMessage && (
              <div className={`mb-3 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                brokerActionMessage.type === 'success'
                  ? 'bg-[#E6F4EA] border border-[#A7F3D0] text-[#2BB673]'
                  : 'bg-[#FDF2F2] border border-[#FCA5A5] text-[#EF4444]'
              }`}>
                {brokerActionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{brokerActionMessage.text}</span>
              </div>
            )}

            {brokersLoading && brokers.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-xs text-[#8B93A7]">
                Loading whitelisted brokers...
              </div>
            ) : brokers.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF] text-xs text-[#8B93A7]">
                No brokers whitelisted yet. Use the form above to onboard an authorized broker.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#EDE9DF]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#EDE9DF] text-[#6B7280] font-bold">
                    <tr>
                      <th className="py-3 px-4">Broker / Entity</th>
                      <th className="py-3 px-4">Integration Type</th>
                      <th className="py-3 px-4">SEBI Reg # / Contact</th>
                      <th className="py-3 px-4">Onboarded</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9DF] bg-white">
                    {brokers.map((broker) => {
                      const isActive = broker.status === 'active';
                      const isUpdating = actionInProgressId === broker.id;
                      const formattedDate = broker.onboarded_at
                        ? new Date(broker.onboarded_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—';

                      return (
                        <tr key={broker.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4 font-bold text-[#14213D]">
                            {broker.org_name}
                          </td>
                          <td className="py-3 px-4 text-[#6B7280]">
                            <span className="bg-[#FAF8F5] text-[#14213D] border border-[#EDE9DF] px-2 py-0.5 rounded-lg text-[11px] font-medium">
                              {broker.integration_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col space-y-0.5">
                              {broker.sebi_reg_number ? (
                                <span className="font-mono text-[11px] font-semibold text-[#14213D]">
                                  {broker.sebi_reg_number}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#8B93A7]">—</span>
                              )}
                              {broker.contact_email && (
                                <span className="text-[10px] text-[#6B7280]">
                                  {broker.contact_email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#6B7280]">
                            {formattedDate}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isActive
                                ? 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]'
                                : 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#2BB673]' : 'bg-[#EF4444]'}`}></span>
                              <span>{isActive ? 'Active' : 'Revoked'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleToggleBrokerStatus(broker)}
                              disabled={isUpdating}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                isActive
                                  ? 'bg-[#FDF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border border-[#FCA5A5]'
                                  : 'bg-[#FAF8F5] hover:bg-[#F6F4ED] text-[#14213D] border border-[#EDE9DF]'
                              }`}
                            >
                              {isUpdating ? 'Updating...' : isActive ? 'Revoke' : 'Restore'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
