import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HomePage } from './components/pages/HomePage';
import { HowItWorksPage } from './components/pages/HowItWorksPage';
import { FeaturesPage } from './components/pages/FeaturesPage';
import { ForBrokersPage } from './components/pages/ForBrokersPage';
import { PricingPage } from './components/pages/PricingPage';
import { AboutPage } from './components/pages/AboutPage';
import { AuthPage } from './components/pages/AuthPage';
import { OnboardingPage } from './components/pages/OnboardingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { HoldingsPage } from './components/pages/HoldingsPage';
import { ExplainabilityCenterPage } from './components/pages/ExplainabilityCenterPage';
import { RedFlagsPage } from './components/pages/RedFlagsPage';
import { ShockSandboxPage } from './components/pages/ShockSandboxPage';
import { PeerBenchmarkingPage } from './components/pages/PeerBenchmarkingPage';
import { RetrospectivePage } from './components/pages/RetrospectivePage';
import { BrokerConsolePage } from './components/pages/BrokerConsolePage';
import { ComplianceDashboardPage } from './components/pages/ComplianceDashboardPage';
import { AdminPanelPage } from './components/pages/AdminPanelPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { IpoScreenerPage } from './components/pages/IpoScreenerPage';
import { AppSidebar } from './components/layout/AppSidebar';
import { PremiumGate } from './components/layout/PremiumGate';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import type { PageId } from './types';

const PREMIUM_GATE_CONFIG: Record<string, { name: string; description: string; included: string[] }> = {
  'shock-sandbox': {
    name: 'Shock Sandbox',
    description: 'Simulate interest-rate and market-crash scenarios against your actual holdings — not generic templates.',
    included: [
      'Interest rate shock simulation (±0–3%)',
      'Market crash scenario modeling (0–30% correction)',
      'Real-time P&L impact on each holding',
      'Behavioral Twin emotional bias detection',
      'Cash-flow optimization suggestions',
    ],
  },
  'peer-benchmark': {
    name: 'Peer Benchmarking',
    description: 'Compare your allocation and health score against anonymized investors in your age and income cohort.',
    included: [
      'Cohort-matched peer allocation comparison',
      'Anonymized quartile percentile scores',
      'Asset mix gap analysis vs. top-quartile investors',
      'SEBI suitability score benchmark',
    ],
  },
  'retrospective': {
    name: 'Retrospective Simulator',
    description: 'Run "what if I had rebalanced?" simulations on past decisions — framed to educate, not cause regret.',
    included: [
      'Historical rebalancing impact analysis',
      'Constructive "what if" counterfactuals',
      'Missed opportunity cost quantification',
      'Actionable forward-looking suggestions',
    ],
  },
  'ipo-screener': {
    name: 'IPO / NFO Suitability Screener',
    description: 'Screen upcoming market issues against your actual portfolio concentration and SEBI risk profile before applying.',
    included: [
      'Pre-application sector concentration check',
      'SEBI Riskometer alignment verification',
      'Causal-chain conflict analysis',
      'Proactive allocation safeguarding',
    ],
  },
};

const PageRenderer: React.FC = () => {
  const { currentPage, isPremiumGated, canAccess, userRecord } = useApp();

  // Check if current page is premium gated for this user
  if (isPremiumGated(currentPage as PageId)) {
    const config = PREMIUM_GATE_CONFIG[currentPage];
    if (config) {
      // Distinguish expired trial vs never-subscribed free user
      const isExpiredTrial = userRecord.plan === 'premium_trial';
      return (
        <ProtectedRoute>
          <div className="min-h-screen bg-[#FAF8F5] flex text-[#14213D] font-sans overflow-x-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
              <PremiumGate
                featureName={config.name}
                featureDescription={config.description}
                included={config.included}
                variant={isExpiredTrial ? 'trial_expired' : 'upgrade'}
              />
            </main>
          </div>
        </ProtectedRoute>
      );
    }
  }

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'how-it-works':
      return <HowItWorksPage />;
    case 'features':
      return <FeaturesPage />;
    case 'for-brokers':
      return <ForBrokersPage />;
    case 'pricing':
      return <PricingPage />;
    case 'about':
      return <AboutPage />;
    case 'auth':
      return <AuthPage />;
    case 'onboarding':
      return <OnboardingPage />;
    case 'dashboard':
      return <ProtectedRoute><DashboardPage /></ProtectedRoute>;
    case 'holdings':
      return <ProtectedRoute><HoldingsPage /></ProtectedRoute>;
    case 'explainability':
      return <ProtectedRoute><ExplainabilityCenterPage /></ProtectedRoute>;
    case 'red-flags':
      return <ProtectedRoute><RedFlagsPage /></ProtectedRoute>;
    case 'shock-sandbox':
      return <ProtectedRoute><ShockSandboxPage /></ProtectedRoute>;
    case 'peer-benchmark':
      return <ProtectedRoute><PeerBenchmarkingPage /></ProtectedRoute>;
    case 'retrospective':
      return <ProtectedRoute><RetrospectivePage /></ProtectedRoute>;
    case 'ipo-screener':
      return <ProtectedRoute><IpoScreenerPage /></ProtectedRoute>;
    case 'broker-console':
      return <ProtectedRoute><BrokerConsolePage /></ProtectedRoute>;
    case 'compliance':
      return <ProtectedRoute><ComplianceDashboardPage /></ProtectedRoute>;
    case 'admin':
      return <ProtectedRoute><AdminPanelPage /></ProtectedRoute>;
    case 'settings':
      return <ProtectedRoute><SettingsPage /></ProtectedRoute>;
    case 'profile':
      return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
    default:
      return <HomePage />;
  }
};

export function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <PageRenderer />
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;
