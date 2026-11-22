import { ShieldCheck } from 'lucide-react';
import { EmptyState, PageHeader, Panel, PanelHeader } from '@/components/ui/Panel';
import { ConflictCard } from '@/components/scenes/ConflictCard';
import { useConflictPairs } from '@/components/scenes/useScenePermissions';
import { MIN_TRAVEL_MINUTES } from '@/lib/conflicts';
import { useT } from '@/i18n/useT';

export function ConflictsView() {
  const { t } = useT();
  const pairs = useConflictPairs();
  const blocking = pairs.filter((pair) => pair.type === 'ACTOR_OVERLAP');
  const warnings = pairs.filter((pair) => pair.type === 'WARNING_LOCATION_CONFLICT');

  return (
    <>
      <PageHeader title={t('view.conflicts')} subtitle={t('conflicts.subtitle', { min: MIN_TRAVEL_MINUTES })} />
      {pairs.length === 0 ? (
        <Panel>
          <EmptyState icon={ShieldCheck} title={t('conflicts.clean')} description={t('conflicts.cleanBody')} />
        </Panel>
      ) : (
        <div className="space-y-5">
          {blocking.length > 0 && (
            <Panel>
              <PanelHeader title={t('conflicts.blockingTitle')} meta={<span className="tabular">{blocking.length}</span>} />
              <div className="divide-y divide-line">
                {blocking.map((pair) => (
                  <ConflictCard key={pair.key} pair={pair} />
                ))}
              </div>
            </Panel>
          )}
          {warnings.length > 0 && (
            <Panel>
              <PanelHeader title={t('conflicts.warningTitle')} meta={<span className="tabular">{warnings.length}</span>} />
              <div className="divide-y divide-line">
                {warnings.map((pair) => (
                  <ConflictCard key={pair.key} pair={pair} />
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
