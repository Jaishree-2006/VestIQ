import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import {
  Upload,
  ArrowRight,
  ShieldAlert,
  Sliders,
  PieChart,
  XCircle,
  FileText,
  Lock,
  Building2,
  Sparkles,
  RotateCw,
  Check,
  Cpu,
  Users,
  History,
  TrendingUp,
  Award,
  Eye,
  Zap,
  ChevronRight,
} from 'lucide-react';

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12, rootMargin: '-40px 0px', ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 1400, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return count;
}

// ─── Reveal Wrapper Component ─────────────────────────────────────────────────
const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'left' | 'scale';
  delay?: number;
}> = ({ children, className = '', variant = 'fade', delay = 0 }) => {
  const { ref, visible } = useReveal();
  const variantClass = variant === 'left' ? 'reveal-left' : variant === 'scale' ? 'reveal-scale' : 'reveal';
  return (
    <div
      ref={ref}
      className={`${variantClass} ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ─── Stat Counter Card ────────────────────────────────────────────────────────
const StatCard: React.FC<{
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}> = ({ value, suffix, prefix = '', label, icon, delay = 0 }) => {
  const { ref, visible } = useReveal();
  const count = useCounter(value, 1600, visible);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} text-center`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-center mb-2 text-[#C57D25]">{icon}</div>
      <div className="text-3xl font-extrabold font-mono-num text-[#14213D] tabular-nums">
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-xs text-[#6B7280] mt-1 font-medium">{label}</div>
    </div>
  );
};

// ─── Interactive Hero Widget ─────────────────────────────────────────────────
const HeroWidget: React.FC<{ healthScore: number; flagText: string; topFactor?: { reason: string } }> = ({
  healthScore, flagText, topFactor
}) => {
  const [rateHike, setRateHike] = useState(1.0);
  const impact = -(rateHike * 14.8).toFixed(1);
  const adjustedScore = Math.max(0, Math.round(healthScore - rateHike * 6));

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#EBE6DB] shadow-vestiq text-left relative overflow-hidden">
      {/* Live indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#2BB673] animate-pulse" />
        <span className="text-[10px] font-bold text-[#2BB673] uppercase tracking-wider">Live Demo</span>
      </div>

      <div className="p-6">
        <div className="text-xs uppercase tracking-wider text-[#8B93A7] font-semibold mb-3">
          Portfolio Health Score — Interactive Preview
        </div>

        <div className="flex items-baseline space-x-3 mb-3">
          <span className="text-4xl font-extrabold font-mono-num text-[#14213D] tabular-nums transition-all duration-300">
            {adjustedScore} / 100
          </span>
          <span className="text-sm font-semibold text-[#EF4444] bg-[#FDF2F2] px-2.5 py-0.5 rounded-full border border-[#FCA5A5]">
            {flagText}
          </span>
        </div>

        {/* Causal chain preview */}
        <div className="flex flex-col gap-1.5 mb-5">
          <div className="bg-[#FFF8EE] border border-[#F7E5C8] p-2 rounded-lg text-xs font-semibold text-[#63451B]">
            📌 40% concentrated in Mindspace REIT
          </div>
          <div className="flex items-center gap-1 px-2">
            <div className="w-px h-4 bg-[#E6DCCB] mx-auto" />
          </div>
          <div className={`p-2 rounded-lg text-xs font-bold border transition-colors duration-300 ${
            rateHike > 1.5 ? 'bg-[#FDF2F2] border-[#FCA5A5] text-[#EF4444]' : 'bg-[#FFF8EE] border-[#F7E5C8] text-[#C57D25]'
          }`}>
            ⚡ Rate hike +{rateHike.toFixed(1)}% → REIT value impact: <span className="font-extrabold">{impact}%</span>
          </div>
        </div>

        {/* Interactive slider */}
        <div className="border-t border-[#EDE9DF] pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#475569]">Simulate RBI Rate Hike</span>
            <span className="text-xs font-bold text-[#C57D25] tabular-nums">+{rateHike.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={rateHike}
            onChange={e => setRateHike(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full accent-[#C57D25] cursor-pointer"
            style={{ accentColor: '#C57D25' }}
          />
          <div className="flex justify-between text-[10px] text-[#8B93A7] mt-1">
            <span>0%</span><span>1%</span><span>2%</span><span>3%</span>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-3 leading-relaxed">
            Drag the slider to simulate a rate hike — watch the health score and REIT impact update in real time.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Inline CTA Banner ────────────────────────────────────────────────────────
const InlineCTA: React.FC<{
  headline: string;
  sub: string;
  cta: string;
  onCta: () => void;
  variant?: 'gold' | 'dark';
}> = ({ headline, sub, cta, onCta, variant = 'gold' }) => (
  <Reveal className="max-w-4xl mx-auto px-4">
    <div className={`rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 ${
      variant === 'dark'
        ? 'bg-[#14213D] text-white'
        : 'bg-gradient-to-r from-[#C57D25] to-[#B06C19] text-white'
    }`}>
      <div className="text-center md:text-left">
        <h3 className="text-xl font-extrabold mb-1">{headline}</h3>
        <p className={`text-sm ${variant === 'dark' ? 'text-[#94A3B8]' : 'text-white/80'}`}>{sub}</p>
      </div>
      <button
        onClick={onCta}
        className={`shrink-0 px-7 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer ${
          variant === 'dark'
            ? 'bg-[#C57D25] text-white hover:bg-[#B06C19]'
            : 'bg-white text-[#C57D25] hover:bg-[#FFF8EE]'
        }`}
      >
        {cta} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </Reveal>
);

// ─── Main HomePage ────────────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const { setCurrentPage, healthScore, redFlags, healthScoreBreakdown, handleCasUpload, startFreeTrial } = useApp();
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));

  const topFactor = (healthScoreBreakdown.breakdown || healthScoreBreakdown.factors || []).find(f => f.penaltyOrBonus < 0);
  const flagText = redFlags.length === 1 ? '1 flag' : `${redFlags.length} flags`;

  // Direct hash navigation support
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['product', 'how-it-works', 'pricing'].includes(hash)) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    };
    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#14213D] flex flex-col font-sans selection:bg-[#FCEEBB]">
      <Navbar />

      {/* ── HERO / PRODUCT SECTION ── */}
      <section
        id="product"
        className="relative pt-24 pb-14 px-6 max-w-5xl mx-auto text-center scroll-mt-0"
        style={{ paddingTop: '5rem' }}
      >
        <Reveal delay={80}>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#14213D] leading-[1.15] mb-6">
            Every investment choice,<br />
            <span className="text-[#C57D25]">explained through real causes.</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed mb-8">
            Upload any NSDL / CDSL CAS PDF statement. Detect hidden fees, lock-in mis-selling, and macro risks — explained in simple causal chains.
          </p>
        </Reveal>

        <Reveal delay={220}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold bg-[#C57D25] hover:bg-[#B06C19] text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer text-base"
            >
              <Upload className="w-5 h-5" />
              <span>Upload CAS Statement</span>
            </button>
            <button
              onClick={() => setCurrentPage('for-brokers')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold bg-white text-[#14213D] border border-[#E2D8CC] hover:bg-[#F7F5EE] transition-all cursor-pointer text-base"
            >
              <span>For brokers →</span>
            </button>
          </div>
        </Reveal>

        {/* Interactive Hero Widget */}
        <Reveal delay={300} variant="scale">
          <HeroWidget healthScore={healthScore} flagText={flagText} topFactor={topFactor} />
        </Reveal>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 bg-white border-y border-[#EDE9DF]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={12400} suffix="+" label="CAS statements analysed" icon={<FileText className="w-5 h-5" />} delay={0} />
          <StatCard value={820} suffix=" Cr" prefix="₹" label="Portfolio value protected" icon={<TrendingUp className="w-5 h-5" />} delay={80} />
          <StatCard value={4800} suffix="+" label="Mis-selling flags raised" icon={<ShieldAlert className="w-5 h-5" />} delay={160} />
          <StatCard value={98} suffix="%" label="Client-side privacy rate" icon={<Lock className="w-5 h-5" />} delay={240} />
        </div>
      </section>

      {/* ── 3 QUICK FEATURE CARDS ── */}
      <section className="py-10 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal delay={0} className="stagger-1">
            <div
              onClick={() => setCurrentPage('dashboard')}
              className="bg-[#FFF8EE] border border-[#F7E5C8] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#C57D25] flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#14213D] text-base">Unified portfolio</h3>
                <p className="text-xs text-[#8B93A7] mt-0.5">All brokers, one view</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="stagger-2">
            <div
              onClick={() => setCurrentPage('red-flags')}
              className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EF4444] flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#14213D] text-base">Red flag detector</h3>
                <p className="text-xs text-[#8B93A7] mt-0.5">Catches mis-selling</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160} className="stagger-3">
            <div
              onClick={() => setCurrentPage('shock-sandbox')}
              className="bg-[#E6F4EA] border border-[#A7F3D0] rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#2BB673] flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#14213D] text-base">Shock sandbox</h3>
                <p className="text-xs text-[#8B93A7] mt-0.5">Stress-test your holdings</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PROBLEM SECTION: 3 PAIN POINTS ── */}
      <section className="py-20 bg-white border-y border-[#EDE9DF]">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-extrabold text-[#14213D] mb-4">
                Why traditional wealth apps fail retail investors
              </h2>
              <p className="text-base text-[#6B7280]">
                Tracking prices isn't understanding risk. VestIQ solves the 3 fundamental friction points in Indian retail finance.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                idx: 1,
                icon: <XCircle className="w-5 h-5" />,
                iconBg: 'bg-[#FDF2F2] text-[#EF4444] border-[#FCA5A5]',
                title: 'Scattered Portfolios',
                desc: 'Your holdings are fragmented across Zerodha, Groww, ICICI Direct, and RBI Retail Direct. You lack a unified view of real exposure.',
                backTitle: 'Unified Cross-Broker Intelligence',
                backDesc: 'Auto-ingests NSDL & CDSL Statements with 100% client-side privacy. Standardizes equities, MFs, bonds, and REITs into one real-time exposure dashboard.',
                bullets: ['Zero manual data entry', 'Single-click PAN masking & secure upload'],
                cta: 'Try CAS Auto-Scanner',
                ctaPage: 'dashboard' as const,
              },
              {
                idx: 2,
                icon: <FileText className="w-5 h-5" />,
                iconBg: 'bg-[#FFF8EE] text-[#C57D25] border-[#F7E5C8]',
                title: 'Opaque Instruments',
                desc: 'REITs, InvITs, and structured corporate bonds are sold without plain-English disclosure of lock-in terms or interest rate vulnerability.',
                backTitle: 'Plain-English Disclosures',
                backDesc: 'Translates complex debt covenants, YTM shifts, and commercial real estate vacancy rates into straightforward human explanations.',
                bullets: ['Flags hidden lock-in periods', 'Detects mis-sold commission products'],
                cta: 'Open Red Flag Detector',
                ctaPage: 'red-flags' as const,
              },
              {
                idx: 3,
                icon: <Zap className="w-5 h-5" />,
                iconBg: 'bg-[#E6F4EA] text-[#2BB673] border-[#A7F3D0]',
                title: 'Abstract Risk Scores',
                desc: 'A bare risk score of "6.8/10" gives zero actionable insight into why your portfolio drops when macro rates move.',
                backTitle: 'Causal Macro Stress Testing',
                backDesc: 'Simulates exact macroeconomic events like +100bps RBI rate hikes, crude price surges, or sector crashes to reveal exact ₹ impacts on your wealth.',
                bullets: ['What-if rate hike scenario sandbox', 'Peer-group risk benchmarking'],
                cta: 'Launch Shock Sandbox',
                ctaPage: 'shock-sandbox' as const,
              },
            ].map(({ idx, icon, iconBg, title, desc, backTitle, backDesc, bullets, cta, ctaPage }) => (
              <Reveal key={idx} delay={idx * 80} variant="scale">
                <div
                  className="flip-card-container min-h-[320px] w-full cursor-pointer"
                  style={{ minHeight: '320px' }}
                  onClick={() => toggleCard(idx)}
                >
                  <div className={`flip-card-inner ${flippedCards[idx] ? 'flipped' : ''}`} style={{ minHeight: '320px' }}>
                    <div className="flip-card-face bg-[#FAF8F5] p-6 border border-[#EDE9DF] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 border ${iconBg}`} style={{ borderRadius: '8px' }}>
                          {icon}
                        </div>
                        <h3 className="text-lg font-bold text-[#14213D] mb-2">{title}</h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
                      </div>
                      <div className="pt-4 border-t border-[#EDE9DF] flex items-center gap-2 text-xs text-[#C57D25] font-semibold">
                        <RotateCw className="w-3.5 h-3.5 spin-slow" />
                        <span>Hover or tap to flip</span>
                      </div>
                    </div>
                    <div className="flip-card-face flip-card-back bg-[#FAF8F5] p-6 border border-[#EDE9DF] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#C57D25]" />
                          <span className="text-xs uppercase tracking-wider text-[#C57D25] font-bold">VestIQ Solution</span>
                        </div>
                        <h4 className="text-lg font-bold text-[#14213D] mb-2">{backTitle}</h4>
                        <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{backDesc}</p>
                        <div className="flex flex-col gap-2">
                          {bullets.map(b => (
                            <div key={b} className="flex items-center gap-2 text-sm text-[#14213D]">
                              <Check className="w-4 h-4 text-[#2BB673] shrink-0" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(ctaPage); }}
                        className="w-full mt-4 py-2.5 px-3 rounded-lg bg-[#C57D25] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{cta}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLAINABILITY SHOWCASE ── */}
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
                The VestIQ Differentiator
              </span>
              <h2 className="text-3xl font-extrabold text-[#14213D] mt-3">
                Generic Score vs. Plain-English Causal Reasoning
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Reveal variant="left" delay={0}>
              <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-xs relative opacity-75">
                <div className="text-xs font-bold uppercase tracking-wider text-[#EF4444] mb-4 flex items-center justify-between">
                  <span>Traditional Broker App</span>
                  <span className="line-through text-xs text-[#8B93A7]">Opaque</span>
                </div>
                <div className="bg-[#F8F6F0] p-4 rounded-xl mb-4">
                  <div className="text-xs text-[#8B93A7]">Portfolio Risk Score</div>
                  <div className="text-3xl font-bold text-[#14213D] mt-1">6.8 / 10</div>
                  <div className="text-xs text-[#EF4444] mt-1">Moderate-High Volatility</div>
                </div>
                <p className="text-xs text-[#6B7280]">
                  ❌ Gives no reason for the score. User has no idea which instrument will drop or how interest rate hikes will impact cash flow.
                </p>
              </div>
            </Reveal>

            <Reveal variant="left" delay={120}>
              <div className="bg-white p-6 rounded-2xl border-2 border-[#C57D25] shadow-vestiq relative">
                <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-4 flex items-center justify-between">
                  <span>VestIQ Causal Chain</span>
                  <span className="bg-[#E6F4EA] text-[#2BB673] px-2 py-0.5 rounded text-[11px] font-semibold">Explainable</span>
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="bg-[#FFF8EE] border border-[#F7E5C8] p-2.5 rounded-lg text-xs font-semibold text-[#63451B]">
                    1. Cause: 40% of portfolio concentrated in Mindspace REIT
                  </div>
                  <div className="bg-[#FFF8EE] border border-[#F7E5C8] p-2.5 rounded-lg text-xs font-semibold text-[#63451B]">
                    2. Mechanism: REIT dividend yields compete directly with RBI repo rate bonds
                  </div>
                  <div className="bg-[#FDF2F2] border border-[#FCA5A5] p-2.5 rounded-lg text-xs font-bold text-[#EF4444]">
                    3. Impact: -15% estimated value drop per +1.0% interest rate hike
                  </div>
                </div>
                <p className="text-xs text-[#14213D] font-medium">
                  ✅ Transparent causal reasoning allows investors to act with confidence.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── INLINE CTA AFTER PRODUCT ── */}
      <section className="py-10 bg-[#FAF8F5]">
        <InlineCTA
          headline="Ready to see your own portfolio health score?"
          sub="Upload your CAS statement and get a full explainability report in under 60 seconds."
          cta="Upload CAS — Free"
          onCta={() => setCurrentPage('dashboard')}
          variant="gold"
        />
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section id="how-it-works" className="py-20 bg-white border-t border-[#EDE9DF] scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 w-full">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
                Process Flow & Architecture
              </span>
              <h2 className="text-3xl font-extrabold text-[#14213D] mt-3">
                How VestIQ Transforms Opaque Statements into Causal Intelligence
              </h2>
              <p className="text-base text-[#6B7280] mt-3">
                A 4-step pipeline that extracts unstructured PDF records into plain-English reasoning.
              </p>
            </div>
          </Reveal>

          {[
            {
              num: '1',
              title: 'CAS Upload / Sample Data Parser',
              desc: 'Drag and drop your NSDL or CDSL Consolidated Account Statement (CAS) PDF. We use local client-side extraction so your financial credentials never leave your browser unencrypted.',
              action: <button onClick={() => { handleCasUpload('sample.pdf'); setCurrentPage('dashboard'); }} className="px-5 py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-xs transition-all shadow-xs shrink-0 cursor-pointer">Upload Sample CAS PDF</button>,
            },
            {
              num: '2',
              title: 'Multi-Asset Structured Portfolio Parser',
              desc: 'Extracts ISINs, folio numbers, purchase NAVs, lock-in terms, and dividend yield schedules across equities, corporate bonds, sovereign G-Secs, REITs, and InvITs.',
              action: <Cpu className="w-10 h-10 text-[#C57D25] shrink-0 opacity-80" />,
            },
            {
              num: '3',
              title: 'Unified Portfolio Engine',
              desc: 'Aggregates your holdings from Zerodha, Groww, ICICI Direct, and RBI Retail Direct into a single holistic health dashboard.',
              action: <PieChart className="w-10 h-10 text-[#C57D25] shrink-0 opacity-80" />,
            },
          ].map(({ num, title, desc, action }, i) => (
            <Reveal key={num} delay={i * 80}>
              <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] text-[#C57D25] flex items-center justify-center font-extrabold text-xl shrink-0 border border-[#F7E5C8]">
                    {num}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#14213D]">{title}</h3>
                    <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
                {action}
              </div>
            </Reveal>
          ))}

          <Reveal delay={240}>
            <div className="bg-[#FAF8F5] rounded-3xl p-8 border-2 border-[#C57D25] shadow-vestiq">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25]">Step 4: Behavioral & Intelligence Engine Matrix</span>
                <h3 className="text-2xl font-extrabold text-[#14213D] mt-1">4 Parallel Analytics Engines</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <ShieldAlert className="w-4 h-4" />, color: 'text-[#EF4444]', hover: 'hover:border-[#EF4444]', title: 'Suitability & Mis-selling Check', desc: 'Triggers real-time Red Flag Alerts on lock-in mismatches and unrated bond traps.', page: 'red-flags' as const },
                  { icon: <Sliders className="w-4 h-4" />, color: 'text-[#2BB673]', hover: 'hover:border-[#2BB673]', title: 'Behavioral Twin (Shock Sandbox)', desc: 'Interactive rate hikes and market crash simulations on user\'s actual portfolio.', page: 'shock-sandbox' as const },
                  { icon: <Users className="w-4 h-4" />, color: 'text-[#C57D25]', hover: 'hover:border-[#C57D25]', title: 'Peer Benchmarking Module', desc: 'Anonymized cohort comparison across age, income, and asset allocation.', page: 'peer-benchmark' as const },
                  { icon: <History className="w-4 h-4" />, color: 'text-[#14213D]', hover: 'hover:border-[#14213D]', title: 'Retrospective Simulator', desc: '"What if" timeline view analyzing past 24 months behavioral adjustments.', page: 'retrospective' as const },
                ].map(({ icon, color, hover, title, desc, page }) => (
                  <div key={title} onClick={() => setCurrentPage(page)} className={`bg-white p-5 rounded-2xl border border-[#EDE9DF] ${hover} cursor-pointer transition-all`}>
                    <div className={`flex items-center space-x-2 ${color} font-bold text-sm mb-1`}>
                      {icon}<span>{title}</span>
                    </div>
                    <p className="text-xs text-[#6B7280]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className="py-20 bg-[#FAF8F5] border-t border-[#EDE9DF] scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 w-full">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C57D25] bg-[#FFF8EE] px-3 py-1 rounded-full border border-[#F7E5C8]">
                Transparent Pricing
              </span>
              <h2 className="text-3xl font-extrabold text-[#14213D] mt-3">
                Simple Plans for Retail & Enterprise
              </h2>
              <p className="text-base text-[#6B7280] mt-3">
                Start free with your CAS statement or deploy whitelisted compliance across your brokerage.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Reveal delay={0}>
              <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-2">Retail Investor</div>
                  <h3 className="text-2xl font-extrabold text-[#14213D]">Free DIY</h3>
                  <div className="text-3xl font-mono-num font-extrabold text-[#14213D] my-4">₹0 <span className="text-xs font-normal text-[#8B93A7]">/ forever</span></div>
                  <p className="text-xs text-[#6B7280] mb-6">Essential explainability for individual retail investors uploading CAS statements.</p>
                  <ul className="space-y-3 text-xs text-[#475569] mb-6">
                    {['NSDL/CDSL CAS Parsing', 'Unified Portfolio Engine', 'Basic Explainability Causal Chains', 'Red Flag Mis-selling Detector'].map(f => (
                      <li key={f} className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>{f}</span></li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => setCurrentPage('dashboard')} className="w-full py-3 bg-[#FAF8F5] border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] font-bold rounded-xl text-xs transition-all cursor-pointer">
                  Get Started Free
                </button>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="bg-white rounded-3xl p-8 border-2 border-[#C57D25] shadow-vestiq-lg flex flex-col justify-between relative h-full">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C57D25] text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C57D25] mb-2">Active Investor</div>
                  <h3 className="text-2xl font-extrabold text-[#14213D]">Premium DIY</h3>
                  <div className="text-3xl font-mono-num font-extrabold text-[#14213D] my-4">₹299 <span className="text-xs font-normal text-[#8B93A7]">/ month</span></div>
                  <p className="text-xs text-[#6B7280] mb-6">Advanced stress-testing, behavioral tracking, and retrospective simulator.</p>
                  <ul className="space-y-3 text-xs text-[#475569] mb-6">
                    {['Everything in Free Plan', 'Shock Sandbox (Behavioral Twin)', 'Retrospective Timeline Simulator', 'Peer Cohort Benchmarking', 'Cross-broker Cashflow Optimizer'].map(f => (
                      <li key={f} className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>{f}</span></li>
                    ))}
                  </ul>
                </div>
                <button onClick={startFreeTrial} className="w-full py-3 bg-[#C57D25] hover:bg-[#B06C19] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer">
                  Start 14-Day Free Trial — No payment needed
                </button>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="bg-white rounded-3xl p-8 border border-[#EDE9DF] shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-2">Broker & Depository</div>
                  <h3 className="text-2xl font-extrabold text-[#14213D]">Broker Enterprise</h3>
                  <div className="text-3xl font-extrabold text-[#14213D] my-4">Custom <span className="text-xs font-normal text-[#8B93A7]">/ SLA based</span></div>
                  <p className="text-xs text-[#6B7280] mb-6">Whitelisted compliance layer for brokerages, RMs, and compliance officers.</p>
                  <ul className="space-y-3 text-xs text-[#475569] mb-6">
                    {['Relationship Manager (RM) Console', 'Compliance SEBI Audit Dashboard', 'API & Domain Whitelisting', 'Dedicated Account SLA'].map(f => (
                      <li key={f} className="flex items-center space-x-2"><Check className="w-4 h-4 text-[#2BB673]" /><span>{f}</span></li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => setCurrentPage('for-brokers')} className="w-full py-3 bg-[#14213D] hover:bg-[#1E293B] text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer">
                  Talk to Sales
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── INLINE CTA AFTER PRICING ── */}
      <section className="py-10 bg-[#FAF8F5] border-b border-[#EDE9DF]">
        <InlineCTA
          headline="No credit card. No lock-in. Start free today."
          sub="Join 12,400+ investors who have already analysed their portfolios with VestIQ."
          cta="Upload CAS Statement"
          onCta={() => setCurrentPage('dashboard')}
          variant="gold"
        />
      </section>

      {/* ── TRUST & REGULATORY BADGES ── */}
      <section className="py-16 bg-white border-t border-[#EDE9DF]">
        <div className="max-w-5xl mx-auto px-4">
          <Reveal>
            <div className="text-center mb-10">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8B93A7] mb-2">
                Security, Compliance & Regulatory Alignment
              </div>
              <h2 className="text-2xl font-extrabold text-[#14213D]">
                Built to institutional-grade standards
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <ShieldAlert className="w-6 h-6 text-[#C57D25]" />,
                title: 'SEBI Suitability Compliant',
                desc: 'Every recommendation is cross-checked against SEBI suitability guidelines and IEPF investor protection mandates.',
                badge: 'SEBI LODR / IEPF',
                color: 'border-[#F7E5C8] bg-[#FFFDF8]',
              },
              {
                icon: <Lock className="w-6 h-6 text-[#2BB673]" />,
                title: 'AES-256 End-to-End Encryption',
                desc: 'CAS PDFs are parsed entirely in your browser. No raw financial data is ever transmitted to or stored on our servers.',
                badge: '100% Client-Side',
                color: 'border-[#A7F3D0] bg-[#F0FFF8]',
              },
              {
                icon: <Building2 className="w-6 h-6 text-[#C57D25]" />,
                title: 'Depository Whitelisting Ready',
                desc: 'Designed for NSDL & CDSL integration with existing broker whitelisting infrastructure and API contracts.',
                badge: 'NSDL / CDSL',
                color: 'border-[#F7E5C8] bg-[#FFFDF8]',
              },
              {
                icon: <Eye className="w-6 h-6 text-[#6366F1]" />,
                title: 'India DPDP Act 2023 Aligned',
                desc: 'Consent-first architecture with explicit purpose limitation under the Digital Personal Data Protection Act 2023.',
                badge: 'DPDP Act',
                color: 'border-[#C7D2FE] bg-[#F5F3FF]',
              },
              {
                icon: <Award className="w-6 h-6 text-[#F59E0B]" />,
                title: 'Audit Trail Hash-Chaining',
                desc: 'Every compliance officer action is cryptographically hash-chained for tamper-evident audit logs that meet SEBI inspection standards.',
                badge: 'Tamper-Evident',
                color: 'border-[#FDE68A] bg-[#FFFBEB]',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-[#EF4444]" />,
                title: 'Real-Time Mis-Selling Detection',
                desc: 'Patent-pending causal AI engine flags lock-in mismatches, unrated bond traps, and concentration risks in under 2 seconds.',
                badge: 'AI-Powered',
                color: 'border-[#FCA5A5] bg-[#FFF5F5]',
              },
            ].map(({ icon, title, desc, badge, color }) => (
              <Reveal key={title} variant="scale">
                <div className={`trust-badge rounded-2xl p-5 border ${color} h-full`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="shrink-0 mt-0.5">{icon}</div>
                    <div>
                      <h4 className="text-base font-bold text-[#14213D] leading-snug">{title}</h4>
                      <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wider text-[#8B93A7] bg-white px-2 py-0.5 rounded-full border border-[#EDE9DF]">{badge}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA FOOTER BANNER ── */}
      <footer className="bg-[#F6F4ED] text-[#14213D] border-t border-[#EDE9DF] py-16 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl font-extrabold text-[#14213D] mb-4">
              Take control of your real multi-asset portfolio today
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto mb-8 text-sm">
              Upload your NSDL / CDSL Consolidated Account Statement (CAS) to generate your explainable health score in under 60 seconds.
            </p>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-8 py-3.5 rounded-xl font-bold bg-[#C57D25] text-white hover:bg-[#B06C19] transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Upload your CAS — Free
            </button>
          </Reveal>

          <div className="mt-12 pt-8 border-t border-[#EDE9DF] text-xs text-[#8B93A7] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>© 2026 VestIQ Intelligence Inc. Built for SEBI-aligned investor protection.</div>
            <div className="flex space-x-6">
              <span className="hover:text-[#14213D] cursor-pointer" onClick={() => setCurrentPage('privacy' as any)}>Privacy Policy</span>
              <span className="hover:text-[#14213D] cursor-pointer" onClick={() => setCurrentPage('terms' as any)}>Terms of Service</span>
              <span className="hover:text-[#14213D] cursor-pointer" onClick={() => setCurrentPage('for-brokers')}>Broker Licensing</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
