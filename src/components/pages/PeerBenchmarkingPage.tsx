import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { PEER_BENCHMARK_DATA } from '../../data/mockData';
import { Users, Info, TrendingUp, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const PeerBenchmarkingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#C57D25]">
              <Users className="w-4 h-4" />
              <span>Anonymized Cohort Benchmarking</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              Peer Benchmarking
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Compare your asset allocation against anonymized investors in your age band (28–35 years) and income cohort.
            </p>
          </div>

          <div className="bg-[#FFF8EE] px-3 py-1.5 rounded-xl border border-[#F7E5C8] text-xs font-semibold text-[#63451B]">
            Cohort: Moderate Risk • ₹15L–25L Tier
          </div>
        </div>

        {/* Recharts Bar Comparison */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-[#14213D] mb-4">
            Asset Allocation (%) vs. Peer Cohort & Top Quartile Performers
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PEER_BENCHMARK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="category" stroke="#8B93A7" fontSize={11} />
                <YAxis stroke="#8B93A7" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE9DF' }} />
                <Legend />
                <Bar dataKey="userPct" name="Your Portfolio" fill="#C57D25" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peerAvgPct" name="Peer Average" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="topQuartilePct" name="Top Quartile Performers" fill="#2BB673" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight Box */}
        <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#F7E5C8]">
          <h4 className="font-bold text-sm text-[#63451B] mb-2 flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#C57D25]" />
            <span>Key Peer Cohort Takeaway</span>
          </h4>
          <p className="text-xs text-[#475569] leading-relaxed">
            Investors in your income bracket hold <strong>38.7% in REITs/InvITs</strong>, which is over 3x higher than the peer average of 12%. Rebalancing towards high-grade corporate bonds or liquid cash will align your portfolio with top-quartile stability.
          </p>
        </div>

      </main>
    </div>
  );
};
