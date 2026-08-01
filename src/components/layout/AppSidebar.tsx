import React from 'react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';
import { 
  LayoutDashboard, 
  Layers, 
  Lightbulb, 
  AlertTriangle, 
  Sliders, 
  Users, 
  History, 
  Briefcase, 
  ShieldCheck, 
  Settings, 
  ArrowLeft,
  SlidersHorizontal
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const { currentPage, setCurrentPage, role, redFlags, healthScore } = useApp();

  const menuItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'holdings', label: 'Holdings', icon: <Layers className="w-4 h-4" /> },
    { id: 'explainability', label: 'Explainability', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'red-flags', label: 'Red flags', icon: <AlertTriangle className="w-4 h-4" />, badge: redFlags.length },
    { id: 'shock-sandbox', label: 'Shock sandbox', icon: <Sliders className="w-4 h-4" /> },
    { id: 'peer-benchmark', label: 'Peer benchmark', icon: <Users className="w-4 h-4" /> },
    { id: 'retrospective', label: 'Retrospective', icon: <History className="w-4 h-4" /> },
  ];

  if (role === 'broker_rm' || role === 'admin') {
    menuItems.push({ id: 'broker-console', label: 'Broker Console', icon: <Briefcase className="w-4 h-4" />, badge: 'RM' });
  }

  if (role === 'compliance_officer' || role === 'admin') {
    menuItems.push({ id: 'compliance', label: 'Compliance Dashboard', icon: <ShieldCheck className="w-4 h-4" />, badge: 'SEBI' });
  }

  if (role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: <SlidersHorizontal className="w-4 h-4" /> });
  }

  menuItems.push({ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> });

  return (
    <aside className="w-64 bg-[#F7F5EE] border-r border-[#E8E4D9] flex flex-col min-h-screen p-5 shrink-0 select-none">
      
      {/* Brand Logo */}
      <div 
        onClick={() => setCurrentPage('home')}
        className="flex items-center space-x-2 cursor-pointer mb-8 px-2"
      >
        <span className="text-2xl font-bold tracking-tight text-[#0B1220]">
          VestIQ
        </span>
      </div>

      {/* Main App Navigation */}
      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FFF8EE] text-[#C57D25] font-semibold border border-[#F7E5C8] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0B1220] hover:bg-[#EFECE3]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-[#C57D25]' : 'text-[#8B93A7]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  item.badge === redFlags.length 
                    ? 'bg-[#FDF2F2] text-[#EF4444] border border-[#FCA5A5]' 
                    : 'bg-[#E6F4EA] text-[#2BB673]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Health & Role Status Indicator */}
      <div className="pt-4 border-t border-[#E8E4D9] space-y-3">
        <div className="bg-white rounded-xl p-3 border border-[#E8E4D9] shadow-xs">
          <div className="text-[11px] text-[#8B93A7] font-medium flex justify-between items-center mb-1">
            <span>Portfolio Health</span>
            <span className="font-bold text-[#C57D25]">{healthScore}/100</span>
          </div>
          <div className="w-full bg-[#F1EFE9] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#C57D25] h-full rounded-full transition-all duration-500"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setCurrentPage('home')}
          className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-[#8B93A7] hover:text-[#0B1220] py-2 px-3 rounded-lg hover:bg-[#EFECE3] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Landing</span>
        </button>
      </div>

    </aside>
  );
};
