import { useMemo, useState, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, Clapperboard, Columns3, List, Plus, Search, TriangleAlert } from 'lucide-react';
import type { Scene, ShootStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { AvatarStack } from '@/components/ui/Avatar';
import { EmptyState, PageHeader, Panel, Segmented } from '@/components/ui/Panel';
import { CallSheet } from '@/components/scenes/CallSheet';
import { DraggableScene } from '@/components/scenes/DraggableScene';
import { StatusBadge } from '@/components/scenes/StatusBadge';
import { useConflictPairs, usePermissions, useStatusChanger } from '@/components/scenes/useScenePermissions';
import { useProductionStore } from '@/store/useProductionStore';
import { byCallTime, countByStatus, STATUS_META, STATUSES } from '@/lib/status';
import { formatDate, money, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

type SortKey = 'number' | 'date' | 'cost';

const SORTERS: Record<SortKey, (a: Scene, b: Scene) => number> = {
  number: (a, b) => a.sceneNumber.localeCompare(b.sceneNumber, undefined, { numeric: true }),
  date: byCallTime,
  cost: (a, b) => a.cost - b.cost,
};

function SortHeader({ label, column, sort, onSort, className }: { label: string; column: SortKey; sort: { key: SortKey; asc: boolean }; onSort: (key: SortKey) => void; className?: string }) {
  const active = sort.key === column;
  const Arrow = sort.asc ? ArrowUp : ArrowDown;
  return (
    <th aria-sort={active ? (sort.asc ? 'ascending' : 'descending') : 'none'} className={cn('px-3 py-2 font-medium', className)}>
      <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1 hover:text-fg">
        {label}
        {active && <Arrow className="size-3" />}
      </button>
    </th>
  );
}

function SceneTable({ scenes, conflictIds }: { scenes: Scene[]; conflictIds: Set<number> }) {
  const { t, language } = useT();
  const openScene = useProductionStore((state) => state.openScene);
  const changeStatus = useStatusChanger();
  const { viewBudget } = usePermissions();
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'date', asc: true });

  const ordered = useMemo(() => {
    const sorted = [...scenes].sort(SORTERS[sort.key]);
    return sort.asc ? sorted : sorted.reverse();
  }, [scenes, sort]);

  const onSort = (key: SortKey) => setSort((current) => ({ key, asc: current.key === key ? !current.asc : true }));

  return (
    <>
    <div className="sm:hidden">
      <CallSheet scenes={ordered} withDate />
    </div>
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[720px] text-left">
        <thead className="border-b border-line text-[13px] text-fg-3">
          <tr>
            <SortHeader label="#" column="number" sort={sort} onSort={onSort} className="w-16 pl-4" />
            <th className="px-3 py-2 font-medium">{t('scene.scene')}</th>
            <SortHeader label={t('scene.date')} column="date" sort={sort} onSort={onSort} className="w-44" />
            <th className="w-24 px-3 py-2 font-medium">{t('scene.cast')}</th>
            {viewBudget && <SortHeader label={t('scene.cost')} column="cost" sort={sort} onSort={onSort} className="w-24 text-right" />}
            <th className="w-36 px-3 py-2 pr-4 font-medium">{t('scene.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {ordered.map((scene) => (
            <tr key={scene.id} className="transition-colors hover:bg-raised/60">
              <td className="tabular py-2.5 pr-3 pl-4 text-fg-2">{scene.sceneNumber}</td>
              <td className="max-w-0 px-3 py-2.5">
                <button type="button" onClick={() => openScene(scene.id)} className="block max-w-full text-left">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium hover:underline">{scene.title}</span>
                    {conflictIds.has(scene.id) && <TriangleAlert aria-label={t('conflict.hasConflict')} className="size-3.5 shrink-0 text-delayed" />}
                  </span>
                  <span className="block truncate text-[13px] text-fg-2">{scene.location}</span>
                </button>
              </td>
              <td className="px-3 py-2.5 text-[13px] tabular-nums">
                <span className="cap-first">{formatDate(scene.shootDate, language)}</span>
                <span className="tabular ml-2 text-fg-3">{scene.startTime}</span>
              </td>
              <td className="px-3 py-2.5">
                <AvatarStack people={scene.actors ?? []} size={24} />
              </td>
              {viewBudget && <td className="px-3 py-2.5 text-right text-[13px] tabular-nums">{money(scene.cost)}</td>}
              <td className="px-3 py-2.5 pr-4">
                <StatusBadge status={scene.status} onChange={changeStatus && ((status) => changeStatus(scene.id, status))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

function SceneBoard({ scenes, conflictIds }: { scenes: Scene[]; conflictIds: Set<number> }) {
  const { t, language } = useT();
  const openScene = useProductionStore((state) => state.openScene);
  const changeStatus = useStatusChanger();
  const [dropTarget, setDropTarget] = useState<ShootStatus | null>(null);

  const onDrop = (event: DragEvent, status: ShootStatus) => {
    event.preventDefault();
    setDropTarget(null);
    const id = Number(event.dataTransfer.getData('text/scene-id'));
    const scene = scenes.find((candidate) => candidate.id === id);
    if (scene && scene.status !== status) changeStatus?.(id, status);
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[880px] grid-cols-4 gap-3">
        {STATUSES.map((status) => {
          const { icon: Icon, color } = STATUS_META[status];
          const column = scenes.filter((scene) => scene.status === status).sort(byCallTime);
          return (
            <section
              key={status}
              aria-label={t(`status.${status}`)}
              onDragOver={
                changeStatus
                  ? (event) => {
                      event.preventDefault();
                      setDropTarget(status);
                    }
                  : undefined
              }
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null);
              }}
              onDrop={changeStatus ? (event) => onDrop(event, status) : undefined}
              className={cn('rounded-lg border border-line bg-sunken transition-colors', dropTarget === status && 'border-fg')}
            >
              <header className="flex items-center gap-2 px-3 py-2.5">
                <Icon className={cn('size-4', color)} />
                <h2 className="text-sm font-medium">{t(`status.${status}`)}</h2>
                <span className="tabular ml-auto text-[13px] text-fg-3">{column.length}</span>
              </header>
              <ul className="min-h-24 space-y-1.5 px-1.5 pb-1.5">
                {column.map((scene) => (
                  <li key={scene.id}>
                    <DraggableScene
                      sceneId={scene.id}
                      canDrag={!!changeStatus}
                      onOpen={() => openScene(scene.id)}
                      className="block w-full rounded-md border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="tabular text-[13px] text-fg-2">{scene.sceneNumber}</span>
                        {conflictIds.has(scene.id) && <TriangleAlert aria-label={t('conflict.hasConflict')} className="size-3.5 text-delayed" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block font-medium">{scene.title}</span>
                      <span className="mt-1 block truncate text-[13px] text-fg-2">{scene.location}</span>
                      <span className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs text-fg-3 tabular-nums cap-first">
                          {formatDate(scene.shootDate, language, 'd MMM')} · {scene.startTime}
                        </span>
                        <AvatarStack people={scene.actors ?? []} size={22} max={2} />
                      </span>
                    </DraggableScene>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function ScenesView() {
  const { t } = useT();
  const scenes = useProductionStore((state) => state.scenes);
  const actors = useProductionStore((state) => state.actors);
  const openSceneForm = useProductionStore((state) => state.openSceneForm);
  const { editScenes } = usePermissions();
  const pairs = useConflictPairs();

  const [mode, setMode] = useState<'table' | 'board'>('table');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ShootStatus | 'ALL'>('ALL');
  const [location, setLocation] = useState('');
  const [actorId, setActorId] = useState('');

  const locations = useMemo(() => [...new Set(scenes.map((scene) => scene.location))].sort(), [scenes]);
  const castInProduction = useMemo(() => actors.filter((actor) => scenes.some((scene) => scene.actorIds.includes(actor.id))), [actors, scenes]);
  const conflictIds = useMemo(() => new Set(pairs.flatMap((pair) => [pair.first.id, pair.second.id])), [pairs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return scenes.filter(
      (scene) =>
        (!needle || `${scene.sceneNumber} ${scene.title} ${scene.location}`.toLowerCase().includes(needle)) &&
        (!location || scene.location === location) &&
        (!actorId || scene.actorIds.includes(Number(actorId)))
    );
  }, [scenes, query, location, actorId]);

  const counts = countByStatus(filtered);
  const visible = mode === 'table' && status !== 'ALL' ? filtered.filter((scene) => scene.status === status) : filtered;
  const clearFilters = () => {
    setQuery('');
    setStatus('ALL');
    setLocation('');
    setActorId('');
  };

  return (
    <>
      <PageHeader
        title={t('view.scenes')}
        subtitle={t('scenes.subtitle', { count: scenes.length })}
        actions={
          editScenes && (
            <Button variant="primary" icon={Plus} onClick={() => openSceneForm({ date: todayISO() })}>
              {t('scene.new')}
            </Button>
          )
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-64">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-fg-3" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('scenes.filterPlaceholder')} aria-label={t('scenes.filterPlaceholder')} className="pl-8.5" />
        </div>
        <Select value={location} onChange={(event) => setLocation(event.target.value)} aria-label={t('scene.location')} className="w-auto max-w-48">
          <option value="">{t('scenes.allLocations')}</option>
          {locations.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select value={actorId} onChange={(event) => setActorId(event.target.value)} aria-label={t('scene.cast')} className="w-auto max-w-44">
          <option value="">{t('scenes.allCast')}</option>
          {castInProduction.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.name}
            </option>
          ))}
        </Select>
        <div className="ml-auto">
          <Segmented
            label={t('scenes.viewMode')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'table', label: t('scenes.table'), icon: List },
              { value: 'board', label: t('scenes.board'), icon: Columns3 },
            ]}
          />
        </div>
      </div>

      {mode === 'table' && (
        <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label={t('scene.status')}>
          {(['ALL', ...STATUSES] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={status === option}
              onClick={() => setStatus(option)}
              className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors', status === option ? 'bg-raised font-medium text-fg' : 'text-fg-2 hover:text-fg')}
            >
              {option === 'ALL' ? t('scenes.all') : t(`status.${option}`)}
              <span className="tabular text-xs text-fg-3">{option === 'ALL' ? filtered.length : counts[option]}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <Panel>
          {scenes.length === 0 ? (
            <EmptyState
              icon={Clapperboard}
              title={t('scenes.empty')}
              description={t('scenes.emptyBody')}
              action={
                editScenes && (
                  <Button variant="primary" icon={Plus} onClick={() => openSceneForm({ date: todayISO() })}>
                    {t('scene.new')}
                  </Button>
                )
              }
            />
          ) : (
            <EmptyState icon={Search} title={t('scenes.noMatches')} action={<Button onClick={clearFilters}>{t('scenes.clearFilters')}</Button>} />
          )}
        </Panel>
      ) : mode === 'table' ? (
        <Panel>
          <SceneTable scenes={visible} conflictIds={conflictIds} />
        </Panel>
      ) : (
        <SceneBoard scenes={visible} conflictIds={conflictIds} />
      )}
    </>
  );
}
