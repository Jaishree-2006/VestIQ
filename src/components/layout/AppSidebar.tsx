import React from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_PERMISSIONS } from '../../types';
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
  SlidersHorizontal,
  Lock,
  Sparkles
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const { currentPage, navigateTo, setCurrentPage, role, redFlags, healthScore, isPremiumGated } = useApp();
  const perms = ROLE_PERMISSIONS[role];

  const ALL_ITEMS: { id: PageId; label: string; icon: React.ReactNode; badge?: number | string; roleOnly?: typeof role[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roleOnly: ['investor_free', 'investor_premium'] },
    { id: 'holdings', label: 'Holdings', icon: <Layers className="w-4 h-4" />, roleOnly: ['investor_free', 'investor_premium'] },
    { id: 'explainability', label: 'Explainability', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'red-flags', label: 'Red Flags', icon: <AlertTriangle className="w-4 h-4" />, badge: redFlags.length, roleOnly: ['investor_free', 'investor_premium'] },
    { id: 'shock-sandbox', label: 'Shock Sandbox', icon: <Sliders className="w-4 h-4" />, roleOnly: ['investor_free', 'investor_premium'] },
    { id: 'peer-benchmark', label: 'Peer Benchmark', icon: <Users className="w-4 h-4" />, roleOnly: ['investor_free', 'investor_premium'] },
    { id: 'retrospective', label: 'Retrospective', icon: <History className="w-4 h-4" />, roleOnly: ['investor_free', 'investor_premium'] },
    { id: 'broker-console', label: 'Broker Console', icon: <Briefcase className="w-4 h-4" />, badge: 'RM', roleOnly: ['broker_rm', 'admin'] },
    { id: 'compliance', label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" />, badge: 'SEBI', roleOnly: ['compliance_officer', 'admin'] },
    { id: 'admin', label: 'Admin Panel', icon: <SlidersHorizontal className="w-4 h-4" />, roleOnly: ['admin'] },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Filter to only items accessible to or gated for this role
  const menuItems = ALL_ITEMS.filter(item => {
    if (item.roleOnly && !item.roleOnly.includes(role)) return false;
    // Show accessible items and premium-gated items (as locked)
    return perms.canAccess.includes(item.id) || perms.premiumGated.includes(item.id);
  });

  return (
    <aside className="w-64 border-r border-[#E8E4D9] flex flex-col h-screen sticky top-0 p-5 shrink-0 select-none overflow-y-auto" style={{ backgroundColor: '#F7F5EE', backgroundImage: 'none' }}>
      
      {/* Brand Logo */}
      <div 
        onClick={() => setCurrentPage('home')}
        className="flex items-center space-x-2 cursor-pointer mb-8 px-2"
      >
        <span className="text-2xl font-bold tracking-tight text-[#0B1220]">VestIQ</span>
        <span className="text-[10px] font-bold bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] px-1.5 py-0.5 rounded-md">
          {ROLE_PERMISSIONS[role].label}
        </span>
      </div>

      {/* Main App Navigation */}
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          const isGated = isPremiumGated(item.id);
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              title={isGated ? 'Premium feature — click to upgrade' : item.label}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FFF8EE] text-[#C57D25] font-semibold border border-[#F7E5C8] shadow-xs'
                  : isGated
                  ? 'text-[#CBD5E1] hover:bg-[#F1EFE9]'
                  : 'text-[#64748B] hover:text-[#0B1220] hover:bg-[#EFECE3]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-[#C57D25]' : isGated ? 'text-[#CBD5E1]' : 'text-[#8B93A7]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {/* Lock icon for premium gated items, badge for others */}
              {isGated ? (
                <Lock className="w-3 h-3 text-[#C57D25] opacity-60" />
              ) : item.badge !== undefined && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  typeof item.badge === 'number' && item.badge > 0
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

      {/* Bottom Health & Role Status */}
      <div className="pt-4 border-t border-[#E8E4D9] space-y-3">

        {/* Premium upgrade hint for free users */}
        {role === 'investor_free' && (
          <button
            onClick={() => navigateTo('pricing')}
            className="w-full bg-gradient-to-r from-[#FFF8EE] to-[#FDF6E7] rounded-xl p-3 border border-[#F7E5C8] flex items-center space-x-2 cursor-pointer hover:border-[#C57D25] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C57D25] shrink-0" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-[#C57D25]">Upgrade to Premium</div>
              <div className="text-[10px] text-[#8B93A7]">Unlock Sandbox + Peer + Retro</div>
            </div>
          </button>
        )}

        {/* Portfolio Health for investors */}
        {(role === 'investor_free' || role === 'investor_premium') && (
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
        )}

        <button
          onClick={() => setCurrentPage('home')}
          className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-[#8B93A7] hover:text-[#0B1220] py-2 px-3 rounded-lg hover:bg-[#EFECE3] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </button>
      </div>

    </aside>
  );
};
