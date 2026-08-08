import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import type { HoldingItem } from '../../types';
import { computeHealthScorePreview } from '../../utils/healthScore';
import { Layers, Search, Filter, Lightbulb, ExternalLink, ShieldCheck } from 'lucide-react';

export const HoldingsPage: React.FC = () => {
  const { holdings, healthScore, setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [simulationHoldings, setSimulationHoldings] = useState<HoldingItem[]>(holdings);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

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

  const updateSimulationHolding = useCallback((id: string, nextValue: number) => {
    setSimulationHoldings(prev => recalcWeights(prev.map(h => h.id === id ? { ...h, currentValue: nextValue } : h)));
    setIsSimulationActive(true);
  }, [recalcWeights]);

  const adjustHoldingValue = useCallback((id: string, multiplier: number) => {
    setSimulationHoldings(prev => {
      const updated = prev.map(h => {
        if (h.id !== id) return h;
        const nextValue = Math.max(0, Math.round((Number(h.currentValue) || 0) * multiplier));
        return { ...h, currentValue: nextValue };
      });
      return recalcWeights(updated);
    });
    setIsSimulationActive(true);
  }, [recalcWeights]);

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
              Holdings Detail & Drilldown
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
                  <th className="py-3.5 px-3 text-center">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFE9]">
                {filtered.map((item) => {
                  const baseline = baselineById.get(item.id);
                  const valueChanged = baseline ? baseline.currentValue !== item.currentValue : false;
                  const deltaValue = baseline ? item.currentValue - baseline.currentValue : 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#14213D]">
                        <div>{item.name}</div>
                        <div className="text-xs text-[#8B93A7] font-mono">{item.ticker} • {item.units} Units @ ₹{item.currentPrice}</div>
                      </td>
                      <td className="py-3.5 px-3 uppercase text-xs font-semibold text-[#6B7280]">
                        {item.category.replace('_', ' ')}
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
                        <div className="grid gap-2">
                          <button
                            type="button"
                            onClick={() => adjustHoldingValue(item.id, 1.1)}
                            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#14213D] bg-[#F8FAF5] border border-[#E5E7EB] hover:bg-[#ECF9EA]"
                          >
                            +10%
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustHoldingValue(item.id, 0.9)}
                            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#14213D] bg-[#FFFAF0] border border-[#F2E7D6] hover:bg-[#FFF1DB]"
                          >
                            -10%
                          </button>
                          <button
                            type="button"
                            onClick={() => resetHoldingSimulation(item.id)}
                            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-[#6B7280] bg-[#F1F5F9] border border-[#E2E8F0] hover:bg-[#E2E8F0]"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setCurrentPage('explainability')}
                          className="px-3 py-1 bg-[#FFF8EE] hover:bg-[#F7E5C8] text-[#C57D25] rounded-lg border border-[#F7E5C8] font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Inspect Chain</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
