import { useMemo } from 'react';
import { TriangleAlert, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, PageHeader, Panel } from '@/components/ui/Panel';
import { useConflictPairs } from '@/components/scenes/useScenePermissions';
import { useProductionStore } from '@/store/useProductionStore';
import { byCallTime, STATUS_META } from '@/lib/status';
import { formatDate, formatDuration, sceneDuration, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

export function CastView() {
  const { t, language } = useT();
  const scenes = useProductionStore((state) => state.scenes);
  const actors = useProductionStore((state) => state.actors);
  const openScene = useProductionStore((state) => state.openScene);
  const pairs = useConflictPairs();

  const cast = useMemo(() => {
    const today = todayISO();
    return actors
      .map((actor) => {
        const own = scenes.filter((scene) => scene.actorIds.includes(actor.id)).sort(byCallTime);
        return {
          actor,
          own,
          nextCall: own.find((scene) => scene.status !== 'COMPLETED' && scene.shootDate >= today),
          minutes: own.reduce((sum, scene) => sum + sceneDuration(scene), 0),
          conflicts: pairs.filter((pair) => pair.actorId === actor.id).length,
        };
      })
      .filter((entry) => entry.own.length > 0)
      .sort((a, b) => b.own.length - a.own.length);
  }, [actors, scenes, pairs]);

  return (
    <>
      <PageHeader title={t('view.cast')} subtitle={t('cast.subtitle', { count: cast.length })} />
      <Panel>
        {cast.length === 0 ? (
          <EmptyState icon={Users} title={t('cast.empty')} description={t('cast.emptyBody')} />
        ) : (
          <ul className="divide-y divide-line">
            {cast.map(({ actor, own, nextCall, minutes, conflicts }) => (
              <li key={actor.id} className="grid gap-x-6 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,240px)_170px_minmax(0,1fr)] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar person={actor} size={36} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{actor.name}</span>
                      {conflicts > 0 && <TriangleAlert aria-label={t('conflict.hasConflict')} className="size-3.5 shrink-0 text-delayed" />}
                    </p>
                    <p className="truncate text-[13px] text-fg-2">{actor.characterName}</p>
                  </div>
                </div>

                <div className="text-[13px]">
                  <p className="text-fg-3">{t('cast.nextCall')}</p>
                  <p className="cap-first tabular-nums">{nextCall ? `${formatDate(nextCall.shootDate, language)} · ${nextCall.startTime}` : '—'}</p>
                </div>

                <div className="min-w-0">
                  <p className="mb-1.5 text-[13px] text-fg-3 tabular-nums">{t('cast.load', { scenes: own.length, time: formatDuration(minutes) })}</p>
                  <div className="flex flex-wrap gap-1">
                    {own.map((scene) => (
                      <button key={scene.id} type="button" onClick={() => openScene(scene.id)} title={scene.title} className="tabular inline-flex h-6 items-center gap-1 rounded-[4px] bg-line px-1.5 text-xs transition-colors hover:bg-line-strong">
                        <span className={cn('size-1.5 rounded-full', STATUS_META[scene.status].dot)} />
                        {scene.sceneNumber}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
