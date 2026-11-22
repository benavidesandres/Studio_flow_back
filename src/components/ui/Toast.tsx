import { useEffect, useRef } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { useToasts } from './toastStore';

/**
 * Modals and the scene drawer are native <dialog>s in the browser's top layer, which covers any
 * ordinary element. The toaster is a popover, re-shown on every new toast so it lands above them.
 */
export function Toaster() {
  const toasts = useToasts((state) => state.toasts);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof element.showPopover !== 'function') return;
    if (element.matches(':popover-open')) element.hidePopover();
    if (toasts.length) element.showPopover();
  }, [toasts]);

  return (
    <div
      ref={ref}
      popover="manual"
      aria-live="polite"
      className="pointer-events-none fixed top-auto right-4 bottom-4 left-4 z-[60] m-0 flex h-auto w-auto flex-col items-end gap-2 overflow-visible border-0 bg-transparent p-0 text-fg [&:not(:popover-open)]:hidden"
    >
      {toasts.map((item) => {
        const Icon = item.tone === 'success' ? CircleCheck : CircleX;
        return (
          <div key={item.id} className="anim-rise flex max-w-sm items-start gap-2.5 rounded-lg border border-line-strong bg-raised px-3.5 py-2.5 text-[13px] shadow-[var(--shadow)]">
            <Icon className={item.tone === 'success' ? 'mt-px size-4 shrink-0 text-ready' : 'mt-px size-4 shrink-0 text-problem'} />
            <span>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
