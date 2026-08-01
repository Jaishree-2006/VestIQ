import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import type { HoldingItem } from '../../types';
import { Layers, Search, Filter, Lightbulb, ExternalLink } from 'lucide-react';

export const HoldingsPage: React.FC = () => {
  const { holdings, setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = holdings.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || h.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Layers className="w-4 h-4" />
              <span>Multi-Asset Portfolio Detail</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1220] mt-1">
              Holdings Detail & Drilldown
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Unified view of all instruments across Zerodha, Groww, ICICI Direct, and RBI Retail Direct.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
            <input
              type="text"
              placeholder="Search by name or ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25]"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'equities', 'bonds', 'reits_invits'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-[#C57D25] text-white border-[#C57D25]'
                    : 'bg-white text-[#64748B] border-[#EDE9DF] hover:bg-[#FAF8F5]'
                }`}
              >
                {cat === 'all' ? 'All Holdings' : cat.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-[#EDE9DF] p-6 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EDE9DF] text-[#8B93A7] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-3">Instrument</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Depository / Broker</th>
                  <th className="py-3.5 px-3 text-right">Current Value</th>
                  <th className="py-3.5 px-3 text-right">Weight</th>
                  <th className="py-3.5 px-3 text-center">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EFE9]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#0B1220]">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-[#8B93A7] font-mono">{item.ticker} • {item.units} Units @ ₹{item.currentPrice}</div>
                    </td>
                    <td className="py-3.5 px-3 uppercase text-[10px] font-semibold text-[#64748B]">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-3 text-[#475569]">
                      {item.broker} ({item.depository})
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-bold text-[#0B1220]">
                      ₹{item.currentValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-[#64748B]">
                      {item.portfolioWeight}%
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setCurrentPage('explainability')}
                        className="px-2.5 py-1 bg-[#FFF8EE] hover:bg-[#F7E5C8] text-[#C57D25] rounded-lg border border-[#F7E5C8] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>Inspect Chain</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
