import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CircleCheck, Loader2, OctagonAlert, Route as RouteIcon } from 'lucide-react';
import type { ConflictItem, CreateScenePayload, Scene } from '@/types';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from '@/components/ui/toastStore';
import { sceneService, type ApiConflictError } from '@/services/sceneService';
import { normalizeConflict } from '@/services/normalize';
import { useProductionStore } from '@/store/useProductionStore';
import { MIN_TRAVEL_MINUTES } from '@/lib/conflicts';
import { todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/useT';

const nextSceneNumber = (scenes: Scene[]) => {
  const numbers = scenes.map((scene) => parseInt(scene.sceneNumber, 10)).filter(Number.isFinite);
  return numbers.length ? String(Math.max(...numbers) + 1) : '1';
};

function ConflictList({ conflicts }: { conflicts: ConflictItem[] }) {
  const { t } = useT();
  return (
    <ul className="space-y-2">
      {conflicts.map((conflict, index) => {
        const blocking = conflict.type === 'ACTOR_OVERLAP';
        const Icon = blocking ? OctagonAlert : RouteIcon;
        return (
          <li key={index} className="flex gap-2.5 text-[13px]">
            <Icon className={cn('mt-0.5 size-4 shrink-0', blocking ? 'text-problem' : 'text-delayed')} />
            <span>
              <span className="font-medium">{conflict.actorName}</span>{' '}
              <span className="text-fg-2">
                {blocking
                  ? t('conflict.formOverlap', { scene: conflict.conflictingSceneTitle ?? '' })
                  : t('conflict.formTravel', {
                      scene: conflict.conflictingSceneTitle ?? '',
                      gap: conflict.availableMarginMinutes ?? 0,
                      min: MIN_TRAVEL_MINUTES,
                    })}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Mounted fresh for each open, so its state initialises straight from props. */
export function SceneFormModal({ scene, date, onClose }: { scene?: Scene; date?: string; onClose: () => void }) {
  const { t } = useT();
  const production = useProductionStore((state) => state.production);
  const scenes = useProductionStore((state) => state.scenes);
  const actors = useProductionStore((state) => state.actors);
  const refresh = useProductionStore((state) => state.refresh);

  const [sceneNumber, setSceneNumber] = useState(scene?.sceneNumber ?? nextSceneNumber(scenes));
  const [title, setTitle] = useState(scene?.title ?? '');
  const [location, setLocation] = useState(scene?.location ?? '');
  const [shootDate, setShootDate] = useState(scene?.shootDate || date || todayISO());
  const [startTime, setStartTime] = useState(scene?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(scene?.endTime ?? '12:00');
  const [cost, setCost] = useState(String(scene?.cost ?? ''));
  const [actorIds, setActorIds] = useState<number[]>(scene?.actorIds ?? []);
  const [notes, setNotes] = useState(scene?.notes ?? '');
  const [allowWarnings, setAllowWarnings] = useState(false);

  const [checkedConflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [checking, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const productionId = production?.id ?? 0;
  const locations = useMemo(() => [...new Set(scenes.map((item) => item.location))], [scenes]);
  const invalidTimes = endTime <= startTime;

  const payload: CreateScenePayload = {
    productionId,
    sceneNumber: sceneNumber.trim(),
    title: title.trim(),
    location: location.trim(),
    shootDate,
    startTime,
    endTime,
    cost: Number(cost) || 0,
    actorIds,
    allowWarnings,
    status: scene?.status,
    notes: notes.trim(),
  };

  // Live dry-run against the conflict engine, debounced while the user is still typing.
  // Without a date, valid times and cast there is nothing to check, so earlier results are hidden.
  const canValidate = !!shootDate && !invalidTimes && actorIds.length > 0;
  const validationKey = JSON.stringify([shootDate, startTime, endTime, location, actorIds]);
  useEffect(() => {
    if (!canValidate) return;
    let stale = false;
    const timer = window.setTimeout(async () => {
      setValidating(true);
      try {
        const result = await sceneService.validateConflicts(payload, scene?.id, scenes, actors);
        if (!stale) setConflicts(result.conflicts);
      } finally {
        if (!stale) setValidating(false);
      }
    }, 300);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
    // validationKey covers the fields the engine reads; the rest of payload must not retrigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canValidate, validationKey, scene?.id, scenes, actors]);

  const conflicts = canValidate ? checkedConflicts : [];
  const validating = canValidate && checking;
  const blocking = conflicts.some((conflict) => conflict.type === 'ACTOR_OVERLAP');
  const warning = conflicts.some((conflict) => conflict.type === 'WARNING_LOCATION_CONFLICT');
  const cannotSubmit = !payload.sceneNumber || !payload.title || !payload.location || invalidTimes || blocking || (warning && !allowWarnings);

  const toggleActor = (id: number) =>
    setActorIds((current) => (current.includes(id) ? current.filter((actorId) => actorId !== id) : [...current, id]));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (cannotSubmit) return;
    setFormError(null);
    setSubmitting(true);
    try {
      if (scene) await sceneService.updateScene(scene.id, payload);
      else await sceneService.createScene(payload);
      await refresh();
      toast(scene ? t('scene.updated') : t('scene.created'));
      onClose();
    } catch (error) {
      const { response } = error as ApiConflictError;
      if (response?.status === 409 && response.data?.conflicts) {
        setConflicts(response.data.conflicts.map(normalizeConflict).filter((conflict) => conflict.conflictingSceneId !== scene?.id));
        setFormError(t('conflict.blockedSave'));
      } else {
        setFormError(t('common.saveFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={scene ? t('scene.editTitle', { number: scene.sceneNumber }) : t('scene.newTitle')}
      subtitle={t('scene.formSubtitle')}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="scene-form" loading={submitting} disabled={cannotSubmit}>
            {scene ? t('common.saveChanges') : t('scene.create')}
          </Button>
        </>
      }
    >
      <form id="scene-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
          <Field label={t('scene.number')} htmlFor="sf-number">
            <Input id="sf-number" required value={sceneNumber} onChange={(e) => setSceneNumber(e.target.value)} className="tabular" />
          </Field>
          <Field label={t('scene.titleLabel')} htmlFor="sf-title">
            <Input id="sf-title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('scene.titlePlaceholder')} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label={t('scene.location')} htmlFor="sf-location">
            <Input id="sf-location" required list="sf-locations" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('scene.locationPlaceholder')} />
            <datalist id="sf-locations">
              {locations.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </Field>
          <Field label={t('scene.costUsd')} htmlFor="sf-cost">
            <Input id="sf-cost" type="number" min="0" step="50" value={cost} onChange={(e) => setCost(e.target.value)} className="tabular" placeholder="0" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_120px_120px]">
          <Field label={t('scene.date')} htmlFor="sf-date" className="col-span-2 sm:col-span-1">
            <Input id="sf-date" type="date" required value={shootDate} onChange={(e) => setShootDate(e.target.value)} className="tabular" />
          </Field>
          <Field label={t('scene.start')} htmlFor="sf-start">
            <Input id="sf-start" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="tabular" />
          </Field>
          <Field label={t('scene.end')} htmlFor="sf-end">
            <Input id="sf-end" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="tabular" aria-invalid={invalidTimes} />
          </Field>
        </div>
        {invalidTimes && <p className="-mt-3 text-[13px] text-problem">{t('scene.invalidTimes')}</p>}

        <fieldset>
          <legend className="mb-1.5 flex w-full justify-between text-[13px] font-medium text-fg-2">
            {t('scene.cast')}
            <span className="font-normal text-fg-3 tabular-nums">{t('scene.selectedCount', { count: actorIds.length })}</span>
          </legend>
          {actors.length === 0 ? (
            <p className="rounded-md border border-dashed border-line-strong px-3 py-4 text-center text-[13px] text-fg-3">{t('scene.noActorsAvailable')}</p>
          ) : (
            <div className="grid max-h-44 gap-1 overflow-y-auto rounded-md border border-line-strong bg-sunken p-1 sm:grid-cols-2">
              {actors.map((actor) => {
                const selected = actorIds.includes(actor.id);
                return (
                  <button
                    key={actor.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleActor(actor.id)}
                    className={cn('flex items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left transition-colors', selected ? 'bg-primary text-on-primary' : 'text-fg-2 hover:bg-raised')}
                  >
                    <Avatar person={actor} size={24} className={selected ? 'bg-on-primary/20 text-on-primary' : undefined} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{actor.name}</span>
                      {actor.characterName && <span className={cn('block truncate text-xs', selected ? 'opacity-70' : 'text-fg-3')}>{actor.characterName}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        <Field label={t('scene.requirements')} htmlFor="sf-notes">
          <Textarea id="sf-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('scene.notesPlaceholder')} />
        </Field>

        <section aria-live="polite" className="rounded-md border border-line bg-sunken px-3.5 py-3">
          {validating ? (
            <p className="flex items-center gap-2 text-[13px] text-fg-2">
              <Loader2 className="size-4 animate-spin" />
              {t('conflict.checking')}
            </p>
          ) : conflicts.length === 0 ? (
            <p className="flex items-center gap-2 text-[13px] text-fg-2">
              <CircleCheck className="size-4 text-ready" />
              {actorIds.length ? t('conflict.clear') : t('conflict.addCast')}
            </p>
          ) : (
            <>
              <ConflictList conflicts={conflicts} />
              {blocking && <p className="mt-2.5 border-t border-line pt-2.5 text-[13px] text-fg-2">{t('conflict.mustResolve')}</p>}
              {warning && !blocking && (
                <label className="mt-2.5 flex items-start gap-2.5 border-t border-line pt-2.5 text-[13px]">
                  <input type="checkbox" checked={allowWarnings} onChange={(e) => setAllowWarnings(e.target.checked)} className="mt-0.5 size-4 accent-[var(--fg)]" />
                  {t('conflict.acceptRisk')}
                </label>
              )}
            </>
          )}
        </section>

        {formError && <p role="alert" className="text-[13px] text-problem">{formError}</p>}
      </form>
    </Modal>
  );
}
