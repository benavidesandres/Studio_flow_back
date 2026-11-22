import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-lg border border-line bg-surface', className)}>{children}</section>;
}

export function PanelHeader({ title, meta, action }: { title: string; meta?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex min-h-13 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {meta && <span className="truncate text-[13px] text-fg-3">{meta}</span>}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-fg-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <Icon className="size-6 text-fg-3" />
      <h3 className="mt-3 font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-fg-2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-line', className)} />
);

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: LucideIcon }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line-strong bg-sunken p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-[13px] font-medium transition-colors',
            value === option.value ? 'bg-raised text-fg shadow-sm' : 'text-fg-2 hover:text-fg'
          )}
        >
          {option.icon && <option.icon className="size-3.5" />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Meter({ value, tone = 'neutral', label }: { value: number; tone?: 'neutral' | 'warning' | 'critical'; label: string }) {
  const color = { neutral: 'bg-fg', warning: 'bg-delayed', critical: 'bg-problem' }[tone];
  return (
    <div role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
