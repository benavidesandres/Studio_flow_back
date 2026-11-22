import type { ButtonHTMLAttributes, Ref } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-raised',
  ghost: 'text-fg-2 hover:bg-raised hover:text-fg',
  danger: 'border border-problem/40 text-problem hover:bg-problem/10',
};

const SIZES = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: LucideIcon;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ icon: Icon, label, className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-fg-2 transition-colors hover:bg-raised hover:text-fg',
        className
      )}
      {...props}
    >
      <Icon className="size-[18px]" />
      {children}
    </button>
  );
}
