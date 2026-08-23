import React from 'react';
import { useApp } from '../../context/AppContext';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  variant?: 'standard' | 'compact';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'standard',
  className = '',
}) => {
  const { preferredLanguage, setPreferredLanguage } = useApp();

  if (variant === 'compact') {
    return (
      <div className={`bg-[#F6F4ED] p-0.5 rounded-xl border border-[#EDE9DF] inline-flex items-center ${className}`}>
        <button
          onClick={() => setPreferredLanguage('en')}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            preferredLanguage === 'en'
              ? 'bg-white text-[#C57D25] shadow-xs'
              : 'text-[#6B7280] hover:text-[#14213D]'
          }`}
          title="English Explanations"
        >
          EN
        </button>
        <button
          onClick={() => setPreferredLanguage('ta')}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-tamil ${
            preferredLanguage === 'ta'
              ? 'bg-white text-[#C57D25] shadow-xs'
              : 'text-[#6B7280] hover:text-[#14213D]'
          }`}
          title="தமிழ் விளக்கங்கள் (Tamil Explanations)"
        >
          தமிழ்
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[#F6F4ED] p-1 rounded-xl border border-[#EDE9DF] inline-flex items-center ${className}`}>
      <button
        onClick={() => setPreferredLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
          preferredLanguage === 'en'
            ? 'bg-white text-[#C57D25] shadow-xs'
            : 'text-[#6B7280] hover:text-[#14213D]'
        }`}
      >
        <Languages className="w-3.5 h-3.5" />
        <span>English</span>
      </button>

      <button
        onClick={() => setPreferredLanguage('ta')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 font-tamil ${
          preferredLanguage === 'ta'
            ? 'bg-white text-[#C57D25] shadow-xs'
            : 'text-[#6B7280] hover:text-[#14213D]'
        }`}
      >
        <span>தமிழ்</span>
      </button>
    </div>
  );
};
