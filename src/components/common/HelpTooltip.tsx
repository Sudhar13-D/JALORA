import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
      <button
        type="button"
        className="focus:outline-none focus:ring-1 focus:ring-jalora-blue rounded-full p-0.5"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Help information"
      >
        <HelpCircle size={14} aria-hidden="true" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-xs rounded-md shadow-lg pointer-events-none transition-opacity duration-150"
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
};
