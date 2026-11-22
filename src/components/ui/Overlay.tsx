import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';
import { useT } from '@/i18n/useT';

/** Native <dialog>: focus trapping, Esc and top-layer stacking come from the browser. */
function Dialog({
  onClose,
  className,
  label,
  children,
}: {
  onClose: () => void;
  className: string;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={className}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  width = 'max-w-lg',
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  width?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useT();
  return (
    <Dialog onClose={onClose} label={title} className="size-full backdrop:bg-transparent">
      <div className="flex min-h-full items-end justify-center bg-[var(--overlay)] sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <div className={cn('anim-pop flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-line-strong bg-surface shadow-[var(--shadow)] sm:rounded-xl', width)}>
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[13px] text-fg-2">{subtitle}</p>}
            </div>
            <IconButton icon={X} label={t('common.close')} onClick={onClose} className="-mt-1.5 -mr-1.5" />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
        </div>
      </div>
    </Dialog>
  );
}

export function Drawer({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog
      onClose={onClose}
      label={label}
      className="anim-slide my-0 mr-0 ml-auto h-dvh w-full max-w-[460px] border-l border-line-strong bg-surface shadow-[var(--shadow)]"
    >
      <div className="flex h-full flex-col">{children}</div>
    </Dialog>
  );
}
