import { MapPin, TriangleAlert } from 'lucide-react';
import type { Scene } from '@/types';
import { AvatarStack } from '@/components/ui/Avatar';
import { useProductionStore } from '@/store/useProductionStore';
import { StatusBadge } from './StatusBadge';
import { useConflictPairs, useStatusChanger } from './useScenePermissions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

/** A day's scenes in call order. The title is the row's hit target, so the status menu stays usable. */
export function CallSheet({ scenes, compact, withDate }: { scenes: Scene[]; compact?: boolean; withDate?: boolean }) {
  const { t, language } = useT();
  const openScene = useProductionStore((state) => state.openScene);
  const changeStatus = useStatusChanger();
  const pairs = useConflictPairs();

  return (
    <ul className="divide-y divide-line">
      {scenes.map((scene) => {
        const hasConflict = pairs.some((pair) => pair.first.id === scene.id || pair.second.id === scene.id);
        return (
          <li key={scene.id} className="relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-raised/60">
            <div className="tabular w-12 shrink-0">
              <div className="font-medium">{scene.startTime}</div>
              <div className="text-xs whitespace-nowrap text-fg-3">{withDate ? formatDate(scene.shootDate, language, 'd MMM') : scene.endTime}</div>
            </div>

            <div className="min-w-0 flex-1">
              <button type="button" onClick={() => openScene(scene.id)} className="block w-full text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-fg">
                <span className="flex items-baseline gap-2">
                  <span className="tabular shrink-0 text-[13px] text-fg-2">{scene.sceneNumber}</span>
                  <span className="font-medium">
                    {scene.title}
                    {hasConflict && <TriangleAlert aria-label={t('conflict.hasConflict')} className="ml-1.5 inline size-3.5 -translate-y-px text-delayed" />}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[13px] text-fg-2">
                  <MapPin className="size-3.5 shrink-0 text-fg-3" />
                  <span className="truncate">{scene.location}</span>
                </span>
              </button>
            </div>

            {!compact && (
              <div className="hidden sm:block">
                <AvatarStack people={scene.actors ?? []} />
              </div>
            )}

            <div className={cn('relative z-10 flex shrink-0 justify-end', !compact && 'sm:w-28')}>
              <StatusBadge status={scene.status} onChange={changeStatus && ((status) => changeStatus(scene.id, status))} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
