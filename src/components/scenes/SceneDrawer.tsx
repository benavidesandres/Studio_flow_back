import { useState, type ReactNode } from 'react';
import { CalendarDays, CircleDollarSign, Clock, FileText, MapPin, Pencil, Trash2, Users, X, type LucideIcon } from 'lucide-react';
import { Drawer, Modal } from '@/components/ui/Overlay';
import { Button, IconButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from '@/components/ui/toastStore';
import { useProductionStore } from '@/store/useProductionStore';
import { formatDate, formatDuration, money, sceneDuration } from '@/lib/format';
import { StatusBadge } from './StatusBadge';
import { ConflictCard } from './ConflictCard';
import { useConflictPairs, usePermissions, useStatusChanger } from './useScenePermissions';
import { useT } from '@/i18n/useT';

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-fg-3" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-fg-3">{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export function SceneDrawer() {
  const { t, language } = useT();
  const scenes = useProductionStore((state) => state.scenes);
  const activeSceneId = useProductionStore((state) => state.activeSceneId);
  const openScene = useProductionStore((state) => state.openScene);
  const openSceneForm = useProductionStore((state) => state.openSceneForm);
  const deleteScene = useProductionStore((state) => state.deleteScene);
  const permissions = usePermissions();
  const changeStatus = useStatusChanger();
  const allPairs = useConflictPairs();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const scene = scenes.find((candidate) => candidate.id === activeSceneId);
  if (!scene) return null;

  const pairs = allPairs.filter((pair) => pair.first.id === scene.id || pair.second.id === scene.id);
  const close = () => openScene(null);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteScene(scene.id);
      toast(t('scene.deleted'));
    } catch {
      toast(t('scene.deleteFailed'), 'error');
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Drawer key={scene.id} label={`${t('scene.scene')} ${scene.sceneNumber}`} onClose={close}>
      <header className="border-b border-line px-5 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <span className="tabular text-[13px] text-fg-2">
            {t('scene.scene')} {scene.sceneNumber}
          </span>
          <IconButton icon={X} label={t('common.close')} onClick={close} className="-mr-2" />
        </div>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.015em]">{scene.title}</h2>
        <div className="mt-2 ml-2">
          <StatusBadge status={scene.status} onChange={changeStatus && ((status) => changeStatus(scene.id, status))} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-line px-5 py-1.5">
          <Row icon={CalendarDays} label={t('scene.date')}>
            <span className="cap-first">{formatDate(scene.shootDate, language, 'EEEE d MMMM')}</span>
          </Row>
          <Row icon={Clock} label={t('scene.schedule')}>
            <span className="tabular">
              {scene.startTime} – {scene.endTime}
            </span>
            <span className="ml-2 text-fg-3">{formatDuration(sceneDuration(scene))}</span>
          </Row>
          <Row icon={MapPin} label={t('scene.location')}>
            {scene.location}
          </Row>
          {permissions.viewBudget && (
            <Row icon={CircleDollarSign} label={t('scene.cost')}>
              <span className="tabular">{money(scene.cost)}</span>
            </Row>
          )}
          <Row icon={Users} label={t('scene.cast')}>
            {scene.actors?.length ? (
              <ul className="mt-1 space-y-2">
                {scene.actors.map((actor) => (
                  <li key={actor.id} className="flex items-center gap-2.5">
                    <Avatar person={actor} size={26} />
                    <span className="min-w-0 truncate">{actor.name}</span>
                    {actor.characterName && <span className="truncate text-[13px] text-fg-3">{actor.characterName}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-fg-3">{t('scene.noCast')}</span>
            )}
          </Row>
          {scene.notes && (
            <Row icon={FileText} label={t('scene.requirements')}>
              <p className="whitespace-pre-line">{scene.notes}</p>
            </Row>
          )}
        </div>

        {permissions.viewConflicts && pairs.length > 0 && (
          <section className="border-t border-line">
            <h3 className="px-5 pt-4 text-sm font-semibold">
              {t('scene.problems')} <span className="tabular ml-1 font-normal text-fg-3">{pairs.length}</span>
            </h3>
            <div className="divide-y divide-line [&>article]:px-5">
              {pairs.map((pair) => (
                <ConflictCard key={pair.key} pair={pair} />
              ))}
            </div>
          </section>
        )}
      </div>

      {permissions.editScenes && (
        <footer className="flex items-center gap-2 border-t border-line px-5 py-3.5">
          <Button variant="primary" icon={Pencil} onClick={() => openSceneForm({ scene })}>
            {t('common.edit')}
          </Button>
          {permissions.deleteScenes && (
            <Button variant="ghost" icon={Trash2} className="ml-auto hover:text-problem" onClick={() => setConfirmingDelete(true)}>
              {t('common.delete')}
            </Button>
          )}
        </footer>
      )}

      {confirmingDelete && (
        <Modal
          title={t('scene.deleteTitle', { number: scene.sceneNumber })}
          onClose={() => setConfirmingDelete(false)}
          width="max-w-sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" loading={deleting} onClick={confirmDelete}>
                {t('common.delete')}
              </Button>
            </>
          }
        >
          <p className="text-fg-2">{t('scene.deleteBody')}</p>
        </Modal>
      )}
    </Drawer>
  );
}
