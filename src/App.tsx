import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HomePage } from './components/pages/HomePage';
import { HowItWorksPage } from './components/pages/HowItWorksPage';
import { FeaturesPage } from './components/pages/FeaturesPage';
import { ForBrokersPage } from './components/pages/ForBrokersPage';
import { PricingPage } from './components/pages/PricingPage';
import { AboutPage } from './components/pages/AboutPage';
import { AuthPage } from './components/pages/AuthPage';
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

const PageRenderer: React.FC = () => {
  const { currentPage } = useApp();

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
