import { useEffect } from 'react';
import { ArrowLeft, Film } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, Panel, Skeleton } from '@/components/ui/Panel';
import { SceneDrawer } from '@/components/scenes/SceneDrawer';
import { SceneFormModal } from '@/components/scenes/SceneFormModal';
import { usePermissions } from '@/components/scenes/useScenePermissions';
import { useProductionStore } from '@/store/useProductionStore';
import { navigate, type ProductionView } from '@/lib/router';
import { useT } from '@/i18n/useT';
import { OverviewView } from './OverviewView';
import { CalendarView } from './CalendarView';
import { ScenesView } from './ScenesView';
import { CastView } from './CastView';
import { LocationsView } from './LocationsView';
import { BudgetView } from './BudgetView';
import { ConflictsView } from './ConflictsView';

const VIEWS = {
  overview: OverviewView,
  calendar: CalendarView,
  scenes: ScenesView,
  cast: CastView,
  locations: LocationsView,
  budget: BudgetView,
  conflicts: ConflictsView,
};

export function ProductionPage({ id, view }: { id: number; view: ProductionView }) {
  const { t } = useT();
  const load = useProductionStore((state) => state.load);
  const production = useProductionStore((state) => state.production);
  const loading = useProductionStore((state) => state.loading);
  const failed = useProductionStore((state) => state.failed);
  const sceneForm = useProductionStore((state) => state.sceneForm);
  const openSceneForm = useProductionStore((state) => state.openSceneForm);
  const { viewBudget, viewConflicts } = usePermissions();

  useEffect(() => {
    load(id);
  }, [id, load]);

  if (failed) {
    return (
      <Panel>
        <EmptyState
          icon={Film}
          title={t('productions.notFound')}
          action={
            <Button icon={ArrowLeft} onClick={() => navigate('#/productions')}>
              {t('productions.backToAll')}
            </Button>
          }
        />
      </Panel>
    );
  }

  if (loading || production?.id !== id) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const blocked = (view === 'budget' && !viewBudget) || (view === 'conflicts' && !viewConflicts);
  const View = VIEWS[blocked ? 'overview' : view];

  return (
    <>
      <View />
      <SceneDrawer />
      {sceneForm && <SceneFormModal scene={sceneForm.scene} date={sceneForm.date} onClose={() => openSceneForm(null)} />}
    </>
  );
}
