import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TriggerProps {
  ref: Ref<HTMLButtonElement>;
  onClick: () => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
}

interface Position {
  left: number;
  top?: number;
  bottom?: number;
}

/** Fixed-positioned so it is never clipped by scrolling tables or board columns. */
export function Menu({
  trigger,
  children,
  width = 224,
  align = 'start',
}: {
  trigger: (props: TriggerProps) => ReactNode;
  children: (close: () => void) => ReactNode;
  width?: number;
  align?: 'start' | 'end';
}) {
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setPosition(null);
    triggerRef.current?.focus();
  }, []);

  const toggle = () => {
    if (position || !triggerRef.current) {
      close();
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const preferred = align === 'end' ? rect.right - width : rect.left;
    const left = Math.max(8, Math.min(preferred, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - rect.bottom;
    setPosition(
      spaceBelow < 300 && rect.top > spaceBelow
        ? { left, bottom: window.innerHeight - rect.top + 6 }
        : { left, top: rect.bottom + 6 }
    );
  };

  useEffect(() => {
    if (!position) return;
    panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const dismiss = (event: Event) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setPosition(null);
    };
    const reposition = () => setPosition(null);

    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', reposition);
    };
  }, [position]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + step + items.length) % items.length]?.focus();
  };

  return (
    <>
      {trigger({ ref: triggerRef, onClick: toggle, 'aria-haspopup': 'menu', 'aria-expanded': !!position })}
      {position && (
        <div
          ref={panelRef}
          role="menu"
          onKeyDown={onKeyDown}
          style={{ ...position, width }}
          className="anim-pop fixed z-50 max-h-[70dvh] overflow-y-auto rounded-lg border border-line-strong bg-raised p-1 shadow-[var(--shadow)]"
        >
          {/* `close` reads the trigger ref only when an item is picked, never during render. */}
          {/* oxlint-disable-next-line react/refs */}
          {children(close)}
        </div>
      )}
    </>
  );
}

export function MenuItem({
  icon: Icon,
  selected,
  onSelect,
  children,
  className,
}: {
  icon?: LucideIcon;
  selected?: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-1.5 text-left text-[13px] text-fg-2 outline-none hover:bg-line hover:text-fg focus:bg-line focus:text-fg',
        className
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <Check className="size-4 shrink-0 text-fg" />}
    </button>
  );
}

export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-fg-3">{children}</div>
);
