import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-slate-800 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {item.to ? (
                <Link to={item.to} className="hover:text-slate-800">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Title and Subtitle */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

