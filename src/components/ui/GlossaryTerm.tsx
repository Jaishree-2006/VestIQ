import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Info } from 'lucide-react';
import { lookupGlossaryTerm } from '../../data/glossary';

interface GlossaryTermProps {
  /** The glossary lookup key — must match a key in GLOSSARY (case-insensitive). */
  term: string;
  /** The text to render inline. Defaults to `term` if omitted. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Wraps a financial jargon term with a dotted underline + info icon.
 * On hover (desktop) or tap (mobile) shows a small popover with the
 * plain-English definition, styled with existing card tokens:
 *   bg-white  border border-[#EDE9DF]  rounded-2xl  p-4  shadow-xs
 * Closes on outside click or Escape.
 *
 * No new fonts, colors, border-radii, or icons are introduced.
 */
export const GlossaryTerm: React.FC<GlossaryTermProps> = ({
  term,
  children,
  className = '',
}) => {
  const entry = lookupGlossaryTerm(term);
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // If we don't have a glossary entry, just render the children as-is.
  if (!entry) {
    return <span className={className}>{children ?? term}</span>;
  }

  // Position the popover above or below based on available viewport space.
  const reposition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setAbove(spaceBelow < 180);
  }, []);

  const handleOpen = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      reposition();
      setOpen((prev) => !prev);
    },
    [reposition]
  );

  const handleMouseEnter = useCallback(() => {
    reposition();
    setOpen(true);
  }, [reposition]);

  const handleMouseLeave = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center gap-0.5 ${className}`}
      // Desktop: hover
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // Mobile: tap toggle
      onClick={handleOpen}
    >
      {/* Dotted-underline term text */}
      <span className="border-b border-dashed border-[#8B93A7] cursor-help leading-tight">
        {children ?? entry.term}
      </span>

      {/* Small info icon — same as used in DataFreshnessIndicator / RedFlagsPage */}
      <Info className="w-[10px] h-[10px] text-[#8B93A7] shrink-0 cursor-help" aria-hidden="true" />

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`
            absolute left-0 z-50 w-64
            bg-white border border-[#EDE9DF] rounded-2xl p-4 shadow-xs
            text-xs text-[#475569] leading-relaxed
            ${above ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
          // Stop propagation so clicking inside the popover doesn't close it.
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="font-bold text-[#14213D] mb-1">{entry.term}</div>
          <p>{entry.definition}</p>
        </div>
      )}
    </span>
  );
};
