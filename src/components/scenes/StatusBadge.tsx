import { ChevronDown } from 'lucide-react';
import type { ShootStatus } from '@/types';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { STATUS_META, STATUSES } from '@/lib/status';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

const BADGE = 'inline-flex h-7 items-center gap-1.5 rounded-md text-[13px] font-medium text-fg';

export function StatusBadge({
  status,
  onChange,
}: {
  status: ShootStatus;
  /** Omit for read-only roles. */
  onChange?: (status: ShootStatus) => void;
}) {
  const { t } = useT();
  const { icon: Icon, color } = STATUS_META[status];
  const content = (
    <>
      <Icon className={cn('size-4', color)} />
      {t(`status.${status}`)}
    </>
  );

  if (!onChange) return <span className={BADGE}>{content}</span>;

  return (
    <Menu
      width={176}
      trigger={(props) => (
        <button type="button" {...props} aria-label={t('status.change')} className={cn(BADGE, '-mx-2 px-2 transition-colors hover:bg-raised')}>
          {content}
          <ChevronDown className="size-3.5 text-fg-3" />
        </button>
      )}
    >
      {(close) =>
        STATUSES.map((option) => (
          <MenuItem
            key={option}
            icon={STATUS_META[option].icon}
            selected={option === status}
            onSelect={() => {
              close();
              if (option !== status) onChange(option);
            }}
          >
            {t(`status.${option}`)}
          </MenuItem>
        ))
      }
    </Menu>
  );
}
