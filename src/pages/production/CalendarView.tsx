import { useMemo, useState, type DragEvent } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarOff, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Scene } from '@/types';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState, PageHeader, Panel, PanelHeader } from '@/components/ui/Panel';
import { CallSheet } from '@/components/scenes/CallSheet';
import { DraggableScene } from '@/components/scenes/DraggableScene';
import { usePermissions } from '@/components/scenes/useScenePermissions';
import { useProductionStore } from '@/store/useProductionStore';
import { byCallTime, STATUS_META } from '@/lib/status';
import { dateLocale, formatDate, toISO, todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';
import { useRescheduleScene } from './useRescheduleScene';

const MAX_CHIPS = 3;

export function CalendarView() {
  const { t, language } = useT();
  const scenes = useProductionStore((state) => state.scenes);
  const openScene = useProductionStore((state) => state.openScene);
  const openSceneForm = useProductionStore((state) => state.openSceneForm);
  const { editScenes } = usePermissions();
  const reschedule = useRescheduleScene();

  const today = todayISO();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const locale = dateLocale(language);
  const weekOptions = { locale, weekStartsOn: 1 as const };

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), weekOptions), end: endOfWeek(endOfMonth(month), weekOptions) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [month, language]
  );

  const scenesByDay = useMemo(() => {
    const map = new Map<string, Scene[]>();
    [...scenes].sort(byCallTime).forEach((scene) => {
      if (!scene.shootDate) return;
      map.set(scene.shootDate, [...(map.get(scene.shootDate) ?? []), scene]);
    });
    return map;
  }, [scenes]);

  const selectedScenes = scenesByDay.get(selected) ?? [];

  const onDrop = (event: DragEvent, date: string) => {
    event.preventDefault();
    setDropTarget(null);
    const scene = scenes.find((candidate) => candidate.id === Number(event.dataTransfer.getData('text/scene-id')));
    if (scene) {
      setSelected(date);
      reschedule(scene, date);
    }
  };

  return (
    <>
      <PageHeader
        title={t('view.calendar')}
        subtitle={editScenes ? t('calendar.dragHint') : undefined}
        actions={
          editScenes && (
            <Button variant="primary" icon={Plus} onClick={() => openSceneForm({ date: selected })}>
              {t('scene.new')}
            </Button>
          )
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="min-w-0">
          <header className="flex items-center gap-1 border-b border-line px-3 py-2">
            <h2 className="ml-1 flex-1 text-sm font-semibold cap-first">{format(month, 'MMMM yyyy', { locale })}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMonth(startOfMonth(new Date()));
                setSelected(today);
              }}
            >
              {t('scene.today')}
            </Button>
            <IconButton icon={ChevronLeft} label={t('calendar.previous')} onClick={() => setMonth((current) => addMonths(current, -1))} />
            <IconButton icon={ChevronRight} label={t('calendar.next')} onClick={() => setMonth((current) => addMonths(current, 1))} />
          </header>

          <div className="grid grid-cols-7 border-b border-line">
            {days.slice(0, 7).map((day) => (
              <div key={day.toISOString()} className="px-2 py-1.5 text-xs font-medium text-fg-3 cap-first">
                {format(day, 'EEE', { locale })}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const iso = toISO(day);
              const dayScenes = scenesByDay.get(iso) ?? [];
              const inMonth = isSameMonth(day, month);
              const isSelected = iso === selected;
              const isToday = iso === today;

              return (
                <div
                  key={iso}
                  onDragOver={
                    editScenes
                      ? (event) => {
                          event.preventDefault();
                          setDropTarget(iso);
                        }
                      : undefined
                  }
                  onDragLeave={() => setDropTarget((current) => (current === iso ? null : current))}
                  onDrop={editScenes ? (event) => onDrop(event, iso) : undefined}
                  className={cn(
                    'relative min-h-16 border-b border-line sm:min-h-28',
                    (index + 1) % 7 !== 0 && 'border-r',
                    !inMonth && 'bg-sunken/60',
                    isSelected && 'bg-raised',
                    dropTarget === iso && 'outline-2 -outline-offset-2 outline-fg'
                  )}
                >
                  <button type="button" onClick={() => setSelected(iso)} aria-label={formatDate(iso, language, 'EEEE d MMMM')} aria-pressed={isSelected} className="absolute inset-0 focus-visible:-outline-offset-2" />
                  <div className="pointer-events-none relative p-1 sm:p-1.5">
                    <span className={cn('tabular inline-flex size-6 items-center justify-center rounded-full text-[13px]', isToday ? 'bg-primary font-medium text-on-primary' : inMonth ? 'text-fg' : 'text-fg-3')}>{day.getDate()}</span>

                    <div className="mt-1 hidden space-y-0.5 sm:block">
                      {dayScenes.slice(0, MAX_CHIPS).map((scene) => {
                        const { icon: Icon, color } = STATUS_META[scene.status];
                        return (
                          <DraggableScene
                            key={scene.id}
                            sceneId={scene.id}
                            canDrag={editScenes}
                            onOpen={() => openScene(scene.id)}
                            title={`${scene.sceneNumber} · ${scene.title}`}
                            className="pointer-events-auto flex w-full items-center gap-1 rounded-[4px] bg-line px-1 py-px text-left text-xs transition-colors hover:bg-line-strong"
                          >
                            <Icon className={cn('size-3 shrink-0', color)} />
                            <span className="tabular shrink-0 text-fg-2 max-xl:hidden">{scene.startTime}</span>
                            <span className="tabular truncate font-medium">{scene.sceneNumber}</span>
                          </DraggableScene>
                        );
                      })}
                      {dayScenes.length > MAX_CHIPS && <div className="px-1 text-xs text-fg-3">{t('calendar.more', { count: dayScenes.length - MAX_CHIPS })}</div>}
                    </div>

                    {dayScenes.length > 0 && (
                      <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
                        {dayScenes.slice(0, 4).map((scene) => (
                          <span key={scene.id} className={cn('size-1.5 rounded-full', STATUS_META[scene.status].dot)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="min-w-0">
          <PanelHeader
            title={t('calendar.callSheet')}
            meta={<span className="cap-first">{format(parseISO(selected), 'EEE d MMM', { locale })}</span>}
          />
          {selectedScenes.length ? <CallSheet scenes={selectedScenes} compact /> : <EmptyState icon={CalendarOff} title={t('calendar.emptyDay')} />}
        </Panel>
      </div>
    </>
  );
}
