import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { StatusLevel } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../data/translations';

interface StatusBadgeProps {
  status: StatusLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const language = useAppStore((s) => s.language);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (status === 'functional') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${sizeClasses[size]}`}
        role="status"
        aria-label={t.functional}
      >
        <CheckCircle2 size={iconSizes[size]} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        {showLabel && <span>{t.functional}</span>}
      </span>
    );
  }

  if (status === 'at_risk') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${sizeClasses[size]}`}
        role="status"
        aria-label={t.atRisk}
      >
        <AlertTriangle size={iconSizes[size]} className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
        {showLabel && <span>{t.atRisk}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${sizeClasses[size]}`}
      role="status"
      aria-label={t.nonFunctional}
    >
      <XCircle size={iconSizes[size]} className="text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
      {showLabel && <span>{t.nonFunctional}</span>}
    </span>
  );
};
