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
import { AppSidebar } from './components/layout/AppSidebar';
import { PremiumGate } from './components/layout/PremiumGate';
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
};

const PageRenderer: React.FC = () => {
  const { currentPage, isPremiumGated, canAccess } = useApp();

  // Check if current page is premium gated for this user
  if (isPremiumGated(currentPage as PageId)) {
    const config = PREMIUM_GATE_CONFIG[currentPage];
    if (config) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B1220] font-sans">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <PremiumGate
              featureName={config.name}
              featureDescription={config.description}
              included={config.included}
            />
          </main>
        </div>
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
      return <DashboardPage />;
    case 'holdings':
      return <HoldingsPage />;
    case 'explainability':
      return <ExplainabilityCenterPage />;
    case 'red-flags':
      return <RedFlagsPage />;
    case 'shock-sandbox':
      return <ShockSandboxPage />;
    case 'peer-benchmark':
      return <PeerBenchmarkingPage />;
    case 'retrospective':
      return <RetrospectivePage />;
    case 'broker-console':
      return <BrokerConsolePage />;
    case 'compliance':
      return <ComplianceDashboardPage />;
    case 'admin':
      return <AdminPanelPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
};

export function App() {
  return (
    <AppProvider>
      <PageRenderer />
    </AppProvider>
  );
}

export default App;
