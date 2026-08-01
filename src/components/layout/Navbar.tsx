import React from 'react';
import { useApp } from '../../context/AppContext';
import type { PageId, UserRole } from '../../types';
import { ShieldCheck, User, Sparkles, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, role, setRole } = useApp();

  const publicPages: { id: PageId; label: string }[] = [
    { id: 'home', label: 'Product' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'for-brokers', label: 'For brokers' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'about', label: 'About' },
  ];

  const roleLabels: Record<UserRole, string> = {
    investor_free: 'Investor (Free)',
    investor_premium: 'Investor (Premium)',
    broker_rm: 'Broker / RM',
    compliance_officer: 'Compliance Officer',
    admin: 'Platform Admin'
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EDE9DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentPage('home')}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#C57D25] flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-[#B06C19] transition-colors">
            V
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#0B1220]">
            VestIQ
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {publicPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentPage === page.id
                  ? 'text-[#0B1220] font-semibold'
                  : 'text-[#64748B] hover:text-[#0B1220]'
              }`}
            >
              {page.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons & Persona Switcher */}
        <div className="flex items-center space-x-4">
          
          {/* Persona Switcher Selector */}
          <div className="relative group">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3EFE6] text-[#63451B] border border-[#E6DCCB] cursor-pointer hover:bg-[#EBE4D5] transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C57D25]" />
              <span>Role: {roleLabels[role]}</span>
              <ChevronDown className="w-3 h-3 text-[#63451B]" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-[#EDE9DF] py-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8B93A7] uppercase tracking-wider">
                Select RBAC Persona
              </div>
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    if (r === 'broker_rm') setCurrentPage('broker-console');
                    else if (r === 'compliance_officer') setCurrentPage('compliance');
                    else if (r === 'admin') setCurrentPage('admin');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-[#FAF8F5] transition-colors ${
                    role === r ? 'text-[#C57D25] font-bold bg-[#FAF8F5]' : 'text-[#0B1220]'
                  }`}
                >
                  <span>{roleLabels[r]}</span>
                  {role === r && <Sparkles className="w-3 h-3 text-[#C57D25]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Go to App / Get Started Button */}
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#C57D25] text-white hover:bg-[#B06C19] transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
          >
            <span>Open App</span>
          </button>
        </div>

      </div>
    </header>
  );
};
