import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';

export const AuthWatcher: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const { setCurrentPage } = useApp();

  useEffect(() => {
    if (isSignedIn) {
      const md = (user?.publicMetadata || {}) as any;
      // If onboarding fields missing, go to onboarding page once
      if (!md.investmentGoal && !md.timeline) {
        setCurrentPage('onboarding');
      }
    }
  }, [isSignedIn, user, setCurrentPage]);

  return null;
};
