import React from 'react';
import { Card } from '../ui/Card';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  color?: 'blue' | 'teal' | 'amber' | 'red' | 'navy';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  const iconColorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    navy: 'bg-navy-900 text-white border-navy-800',
  };

  return (
    <Card onClick={onClick} className="p-4 sm:p-5 hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
            {trend && (
              <span
                className={clsx(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  trend.isNeutral
                    ? 'bg-slate-100 text-slate-600'
                    : trend.isPositive
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className={clsx('p-2.5 rounded-xl border shrink-0', iconColorMap[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

