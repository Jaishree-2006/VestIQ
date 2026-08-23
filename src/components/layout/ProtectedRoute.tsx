import React from 'react';
import { useApp } from '../../context/AppContext';
import { AuthPage } from '../pages/AuthPage';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 font-sans text-[#14213D]">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] border border-[#F7E5C8] flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-[#C57D25] animate-spin" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#8B93A7]">
          Verifying session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <>{children}</>;
};
