import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { SlidersHorizontal, ShieldAlert, Building2, CheckCircle2, Save } from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const [reitThreshold, setReitThreshold] = useState<number>(30);
  const [bondLockinThreshold, setBondLockinThreshold] = useState<number>(24);
  const [saved, setSaved] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0B1220]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Platform Admin Control</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">
              Admin & Rule Engine Configuration
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Configure Behavioral Matrix Engine thresholds, broker whitelisting, and compliance rule triggers.
            </p>
          </div>

          <button
            onClick={() => setSaved(true)}
            className="px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Rule Thresholds</span>
          </button>
        </div>

        {saved && (
          <div className="mb-6 bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-[#2BB673]">
            <span>✅ Behavioral Matrix Engine rules updated across all whitelisted brokerages.</span>
            <button onClick={() => setSaved(false)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Rule Engine Thresholds */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8 space-y-6">
          <h2 className="font-extrabold text-base text-[#0B1220] flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#C57D25]" />
            <span>Behavioral Rule Threshold Parameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#0B1220] mb-2">
                REIT/InvIT Concentration Red Flag Threshold ({reitThreshold}%)
              </label>
              <input
                type="range"
                min="15"
                max="50"
                value={reitThreshold}
                onChange={(e) => setReitThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[11px] text-[#8B93A7] mt-1 font-mono">
                <span>15% (Strict)</span>
                <span>30% (Default)</span>
                <span>50% (Permissive)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1220] mb-2">
                Liquidity Mismatch Lock-in Threshold ({bondLockinThreshold} Months)
              </label>
              <input
                type="range"
                min="12"
                max="60"
                step="6"
                value={bondLockinThreshold}
                onChange={(e) => setBondLockinThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
              />
              <div className="flex justify-between text-[11px] text-[#8B93A7] mt-1 font-mono">
                <span>12 Months</span>
                <span>24 Months</span>
                <span>60 Months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Broker Whitelist Directory */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
          <h2 className="font-extrabold text-base text-[#0B1220] mb-4 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#2BB673]" />
            <span>Whitelisted Brokerage Partners</span>
          </h2>

          <div className="divide-y divide-[#F1EFE9] text-xs">
            {[
              { name: 'Zerodha Broking Ltd', status: 'Whitelisted', api: 'V3 Active' },
              { name: 'Groww (Nextbillion Technology)', status: 'Whitelisted', api: 'V3 Active' },
              { name: 'ICICI Securities', status: 'Whitelisted', api: 'V3 Active' },
              { name: 'RBI Retail Direct Portal', status: 'Whitelisted', api: 'G-Sec API Sync' },
            ].map((b, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0B1220]">{b.name}</div>
                  <div className="text-[10px] text-[#8B93A7] font-mono">{b.api}</div>
                </div>
                <span className="bg-[#E6F4EA] text-[#2BB673] px-2.5 py-0.5 rounded-full font-bold">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};
