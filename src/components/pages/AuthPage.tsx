import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { setCurrentPage, role, setRole } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'broker_rm') setCurrentPage('broker-console');
    else if (role === 'compliance_officer') setCurrentPage('compliance');
    else if (role === 'admin') setCurrentPage('admin');
    else setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0B1220] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#EDE9DF] shadow-vestiq-lg max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          
          {/* Left Form */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <h2 className="text-2xl font-extrabold text-[#0B1220] mb-1">Welcome to VestIQ</h2>
            <p className="text-xs text-[#64748B] mb-6">Log in to view your multi-asset portfolio intelligence.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1220] mb-1">Email or PAN ID</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.k@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1220] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE9DF] text-xs font-medium focus:outline-none focus:border-[#C57D25]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Right Quote Panel */}
          <div className="bg-[#FFF8EE] p-8 sm:p-10 border-t md:border-t-0 md:border-l border-[#F7E5C8] flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C57D25] bg-white px-2.5 py-1 rounded-full border border-[#F7E5C8]">
                Explainability First
              </span>
              <blockquote className="text-base font-bold text-[#63451B] mt-6 leading-relaxed">
                "Risk scores alone don't protect retail capital. Giving investors plain-English causal chains is what transforms panic selling into rational retention."
              </blockquote>
            </div>

            <div className="text-xs text-[#8B93A7] pt-6 border-t border-[#F7E5C8]">
              Verified SEBI-aligned RBAC authentication layer.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
