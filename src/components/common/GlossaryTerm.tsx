import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { getGlossaryEntry } from '../../data/glossary';

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({
  term,
  children,
  showIcon = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const entry = getGlossaryEntry(term);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  if (!entry) {
    return <span className={className}>{children || term}</span>;
  }

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center gap-0.5 group cursor-help ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }}
    >
      <span className="border-b border-dotted border-[#C57D25] text-inherit group-hover:text-[#C57D25] transition-colors">
        {children || term}
      </span>
      {showIcon && (
        <HelpCircle className="w-3 h-3 text-[#8B93A7] group-hover:text-[#C57D25] shrink-0 transition-colors ml-0.5" />
      )}

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 bg-white rounded-2xl p-3.5 shadow-vestiq-lg border border-[#EDE9DF] text-xs text-[#475569] z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5 pb-1.5 border-b border-[#F1EFE9]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C57D25] block">
                Glossary Reference
              </span>
              <span className="font-extrabold text-[#14213D] text-xs block leading-tight">
                {entry.term}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 text-[#8B93A7] hover:text-[#14213D] rounded-lg transition-colors cursor-pointer sm:hidden"
              aria-label="Close tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[#63451B] font-medium">
            {entry.definition}
          </p>
          {/* Subtle downward arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#EDE9DF]" />
        </div>
      )}
    </span>
  );
};
