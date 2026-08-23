import React from 'react';
import { useApp } from '../../context/AppContext';

export const AuthButtons: React.FC = () => {
  const { isAuthenticated, login, logout, currentPage, setCurrentPage } = useApp();

  return (
    <div className="flex items-center gap-2">
      {!isAuthenticated ? (
        <button
          onClick={() => setCurrentPage('auth')}
          className="px-3 py-2 rounded-full bg-[#C57D25] text-white font-bold"
        >
          Sign in
        </button>
      ) : (
        <button
          onClick={() => {
            logout();
            setCurrentPage('home');
          }}
          className="px-3 py-2 rounded-full bg-white border font-bold text-[#14213D]"
        >
          Sign out
        </button>
      )}
    </div>
  );
};
