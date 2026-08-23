import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import type { HoldingItem } from '../../types';
import { computeHealthScorePreview } from '../../utils/healthScore';
import { Layers, Search, Filter, Lightbulb, ExternalLink, ShieldCheck, X, ArrowRight, Percent, IndianRupee, Sparkles, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { GlossaryTerm } from '../ui/GlossaryTerm';
import { BrokerCredentialBadge } from '../ui/BrokerCredentialBadge';

interface PendingAdjustment {
  id: string;
  multiplier: number;
  holdingName: string;
  pctReduction: number;
  triggerReason: 'large_sell' | 'recent_dip';
}

export const HoldingsPage: React.FC = () => {
  const { holdings, healthScore, setCurrentPage, healthScoreEvents } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [simulationHoldings, setSimulationHoldings] = useState<HoldingItem[]>(holdings);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [selectedHoldingForDrawer, setSelectedHoldingForDrawer] = useState<HoldingItem | null>(null);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);

  useEffect(() => {
    setSimulationHoldings(holdings);
    setIsSimulationActive(false);
  }, [holdings]);

  const isRecentSharpDrop = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (healthScoreEvents || []).some((e) => {
      const eventTime = new Date(e.timestamp).getTime();
      return !isNaN(eventTime) && eventTime >= sevenDaysAgo && (e.delta < 0 || e.triggerType === 'flag_created');
    });
  }, [healthScoreEvents]);

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

  const handleRequestAdjustment = useCallback((id: string, multiplier: number) => {
    const pctReduction = Math.round((1 - multiplier) * 100);
    const isLargeSell = multiplier <= 0.75; // >25% reduction
    const isDipSell = multiplier < 1.0 && isRecentSharpDrop;

    if (isLargeSell || isDipSell) {
      const target = simulationHoldings.find(h => h.id === id) || holdings.find(h => h.id === id);
      setPendingAdjustment({
        id,
        multiplier,
        holdingName: target?.name || 'Selected Holding',
        pctReduction: Math.max(0, pctReduction),
        triggerReason: isLargeSell ? 'large_sell' : 'recent_dip',
      });
    } else {
      adjustHoldingValue(id, multiplier);
    }
  }, [adjustHoldingValue, holdings, isRecentSharpDrop, simulationHoldings]);

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
              {['all', 'equities', 'bonds', 'reits_invits', 'mutual_funds'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
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
                  <th className="py-3.5 px-3 text-center">Cost X-Ray</th>
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
                      <td
                        onClick={() => setSelectedHoldingForDrawer(item)}
                        className="py-3.5 px-3 font-bold text-[#14213D] cursor-pointer group"
                      >
                        <div className="group-hover:text-[#C57D25] transition-colors">{item.name}</div>
                        <div className="text-xs text-[#8B93A7] font-mono">{item.ticker} • {item.units} Units @ ₹{item.currentPrice}</div>
                      </td>
                      <td className="py-3.5 px-3 uppercase text-xs font-semibold text-[#6B7280]">
                        {item.category === 'reits_invits' ? (
                          <span className="flex items-center gap-1">
                            <GlossaryTerm term="reit">REIT</GlossaryTerm>
                            {' / '}
                            <GlossaryTerm term="invit">InvIT</GlossaryTerm>
                          </span>
                        ) : item.category === 'mutual_funds' ? (
                          <span>Mutual Funds</span>
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
                        <button
                          onClick={() => setSelectedHoldingForDrawer(item)}
                          className="px-3 py-1 bg-[#FFF8EE] hover:bg-[#F7E5C8] text-[#C57D25] rounded-lg border border-[#F7E5C8] font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Percent className="w-3 h-3" />
                          <span>Cost X-Ray</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="grid grid-cols-2 gap-1.5 min-w-[130px]">
                          <button
                            type="button"
                            onClick={() => handleRequestAdjustment(item.id, 1.1)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#14213D] bg-[#F8FAF5] border border-[#E5E7EB] hover:bg-[#ECF9EA] cursor-pointer"
                          >
                            +10%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAdjustment(item.id, 0.9)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#14213D] bg-[#FFFAF0] border border-[#F2E7D6] hover:bg-[#FFF1DB] cursor-pointer"
                          >
                            -10%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAdjustment(item.id, 0.7)}
                            className="rounded-xl px-2 py-1 text-[11px] font-bold text-[#EF4444] bg-[#FDF2F2] border border-[#FCA5A5] hover:bg-[#FEE2E2] cursor-pointer"
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

        {/* Holdings Detail Drawer / Modal */}
        {selectedHoldingForDrawer && (() => {
          const item = selectedHoldingForDrawer;
          const expRatio = item.expense_ratio_pct ?? null;
          const exitLoad = item.exit_load_pct ?? null;
          const brokerage = item.brokerage_pct ?? null;
          const benchmarkRatio = item.benchmark_expense_ratio_pct ?? (item.category === 'mutual_funds' ? 0.3 : null);

          const annualExpCost = expRatio ? Math.round((item.currentValue * expRatio) / 100) : 0;
          const annualBenchmarkCost = benchmarkRatio ? Math.round((item.currentValue * benchmarkRatio) / 100) : 0;
          const annualDiffCost = Math.max(0, annualExpCost - annualBenchmarkCost);

          const hasComparison = expRatio !== null && expRatio > 0.5 && benchmarkRatio !== null;

          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#EDE9DF] shadow-2xl overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-start justify-between pb-4 mb-6 border-b border-[#EDE9DF]">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8]">
                        {item.category.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-[#8B93A7] font-mono">
                        {item.ticker} • {item.broker} ({item.depository})
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#14213D]">
                      {item.name}
                    </h3>
                    <div className="mt-2">
                      <BrokerCredentialBadge
                        brokerName={item.broker}
                        brokerRegNumber={item.broker_reg_number}
                        rmName={item.rm_name}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedHoldingForDrawer(null)}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EDE9DF] text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4ED] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Section: Position Overview */}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-3">
                    Position Overview
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">Current Value</div>
                      <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                        ₹{item.currentValue.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">{item.portfolioWeight}% of total</div>
                    </div>
                    <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">Units & Avg Price</div>
                      <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                        {item.units} @ ₹{item.avgPrice}
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">LTP ₹{item.currentPrice}</div>
                    </div>
                    <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">
                        <GlossaryTerm term="lock-in period">Lock-in Window</GlossaryTerm>
                      </div>
                      <div className="font-extrabold text-[#14213D] text-sm mt-0.5 font-mono-num">
                        {item.lockInMonths > 0 ? `${item.lockInMonths} Months` : 'Liquid (0 Mo)'}
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">SEBI liquidity status</div>
                    </div>
                    <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">SEBI Risk Band</div>
                      <div className="font-extrabold text-[#14213D] text-sm mt-0.5">
                        {item.riskCategory}
                      </div>
                      <div className="text-[10px] text-[#2BB673] font-bold mt-0.5">
                        <GlossaryTerm term="suitability score">Score</GlossaryTerm>: {item.suitabilityScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Cost Breakdown */}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-3 flex items-center space-x-1.5">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Cost Breakdown</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                    {/* Stat 1: Expense Ratio (TER) */}
                    <div className="p-3.5 bg-[#FFF8EE] rounded-2xl border border-[#F7E5C8]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">
                        <GlossaryTerm term="ter">Total Expense Ratio (TER)</GlossaryTerm>
                      </div>
                      <div className="font-extrabold text-[#C57D25] text-base mt-0.5 font-mono-num">
                        {expRatio !== null ? `${expRatio}% p.a.` : 'Nil / N/A'}
                      </div>
                      <div className="text-[11px] text-[#63451B] mt-1 font-semibold">
                        {expRatio !== null
                          ? `≈ ₹${annualExpCost.toLocaleString('en-IN')}/year on this holding`
                          : 'No recurring management fee'}
                      </div>
                    </div>

                    {/* Stat 2: Exit Load */}
                    <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">
                        <GlossaryTerm term="exit load">Exit Load</GlossaryTerm>
                      </div>
                      <div className="font-extrabold text-[#14213D] text-base mt-0.5 font-mono-num">
                        {exitLoad !== null ? `${exitLoad}%` : 'Nil'}
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-1">
                        {exitLoad !== null && exitLoad > 0
                          ? `Applicable if liquidated within exit period`
                          : 'Zero redemption exit penalty'}
                      </div>
                    </div>

                    {/* Stat 3: Brokerage & Transaction Charges */}
                    <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EDE9DF]">
                      <div className="text-[#8B93A7] text-[10px] font-bold uppercase">
                        <GlossaryTerm term="brokerage">Brokerage</GlossaryTerm> &amp; Charges
                      </div>
                      <div className="font-extrabold text-[#14213D] text-base mt-0.5 font-mono-num">
                        {brokerage !== null ? `${brokerage}%` : '0.0%'}
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-1">
                        {brokerage !== null && brokerage > 0
                          ? `≈ ₹${Math.round((item.currentValue * brokerage) / 100).toLocaleString('en-IN')} on trade value`
                          : 'Zero delivery brokerage'}
                      </div>
                    </div>
                  </div>

                  {/* Causal-Chain Lower-Cost Comparison Pill */}
                  {hasComparison && (
                    <div className="bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Lower-Cost Alternative <GlossaryTerm term="causal chain">Causal Chain</GlossaryTerm></span>
                      </div>

                      {/* Inline Causal-Chain Pills */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] rounded-xl text-xs font-bold">
                          {expRatio}% <GlossaryTerm term="expense ratio">expense ratio</GlossaryTerm>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8B93A7] shrink-0" />
                        <span className="px-3 py-1 bg-[#FAF8F5] border border-[#EDE9DF] text-[#475569] rounded-xl text-xs font-bold">
                          vs ~{benchmarkRatio}% for a comparable <GlossaryTerm term="benchmark">index fund</GlossaryTerm>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8B93A7] shrink-0" />
                        <span className="px-3 py-1 bg-[#E6F4EA] border border-[#A7F3D0] text-[#2BB673] rounded-xl text-xs font-bold">
                          ₹{annualDiffCost.toLocaleString('en-IN')}/year difference
                        </span>
                      </div>

                      {/* 3-Step Connected Causal Breakdown matching Explainability Center */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white border border-[#EDE9DF] rounded-xl p-3">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1.5">
                            1
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C57D25]">
                            Active <GlossaryTerm term="ter">TER</GlossaryTerm> Drag
                          </div>
                          <div className="text-xs font-extrabold text-[#14213D] mt-0.5">
                            {expRatio}% / year
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-1">
                            Ongoing management fee deducted from <GlossaryTerm term="nav">NAV</GlossaryTerm>
                          </p>
                        </div>

                        <div className="bg-white border border-[#EDE9DF] rounded-xl p-3">
                          <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white text-[10px] font-extrabold flex items-center justify-center mb-1.5">
                            2
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C57D25]">
                            Direct Alternative
                          </div>
                          <div className="text-xs font-extrabold text-[#14213D] mt-0.5">
                            ~{benchmarkRatio}% / year
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-1">
                            Comparable direct index/passive alternative
                          </p>
                        </div>

                        <div className="bg-[#E6F4EA] border border-[#A7F3D0] rounded-xl p-3">
                          <div className="w-5 h-5 rounded-full bg-[#2BB673] text-white text-[10px] font-extrabold flex items-center justify-center mb-1.5">
                            3
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#2BB673]">
                            Compounding Drag
                          </div>
                          <div className="text-xs font-extrabold text-[#166534] mt-0.5">
                            ₹{annualDiffCost.toLocaleString('en-IN')} / year
                          </div>
                          <p className="text-[11px] text-[#166534] mt-1">
                            Cumulative capital retained if reallocated
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-4 border-t border-[#EDE9DF]">
                  <button
                    onClick={() => {
                      setSelectedHoldingForDrawer(null);
                      setCurrentPage('explainability');
                    }}
                    className="px-4 py-2 bg-[#FFF8EE] hover:bg-[#F7E5C8] text-[#C57D25] border border-[#F7E5C8] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>View in Explainability Center</span>
                  </button>

                  <button
                    onClick={() => setSelectedHoldingForDrawer(null)}
                    className="px-5 py-2 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Behavioral Cooling-Off Nudge Modal */}
        {pendingAdjustment && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#EDE9DF] shadow-2xl flex flex-col">
              
              {/* Top Caution Header */}
              <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-[#EDE9DF]">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF8EE] border border-[#F7E5C8] flex items-center justify-center text-[#C57D25] shrink-0 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#C57D25]">
                    Behavioral Cooling-Off Check
                  </div>
                  <h3 className="text-lg font-extrabold text-[#14213D]">
                    Pause Before Simulating Large Sell
                  </h3>
                </div>
              </div>

              {/* Amber / Gold Caution Box */}
              <div className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-4 mb-4 text-xs text-[#63451B] leading-relaxed">
                <div className="font-bold text-[#C57D25] mb-1 flex items-center space-x-1.5">
                  <span>Detected Trigger:</span>
                  <span className="font-mono uppercase font-extrabold">
                    {pendingAdjustment.triggerReason === 'large_sell'
                      ? `${pendingAdjustment.pctReduction}% Reduction on ${pendingAdjustment.holdingName}`
                      : 'Sell Action Following Recent Score Dip'}
                  </span>
                </div>
                <p>
                  {pendingAdjustment.triggerReason === 'large_sell'
                    ? `You are testing a large reduction (${pendingAdjustment.pctReduction}%) on ${pendingAdjustment.holdingName}. Rapid liquidation of concentrated assets during emotional market phases can lock in permanent drawdowns.`
                    : `Your portfolio experienced a recent score decline within the last 7 days. Selling during sharp market pullbacks often turns temporary paper markdowns into realized permanent capital loss.`}
                </p>
              </div>

              {/* Historical Context Causal-Chain Box */}
              <div className="bg-[#FAF8F5] border border-[#EDE9DF] rounded-2xl p-4 mb-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B93A7] mb-2 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C57D25]" />
                  <span>Historical Market Context</span>
                </div>

                {/* Causal pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs mb-3">
                  <span className="px-2.5 py-1 bg-[#FFF8EE] border border-[#F7E5C8] text-[#C57D25] rounded-lg font-bold text-[11px]">
                    Market Dip
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#8B93A7] shrink-0" />
                  <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#EDE9DF] text-[#475569] rounded-lg font-bold text-[11px]">
                    Hasty Exit
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#8B93A7] shrink-0" />
                  <span className="px-2.5 py-1 bg-[#FDF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-lg font-bold text-[11px]">
                    Locked-in Losses
                  </span>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">
                  Markets that dropped this much historically recovered over the following months in most cases — selling during a dip can lock in losses that a recovery would have reversed.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#EDE9DF]">
                <button
                  onClick={() => setPendingAdjustment(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-[#EDE9DF] hover:bg-[#FAF8F5] text-[#14213D] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Pause & Keep Current Allocation
                </button>

                <button
                  onClick={() => {
                    adjustHoldingValue(pendingAdjustment.id, pendingAdjustment.multiplier);
                    setPendingAdjustment(null);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
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

