import { useMemo, useState } from 'react';
import type { Scene } from '@/types';
import { byCallTime, countByStatus, STATUS_META, STATUSES } from '@/lib/status';
import { formatDate, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

const STRIP_FILL = {
  COMPLETED: 'bg-done/55',
  READY: 'bg-ready',
  DELAYED: 'strip-hatched',
  PROBLEM: 'bg-problem',
};

/** The production's shooting schedule as one strip per scene, like a physical stripboard. */
export function Stripboard({ scenes, onSelect }: { scenes: Scene[]; onSelect: (id: number) => void }) {
  const { t, language } = useT();
  const [hovered, setHovered] = useState<number | null>(null);

  const ordered = useMemo(() => scenes.filter((scene) => scene.shootDate).sort(byCallTime), [scenes]);
  const counts = useMemo(() => countByStatus(ordered), [ordered]);

  if (!ordered.length) return null;

  const today = todayISO();
  const todayIndex = ordered.findIndex((scene) => scene.shootDate >= today);
  const active = hovered === null ? null : ordered[hovered];
  const tooltipLeft = hovered === null ? 0 : ((hovered + 0.5) / ordered.length) * 100;

  return (
    <div>
      <div className="relative pt-6">
        {todayIndex >= 0 && (
          <div className="pointer-events-none absolute top-0 bottom-0 z-10 border-l border-fg" style={{ left: `calc(${(todayIndex / ordered.length) * 100}% - 1px)` }}>
            <span className="absolute top-0 left-1 text-xs leading-4 font-medium">{t('scene.today')}</span>
          </div>
        )}

        <div className="flex h-16 gap-0.5" onMouseLeave={() => setHovered(null)}>
          {ordered.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelect(scene.id)}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              aria-label={`${t('scene.scene')} ${scene.sceneNumber}, ${scene.title}, ${t(`status.${scene.status}`)}`}
              className={cn('relative min-w-0 flex-1 rounded-t-[4px] transition-opacity', STRIP_FILL[scene.status], hovered !== null && hovered !== index && 'opacity-55')}
            >
              {scene.status === 'PROBLEM' && <span className="absolute inset-x-0 top-1.5 mx-auto h-0.5 w-1/2 rounded-full bg-surface" />}
            </button>
          ))}
        </div>

        {active && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full z-20 mb-[-16px] w-max max-w-64 rounded-md border border-line-strong bg-raised px-2.5 py-2 text-[13px] shadow-[var(--shadow)]"
            style={{
              left: `${tooltipLeft}%`,
              transform: tooltipLeft < 18 ? 'none' : tooltipLeft > 82 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            <p className="truncate font-medium">
              <span className="tabular mr-1.5 text-fg-2">{active.sceneNumber}</span>
              {active.title}
            </p>
            <p className="tabular mt-0.5 text-xs text-fg-2">
              {formatDate(active.shootDate, language)} · {active.startTime}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3">
        {STATUSES.map((status) => {
          const { icon: Icon, color } = STATUS_META[status];
          return (
            <span key={status} className="inline-flex items-center gap-1.5 text-[13px] text-fg-2">
              <Icon className={cn('size-3.5', color)} />
              {t(`status.${status}`)}
              <span className="tabular text-fg">{counts[status]}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
