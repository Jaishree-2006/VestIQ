import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSidebar } from '../layout/AppSidebar';
import { Sliders, RefreshCw, AlertTriangle, TrendingDown, Info, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const ShockSandboxPage: React.FC = () => {
  const { 
    interestRateChange, 
    setInterestRateChange, 
    marketCrashPct, 
    setMarketCrashPct,
    holdings
  } = useApp();

  // Baseline Total Value = ₹18,42,600
  const baseValue = 1842600;

  // Real-time shock impact calculation
  // REITs fall ~15% per +1% rate hike
  // Equities fall by market crash %
  // Sovereign bonds rise or stay stable depending on yield duration
  const reitValue = 712600;
  const equityValue = 820000;
  const bondValue = 310000;

  const shockedReit = reitValue * (1 - (interestRateChange * 0.15));
  const shockedEquity = equityValue * (1 + (marketCrashPct / 100));
  const shockedBond = bondValue * (1 - (interestRateChange * 0.02)); // slight duration drop

  const shockedTotal = Math.round(shockedReit + shockedEquity + shockedBond);
  const totalDifference = shockedTotal - baseValue;
  const pctChange = ((totalDifference / baseValue) * 100).toFixed(1);

  // Simulated Stress Timeline Data for Recharts
  const chartData = [
    { month: 'Baseline', Current: baseValue, Shocked: baseValue },
    { month: 'Month 1', Current: baseValue, Shocked: Math.round(baseValue + (totalDifference * 0.8)) },
    { month: 'Month 3', Current: baseValue, Shocked: shockedTotal },
    { month: 'Month 6', Current: baseValue, Shocked: Math.round(shockedTotal * 1.04) },
    { month: 'Month 12', Current: baseValue, Shocked: Math.round(shockedTotal * 1.10) },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
      <AppSidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EDE9DF]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2BB673]">
              <Sliders className="w-4 h-4" />
              <span>Behavioral Twin Simulation Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#14213D] mt-1">
              Shock Sandbox
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Stress-test your real holdings against central bank rate hikes and market volatility.
            </p>
          </div>

          <button
            onClick={() => {
              setInterestRateChange(1.0);
              setMarketCrashPct(0);
            }}
            className="px-4 py-2.5 bg-white border border-[#EDE9DF] rounded-xl text-sm font-bold text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4ED] transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Scenarios</span>
          </button>
        </div>

        {/* Interactive Sliders Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Slider 1: Interest Rate Hike */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <label className="font-bold text-sm text-[#14213D]">
                RBI Repo Rate Shift
              </label>
              <span className="text-sm font-bold px-3 py-1 bg-[#FFF8EE] text-[#C57D25] rounded-full border border-[#F7E5C8] font-mono-num">
                +{interestRateChange.toFixed(1)}% Rate Hike
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="3"
              step="0.25"
              value={interestRateChange}
              onChange={(e) => setInterestRateChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#C57D25]"
            />

            <div className="flex justify-between text-xs text-[#8B93A7] mt-2 font-mono">
              <span>0.0% (Current)</span>
              <span>+1.5%</span>
              <span>+3.0% (Severe)</span>
            </div>

            <p className="text-sm text-[#6B7280] mt-4 pt-3 border-t border-[#F1EFE9]">
              💡 <strong>Impact mechanism:</strong> REIT & InvIT asset prices fall because cash yields must expand to remain competitive with G-Sec bonds.
            </p>
          </div>

          {/* Slider 2: Equity Market Crash */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9DF] shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <label className="font-bold text-sm text-[#14213D]">
                Nifty Equity Drawdown
              </label>
              <span className="text-sm font-bold px-3 py-1 bg-[#FDF2F2] text-[#EF4444] rounded-full border border-[#FCA5A5] font-mono-num">
                {marketCrashPct}% Crash
              </span>
            </div>

            <input
              type="range"
              min="-35"
              max="0"
              step="5"
              value={marketCrashPct}
              onChange={(e) => setMarketCrashPct(parseInt(e.target.value))}
              className="w-full h-2 bg-[#F1EFE9] rounded-lg appearance-none cursor-pointer accent-[#EF4444]"
            />

            <div className="flex justify-between text-xs text-[#8B93A7] mt-2 font-mono">
              <span>-35% (Crash)</span>
              <span>-15%</span>
              <span>0% (Stable)</span>
            </div>

            <p className="text-sm text-[#6B7280] mt-4 pt-3 border-t border-[#F1EFE9]">
              💡 <strong>Impact mechanism:</strong> Large-cap equity holdings (HDFC Bank, Infosys) reprice according to equity risk premia.
            </p>
          </div>

        </div>

        {/* Live Simulation Impact Banner */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#E6DCCB] shadow-vestiq-lg mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8B93A7] mb-2">
            Simulated Portfolio Valuation Impact
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono-num text-[#14213D]">
                ₹{shockedTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-[#8B93A7] mt-0.5">
                Original Baseline: ₹18,42,600
              </div>
            </div>

            <div className={`text-right sm:text-right ${totalDifference < 0 ? 'text-[#EF4444]' : 'text-[#2BB673]'}`}>
              <div className="text-xl font-bold font-mono-num">
                {totalDifference >= 0 ? '+' : ''}₹{totalDifference.toLocaleString('en-IN')} ({pctChange}%)
              </div>
              <div className="text-sm font-semibold">
                {totalDifference < 0 ? 'Estimated Stress Loss' : 'Capital Preserved'}
              </div>
            </div>
          </div>

          {/* Recharts Live Stress Line Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
                <XAxis dataKey="month" stroke="#8B93A7" fontSize={11} />
                <YAxis stroke="#8B93A7" fontSize={11} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE9DF' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Current" name="Baseline Value" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="Shocked" name="Stress Test Projection" stroke={totalDifference < 0 ? "#EF4444" : "#2BB673"} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

      </main>
    </div>
  );
};
