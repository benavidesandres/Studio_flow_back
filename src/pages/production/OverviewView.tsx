import { useMemo } from 'react';
import { CalendarOff, CircleCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, Panel, PanelHeader } from '@/components/ui/Panel';
import { CallSheet } from '@/components/scenes/CallSheet';
import { Stripboard } from '@/components/scenes/Stripboard';
import { usePermissions } from '@/components/scenes/useScenePermissions';
import { AttentionList } from '@/components/layout/AttentionList';
import { useAttentionItems } from '@/components/layout/useAttentionItems';
import { useProductionStore } from '@/store/useProductionStore';
import { navigate, productionPath } from '@/lib/router';
import { byCallTime } from '@/lib/status';
import { formatDate, formatRange, money, todayISO } from '@/lib/format';
import { useT } from '@/i18n/useT';

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-[13px] text-fg-2">{label}</dt>
      <dd className="mt-1 text-[28px] leading-9 font-medium tracking-[-0.025em] tabular-nums">{value}</dd>
      <dd className="text-[13px] text-fg-3 tabular-nums">{detail}</dd>
    </div>
  );
}

export function OverviewView() {
  const { t, language } = useT();
  const production = useProductionStore((state) => state.production)!;
  const scenes = useProductionStore((state) => state.scenes);
  const openScene = useProductionStore((state) => state.openScene);
  const openSceneForm = useProductionStore((state) => state.openSceneForm);
  const { editScenes, viewBudget } = usePermissions();
  const attention = useAttentionItems();

  const today = todayISO();
  const todayScenes = useMemo(() => scenes.filter((scene) => scene.shootDate === today).sort(byCallTime), [scenes, today]);
  const nextDate = useMemo(() => scenes.map((scene) => scene.shootDate).filter((date) => date > today).sort()[0], [scenes, today]);

  const spentPct = production.totalBudget ? (production.spentBudget / production.totalBudget) * 100 : 0;
  const remaining = production.totalScenes - production.completedScenes;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[13px] text-fg-2">
            {production.status && t(`phase.${production.status}`)}
            {production.startDate && ` · ${formatRange(production.startDate, production.endDate, language)}`}
            {production.directorName && ` · ${t('productions.directedBy', { name: production.directorName })}`}
          </p>
          <h1 className="mt-1 text-[32px] leading-10 font-semibold tracking-[-0.025em]">{production.title}</h1>
        </div>
        {editScenes && (
          <Button variant="primary" icon={Plus} onClick={() => openSceneForm({ date: today })}>
            {t('scene.new')}
          </Button>
        )}
      </div>

      <Panel>
        <dl className={`grid grid-cols-2 divide-line max-lg:[&>*:nth-child(n+3)]:border-t ${viewBudget ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} [&>*]:border-line lg:divide-x`}>
          <Stat label={t('overview.scenes')} value={String(production.totalScenes)} detail={t('overview.scenesLeft', { count: remaining })} />
          <Stat label={t('overview.progress')} value={`${production.progressPercentage}%`} detail={t('overview.shotOf', { done: production.completedScenes, total: production.totalScenes })} />
          {viewBudget && <Stat label={t('overview.spent')} value={money(production.spentBudget)} detail={t('overview.ofBudget', { percent: Math.round(spentPct), total: money(production.totalBudget) })} />}
          <Stat label={t('overview.attention')} value={String(attention.length)} detail={attention.some((item) => item.critical) ? t('overview.criticalPending') : t('overview.noCritical')} />
        </dl>
      </Panel>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <PanelHeader
              title={t('scene.today')}
              meta={<span className="cap-first">{formatDate(today, language, 'EEEE d MMMM')}</span>}
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate(productionPath(production.id, 'calendar'))}>
                  {t('overview.openCalendar')}
                </Button>
              }
            />
            {todayScenes.length ? (
              <CallSheet scenes={todayScenes} />
            ) : (
              <EmptyState icon={CalendarOff} title={t('overview.noShootToday')} description={nextDate ? t('overview.nextShoot', { date: formatDate(nextDate, language, 'EEEE d MMMM') }) : t('overview.nothingScheduled')} />
            )}
          </Panel>

          {scenes.length > 0 && (
            <Panel>
              <PanelHeader title={t('overview.stripboard')} meta={t('overview.stripboardHint')} />
              <div className="px-4 pt-2 pb-3">
                <Stripboard scenes={scenes} onSelect={openScene} />
              </div>
            </Panel>
          )}
        </div>

        <Panel>
          <PanelHeader title={t('overview.attention')} meta={attention.length > 0 ? <span className="tabular">{attention.length}</span> : undefined} />
          {attention.length ? (
            <div className="max-h-[520px] overflow-y-auto p-1.5">
              <AttentionList items={attention} />
            </div>
          ) : (
            <EmptyState icon={CircleCheck} title={t('overview.allClear')} description={t('overview.allClearBody')} />
          )}
        </Panel>
      </div>
    </div>
  );
}
