import { ArrowRight, OctagonAlert, Route as RouteIcon } from 'lucide-react';
import type { Scene } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { type ConflictPair, MIN_TRAVEL_MINUTES } from '@/lib/conflicts';
import { useProductionStore } from '@/store/useProductionStore';
import { formatDate } from '@/lib/format';
import { useT } from '@/i18n/useT';

function SceneSlot({ scene }: { scene: Scene }) {
  const openScene = useProductionStore((state) => state.openScene);
  return (
    <button type="button" onClick={() => openScene(scene.id)} className="min-w-0 flex-1 rounded-md border border-line bg-sunken px-3 py-2.5 text-left transition-colors hover:border-line-strong">
      <span className="flex items-baseline gap-2">
        <span className="tabular shrink-0 text-[13px] text-fg-2">{scene.sceneNumber}</span>
        <span className="truncate font-medium">{scene.title}</span>
      </span>
      <span className="tabular mt-1 block text-[13px]">
        {scene.startTime} – {scene.endTime}
      </span>
      <span className="mt-0.5 block truncate text-[13px] text-fg-2">{scene.location}</span>
    </button>
  );
}

export function ConflictCard({ pair }: { pair: ConflictPair }) {
  const { t, language } = useT();
  const actors = useProductionStore((state) => state.actors);
  const blocking = pair.type === 'ACTOR_OVERLAP';
  const Icon = blocking ? OctagonAlert : RouteIcon;
  const actor = actors.find((candidate) => candidate.id === pair.actorId);

  return (
    <article className="px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Avatar person={actor ?? { name: pair.actorName }} size={28} />
        <h3 className="font-medium">{pair.actorName}</h3>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium">
          <Icon className={blocking ? 'size-4 text-problem' : 'size-4 text-delayed'} />
          {blocking ? t('conflict.blocking') : t('conflict.warning')}
        </span>
        <span className="ml-auto text-[13px] text-fg-3 tabular-nums">{formatDate(pair.first.shootDate, language)}</span>
      </div>

      <p className="mt-2 text-fg-2">
        {blocking
          ? t('conflict.overlapSentence', { a: pair.first.sceneNumber, b: pair.second.sceneNumber })
          : t('conflict.travelSentence', { a: pair.first.sceneNumber, b: pair.second.sceneNumber, gap: pair.gapMinutes ?? 0, min: MIN_TRAVEL_MINUTES })}
      </p>

      <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <SceneSlot scene={pair.first} />
        <div className="flex shrink-0 flex-col items-center px-1 text-fg-3 max-sm:hidden">
          <ArrowRight className="size-4" />
          {!blocking && <span className="tabular text-xs">{pair.gapMinutes} min</span>}
        </div>
        <SceneSlot scene={pair.second} />
      </div>
    </article>
  );
}
