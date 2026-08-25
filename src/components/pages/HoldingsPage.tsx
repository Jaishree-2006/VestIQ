import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import type { HoldingItem } from '../../types';
import { computeHealthScorePreview } from '../../utils/healthScore';
import { evaluateCoolingOffTrigger, type CoolingOffCheckResult } from '../../utils/coolingOff';
import { Layers, Search, Filter, Lightbulb, ExternalLink, ShieldCheck, X, DollarSign, Percent, AlertTriangle, ArrowRight } from 'lucide-react';
import { GlossaryTerm } from '../common/GlossaryTerm';
import { BrokerCredentialBadge } from '../common/BrokerCredentialBadge';

export const HoldingsPage: React.FC = () => {
  const { holdings, healthScore, healthScoreEvents, setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [simulationHoldings, setSimulationHoldings] = useState<HoldingItem[]>(holdings);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [selectedDrawerHolding, setSelectedDrawerHolding] = useState<HoldingItem | null>(null);
  const [pendingCoolingOffAction, setPendingCoolingOffAction] = useState<{
    id: string;
    nextValue: number;
    holding: HoldingItem;
    check: CoolingOffCheckResult;
  } | null>(null);

  useEffect(() => {
    setSimulationHoldings(holdings);
    setIsSimulationActive(false);
  }, [holdings]);

  const recalcWeights = useCallback((items: HoldingItem[]) => {
    const totalValue = items.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    return items.map(h => ({
      ...h,
      portfolioWeight: totalValue > 0 ? Number((((Number(h.currentValue) || 0) / totalValue) * 100).toFixed(1)) : 0,
    }));
  }, []);

  const applyHoldingChange = useCallback((id: string, nextValue: number) => {
    setSimulationHoldings(prev => recalcWeights(prev.map(h => h.id === id ? { ...h, currentValue: nextValue } : h)));
    setIsSimulationActive(true);
  }, [recalcWeights]);

  const updateSimulationHolding = useCallback((id: string, nextValue: number) => {
    const target = simulationHoldings.find(h => h.id === id);
    if (!target) return;

    const check = evaluateCoolingOffTrigger(target, nextValue, healthScoreEvents);
    if (check.triggered) {
      setPendingCoolingOffAction({ id, nextValue, holding: target, check });
    } else {
      applyHoldingChange(id, nextValue);
    }
  }, [simulationHoldings, healthScoreEvents, applyHoldingChange]);

  const adjustHoldingValue = useCallback((id: string, multiplier: number) => {
    const target = simulationHoldings.find(h => h.id === id);
    if (!target) return;

    const nextValue = Math.max(0, Math.round((Number(target.currentValue) || 0) * multiplier));
    const check = evaluateCoolingOffTrigger(target, nextValue, healthScoreEvents);

    if (check.triggered) {
      setPendingCoolingOffAction({ id, nextValue, holding: target, check });
    } else {
      applyHoldingChange(id, nextValue);
    }
  }, [simulationHoldings, healthScoreEvents, applyHoldingChange]);

  const resetHoldingSimulation = useCallback((id: string) => {
    const original = holdings.find(h => h.id === id);
    if (!original) return;
    setSimulationHoldings(prev => recalcWeights(prev.map(h => h.id === id ? { ...original } : h)));
  }, [holdings, recalcWeights]);

  const resetSimulation = useCallback(() => {
    setSimulationHoldings(holdings);
    setIsSimulationActive(false);
  }, [holdings]);

  const baselineScore = healthScore;
  const simulatedBreakdown = useMemo(() => computeHealthScorePreview(simulationHoldings), [simulationHoldings]);
  const simulatedScore = simulatedBreakdown.score;
  const scoreDelta = simulatedScore - baselineScore;
  const changedCount = useMemo(() => simulationHoldings.filter(item => {
    const original = holdings.find(h => h.id === item.id);
    return original ? original.currentValue !== item.currentValue : false;
  }).length, [holdings, simulationHoldings]);

  const baselineById = useMemo(() => new Map(holdings.map(item => [item.id, item])), [holdings]);

  const filtered = simulationHoldings.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || h.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Layers className="w-4 h-4" />
              <span>Multi-Asset Portfolio Detail</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              Holdings Detail &amp; Drilldown
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Unified view of all instruments across Zerodha, Groww, ICICI Direct, and RBI Retail Direct.
            </p>
          </div>
        </div>

        {/* Simulation summary */}
        <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-[1fr,280px]">
          <div className="rounded-3xl border border-[#EDE9DF] bg-white p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#C57D25] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C57D25]" />
                  <span>What If Simulation (Non-Authoritative Estimate)</span>
                </div>
                <h2 className="mt-2 text-2xl font-extrabold text-[#14213D]">Preview portfolio score impact</h2>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-bold ${scoreDelta > 0 ? 'bg-[#E6F4EA] text-[#2BB673]' : scoreDelta < 0 ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#F1EFE9] text-[#6B7280]'}`}>
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta < 0 ? `${scoreDelta}` : 'No change'}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF8F5] p-4">
                <div className="text-xs uppercase tracking-wide text-[#8B93A7]">Current Authoritative Score (Server)</div>
                <div className="mt-2 text-3xl font-bold text-[#14213D]">{baselineScore}</div>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-[#EDE9DF]">
                <div className="text-xs uppercase tracking-wide text-[#8B93A7]">Simulated Preview Score</div>
                <div className="mt-2 text-3xl font-bold text-[#14213D]">{simulatedScore}</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-[#6B7280]">
              {changedCount > 0
                ? `${changedCount} holding${changedCount === 1 ? '' : 's'} adjusted in simulation.`
                : 'Use row controls to preview changes without updating your actual portfolio.'}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetSimulation}
              disabled={changedCount === 0}
              className={`w-full rounded-3xl px-4 py-3 text-sm font-bold transition-all ${changedCount === 0 ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed' : 'bg-[#C57D25] text-white hover:bg-[#A16207]'}`}
            >
              Reset Simulation
            </button>
            <div className="rounded-3xl border border-[#EDE9DF] bg-white p-5 text-sm leading-relaxed text-[#475569]">
              <div className="font-semibold text-[#14213D] mb-2">Simulation notes</div>
              <p>Simulated scores are non-authoritative client estimates for exploration. Authoritative scores are calculated exclusively server-side from stored holdings.</p>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-[#EDE9DF] p-6 shadow-xs">
          
          {/* Search & Category Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-[#EDE9DF]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
              <input
                type="text"
                placeholder="Search by name or ticker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-sm font-medium focus:outline-none focus:border-[#C57D25] focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
              {['all', 'equities', 'bonds', 'reits_invits'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-[#C57D25] text-white border-[#C57D25]'
                      : 'bg-white text-[#6B7280] border-[#EDE9DF] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {cat === 'all' ? 'All Holdings' : cat.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#EDE9DF] text-[#8B93A7] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-3">Instrument</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Depository / Broker</th>
                  <th className="py-3.5 px-3 text-right">Current Value</th>
                  <th className="py-3.5 px-3 text-right">Weight</th>
                  <th className="py-3.5 px-3 text-center">Simulation</th>
                  <th className="py-3.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFE9]">
                {filtered.map((item) => {
                  const baseline = baselineById.get(item.id);
                  const valueChanged = baseline ? baseline.currentValue !== item.currentValue : false;
                  const deltaValue = baseline ? item.currentValue - baseline.currentValue : 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#14213D] cursor-pointer" onClick={() => setSelectedDrawerHolding(item)}>
                        <div className="hover:text-[#C57D25] transition-colors">{item.name}</div>
                        <div className="text-xs text-[#8B93A7] font-mono">{item.ticker} • {item.units} Units @ ₹{item.currentPrice}</div>
                      </td>
                      <td className="py-3.5 px-3 uppercase text-xs font-semibold text-[#6B7280]">
                        {item.category === 'reits_invits' ? (
                          <span>
                            <GlossaryTerm term="REIT">REIT</GlossaryTerm> / <GlossaryTerm term="InvIT">InvIT</GlossaryTerm>
                          </span>
                        ) : (
                          item.category.replace('_', ' ')
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[#475569]">
                        {item.broker} ({item.depository})
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num font-bold text-[#14213D]">
                        ₹{item.currentValue.toLocaleString('en-IN')}
                        {valueChanged && baseline ? (
                          <div className="text-[11px] text-[#6B7280] mt-1">
                            Actual ₹{baseline.currentValue.toLocaleString('en-IN')} • {deltaValue > 0 ? '+' : ''}₹{deltaValue.toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-[#6B7280]">
                        {item.portfolioWeight}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="grid grid-cols-2 gap-1.5 min-w-[130px]">
                          <button
                            type="button"
                            onClick={() => adjustHoldingValue(item.id, 1.1)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#14213D] bg-[#F8FAF5] border border-[#E5E7EB] hover:bg-[#ECF9EA] cursor-pointer"
                          >
                            +10%
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustHoldingValue(item.id, 0.9)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#14213D] bg-[#FFFAF0] border border-[#F2E7D6] hover:bg-[#FFF1DB] cursor-pointer"
                          >
                            -10%
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustHoldingValue(item.id, 0.7)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] cursor-pointer"
                            title="Simulate 30% reduction (Triggers Cooling-Off Check)"
                          >
                            -30%
                          </button>
                          <button
                            type="button"
                            onClick={() => resetHoldingSimulation(item.id)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#6B7280] bg-[#F1F5F9] border border-[#E2E8F0] hover:bg-[#E2E8F0] cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col gap-1.5 items-center">
                          <button
                            onClick={() => setSelectedDrawerHolding(item)}
                            className="px-3 py-1 bg-[#FFF8EE] hover:bg-[#F7E5C8] text-[#C57D25] rounded-lg border border-[#F7E5C8] font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Cost X-Ray</span>
                          </button>
                          <button
                            onClick={() => setCurrentPage('explainability')}
                            className="text-[11px] font-bold text-[#6B7280] hover:text-[#14213D] transition-colors cursor-pointer"
                          >
                            Inspect Chain →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Holdings Detail Drawer Modal */}
        {selectedDrawerHolding && (
          <div className="fixed inset-0 bg-[#14213D]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-vestiq-lg border border-[#EDE9DF] relative max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EDE9DF]">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]">
                      {selectedDrawerHolding.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#8B93A7] font-mono">
                      {selectedDrawerHolding.ticker} {selectedDrawerHolding.isin ? `• ${selectedDrawerHolding.isin}` : ''}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xl text-[#14213D]">{selectedDrawerHolding.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerHolding(null)}
                  className="p-1.5 text-[#6B7280] hover:text-[#14213D] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Position Overview Stats */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-3">
                    Position Overview
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-[11px] text-[#8B93A7] font-semibold block mb-0.5">Current Value</span>
                      <span className="font-extrabold text-base text-[#14213D] font-mono-num">
                        ₹{selectedDrawerHolding.currentValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-[11px] text-[#8B93A7] font-semibold block mb-0.5">Units &amp; Price</span>
                      <span className="font-bold text-xs text-[#14213D] font-mono-num">
                        {selectedDrawerHolding.units} Units @ ₹{selectedDrawerHolding.currentPrice}
                      </span>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-[11px] text-[#8B93A7] font-semibold block mb-0.5">Portfolio Weight</span>
                      <span className="font-extrabold text-base text-[#C57D25] font-mono-num">
                        {selectedDrawerHolding.portfolioWeight}%
                      </span>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-[11px] text-[#8B93A7] font-semibold block mb-0.5">
                        <GlossaryTerm term="Lock-in Period" showIcon>Lock-in Period</GlossaryTerm>
                      </span>
                      <span className="font-bold text-xs text-[#14213D]">
                        {selectedDrawerHolding.lockInMonths > 0 ? `${selectedDrawerHolding.lockInMonths} Months` : 'None (Liquid)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Intermediary / RM Sourcing & SEBI Credential Check */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B93A7] block mb-0.5">
                        Intermediary / Sourcing Channel
                      </span>
                      <div className="font-bold text-sm text-[#14213D]">
                        {selectedDrawerHolding.rm_name ? `${selectedDrawerHolding.rm_name} (${selectedDrawerHolding.broker})` : selectedDrawerHolding.broker} • {selectedDrawerHolding.depository}
                      </div>
                    </div>
                    <BrokerCredentialBadge
                      brokerRegNumber={selectedDrawerHolding.broker_reg_number}
                      brokerName={selectedDrawerHolding.broker}
                      showExplanation={false}
                    />
                  </div>
                  <BrokerCredentialBadge
                    brokerRegNumber={selectedDrawerHolding.broker_reg_number}
                    brokerName={selectedDrawerHolding.broker}
                    showExplanation={true}
                    className="pt-2 border-t border-[#EDE9DF]"
                  />
                </div>

                {/* Cost Breakdown Section */}
                <div className="pt-4 border-t border-[#EDE9DF]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-3">
                    Cost Breakdown
                  </div>

                  {/* Individual Cost Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-xs text-[#8B93A7] font-semibold block mb-1">
                        <GlossaryTerm term="Expense Ratio" showIcon>Expense Ratio (TER)</GlossaryTerm>
                      </span>
                      <div className="font-extrabold text-lg text-[#14213D] font-mono-num">
                        {selectedDrawerHolding.expense_ratio_pct !== undefined ? `${selectedDrawerHolding.expense_ratio_pct}%` : 'Not Applicable'}
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1 font-medium">
                        {selectedDrawerHolding.expense_ratio_pct ? (
                          <>≈ <strong>₹{Math.round(((selectedDrawerHolding.expense_ratio_pct / 100) * selectedDrawerHolding.currentValue)).toLocaleString('en-IN')}/year</strong> on this holding</>
                        ) : 'No annual TER deducted'}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-xs text-[#8B93A7] font-semibold block mb-1">
                        <GlossaryTerm term="Exit Load" showIcon>Exit Load</GlossaryTerm>
                      </span>
                      <div className="font-extrabold text-lg text-[#14213D] font-mono-num">
                        {selectedDrawerHolding.exit_load_pct !== undefined ? `${selectedDrawerHolding.exit_load_pct}%` : 'None (0%)'}
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1 font-medium">
                        {selectedDrawerHolding.exit_load_pct ? `Applicable if redeemed < 365 days` : 'Zero exit penalty'}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE9DF]">
                      <span className="text-xs text-[#8B93A7] font-semibold block mb-1">Brokerage &amp; Depository</span>
                      <div className="font-extrabold text-lg text-[#14213D] font-mono-num">
                        {selectedDrawerHolding.brokerage_pct !== undefined ? `${selectedDrawerHolding.brokerage_pct}%` : '0.1%'}
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1 font-medium">
                        Via {selectedDrawerHolding.broker} ({selectedDrawerHolding.depository})
                      </p>
                    </div>
                  </div>

                  {/* Causal-Chain Fee Comparison Pills (reusing Explainability Center pill pattern) */}
                  {(selectedDrawerHolding.expense_ratio_pct || 0) > 0.3 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B93A7] mb-2">
                        Fee Drag Analysis vs Low-Cost Passive Alternative:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                        {/* Step 1: Current Fee */}
                        <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 relative">
                          <div className="w-6 h-6 rounded-full bg-[#C57D25] text-white text-xs font-extrabold flex items-center justify-center mb-2">
                            1
                          </div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                            Current Expense Drag
                          </div>
                          <h4 className="font-bold text-sm text-[#14213D] mb-1">
                            {selectedDrawerHolding.expense_ratio_pct}% Expense Ratio
                          </h4>
                          <p className="text-xs text-[#63451B] leading-relaxed">
                            ₹{Math.round(((selectedDrawerHolding.expense_ratio_pct || 0) / 100) * selectedDrawerHolding.currentValue).toLocaleString('en-IN')}/year drag on this holding
                          </p>
                        </div>

                        {/* Step 2: Benchmark Fee */}
                        <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 relative">
                          <div className="w-6 h-6 rounded-full bg-[#C57D25] text-white text-xs font-extrabold flex items-center justify-center mb-2">
                            2
                          </div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                            Passive Benchmark
                          </div>
                          <h4 className="font-bold text-sm text-[#14213D] mb-1">
                            vs ~0.3% for a comparable index fund
                          </h4>
                          <p className="text-xs text-[#63451B] leading-relaxed">
                            ₹{Math.round((0.3 / 100) * selectedDrawerHolding.currentValue).toLocaleString('en-IN')}/year benchmark fee
                          </p>
                        </div>

                        {/* Step 3: Fee Drag Delta */}
                        <div className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-4 relative">
                          <div className="w-6 h-6 rounded-full bg-[#EF4444] text-white text-xs font-extrabold flex items-center justify-center mb-2">
                            3
                          </div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#EF4444] mb-1">
                            Fee Drag Delta
                          </div>
                          <h4 className="font-bold text-sm text-[#991B1B] mb-1">
                            ₹{Math.round((((selectedDrawerHolding.expense_ratio_pct || 0) - 0.3) / 100) * selectedDrawerHolding.currentValue).toLocaleString('en-IN')}/year difference
                          </h4>
                          <p className="text-xs text-[#7F1D1D] leading-relaxed">
                            Potential annual fee reduction by switching to direct passive index fund alternative.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-[#EDE9DF] flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">
                  <GlossaryTerm term="Suitability Score" showIcon>Suitability Score</GlossaryTerm>: <strong className="text-[#14213D]">{selectedDrawerHolding.suitabilityScore}/100</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedDrawerHolding(null);
                    setCurrentPage('explainability');
                  }}
                  className="px-4 py-2 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Inspect Full Causal Chain →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cooling-Off Nudge Behavioral Dialog Modal */}
        {pendingCoolingOffAction && (
          <div className="fixed inset-0 bg-[#14213D]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-vestiq-lg border border-[#EDE9DF] relative">
              
              {/* Caution Banner (Amber/Gold caution card styling matching data freshness alert) */}
              <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 mb-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#C57D25] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#C57D25]">
                    {pendingCoolingOffAction.check.title}
                  </h3>
                  <p className="text-xs text-[#63451B] mt-1 leading-relaxed">
                    {pendingCoolingOffAction.check.message}
                  </p>
                </div>
              </div>

              {/* Historical Context Causal-Chain Step Pills */}
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-3">
                  Historical Market Context &amp; Behavioral Insight:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1 */}
                  <div className="bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl p-3.5 relative">
                    <div className="w-5 h-5 rounded-full bg-[#8B93A7] text-white text-[10px] font-extrabold flex items-center justify-center mb-1.5">
                      1
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A7] mb-1">
                      Impulse Trigger
                    </div>
                    <p className="text-xs text-[#14213D] font-medium leading-snug">
                      {pendingCoolingOffAction.check.causalChain.impulse}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-3.5 relative">
                    <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1.5">
                      2
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#C57D25] mb-1">
                      Historical Pattern
                    </div>
                    <p className="text-xs text-[#63451B] font-medium leading-snug">
                      {pendingCoolingOffAction.check.causalChain.historicalPattern}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-3.5 relative">
                    <div className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold flex items-center justify-center mb-1.5">
                      3
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444] mb-1">
                      Long-Term Outcome
                    </div>
                    <p className="text-xs text-[#7F1D1D] font-medium leading-snug">
                      {pendingCoolingOffAction.check.causalChain.longTermOutcome}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note / Disclaimer */}
              <div className="text-[11px] text-[#6B7280] mb-6 p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF]">
                <em>Note: This is an educational pause screen, not personalized financial advice or a trade block. You retain full control over your portfolio decisions.</em>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#EDE9DF]">
                <button
                  type="button"
                  onClick={() => setPendingCoolingOffAction(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancel &amp; Reconsider
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingCoolingOffAction) {
                      applyHoldingChange(pendingCoolingOffAction.id, pendingCoolingOffAction.nextValue);
                      setPendingCoolingOffAction(null);
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
                >
                  I still want to proceed
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
