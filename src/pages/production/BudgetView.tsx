import { useMemo, useState } from 'react';
import { CircleCheck, OctagonAlert, TriangleAlert, Wallet } from 'lucide-react';
import type { Scene } from '@/types';
import { BUDGET_WARNING_PCT } from '@/components/layout/useAttentionItems';
import { EmptyState, Meter, PageHeader, Panel, PanelHeader } from '@/components/ui/Panel';
import { useProductionStore } from '@/store/useProductionStore';
import { formatDate, money, moneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

const niceCeiling = (value: number) => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
};

function DailySpendChart({ scenes }: { scenes: Scene[] }) {
  const { t, language } = useT();
  const [hovered, setHovered] = useState<number | null>(null);

  const days = useMemo(() => {
    const totals = new Map<string, { cost: number; count: number }>();
    scenes
      .filter((scene) => scene.shootDate)
      .forEach((scene) => {
        const entry = totals.get(scene.shootDate) ?? { cost: 0, count: 0 };
        totals.set(scene.shootDate, { cost: entry.cost + scene.cost, count: entry.count + 1 });
      });
    return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, entry]) => ({ date, ...entry }));
  }, [scenes]);

  const ceiling = niceCeiling(Math.max(0, ...days.map((day) => day.cost)));
  const ticks = [ceiling, ceiling / 2, 0];
  const active = hovered === null ? null : days[hovered];
  const labelEvery = Math.max(1, Math.ceil(days.length / 8));

  return (
    <div className="px-4 py-4">
      <div className="flex gap-2">
        <div className="tabular flex h-44 w-11 shrink-0 flex-col justify-between text-right text-xs text-fg-3">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 last:translate-y-1/2">
              {moneyCompact(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44">
            {ticks.map((tick, index) => (
              <div key={tick} className="absolute inset-x-0 border-t border-line" style={{ top: `${index * 50}%` }} />
            ))}
          </div>

          <div className="relative flex h-44 items-end gap-0.5" onMouseLeave={() => setHovered(null)}>
            {days.map((day, index) => (
              <div key={day.date} onMouseEnter={() => setHovered(index)} className="flex h-full min-w-0 flex-1 items-end justify-center">
                <div className={cn('w-full max-w-6 rounded-t-[4px] bg-fg-2 transition-opacity', hovered !== null && hovered !== index && 'opacity-35')} style={{ height: `${(day.cost / ceiling) * 100}%` }} />
              </div>
            ))}
          </div>

          <div className="mt-1.5 flex gap-0.5">
            {days.map((day, index) => (
              <div key={day.date} className="tabular min-w-0 flex-1 text-center text-xs whitespace-nowrap text-fg-3">
                {index % labelEvery === 0 ? formatDate(day.date, language, 'd/M') : ''}
              </div>
            ))}
          </div>

          {active && hovered !== null && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-0 z-10 w-max rounded-md border border-line-strong bg-raised px-2.5 py-2 text-[13px] shadow-[var(--shadow)]"
              style={{ left: `${((hovered + 0.5) / days.length) * 100}%`, transform: hovered > days.length / 2 ? 'translateX(-100%)' : 'none' }}
            >
              <p className="font-medium cap-first">{formatDate(active.date, language, 'EEEE d MMM')}</p>
              <p className="text-fg-2 tabular-nums">
                {money(active.cost)} · {t('budget.sceneCount', { count: active.count })}
              </p>
            </div>
          )}
        </div>
      </div>

      <details className="mt-3 border-t border-line pt-2.5 text-[13px]">
        <summary className="cursor-pointer text-fg-2 hover:text-fg">{t('budget.showTable')}</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead className="text-left text-fg-3">
            <tr>
              <th className="py-1 font-normal">{t('scene.date')}</th>
              <th className="py-1 font-normal">{t('view.scenes')}</th>
              <th className="py-1 text-right font-normal">{t('scene.cost')}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-t border-line">
                <td className="py-1 cap-first">{formatDate(day.date, language)}</td>
                <td className="py-1">{day.count}</td>
                <td className="py-1 text-right">{money(day.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function BudgetView() {
  const { t } = useT();
  const production = useProductionStore((state) => state.production)!;
  const scenes = useProductionStore((state) => state.scenes);
  const openScene = useProductionStore((state) => state.openScene);

  const { totalBudget, spentBudget } = production;
  const percent = totalBudget ? (spentBudget / totalBudget) * 100 : 0;
  const remaining = totalBudget - spentBudget;
  const over = percent > 100;
  const warning = percent >= BUDGET_WARNING_PCT && !over;

  const byLocation = useMemo(() => {
    const totals = new Map<string, number>();
    scenes.forEach((scene) => totals.set(scene.location, (totals.get(scene.location) ?? 0) + scene.cost));
    return [...totals.entries()].map(([name, cost]) => ({ name, cost })).sort((a, b) => b.cost - a.cost);
  }, [scenes]);

  const costliest = useMemo(() => [...scenes].sort((a, b) => b.cost - a.cost).slice(0, 5), [scenes]);
  const maxLocation = byLocation[0]?.cost ?? 1;
  const HealthIcon = over ? OctagonAlert : warning ? TriangleAlert : CircleCheck;

  return (
    <>
      <PageHeader title={t('view.budget')} subtitle={t('budget.subtitle')} />

      <div className="space-y-5">
        <Panel className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="text-[13px] text-fg-2">{t('budget.committed')}</p>
              <p className="mt-1 text-[36px] leading-11 font-medium tracking-[-0.025em] tabular-nums">{money(spentBudget)}</p>
            </div>
            <dl className="flex gap-10 text-right">
              <div>
                <dt className="text-[13px] text-fg-2">{t('budget.total')}</dt>
                <dd className="mt-0.5 text-lg font-medium tabular-nums">{money(totalBudget)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-fg-2">{over ? t('budget.overBy') : t('budget.remaining')}</dt>
                <dd className="mt-0.5 text-lg font-medium tabular-nums">{money(Math.abs(remaining))}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-4">
            <Meter value={percent} tone={over ? 'critical' : warning ? 'warning' : 'neutral'} label={t('budget.committed')} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-fg-2">
            <HealthIcon className={cn('size-4', over ? 'text-problem' : warning ? 'text-delayed' : 'text-ready')} />
            <span className="tabular">{Math.round(percent)}%</span>
            {over ? t('budget.statusOver') : warning ? t('budget.statusWarning', { threshold: BUDGET_WARNING_PCT }) : t('budget.statusOk')}
          </p>
        </Panel>

        {scenes.length === 0 ? (
          <Panel>
            <EmptyState icon={Wallet} title={t('budget.empty')} description={t('budget.emptyBody')} />
          </Panel>
        ) : (
          <>
            <Panel>
              <PanelHeader title={t('budget.perDay')} />
              <DailySpendChart scenes={scenes} />
            </Panel>

            <div className="grid items-start gap-5 lg:grid-cols-2">
              <Panel>
                <PanelHeader title={t('budget.perLocation')} />
                <ul className="space-y-3 px-4 py-4">
                  {byLocation.map(({ name, cost }) => (
                    <li key={name}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="truncate text-fg-2">{name}</span>
                        <span className="shrink-0 tabular-nums">{money(cost)}</span>
                      </div>
                      <div className="h-1.5">
                        <div className="h-full rounded-r-[4px] bg-fg-2" style={{ width: `${(cost / maxLocation) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel>
                <PanelHeader title={t('budget.costliest')} />
                <ul className="divide-y divide-line">
                  {costliest.map((scene) => (
                    <li key={scene.id}>
                      <button type="button" onClick={() => openScene(scene.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-raised/60">
                        <span className="tabular w-8 shrink-0 text-[13px] text-fg-2">{scene.sceneNumber}</span>
                        <span className="min-w-0 flex-1 truncate">{scene.title}</span>
                        <span className="shrink-0 text-[13px] tabular-nums">{money(scene.cost)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </>
        )}
      </div>
    </>
  );
}
