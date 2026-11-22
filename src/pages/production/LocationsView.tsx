import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { EmptyState, PageHeader, Panel } from '@/components/ui/Panel';
import { usePermissions } from '@/components/scenes/useScenePermissions';
import { useProductionStore } from '@/store/useProductionStore';
import { byCallTime, STATUS_META } from '@/lib/status';
import { formatDate, money, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

export function LocationsView() {
  const { t, language } = useT();
  const scenes = useProductionStore((state) => state.scenes);
  const openScene = useProductionStore((state) => state.openScene);
  const { viewBudget } = usePermissions();

  const locations = useMemo(() => {
    const today = todayISO();
    const groups = new Map<string, typeof scenes>();
    [...scenes].sort(byCallTime).forEach((scene) => groups.set(scene.location, [...(groups.get(scene.location) ?? []), scene]));
    return [...groups.entries()]
      .map(([name, own]) => ({
        name,
        own,
        cost: own.reduce((sum, scene) => sum + scene.cost, 0),
        next: own.find((scene) => scene.status !== 'COMPLETED' && scene.shootDate >= today),
      }))
      .sort((a, b) => Number(!a.next) - Number(!b.next) || (a.next?.shootDate ?? '').localeCompare(b.next?.shootDate ?? ''));
  }, [scenes]);

  return (
    <>
      <PageHeader title={t('view.locations')} subtitle={t('locations.subtitle', { count: locations.length })} />
      {locations.length === 0 ? (
        <Panel>
          <EmptyState icon={MapPin} title={t('locations.empty')} description={t('locations.emptyBody')} />
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {locations.map(({ name, own, cost, next }) => (
            <Panel key={name} className="flex flex-col p-4">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-fg-3" />
                <h2 className="font-medium">{name}</h2>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <dt className="text-fg-3">{t('locations.next')}</dt>
                  <dd className="cap-first tabular-nums">{next ? `${formatDate(next.shootDate, language)} · ${next.startTime}` : t('locations.finished')}</dd>
                </div>
                {viewBudget && (
                  <div>
                    <dt className="text-fg-3">{t('scene.cost')}</dt>
                    <dd className="tabular-nums">{money(cost)}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-3">
                {own.map((scene) => (
                  <button key={scene.id} type="button" onClick={() => openScene(scene.id)} title={scene.title} className="tabular inline-flex h-6 items-center gap-1 rounded-[4px] bg-line px-1.5 text-xs transition-colors hover:bg-line-strong">
                    <span className={cn('size-1.5 rounded-full', STATUS_META[scene.status].dot)} />
                    {scene.sceneNumber}
                  </button>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
