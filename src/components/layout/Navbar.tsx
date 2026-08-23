import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { PageId, UserRole } from '../../types';
import { ShieldCheck, ChevronDown, User, Crown, Briefcase, Settings, CheckCircle2 } from 'lucide-react';
import { LanguageToggle } from '../ui/LanguageToggle';

interface NavItem {
  id: string;
  label: string;
  type: 'anchor' | 'route';
  href: string;
  pageId?: PageId;
}

interface PersonaConfig {
  id: UserRole;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
}

export const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, role, setRole, isAuthenticated, signOut, userName } = useApp();
  const [activeSection, setActiveSection] = useState<string>('product');
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const personaDropdownRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { id: 'product', label: 'Product', type: 'anchor', href: '#product' },
    { id: 'how-it-works', label: 'How it works', type: 'anchor', href: '#how-it-works' },
    { id: 'for-brokers', label: 'For brokers', type: 'route', href: '/#for-brokers', pageId: 'for-brokers' },
    { id: 'pricing', label: 'Pricing', type: 'anchor', href: '#pricing' },
    { id: 'about', label: 'About', type: 'route', href: '/#about', pageId: 'about' },
  ];

  const roleLabels: Record<UserRole, string> = {
    investor_free: 'Investor (Free)',
    investor_premium: 'Investor (Premium)',
    broker_rm: 'Broker / RM',
    compliance_officer: 'Compliance Officer',
    admin: 'Platform Admin'
  };

  const personaConfigs: PersonaConfig[] = [
    {
      id: 'investor_free',
      label: 'Investor (Free)',
      subtitle: 'Track portfolio, view insights and SEBI red flags.',
      icon: User,
      iconBg: 'bg-[#FFF8EE]',
      iconColor: 'text-[#C57D25]',
      iconBorder: 'border-[#F7E5C8]',
    },
    {
      id: 'investor_premium',
      label: 'Investor (Premium)',
      subtitle: 'Advanced analytics, premium insights and alerts.',
      icon: Crown,
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#2563EB]',
      iconBorder: 'border-[#BFDBFE]',
    },
    {
      id: 'broker_rm',
      label: 'Broker / RM',
      subtitle: 'Manage clients, portfolios and advisory insights.',
      icon: Briefcase,
      iconBg: 'bg-[#E6F4EA]',
      iconColor: 'text-[#16A34A]',
      iconBorder: 'border-[#A7F3D0]',
    },
    {
      id: 'compliance_officer',
      label: 'Compliance Officer',
      subtitle: 'Monitor compliance, alerts and regulatory activities.',
      icon: ShieldCheck,
      iconBg: 'bg-[#F3E8FF]',
      iconColor: 'text-[#9333EA]',
      iconBorder: 'border-[#E9D5FF]',
    },
    {
      id: 'admin',
      label: 'Platform Admin',
      subtitle: 'Manage users, roles, settings and system activity.',
      icon: Settings,
      iconBg: 'bg-[#FEE2E2]',
      iconColor: 'text-[#DC2626]',
      iconBorder: 'border-[#FCA5A5]',
    },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll-based header solidify effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy behavior with IntersectionObserver when on homepage
  useEffect(() => {
    if (currentPage !== 'home') return;

    const targetIds = ['product', 'how-it-works', 'pricing'];
    const sections = targetIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-80px 0px -40% 0px',
        threshold: [0.1, 0.25, 0.5, 0.75]
      }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [currentPage]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (item.type === 'route' && item.pageId) {
      e.preventDefault();
      setCurrentPage(item.pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (item.type === 'anchor') {
      e.preventDefault();
      const targetId = item.id;
      window.location.hash = targetId;

      if (currentPage !== 'home') {
        setCurrentPage('home');
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF8F5]/95 backdrop-blur-md border-[#EDE9DF] shadow-xs'
          : 'bg-[#FAF8F5]/80 backdrop-blur-sm border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-6">

        {/* Brand Logo */}
        <div
          onClick={() => {
            setCurrentPage('home');
            window.location.hash = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center space-x-2 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[#C57D25] flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-[#B06C19] transition-colors">
            V
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#14213D]">
            VestIQ
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => {
            const isAnchorActive = currentPage === 'home' && item.type === 'anchor' && activeSection === item.id;
            const isRouteActive = item.type === 'route' && currentPage === item.pageId;
            const isActive = isAnchorActive || isRouteActive;

            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`text-sm font-medium transition-all duration-200 cursor-pointer py-1.5 relative ${
                  isActive
                    ? 'text-[#C57D25] font-bold'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C57D25] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Action Buttons & Persona Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Language Toggle */}
          <LanguageToggle variant="compact" />

          {/* Demo Mode Label & Persona Switcher */}
          <div className="flex items-center space-x-2">
            
            {/* Bold Demo Mode Label Badge */}
            <div className="hidden sm:flex items-center">
              <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-[#BFDBFE] shadow-xs">
                DEMO MODE
              </span>
            </div>

            {/* Persona Switcher Selector */}
            <div className="relative" ref={personaDropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-[#FFF8EE] text-[#63451B] border border-dashed border-[#F7E5C8] hover:border-[#C57D25] hover:bg-[#FDF3E3] shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#C57D25]" />
                <span>Role: {roleLabels[role]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#63451B] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Rich Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#EDE9DF] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#EDE9DF] flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B93A7]">
                      SELECT RBAC PERSONA
                    </span>
                    <span className="text-[10px] font-mono text-[#C57D25] font-bold bg-[#FFF8EE] px-2 py-0.5 rounded border border-[#F7E5C8]">
                      Active: {roleLabels[role]}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {personaConfigs.map((p) => {
                      const isSelected = role === p.id;
                      const IconComp = p.icon;

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setRole(p.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center space-x-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF8EE] border border-[#F7E5C8] shadow-xs'
                              : 'hover:bg-[#FAF8F5] border border-transparent'
                          }`}
                        >
                          {/* Circle Icon Badge */}
                          <div className={`w-9 h-9 rounded-xl ${p.iconBg} ${p.iconColor} ${p.iconBorder} border flex items-center justify-center shrink-0 shadow-xs`}>
                            <IconComp className="w-4 h-4" />
                          </div>

                          {/* Role Details */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold flex items-center space-x-1.5 ${isSelected ? 'text-[#C57D25]' : 'text-[#14213D]'}`}>
                              <span>{p.label}</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5 line-clamp-1">
                              {p.subtitle}
                            </p>
                          </div>

                          {/* Selected Indicator */}
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#C57D25] text-white flex items-center justify-center shrink-0 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Auth Action Button */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#14213D] hidden md:inline">
                {userName}
              </span>
              <button
                onClick={() => signOut()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#14213D] border border-[#EDE9DF] hover:bg-[#F6F4ED] transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage('auth')}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#C57D25] text-white hover:bg-[#B06C19] transition-all shadow-xs cursor-pointer"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

