import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { RETROSPECTIVE_SIM_DATA } from '../../data/mockData';
import { History, Sparkles, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const RetrospectivePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#14213D]">
              <History className="w-4 h-4" />
              <span>Behavioral Education Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              Retrospective Simulator ("What If" Timeline)
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Analyze how historical allocation adjustments over the past 24 months would have protected your wealth.
            </p>
          </div>
        </div>

        {/* Recharts Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-[#14213D] mb-4">
            Actual Portfolio Trajectory vs. Risk-Adjusted Optimal Strategy
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RETROSPECTIVE_SIM_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} />
                <YAxis stroke="#8B93A7" fontSize={11} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE9DF' }} />
                <Legend />
                <Line type="monotone" dataKey="actualValue" name="Your Actual Portfolio" stroke="#C57D25" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="optimizedValue" name="Optimal Risk-Managed Strategy" stroke="#2BB673" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="benchmarkNifty" name="Nifty 50 Benchmark" stroke="#94A3B8" strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* What-If Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#EDE9DF] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-2">Simulated Outcome</div>
            <h4 className="text-2xl font-extrabold font-mono-num text-[#2BB673] mb-2">+₹2,42,400 Additional Value</h4>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              If you had rebalanced 15% out of REIT concentration into Sovereign Bonds in July 2024, your total portfolio value today would be <strong>₹20,85,000</strong> instead of ₹18,42,600.
            </p>
          </div>

          <div className="bg-[#E6F4EA] p-6 rounded-3xl border border-[#A7F3D0]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#2BB673] mb-2">Behavioral Insight</div>
            <h4 className="text-lg font-bold text-[#14213D] mb-2">Constructive Forward Guidance</h4>
            <p className="text-xs text-[#15803D] leading-relaxed">
              This simulator is designed to guide future asset allocation decisions rather than cause regret. Small reallocations in rate-sensitive cycles compound into significant long-term stability.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};
