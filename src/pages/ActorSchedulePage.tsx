import { useEffect, useMemo, useState } from 'react';
import { CalendarOff, MapPin } from 'lucide-react';
import type { Actor, Scene } from '@/types';
import { Field, Select } from '@/components/ui/Field';
import { EmptyState, PageHeader, Panel, PanelHeader, Skeleton } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/scenes/StatusBadge';
import { authService } from '@/services/authService';
import { sceneService } from '@/services/sceneService';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate, formatDuration, sceneDuration, todayISO } from '@/lib/format';
import { useT } from '@/i18n/useT';

export function ActorSchedulePage() {
  const { t, language } = useT();
  const user = useAuthStore((state) => state.user);
  const isDemoMode = useAuthStore((state) => state.isDemoMode);

  const [actors, setActors] = useState<Actor[]>([]);
  const [actorId, setActorId] = useState(isDemoMode ? 1 : (user?.id ?? 0));
  const [scenes, setScenes] = useState<Scene[] | null>(null);

  useEffect(() => {
    if (isDemoMode) authService.getActors().then(setActors);
  }, [isDemoMode]);

  useEffect(() => {
    let stale = false;
    sceneService
      .getScenesByActor(actorId)
      .then((data) => !stale && setScenes(data))
      .catch(() => !stale && setScenes([]));
    return () => {
      stale = true;
    };
  }, [actorId]);

  const today = todayISO();
  const upcoming = useMemo(() => (scenes ?? []).filter((scene) => scene.status !== 'COMPLETED' && scene.shootDate >= today), [scenes, today]);
  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('actor.title')}
        subtitle={t('actor.subtitle')}
        actions={
          isDemoMode && (
            <Field label={t('actor.viewAs')} htmlFor="actor-select">
              <Select id="actor-select" value={actorId} onChange={(event) => setActorId(Number(event.target.value))}>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </Select>
            </Field>
          )
        }
      />

      {scenes === null ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !next ? (
        <Panel>
          <EmptyState icon={CalendarOff} title={t('actor.none')} description={t('actor.noneBody')} />
        </Panel>
      ) : (
        <div className="space-y-5">
          <Panel className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-fg-2 cap-first">
                {t('actor.nextCall')} · {formatDate(next.shootDate, language, 'EEEE d MMMM')}
              </p>
              <StatusBadge status={next.status} />
            </div>
            <p className="tabular mt-3 text-[64px] leading-none font-medium tracking-[-0.04em]">{next.startTime}</p>
            <p className="mt-2 text-fg-2 tabular-nums">
              {t('actor.until', { time: next.endTime })} · {formatDuration(sceneDuration(next))}
            </p>
            <div className="mt-5 border-t border-line pt-4">
              <h2 className="text-lg font-semibold tracking-[-0.01em]">
                <span className="tabular mr-2 font-normal text-fg-2">{next.sceneNumber}</span>
                {next.title}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-fg-2">
                <MapPin className="size-4 shrink-0 text-fg-3" />
                {next.location}
              </p>
              {next.notes && <p className="mt-3 rounded-md bg-sunken px-3 py-2.5 text-[13px] text-fg-2">{next.notes}</p>}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={t('actor.upcoming')} meta={<span className="tabular">{upcoming.length}</span>} />
            <ul className="divide-y divide-line">
              {upcoming.map((scene) => (
                <li key={scene.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="tabular w-20 shrink-0 text-[13px]">
                    <div className="cap-first font-sans font-medium">{formatDate(scene.shootDate, language, 'EEE d')}</div>
                    <div className="text-fg-3">{scene.startTime}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="tabular mr-2 font-normal text-fg-2">{scene.sceneNumber}</span>
                      {scene.title}
                    </p>
                    <p className="truncate text-[13px] text-fg-2">{scene.location}</p>
                  </div>
                  <StatusBadge status={scene.status} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}
