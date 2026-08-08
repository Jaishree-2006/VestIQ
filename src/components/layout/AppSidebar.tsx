import React, { useState, useEffect, useCallback } from 'react';
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
  SlidersHorizontal,
  Lock,
  Sparkles,
  Menu,
  X,
  LogOut
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const { currentPage, navigateTo, setCurrentPage, role, redFlags, healthScore, isPremiumGated, userRecord, trialDaysRemaining, userName, signOut } = useApp();
  const perms = ROLE_PERMISSIONS[role];
  const isActiveTrial = userRecord.plan === 'premium_trial' && (trialDaysRemaining !== null && trialDaysRemaining > 0);
  const isExpiredTrial = userRecord.plan === 'premium_trial' && trialDaysRemaining === 0;
  const isFree = userRecord.plan === 'free';

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on viewport resize to md+
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setMobileOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
    return perms.canAccess.includes(item.id) || perms.premiumGated.includes(item.id);
  });

  const handleNavClick = useCallback((pageId: PageId) => {
    navigateTo(pageId);
    setMobileOpen(false);
  }, [navigateTo]);

  const handleLogoClick = useCallback(() => {
    setCurrentPage('home');
    setMobileOpen(false);
  }, [setCurrentPage]);

  /* ── Sidebar inner content (shared between mobile drawer and desktop panel) ─ */
  const SidebarContent = () => (
    <>
      {/* Brand Logo */}
      <div 
        onClick={handleLogoClick}
        className="flex items-center space-x-2 cursor-pointer mb-8 px-2"
      >
        <span className="text-2xl font-bold tracking-tight text-[#14213D]">VestIQ</span>
        <span className="text-xs font-bold bg-[#FFF8EE] text-[#C57D25] border border-[#F7E5C8] px-2 py-0.5 rounded-md">
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
              onClick={() => handleNavClick(item.id)}
              title={isGated ? 'Premium feature — click to upgrade' : item.label}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FFF8EE] text-[#C57D25] font-semibold border border-[#F7E5C8] shadow-xs'
                  : isGated
                  ? 'text-[#CBD5E1] hover:bg-[#F1EFE9]'
                  : 'text-[#6B7280] hover:text-[#14213D] hover:bg-[#EFECE3]'
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
                <Lock className="w-3.5 h-3.5 text-[#C57D25] opacity-60" />
              ) : item.badge !== undefined && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
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

        {/* Trial countdown — shown only for active premium_trial users */}
        {isActiveTrial && (
          <div className="w-full bg-gradient-to-r from-[#FFF8EE] to-[#FDF6E7] rounded-xl p-3 border border-[#F7E5C8] flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#C57D25] shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-[#C57D25]">Trial Active</div>
              <div className="text-xs text-[#8B93A7]">{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining</div>
            </div>
            <div className="ml-auto bg-[#C57D25] text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
              {trialDaysRemaining}d
            </div>
          </div>
        )}

        {/* Expired trial banner — prompt to upgrade */}
        {isExpiredTrial && (
          <button
            onClick={() => { navigateTo('pricing'); setMobileOpen(false); }}
            className="w-full bg-[#FDF2F2] rounded-xl p-3 border border-[#FCA5A5] flex items-center space-x-2 cursor-pointer hover:border-[#EF4444] transition-colors"
          >
            <Lock className="w-4 h-4 text-[#EF4444] shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-[#EF4444]">Trial Ended</div>
              <div className="text-xs text-[#8B93A7]">Upgrade to keep access</div>
            </div>
          </button>
        )}

        {/* Free tier upgrade prompt */}
        {isFree && role === 'investor_free' && (
          <button
            onClick={() => { navigateTo('pricing'); setMobileOpen(false); }}
            className="w-full bg-gradient-to-r from-[#FFF8EE] to-[#FDF6E7] rounded-xl p-3 border border-[#F7E5C8] flex items-center space-x-2 cursor-pointer hover:border-[#C57D25] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#C57D25] shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-[#C57D25]">Upgrade to Premium</div>
              <div className="text-xs text-[#8B93A7]">Unlock Sandbox + Peer + Retro</div>
            </div>
          </button>
        )}

        {/* Portfolio Health for investors */}
        {(role === 'investor_free' || role === 'investor_premium') && (
          <div className="bg-white rounded-xl p-3 border border-[#E8E4D9] shadow-xs">
            <div className="text-xs text-[#8B93A7] font-medium flex justify-between items-center mb-1">
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

        {/* User profile & Sign Out card */}
        <div className="bg-white rounded-xl p-3 border border-[#E8E4D9] shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#C57D25] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-xs font-bold text-[#14213D] truncate">{userName}</div>
          </div>
          <button
            onClick={() => { signOut(); setMobileOpen(false); }}
            title="Sign Out"
            className="text-[#8B93A7] hover:text-[#EF4444] transition-colors p-1.5 rounded-lg hover:bg-[#FAF8F5] cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar (visible only below md) ───────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-[#E8E4D9]"
        style={{ backgroundColor: '#F7F5EE' }}
      >
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center space-x-2"
          aria-label="Go to home"
        >
          <span className="text-xl font-bold tracking-tight text-[#14213D]">VestIQ</span>
        </button>

        {/* Hamburger — 44×44px touch target */}
        <button
          id="sidebar-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center rounded-xl text-[#14213D] hover:bg-[#EFECE3] transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile top bar spacer — pushes page content down so it's not behind the bar */}
      <div className="md:hidden h-14 shrink-0" />

      {/* ── Mobile backdrop ───────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-over drawer ─────────────────────────────────────────── */}
      <aside
        className={`
          md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col p-5 select-none overflow-y-auto
          border-r border-[#E8E4D9] shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#F7F5EE', backgroundImage: 'none' }}
        aria-label="Navigation drawer"
      >
        {/* Close button inside drawer */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="absolute top-3 right-3 flex items-center justify-center rounded-xl text-[#6B7280] hover:bg-[#EFECE3] transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent />
      </aside>

      {/* ── Desktop persistent sidebar (visible only at md+) ─────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 border-r border-[#E8E4D9] h-screen sticky top-0 p-5 shrink-0 select-none overflow-y-auto"
        style={{ backgroundColor: '#F7F5EE', backgroundImage: 'none' }}
        aria-label="Navigation sidebar"
      >
        <SidebarContent />
      </aside>
    </>
  );
};
