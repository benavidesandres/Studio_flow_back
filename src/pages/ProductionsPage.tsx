import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Film, Plus } from 'lucide-react';
import type { Production } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState, Meter, PageHeader, Panel, Skeleton } from '@/components/ui/Panel';
import { NewProductionModal } from '@/components/productions/NewProductionModal';
import { BUDGET_WARNING_PCT } from '@/components/layout/useAttentionItems';
import { usePermissions } from '@/components/scenes/useScenePermissions';
import { productionService } from '@/services/productionService';
import { productionPath } from '@/lib/router';
import { formatRange, money } from '@/lib/format';
import { useT } from '@/i18n/useT';

export function ProductionsPage() {
  const { t, language } = useT();
  const { createProductions, viewBudget } = usePermissions();
  const [productions, setProductions] = useState<Production[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    () =>
      productionService.getProductions().then(
        (data) => {
          setProductions(data);
          setFailed(false);
        },
        () => setFailed(true)
      ),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const newButton = createProductions && (
    <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
      {t('productions.new')}
    </Button>
  );

  return (
    <>
      <PageHeader title={t('nav.productions')} subtitle={t('productions.subtitle')} actions={newButton} />

      {failed && productions === null ? (
        <Panel>
          <EmptyState icon={Film} title={t('productions.loadFailed')} action={<Button onClick={load}>{t('common.retry')}</Button>} />
        </Panel>
      ) : productions === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : productions.length === 0 ? (
        <Panel>
          <EmptyState icon={Film} title={t('productions.empty')} description={t('productions.emptyBody')} action={newButton} />
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {productions.map((production) => {
              const spent = production.totalBudget ? (production.spentBudget / production.totalBudget) * 100 : 0;
              const tone = spent > 100 ? 'critical' : spent >= BUDGET_WARNING_PCT ? 'warning' : 'neutral';
              return (
                <li key={production.id}>
                  <a href={productionPath(production.id)} className="group grid items-center gap-x-8 gap-y-3 px-5 py-4 transition-colors hover:bg-raised/60 md:grid-cols-[minmax(0,1fr)_170px_170px_20px]">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-semibold">{production.title}</h2>
                      <p className="mt-0.5 truncate text-[13px] text-fg-2">
                        {production.status && t(`phase.${production.status}`)}
                        {production.startDate && ` · ${formatRange(production.startDate, production.endDate, language)}`}
                      </p>
                    </div>

                    <div>
                      <div className="mb-1.5 flex justify-between text-[13px]">
                        <span className="text-fg-2">{t('overview.progress')}</span>
                        <span className="tabular">{production.progressPercentage}%</span>
                      </div>
                      <Meter value={production.progressPercentage} label={t('overview.progress')} />
                    </div>

                    {viewBudget ? (
                      <div>
                        <div className="mb-1.5 flex justify-between text-[13px]">
                          <span className="text-fg-2">{t('budget.short')}</span>
                          <span className="tabular">{money(production.spentBudget)}</span>
                        </div>
                        <Meter value={spent} tone={tone} label={t('budget.short')} />
                      </div>
                    ) : (
                      <div className="max-md:hidden" />
                    )}

                    <ChevronRight className="size-4 text-fg-3 transition-transform group-hover:translate-x-0.5 max-md:hidden" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {creating && <NewProductionModal onClose={() => setCreating(false)} onCreated={load} />}
    </>
  );
}
